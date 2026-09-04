(function installExitModal(window, document) {
  const guard = window.KontrapuntalExitGuard;
  const dialog = document.querySelector('#admin-exit-dialog');
  const keepEditingButton = dialog?.querySelector('[data-exit-dialog-cancel]');
  const leaveButton = dialog?.querySelector('[data-exit-dialog-confirm]');
  let pendingDestination = '';

  if (!guard || !dialog || !keepEditingButton || !leaveButton) return;

  document.addEventListener(
    'click',
    (event) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor || !guard.isDirty() || !guard.shouldGuardNavigation(anchor, event)) return;

      event.preventDefault();
      pendingDestination = anchor.href;
      dialog.showModal();
    },
    true,
  );

  function keepEditing() {
    pendingDestination = '';
    dialog.close();
  }

  keepEditingButton.addEventListener('click', keepEditing);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    keepEditing();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) keepEditing();
  });
  leaveButton.addEventListener('click', () => {
    if (pendingDestination) window.location.assign(pendingDestination);
  });
})(window, document);
