/*
  core.js
  Core initialization, state management logic (if any), and modal handling.
*/

(function() {
  
  // =================================
  // HELPER: Get Anti-Forgery Token
  // =================================
  window.getToken = function() {
    return document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
  };

  // =================================
  // HELPER: Modal Handling
  // =================================
  window.isModalOpen = false;
  
  window.// =================================
  // ADD FIELD HANDLER
  // =================================
  window.submitAddFieldForm = async function() {
    const label = document.getElementById('fieldLabelInput').value.trim();
    if (!label) {
      showToast('Field Label is required', 'error');
      return;
    }

    const type = document.getElementById('fieldTypeSelect').value;
    const step = parseInt(document.getElementById('fieldStepSelect').value);
    const placeholder = document.getElementById('fieldPlaceholderInput').value.trim();
    const isRequired = document.getElementById('requiredCheckbox').classList.contains('checked');
    const isConditional = document.getElementById('conditionalCheckbox').classList.contains('checked');

    const requestData = {
      Step: step,
      FieldType: type,
      DisplayName: label,
      Placeholder: placeholder,
      IsRequired: isRequired,
      IsConditional: isConditional,
      DisplayOrder: 999 
    };

    try {
      showToast('Adding field...', 'info');

      const response = await fetch(window.__formBuilderData.urls.addAdditionalField, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RequestVerificationToken': getToken()
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

        if (result.success) {
          showToast(result.message || 'Field added successfully', 'success');
          modalCloseHandler();

          // Clear form
          document.getElementById('fieldLabelInput').value = '';
          document.getElementById('fieldPlaceholderInput').value = '';
          if (document.getElementById('requiredCheckbox')) {
              document.getElementById('requiredCheckbox').classList.remove('checked');
          }

          // Reload page to reflect changes
          setTimeout(() => location.reload(), 500);
        } else {
          showToast(result.message || 'Failed to add field', 'error');
        }

    } catch (error) {
      console.error('Error adding field:', error);
      showToast('Error adding field: ' + error.message, 'error');
    }
  };

  window.modalOpenHandler = function() {
    const modal = document.getElementById('addFieldModal');
    if (modal) {
      modal.classList.add('show');
      window.isModalOpen = true;
      document.body.style.overflow = 'hidden';
      setTimeout(() => document.getElementById('fieldLabelInput').focus(), 100);
    }
  };

  window.modalCloseHandler = function() {
    const modal = document.getElementById('addFieldModal');
    if (modal) {
      modal.classList.remove('show');
      window.isModalOpen = false;
      document.body.style.overflow = '';
    }
  };

  // =================================
  // ADD STEP MODAL HANDLING
  // =================================
  window.isStepModalOpen = false;

  window.stepModalOpenHandler = function() {
    const modal = document.getElementById('addStepModal');
    if (modal) {
      modal.classList.add('show');
      window.isStepModalOpen = true;
      document.body.style.overflow = 'hidden';
      setTimeout(() => document.getElementById('stepNameInput').focus(), 100);
    }
  };

  window.stepModalCloseHandler = function() {
    const modal = document.getElementById('addStepModal');
    if (modal) {
      modal.classList.remove('show');
      window.isStepModalOpen = false;
      document.body.style.overflow = '';
    }
  };
  
  // =================================
  // CHECKBOX TOGGLE HELPER
  // =================================
  window.toggleCheckbox = function(type) {
    const checkbox = document.getElementById(type + 'Checkbox');
    if (checkbox) {
      checkbox.classList.toggle('checked');
    }
  };

  // =================================
  // CONDITIONAL FIELDS LOGIC
  // =================================
  window.populateDependsOnFields = function(currentStep, excludeFieldId) {
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
  };

  window.applyConditionalLogic = function() {
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

        // Try finding by field container data-field-id (for dynamic fields)
        const depContainer = document.querySelector(`.additional-field-container[data-field-id="${parentFieldId}"]`);
        if (depContainer) {
          dependentField = depContainer.querySelector('input, select, textarea');
          
          // For radio buttons, we need to get the whole group or the checked one
          if (!dependentField || dependentField.type === 'radio') {
            const radioGroup = depContainer.querySelectorAll('input[type="radio"]');
            if (radioGroup.length > 0) {
              dependentField = depContainer.querySelector('input[type="radio"]:checked') || radioGroup[0];
            }
          }
        }

        if (!dependentField) return;

        const checkVisibility = () => {
          let fieldValue = '';
          
          // Handle radio buttons specially
          if (dependentField.type === 'radio') {
            const container = dependentField.closest('.additional-field-container');
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

        // Initial visibility check
        checkVisibility();

        // Bind events if not already done
        if (!dependentField._conditionalListenerBound) {
          if (dependentField.type === 'radio') {
            const container = dependentField.closest('.additional-field-container');
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
  };

  // =================================
  // SWITCH STEP
  // =================================
  window.switchStep = function(stepOrder) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.step-item').forEach(el => el.classList.remove('active'));

    // Show target step
    const targetStep = document.getElementById(`step${stepOrder}`);
    const targetTab = document.getElementById(`step${stepOrder}Tab`);
    
    if (targetStep) targetStep.classList.remove('hidden');
    if (targetTab) targetTab.classList.add('active');

    // Update Field properties panel
    const fpStep = document.getElementById('fpStep');
    if (fpStep) fpStep.value = stepOrder;

    // Update current step name in fields header
    const stepNameDisplay = targetTab ? targetTab.querySelector('.step-title').innerText : `Step ${stepOrder}`;
    const cleanStepName = stepNameDisplay.replace('DISABLED', '').trim();
    
    const currentStepName = document.getElementById('currentStepName');
    if (currentStepName) currentStepName.textContent = cleanStepName.toUpperCase();
    
    // Defer group rendering to custom wrapper in groups.js or explicit call
  };

})();
