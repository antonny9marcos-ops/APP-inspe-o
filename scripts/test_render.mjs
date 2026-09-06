global.window = {
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.document = {
  addEventListener: () => {},
  removeEventListener: () => {}
};
import React from 'react';
import { renderToString } from 'react-dom/server';
const { InspectionForm } = await import('../dist/test_form.mjs');

console.log('Testing render of InspectionForm...');
try {
  const html = renderToString(
    React.createElement(InspectionForm, {
      onSave: () => {},
      onCancel: () => {},
      onViewHistory: () => {},
      initialData: { setor: 'TODOS' },
      userProfile: { name: 'Marcos', role: 'Admin', avatar: 'https://picsum.photos/100' }
    })
  );
  console.log('RENDER SUCCESSFUL! Output length:', html.length);
} catch (err) {
  console.error('CRASH IN INSPECTIONFORM RENDER:', err);
}

// Test with null initialData
try {
  const html2 = renderToString(
    React.createElement(InspectionForm, {
      onSave: () => {},
      onCancel: () => {},
      onViewHistory: () => {},
      initialData: undefined,
      userProfile: undefined
    })
  );
  console.log('RENDER WITH UNDEFINED PROPS SUCCESSFUL! Output length:', html2.length);
} catch (err) {
  console.error('CRASH WITH UNDEFINED PROPS:', err);
}
