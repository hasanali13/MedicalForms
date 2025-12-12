
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

namespace Medical.Models
{
    public class DynamicField
    {
        [Key]
        public Guid FieldId { get; set; }

        public Guid FormId { get; set; }

        [Required]
        public string FieldLabel { get; set; } = string.Empty;

        [Required]
        public string FieldType { get; set; } = "Text Input";

        public int Step { get; set; } = 1;

        public string? Placeholder { get; set; }

        public bool IsRequired { get; set; }

        public bool IsConditional { get; set; }

        public string? ConditionalLogic { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int DisplayOrder { get; set; }
    }
}