/*
  formbuilder.bundle.js
  Bundled delivery file for the Form Builder page.
  Concatenation order (must not change):
    1) state.js
    2) core.js
    3) ui.js
    4) events.js
    5) step4-form-capture-fix.js
    6) form-builder-fix.js
*/

/* =========================
   1) state.js
   ========================= */
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

/* =========================
   2) core.js
   ========================= */
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
  icon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

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
  dropdown.innerHTML = '<option value="">Select field...</option>';

  const staticFieldsMap = {
    1: [
      { key: 'FullName', label: 'Full Name' },
      { key: 'Age', label: 'Age' },
      { key: 'Gender', label: 'Gender' },
      { key: 'DateOfBirth', label: 'Date of Birth' }
    ],
    2: [
      { key: 'HasAllergies', label: 'Has Allergies' },
      { key: 'AllergyDescription', label: 'Allergy Description' },
      { key: 'CurrentMedication', label: 'Current Medication' },
      { key: 'HeightCm', label: 'Height (cm)' },
      { key: 'WeightKg', label: 'Weight (kg)' }
    ],
    3: [
      { key: 'ContactName', label: 'Contact Name' },
      { key: 'Relationship', label: 'Relationship' },
      { key: 'PhoneNumber', label: 'Phone Number' },
      { key: 'HasAlternativeContact', label: 'Has Alternative Contact' },
      { key: 'AltContactName', label: 'Alt Contact Name' },
      { key: 'AltPhoneNumber', label: 'Alt Phone Number' }
    ]
  };

  for (let step = 1; step <= currentStep; step++) {
    if (staticFieldsMap[step]) {
      staticFieldsMap[step].forEach(field => {
        const option = document.createElement('option');
        option.value = field.key;
        option.textContent = `${field.label} (Step ${step})`;
        dropdown.appendChild(option);
      });
    }

    additionalFieldsData
      .filter(f => f.Step === step && f.FieldId !== excludeFieldId)
      .forEach(f => {
        const option = document.createElement('option');
        option.value = f.FieldId;
        option.textContent = `${f.DisplayName} (Step ${step})`;
        dropdown.appendChild(option);
      });
  }
}

function applyConditionalLogic() {
  additionalFieldsData.forEach(field => {
    if (!field.IsConditional || !field.ConditionalLogicJson) return;

    try {
      const condition = JSON.parse(field.ConditionalLogicJson);
      const fieldContainer = document.querySelector(`.additional-field-container[data-field-id="${field.FieldId}"]`);
      if (!fieldContainer) return;

      const dependsOnFieldKey = condition.DependsOnFieldKey || condition.dependsOnFieldKey;
      const showWhenValue = condition.ShowWhenValue || condition.showWhenValue;

      if (!dependsOnFieldKey || !showWhenValue) return;

      let dependentField = null;

      dependentField = document.querySelector(`[data-field-key="${dependsOnFieldKey}"] select, [data-field-key="${dependsOnFieldKey}"] input`);

      if (!dependentField) {
        const depContainer = document.querySelector(`.additional-field-container[data-field-id="${dependsOnFieldKey}"]`);
        if (depContainer) {
          dependentField = depContainer.querySelector('input, select, textarea');
        }
      }

      if (!dependentField) return;

      const checkVisibility = () => {
        const fieldValue = dependentField.value;
        const normalizedFieldValue = String(fieldValue).toLowerCase().trim();
        const normalizedShowWhen = String(showWhenValue).toLowerCase().trim();
        const shouldShow = normalizedFieldValue === normalizedShowWhen;

        if (shouldShow) {
          fieldContainer.style.display = 'block';
          fieldContainer.style.opacity = '0';
          setTimeout(() => {
            fieldContainer.style.transition = 'opacity 0.3s';
            fieldContainer.style.opacity = '1';
          }, 10);
        } else {
          fieldContainer.style.transition = 'opacity 0.3s';
          fieldContainer.style.opacity = '0';
          setTimeout(() => {
            if (fieldContainer.style.opacity === '0') {
              fieldContainer.style.display = 'none';
            }
          }, 300);
        }
      };

      checkVisibility();

      dependentField.addEventListener('change', checkVisibility);
      dependentField.addEventListener('input', checkVisibility);
    } catch (e) {
      console.error('Error applying conditional logic:', e);
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

  additionalFieldsData = window.__formBuilderData.additionalFieldsData || [];
  customStepsData = window.__formBuilderData.customStepsData || [];
  originalFields = window.__formBuilderData.originalFields || {};

  customSteps = customStepsData || [];

  if (customSteps.length > 0) {
    renderCustomSteps();
  }

  switchStep(1);

  try { updateCounts(); } catch (e) { }
  try { updateAllergyVisibility(); } catch (e) { }

  try { applyConditionalLogic(); } catch (e) { console.error('Error applying conditional logic:', e); }

  setupFieldClickHandlers();
}

window.initFormBuilderPage = initFormBuilderPage;

/* =========================
   3) ui.js
   ========================= */
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
  document.getElementById('stepIconSelect').value = '📋';
  document.getElementById('stepPositionSelect').value = '3';
  document.getElementById('editingStepId').value = '';
}

function editStepModalOpenHandler(stepId) {
  const step = customSteps.find(s => s.FieldId === stepId);
  if (!step) {
    showToast('Step not found', 'error');
    return;
  }
  const modal = document.getElementById('addStepModal');
  modal.classList.add('show');
  isStepModalOpen = true;
  document.body.style.overflow = 'hidden';
  document.querySelector('#addStepModal .modal-title').textContent = 'Edit Step';
  document.getElementById('stepNameInput').value = step.DisplayName || '';
  document.getElementById('stepDescriptionInput').value = step.Placeholder || '';
  document.getElementById('stepIconSelect').value = step.OptionsJson || '📋';
  document.getElementById('stepPositionSelect').value = String((step.Step || 4) - 1);
  document.getElementById('editingStepId').value = step.FieldId;
  document.getElementById('addStepSubmitBtn').style.display = 'none';
  document.getElementById('updateStepSubmitBtn').style.display = '';
}

// =================================
// FORM NAV / RENDERING
// =================================
function getLastStepNumber() {
  const customStepNumbers = customSteps.map(s => s.Step);
  const maxCustomStep = customStepNumbers.length > 0 ? Math.max(...customStepNumbers) : 0;
  return Math.max(3, maxCustomStep);
}

function isLastStep(stepNumber) {
  return stepNumber === getLastStepNumber();
}

function updateFieldsList(step) {
  const container = document.getElementById('fieldsList');
  const stepNameEl = document.getElementById('currentStepName');
  const names = {
    1: 'PERSONAL INFORMATION',
    2: 'HEALTH DETAILS',
    3: 'EMERGENCY CONTACT'
  };

  if (stepNameEl && step <= 3) {
    stepNameEl.textContent = names[step] || '';
  } else if (stepNameEl) {
    const stepData = customSteps.find(s => s.Step === step);
    if (stepData) {
      stepNameEl.textContent = stepData.DisplayName.toUpperCase();
    }
  }

  container.innerHTML = '';

  if (step <= 3) {
    const fieldKeyMap = {
      1: { 'Full Name': 'FullName', 'Age': 'Age', 'Gender': 'Gender', 'Date of Birth': 'DateOfBirth' },
      2: {
        'Has Allergies': 'HasAllergies',
        'Allergy Description': 'AllergyDescription',
        'Current Medication': 'CurrentMedication',
        'Height (cm)': 'HeightCm',
        'Weight (kg)': 'WeightKg'
      },
      3: {
        'Contact Name': 'ContactName',
        'Relationship': 'Relationship',
        'Phone Number': 'PhoneNumber',
        'Has Alternative Contact': 'HasAlternativeContact',
        'Alt Contact Name': 'AltContactName',
        'Alt Phone Number': 'AltPhoneNumber'
      }
    };

    (originalFields[step] || []).forEach((name) => {
      const div = document.createElement('div');
      div.className = 'field-item';
      div.setAttribute('data-field-type', 'static');
      const fieldKey = fieldKeyMap[step] ? fieldKeyMap[step][name] : name.replace(/\s+/g, '');
      div.setAttribute('data-field-key', fieldKey);
      div.innerHTML = `<span class="drag-handle" aria-hidden="true"></span><span>${name}</span>`;
      container.appendChild(div);
    });

    additionalFieldsData.filter(f => f.Step === step).forEach(f => {
      const div = document.createElement('div');
      div.className = 'field-item';
      div.setAttribute('data-field-type', 'dynamic');
      div.setAttribute('data-field-id', f.FieldId);
      div.innerHTML = `<span class="drag-handle" aria-hidden="true"></span><span>${f.DisplayName}</span>`;
      container.appendChild(div);
    });
  } else {
    const stepData = customSteps.find(s => s.Step === step);
    const stepName = stepData ? stepData.DisplayName : `Step ${step}`;

    const infoDiv = document.createElement('div');
    infoDiv.className = 'alert alert-info mb-3';
    infoDiv.innerHTML = `
      <strong>${stepName}</strong><br>
      Fields in this custom step:
    `;
    container.appendChild(infoDiv);

    additionalFieldsData.filter(f => f.Step === step).forEach(f => {
      const div = document.createElement('div');
      div.className = 'field-item';
      div.setAttribute('data-field-type', 'dynamic');
      div.setAttribute('data-field-id', f.FieldId);
      div.innerHTML = `<span class="drag-handle" aria-hidden="true"></span><span>${f.DisplayName}</span>`;
      container.appendChild(div);
    });

    const addButtonDiv = document.createElement('div');
    addButtonDiv.className = 'mt-3';
    addButtonDiv.innerHTML = `
      <button type="button" class="btn btn-sm btn-primary w-100" onclick="addFieldToStep(${step})">
        ➕ Add Field to This Step
      </button>
    `;
    container.appendChild(addButtonDiv);
  }

  setupFieldClickHandlers();
}

function addFieldToStep(stepNumber) {
  const stepSelect = document.getElementById('fieldStepSelect');

  let optionExists = false;
  for (let i = 0; i < stepSelect.options.length; i++) {
    if (parseInt(stepSelect.options[i].value) === stepNumber) {
      optionExists = true;
      break;
    }
  }

  if (!optionExists) {
    const stepData = customSteps.find(s => s.Step === stepNumber);
    const stepName = stepData ? stepData.DisplayName : `Step ${stepNumber}`;
    const option = document.createElement('option');
    option.value = stepNumber;
    option.textContent = `${stepName} (Custom)`;
    stepSelect.appendChild(option);
  }

  stepSelect.value = stepNumber;
  modalOpenHandler();
}

function updateAllergyVisibility() {
  const sel = document.getElementById('HasAllergiesSelect');
  const group = document.getElementById('allergyDescriptionGroup');
  if (!group) return;
  const val = sel ? String(sel.value).toLowerCase() : '';
  if (val === 'true') {
    group.classList.remove('d-none');
  } else {
    group.classList.add('d-none');
  }
}

function updateCounts() {
  const counts = {
    1: (originalFields[1] ? originalFields[1].length : 0) + additionalFieldsData.filter(f => f.Step === 1).length,
    2: (originalFields[2] ? originalFields[2].length : 0) + additionalFieldsData.filter(f => f.Step === 2).length,
    3: (originalFields[3] ? originalFields[3].length : 0) + additionalFieldsData.filter(f => f.Step === 3).length,
  };

  Object.keys(counts).forEach(k => {
    const el = document.getElementById(`step${k}Count`);
    if (el) el.textContent = `${counts[k]} fields`;
  });

  customSteps.forEach(step => {
    const stepNumber = step.Step;
    const fieldCount = additionalFieldsData.filter(f => f.Step === stepNumber).length;
    const countEl = document.getElementById(`step${stepNumber}Count`);
    if (countEl) {
      countEl.textContent = `${fieldCount} fields`;
    }
  });
}

function switchStep(step) {
  console.log('Switching to step:', step);

  document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));

  const stepElement = document.getElementById(`step${step}`);
  if (stepElement) {
    stepElement.classList.remove('hidden');
  } else {
    console.error(`Step element #step${step} not found`);
    return;
  }

  document.querySelectorAll('.step-item').forEach(s => s.classList.remove('active'));
  const stepTab = document.getElementById(`step${step}Tab`);
  if (stepTab) {
    stepTab.classList.add('active');
  }

  updateFieldsList(step);

  if (step > 3) {
    const stepData = customSteps.find(s => s.Step === step);
    if (stepData) {
      let fieldsContainer = document.getElementById(`step${step}AdditionalFields`);
      if (!fieldsContainer) {
        fieldsContainer = stepElement.querySelector('.dynamic-step-fields');
        if (fieldsContainer) {
          fieldsContainer.id = `step${step}AdditionalFields`;
        }
      }

      if (fieldsContainer) {
        const fields = additionalFieldsData.filter(f => f.Step === step);

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
      }
    }
  }

  try {
    if (step === 2) {
      updateAllergyVisibility();
    }
  } catch (e) {
    console.error('Error updating allergy visibility:', e);
  }

  try {
    applyConditionalLogic();
  } catch (e) {
    console.error('Error applying conditional logic:', e);
  }
}

function renderCustomSteps() {
  const stepsContainer = document.getElementById('customStepsContainer');
  const formsContainer = document.getElementById('customStepsForms');

  if (!stepsContainer || !formsContainer) return;

  stepsContainer.innerHTML = '';
  formsContainer.innerHTML = '';

  customSteps.sort((a, b) => a.Step - b.Step);

  customSteps.forEach(step => {
    const stepNumber = step.Step;
    const fieldCount = additionalFieldsData.filter(f => f.Step === stepNumber).length;

    const stepTab = document.createElement('div');
    stepTab.className = 'step-item';
    stepTab.id = `step${stepNumber}Tab`;
    stepTab.setAttribute('data-step', stepNumber);
    stepTab.setAttribute('data-step-id', step.FieldId);

    stepTab.innerHTML = `
      <div class="step-pill">
        <div>
          <div class="step-title">Step ${stepNumber}</div>
          <div class="step-subtitle d-flex align-items-center gap-2">
            <span>${step.DisplayName}</span>
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="editStepModalOpenHandler('${step.FieldId}')">Edit</button>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteStepHandler('${step.FieldId}')">Delete</button>
          </div>
        </div>
        <div class="step-count" id="step${stepNumber}Count">${fieldCount} fields</div>
      </div>
    `;

    stepsContainer.appendChild(stepTab);

    const stepForm = document.createElement('div');
    stepForm.id = `step${stepNumber}`;
    stepForm.className = 'form-step hidden custom-step-form';

    const fieldsContainerId = `step${stepNumber}AdditionalFields`;

    stepForm.innerHTML = `
      <h4 class="d-flex align-items-center gap-2">
        <span class="step-icon">${step.OptionsJson || '📋'}</span>
        <span>${step.DisplayName}</span>
        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="editStepModalOpenHandler('${step.FieldId}')">Edit Step</button>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteStepHandler('${step.FieldId}')">Delete Step</button>
      </h4>
      <p class="text-muted">${step.Placeholder || ''}</p>
      <hr />

      <div id="${fieldsContainerId}" class="dynamic-step-fields">
        <!-- Fields will be rendered here when step is shown -->
      </div>

      <div class="mt-4">
        ${stepNumber > 1 ? `<button type="button" class="btn btn-secondary" data-prev-step="${stepNumber - 1}">Back</button>` : ''}
        ${isLastStep(stepNumber)
          ? '<button type="submit" class="btn btn-success">Submit Form</button>'
          : `<button type="button" class="btn btn-primary" data-next-step="${stepNumber + 1}">Next</button>`}
      </div>
    `;

    formsContainer.appendChild(stepForm);
  });

  updateNavigationButtons();
}

function renderStepFields(stepNumber) {
  let html = '';
  const fields = additionalFieldsData.filter(f => f.Step === stepNumber);

  fields.forEach(field => {
    html += `
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
  });

  return html;
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
          console.error('Error parsing options:', e);
        }
      }
      return `<select class="form-control form-select" name="AdditionalFields[${field.FieldName}]" ${field.IsRequired ? 'required' : ''}>${optionsHtml}</select>`;
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
  const lastStep = getLastStepNumber();

  const step1NextButton = document.querySelector('#step1 button[data-next-step="2"]');
  if (step1NextButton) {
    step1NextButton.innerHTML = 'Next';
    step1NextButton.className = 'btn btn-primary';
    step1NextButton.setAttribute('data-next-step', '2');
    step1NextButton.setAttribute('type', 'button');
  }

  const step2PrevButton = document.querySelector('#step2 button[data-prev-step="1"]');
  const step2NextButton = document.querySelector('#step2 button[data-next-step="3"]');
  if (step2PrevButton && step2NextButton) {
    step2NextButton.innerHTML = 'Next';
    step2NextButton.className = 'btn btn-primary';
    step2NextButton.setAttribute('data-next-step', '3');
    step2NextButton.setAttribute('type', 'button');
  }

  const step3PrevButton = document.querySelector('#step3 button[data-prev-step="2"]');
  const step3NextButton = document.getElementById('step3NextButton');

  if (step3PrevButton && step3NextButton) {
    if (isLastStep(3)) {
      step3NextButton.innerHTML = 'Submit Form';
      step3NextButton.className = 'btn btn-success';
      step3NextButton.removeAttribute('data-next-step');
      step3NextButton.setAttribute('type', 'submit');
    } else {
      step3NextButton.innerHTML = 'Next';
      step3NextButton.className = 'btn btn-primary';
      step3NextButton.setAttribute('data-next-step', '4');
      step3NextButton.setAttribute('type', 'button');
    }
  }

  const stepSelect = document.getElementById('fpStep');
  while (stepSelect.options.length > 3) {
    stepSelect.remove(3);
  }

  customSteps.forEach(step => {
    const option = document.createElement('option');
    option.value = step.Step;
    option.textContent = `Step ${step.Step}: ${step.DisplayName}`;
    stepSelect.appendChild(option);
  });
}

// =================================
// FIELD PROPERTIES PANEL (UI)
// =================================
function clearFieldSelection() {
  document.querySelectorAll('.field-item').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.mb-3').forEach(el => el.classList.remove('field-preview-selected'));
  document.querySelectorAll('.additional-field-container').forEach(el => el.classList.remove('field-preview-selected'));

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

  const conditionalConfig = document.getElementById('conditionalConfig');
  if (fieldData.isConditional) {
    conditionalConfig.classList.add('show');
    if (fieldData.conditionalLogic) {
      document.getElementById('fpDependsOnField').value = fieldData.conditionalLogic.dependsOnFieldKey || '';
      document.getElementById('fpShowWhenValue').value = fieldData.conditionalLogic.showWhenValue || '';
    } else {
      document.getElementById('fpDependsOnField').value = '';
      document.getElementById('fpShowWhenValue').value = '';
    }
  } else {
    conditionalConfig.classList.remove('show');
  }

  populateDependsOnFields(fieldData.step || 1, fieldData.fieldId);

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

  toggleOptionsEditor(fieldData.type === 'select', fieldData);

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

  const existingInput = container.querySelector('input, select, textarea');
  if (existingInput) {
    existingInput.remove();
  }

  let newInput;
  if (updatedData.FieldType === 'textarea') {
    newInput = document.createElement('textarea');
    newInput.className = 'form-control';
    newInput.rows = 3;
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
  } else {
    newInput = document.createElement('input');
    newInput.type = updatedData.FieldType;
    newInput.className = 'form-control';
  }

  if (updatedData.FieldType !== 'select') {
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
        console.error('Error parsing options:', e);
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

function createOptionEditorRow(label, isDefault, index) {
  const row = document.createElement('div');
  row.className = 'option-row';
  row.dataset.index = index;

  const inputsDiv = document.createElement('div');
  inputsDiv.className = 'option-inputs';

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'option-label-input';
  labelInput.placeholder = 'Option text (e.g., Red, Green, Blue)';
  labelInput.value = label || '';
  labelInput.dataset.originalValue = label || '';

  inputsDiv.appendChild(labelInput);

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'option-actions';

  const defaultRadio = document.createElement('input');
  defaultRadio.type = 'radio';
  defaultRadio.name = 'fpOptionDefault';
  defaultRadio.className = 'option-default-radio';
  defaultRadio.checked = isDefault;
  defaultRadio.addEventListener('change', function () {
    if (this.checked) {
      ensureOneDefaultChecked(this);
    }
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'option-remove-btn';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.title = 'Remove option';
  removeBtn.addEventListener('click', function () {
    row.remove();
    reindexOptions();
  });

  actionsDiv.appendChild(defaultRadio);
  actionsDiv.appendChild(removeBtn);

  row.appendChild(inputsDiv);
  row.appendChild(actionsDiv);

  return row;
}

function ensureOneDefaultChecked(_currentRadio = null) {
  const radios = document.querySelectorAll('input[name="fpOptionDefault"]');
  const checkedRadios = Array.from(radios).filter(r => r.checked);

  if (checkedRadios.length === 0 && radios.length > 0) {
    radios[0].checked = true;
  }
}

function reindexOptions() {
  const rows = document.querySelectorAll('#fpOptionsList .option-row');
  rows.forEach((row, index) => {
    row.dataset.index = index;
  });
}

function getOptionsFromEditor() {
  const rows = document.querySelectorAll('#fpOptionsList .option-row');
  const options = [];

  rows.forEach(row => {
    const labelInput = row.querySelector('.option-label-input');
    const defaultRadio = row.querySelector('.option-default-radio');

    if (labelInput) {
      const label = labelInput.value.trim();

      if (label) {
        const value = label.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');

        options.push({
          Label: label,
          Value: value || 'option_' + row.dataset.index,
          IsDefault: defaultRadio ? defaultRadio.checked : false
        });
      }
    }
  });

  return options;
}

/* =========================
   4) events.js
   ========================= */
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

  if (updatedData.FieldType === 'select') {
    const options = getOptionsFromEditor();
    if (options.length === 0) {
      showToast('At least one option is required for dropdown fields', 'error');
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

          try { applyConditionalLogic(); } catch (e) { console.error('Error reapplying conditional logic', e); }
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
              console.error('Error parsing conditional logic:', e);
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

  // Conditional checkbox toggle
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
      const isSelect = this.value === 'select';
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

/* =========================
   5) step4-form-capture-fix.js
   ========================= */
// Step 4 Form Capture Fix
// Ensures that Step 4 and custom step fields are properly named for form submission

(function() {
    // Override the renderFieldInput function to include proper form names
    const originalRenderFieldInput = window.renderFieldInput;
    
    window.renderFieldInput = function(field) {
        const fieldName = field.FieldName || field.fieldName;
        const placeholder = field.Placeholder || field.placeholder || '';
        const requiredAttr = (field.IsRequired || field.isRequired) ? 'required' : '';
        const nameAttr = `AdditionalFields[${fieldName}]`;

        switch (field.FieldType || field.fieldType) {
            case 'textarea':
                return `<textarea class="form-control" name="${nameAttr}" rows="3" placeholder="${placeholder}" ${requiredAttr}></textarea>`;
            case 'select':
                let optionsHtml = '<option value="">Select...</option>';
                if (field.OptionsJson || field.optionsJson) {
                    try {
                        const options = JSON.parse(field.OptionsJson || field.optionsJson);
                        options.forEach(opt => {
                            const label = opt.Label || opt.label || opt;
                            const value = opt.Value || opt.value || opt;
                            optionsHtml += `<option value="${value}">${label}</option>`;
                        });
                    } catch (e) {
                        console.error('Error parsing options:', e);
                    }
                }
                return `<select class="form-control form-select" name="${nameAttr}" ${requiredAttr}>${optionsHtml}</select>`;
            case 'checkbox':
                return `<input type="checkbox" class="form-check-input" name="${nameAttr}" value="true" ${requiredAttr}><input type="hidden" name="${nameAttr}" value="false">`;
            case 'number':
                return `<input type="number" class="form-control" name="${nameAttr}" placeholder="${placeholder}" ${requiredAttr}>`;
            case 'date':
                return `<input type="date" class="form-control" name="${nameAttr}" ${requiredAttr}>`;
            case 'email':
                return `<input type="email" class="form-control" name="${nameAttr}" placeholder="${placeholder}" ${requiredAttr}>`;
            case 'tel':
                return `<input type="tel" class="form-control" name="${nameAttr}" placeholder="${placeholder}" ${requiredAttr}>`;
            default:
                return `<input type="text" class="form-control" name="${nameAttr}" placeholder="${placeholder}" ${requiredAttr}>`;
        }
    };
})();

/* =========================
   6) form-builder-fix.js
   ========================= */
// FORM BUILDER FIX - Step 4 Blank Rendering Issue
// This file patches the switchStep function to fix the blank Step 4 issue

// Keep a reference to the current switchStep implementation
const originalSwitchStep = window.switchStep;

// Wrap switchStep instead of replacing its logic
window.switchStep = function(step) {
    // Run the primary implementation first (handles dynamic/custom steps)
    if (typeof originalSwitchStep === 'function') {
        originalSwitchStep(step);
    }

    // Use requestAnimationFrame to ensure DOM is ready before applying handlers
    requestAnimationFrame(() => {
        try {
            if (typeof setupFieldClickHandlers === 'function') {
                setupFieldClickHandlers();
            }
        } catch (e) { /* ignore */ }

        try {
            if (typeof applyConditionalLogic === 'function') {
                applyConditionalLogic();
            }
        } catch (e) { /* ignore */ }
    });
};
