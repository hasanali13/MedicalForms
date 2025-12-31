using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace Medical.Models
{
    public class StepGroup
    {
        [JsonProperty("groupId")]
        public string GroupId { get; set; } = string.Empty;

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;

        [JsonProperty("fieldIds")]
        public List<string> FieldIds { get; set; } = new List<string>();
    }
}
