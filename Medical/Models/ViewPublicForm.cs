using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

namespace Medical.Models
{
    public class ViewPublicForm
    {
        [Key]
        public Guid ViewPublicFormId { get; set; }

        // Original form fields (all nullable)
        public string? FullName { get; set; }
        public int? Age { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public bool? HasAllergies { get; set; }
        public string? AllergyDescription { get; set; }
        public string? CurrentMedication { get; set; }
        public decimal? HeightCm { get; set; }
        public decimal? WeightKg { get; set; }
        public string? ContactName { get; set; }
        public string? Relationship { get; set; }
        public string? PhoneNumber { get; set; }
        public bool? HasAlternativeContact { get; set; }
        public string? AltContactName { get; set; }
        public string? AltPhoneNumber { get; set; }

        // Form configuration storage
        [Column(TypeName = "nvarchar(max)")]
        public string? FormSchemaJson { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? FieldLabelsJson { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? AdditionalFieldsJson { get; set; }

        public bool? IsDeleted { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int FormVersion { get; set; } = 1;

        [NotMapped]
        public Dictionary<string, string> FieldLabels
        {
            get
            {
                if (string.IsNullOrEmpty(FieldLabelsJson))
                    return new Dictionary<string, string>(DefaultLabels);

                try
                {
                    return JsonConvert.DeserializeObject<Dictionary<string, string>>(FieldLabelsJson)
                        ?? new Dictionary<string, string>(DefaultLabels);
                }
                catch
                {
                    return new Dictionary<string, string>(DefaultLabels);
                }
            }
            set => FieldLabelsJson = JsonConvert.SerializeObject(value);
        }

        [NotMapped]
        public List<AdditionalField> AdditionalFields
        {
            get => string.IsNullOrEmpty(AdditionalFieldsJson)
                ? new List<AdditionalField>()
                : JsonConvert.DeserializeObject<List<AdditionalField>>(AdditionalFieldsJson)
                  ?? new List<AdditionalField>();
            set => AdditionalFieldsJson = JsonConvert.SerializeObject(value);
        }

        [NotMapped]
        public static Dictionary<string, string> DefaultLabels => new()
        {
            { "FullName", "Full Name" },
            { "Age", "Age" },
            { "Gender", "Gender" },
            { "DateOfBirth", "Date of Birth" },
            { "HasAllergies", "Do you have allergies?" },
            { "AllergyDescription", "Allergy Description" },
            { "CurrentMedication", "Current Medication" },
            { "HeightCm", "Height (cm)" },
            { "WeightKg", "Weight (kg)" },
            { "ContactName", "Contact Name" },
            { "Relationship", "Relationship" },
            { "PhoneNumber", "Phone Number" },
            { "HasAlternativeContact", "Alternative Contact?" },
            { "AltContactName", "Alt Contact Name" },
            { "AltPhoneNumber", "Alt Phone Number" }
        };
    }
}