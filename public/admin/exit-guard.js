(function installExitGuard(window) {
  const beforeUnloadListeners = new Set();
  const nativeAddEventListener = window.addEventListener.bind(window);
  const nativeRemoveEventListener = window.removeEventListener.bind(window);

  window.addEventListener = function addEventListener(type, listener, options) {
    if (type === 'beforeunload') {
      beforeUnloadListeners.add(listener);
      return;
    }

    nativeAddEventListener(type, listener, options);
  };

  window.removeEventListener = function removeEventListener(type, listener, options) {
    if (type === 'beforeunload') {
      beforeUnloadListeners.delete(listener);
      return;
    }

    nativeRemoveEventListener(type, listener, options);
  };

  function isDirty() {
    for (const listener of beforeUnloadListeners) {
      const event = {
        preventDefault() {},
        returnValue: undefined,
      };
      const result =
        typeof listener === 'function'
          ? listener.call(window, event)
          : listener && typeof listener.handleEvent === 'function'
            ? listener.handleEvent(event)
            : undefined;

      if (result !== undefined || event.returnValue !== undefined) return true;
    }

    return false;
  }

  function shouldGuardNavigation(anchor, event) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      anchor.hasAttribute?.('download') ||
      (anchor.target && anchor.target.toLowerCase() !== '_self')
    ) {
      return false;
    }

    const current = new URL(
      window.location?.href || 'https://kontrapuntal.whisnuys.com/admin/',
    );
    const destination = new URL(anchor.href, current);
    const staysInAdmin =
      destination.origin === current.origin &&
      (destination.pathname === '/admin' || destination.pathname.startsWith('/admin/'));

    return !staysInAdmin;
  }

  window.KontrapuntalExitGuard = { isDirty, shouldGuardNavigation };
})(window);
