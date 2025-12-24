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
