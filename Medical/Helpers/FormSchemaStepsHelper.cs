using System;
using System.Collections.Generic;
using System.Linq;
using Medical.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Medical.Helpers
{
    public static class FormSchemaStepsHelper
    {
        private const string StepsPropertyName = "steps";

        public static List<FormStep> ReadSteps(string? formSchemaJson)
        {
            // Fail-safe: return empty on null/invalid JSON
            if (string.IsNullOrWhiteSpace(formSchemaJson))
                return new List<FormStep>();

            try
            {
                var token = JToken.Parse(formSchemaJson);
                var stepsToken = token.Type == JTokenType.Object ? token[StepsPropertyName] : null;
                if (stepsToken == null || stepsToken.Type != JTokenType.Array)
                    return new List<FormStep>();

                var steps = stepsToken.ToObject<List<FormStep>>() ?? new List<FormStep>();

                // Normalize
                foreach (var s in steps)
                {
                    if (s.Id == Guid.Empty) s.Id = Guid.NewGuid();
                    if (s.Order <= 0) s.Order = 1;
                    if (string.IsNullOrWhiteSpace(s.Name)) s.Name = $"Step {s.Order}";
                }

                return steps.OrderBy(s => s.Order).ToList();
            }
            catch
            {
                return new List<FormStep>();
            }
        }

        public static string WriteSteps(string? formSchemaJson, IEnumerable<FormStep> steps)
        {
            JObject root;
            try
            {
                root = !string.IsNullOrWhiteSpace(formSchemaJson)
                    ? (JToken.Parse(formSchemaJson) as JObject ?? new JObject())
                    : new JObject();
            }
            catch
            {
                root = new JObject();
            }

            var normalized = (steps ?? Enumerable.Empty<FormStep>())
                .Select(s =>
                {
                    if (s.Id == Guid.Empty) s.Id = Guid.NewGuid();
                    if (s.Order <= 0) s.Order = 1;
                    if (string.IsNullOrWhiteSpace(s.Name)) s.Name = $"Step {s.Order}";
                    return s;
                })
                .OrderBy(s => s.Order)
                .ToList();

            root[StepsPropertyName] = JArray.FromObject(normalized);
            return root.ToString(Formatting.None);
        }

        public static (string UpdatedJson, List<FormStep> Steps) EnsureSeededDefaultSteps(string? formSchemaJson)
        {
            var steps = ReadSteps(formSchemaJson);
            
            // If no steps exist, create all 3 defaults
            if (steps.Count == 0)
            {
                steps = new List<FormStep>
                {
                    new FormStep { Id = Guid.NewGuid(), Name = "Client Hx", Order = 1, IsActive = true },
                    new FormStep { Id = Guid.NewGuid(), Name = "Substances", Order = 2, IsActive = true },
                    new FormStep { Id = Guid.NewGuid(), Name = "Sex & Health", Order = 3, IsActive = true },
                };

                var updated = WriteSteps(formSchemaJson, steps);
                return (updated, steps);
            }
            
            // Check if any default steps are missing and add them
            bool missingSteps = false;
            var maxOrder = steps.Max(s => s.Order);
            
            // Ensure steps 1, 2, and 3 exist
            if (!steps.Any(s => s.Order == 1))
            {
                steps.Add(new FormStep { Id = Guid.NewGuid(), Name = "Client Hx", Order = 1, IsActive = true });
                missingSteps = true;
            }
            
            if (!steps.Any(s => s.Order == 2))
            {
                steps.Add(new FormStep { Id = Guid.NewGuid(), Name = "Substances", Order = 2, IsActive = true });
                missingSteps = true;
            }
            
            if (!steps.Any(s => s.Order == 3))
            {
                steps.Add(new FormStep { Id = Guid.NewGuid(), Name = "Sex & Health", Order = 3, IsActive = true });
                missingSteps = true;
            }
            
            // If any steps were added, re-write the JSON
            if (missingSteps)
            {
                // Re-normalize order
                steps = steps.OrderBy(s => s.Order).ToList();
                for (var i = 0; i < steps.Count; i++)
                    steps[i].Order = i + 1;
                    
                var updated = WriteSteps(formSchemaJson, steps);
                return (updated, steps);
            }
            
            return (formSchemaJson ?? string.Empty, steps);
        }

        /// <summary>
        /// Read ALL steps including disabled ones (for admin view)
        /// </summary>
        public static List<FormStep> ReadAllSteps(string? formSchemaJson)
        {
            // Same as ReadSteps but doesn't filter by IsActive
            return ReadSteps(formSchemaJson);
        }

        /// <summary>
        /// Toggle step active status by ID
        /// </summary>
        public static (string UpdatedJson, bool Success, string Message) ToggleStepActive(string? formSchemaJson, Guid stepId, bool newActiveState)
        {
            var steps = ReadSteps(formSchemaJson);
            var step = steps.FirstOrDefault(s => s.Id == stepId);
            
            if (step == null)
                return (formSchemaJson ?? string.Empty, false, "Step not found");

            // Safety: Prevent disabling the last active step
            if (!newActiveState)
            {
                var activeCount = steps.Count(s => s.IsActive);
                if (activeCount <= 1)
                    return (formSchemaJson ?? string.Empty, false, "Cannot disable the last active step. At least one step must remain active.");
            }

            step.IsActive = newActiveState;
            var updated = WriteSteps(formSchemaJson, steps);
            
            var message = newActiveState 
                ? $"Step '{step.Name}' has been enabled and will now appear in public forms."
                : $"Step '{step.Name}' has been disabled and will be hidden from public forms.";
            
            return (updated, true, message);
        }

        /// <summary>
        /// Get disabled steps for recovery
        /// </summary>
        public static List<FormStep> GetDisabledSteps(string? formSchemaJson)
        {
            var steps = ReadSteps(formSchemaJson);
            return steps.Where(s => !s.IsActive).OrderBy(s => s.Order).ToList();
        }

        /// <summary>
        /// Restore a disabled step
        /// </summary>
        public static (string UpdatedJson, bool Success, string Message) RestoreDisabledStep(string? formSchemaJson, Guid stepId)
        {
            return ToggleStepActive(formSchemaJson, stepId, true);
        }

        // =====================================================================
        // GROUPS SUPPORT (Additive JSON only)
        // =====================================================================
        // Groups are persisted within FormSchemaJson under: steps[].groups[].
        // This helper intentionally uses JObject/JArray so we don't need to
        // modify `ViewPublicForm` or the `FormStep` model.

        public static string UpsertStepGroups(string? formSchemaJson, int stepOrder, JArray groups)
        {
            if (stepOrder <= 0) return formSchemaJson ?? string.Empty;

            JObject root;
            try
            {
                root = !string.IsNullOrWhiteSpace(formSchemaJson)
                    ? (JToken.Parse(formSchemaJson) as JObject ?? new JObject())
                    : new JObject();
            }
            catch
            {
                root = new JObject();
            }

            if (root[StepsPropertyName] is not JArray stepsArray)
                stepsArray = new JArray();

            // Find by Order first (stable for this app)
            var stepObj = stepsArray
                .OfType<JObject>()
                .FirstOrDefault(s => (int?)s["Order"] == stepOrder);

            if (stepObj == null)
            {
                // Fail-safe: do not create phantom steps here.
                // If the step schema doesn't exist yet, just return unchanged.
                return root.ToString(Formatting.None);
            }

            stepObj["groups"] = groups ?? new JArray();
            root[StepsPropertyName] = stepsArray;
            return root.ToString(Formatting.None);
        }

        public static (string UpdatedJson, bool Changed) EnsureDefaultGroupsSeeded(string? formSchemaJson)
        {
            JObject root;
            try
            {
                root = !string.IsNullOrWhiteSpace(formSchemaJson)
                    ? (JToken.Parse(formSchemaJson) as JObject ?? new JObject())
                    : new JObject();
            }
            catch
            {
                root = new JObject();
            }

            if (root[StepsPropertyName] is not JArray stepsArray)
                return (root.ToString(Formatting.None), false);

            var changed = false;

            foreach (var stepTok in stepsArray.OfType<JObject>())
            {
                var hasGroups = stepTok["groups"] is JArray gArr && gArr.Count > 0;
                if (hasGroups) continue;

                var stepId = stepTok["Id"]?.ToString();
                var order = (int?)stepTok["Order"] ?? 1;

                // Default group per step (backward compatibility)
                var defaultGroup = new JObject
                {
                    ["id"] = !string.IsNullOrWhiteSpace(stepId) ? $"default_{stepId}" : $"default_{order}",
                    ["title"] = string.Empty,
                    ["order"] = 1,
                    ["isActive"] = true
                };

                stepTok["groups"] = new JArray(defaultGroup);
                changed = true;
            }

            if (!changed) return (root.ToString(Formatting.None), false);

            root[StepsPropertyName] = stepsArray;
            return (root.ToString(Formatting.None), true);
        }
    }
}