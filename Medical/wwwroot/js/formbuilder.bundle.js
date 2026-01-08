/*
  state.js
  Shared state used by the Form Builder page.
*/

// =================================
// GLOBAL STATE
// =================================
let isModalOpen = false;
let isStepModalOpen = false;
let selectedFieldData = null;
let customSteps = [];

// These are assigned from Razor via `window.__formBuilderData` in the view.
let additionalFieldsData = [];
let customStepsData = [];
let originalFields = {};
/*
  core.js
  Shared helpers + page initialization for the Form Builder page.
*/

// =================================
// GET ANTI-FORGERY TOKEN
// =================================
function getToken() {
  return document.querySelector('input[name="__RequestVerificationToken"]').value;
}

// =================================
// TOAST NOTIFICATION
// =================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.style.fontSize = '16px';
  icon.textContent = type === 'success' ? '?' : type === 'error' ? '?' : '??';

  const msg = document.createElement('span');
  msg.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-sm btn-light';
  closeBtn.style.marginLeft = 'auto';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.color = 'inherit';
  closeBtn.style.cursor = 'pointer';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = function () {
    toast.style.animation = 'toastSlideOut 0.25s ease-in';
    setTimeout(() => toast.remove(), 250);
  };

  toast.appendChild(icon);
  toast.appendChild(msg);
  toast.appendChild(closeBtn);

  if (container.firstChild) {
    container.insertBefore(toast, container.firstChild);
  } else {
    container.appendChild(toast);
  }

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

// =================================
// CONDITIONAL FIELDS LOGIC
// =================================
function populateDependsOnFields(currentStep, excludeFieldId) {
  const dropdown = document.getElementById('fpDependsOnField');
  if (!dropdown) return;
  dropdown.innerHTML = '<option value="">Select field...</option>';

  const additionalFieldsData = window.__formBuilderData?.additionalFieldsData || [];

  for (let step = 1; step <= currentStep; step++) {
    additionalFieldsData
      .filter(f => f.Step === step && String(f.FieldId) !== String(excludeFieldId))
      .forEach(f => {
        const option = document.createElement('option');
        option.value = f.FieldId;
        option.textContent = `${f.DisplayName} (Step ${step})`;
        dropdown.appendChild(option);
      });
  }
}

function applyConditionalLogic() {
  const additionalFieldsData = window.__formBuilderData?.additionalFieldsData || [];
  const conditionalFields = additionalFieldsData.filter(f => f.IsConditional && f.ConditionalLogicJson);
  
  conditionalFields.forEach(field => {
    try {
      const logic = JSON.parse(field.ConditionalLogicJson);
      const fieldContainer = document.querySelector(`.additional-field-container[data-field-id="${field.FieldId}"]`);
      if (!fieldContainer) return;

      // Support multiple property name variations
      const parentFieldId = logic.parentFieldId || logic.ParentFieldId || logic.DependsOnFieldKey || logic.dependsOnFieldKey;
      const expectedValue = logic.expectedValue || logic.ExpectedValue || logic.ShowWhenValue || logic.showWhenValue;

      if (!parentFieldId) return;

      // Find the dependent field
      let dependentField = null;

      // Try finding by data-field-key (for static fields)
      dependentField = document.querySelector(`[data-field-key="${parentFieldId}"] select, [data-field-key="${parentFieldId}"] input`);

      // Try finding by field container data-field-id (for dynamic fields)
      if (!dependentField) {
        const depContainer = document.querySelector(`.additional-field-container[data-field-id="${parentFieldId}"]`);
        if (depContainer) {
          dependentField = depContainer.querySelector('input, select, textarea');
          
          if (!dependentField || dependentField.type === 'radio') {
            const radioGroup = depContainer.querySelectorAll('input[type="radio"]');
            if (radioGroup.length > 0) {
              dependentField = depContainer.querySelector('input[type="radio"]:checked') || radioGroup[0];
            }
          }
        }
      }

      if (!dependentField) return;

      const checkVisibility = () => {
        let fieldValue = '';
        
        if (dependentField.type === 'radio') {
          const container = dependentField.closest('.additional-field-container, .mb-3');
          if (container) {
            const checkedRadio = container.querySelector('input[type="radio"]:checked');
            fieldValue = checkedRadio ? checkedRadio.value : '';
          }
        } else if (dependentField.type === 'checkbox') {
          fieldValue = dependentField.checked ? 'true' : 'false';
        } else {
          fieldValue = dependentField.value;
        }
        
        const normalizedFieldValue = String(fieldValue).toLowerCase().trim();
        const normalizedExpectedValue = String(expectedValue || '').toLowerCase().trim();
        
        let conditionMet = false;
        if (normalizedFieldValue === normalizedExpectedValue) {
          conditionMet = true;
        } else if (expectedValue && String(expectedValue).includes(',')) {
          const allowedValues = String(expectedValue).split(',').map(v => v.trim().toLowerCase());
          conditionMet = allowedValues.some(v => v === normalizedFieldValue);
        }

        if (conditionMet) {
          fieldContainer.style.display = 'block';
          fieldContainer.style.opacity = '1';
        } else {
          fieldContainer.style.display = 'none';
        }
      };

      checkVisibility();

      if (!dependentField._conditionalListenerBound) {
        if (dependentField.type === 'radio') {
          const container = dependentField.closest('.additional-field-container, .mb-3');
          if (container) {
            const allRadios = container.querySelectorAll('input[type="radio"]');
            allRadios.forEach(radio => {
              radio.addEventListener('change', checkVisibility);
              radio._conditionalListenerBound = true;
            });
          }
        } else {
          dependentField.addEventListener('change', checkVisibility);
          dependentField.addEventListener('input', checkVisibility);
          dependentField._conditionalListenerBound = true;
        }
      }
    } catch (e) {
      console.error('Error applying conditional logic for field:', field.FieldId, e);
    }
  });
}

// =================================
// ENTER / ESC HANDLERS
// =================================
function handleModalEnterKey(e) {
  if (e.key === 'Enter' && isModalOpen) {
    e.preventDefault();
    e.stopPropagation();
    submitAddFieldForm();
  }
  if (e.key === 'Enter' && isStepModalOpen) {
    e.preventDefault();
    e.stopPropagation();
    submitAddStepForm();
  }
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    if (isModalOpen) {
      e.preventDefault();
      e.stopPropagation();
      modalCloseHandler();
    }
    if (isStepModalOpen) {
      e.preventDefault();
      e.stopPropagation();
      stepModalCloseHandler();
    }
  }
}

// =================================
// INITIALIZATION
// =================================
function initFormBuilderPage() {
  if (!window.__formBuilderData) return;

  // CRITICAL: Parse data ONCE and cache it
  additionalFieldsData = window.__formBuilderData.additionalFieldsData || [];
  customStepsData = window.__formBuilderData.customStepsData || [];
  originalFields = window.__formBuilderData.originalFields || {};

  customSteps = customStepsData || [];

  // CRITICAL: Hydrate groups from FormSchemaJson BEFORE rendering
  try {
    hydrateGroupsFromSchema();
  } catch (e) {
    console.error('Error hydrating groups:', e);
  }

  if (customSteps.length > 0) {
    renderCustomSteps();
  }

  switchStep(1);

  try { updateCounts(); } catch (e) { console.error('Error updating counts:', e); }
  
  // CRITICAL: Apply conditional logic AFTER fields are rendered
  try { 
    applyConditionalLogic(); 
  } catch (e) { 
    console.error('Error applying conditional logic:', e); 
  }

  setupFieldClickHandlers();
}

window.initFormBuilderPage = initFormBuilderPage;

// =================================
// SCHEMA HYDRATION - CRITICAL FIX
// =================================
function hydrateGroupsFromSchema() {
  const formStepsData = window.__formBuilderData?.formStepsData || [];
  
  if (formStepsData.length === 0) {
    return;
  }
  
  const STORAGE_KEY = 'formbuilder.grouping.v1';
  
  let store = null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      store = JSON.parse(stored);
    }
  } catch (e) {
    // Silent fail
  }
  
  // If localStorage exists and has data, trust it
  if (store && store.steps && Object.keys(store.steps).length > 0) {
    return;
  }
  
  // Initialize structure for each step
  if (!store) {
    store = { steps: {} };
  }
  
  formStepsData.forEach(step => {
    const stepId = String(step.Order);
    if (!store.steps[stepId]) {
      store.steps[stepId] = { groups: [] };
    }
  });
  
  // Save initialized structure
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    // Silent fail
  }
}

// =================================
// MISSING FUNCTION STUB
// =================================
function updateAllergyVisibility() {
  // This function is no longer needed in the dynamic form builder
  // It was part of the old hard-coded form
  // Kept as empty stub for backward compatibility
}

// =================================
// GLOBAL FUNCTION ALIASES
// =================================
// Make functions available globally for inline onclick handlers
window.openEditStepModal = editStepModalOpenHandler;
window.updateAllergyVisibility = updateAllergyVisibility;
window.hydrateGroupsFromSchema = hydrateGroupsFromSchema;
/*
  ui.js
  DOM/UI manipulation functions for the Form Builder page.
*/

// =================================
// MODAL FUNCTIONS - SIMPLE & RELIABLE
// =================================
function modalOpenHandler() {
  const modal = document.getElementById('addFieldModal');
  modal.classList.add('show');
  isModalOpen = true;
  document.body.style.overflow = 'hidden';
  document.getElementById('fieldLabelInput').focus();
}

function modalCloseHandler() {
  const modal = document.getElementById('addFieldModal');
  modal.classList.remove('show');
  isModalOpen = false;
  document.body.style.overflow = '';
  resetModalFields();
}

function toggleCheckbox(type) {
  const checkbox = document.getElementById(type + 'Checkbox');
  checkbox.classList.toggle('checked');
}

function resetModalFields() {
  document.getElementById('fieldLabelInput').value = '';
  document.getElementById('fieldTypeSelect').value = 'text';
  document.getElementById('fieldStepSelect').value = '1';
  document.getElementById('fieldPlaceholderInput').value = '';
  document.getElementById('requiredCheckbox').classList.remove('checked');
  document.getElementById('conditionalCheckbox').classList.remove('checked');
}

// =================================
// STEP MODAL FUNCTIONS
// =================================
function stepModalOpenHandler() {
  const modal = document.getElementById('addStepModal');
  modal.classList.add('show');
  isStepModalOpen = true;
  document.body.style.overflow = 'hidden';
  document.getElementById('stepNameInput').focus();
  document.getElementById('addStepSubmitBtn').style.display = '';
  document.getElementById('updateStepSubmitBtn').style.display = 'none';
  document.getElementById('editingStepId').value = '';
  document.querySelector('#addStepModal .modal-title').textContent = 'Add New Step';
}

function stepModalCloseHandler() {
  const modal = document.getElementById('addStepModal');
  modal.classList.remove('show');
  isStepModalOpen = false;
  document.body.style.overflow = '';
  resetStepModalFields();
}

function resetStepModalFields() {
  document.getElementById('stepNameInput').value = '';
  document.getElementById('stepDescriptionInput').value = '';
  document.getElementById('stepIconSelect').value = '??';
  document.getElementById('stepPositionSelect').value = '3';
  document.getElementById('editingStepId').value = '';
}

function editStepModalOpenHandler(stepId) {
  const formStepsData = window.__formBuilderData?.formStepsData || [];
  const step = formStepsData.find(s => String(s.Id) === String(stepId));
  
  if (!step) {
    showToast('Step not found', 'error');
    return;
  }
  
  const modal = document.getElementById('addStepModal');
  modal.classList.add('show');
  isStepModalOpen = true;
  document.body.style.overflow = 'hidden';
  document.querySelector('#addStepModal .modal-title').textContent = 'Edit Step';
  document.getElementById('stepNameInput').value = step.Name || '';
  document.getElementById('stepDescriptionInput').value = '';
  document.getElementById('stepIconSelect').value = '??';
  document.getElementById('stepPositionSelect').value = String(step.Order - 1);
  document.getElementById('editingStepId').value = step.Id;
  document.getElementById('addStepSubmitBtn').style.display = 'none';
  document.getElementById('updateStepSubmitBtn').style.display = '';
}

// =================================
// FORM NAV / RENDERING
// =================================
function getLastStepNumber() {
  const formStepsData = window.__formBuilderData?.formStepsData || [];
  if (formStepsData.length === 0) return 1;
  
  // Get the highest Order value from active steps
  const activeSteps = formStepsData.filter(s => s.IsActive !== false);
  return Math.max(...activeSteps.map(s => s.Order));
}

function isLastStep(stepOrder) {
  const lastStepOrder = getLastStepNumber();
  return stepOrder === lastStepOrder;
}

function updateFieldsList(step) {
  const container = document.getElementById('fieldsList');
  const stepNameEl = document.getElementById('currentStepName');
  
  // Get step name from formStepsData
  const formStepsData = window.__formBuilderData?.formStepsData || [];
  const stepData = formStepsData.find(s => s.Order === step);
  
  if (stepNameEl && stepData) {
    stepNameEl.textContent = stepData.Name.toUpperCase();
  }

  container.innerHTML = '';

  // Render only dynamic fields from additionalFieldsData
  const fieldsForStep = additionalFieldsData.filter(f => f.Step === step);
  
  fieldsForStep.forEach(f => {
    const div = document.createElement('div');
    div.className = 'field-item';
    div.setAttribute('data-field-type', 'dynamic');
    div.setAttribute('data-field-id', f.FieldId);
    div.innerHTML = `<span class="drag-handle" aria-hidden="true"></span><span>${f.DisplayName}</span>`;
    container.appendChild(div);
  });
  
  // Add "Add Field" button if no fields exist
  if (fieldsForStep.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'text-muted text-center py-3';
    emptyMsg.innerHTML = `<p class="mb-2">No fields yet</p>
      <button type="button" class="btn btn-sm btn-primary" onclick="addFieldToStep(${step})">
        ? Add Field
      </button>`;
    container.appendChild(emptyMsg);
  }

  setupFieldClickHandlers();
}

function addFieldToStep(stepNumber) {
  const stepSelect = document.getElementById('fieldStepSelect');
  stepSelect.value = stepNumber;
  modalOpenHandler();
}

function updateCounts() {
  const formStepsData = window.__formBuilderData?.formStepsData || [];
  const additionalFieldsData = window.__formBuilderData?.additionalFieldsData || [];
  
  // Update count for EVERY step in formStepsData
  formStepsData.forEach(step => {
    const fieldCount = additionalFieldsData.filter(f => f.Step === step.Order).length;
    const countEl = document.getElementById(`step${step.Order}Count`);
    
    if (countEl) {
      countEl.textContent = `${fieldCount} field${fieldCount !== 1 ? 's' : ''}`;
    }
  });
}

function switchStep(step) {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));

  // Show the selected step
  const stepElement = document.getElementById(`step${step}`);
  if (stepElement) {
    stepElement.classList.remove('hidden');
  } else {
    return;
  }

  // Update active state in left panel
  document.querySelectorAll('.step-item').forEach(s => s.classList.remove('active'));
  const stepTab = document.getElementById(`step${step}Tab`);
  if (stepTab) {
    stepTab.classList.add('active');
  }

  updateFieldsList(step);

  // Render fields for this step
  const fields = additionalFieldsData.filter(f => f.Step === step);
  let fieldsContainer = document.getElementById(`step${step}AdditionalFields`);
  
  if (fieldsContainer) {
    if (fields.length === 0) {
      fieldsContainer.innerHTML = `
        <div class="step-empty-message">
          <p>No fields added yet.</p>
          <p><button type="button" class="btn btn-sm btn-outline-primary" onclick="addFieldToStep(${step})">➕ Add Field</button></p>
        </div>
      `;
    } else {
      const emptyMsg = fieldsContainer.querySelector('.step-empty-message');
      if (emptyMsg) {
        emptyMsg.remove();
      }

      const existingFields = fieldsContainer.querySelectorAll('.additional-field-container');
      existingFields.forEach(field => field.remove());

      fields.forEach(field => {
        const fieldHtml = `
          <div class="additional-field-container" data-field-id="${field.FieldId}">
            <div class="field-actions">
              <button type="button" class="delete-field-btn" data-field-id="${field.FieldId}" onclick="deleteFieldHandler('${field.FieldId}', this)">
                🗑️
              </button>
            </div>

            <label class="form-label">
              ${field.DisplayName}
              ${field.IsRequired ? '<span class="text-danger">*</span>' : ''}
              <span class="field-type-badge">${field.FieldType}</span>
            </label>

            ${renderFieldInput(field)}
          </div>
        `;

        fieldsContainer.insertAdjacentHTML('beforeend', fieldHtml);
      });
    }
    
    // Update navigation buttons based on step position
    updateStepNavigationButtons(step);
  }

  try {
    applyConditionalLogic();
  } catch (e) {
    // Silent fail
  }
}

function updateStepNavigationButtons(currentStepOrder) {
  const formStepsData = window.__formBuilderData?.formStepsData || [];
  const currentStepEl = document.getElementById(`step${currentStepOrder}`);
  
  if (!currentStepEl) return;
  
  // Remove existing navigation buttons
  const existingNav = currentStepEl.querySelector('.step-navigation-buttons');
  if (existingNav) {
    existingNav.remove();
  }
  
  // Create navigation container
  const navContainer = document.createElement('div');
  navContainer.className = 'step-navigation-buttons mt-4 d-flex gap-2';
  
  // Get sorted active steps
  const activeSteps = formStepsData
    .filter(s => s.IsActive !== false)
    .sort((a, b) => a.Order - b.Order);
  
  const currentIndex = activeSteps.findIndex(s => s.Order === currentStepOrder);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === activeSteps.length - 1;
  
  // Add Back button (except for first step)
  if (!isFirst && currentIndex > 0) {
    const prevStep = activeSteps[currentIndex - 1];
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = 'Back';
    backBtn.setAttribute('data-prev-step', prevStep.Order);
    navContainer.appendChild(backBtn);
  }
  
  // Add Next or Submit button
  if (isLast) {
    // Last step - show Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-success';
    submitBtn.textContent = 'Submit Form';
    navContainer.appendChild(submitBtn);
  } else {
    // Not last step - show Next button
    const nextStep = activeSteps[currentIndex + 1];
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn-primary';
    nextBtn.textContent = 'Next';
    nextBtn.setAttribute('data-next-step', nextStep.Order);
    navContainer.appendChild(nextBtn);
  }
  
  // Append navigation to step container
  currentStepEl.appendChild(navContainer);
}

function renderCustomSteps() {
  // This function is no longer needed as steps are rendered server-side
  // But we keep it for backward compatibility
  updateNavigationButtons();
}

function renderFieldInput(field) {
  switch (field.FieldType) {
    case 'textarea':
      return `<textarea class="form-control" name="AdditionalFields[${field.FieldName}]" rows="3" placeholder="${field.Placeholder || ''}" ${field.IsRequired ? 'required' : ''}></textarea>`;
    case 'select':
      let optionsHtml = '<option value="">Select...</option>';
      if (field.OptionsJson) {
        try {
          const options = JSON.parse(field.OptionsJson);
          options.forEach(opt => {
            const label = opt.Label || opt.label || opt;
            const value = opt.Value || opt.value || opt;
            optionsHtml += `<option value="${value}">${label}</option>`;
          });
        } catch (e) {
          // Silent fail - invalid options JSON
        }
      }
      return `<select class="form-control form-select" name="AdditionalFields[${field.FieldName}]" ${field.IsRequired ? 'required' : ''}>${optionsHtml}</select>`;
    case 'radio':
      let radioHtml = '<div class="radio-group">';
      if (field.OptionsJson) {
        try {
          const options = JSON.parse(field.OptionsJson);
          options.forEach((opt, index) => {
            const label = opt.Label || opt.label || opt;
            const value = opt.Value || opt.value || opt;
            const isDefault = opt.IsDefault || opt.isDefault || false;
            radioHtml += `
              <div class="form-check">
                <input class="form-check-input" type="radio" name="AdditionalFields[${field.FieldName}]" id="${field.FieldName}_${index}" value="${value}" ${isDefault ? 'checked' : ''} ${field.IsRequired ? 'required' : ''}>
                <label class="form-check-label" for="${field.FieldName}_${index}">
                  ${label}
                </label>
              </div>`;
          });
        } catch (e) {
          radioHtml += '<p class="text-muted">No options configured</p>';
        }
      } else {
        radioHtml += '<p class="text-muted">No options configured</p>';
      }
      radioHtml += '</div>';
      return radioHtml;
    case 'checkbox':
      return `<input type="checkbox" class="form-check-input" name="AdditionalFields[${field.FieldName}]" value="true" ${field.IsRequired ? 'required' : ''}><input type="hidden" name="AdditionalFields[${field.FieldName}]" value="false">`;
    case 'number':
      return `<input type="number" class="form-control" name="AdditionalFields[${field.FieldName}]" placeholder="${field.Placeholder || ''}" ${field.IsRequired ? 'required' : ''}>`;
    case 'date':
      return `<input type="date" class="form-control" name="AdditionalFields[${field.FieldName}]" ${field.IsRequired ? 'required' : ''}>`;
    case 'email':
      return `<input type="email" class="form-control" name="AdditionalFields[${field.FieldName}]" placeholder="${field.Placeholder || ''}" ${field.IsRequired ? 'required' : ''}>`;
    case 'tel':
      return `<input type="tel" class="form-control" name="AdditionalFields[${field.FieldName}]" placeholder="${field.Placeholder || ''}" ${field.IsRequired ? 'required' : ''}>`;
    default:
      return `<input type="text" class="form-control" name="AdditionalFields[${field.FieldName}]" placeholder="${field.Placeholder || ''}" ${field.IsRequired ? 'required' : ''}>`;
  }
}

function updateNavigationButtons() {
  // Update step dropdown in field properties panel
  const stepSelect = document.getElementById('fpStep');
  if (!stepSelect) return;
  
  const formStepsData = window.__formBuilderData?.formStepsData || [];
  
  // Clear existing options
  stepSelect.innerHTML = '';
  
  // Add all steps from formStepsData
  formStepsData.forEach(step => {
    const option = document.createElement('option');
    option.value = step.Order;
    option.textContent = `${step.Name}`;
    stepSelect.appendChild(option);
  });
  
  // Also update field step select in add field modal
  const fieldStepSelect = document.getElementById('fieldStepSelect');
  if (fieldStepSelect) {
    fieldStepSelect.innerHTML = '';
    formStepsData.forEach(step => {
      const option = document.createElement('option');
      option.value = step.Order;
      option.textContent = `${step.Name}`;
      fieldStepSelect.appendChild(option);
    });
  }
}

// =================================
// FIELD PROPERTIES PANEL (UI)
// =================================
function clearFieldSelection() {
  document.querySelectorAll('.field-item').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.mb-3').forEach(el => el.classList.remove('field-preview-selected'));
  document.querySelectorAll('.additional-field-container').forEach(el => el.classList.remove('field-preview-selected')),

  selectedFieldData = null;

  document.getElementById('fpFieldId').value = '';
  document.getElementById('fpFieldType').value = '';
  document.getElementById('fpLabel').value = '';
  document.getElementById('fpType').value = 'text';
  document.getElementById('fpStep').value = '1';
  document.getElementById('fpPlaceholder').value = '';
  document.getElementById('fpRequired').checked = false;
  document.getElementById('fpConditional').checked = false;
  document.getElementById('fpUpdateBtn').disabled = true;
  document.getElementById('fpDeleteBtn').disabled = true;

  document.getElementById('conditionalConfig').classList.remove('show');
  document.getElementById('fpOptionsEditor').classList.remove('show');

  document.getElementById('fpLabel').disabled = false;
  document.getElementById('fpType').disabled = false;
  document.getElementById('fpStep').disabled = false;
  document.getElementById('fpPlaceholder').disabled = false;
}

function highlightPreviewField(fieldData) {
  document.querySelectorAll('.field-preview-selected').forEach(el => {
    el.classList.remove('field-preview-selected');
  });

  if (fieldData.fieldType === 'static') {
    const previewField = document.querySelector(`.mb-3[data-field-key="${fieldData.fieldKey}"]`);
    if (previewField) previewField.classList.add('field-preview-selected');
  } else {
    const previewField = document.querySelector(`.additional-field-container[data-field-id="${fieldData.fieldId}"]`);
    if (previewField) previewField.classList.add('field-preview-selected');
  }
}

function selectField(fieldData) {
  clearFieldSelection();
  selectedFieldData = fieldData;

  document.getElementById('fpFieldId').value = fieldData.fieldId || '';
  document.getElementById('fpFieldType').value = fieldData.fieldType;

  document.getElementById('fpLabel').value = fieldData.displayName;
  document.getElementById('fpType').value = fieldData.type || 'text';
  document.getElementById('fpStep').value = fieldData.step || 1;
  document.getElementById('fpPlaceholder').value = fieldData.placeholder || '';
  document.getElementById('fpRequired').checked = fieldData.isRequired || false;
  document.getElementById('fpConditional').checked = fieldData.isConditional || false;

  populateDependsOnFields(fieldData.step || 1, fieldData.fieldId);

  const conditionalConfig = document.getElementById('conditionalConfig');
  if (fieldData.isConditional) {
    conditionalConfig.classList.add('show');
    if (fieldData.conditionalLogic) {
      // Fix: Handle both PascalCase (from server) and camelCase (from client)
      const dependsOn = fieldData.conditionalLogic.DependsOnFieldKey || fieldData.conditionalLogic.dependsOnFieldKey || '';
      const showWhen = fieldData.conditionalLogic.ShowWhenValue || fieldData.conditionalLogic.showWhenValue || '';
      
      document.getElementById('fpDependsOnField').value = dependsOn;
      
      // Update the value input type (text vs dropdown) and set value
      updateConditionalValueInput(dependsOn, showWhen);
    } else {
      document.getElementById('fpDependsOnField').value = '';
      document.getElementById('fpShowWhenValue').value = '';
    }
  } else {
    conditionalConfig.classList.remove('show');
  }

  if (fieldData.fieldType === 'static') {
    document.getElementById('fpType').disabled = true;
    document.getElementById('fpPlaceholder').disabled = true;
    document.getElementById('fpUpdateBtn').disabled = false;
    document.getElementById('fpDeleteBtn').disabled = true;
  } else {
    document.getElementById('fpType').disabled = false;
    document.getElementById('fpPlaceholder').disabled = false;
    document.getElementById('fpUpdateBtn').disabled = false;
    document.getElementById('fpDeleteBtn').disabled = false;
  }

  toggleOptionsEditor(fieldData.type === 'select' || fieldData.type === 'radio', fieldData);

  if (fieldData.fieldType === 'static') {
    const leftItem = document.querySelector(`.field-item[data-field-key="${fieldData.fieldKey}"]`);
    if (leftItem) leftItem.classList.add('selected');
  } else {
    const leftItem = document.querySelector(`.field-item[data-field-id="${fieldData.fieldId}"]`);
    if (leftItem) leftItem.classList.add('selected');
  }

  highlightPreviewField(fieldData);
}

function refreshDynamicFieldPreview(fieldId, updatedData) {
  const container = document.querySelector(`.additional-field-container[data-field-id="${fieldId}"]`);
  if (!container) return;

  const labelEl = container.querySelector('label');
  if (labelEl) {
    const labelText = labelEl.childNodes[0];
    if (labelText.nodeType === Node.TEXT_NODE) {
      labelText.textContent = updatedData.DisplayName + ' ';
    }

    const requiredStar = labelEl.querySelector('.text-danger');
    if (updatedData.IsRequired && !requiredStar) {
      const star = document.createElement('span');
      star.className = 'text-danger';
      star.textContent = '*';
      labelEl.insertBefore(star, labelEl.querySelector('.field-type-badge'));
    } else if (!updatedData.IsRequired && requiredStar) {
      requiredStar.remove();
    }

    const typeBadge = labelEl.querySelector('.field-type-badge');
    if (typeBadge) {
      typeBadge.textContent = updatedData.FieldType;
    }
  }

  // Remove existing input/select/textarea/radio-group
  const existingInput = container.querySelector('input:not([type="hidden"]), select, textarea, .radio-group');
  if (existingInput) {
    existingInput.remove();
  }

  let newInput;
  if (updatedData.FieldType === 'textarea') {
    newInput = document.createElement('textarea');
    newInput.className = 'form-control';
    newInput.rows = 3;
    newInput.placeholder = updatedData.Placeholder || '';
  } else if (updatedData.FieldType === 'select') {
    newInput = document.createElement('select');
    newInput.className = 'form-control form-select';
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select an option...';
    newInput.appendChild(placeholderOption);

    if (updatedData.OptionsJson) {
      try {
        const options = JSON.parse(updatedData.OptionsJson);
        options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.Value || opt.value;
          option.textContent = opt.Label || opt.label;
          if (opt.IsDefault || opt.isDefault) {
            option.selected = true;
          }
          newInput.appendChild(option);
        });
      } catch (e) {
        console.error('Error parsing options for preview:', e);
      }
    }
  } else if (updatedData.FieldType === 'radio') {
    newInput = document.createElement('div');
    newInput.className = 'radio-group';

    if (updatedData.OptionsJson) {
      try {
        const options = JSON.parse(updatedData.OptionsJson);
        options.forEach((opt, index) => {
          const label = opt.Label || opt.label || opt;
          const value = opt.Value || opt.value || opt;
          const isDefault = opt.IsDefault || opt.isDefault || false;

          const div = document.createElement('div');
          div.className = 'form-check';

          const input = document.createElement('input');
          input.className = 'form-check-input';
          input.type = 'radio';
          input.name = `AdditionalFields[${updatedData.FieldName}]`;
          input.id = `${updatedData.FieldName}_${index}`;
          input.value = value;
          if (isDefault) {
            input.checked = true;
          }
          if (updatedData.IsRequired) {
            input.setAttribute('required', '');
          }

          const radioLabel = document.createElement('label');
          radioLabel.className = 'form-check-label';
          radioLabel.setAttribute('for', `${updatedData.FieldName}_${index}`);
          radioLabel.textContent = label;

          div.appendChild(input);
          div.appendChild(radioLabel);
          newInput.appendChild(div);
        });
      } catch (e) {
        console.error('Error parsing radio options for preview:', e);
      }
    }
  } else {
    newInput = document.createElement('input');
    newInput.type = updatedData.FieldType;
    newInput.className = 'form-control';
    newInput.placeholder = updatedData.Placeholder || '';
  }

  const label = container.querySelector('label');
  if (label) {
    label.parentNode.insertBefore(newInput, label.nextSibling);
  } else {
    container.appendChild(newInput);
  }
}

// =================================
// DROPDOWN OPTIONS EDITOR - SIMPLIFIED
// =================================

/**
 * Dynamically switches the "Equals Value" input between a text box and a dropdown
 * based on the selected "Depends On" field's type.
 */
function updateConditionalValueInput(dependsOnFieldId, currentValue = '') {
    const valueInput = document.getElementById('fpShowWhenValue');
    if (!valueInput) return;

    // Find the dependent field data
    let dependentField = null;
    
    // Try dynamic fields
    const additionalFieldsData = window.__formBuilderData?.additionalFieldsData || [];
    dependentField = additionalFieldsData.find(f => String(f.FieldId) === String(dependsOnFieldId));
    
    const fieldType = (dependentField?.FieldType || '').toLowerCase();
    const useDropdown = (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox');

    let currentInput = document.getElementById('fpShowWhenValue');
    
    if (useDropdown) {
        // Create or ensure select element
        if (currentInput.tagName !== 'SELECT') {
            const select = document.createElement('select');
            select.id = 'fpShowWhenValue';
            select.className = 'fp-select';
            currentInput.replaceWith(select);
            currentInput = select;
        }
        
        // Populate options
        let options = [];
        if (fieldType === 'checkbox') {
            options = [
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' }
            ];
        } else if (dependentField && dependentField.OptionsJson) {
            try {
                const parsed = JSON.parse(dependentField.OptionsJson);
                if (Array.isArray(parsed)) {
                    options = parsed.map(o => ({ 
                      label: o.Label || o.label || o.Value || o.value || o, 
                      value: o.Value || o.value || o.Label || o.label || o 
                    }));
                }
            } catch (e) { console.error('Error parsing OptionsJson in updateConditionalValueInput:', e); }
        }
        
        currentInput.innerHTML = '<option value="">Select value...</option>';
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (String(opt.value).toLowerCase() === String(currentValue).toLowerCase()) {
                option.selected = true;
            }
            currentInput.appendChild(option);
        });
    } else {
        // Create or ensure text input
        if (currentInput.tagName !== 'INPUT') {
            const input = document.createElement('input');
            input.id = 'fpShowWhenValue';
            input.type = 'text';
            input.className = 'fp-input';
            input.placeholder = 'e.g., Yes, true, Male';
            currentInput.replaceWith(input);
            currentInput = input;
        }
        currentInput.value = currentValue;
    }
}

function toggleOptionsEditor(show, fieldData) {
  const editor = document.getElementById('fpOptionsEditor');
  if (!editor) return;

  if (show) {
    editor.classList.add('show');

    const list = document.getElementById('fpOptionsList');
    list.innerHTML = '';

    let options = [];
    if (fieldData && fieldData.optionsJson) {
      try {
        const parsedOptions = JSON.parse(fieldData.optionsJson);
        options = parsedOptions.map(opt => ({
          label: opt.Label || opt.label || opt.Value || opt.value || '',
          value: opt.Value || opt.value || opt.Label || opt.label || '',
          isDefault: opt.IsDefault || opt.isDefault || false
        }));
      } catch (e) {
        options = [];
      }
    }

    if (!options || options.length === 0) {
      options = [
        { label: 'Option 1', value: 'option_1', isDefault: false },
        { label: 'Option 2', value: 'option_2', isDefault: false },
        { label: 'Option 3', value: 'option_3', isDefault: true }
      ];
    }

    options.forEach((opt, idx) => {
      const el = createOptionEditorRow(opt.label, opt.isDefault, idx);
      list.appendChild(el);
    });

    ensureOneDefaultChecked();
  } else {
    editor.classList.remove('show');
  }
}
/*
  events.js
  Event bindings (delegated where appropriate) for the Form Builder page.
*/

// =================================
// AJAX FIELD / STEP SUBMISSION
// =================================
async function submitAddFieldForm() {
  const fieldLabel = document.getElementById('fieldLabelInput').value.trim();
  if (!fieldLabel) {
    showToast('Field Label is required', 'error');
    document.getElementById('fieldLabelInput').focus();
    return;
  }

  const fieldData = {
    DisplayName: fieldLabel,
    FieldType: document.getElementById('fieldTypeSelect').value,
    Step: parseInt(document.getElementById('fieldStepSelect').value),
    Placeholder: document.getElementById('fieldPlaceholderInput').value.trim(),
    IsRequired: document.getElementById('requiredCheckbox').classList.contains('checked'),
    IsConditional: document.getElementById('conditionalCheckbox').classList.contains('checked')
  };

  showToast('Adding field...', 'info');

  try {
    const response = await fetch(window.__formBuilderData.urls.addAdditionalField, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RequestVerificationToken': getToken()
      },
      body: JSON.stringify(fieldData)
    });

    const result = await response.json();

    if (result.success) {
      showToast(result.message, 'success');
      modalCloseHandler();

      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Error adding field: ' + error.message, 'error');
  }
}

async function submitAddStepForm() {
  const stepName = document.getElementById('stepNameInput').value.trim();
  if (!stepName) {
    showToast('Step Name is required', 'error');
    document.getElementById('stepNameInput').focus();
    return;
  }

  const stepData = {
    StepName: stepName,
    StepDescription: document.getElementById('stepDescriptionInput').value.trim(),
    StepIcon: document.getElementById('stepIconSelect').value,
    StepOrder: parseInt(document.getElementById('stepPositionSelect').value) + 1
  };

  showToast('Adding step...', 'info');

  try {
    const response = await fetch(window.__formBuilderData.urls.addCustomStep, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RequestVerificationToken': getToken()
      },
      body: JSON.stringify(stepData)
    });

    const result = await response.json();

    if (result.success) {
      showToast(result.message, 'success');
      stepModalCloseHandler();

      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Error adding step: ' + error.message, 'error');
  }
}

async function submitUpdateStepForm() {
  const stepId = document.getElementById('editingStepId').value;
  if (!stepId) {
    showToast('No step selected', 'error');
    return;
  }

  const stepName = document.getElementById('stepNameInput').value.trim();
  if (!stepName) {
    showToast('Step Name is required', 'error');
    document.getElementById('stepNameInput').focus();
    return;
  }

  const stepData = {
    StepId: stepId,
    StepName: stepName,
    StepDescription: document.getElementById('stepDescriptionInput').value.trim(),
    StepIcon: document.getElementById('stepIconSelect').value,
    StepOrder: parseInt(document.getElementById('stepPositionSelect').value) + 1
  };

  showToast('Updating step...', 'info');

  try {
    const response = await fetch(window.__formBuilderData.urls.updateCustomStep, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RequestVerificationToken': getToken()
      },
      body: JSON.stringify(stepData)
    });

    const result = await response.json();
    if (result.success) {
      showToast(result.message, 'success');
      stepModalCloseHandler();
      setTimeout(() => location.reload(), 1000);
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Error updating step: ' + error.message, 'error');
  }
}

async function deleteFieldHandler(fieldId, button) {
  if (!confirm('Are you sure you want to delete this field?')) {
    return;
  }

  const fieldContainer = button.closest('.additional-field-container');

  try {
    const response = await fetch(window.__formBuilderData.urls.deleteAdditionalField, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RequestVerificationToken': getToken()
      },
      body: JSON.stringify({ FieldId: fieldId })
    });

    const result = await response.json();

    if (result.success) {
      showToast(result.message, 'success');

      fieldContainer.style.transition = 'opacity 0.3s';
      fieldContainer.style.opacity = '0';
      setTimeout(() => {
        fieldContainer.remove();
        try {
          const leftEl = document.querySelector(`#fieldsList [data-field-id="${fieldId}"]`);
          if (leftEl) leftEl.remove();
        } catch (e) { }
        try { updateCounts(); } catch (e) { }
      }, 300);

      const indexToRemove = additionalFieldsData.findIndex(f => f.FieldId === fieldId);
      if (indexToRemove > -1) {
        additionalFieldsData.splice(indexToRemove, 1);
      }
    } else {
      showToast(result.message || 'Failed to delete field', 'error');
    }
  } catch (error) {
    showToast('Error deleting field: ' + error.message, 'error');
  }
}

async function deleteStepHandler(stepId) {
  if (!confirm('Are you sure you want to delete this step? All fields in this step will also be deleted.')) {
    return;
  }

  try {
    const response = await fetch(window.__formBuilderData.urls.deleteCustomStep, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RequestVerificationToken': getToken()
      },
      body: JSON.stringify({ StepId: stepId })
    });

    const result = await response.json();

    if (result.success) {
      showToast(result.message, 'success');
      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Error deleting step: ' + error.message, 'error');
  }
}

// =================================
// FIELD PROPERTIES PANEL ACTIONS
// =================================
async function updateSelectedField() {
  if (!selectedFieldData) {
    showToast('No field selected', 'error');
    return;
  }

  const updatedData = {
    DisplayName: document.getElementById('fpLabel').value.trim(),
    FieldType: document.getElementById('fpType').value,
    Step: parseInt(document.getElementById('fpStep').value),
    Placeholder: document.getElementById('fpPlaceholder').value.trim(),
    IsRequired: document.getElementById('fpRequired').checked,
    IsConditional: document.getElementById('fpConditional').checked
  };

  // Handle options for both select and radio fields
  if (updatedData.FieldType === 'select' || updatedData.FieldType === 'radio') {
    const options = getOptionsFromEditor();
    if (options.length === 0) {
      showToast(`At least one option is required for ${updatedData.FieldType === 'radio' ? 'radio' : 'dropdown'} fields`, 'error');
      return;
    }
    updatedData.OptionsJson = JSON.stringify(options);
  }

  if (updatedData.IsConditional) {
    const dependsOn = document.getElementById('fpDependsOnField').value;
    const showWhen = document.getElementById('fpShowWhenValue').value.trim();

    if (dependsOn && showWhen) {
      updatedData.ConditionalLogicJson = JSON.stringify({
        DependsOnFieldKey: dependsOn,
        ShowWhenValue: showWhen
      });
    } else {
      showToast('Conditional field requires both "Depends On" field and "Equals Value"', 'error');
      return;
    }
  } else {
    updatedData.ConditionalLogicJson = null;
  }

  if (!updatedData.DisplayName) {
    showToast('Field label is required', 'error');
    return;
  }

  if (selectedFieldData.fieldType === 'dynamic') {
    try {
      const response = await fetch(window.__formBuilderData.urls.updateAdditionalField, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RequestVerificationToken': getToken()
        },
        body: JSON.stringify({
          FieldId: selectedFieldData.fieldId,
          ...updatedData
        })
      });

      const result = await response.json();
      if (result.success) {
        showToast(result.message, 'success');
        if (updatedData.Step !== selectedFieldData.step) {
          setTimeout(() => location.reload(), 1000);
        } else {
          const leftItem = document.querySelector(`.field-item[data-field-id="${selectedFieldData.fieldId}"]`);
          if (leftItem) {
            leftItem.querySelector('span:last-child').textContent = updatedData.DisplayName;
          }

          refreshDynamicFieldPreview(selectedFieldData.fieldId, updatedData);

          const localField = additionalFieldsData.find(f => f.FieldId === selectedFieldData.fieldId);
          if (localField) {
            Object.assign(localField, {
              DisplayName: updatedData.DisplayName,
              FieldType: updatedData.FieldType,
              Placeholder: updatedData.Placeholder,
              IsRequired: updatedData.IsRequired,
              IsConditional: updatedData.IsConditional,
              ConditionalLogicJson: updatedData.ConditionalLogicJson,
              Step: updatedData.Step,
              OptionsJson: updatedData.OptionsJson
            });
          }

          selectedFieldData.displayName = updatedData.DisplayName;
          selectedFieldData.type = updatedData.FieldType;
          selectedFieldData.placeholder = updatedData.Placeholder;
          selectedFieldData.isRequired = updatedData.IsRequired;
          selectedFieldData.isConditional = updatedData.IsConditional;
          selectedFieldData.step = updatedData.Step;

          try { applyConditionalLogic(); } catch (e) { }
        }
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Error updating field: ' + error.message, 'error');
    }
  } else {
    try {
      const response = await fetch(window.__formBuilderData.urls.updateFieldLabel, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RequestVerificationToken': getToken()
        },
        body: JSON.stringify({
          fieldKey: selectedFieldData.fieldKey,
          label: updatedData.DisplayName
        })
      });

      const result = await response.json();
      if (result.success) {
        showToast('Label updated successfully', 'success');

        const leftItem = document.querySelector(`.field-item[data-field-key="${selectedFieldData.fieldKey}"]`);
        if (leftItem) {
          leftItem.querySelector('span:last-child').textContent = updatedData.DisplayName;
        }

        const previewField = document.querySelector(`.mb-3[data-field-key="${selectedFieldData.fieldKey}"] label`);
        if (previewField) {
          previewField.textContent = updatedData.DisplayName;
        }

        selectedFieldData.displayName = updatedData.DisplayName;
      } else {
        showToast(result.message || 'Error updating label', 'error');
      }
    } catch (error) {
      showToast('Error updating label: ' + error.message, 'error');
    }
  }
}

async function deleteSelectedField() {
  if (!selectedFieldData || selectedFieldData.fieldType === 'static') {
    showToast('Cannot delete static fields', 'error');
    return;
  }

  if (!confirm(`Are you sure you want to delete "${selectedFieldData.displayName}"?`)) {
    return;
  }

  try {
    const response = await fetch(window.__formBuilderData.urls.deleteAdditionalField, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RequestVerificationToken': getToken()
      },
      body: JSON.stringify({ FieldId: selectedFieldData.fieldId })
    });

    const result = await response.json();
    if (result.success) {
      showToast(result.message, 'success');

      const leftItem = document.querySelector(`.field-item[data-field-id="${selectedFieldData.fieldId}"]`);
      if (leftItem) leftItem.remove();

      const previewField = document.querySelector(`.additional-field-container[data-field-id="${selectedFieldData.fieldId}"]`);
      if (previewField) {
        previewField.style.transition = 'opacity 0.3s';
        previewField.style.opacity = '0';
        setTimeout(() => previewField.remove(), 300);
      }

      clearFieldSelection();

      try { updateCounts(); } catch (e) { }
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Error deleting field: ' + error.message, 'error');
  }
}

// =================================
// FIELD CLICK HANDLERS (delegated attachment)
// =================================
function setupFieldClickHandlers() {
  document.querySelectorAll('.field-item').forEach(item => {
    item.addEventListener('click', function (e) {
      e.stopPropagation();

      const fieldType = this.getAttribute('data-field-type');
      const fieldKey = this.getAttribute('data-field-key');
      const fieldId = this.getAttribute('data-field-id');
      const displayName = this.querySelector('span:last-child').textContent;

      if (fieldType === 'static') {
        let step = 1;
        const previewEl = document.querySelector(`.mb-3[data-field-key="${fieldKey}"]`);
        if (previewEl) {
          const stepContainer = previewEl.closest('.form-step');
          if (stepContainer) {
            step = parseInt(stepContainer.id.replace('step', '')) || 1;
          }
        }

        selectField({
          fieldType: 'static',
          fieldKey: fieldKey,
          displayName: displayName,
          type: 'text',
          step: step,
          placeholder: '',
          isRequired: false,
          isConditional: false
        });
      } else if (fieldType === 'dynamic' && fieldId) {
        const fieldData = additionalFieldsData.find(f => f.FieldId === fieldId);
        if (fieldData) {
          let conditionalLogic = null;
          if (fieldData.ConditionalLogicJson) {
            try {
              conditionalLogic = JSON.parse(fieldData.ConditionalLogicJson);
            } catch (e) {
              // Silent fail
            }
          }

          selectField({
            fieldType: 'dynamic',
            fieldId: fieldId,
            displayName: fieldData.DisplayName,
            type: fieldData.FieldType,
            step: fieldData.Step,
            placeholder: fieldData.Placeholder || '',
            isRequired: fieldData.IsRequired || false,
            isConditional: fieldData.IsConditional || false,
            conditionalLogic: conditionalLogic,
            optionsJson: fieldData.OptionsJson || null
          });
        }
      }
    });
  });
}

// =================================
// EVENT BINDINGS
// =================================
function bindFormBuilderEvents() {
  if (!window.__formBuilderData) return;

  // Open modal button
  const openModalBtn = document.getElementById('openModalBtn');
  if (openModalBtn) {
    openModalBtn.addEventListener('click', modalOpenHandler);
  }

  // Step navigation (initial steps + dynamically injected custom steps)
  document.addEventListener('click', function (e) {
    const stepItem = e.target.closest('.step-item');
    if (stepItem && stepItem.hasAttribute('data-step')) {
      const step = parseInt(stepItem.getAttribute('data-step'));
      if (!isNaN(step)) {
        switchStep(step);
      }
    }

    if (e.target.matches('[data-next-step]')) {
      const step = parseInt(e.target.getAttribute('data-next-step'));
      if (!isNaN(step)) {
        switchStep(step);
      }
    }

    if (e.target.matches('[data-prev-step]')) {
      const step = parseInt(e.target.getAttribute('data-prev-step'));
      if (!isNaN(step)) {
        switchStep(step);
      }
    }

    // Delete field buttons (delegated)
    const deleteBtn = e.target.closest('.delete-field-btn');
    if (deleteBtn) {
      const fieldId = deleteBtn.getAttribute('data-field-id');
      if (fieldId) {
        deleteFieldHandler(fieldId, deleteBtn);
      }
    }
  });

  // Checkbox click handlers
  const requiredRow = document.getElementById('requiredCheckboxRow');
  if (requiredRow) {
    requiredRow.addEventListener('click', function () {
      toggleCheckbox('required');
    });
  }

  const conditionalRow = document.getElementById('conditionalCheckboxRow');
  if (conditionalRow) {
    conditionalRow.addEventListener('click', function () {
      toggleCheckbox('conditional');
    });
  }

  // HasAllergies select
  const hasAllergiesSel = document.getElementById('HasAllergiesSelect');
  if (hasAllergiesSel) {
    hasAllergiesSel.addEventListener('change', updateAllergyVisibility);
  }

  // Enter key in modals
  const fieldLabelInput = document.getElementById('fieldLabelInput');
  if (fieldLabelInput) {
    fieldLabelInput.addEventListener('keydown', handleModalEnterKey);
  }

  const stepNameInput = document.getElementById('stepNameInput');
  if (stepNameInput) {
    stepNameInput.addEventListener('keydown', handleModalEnterKey);
  }

  // Escape key
  document.addEventListener('keydown', handleEscapeKey);

  // Prevent form submission on Enter in modals
  const modalInputs = document.querySelectorAll('#addFieldModal input, #addFieldModal select, #addStepModal input, #addStepModal select');
  modalInputs.forEach(input => {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (isModalOpen || isStepModalOpen)) {
        e.stopPropagation();
      }
    });
  });

  // Field properties panel buttons
  const updateBtn = document.getElementById('fpUpdateBtn');
  if (updateBtn) {
    updateBtn.addEventListener('click', updateSelectedField);
  }

  const deleteBtn = document.getElementById('fpDeleteBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteSelectedField);
  }

  // Conditional field changes
  const fpDependsOnField = document.getElementById('fpDependsOnField');
  if (fpDependsOnField) {
    fpDependsOnField.addEventListener('change', function () {
      updateConditionalValueInput(this.value);
    });
  }

  const fpConditional = document.getElementById('fpConditional');
  if (fpConditional) {
    fpConditional.addEventListener('change', function () {
      const config = document.getElementById('conditionalConfig');
      if (this.checked) {
        config.classList.add('show');
      } else {
        config.classList.remove('show');
      }
    });
  }

  // Field type change
  const fpType = document.getElementById('fpType');
  if (fpType) {
    fpType.addEventListener('change', function () {
      const isSelect = this.value === 'select' || this.value === 'radio';
      toggleOptionsEditor(isSelect, selectedFieldData);
    });
  }

  // Add option button
  const addOptionBtn = document.getElementById('fpAddOptionBtn');
  if (addOptionBtn) {
    addOptionBtn.addEventListener('click', function () {
      const list = document.getElementById('fpOptionsList');
      const newRow = createOptionEditorRow('', false, list.children.length);
      list.appendChild(newRow);
    });
  }
}

window.bindFormBuilderEvents = bindFormBuilderEvents;
