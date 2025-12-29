/*
  step-editor.js
  Step rename, update, and delete functionality for the Form Builder
*/

(function() {
  'use strict';

  // =================================
  // STEP EDIT MODAL FUNCTIONS
  // =================================
  window.openEditStepModal = function(stepId, stepOrder, stepName) {
    const modal = document.getElementById('editStepModal') || createEditStepModal();
    
    document.getElementById('editStepId').value = stepId;
    document.getElementById('editStepOrder').value = stepOrder;
    document.getElementById('editStepNameInput').value = stepName;
    document.getElementById('editStepDescriptionInput').value = '';
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      const input = document.getElementById('editStepNameInput');
      if (input) input.focus();
    }, 100);
  };

  window.closeEditStepModal = function() {
    const modal = document.getElementById('editStepModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

  window.submitEditStepForm = async function() {
    const stepId = document.getElementById('editStepId').value;
    const stepName = document.getElementById('editStepNameInput').value.trim();
    const stepOrder = parseInt(document.getElementById('editStepOrder').value);

    if (!stepName) {
      showToast('Step name is required', 'error');
      return;
    }

    if (!stepId) {
      showToast('Invalid step selected', 'error');
      return;
    }

    const requestData = {
      StepId: stepId,
      StepName: stepName,
      StepDescription: document.getElementById('editStepDescriptionInput')?.value.trim() || '',
      StepOrder: stepOrder
    };

    try {
      showToast('Updating step...', 'info');

      const response = await fetch(window.__formBuilderData.urls.updateCustomStep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RequestVerificationToken': getToken()
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, 'success');
        closeEditStepModal();
        
        // Update the UI immediately
        updateStepNameInUI(stepOrder, stepName);
        
        // Reload after a short delay to ensure data consistency
        setTimeout(() => location.reload(), 1000);
      } else {
        showToast(result.message || 'Failed to update step', 'error');
      }
    } catch (error) {
      console.error('Error updating step:', error);
      showToast('Error updating step: ' + error.message, 'error');
    }
  };

  // =================================
  // DELETE STEP HANDLER
  // =================================
  window.deleteStepHandler = async function(stepId) {
    // Find step info
    const formStepsData = window.__formBuilderData?.formStepsData || [];
    const step = formStepsData.find(s => String(s.Id) === String(stepId));
    
    if (!step) {
      showToast('Step not found', 'error');
      return;
    }

    // Prevent deletion if it's the last step
    if (formStepsData.length <= 1) {
      showToast('Cannot delete the last remaining step', 'error');
      return;
    }

    const stepName = step.Name || `Step ${step.Order}`;
    
    if (!confirm(`Are you sure you want to delete "${stepName}"?\n\nAll fields in this step will also be deleted.`)) {
      return;
    }

    try {
      showToast('Deleting step...', 'info');

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
        
        // Reload the page to reflect changes
        setTimeout(() => location.reload(), 1000);
      } else {
        showToast(result.message || 'Failed to delete step', 'error');
      }
    } catch (error) {
      console.error('Error deleting step:', error);
      showToast('Error deleting step: ' + error.message, 'error');
    }
  };

  // =================================
  // UI UPDATE HELPERS
  // =================================
  function updateStepNameInUI(stepOrder, newName) {
    try {
      // Update left panel step title
      const stepTab = document.getElementById(`step${stepOrder}Tab`);
      if (stepTab) {
        const subtitleEl = stepTab.querySelector('.step-subtitle .step-name-display');
        if (subtitleEl) {
          subtitleEl.textContent = newName;
        }
      }

      // Update middle panel step title
      const stepPanel = document.getElementById(`step${stepOrder}`);
      if (stepPanel) {
        const titleEl = stepPanel.querySelector('.step-title-text');
        if (titleEl) {
          titleEl.textContent = newName;
        }
      }

      // Update current step name display
      const currentStepName = document.getElementById('currentStepName');
      const activeTab = document.querySelector('.step-item.active');
      if (currentStepName && activeTab && activeTab.getAttribute('data-step') == stepOrder) {
        currentStepName.textContent = newName.toUpperCase();
      }

      // Update field properties panel step dropdown
      const fpStepSelect = document.getElementById('fpStep');
      if (fpStepSelect) {
        const option = fpStepSelect.querySelector(`option[value="${stepOrder}"]`);
        if (option) {
          option.textContent = newName;
        }
      }

      // Update add field modal step dropdown
      const fieldStepSelect = document.getElementById('fieldStepSelect');
      if (fieldStepSelect) {
        const option = fieldStepSelect.querySelector(`option[value="${stepOrder}"]`);
        if (option) {
          option.textContent = `${newName}`;
        }
      }
    } catch (e) {
      console.error('Error updating step name in UI:', e);
    }
  }

  function createEditStepModal() {
    const existingModal = document.getElementById('editStepModal');
    if (existingModal) return existingModal;

    const modalHTML = `
      <div id="editStepModal" class="modal-overlay" onclick="if(event.target===this) closeEditStepModal()">
        <div class="modal-dialog" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">Edit Step</div>
            <button type="button" class="close-btn" onclick="closeEditStepModal()">×</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="editStepId" />
            <input type="hidden" id="editStepOrder" />
            
            <div class="form-group">
              <label class="form-label">
                Step Name <span class="required-star">*</span>
              </label>
              <input type="text" id="editStepNameInput" class="form-control-modal"
                     placeholder="e.g., Personal Information" required />
              <small class="text-muted" style="font-size: 12px;">Name of the step</small>
            </div>

            <div class="form-group">
              <label class="form-label">Step Description (Optional)</label>
              <textarea id="editStepDescriptionInput" class="form-control-modal" rows="2"
                        placeholder="Brief description of what this step contains"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeEditStepModal()">Cancel</button>
            <button type="button" class="btn-primary" onclick="submitEditStepForm()">Update Step</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('editStepModal');
  }

  // =================================
  // KEYBOARD SHORTCUTS
  // =================================
  document.addEventListener('keydown', function(e) {
    const editModal = document.getElementById('editStepModal');
    
    if (editModal && editModal.classList.contains('show')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeEditStepModal();
      }
      
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        submitEditStepForm();
      }
    }
  });

  // =================================
  // INITIALIZATION
  // =================================
  document.addEventListener('DOMContentLoaded', function() {
    // Create edit modal if it doesn't exist
    createEditStepModal();
  });

})();
