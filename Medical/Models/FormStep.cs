using System;

namespace Medical.Models
{
    public class FormStep
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public int Order { get; set; } = 1;
        public bool IsActive { get; set; } = true;
        public bool IsConfig { get; set; } = false;
        public string FormData { get; set; } = string.Empty;

        [Newtonsoft.Json.JsonProperty("groups")]
        public System.Collections.Generic.List<StepGroup> Groups { get; set; } = new System.Collections.Generic.List<StepGroup>();
    }
}
