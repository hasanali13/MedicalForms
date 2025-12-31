/*
  groups.js
  Client-side (no-backend) field grouping for the Form Builder middle panel.
  - No controller/model/db changes
  - Persists to localStorage only
  - Uses event delegation
*/

(function () {
  const STORAGE_KEY = 'formbuilder.grouping.v1';

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  }

  function getStore() {
    return safeJsonParse(localStorage.getItem(STORAGE_KEY) || '', { steps: {} });
  }

  function setStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // ignore quota / private-mode issues
    }
  }

  function getStepState(stepId) {
    const store = getStore();
    store.steps ??= {};
    store.steps[String(stepId)] ??= { groups: [] };
    return { store, stepState: store.steps[String(stepId)] };
  }

  function ensureStepState(stepId) {
    const { store } = getStepState(stepId);
    setStore(store);
  }

  function generateGroupId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `g_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function getStepIdFromStepElement(stepEl) {
    // Use numeric step (1..n) in this app as the stepId driver
    const id = stepEl?.id || '';
    if (id.startsWith('step')) {
      const n = parseInt(id.slice(4), 10);
      if (!Number.isNaN(n)) return n;
    }
    const ds = stepEl?.getAttribute('data-step');
    if (ds) {
      const n = parseInt(ds, 10);
      if (!Number.isNaN(n)) return n;
    }
    return null;
  }

  function getActiveStepElement() {
    return document.querySelector('.form-step:not(.hidden)');
  }

  function normalizeFieldIds(fieldIds, allFieldIds) {
    const set = new Set();
    const out = [];
    (fieldIds || []).forEach(id => {
      if (!id) return;
      const key = String(id);
      if (set.has(key)) return;
      if (allFieldIds && !allFieldIds.has(key)) return;
      set.add(key);
      out.push(key);
    });
    return out;
  }

  function collectFieldBlocks(stepEl) {
    const blocks = stepEl.querySelectorAll('.mb-3[data-field-key], .additional-field-container[data-field-id]');
    const allIds = new Set();
    const map = new Map();

    blocks.forEach(el => {
      const isStatic = el.classList.contains('mb-3');
      const fieldId = isStatic
        ? String(el.getAttribute('data-field-key') || '')
        : String(el.getAttribute('data-field-id') || '');

      if (!fieldId) return;
      allIds.add(fieldId);
      map.set(fieldId, el);

      // Drag-and-drop removed
      el.removeAttribute('draggable');
      el.removeAttribute('data-fb-drag-id');
      el.removeAttribute('data-fb-drag-type');
      el.classList.remove('fb-field-draggable');
    });

    return { allIds, map };
  }

  function ensureGroupingRoot(stepEl) {
    // Do NOT use :scope selectors here (they can be inconsistent across browsers)
    let root = stepEl.querySelector('.fb-grouping-root');
    if (root) return root;

    root = document.createElement('div');
    root.className = 'fb-grouping-root';

    // Insert right after first h4 inside the step (works for both hard-coded and dynamic steps)
    const h4 = stepEl.querySelector('h4');
    if (h4 && h4.parentElement) {
      if (h4.nextSibling) {
        h4.parentElement.insertBefore(root, h4.nextSibling);
      } else {
        h4.parentElement.appendChild(root);
      }
    } else {
      stepEl.insertAdjacentElement('afterbegin', root);
    }

    return root;
  }

  function ensureUngroupedContainer(root, stepId) {
    let ungrouped = root.querySelector('.fb-ungrouped');
    if (ungrouped) {
      // always keep these attrs correct
      ungrouped.setAttribute('data-fb-dropzone', 'ungrouped');
      ungrouped.setAttribute('data-step-id', String(stepId));
      return ungrouped;
    }

    ungrouped = document.createElement('div');
    ungrouped.className = 'fb-ungrouped';
    ungrouped.setAttribute('data-fb-dropzone', 'ungrouped');
    ungrouped.setAttribute('data-step-id', String(stepId));

    root.appendChild(ungrouped);
    return ungrouped;
  }

  function buildGroupCard(stepId, group) {
    const card = document.createElement('div');
    card.className = 'fb-group-card';
    card.setAttribute('data-group-id', group.groupId);

    const header = document.createElement('div');
    header.className = 'fb-group-header';

    const title = document.createElement('input');
    title.type = 'text';
    title.className = 'fb-group-title';
    title.placeholder = 'Group name (optional)';
    title.value = group.name || '';
    title.setAttribute('data-group-title', group.groupId);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-origin btn-origin-sm btn-origin-danger fb-group-delete';
    del.textContent = 'Delete';
    del.setAttribute('data-group-delete', group.groupId);
    del.setAttribute('data-step-id', String(stepId));

    header.appendChild(title);
    header.appendChild(del);

    // Option B: if name is empty, hide the entire header row
    if (!String(group.name || '').trim()) {
      header.style.display = 'none';
    }

    const body = document.createElement('div');
    body.className = 'fb-group-body';
    body.setAttribute('data-group-id', group.groupId);
    body.setAttribute('data-step-id', String(stepId));

    const actions = document.createElement('div');
    actions.className = 'd-flex gap-2 mt-2';

    const addSelectedBtn = document.createElement('button');
    addSelectedBtn.type = 'button';
    addSelectedBtn.className = 'btn-origin btn-origin-sm btn-origin-secondary fb-group-add-selected';
    addSelectedBtn.textContent = 'Add selected field';
    addSelectedBtn.setAttribute('data-group-add-selected', group.groupId);
    addSelectedBtn.setAttribute('data-step-id', String(stepId));

    const ungroupSelectedBtn = document.createElement('button');
    ungroupSelectedBtn.type = 'button';
    ungroupSelectedBtn.className = 'btn-origin btn-origin-sm btn-origin-secondary fb-group-ungroup-selected';
    ungroupSelectedBtn.textContent = 'Move selected to ungrouped';
    ungroupSelectedBtn.setAttribute('data-ungroup-selected', group.groupId);
    ungroupSelectedBtn.setAttribute('data-step-id', String(stepId));

    actions.appendChild(addSelectedBtn);
    actions.appendChild(ungroupSelectedBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);

    return card;
  }

  function injectAddGroupButton(stepEl, stepId) {
    const h4 = stepEl.querySelector('h4');
    if (!h4) return;

    if (!h4.classList.contains('d-flex')) {
      h4.classList.add('d-flex', 'align-items-center', 'justify-content-between');
    }

    let actions = h4.querySelector('.fb-step-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'fb-step-actions d-flex align-items-center gap-2';
      h4.appendChild(actions);
    }

    if (actions.querySelector('.fb-add-group')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-origin btn-origin-sm btn-origin-secondary fb-add-group';
    btn.textContent = '+ Add Group';
    btn.setAttribute('data-step-id', String(stepId));

    actions.appendChild(btn);
  }

  function getStepElementById(stepId) {
    return document.getElementById(`step${stepId}`) || getActiveStepElement();
  }

  // Single source of truth renderer
  function renderGroupsForStep(stepId) {
    const stepEl = getStepElementById(stepId);
    if (!stepEl) return;

    // Ensure state exists (but do not let state issues break the UI)
    try { ensureStepState(stepId); } catch { }

    // Ensure button exists for this step
    try { injectAddGroupButton(stepEl, stepId); } catch { }

    const root = ensureGroupingRoot(stepEl);

    // Stable containers
    let groupsHost = root.querySelector('.fb-groups-host');
    if (!groupsHost) {
      groupsHost = document.createElement('div');
      groupsHost.className = 'fb-groups-host';
      root.appendChild(groupsHost);
    }

    // Always present ungrouped container
    const ungrouped = ensureUngroupedContainer(root, stepId);

    // Collect the field blocks currently in this step
    const { allIds, map } = collectFieldBlocks(stepEl);
    if (allIds.size === 0) return; // fail-safe: don't blank the panel

    // Read groups from state (source of truth)
    let groups = [];
    try {
      const { store, stepState } = getStepState(stepId);
      groups = Array.isArray(stepState.groups) ? stepState.groups : [];

      // normalize the store shape if needed
      stepState.groups = groups;
      store.steps[String(stepId)] = stepState;
      setStore(store);
    } catch {
      groups = [];
    }

    // Clear and rebuild group UI from state
    groupsHost.innerHTML = '';

    const used = new Set();

    groups.forEach(g => {
      const groupId = String(g.groupId || '');
      if (!groupId) return;

      const card = buildGroupCard(stepId, { groupId, name: g.name || '' });
      groupsHost.appendChild(card);

      const body = card.querySelector('.fb-group-body');
      const ids = normalizeFieldIds(g.fieldIds, allIds);

      ids.forEach(fid => {
        const el = map.get(fid);
        if (!el) return;
        used.add(fid);
        body.appendChild(el);
      });

      // persist normalized ids back to storage
      g.fieldIds = ids;
    });

    // Ungrouped = any field block not claimed by a group
    ungrouped.innerHTML = '';
    map.forEach((el, fid) => {
      if (!used.has(fid)) {
        ungrouped.appendChild(el);
      }
    });

    // Persist normalization (fail-safe if storage is blocked)
    try {
      const { store, stepState } = getStepState(stepId);
      stepState.groups = groups;
      store.steps[String(stepId)] = stepState;
      setStore(store);
    } catch { }
  }

  // Keep existing function for backward compatibility, but delegate to the single source renderer
  function renderGroupingForStep(stepEl) {
    const stepId = getStepIdFromStepElement(stepEl);
    if (!stepId) return;
    renderGroupsForStep(stepId);
  }

  function createGroupNameModal(initialValue, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'fb-group-modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'fb-group-modal';

    const title = document.createElement('div');
    title.className = 'fb-group-modal-title';
    title.textContent = 'Add Group';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'fb-group-modal-input';
    input.placeholder = 'Group name (optional)';
    input.value = initialValue || '';

    const actions = document.createElement('div');
    actions.className = 'fb-group-modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-origin btn-origin-sm btn-origin-secondary';
    cancelBtn.textContent = 'Cancel';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'btn-origin btn-origin-sm btn-origin-primary';
    okBtn.textContent = 'Create';

    function cleanup() {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
    }

    function confirm() {
      const val = (input.value || '').trim();
      cleanup();
      onConfirm(val);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      }
    }

    cancelBtn.addEventListener('click', cleanup);
    okBtn.addEventListener('click', confirm);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) cleanup();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);

    dialog.appendChild(title);
    dialog.appendChild(input);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);

    document.body.appendChild(overlay);

    // focus after attach
    setTimeout(() => input.focus(), 0);
    document.addEventListener('keydown', onKeyDown, true);
  }

  function addGroup(stepId, groupName) {
    const { store, stepState } = getStepState(stepId);
    const groupId = generateGroupId();

    stepState.groups ??= [];
    stepState.groups.push({ groupId, name: groupName || '', fieldIds: [] });

    store.steps[String(stepId)] = stepState;
    setStore(store);

    // REQUIRED: render immediately from state
    renderGroupsForStep(stepId);
    
    // Sync to server
    saveGroups(stepId, stepState.groups);
  }

  function saveGroups(stepId, groups) {
    const url = '/ViewPublicForms/UpdateStepGroups'; // Hardcoded for simplified edit
    const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': token || ''
        },
        body: JSON.stringify({
            StepOrder: stepId,
            Groups: groups
        })
    }).catch(e => console.error('Group save failed', e));
  }

  function deleteGroup(stepId, groupId) {
    const stepEl = getStepElementById(stepId);
    if (!stepEl) return;

    const root = ensureGroupingRoot(stepEl);
    const ungrouped = ensureUngroupedContainer(root, stepId);

    // Move fields back to ungrouped first (safe-delete requirement)
    const card = stepEl.querySelector(`.fb-group-card[data-group-id="${CSS.escape(String(groupId))}"]`);
    if (card) {
      const body = card.querySelector('.fb-group-body');
      if (body) {
        Array.from(body.children).forEach(ch => {
          if (ch && (ch.matches('.mb-3[data-field-key]') || ch.matches('.additional-field-container[data-field-id]'))) {
            ungrouped.appendChild(ch);
          }
        });
      }
    }

    const { store, stepState } = getStepState(stepId);
    stepState.groups = (stepState.groups || []).filter(g => String(g.groupId) !== String(groupId));
    store.steps[String(stepId)] = stepState;
    setStore(store);

    // Re-render from state
    renderGroupsForStep(stepId);
    
    saveGroups(stepId, stepState.groups);
  }

  function renameGroup(stepId, groupId, name) {
    const { store, stepState } = getStepState(stepId);
    const g = (stepState.groups || []).find(x => String(x.groupId) === String(groupId));
    if (!g) return;
    g.name = name || '';
    store.steps[String(stepId)] = stepState;
    setStore(store);

    // Keep UI in sync without relying on incremental DOM updates
    renderGroupsForStep(stepId);
    
    saveGroups(stepId, stepState.groups);
  }

  function moveField(stepId, fieldId, targetGroupIdOrNull) {
    const { store, stepState } = getStepState(stepId);
    const groups = stepState.groups || [];

    groups.forEach(g => {
      g.fieldIds = (g.fieldIds || []).filter(id => String(id) !== String(fieldId));
    });

    if (targetGroupIdOrNull) {
      const g = groups.find(x => String(x.groupId) === String(targetGroupIdOrNull));
      if (g) {
        g.fieldIds ??= [];
        if (!g.fieldIds.some(id => String(id) === String(fieldId))) {
          g.fieldIds.push(String(fieldId));
        }
      }
    }

    stepState.groups = groups;
    store.steps[String(stepId)] = stepState;
    setStore(store);

    // Re-render from state
    renderGroupsForStep(stepId);
    
    saveGroups(stepId, stepState.groups);
  }

  function getSelectedFieldIdFromExistingSelection() {
    // Prefer the existing Form Builder selection object if accessible
    try {
      const fd = window.selectedFieldData;
      if (fd) {
        if (fd.fieldType === 'static') return fd.fieldKey || null;
        return fd.fieldId || null;
      }
    } catch { }

    // Fallback: infer selection from DOM (left list)
    try {
      const leftSelected = document.querySelector('#fieldsList .field-item.selected');
      if (leftSelected) {
        const fieldType = leftSelected.getAttribute('data-field-type');
        if (fieldType === 'static') {
          return leftSelected.getAttribute('data-field-key') || null;
        }
        return leftSelected.getAttribute('data-field-id') || null;
      }
    } catch { }

    // Fallback: infer selection from DOM (preview)
    try {
      const previewStatic = document.querySelector('.mb-3.field-preview-selected[data-field-key]');
      if (previewStatic) return previewStatic.getAttribute('data-field-key') || null;

      const previewDynamic = document.querySelector('.additional-field-container.field-preview-selected[data-field-id]');
      if (previewDynamic) return previewDynamic.getAttribute('data-field-id') || null;
    } catch { }

    return null;
  }

  // Event delegation
  document.addEventListener('click', function (e) {
    const addBtn = e.target.closest('.fb-add-group');
    if (addBtn) {
      const stepId = parseInt(addBtn.getAttribute('data-step-id') || '', 10);
      if (Number.isNaN(stepId)) return;

      createGroupNameModal('', function (name) {
        try { addGroup(stepId, name); } catch { }
      });

      return;
    }

    const addSelectedToGroup = e.target.closest('.fb-group-add-selected');
    if (addSelectedToGroup) {
      const stepId = parseInt(addSelectedToGroup.getAttribute('data-step-id') || '', 10);
      const groupId = addSelectedToGroup.getAttribute('data-group-add-selected');
      if (!groupId || Number.isNaN(stepId)) return;

      const fieldId = getSelectedFieldIdFromExistingSelection();
      if (!fieldId) {
        try { showToast('Select a field first', 'info'); } catch { }
        return;
      }

      moveField(stepId, fieldId, groupId);
      return;
    }

    const delBtn = e.target.closest('.fb-group-delete');
    if (delBtn) {
      const stepId = parseInt(delBtn.getAttribute('data-step-id') || '', 10);
      const groupId = delBtn.getAttribute('data-group-delete');
      if (!Number.isNaN(stepId) && groupId) deleteGroup(stepId, groupId);
      return;
    }

    const ungroupSelected = e.target.closest('.fb-group-ungroup-selected');
    if (ungroupSelected) {
      const stepId = parseInt(ungroupSelected.getAttribute('data-step-id') || '', 10);
      if (Number.isNaN(stepId)) return;

      const fieldId = getSelectedFieldIdFromExistingSelection();
      if (!fieldId) {
        try { showToast('Select a field first', 'info'); } catch { }
        return;
      }

      moveField(stepId, fieldId, null);
      return;
    }
  });

  // Replace the existing group title input handler with save-on-commit behavior
  document.addEventListener('input', function (e) {
    const input = e.target.closest('.fb-group-title');
    if (!input) return;

    // Option B: reveal/hide header while typing (visual only)
    const header = input.closest('.fb-group-header');
    if (header) {
      const hasName = String(input.value || '').trim().length > 0;
      header.style.display = hasName ? '' : 'none';
    }
  });

  function commitGroupTitle(inputEl) {
    const card = inputEl.closest('.fb-group-card');
    const groupId = card?.getAttribute('data-group-id');
    const stepIdAttr = card?.querySelector('.fb-group-body')?.getAttribute('data-step-id');
    const stepId = stepIdAttr ? parseInt(stepIdAttr, 10) : (getStepIdFromStepElement(getActiveStepElement()) || null);

    if (!groupId || !stepId || Number.isNaN(stepId)) return;

    // Persist to state
    renameGroup(stepId, groupId, inputEl.value);
  }

  document.addEventListener('change', function (e) {
    const input = e.target.closest('.fb-group-title');
    if (!input) return;
    commitGroupTitle(input);
  });

  document.addEventListener('focusout', function (e) {
    const input = e.target.closest('.fb-group-title');
    if (!input) return;
    commitGroupTitle(input);
  });

  // Hook into step switches without clobbering other wrappers.
  function chainSwitchStepWrapper() {
    const prev = window.switchStep;
    if (typeof prev !== 'function') return;

    if (prev.__fbGroupsWrapped) return;

    const wrapped = function (step) {
      prev(step);
      requestAnimationFrame(() => {
        try { renderGroupsForStep(step); } catch { }
      });
    };

    wrapped.__fbGroupsWrapped = true;
    window.switchStep = wrapped;
  }

  // Expose rendering function globally for external hydration
  window.renderGroupsForStep = renderGroupsForStep;

  // Expose nothing; but keep an internal reference safe for debugging if needed
  chainSwitchStepWrapper();

  document.addEventListener('DOMContentLoaded', function () {
    chainSwitchStepWrapper();

    requestAnimationFrame(() => {
      // Hydrate from server FIRST
      try {
        const serverSteps = window.__formBuilderData?.formStepsData || [];
        const store = getStore();
        let changed = false;
        
        serverSteps.forEach(s => {
             // Use server groups if available (overwriting local storage to ensure sync)
             if (s.Groups) {
                store.steps ??= {};
                store.steps[String(s.Order)] = { groups: s.Groups };
                changed = true;
             }
        });
        
        if (changed) setStore(store);
      } catch (e) { }

      const stepEl = getActiveStepElement();
      const stepId = stepEl ? getStepIdFromStepElement(stepEl) : null;
      if (stepId) {
        try { renderGroupsForStep(stepId); } catch { }
      }
    });
  });

  // PERSISTENCE FIX: Also expose store functions for external hydration
  window.__formBuilderGroups = {
    getStore: getStore,
    setStore: setStore,
    getStepState: getStepState,
    ensureStepState: ensureStepState,
    renderGroupsForStep: renderGroupsForStep
  };

})();
