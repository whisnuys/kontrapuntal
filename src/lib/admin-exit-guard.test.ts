import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);
const guardSource = readFileSync(new URL('public/nulis/exit-guard.js', projectRoot), 'utf8');

type BeforeUnloadEvent = { returnValue?: string };
type Listener = (event: BeforeUnloadEvent) => unknown;

function loadGuard() {
  const nativeListeners = new Map<string, Set<Listener>>();
  const window = {
    addEventListener(type: string, listener: Listener) {
      const listeners = nativeListeners.get(type) ?? new Set<Listener>();
      listeners.add(listener);
      nativeListeners.set(type, listeners);
    },
    removeEventListener(type: string, listener: Listener) {
      nativeListeners.get(type)?.delete(listener);
    },
  };

  runInNewContext(guardSource, { URL, window });

  return {
    guard: (window as typeof window & {
      KontrapuntalExitGuard: {
        isDirty(): boolean;
        shouldGuardNavigation(anchor: {
          href: string;
          target?: string;
          download?: string;
          hasAttribute?(name: string): boolean;
        }, event: {
          button: number;
          metaKey: boolean;
          ctrlKey: boolean;
          shiftKey: boolean;
          altKey: boolean;
        }): boolean;
      };
    }).KontrapuntalExitGuard,
    nativeListeners,
    window,
  };
}

test('Decap beforeunload listeners are retained for dirty-state checks but never registered natively', () => {
  const { guard, nativeListeners, window } = loadGuard();
  const listener = (event: BeforeUnloadEvent) => {
    event.returnValue = 'unsaved';
    return 'unsaved';
  };

  window.addEventListener('beforeunload', listener);

  assert.equal(nativeListeners.get('beforeunload')?.size ?? 0, 0);
  assert.equal(guard.isDirty(), true);

  window.removeEventListener('beforeunload', listener);
  assert.equal(guard.isDirty(), false);
});

test('ordinary window listeners still use the browser event target', () => {
  const { nativeListeners, window } = loadGuard();
  const listener = () => undefined;

  window.addEventListener('resize', listener);

  assert.equal(nativeListeners.get('resize')?.has(listener), true);
});

test('a clean Decap beforeunload listener does not trigger the custom exit guard', () => {
  const { guard, window } = loadGuard();

  window.addEventListener('beforeunload', () => undefined);

  assert.equal(guard.isDirty(), false);
});

test('only an ordinary link that leaves the editor document uses the custom dialog', () => {
  const { guard } = loadGuard();
  const ordinaryClick = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  };

  assert.equal(
    guard.shouldGuardNavigation({ href: 'https://kontrapuntal.whisnuys.com/about' }, ordinaryClick),
    true,
  );
  assert.equal(
    guard.shouldGuardNavigation(
      { href: 'https://kontrapuntal.whisnuys.com/nulis/#/collections/notes' },
      ordinaryClick,
    ),
    false,
  );
  assert.equal(
    guard.shouldGuardNavigation(
      { href: 'https://kontrapuntal.whisnuys.com/about', target: '_blank' },
      ordinaryClick,
    ),
    false,
  );
  assert.equal(
    guard.shouldGuardNavigation(
      { href: 'https://kontrapuntal.whisnuys.com/about' },
      { ...ordinaryClick, metaKey: true },
    ),
    false,
  );
  assert.equal(
    guard.shouldGuardNavigation(
      {
        href: 'https://kontrapuntal.whisnuys.com/download',
        hasAttribute: (name: string) => name === 'download',
      },
      ordinaryClick,
    ),
    false,
  );
});
