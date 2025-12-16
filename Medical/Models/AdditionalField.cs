using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Medical.Models
{
    public class AdditionalField
    {
        public Guid FieldId { get; set; } = Guid.NewGuid();

        [Required]
        public string FieldName { get; set; } = string.Empty;

        [Required]
        public string DisplayName { get; set; } = string.Empty;

        public string FieldType { get; set; } = "text";

        public int Step { get; set; } = 1;

        public string? Placeholder { get; set; }

        public bool IsRequired { get; set; } = false;

        public bool IsConditional { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public string CreatedBy { get; set; } = "System";

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public int DisplayOrder { get; set; } = 0;

        public string? OptionsJson { get; set; }

        public string? ConditionalLogicJson { get; set; }

        [NotMapped]
        public List<string> Options
        {
            get
            {
                if (string.IsNullOrEmpty(OptionsJson))
                    return new List<string>();

                try
                {
                    return System.Text.Json.JsonSerializer.Deserialize<List<string>>(OptionsJson)
                        ?? new List<string>();
                }
                catch
                {
                    return new List<string>();
                }
            }
            set => OptionsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public string InputType => FieldType.ToLower() switch
        {
            "number" => "number",
            "date" => "date",
            "email" => "email",
            "tel" => "tel",
            "textarea" => "textarea",
            "select" => "select",
            "checkbox" => "checkbox",
            "radio" => "radio",
            "file" => "file",
            _ => "text"
        };

        [NotMapped]
        public ConditionalLogic? ConditionalLogic
        {
            get
            {
                if (string.IsNullOrEmpty(ConditionalLogicJson))
                    return null;

                try
                {
                    return System.Text.Json.JsonSerializer.Deserialize<ConditionalLogic>(ConditionalLogicJson);
                }
                catch
                {
                    return null;
                }
            }
            set => ConditionalLogicJson = value == null ? null : System.Text.Json.JsonSerializer.Serialize(value);
        }

        // New structured options support
        [NotMapped]
        public List<DropdownOption> OptionsDetailed
        {
            get
            {
                if (string.IsNullOrEmpty(OptionsJson))
                    return new List<DropdownOption>();

                try
                {
                    return System.Text.Json.JsonSerializer.Deserialize<List<DropdownOption>>(OptionsJson)
                        ?? new List<DropdownOption>();
                }
                catch
                {
                    // Try deserializing as list of strings for backward compatibility
                    try
                    {
                        var simple = System.Text.Json.JsonSerializer.Deserialize<List<string>>(OptionsJson);
                        var list = new List<DropdownOption>();
                        if (simple != null)
                        {
                            foreach (var s in simple)
                            {
                                list.Add(new DropdownOption { Label = s, Value = s, IsDefault = false });
                            }
                        }
                        return list;
                    }
                    catch
                    {
                        return new List<DropdownOption>();
                    }
                }
            }
            set => OptionsJson = System.Text.Json.JsonSerializer.Serialize(value ?? new List<DropdownOption>());
        }
    }

    public class ConditionalLogic
    {
        public string DependsOnFieldKey { get; set; } = string.Empty;
        public string ShowWhenValue { get; set; } = string.Empty;
    }

    public class DropdownOption
    {
        public string Label { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public bool IsDefault { get; set; } = false;
    }
}