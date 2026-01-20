using Medical.Data;
using Medical.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Medical.Helpers
{
    public static class FormLabelHelper
    {
        // Cache for field labels (lasts for 5 minutes)
        private static Dictionary<string, string>? _cachedLabels;
        private static DateTime? _lastCacheUpdate;
        private static readonly object _lock = new object();

        /// <summary>
        /// Get the current field labels for the application
        /// </summary>
        public static Dictionary<string, string> GetCurrentFieldLabels(MedicalContext context)
        {
            lock (_lock)
            {
                // Check if cache is stale (older than 5 minutes)
                if (_cachedLabels == null || !_lastCacheUpdate.HasValue ||
                    (DateTime.UtcNow - _lastCacheUpdate.Value).TotalMinutes > 5)
                {
                    RefreshCache(context);
                }

                // Return cached labels or empty dictionary if null
                return _cachedLabels ?? new Dictionary<string, string>();
            }
        }

        /// <summary>
        /// Get a specific field label
        /// </summary>
        public static string GetFieldLabel(string fieldName, MedicalContext context)
        {
            var labels = GetCurrentFieldLabels(context);
            return labels.ContainsKey(fieldName) ? labels[fieldName] : fieldName;
        }

        /// <summary>
        /// Update field labels and clear cache
        /// </summary>
        public static void UpdateFieldLabels(MedicalContext context,
            Dictionary<string, string> newLabels, string changedBy = "System")
        {
            lock (_lock)
            {
                // Find or create configuration form
                var configForm = context.ViewPublicForm
                    .Where(f => f.IsConfig) // Configuration forms have IsConfig = true
                    .OrderByDescending(f => f.CreatedAt)
                    .FirstOrDefault();

                if (configForm == null)
                {
                    configForm = new ViewPublicForm
                    {
                        ViewPublicFormId = Guid.NewGuid(),
                        CreatedAt = DateTime.UtcNow,
                        FieldLabelsJson = JsonConvert.SerializeObject(newLabels),
                        FormVersion = 1,
                        IsConfig = true
                    };
                    context.ViewPublicForm.Add(configForm);
                }
                else
                {
                    configForm.FieldLabelsJson = JsonConvert.SerializeObject(newLabels);
                    configForm.FormVersion++;
                    configForm.CreatedAt = DateTime.UtcNow;
                    context.ViewPublicForm.Update(configForm);
                }

                // Create history record
                

                // Save changes
                context.SaveChanges();

                // Clear cache
                _cachedLabels = null;
                _lastCacheUpdate = null;
            }
        }

        /// <summary>
        /// Refresh the cache from database
        /// </summary>
        private static void RefreshCache(MedicalContext context)
        {
            // Try to get configuration form (forms with IsConfig = true are config forms)
            var configForm = context.ViewPublicForm
                .Where(f => f.IsConfig)
                .OrderByDescending(f => f.CreatedAt)
                .FirstOrDefault();

            if (configForm != null && !string.IsNullOrEmpty(configForm.FieldLabelsJson))
            {
                try
                {
                    _cachedLabels = JsonConvert.DeserializeObject<Dictionary<string, string>>(
                        configForm.FieldLabelsJson);
                }
                catch
                {
                    _cachedLabels = new Dictionary<string, string>();
                }
            }
            else
            {
                _cachedLabels = new Dictionary<string, string>();
            }

            _lastCacheUpdate = DateTime.UtcNow;
        }

        /// <summary>
        /// Get label history
        /// </summary>
       
        /// <summary>
        /// Revert to a specific version
      
    }
}