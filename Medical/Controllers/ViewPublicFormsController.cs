using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Medical.Data;
using Medical.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Medical.Controllers
{
    public class ViewPublicFormsController : Controller
    {
        private readonly MedicalContext _context;

        public ViewPublicFormsController(MedicalContext context)
        {
            _context = context;
        }

        // GET: Create Multi-step Form (Form Builder)
        public IActionResult Create()
        {
            ViewBag.ActiveMenu = "FormBuilder";

            // Get additional fields from configuration (hide soft-deleted)
            var configForm = GetOrCreateConfigForm();
            var allFields = configForm.AdditionalFields
                .Where(f => f.IsActive && !f.IsDeleted)
                .OrderBy(f => f.Step)
                .ThenBy(f => f.DisplayOrder)
                .ToList();

            // Separate steps from regular fields
            var steps = allFields.Where(f => f.FieldType == "step").ToList();
            var regularFields = allFields.Where(f => f.FieldType != "step").ToList();

            ViewBag.AdditionalFields = regularFields;
            ViewBag.CustomSteps = steps; // Pass steps to view

            var model = new ViewPublicForm();
            // Load labels from config
            model.FieldLabels = configForm.FieldLabels;

            return View(model);
        }

        // GET: FillForm - User-facing form (not the builder)
        public IActionResult FillForm()
        {
            ViewBag.ActiveMenu = "PublicForm";

            // Get additional fields from configuration (hide soft-deleted)
            var configForm = GetOrCreateConfigForm();
            var allFields = configForm.AdditionalFields
                .Where(f => f.IsActive && !f.IsDeleted)
                .OrderBy(f => f.Step)
                .ThenBy(f => f.DisplayOrder)
                .ToList();

            // Separate steps from regular fields
            var steps = allFields.Where(f => f.FieldType == "step").ToList();
            var regularFields = allFields.Where(f => f.FieldType != "step").ToList();

            ViewBag.AdditionalFields = regularFields;
            ViewBag.CustomSteps = steps; // Pass steps to view

            var model = new ViewPublicForm();
            // Load labels from config
            model.FieldLabels = configForm.FieldLabels;

            return View(model);
        }

        // POST: Create Multi-step Form - FIXED
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(ViewPublicForm model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    model.ViewPublicFormId = Guid.NewGuid();
                    model.CreatedAt = DateTime.UtcNow;
                    model.IsDeleted = false;

                    // Get additional fields configuration
                    var configForm = GetOrCreateConfigForm();
                    var additionalFields = configForm.AdditionalFields ?? new List<AdditionalField>();

                    // Collect additional field values from form submission
                    var additionalFieldsData = new Dictionary<string, AdditionalFieldValue>();

                    // Only process non-step fields
                    foreach (var field in additionalFields.Where(f => f.FieldType != "step"))
                    {
                        var fieldName = field.FieldName;
                        var formKey = $"AdditionalFields[{fieldName}]";

                        if (Request.Form.ContainsKey(formKey))
                        {
                            var value = Request.Form[formKey].ToString();
                            additionalFieldsData[fieldName] = new AdditionalFieldValue
                            {
                                FieldId = field.FieldId,
                                FieldName = fieldName,
                                DisplayName = field.DisplayName,
                                FieldType = field.FieldType,
                                Value = value,
                                Step = field.Step
                            };
                        }
                    }

                    // Store additional fields data as JSON
                    if (additionalFieldsData.Any())
                    {
                        model.AdditionalFieldsJson = JsonConvert.SerializeObject(additionalFieldsData);
                    }

                    _context.ViewPublicForm.Add(model);
                    await _context.SaveChangesAsync();

                    TempData["SuccessMessage"] = "Form submitted successfully!";
                    return RedirectToAction(nameof(Success));
                }
            }
            catch (Exception ex)
            {
                ModelState.AddModelError("", $"Error submitting form: {ex.Message}");
            }

            ViewBag.ActiveMenu = "FormBuilder";
            var reloadConfigForm = GetOrCreateConfigForm();
            var allFields = reloadConfigForm.AdditionalFields?
                .Where(f => !f.IsDeleted && f.IsActive)
                .OrderBy(f => f.Step)
                .ThenBy(f => f.DisplayOrder)
                .ToList() ?? new List<AdditionalField>();
            
            ViewBag.AdditionalFields = allFields.Where(f => f.FieldType != "step").ToList();
            ViewBag.CustomSteps = allFields.Where(f => f.FieldType == "step").ToList();

            return View(model);
        }

        // POST: FillForm - Handle form submission from user
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> FillForm(ViewPublicForm model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    model.ViewPublicFormId = Guid.NewGuid();
                    model.CreatedAt = DateTime.UtcNow;
                    model.IsDeleted = false;

                    // Get additional fields configuration
                    var configForm = GetOrCreateConfigForm();
                    var additionalFields = configForm.AdditionalFields ?? new List<AdditionalField>();

                    // Collect additional field values from form submission
                    var additionalFieldsData = new Dictionary<string, AdditionalFieldValue>();

                    // Only process non-step fields
                    foreach (var field in additionalFields.Where(f => f.FieldType != "step"))
                    {
                        var fieldName = field.FieldName;
                        var formKey = fieldName; // Use field ID or field name as key

                        if (Request.Form.ContainsKey(formKey))
                        {
                            var value = Request.Form[formKey].ToString();
                            additionalFieldsData[fieldName] = new AdditionalFieldValue
                            {
                                FieldId = field.FieldId,
                                FieldName = fieldName,
                                DisplayName = field.DisplayName,
                                FieldType = field.FieldType,
                                Value = value,
                                Step = field.Step
                            };
                        }
                    }

                    // Store additional fields data as JSON
                    if (additionalFieldsData.Any())
                    {
                        model.AdditionalFieldsJson = JsonConvert.SerializeObject(additionalFieldsData);
                    }

                    _context.ViewPublicForm.Add(model);
                    await _context.SaveChangesAsync();

                    TempData["SuccessMessage"] = "Form submitted successfully!";
                    return RedirectToAction(nameof(Success));
                }
            }
            catch (Exception ex)
            {
                ModelState.AddModelError("", $"Error submitting form: {ex.Message}");
            }

            // If validation fails, return the form
            var reloadConfigForm = GetOrCreateConfigForm();
            var allFields = reloadConfigForm.AdditionalFields?
                .Where(f => !f.IsDeleted && f.IsActive)
                .OrderBy(f => f.Step)
                .ThenBy(f => f.DisplayOrder)
                .ToList() ?? new List<AdditionalField>();
            
            ViewBag.AdditionalFields = allFields.Where(f => f.FieldType != "step").ToList();
            ViewBag.CustomSteps = allFields.Where(f => f.FieldType == "step").ToList();

            return View(model);
        }

        // Success page
        public IActionResult Success()
        {
            ViewBag.ActiveMenu = "FormBuilder";
            return View();
        }

        // AJAX: Add additional field
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddAdditionalField([FromBody] AdditionalFieldRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.DisplayName))
                {
                    return Json(new { success = false, message = "Field label is required" });
                }

                var configForm = GetOrCreateConfigForm();
                var existingFields = configForm.AdditionalFields ?? new List<AdditionalField>();

                // Check if field with same name already exists (allow re-activate soft-deleted)
                var fieldName = GenerateFieldName(request.DisplayName.Trim());
                var existingField = existingFields.FirstOrDefault(f => f.FieldName == fieldName);
                if (existingField != null)
                {
                    if (existingField.IsDeleted)
                    {
                        // Reactivate and update properties
                        existingField.DisplayName = request.DisplayName.Trim();
                        existingField.FieldType = request.FieldType;
                        existingField.Step = request.Step;
                        existingField.Placeholder = string.IsNullOrWhiteSpace(request.Placeholder) ? null : request.Placeholder.Trim();
                        existingField.IsRequired = request.IsRequired;
                        existingField.IsConditional = request.IsConditional;
                        existingField.IsDeleted = false;
                        existingField.IsActive = true;
                        existingField.UpdatedAt = DateTime.UtcNow;
                        existingField.OptionsJson = request.OptionsJson; // persist options if provided

                        configForm.AdditionalFields = existingFields;
                        configForm.FormVersion++;
                        configForm.CreatedAt = DateTime.UtcNow;

                        _context.ViewPublicForm.Update(configForm);
                        await _context.SaveChangesAsync();

                        return Json(new
                        {
                            success = true,
                            message = $"Field '{existingField.DisplayName}' restored successfully!",
                            field = new
                            {
                                fieldId = existingField.FieldId,
                                displayName = existingField.DisplayName,
                                fieldName = existingField.FieldName,
                                fieldType = existingField.FieldType,
                                step = existingField.Step,
                                placeholder = existingField.Placeholder,
                                isRequired = existingField.IsRequired,
                                isConditional = existingField.IsConditional,
                                inputType = existingField.InputType
                            }
                        });
                    }

                    return Json(new { success = false, message = "A field with this name already exists" });
                }

                // Create new field
                var newField = new AdditionalField
                {
                    FieldId = Guid.NewGuid(),
                    DisplayName = request.DisplayName.Trim(),
                    FieldName = fieldName,
                    FieldType = request.FieldType,
                    Step = request.Step,
                    Placeholder = string.IsNullOrWhiteSpace(request.Placeholder) ? null : request.Placeholder.Trim(),
                    IsRequired = request.IsRequired,
                    IsConditional = request.IsConditional,
                    ConditionalLogicJson = request.ConditionalLogicJson,
                    OptionsJson = request.OptionsJson,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = User.Identity?.Name ?? "System",
                    IsActive = true,
                    IsDeleted = false,
                    DisplayOrder = existingFields.Count + 1
                };

                existingFields.Add(newField);
                configForm.AdditionalFields = existingFields;
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                _context.ViewPublicForm.Update(configForm);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = $"Field '{newField.DisplayName}' added successfully!",
                    field = new
                    {
                        fieldId = newField.FieldId,
                        displayName = newField.DisplayName,
                        fieldName = newField.FieldName,
                        fieldType = newField.FieldType,
                        step = newField.Step,
                        placeholder = newField.Placeholder,
                        isRequired = newField.IsRequired,
                        isConditional = newField.IsConditional,
                        inputType = newField.InputType
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // AJAX: Update additional field
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateAdditionalField([FromBody] UpdateFieldRequest request)
        {
            try
            {
                var configForm = GetOrCreateConfigForm();
                var existingFields = configForm.AdditionalFields ?? new List<AdditionalField>();

                var fieldToUpdate = existingFields.FirstOrDefault(f => f.FieldId == request.FieldId);
                if (fieldToUpdate == null)
                {
                    return Json(new { success = false, message = "Field not found" });
                }

                // Update field properties
                fieldToUpdate.DisplayName = request.DisplayName.Trim();
                fieldToUpdate.FieldType = request.FieldType;
                fieldToUpdate.Step = request.Step;
                fieldToUpdate.Placeholder = string.IsNullOrWhiteSpace(request.Placeholder) ? null : request.Placeholder.Trim();
                fieldToUpdate.IsRequired = request.IsRequired;
                fieldToUpdate.IsConditional = request.IsConditional;
                fieldToUpdate.ConditionalLogicJson = request.ConditionalLogicJson;
                fieldToUpdate.OptionsJson = request.OptionsJson; // persist options
                fieldToUpdate.UpdatedAt = DateTime.UtcNow;

                configForm.AdditionalFields = existingFields;
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                _context.ViewPublicForm.Update(configForm);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = "Field updated successfully!",
                    field = new
                    {
                        fieldId = fieldToUpdate.FieldId,
                        displayName = fieldToUpdate.DisplayName,
                        fieldName = fieldToUpdate.FieldName,
                        fieldType = fieldToUpdate.FieldType,
                        step = fieldToUpdate.Step,
                        placeholder = fieldToUpdate.Placeholder,
                        isRequired = fieldToUpdate.IsRequired,
                        isConditional = fieldToUpdate.IsConditional,
                        inputType = fieldToUpdate.InputType
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // AJAX: Delete additional field
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteAdditionalField([FromBody] DeleteFieldRequest request)
        {
            try
            {
                var configForm = GetOrCreateConfigForm();
                var existingFields = configForm.AdditionalFields ?? new List<AdditionalField>();

                var fieldToDelete = existingFields.FirstOrDefault(f => f.FieldId == request.FieldId);
                if (fieldToDelete == null)
                {
                    return Json(new { success = false, message = "Field not found" });
                }

                // Instead of removing, mark as deleted
                fieldToDelete.IsDeleted = true;
                fieldToDelete.UpdatedAt = DateTime.UtcNow;

                configForm.AdditionalFields = existingFields;
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                _context.ViewPublicForm.Update(configForm);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Field deleted successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // AJAX: Update field label
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateFieldLabel([FromBody] UpdateLabelRequest request)
        {
            try
            {
                var configForm = GetOrCreateConfigForm();
                var labels = configForm.FieldLabels;

                if (labels.ContainsKey(request.FieldKey))
                {
                    labels[request.FieldKey] = request.Label;
                    configForm.FieldLabels = labels; // Triggers JSON serialization
                    configForm.FormVersion++;

                    _context.ViewPublicForm.Update(configForm);
                    await _context.SaveChangesAsync();

                    return Json(new { success = true, message = "Label updated" });
                }

                return Json(new { success = false, message = "Field key not found" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // AJAX: Add custom step
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddCustomStep([FromBody] AddStepRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.StepName))
                {
                    return Json(new { success = false, message = "Step name is required" });
                }

                var configForm = GetOrCreateConfigForm();
                var existingFields = configForm.AdditionalFields ?? new List<AdditionalField>();

                // Generate a unique field name for the step
                var stepFieldName = $"step_{request.StepName.ToLower().Replace(" ", "_")}_{Guid.NewGuid().ToString("N").Substring(0, 8)}";

                // Create a special additional field to represent the step
                var stepField = new AdditionalField
                {
                    FieldId = Guid.NewGuid(),
                    DisplayName = request.StepName.Trim(),
                    FieldName = stepFieldName,
                    FieldType = "step", // Special type for steps
                    Step = request.StepOrder,
                    Placeholder = request.StepDescription,
                    IsRequired = false,
                    IsConditional = false,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = User.Identity?.Name ?? "System",
                    IsActive = true,
                    IsDeleted = false,
                    DisplayOrder = existingFields.Count + 1,
                    OptionsJson = request.StepIcon // Store icon in OptionsJson
                };

                existingFields.Add(stepField);

                // Reorder steps to maintain sequence
                var steps = existingFields.Where(f => f.FieldType == "step").OrderBy(f => f.Step).ToList();
                for (int i = 0; i < steps.Count; i++)
                {
                    steps[i].Step = i + 4; // Steps start from 4 (after static steps)
                }

                configForm.AdditionalFields = existingFields;
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                _context.ViewPublicForm.Update(configForm);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = $"Step '{stepField.DisplayName}' added successfully!",
                    step = new
                    {
                        stepId = stepField.FieldId,
                        stepName = stepField.DisplayName,
                        stepDescription = stepField.Placeholder,
                        stepIcon = stepField.OptionsJson,
                        stepOrder = stepField.Step
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // AJAX: Delete custom step
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteCustomStep([FromBody] DeleteStepRequest request)
        {
            try
            {
                var configForm = GetOrCreateConfigForm();
                var existingFields = configForm.AdditionalFields ?? new List<AdditionalField>();

                // Find the step field
                var stepField = existingFields.FirstOrDefault(f => f.FieldId == request.StepId && f.FieldType == "step");
                if (stepField == null)
                {
                    return Json(new { success = false, message = "Step not found" });
                }

                int deletedStepNumber = stepField.Step;

                // Mark step field as deleted
                stepField.IsDeleted = true;

                // Also mark all fields in this step as deleted
                var stepFields = existingFields.Where(f => f.Step == deletedStepNumber).ToList();
                foreach (var field in stepFields)
                {
                    field.IsDeleted = true;
                    field.UpdatedAt = DateTime.UtcNow;
                }

                // Renumber remaining steps sequentially
                var remainingSteps = existingFields
                    .Where(f => f.FieldType == "step" && !f.IsDeleted)
                    .OrderBy(f => f.Step)
                    .ToList();

                // Start numbering from 4 (after the 3 static steps)
                for (int i = 0; i < remainingSteps.Count; i++)
                {
                    int newStepNumber = i + 4;
                    var oldStepNumber = remainingSteps[i].Step;
                    remainingSteps[i].Step = newStepNumber;

                    // Update all fields in this step to the new step number
                    var fieldsInStep = existingFields
                        .Where(f => f.Step == oldStepNumber && f.FieldType != "step" && !f.IsDeleted)
                        .ToList();
                    foreach (var field in fieldsInStep)
                    {
                        field.Step = newStepNumber;
                        field.UpdatedAt = DateTime.UtcNow;
                    }
                }

                configForm.AdditionalFields = existingFields;
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                _context.ViewPublicForm.Update(configForm);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Step deleted successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // Dashboard - Statistics & Overview
        public async Task<IActionResult> Dashboard()
        {
            ViewBag.ActiveMenu = "Dashboard";

            var allForms = await _context.ViewPublicForm
                .Where(f => f.FullName != null && f.IsDeleted != true)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            var viewModel = new Medical.Models.ViewModels.DashboardViewModel
            {
                TotalSubmissions = allForms.Count,
                TodaySubmissions = allForms.Count(f => f.CreatedAt.Date == DateTime.UtcNow.Date),
                LastSubmission = allForms.FirstOrDefault(),
                RecentSubmissions = allForms.Take(5).ToList(),
                Last7DaysStats = allForms
                    .Where(f => f.CreatedAt >= DateTime.UtcNow.AddDays(-7))
                    .GroupBy(f => f.CreatedAt.Date)
                    .Select(g => new Medical.Models.ViewModels.DailySubmissionStat
                    {
                        Date = g.Key,
                        Count = g.Count()
                    })
                    .OrderBy(s => s.Date)
                    .ToList()
            };

            // Fill in missing days for the chart
            var stats = new List<Medical.Models.ViewModels.DailySubmissionStat>();
            for (int i = 6; i >= 0; i--)
            {
                var date = DateTime.UtcNow.Date.AddDays(-i);
                var existing = viewModel.Last7DaysStats.FirstOrDefault(s => s.Date == date);
                stats.Add(existing ?? new Medical.Models.ViewModels.DailySubmissionStat { Date = date, Count = 0 });
            }
            viewModel.Last7DaysStats = stats;

            return View(viewModel);
        }

        // Get all form submissions
        public async Task<IActionResult> Index()
        {
            ViewBag.ActiveMenu = "ViewForms";
            
            // Get the field configuration to retrieve step and field names
            var configForm = GetOrCreateConfigForm();
            var allFields = configForm.AdditionalFields?
                .Where(f => !f.IsDeleted && f.IsActive)
                .OrderBy(f => f.Step)
                .ThenBy(f => f.DisplayOrder)
                .ToList() ?? new List<AdditionalField>();
            
            // Pass configuration fields and custom steps to view
            ViewBag.ConfigFields = allFields.Where(f => f.FieldType != "step").ToList();
            ViewBag.CustomSteps = allFields.Where(f => f.FieldType == "step").ToList();
            
            var submissions = await _context.ViewPublicForm
                .Where(f => f.FullName != null && f.IsDeleted != true) // Only actual submissions and not deleted
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
            return View(submissions);
        }

        // Details of a submission with additional fields
        public async Task<IActionResult> Details(Guid? id)
        {
            if (id == null) return NotFound();

            var form = await _context.ViewPublicForm
                .FirstOrDefaultAsync(x => x.ViewPublicFormId == id);

            if (form == null || form.IsDeleted == true) return NotFound();

            // Parse additional fields data
            if (!string.IsNullOrEmpty(form.AdditionalFieldsJson))
            {
                try
                {
                    var additionalData = JsonConvert.DeserializeObject<Dictionary<string, AdditionalFieldValue>>(form.AdditionalFieldsJson);
                    ViewBag.AdditionalFieldsData = additionalData;
                }
                catch
                {
                    ViewBag.AdditionalFieldsData = new Dictionary<string, AdditionalFieldValue>();
                }
            }
            else
            {
                ViewBag.AdditionalFieldsData = new Dictionary<string, AdditionalFieldValue>();
            }

            // Get custom steps configuration
            var configForm = GetOrCreateConfigForm();
            var allFields = configForm.AdditionalFields?
                .Where(f => !f.IsDeleted && f.IsActive)
                .OrderBy(f => f.Step)
                .ThenBy(f => f.DisplayOrder)
                .ToList() ?? new List<AdditionalField>();
            
            ViewBag.CustomSteps = allFields.Where(f => f.FieldType == "step").ToList();

            ViewBag.ActiveMenu = "ViewForms";
            return View(form);
        }

        // Delete a submission
        public async Task<IActionResult> Delete(Guid? id)
        {
            if (id == null) return NotFound();

            var form = await _context.ViewPublicForm
                .FirstOrDefaultAsync(x => x.ViewPublicFormId == id);

            if (form == null || form.IsDeleted == true) return NotFound();

            ViewBag.ActiveMenu = "ViewForms";
            return View(form);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(Guid id)
        {
            var form = await _context.ViewPublicForm.FindAsync(id);

            if (form != null)
            {
                form.IsDeleted = true;
                _context.ViewPublicForm.Update(form);
                await _context.SaveChangesAsync();
            }

            return RedirectToAction(nameof(Index));
        }

        // Helper methods
        private ViewPublicForm GetOrCreateConfigForm()
        {
            var configForm = _context.ViewPublicForm
                .Where(f => f.FullName == null)
                .OrderByDescending(f => f.CreatedAt)
                .FirstOrDefault();

            if (configForm == null)
            {
                configForm = new ViewPublicForm
                {
                    ViewPublicFormId = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    FormVersion = 1,
                    AdditionalFieldsJson = "[]",
                    IsDeleted = false
                };
                _context.ViewPublicForm.Add(configForm);
                _context.SaveChanges();
            }

            return configForm;
        }

        // Maintenance: normalize config AdditionalFieldsJson entries that are single objects into arrays
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult NormalizeConfigAdditionalFields()
        {
            try
            {
                var configs = _context.ViewPublicForm
                    .Where(f => f.FullName == null)
                    .ToList();

                var updated = 0;

                foreach (var cfg in configs)
                {
                    if (string.IsNullOrWhiteSpace(cfg.AdditionalFieldsJson)) continue;

                    var raw = cfg.AdditionalFieldsJson.Trim();
                    if (!raw.StartsWith("{")) continue; // only single-object cases

                    try
                    {
                        var token = JToken.Parse(raw);
                        if (token.Type == JTokenType.Object)
                        {
                            // Heuristic: treat as an AdditionalField object if it has common field keys
                            if (token["FieldName"] != null || token["DisplayName"] != null || token["FieldId"] != null)
                            {
                                var arr = new JArray(token);
                                cfg.AdditionalFieldsJson = arr.ToString(Newtonsoft.Json.Formatting.None);
                                _context.ViewPublicForm.Update(cfg);
                                updated++;
                            }
                        }
                    }
                    catch
                    {
                        // ignore parse errors for individual rows
                    }
                }

                if (updated > 0) _context.SaveChanges();

                return Json(new { success = true, updated });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        private string GenerateFieldName(string displayName)
        {
            var fieldName = displayName
                .Replace(" ", "_")
                .Replace("?", "")
                .Replace("(", "")
                .Replace(")", "")
                .Replace("-", "_")
                .Replace(".", "_")
                .Replace(",", "_")
                .Replace("'", "")
                .Replace("\"", "")
                .ToLower();

            return "additional_" + fieldName;
        }
    }

    // Request models
    public class AdditionalFieldRequest
    {
        public string DisplayName { get; set; } = string.Empty;
        public string FieldType { get; set; } = "text";
        public int Step { get; set; } = 1;
        public string? Placeholder { get; set; }
        public bool IsRequired { get; set; }
        public bool IsConditional { get; set; }
        public string? ConditionalLogicJson { get; set; }
        public string? OptionsJson { get; set; }
    }

    public class DeleteFieldRequest
    {
        public Guid FieldId { get; set; }
    }

    public class UpdateFieldRequest
    {
        public Guid FieldId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string FieldType { get; set; } = "text";
        public int Step { get; set; } = 1;
        public string? Placeholder { get; set; }
        public bool IsRequired { get; set; }
        public bool IsConditional { get; set; }
        public string? ConditionalLogicJson { get; set; }
        public string? OptionsJson { get; set; }
    }

    public class UpdateLabelRequest
    {
        public string FieldKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
    }

    public class AddStepRequest
    {
        public string StepName { get; set; } = string.Empty;
        public string? StepDescription { get; set; }
        public int StepOrder { get; set; } = 4; // Default after step 3
        public string? StepIcon { get; set; } = "📋";
    }

    public class DeleteStepRequest
    {
        public Guid StepId { get; set; }
    }

    // Model for storing additional field values
    public class AdditionalFieldValue
    {
        public Guid FieldId { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string FieldType { get; set; } = "text";
        public string Value { get; set; } = string.Empty;
        public int Step { get; set; } = 1;
    }
}