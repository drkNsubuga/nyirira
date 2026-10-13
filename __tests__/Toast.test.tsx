import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Toast, { ToastMessage } from '@/components/Toast';

const successToast: ToastMessage = { id: 1, variant: 'success', text: 'Saved!' };

describe('Toast', () => {
  it('renders nothing when there is no toast', () => {
    const { container } = render(<Toast toast={null} onDismiss={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the message with an accessible live region', () => {
    render(<Toast toast={successToast} onDismiss={() => {}} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('applies the success variant styling', () => {
    render(<Toast toast={successToast} onDismiss={() => {}} />);
    const inner = screen.getByRole('status').firstElementChild as HTMLElement;
    expect(inner.className).toContain('bg-emerald-600');
  });

  it('applies the error variant styling', () => {
    render(<Toast toast={{ id: 2, variant: 'error', text: 'Boom' }} onDismiss={() => {}} />);
    const inner = screen.getByRole('status').firstElementChild as HTMLElement;
    expect(inner.className).toContain('bg-red-600');
  });

  it('calls onDismiss when the close button is clicked', () => {
    const onDismiss = jest.fn();
    render(<Toast toast={successToast} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after the duration', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<Toast toast={successToast} onDismiss={onDismiss} duration={1000} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
