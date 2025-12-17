// FORM BUILDER FIX - Step 4 Blank Rendering Issue
// This file patches the switchStep function to fix the blank Step 4 issue

// Store the original switchStep function first
const originalSwitchStep = window.switchStep;

// Override switchStep with the fixed version
window.switchStep = function(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));

    // Show selected step
    const stepElement = document.getElementById(`step${step}`);
    if (stepElement) {
        stepElement.classList.remove('hidden');
    }

    // Update step tabs
    document.querySelectorAll('.step-item').forEach(s => s.classList.remove('active'));
    const stepTab = document.getElementById(`step${step}Tab`);
    if (stepTab) {
        stepTab.classList.add('active');
    }

    // Update left-side fields list
    if (typeof updateFieldsList === 'function') {
        updateFieldsList(step);
    }

    // If we switched to step 2, ensure allergy visibility is correct
    try { 
        if (typeof updateAllergyVisibility === 'function') {
            updateAllergyVisibility();
        }
    } catch (e) { }
    
    // Use requestAnimationFrame to ensure DOM is ready before applying handlers
    requestAnimationFrame(() => {
        try { 
            if (typeof setupFieldClickHandlers === 'function') {
                setupFieldClickHandlers();
            }
        } catch (e) { }
        try { 
            if (typeof applyConditionalLogic === 'function') {
                applyConditionalLogic();
            }
        } catch (e) { }
    });
};
