using Medical.Data;
using Medical.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Medical.Helpers
{
    public static class AdditionalFieldHelper
    {
        private static List<AdditionalField>? _cachedAdditionalFields;
        private static DateTime? _lastCacheUpdate;
        private static readonly object _lock = new object();

        public static List<AdditionalField> GetAdditionalFields(MedicalContext context)
        {
            lock (_lock)
            {
                if (_cachedAdditionalFields == null || !_lastCacheUpdate.HasValue ||
                    (DateTime.UtcNow - _lastCacheUpdate.Value).TotalMinutes > 10)
                {
                    RefreshCache(context);
                }

                return _cachedAdditionalFields?
                    .Where(f => f.IsActive && !f.IsDeleted)
                    .OrderBy(f => f.Step)
                    .ThenBy(f => f.DisplayOrder)
                    .ToList() ?? new List<AdditionalField>();
            }
        }

        public static List<AdditionalField> GetAdditionalFieldsForStep(MedicalContext context, int step)
        {
            var allFields = GetAdditionalFields(context);
            return allFields.Where(f => f.Step == step).ToList();
        }

        public static void AddAdditionalField(MedicalContext context, AdditionalField field, string createdBy = "System")
        {
            lock (_lock)
            {
                var configForm = GetOrCreateConfigForm(context);

                var existingFields = string.IsNullOrEmpty(configForm.AdditionalFieldsJson)
                    ? new List<AdditionalField>()
                    : JsonConvert.DeserializeObject<List<AdditionalField>>(configForm.AdditionalFieldsJson)
                        ?? new List<AdditionalField>();

                // Ensure Step is int (fix string to int conversion)
                if (field.Step == 0) field.Step = 1;

                field.FieldId = Guid.NewGuid();
                field.CreatedAt = DateTime.UtcNow;
                field.CreatedBy = createdBy;
                field.IsActive = true;
                field.IsDeleted = false;
                field.FieldName = GenerateFieldName(field.DisplayName);
                field.DisplayOrder = existingFields.Count + 1;

                existingFields.Add(field);

                configForm.AdditionalFieldsJson = JsonConvert.SerializeObject(existingFields);
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                context.SaveChanges();

                _cachedAdditionalFields = null;
                _lastCacheUpdate = null;
            }
        }

        public static void DeleteAdditionalField(MedicalContext context, Guid fieldId)
        {
            lock (_lock)
            {
                var configForm = GetOrCreateConfigForm(context);

                if (string.IsNullOrEmpty(configForm.AdditionalFieldsJson))
                    return;

                var existingFields = JsonConvert.DeserializeObject<List<AdditionalField>>(configForm.AdditionalFieldsJson)
                    ?? new List<AdditionalField>();

                var field = existingFields.FirstOrDefault(f => f.FieldId == fieldId);
                if (field != null)
                {
                    field.IsDeleted = true;
                    field.UpdatedAt = DateTime.UtcNow;

                    configForm.AdditionalFieldsJson = JsonConvert.SerializeObject(existingFields);
                    configForm.FormVersion++;
                    context.SaveChanges();

                    _cachedAdditionalFields = null;
                    _lastCacheUpdate = null;
                }
            }
        }

        private static ViewPublicForm GetOrCreateConfigForm(MedicalContext context)
        {
            var configForm = context.ViewPublicForm
                .Where(f => f.FullName == null)
                .OrderByDescending(f => f.CreatedAt)
                .FirstOrDefault();

            if (configForm == null)
            {
                configForm = new ViewPublicForm
                {
                    ViewPublicFormId = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    FormVersion = 1
                };
                context.ViewPublicForm.Add(configForm);
            }

            return configForm;
        }

        private static string GenerateFieldName(string displayName)
        {
            var fieldName = displayName
                .Replace(" ", "_")
                .Replace("?", "")
                .Replace("(", "")
                .Replace(")", "")
                .Replace("-", "_");

            return "Additional_" + fieldName;
        }

        private static void RefreshCache(MedicalContext context)
        {
            var configForm = context.ViewPublicForm
                .Where(f => f.FullName == null)
                .OrderByDescending(f => f.CreatedAt)
                .FirstOrDefault();

            if (configForm != null && !string.IsNullOrEmpty(configForm.AdditionalFieldsJson))
            {
                try
                {
                    _cachedAdditionalFields = JsonConvert.DeserializeObject<List<AdditionalField>>(
                        configForm.AdditionalFieldsJson);
                }
                catch
                {
                    _cachedAdditionalFields = new List<AdditionalField>();
                }
            }
            else
            {
                _cachedAdditionalFields = new List<AdditionalField>();
            }

            _lastCacheUpdate = DateTime.UtcNow;
        }
    }
}