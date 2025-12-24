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
  document.getElementById('stepIconSelect').value = step.OptionsJson || '??';
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
        ? Add Field to This Step
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
              <p><button type="button" class="btn btn-sm btn-outline-primary" onclick="addFieldToStep(${step})">? Add Field</button></p>
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
                    ???
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
        <span class="step-icon">${step.OptionsJson || '??'}</span>
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
            ???
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
