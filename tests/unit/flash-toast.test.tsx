import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlashToast } from '@/components/common/flash-toast';

const mocks = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock('@/components/ui/toast', () => ({
  Toaster: ({ closeLabel, viewportLabel }: { closeLabel: string; viewportLabel: string }) => (
    <div>
      <span>{closeLabel}</span>
      <span>{viewportLabel}</span>
    </div>
  ),
  toast: { add: mocks.add },
}));

describe('FlashToast', () => {
  beforeEach(() => {
    mocks.add.mockReset();
    document.cookie = 'lumen-flash=; Max-Age=0; Path=/';
  });

  afterEach(() => {
    document.cookie = 'lumen-flash=; Max-Age=0; Path=/';
  });

  it.each([
    ['success', 'success'],
    ['info', 'info'],
  ] as const)(
    'shows %s with its original type and default timing after clearing the cookie',
    async (type, shownType) => {
      document.cookie = `lumen-flash=${encodeURIComponent(
        JSON.stringify({ type, title: 'Notice', description: 'Saved' })
      )}; Path=/`;
      mocks.add.mockImplementation(() => {
        expect(document.cookie).not.toContain('lumen-flash=');
      });

      render(<FlashToast lang="en" />);

      await waitFor(() =>
        expect(mocks.add).toHaveBeenCalledWith({
          type: shownType,
          title: 'Notice',
          description: 'Saved',
        })
      );
    }
  );

  it('shows errors as persistent high-priority alerts', async () => {
    document.cookie = `lumen-flash=${encodeURIComponent(
      JSON.stringify({ type: 'error', title: 'Could not save' })
    )}; Path=/`;

    render(<FlashToast lang="en" />);

    await waitFor(() =>
      expect(mocks.add).toHaveBeenCalledWith({
        type: 'error',
        title: 'Could not save',
        priority: 'high',
        timeout: 0,
      })
    );
  });

  it('localizes the toaster close label', () => {
    render(<FlashToast lang="es" />);
    expect(screen.getByText('Cerrar notificación')).toBeTruthy();
    expect(screen.getByText('Notificaciones')).toBeTruthy();
  });

  it('ignores and clears a malformed cookie', async () => {
    document.cookie = 'lumen-flash=%; Path=/';
    render(<FlashToast lang="en" />);

    await waitFor(() => expect(document.cookie).not.toContain('lumen-flash='));
    expect(mocks.add).not.toHaveBeenCalled();
  });
});
