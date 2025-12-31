using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Medical.Data;
using Medical.Models;
using Medical.Helpers;
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

            ViewBag.AdditionalFields = allFields.Where(f => f.FieldType != "step").ToList();

            // Dynamic steps from FormSchemaJson
            var formSteps = Medical.Helpers.FormSchemaStepsHelper.ReadSteps(configForm.FormSchemaJson)
                .Where(s => s.IsActive)
                .OrderBy(s => s.Order)
                .ToList();
            ViewBag.FormSteps = formSteps;

            // Pass FormSchemaJson for dynamic rendering
            ViewBag.FormSchemaJson = configForm.FormSchemaJson ?? string.Empty;

            var model = new ViewPublicForm();
            // Load labels from config
            model.FieldLabels = configForm.FieldLabels;

            return View(model);
        }

        // GET: FillForm - User-facing form (not the builder)
        public IActionResult FillForm()
        {
            ViewBag.ActiveMenu = "PublicForm";

            var configForm = GetOrCreateConfigForm();

            // Back-compat: if older schema lacks groups, seed a default group per step.
            try
            {
                var seeded = Medical.Helpers.FormSchemaStepsHelper.EnsureDefaultGroupsSeeded(configForm.FormSchemaJson);
                if (seeded.Changed)
                {
                    configForm.FormSchemaJson = seeded.UpdatedJson;
                    configForm.FormVersion++;
                    configForm.CreatedAt = DateTime.UtcNow;
                    _context.ViewPublicForm.Update(configForm);
                    _context.SaveChanges();
                }
            }
            catch
            {
                // ignore seeding failures for safety
            }

            // Dynamic step definitions from FormSchemaJson
            try
            {
                var formSteps = Medical.Helpers.FormSchemaStepsHelper.ReadSteps(configForm.FormSchemaJson)
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.Order)
                    .ToList();
                ViewBag.FormSteps = formSteps;
            }
            catch
            {
                ViewBag.FormSteps = new List<Medical.Models.FormStep>();
            }

            // Dynamic fields from AdditionalFieldsJson (hide deleted/inactive)
            var allFields = (configForm.AdditionalFields ?? new List<AdditionalField>())
                .Where(f => f.IsActive && !f.IsDeleted)
                .OrderBy(f => f.Step)
                .ThenBy(f => f.DisplayOrder)
                .ToList();

            ViewBag.AdditionalFields = allFields.Where(f => f.FieldType != "step").ToList();

            var model = new ViewPublicForm();
            model.FieldLabels = configForm.FieldLabels;

            return View(model);
        }

        // POST: Create Multi-step Form - FIXED
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(PublicFormSubmissionDto dto)
        {
            ViewPublicForm model = new ViewPublicForm();

            try
            {
                if (ModelState.IsValid)
                {
                    model = new ViewPublicForm
                    {
                        ViewPublicFormId = Guid.NewGuid(),
                        CreatedAt = DateTime.UtcNow,
                        IsDeleted = false,
                        IsConfig = false
                    };

                    // Get additional fields configuration
                    var configForm = GetOrCreateConfigForm();
                    var additionalFields = configForm.AdditionalFields ?? new List<AdditionalField>();

                    // Collect all field values from form submission
                    var formData = new Dictionary<string, string>();

                    // Only process non-step fields
                    foreach (var field in additionalFields.Where(f => f.FieldType != "step"))
                    {
                        var fieldName = field.FieldName;
                        var formKey = $"AdditionalFields[{fieldName}]";

                        if (Request.Form.ContainsKey(formKey))
                        {
                            var value = Request.Form[formKey].ToString();
                            formData[fieldName] = value;
                        }
                    }

                    // Explicit DTO -> entity mapping
                    // (dto is the public contract; entity is constructed server-side)
                    dto.FormData = formData;
                    model.FormData = dto.FormData;

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
            
            // Load steps from FormSchemaJson
            var formSteps = FormSchemaStepsHelper.ReadSteps(reloadConfigForm.FormSchemaJson)
                .Where(s => s.IsActive)
                .OrderBy(s => s.Order)
                .ToList();
            ViewBag.FormSteps = formSteps;
            ViewBag.FormSchemaJson = reloadConfigForm.FormSchemaJson ?? string.Empty;

            return View(model);
        }

        // POST: FillForm - Handle form submission from user
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> FillForm(PublicFormSubmissionDto dto)
        {
            ViewPublicForm model = new ViewPublicForm();

            try
            {
                if (ModelState.IsValid)
                {
                    model = new ViewPublicForm
                    {
                        ViewPublicFormId = Guid.NewGuid(),
                        CreatedAt = DateTime.UtcNow,
                        IsDeleted = false,
                        IsConfig = false
                    };

                    // Get additional fields configuration
                    var configForm = GetOrCreateConfigForm();
                    var additionalFields = configForm.AdditionalFields ?? new List<AdditionalField>();

                    // Collect all field values from form submission
                    var formData = new Dictionary<string, string>();

                    // FillForm.cshtml posts inputs with name == FieldName
                    foreach (var field in additionalFields.Where(f => f.FieldType != "step"))
                    {
                        var fieldName = field.FieldName;

                        if (Request.Form.TryGetValue(fieldName, out var values))
                        {
                            string value;
                            if (string.Equals(field.FieldType, "checkbox", StringComparison.OrdinalIgnoreCase))
                            {
                                value = values.Any(v => string.Equals(v, "true", StringComparison.OrdinalIgnoreCase)) ? "true" : "false";
                            }
                            else
                            {
                                value = values.Count > 0 ? values[0] : string.Empty;
                            }
                            formData[fieldName] = value;
                        }
                    }

                    // Explicit DTO -> entity mapping
                    dto.FormData = formData;
                    model.FormData = dto.FormData;

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

            // If validation fails, return FillForm with same dynamic config
            ViewBag.ActiveMenu = "PublicForm";

            var reloadConfigForm = GetOrCreateConfigForm();

            try
            {
                var formSteps = Medical.Helpers.FormSchemaStepsHelper.ReadSteps(reloadConfigForm.FormSchemaJson)
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.Order)
                    .ToList();
                ViewBag.FormSteps = formSteps;
            }
            catch
            {
                ViewBag.FormSteps = new List<Medical.Models.FormStep>();
            }

            var allFields = reloadConfigForm.AdditionalFields?
                .Where(f => !f.IsDeleted && f.IsActive)
                .OrderBy(f => f.Step)
                .ThenBy(f => f.DisplayOrder)
                .ToList() ?? new List<AdditionalField>();

            ViewBag.AdditionalFields = allFields.Where(f => f.FieldType != "step").ToList();

            // keep labels (if used in view)
            model.FieldLabels = reloadConfigForm.FieldLabels;

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
                if (fieldToDelete == null) return Json(new { success = false, message = "Field not found" });

                // Permanently remove the field
                existingFields = existingFields.Where(f => f.FieldId != request.FieldId).ToList();

                // Recompute display order for remaining fields within each step
                var fieldsByStep = existingFields.Where(f => f.FieldType != "step").GroupBy(f => f.Step);
                foreach (var group in fieldsByStep)
                {
                    int order = 1;
                    foreach (var field in group.OrderBy(f => f.DisplayOrder))
                    {
                        field.DisplayOrder = order++;
                        field.UpdatedAt = DateTime.UtcNow;
                    }
                }

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

                // Read existing steps from FormSchemaJson
                var steps = Medical.Helpers.FormSchemaStepsHelper.ReadSteps(configForm.FormSchemaJson).ToList();

                // Create new step
                var newStep = new FormStep
                {
                    Id = Guid.NewGuid(),
                    Name = request.StepName.Trim(),
                    Order = request.StepOrder,
                    IsActive = true
                };

                steps.Add(newStep);

                // Normalize ordering (1..n)
                steps = steps.OrderBy(s => s.Order).ToList();
                for (var i = 0; i < steps.Count; i++)
                    steps[i].Order = i + 1;

                configForm.FormSchemaJson = Medical.Helpers.FormSchemaStepsHelper.WriteSteps(configForm.FormSchemaJson, steps);
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                _context.ViewPublicForm.Update(configForm);
                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = $"Step '{newStep.Name}' added successfully!",
                    step = new
                    {
                        stepId = newStep.Id,
                        stepName = newStep.Name,
                        stepDescription = request.StepDescription,
                        stepIcon = request.StepIcon,
                        stepOrder = newStep.Order
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

                // Read steps from FormSchemaJson
                var steps = Medical.Helpers.FormSchemaStepsHelper.ReadSteps(configForm.FormSchemaJson).ToList();

                var target = steps.FirstOrDefault(s => s.Id == request.StepId);

                // Back-compat: if not found, ignore (old logic used AdditionalFields)
                if (target == null)
                    return Json(new { success = false, message = "Step not found" });

                var deletedOrder = target.Order;

                // Remove from steps
                steps = steps.Where(s => s.Id != target.Id).OrderBy(s => s.Order).ToList();
                for (var i = 0; i < steps.Count; i++)
                    steps[i].Order = i + 1;

                configForm.FormSchemaJson = Medical.Helpers.FormSchemaStepsHelper.WriteSteps(configForm.FormSchemaJson, steps);

                // Remove fields in that step (from AdditionalFields)
                var existingFields = configForm.AdditionalFields ?? new List<AdditionalField>();
                existingFields = existingFields.Where(f => f.Step != deletedOrder).ToList();

                // Renumber remaining fields' steps
                foreach (var f in existingFields.Where(f => f.Step > deletedOrder))
                {
                    f.Step -= 1;
                    f.UpdatedAt = DateTime.UtcNow;
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

        // AJAX: Update custom step
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateCustomStep([FromBody] UpdateStepRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.StepName))
                    return Json(new { success = false, message = "Step name is required" });

                var configForm = GetOrCreateConfigForm();

                var steps = Medical.Helpers.FormSchemaStepsHelper.ReadSteps(configForm.FormSchemaJson).ToList();
                var st = steps.FirstOrDefault(s => s.Id == request.StepId);

                if (st == null)
                    return Json(new { success = false, message = "Step not found" });

                st.Name = request.StepName.Trim();

                if (request.StepOrder.HasValue && request.StepOrder.Value > 0)
                    st.Order = request.StepOrder.Value;

                // Normalize orders
                steps = steps.OrderBy(s => s.Order).ToList();
                for (var i = 0; i < steps.Count; i++)
                    steps[i].Order = i + 1;

                configForm.FormSchemaJson = Medical.Helpers.FormSchemaStepsHelper.WriteSteps(configForm.FormSchemaJson, steps);
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                _context.ViewPublicForm.Update(configForm);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Step updated successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // AJAX: Toggle step active status (enable/disable)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ToggleStepActive([FromBody] ToggleStepRequest request)
        {
            try
            {
                var configForm = GetOrCreateConfigForm();
                
                var result = FormSchemaStepsHelper.ToggleStepActive(
                    configForm.FormSchemaJson, 
                    request.StepId, 
                    request.IsActive
                );
                
                if (!result.Success)
                    return Json(new { success = false, message = result.Message });

                configForm.FormSchemaJson = result.UpdatedJson;
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                _context.ViewPublicForm.Update(configForm);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = result.Message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // Get disabled steps for recovery
        [HttpGet]
        public IActionResult GetDisabledSteps()
        {
            try
            {
                var configForm = GetOrCreateConfigForm();
                var disabledSteps = FormSchemaStepsHelper.GetDisabledSteps(configForm.FormSchemaJson);
                
                return Json(new { 
                    success = true, 
                    steps = disabledSteps.Select(s => new { 
                        id = s.Id, 
                        name = s.Name, 
                        order = s.Order 
                    }) 
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // AJAX: Update groups for a step
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateStepGroups([FromBody] UpdateStepGroupsRequest request)
        {
            try
            {
                var configForm = GetOrCreateConfigForm();

                // Read steps
                var steps = FormSchemaStepsHelper.ReadSteps(configForm.FormSchemaJson);

                // Find target step
                var targetStep = steps.FirstOrDefault(s => s.Order == request.StepOrder);
                if (targetStep == null)
                    return Json(new { success = false, message = "Step not found" });

                // Update groups
                targetStep.Groups = request.Groups ?? new List<StepGroup>();

                // Write back
                configForm.FormSchemaJson = FormSchemaStepsHelper.WriteSteps(configForm.FormSchemaJson, steps);
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;

                _context.ViewPublicForm.Update(configForm);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Groups updated successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        // DIAGNOSTIC: Check database configuration
        [HttpGet]
        public IActionResult DiagnoseFormConfig()
        {
            try
            {
                var configForm = GetOrCreateConfigForm();
                
                // Parse steps
                var steps = FormSchemaStepsHelper.ReadSteps(configForm.FormSchemaJson)
                    .OrderBy(s => s.Order)
                    .ToList();
                
                // Parse fields
                var fields = configForm.AdditionalFields?
                    .Where(f => !f.IsDeleted && f.IsActive)
                    .OrderBy(f => f.Step)
                    .ThenBy(f => f.DisplayOrder)
                    .ToList() ?? new List<AdditionalField>();
                
                return Json(new
                {
                    success = true,
                    configId = configForm.ViewPublicFormId,
                    formVersion = configForm.FormVersion,
                    createdAt = configForm.CreatedAt,
                    totalSteps = steps.Count,
                    activeSteps = steps.Count(s => s.IsActive),
                    steps = steps.Select(s => new
                    {
                        id = s.Id,
                        name = s.Name,
                        order = s.Order,
                        isActive = s.IsActive,
                        fieldCount = fields.Count(f => f.Step == s.Order)
                    }),
                    totalFields = fields.Count,
                    fields = fields.Select(f => new
                    {
                        fieldId = f.FieldId,
                        displayName = f.DisplayName,
                        fieldName = f.FieldName,
                        fieldType = f.FieldType,
                        step = f.Step,
                        isRequired = f.IsRequired,
                        isConditional = f.IsConditional,
                        placeholder = f.Placeholder
                    })
                });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        // Dashboard - Statistics & Overview
        public async Task<IActionResult> Dashboard()
        {
            ViewBag.ActiveMenu = "Dashboard";

            var baseQuery = _context.ViewPublicForm
                .Where(f => f.IsConfig != true && f.IsDeleted != true);

            var totalSubmissions = await baseQuery.CountAsync();
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var todaySubmissions = await baseQuery
                .Where(f => f.CreatedAt >= today && f.CreatedAt < tomorrow)
                .CountAsync();

            var lastSubmission = await baseQuery
                .OrderByDescending(f => f.CreatedAt)
                .FirstOrDefaultAsync();

            var recentSubmissions = await baseQuery
                .OrderByDescending(f => f.CreatedAt)
                .Take(5)
                .ToListAsync();

            var startDate = DateTime.UtcNow.Date.AddDays(-6);

            var last7DaysAgg = await baseQuery
                .Where(f => f.CreatedAt >= startDate)
                .GroupBy(f => f.CreatedAt.Date)
                .Select(g => new Medical.Models.ViewModels.DailySubmissionStat
                {
                    Date = g.Key,
                    Count = g.Count()
                })
                .OrderBy(s => s.Date)
                .ToListAsync();

            var viewModel = new Medical.Models.ViewModels.DashboardViewModel
            {
                TotalSubmissions = totalSubmissions,
                TodaySubmissions = todaySubmissions,
                LastSubmission = lastSubmission,
                RecentSubmissions = recentSubmissions,
                Last7DaysStats = last7DaysAgg
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
        public async Task<IActionResult> Index(int page = 1, int pageSize = 25)
        {
            ViewBag.ActiveMenu = "ViewForms";

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 25;
            if (pageSize > 100) pageSize = 100;

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
            
            var query = _context.ViewPublicForm
                .Where(f => f.IsConfig != true && f.IsDeleted != true)
                .OrderByDescending(f => f.CreatedAt);

            var totalCount = await query.CountAsync();
            var submissions = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            ViewBag.Page = page;
            ViewBag.PageSize = pageSize;
            ViewBag.TotalCount = totalCount;

            return View(submissions);
        }

        // Details of a submission with additional fields
        public async Task<IActionResult> Details(Guid? id)
        {
            if (id == null) return NotFound();

            var form = await _context.ViewPublicForm
                .FirstOrDefaultAsync(x => x.ViewPublicFormId == id);

            if (form == null || form.IsDeleted == true) return NotFound();

            // Get form configuration to map field metadata
            var configForm = GetOrCreateConfigForm();
            var configFields = configForm.AdditionalFields?
                .Where(f => !f.IsDeleted && f.IsActive)
                .OrderBy(f => f.Step)
                .ThenBy(f => f.DisplayOrder)
                .ToList() ?? new List<AdditionalField>();

            // Parse FormDataJson (submitted data) and convert to AdditionalFieldValue format
            var additionalFieldsData = new Dictionary<string, AdditionalFieldValue>();

            if (!string.IsNullOrEmpty(form.FormDataJson))
            {
                try
                {
                    var formData = JsonConvert.DeserializeObject<Dictionary<string, string>>(form.FormDataJson);
                    
                    if (formData != null)
                    {
                        foreach (var kvp in formData)
                        {
                            // Find the field configuration
                            var fieldConfig = configFields.FirstOrDefault(f => f.FieldName == kvp.Key);
                            
                            if (fieldConfig != null)
                            {
                                additionalFieldsData[kvp.Key] = new AdditionalFieldValue
                                {
                                    FieldId = fieldConfig.FieldId,
                                    FieldName = fieldConfig.FieldName,
                                    DisplayName = fieldConfig.DisplayName,
                                    FieldType = fieldConfig.FieldType,
                                    Value = kvp.Value,
                                    Step = fieldConfig.Step
                                };
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error parsing FormDataJson: {ex.Message}");
                    additionalFieldsData = new Dictionary<string, AdditionalFieldValue>();
                }
            }

            ViewBag.AdditionalFieldsData = additionalFieldsData;

            // Get FormSteps from FormSchemaJson
            try
            {
                var formSteps = Medical.Helpers.FormSchemaStepsHelper.ReadSteps(configForm.FormSchemaJson)
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.Order)
                    .ToList();
                ViewBag.FormSteps = formSteps;
            }
            catch
            {
                ViewBag.FormSteps = new List<Medical.Models.FormStep>();
            }
            
            ViewBag.CustomSteps = configFields.Where(f => f.FieldType == "step").ToList();

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
                .Where(f => f.IsConfig == true)
                .OrderByDescending(f => f.CreatedAt)
                .FirstOrDefault();

            if (configForm == null)
            {
                // Seed default steps if no config exists
                var seeded = FormSchemaStepsHelper.EnsureSeededDefaultSteps(null);
                
                configForm = new ViewPublicForm
                {
                    ViewPublicFormId = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    FormVersion = 1,
                    AdditionalFieldsJson = "[]",
                    FormSchemaJson = seeded.UpdatedJson,
                    IsConfig = true,
                    IsDeleted = false
                };
                _context.ViewPublicForm.Add(configForm);
                _context.SaveChanges();
            }
            else
            {
                // Always check for and restore missing default steps
                var check = FormSchemaStepsHelper.EnsureSeededDefaultSteps(configForm.FormSchemaJson);
                if (check.UpdatedJson != configForm.FormSchemaJson)
                {
                    configForm.FormSchemaJson = check.UpdatedJson;
                    configForm.FormVersion++;
                    _context.ViewPublicForm.Update(configForm);
                    _context.SaveChanges();
                }
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
                    .Where(f => f.IsConfig == true)
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

        // Maintenance: Re-seed default steps if missing
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ReseedDefaultSteps()
        {
            try
            {
                var configForm = GetOrCreateConfigForm();
                
                // Force re-seed of default steps
                var seeded = FormSchemaStepsHelper.EnsureSeededDefaultSteps(null);
                
                configForm.FormSchemaJson = seeded.UpdatedJson;
                configForm.FormVersion++;
                configForm.CreatedAt = DateTime.UtcNow;
                
                _context.ViewPublicForm.Update(configForm);
                _context.SaveChanges();

                return Json(new { success = true, message = "Default steps re-seeded successfully!", steps = seeded.Steps.Count });
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

    public class UpdateStepRequest
    {
        public Guid StepId { get; set; }
        public string StepName { get; set; } = string.Empty;
        public string? StepDescription { get; set; }
        public int? StepOrder { get; set; } // optional reorder
        public string? StepIcon { get; set; }
    }

    public class DeleteStepRequest
    {
        public Guid StepId { get; set; }
    }

    public class ToggleStepRequest
    {
        public Guid StepId { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateStepGroupsRequest
    {
        public int StepOrder { get; set; }
        public List<StepGroup> Groups { get; set; } = new List<StepGroup>();
    }

    // DTO for public form submissions (controller accepts this DTO, transforms to entity)
    public class PublicFormSubmissionDto
    {
        public Dictionary<string, string> FormData { get; set; } = new Dictionary<string, string>();
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
