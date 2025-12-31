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
