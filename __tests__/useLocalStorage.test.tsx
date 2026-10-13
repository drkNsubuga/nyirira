import '@testing-library/jest-dom';
import { act, render } from '@testing-library/react';
import { ANALYSIS_KEY } from '@/lib/storage';
import { useLocalStorageValue } from '@/lib/useLocalStorage';

function Probe({ storageKey }: { storageKey: string }) {
  const value = useLocalStorageValue(storageKey);
  return <span data-testid="value">{value ?? 'null'}</span>;
}

describe('useLocalStorageValue', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the current stored value for a key', () => {
    window.localStorage.setItem(ANALYSIS_KEY, 'hello');
    const { getByTestId } = render(<Probe storageKey={ANALYSIS_KEY} />);
    expect(getByTestId('value')).toHaveTextContent('hello');
  });

  it('returns null when the key is absent', () => {
    const { getByTestId } = render(<Probe storageKey={ANALYSIS_KEY} />);
    expect(getByTestId('value')).toHaveTextContent('null');
  });

  it('re-renders when the same-tab notification event fires after a write', () => {
    const { getByTestId } = render(<Probe storageKey={ANALYSIS_KEY} />);
    expect(getByTestId('value')).toHaveTextContent('null');

    act(() => {
      window.localStorage.setItem(ANALYSIS_KEY, 'updated');
      window.dispatchEvent(new Event('nyirira-storage'));
    });

    expect(getByTestId('value')).toHaveTextContent('updated');
  });

  it('reacts to cross-tab storage events for nyirira_ keys', () => {
    const { getByTestId } = render(<Probe storageKey={ANALYSIS_KEY} />);

    act(() => {
      window.localStorage.setItem(ANALYSIS_KEY, 'cross-tab');
      window.dispatchEvent(new StorageEvent('storage', { key: ANALYSIS_KEY, newValue: 'cross-tab' }));
    });

    expect(getByTestId('value')).toHaveTextContent('cross-tab');
  });

  it('ignores cross-tab storage events for unrelated keys', () => {
    const { getByTestId } = render(<Probe storageKey={ANALYSIS_KEY} />);
    const initial = getByTestId('value').textContent;

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'other-app-key', newValue: 'x' }));
    });

    expect(getByTestId('value').textContent).toBe(initial);
  });
});
