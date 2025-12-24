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
