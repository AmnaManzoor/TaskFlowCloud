import { ThemeStore } from '@core/stores/theme.store';

describe('ThemeStore', () => {
  let store: ThemeStore;

  beforeEach(() => {
    store = new ThemeStore();
  });

  it('should default to system mode', () => {
    expect(store.mode()).toBe('system');
  });

  it('should update mode', () => {
    store.setMode('dark');
    expect(store.mode()).toBe('dark');
  });

  it('should resolve light or dark theme', () => {
    store.setMode('light');
    expect(store.resolvedTheme()).toBe('light');
  });
});
