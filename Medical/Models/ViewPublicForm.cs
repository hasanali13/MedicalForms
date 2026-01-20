using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Medical.Models
{
    public class ViewPublicForm
    {
        [Key]
        public Guid ViewPublicFormId { get; set; }

        // Configuration flag: true = form schema config, false/null = actual submission
        public bool IsConfig { get; set; } = false;

        // Dynamic form data (for submissions) - stored as JSON
        [Column(TypeName = "nvarchar(max)")]
        public string? FormDataJson { get; set; }

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
        public Dictionary<string, string> FormData
        {
            get
            {
                if (string.IsNullOrEmpty(FormDataJson))
                    return new Dictionary<string, string>();

                try
                {
                    return JsonConvert.DeserializeObject<Dictionary<string, string>>(FormDataJson)
                        ?? new Dictionary<string, string>();
                }
                catch
                {
                    return new Dictionary<string, string>();
                }
            }
            set => FormDataJson = JsonConvert.SerializeObject(value);
        }

        [NotMapped]
        public Dictionary<string, string> FieldLabels
        {
            get
            {
                if (string.IsNullOrEmpty(FieldLabelsJson))
                    return new Dictionary<string, string>();

                try
                {
                    return JsonConvert.DeserializeObject<Dictionary<string, string>>(FieldLabelsJson)
                        ?? new Dictionary<string, string>();
                }
                catch
                {
                    return new Dictionary<string, string>();
                }
            }
            set => FieldLabelsJson = JsonConvert.SerializeObject(value);
        }

        [NotMapped]
        public List<AdditionalField> AdditionalFields
        {
            get
            {
                if (string.IsNullOrEmpty(AdditionalFieldsJson))
                    return new List<AdditionalField>();

                try
                {
                    var token = JToken.Parse(AdditionalFieldsJson);
                    if (token.Type == JTokenType.Array)
                        return token.ToObject<List<AdditionalField>>() ?? new List<AdditionalField>();

                    if (token.Type == JTokenType.Object)
                    {
                        var single = token.ToObject<AdditionalField>();
                        return single is null ? new List<AdditionalField>() : new List<AdditionalField> { single };
                    }

                    return new List<AdditionalField>();
                }
                catch
                {
                    return new List<AdditionalField>();
                }
            }

            set => AdditionalFieldsJson = JsonConvert.SerializeObject(value);
        }
    }
}