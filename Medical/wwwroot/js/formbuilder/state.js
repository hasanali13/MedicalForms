/*
  state.js
  Shared state used by the Form Builder page.
*/

// =================================
// GLOBAL STATE
// =================================
let isModalOpen = false;
let isStepModalOpen = false;
let selectedFieldData = null;
let customSteps = [];

// These are assigned from Razor via `window.__formBuilderData` in the view.
let additionalFieldsData = [];
let customStepsData = [];
let originalFields = {};
