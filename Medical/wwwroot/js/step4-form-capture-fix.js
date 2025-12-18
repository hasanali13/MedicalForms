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
