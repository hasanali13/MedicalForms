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
  // Remove all existing conditional listeners first to prevent duplicates
  const conditionalFields = additionalFieldsData.filter(f => f.IsConditional && f.ConditionalLogicJson);
  
  conditionalFields.forEach(field => {
    try {
      const condition = JSON.parse(field.ConditionalLogicJson);
      const fieldContainer = document.querySelector(`.additional-field-container[data-field-id="${field.FieldId}"]`);
      if (!fieldContainer) return;

      const dependsOnFieldKey = condition.DependsOnFieldKey || condition.dependsOnFieldKey;
      const showWhenValue = condition.ShowWhenValue || condition.showWhenValue;

      if (!dependsOnFieldKey || !showWhenValue) return;

      // Find the dependent field
      let dependentField = null;

      // Try finding by data-field-key (for static fields)
      dependentField = document.querySelector(`[data-field-key="${dependsOnFieldKey}"] select, [data-field-key="${dependsOnFieldKey}"] input`);

      // Try finding by field container data-field-id (for dynamic fields)
      if (!dependentField) {
        const depContainer = document.querySelector(`.additional-field-container[data-field-id="${dependsOnFieldKey}"]`);
        if (depContainer) {
          dependentField = depContainer.querySelector('input, select, textarea, input[type="radio"]:checked');
          
          // For radio buttons, we need to get the whole group
          if (!dependentField || dependentField.type === 'radio') {
            const radioGroup = depContainer.querySelectorAll('input[type="radio"]');
            if (radioGroup.length > 0) {
              // Get the checked radio or first radio for event binding
              dependentField = depContainer.querySelector('input[type="radio"]:checked') || radioGroup[0];
            }
          }
        }
      }

      if (!dependentField) {
        console.warn(`Conditional logic: Could not find dependent field for ${dependsOnFieldKey}`);
        return;
      }

      const checkVisibility = () => {
        let fieldValue = '';
        
        // Handle radio buttons specially
        if (dependentField.type === 'radio') {
          const container = dependentField.closest('.additional-field-container, .mb-3');
          if (container) {
            const checkedRadio = container.querySelector('input[type="radio"]:checked');
            fieldValue = checkedRadio ? checkedRadio.value : '';
          }
        } else {
          fieldValue = dependentField.value;
        }
        
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

      // Initial visibility check
      checkVisibility();

      // Remove old listeners by cloning and replacing (prevents duplicate bindings)
      // This is a safe way to remove all event listeners
      if (dependentField._conditionalListenerBound) {
        return; // Already bound for this page load
      }

      // For radio buttons, bind to ALL radios in the group
      if (dependentField.type === 'radio') {
        const container = dependentField.closest('.additional-field-container, .mb-3');
        if (container) {
          const allRadios = container.querySelectorAll('input[type="radio"]');
          allRadios.forEach(radio => {
            if (!radio._conditionalListenerBound) {
              radio.addEventListener('change', checkVisibility);
              radio._conditionalListenerBound = true;
            }
          });
        }
      } else {
        // For other fields
        dependentField.addEventListener('change', checkVisibility);
        dependentField.addEventListener('input', checkVisibility);
        dependentField._conditionalListenerBound = true;
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
