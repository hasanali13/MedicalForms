// =================================
// OPTION EDITOR FUNCTIONS - MISSING FROM BUNDLE
// =================================
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
