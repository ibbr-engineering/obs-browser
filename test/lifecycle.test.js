// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { observe } from '../src/lifecycle.js';

const disposers = [];

afterEach(() => {
  while (disposers.length > 0) disposers.pop()();
  vi.restoreAllMocks();
});

describe('shared browser lifecycle', () => {
  it('patches history once and restores it after the last subscriber', () => {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const firstNavigate = vi.fn();
    const secondNavigate = vi.fn();

    const disposeFirst = observe({ onNavigate: firstNavigate });
    disposers.push(disposeFirst);
    const patchedPushState = history.pushState;
    const disposeSecond = observe({ onNavigate: secondNavigate });
    disposers.push(disposeSecond);

    expect(history.pushState).toBe(patchedPushState);
    history.pushState({}, '', '/first');
    expect(firstNavigate).toHaveBeenCalledOnce();
    expect(secondNavigate).toHaveBeenCalledOnce();

    disposeFirst();
    disposeFirst();
    history.replaceState({}, '', '/second');
    expect(firstNavigate).toHaveBeenCalledOnce();
    expect(secondNavigate).toHaveBeenCalledTimes(2);
    expect(history.pushState).not.toBe(originalPushState);

    disposeSecond();
    expect(history.pushState).toBe(originalPushState);
    expect(history.replaceState).toBe(originalReplaceState);
  });

  it('fans out popstate and errors without exposing event details', () => {
    const onNavigate = vi.fn();
    const onError = vi.fn();
    const dispose = observe({ onNavigate, onError });
    disposers.push(dispose);

    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new ErrorEvent('error', { message: 'private' }));
    window.dispatchEvent(new Event('unhandledrejection'));

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith();
  });
});
