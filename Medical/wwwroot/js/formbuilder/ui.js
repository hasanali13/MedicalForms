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
  console.log('updateCounts() called');
  
  const formStepsData = window.__formBuilderData?.formStepsData || [];
  const additionalFieldsData = window.__formBuilderData?.additionalFieldsData || [];
  
  console.log('Form Steps:', formStepsData);
  console.log('Additional Fields:', additionalFieldsData);
  
  // Update count for EVERY step in formStepsData
  formStepsData.forEach(step => {
    const fieldCount = additionalFieldsData.filter(f => f.Step === step.Order).length;
    const countEl = document.getElementById(`step${step.Order}Count`);
    
    console.log(`Step ${step.Order} (${step.Name}): ${fieldCount} fields, element:`, countEl);
    
    if (countEl) {
      countEl.textContent = `${fieldCount} field${fieldCount !== 1 ? 's' : ''}`;
    }
  });
}

function switchStep(step) {
  console.log('Switching to step:', step);

  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));

  // Show the selected step
  const stepElement = document.getElementById(`step${step}`);
  if (stepElement) {
    stepElement.classList.remove('hidden');
  } else {
    console.error(`Step element #step${step} not found`);
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
                ???</button>
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
    console.error('Error applying conditional logic:', e);
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
    dependentField = additionalFieldsData.find(f => String(f.FieldId) === String(dependsOnFieldId));
    
    // Static fields from formbuilder.bundle.js
    const staticFields = [
        { key: 'FullName', type: 'text' },
        { key: 'Age', type: 'number' },
        { key: 'Gender', type: 'radio', options: ['Male', 'Female', 'Other'] },
        { key: 'DateOfBirth', type: 'date' },
        { key: 'HasAllergies', type: 'select', options: ['Yes', 'No'] },
        { key: 'HasAlternativeContact', type: 'select', options: ['Yes', 'No'] }
    ];
    
    const staticMatch = staticFields.find(f => f.key === dependsOnFieldId);

    const useDropdown = (dependentField && (dependentField.FieldType === 'select' || dependentField.FieldType === 'radio')) || 
                        (staticMatch && (staticMatch.type === 'select' || staticMatch.type === 'radio'));

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
        if (dependentField && dependentField.OptionsJson) {
            try {
                const parsed = JSON.parse(dependentField.OptionsJson);
                options = parsed.map(o => ({ 
                  label: o.Label || o.label || o, 
                  value: o.Value || o.value || o.Label || o.label || o 
                }));
            } catch (e) { console.error(e); }
        } else if (staticMatch && staticMatch.options) {
            options = staticMatch.options.map(o => ({ label: o, value: o }));
        }
        
        currentInput.innerHTML = '<option value="">Select value...</option>';
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (String(opt.value) === String(currentValue)) {
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
          .replace(/[^a-z0-9_]/g, '')

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
