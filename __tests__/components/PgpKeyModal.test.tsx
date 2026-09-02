import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Key } from 'openpgp';
import PgpKeyModal from '@/components/PgpKeyModal';

const TEST_ARMORED_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: Test
mQENBGRhAAAAAAEIATestKeyData
-----END PGP PUBLIC KEY BLOCK-----`;

// Distinct keys keep tests independent of the module-level single-entry memo,
// which persists for the lifetime of the module.
const REUSE_ARMORED_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'ReuseKeyData');
const UNPARSEABLE_ARMORED_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'BrokenKeyData');
const OTHER_ARMORED_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'OtherKeyData');
const LOADING_ARMORED_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'LoadingKeyData');
const ALERT_ARMORED_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'AlertKeyData');

const mockKeyData = {
  getFingerprint: () => 'abcd1234efgh5678ijkl9012mnop3456qrst7890',
  getUserIDs: () => ['Test User <test@example.com>'],
  getAlgorithmInfo: () => ({ algorithm: 'rsaEncryptSign', bits: 2048 }),
  getCreationTime: () => new Date('2016-05-01T00:00:00Z'),
  getKeyID: () => ({ toHex: () => '43b9eaf361a77e08' }),
};

vi.mock('openpgp', () => ({
  readKey: vi.fn(() => Promise.resolve(mockKeyData)),
}));

const otherKeyData = {
  ...mockKeyData,
  getUserIDs: () => ['Other User <other@example.com>'],
};

const mockOnClose = vi.fn();
const mockWriteText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  mockOnClose.mockClear();
  mockWriteText.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    configurable: true,
  });
});

// While the key is still parsing the modal carries a second status region (the
// loading notice), so the copy feedback is addressed through the row it shares
// with the button it belongs to.
function copyStatus(): HTMLElement {
  const row = screen.getByRole('button', { name: 'Copy Key' }).parentElement;
  return within(row as HTMLElement).getByRole('status');
}

describe('PgpKeyModal', () => {
  it('should not render when isOpen is false', () => {
    render(<PgpKeyModal isOpen={false} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render a dialog when isOpen is true', async () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display the modal title', async () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    expect(screen.getByText('PGP Public Key')).toBeInTheDocument();
  });

  it('should display parsed fingerprint', async () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    await waitFor(() => {
      expect(screen.getByText(/abcd 1234/i)).toBeInTheDocument();
    });
  });

  it('should display parsed user ID', async () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    await waitFor(() => {
      expect(screen.getByText('Test User <test@example.com>')).toBeInTheDocument();
    });
  });

  it('should display the algorithm info', async () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    await waitFor(() => {
      expect(screen.getByText(/rsaEncryptSign/)).toBeInTheDocument();
    });
  });

  it('should display the full armored key in a code block', () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    const pre = screen.getByText(/BEGIN PGP PUBLIC KEY BLOCK/);
    expect(pre).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    const backdrop = screen.getByRole('dialog').parentElement!;
    await user.click(backdrop);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have aria-modal attribute', () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('should copy key to clipboard when copy button is clicked', async () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    const copyButton = screen.getByRole('button', { name: /copy key/i });
    copyButton.click();
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(TEST_ARMORED_KEY);
    });
  });

  it('should show copied feedback after clicking copy', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    const copyButton = screen.getByRole('button', { name: /copy key/i });
    await user.click(copyButton);
    await waitFor(() => {
      expect(copyStatus()).toHaveTextContent('Copied!');
    });
  });

  it('should keep the copy button label static so the outcome renames nothing', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

    // The live region exists up front; a region mounted alongside its first
    // message is not announced.
    expect(copyStatus()).toHaveTextContent('');

    await user.click(screen.getByRole('button', { name: 'Copy Key' }));

    await waitFor(() => {
      expect(copyStatus()).toHaveTextContent('Copied!');
    });
    expect(screen.getByRole('button', { name: 'Copy Key' })).toBeInTheDocument();
  });

  it('should display verify notice', async () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
    await waitFor(() => {
      expect(screen.getByText(/verify this fingerprint/i)).toBeInTheDocument();
    });
  });

  it('should not parse the key again when the modal is reopened', async () => {
    const { readKey } = await import('openpgp');
    vi.mocked(readKey).mockClear();

    const { unmount } = render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={REUSE_ARMORED_KEY} />
    );
    await waitFor(() => {
      expect(screen.getByText('Test User <test@example.com>')).toBeInTheDocument();
    });
    expect(readKey).toHaveBeenCalledTimes(1);
    unmount();

    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={REUSE_ARMORED_KEY} />);
    expect(screen.getByText('Test User <test@example.com>')).toBeInTheDocument();
    expect(readKey).toHaveBeenCalledTimes(1);
  });

  it('should parse the key again when a different key is passed', async () => {
    const { readKey } = await import('openpgp');
    vi.mocked(readKey).mockClear();

    const { unmount } = render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    await waitFor(() => {
      expect(screen.getByText('Test User <test@example.com>')).toBeInTheDocument();
    });
    unmount();

    vi.mocked(readKey).mockResolvedValueOnce(otherKeyData as unknown as Key);
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={OTHER_ARMORED_KEY} />);

    await waitFor(() => {
      expect(screen.getByText('Other User <other@example.com>')).toBeInTheDocument();
    });
    expect(readKey).toHaveBeenCalledTimes(2);
    expect(readKey).toHaveBeenLastCalledWith({ armoredKey: OTHER_ARMORED_KEY });
  });

  // These drive the button directly: userEvent.setup() installs its own
  // navigator.clipboard stub, which would shadow the mock under test.
  describe('when the clipboard write fails', () => {
    it('should tell the user instead of rejecting unhandled', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Document is not focused'));
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

      screen.getByRole('button', { name: 'Copy Key' }).click();

      await waitFor(() => {
        expect(copyStatus()).toHaveTextContent('Copy failed');
      });
      expect(copyStatus()).not.toHaveTextContent('Copied!');
    });

    it('should tell the user when the browser exposes no Clipboard API at all', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

      screen.getByRole('button', { name: 'Copy Key' }).click();

      await waitFor(() => {
        expect(copyStatus()).toHaveTextContent('Copy failed');
      });
    });

    it('should announce the outcome politely rather than renaming the button', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Document is not focused'));
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

      expect(copyStatus()).toHaveAttribute('aria-live', 'polite');

      screen.getByRole('button', { name: 'Copy Key' }).click();

      await waitFor(() => {
        expect(copyStatus()).toHaveTextContent('Copy failed');
      });
      expect(screen.getByRole('button', { name: 'Copy Key' })).toBeInTheDocument();
    });

    it('should clear the status once the feedback window closes', async () => {
      vi.useFakeTimers();
      try {
        mockWriteText.mockRejectedValueOnce(new Error('Document is not focused'));
        render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

        await act(async () => {
          screen.getByRole('button', { name: 'Copy Key' }).click();
        });
        expect(copyStatus()).toHaveTextContent('Copy failed');

        await act(async () => {
          vi.advanceTimersByTime(2000);
        });
        expect(copyStatus()).toHaveTextContent('');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('the key block', () => {
    it('should be a labelled region a keyboard user can reach', () => {
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);
      const region = screen.getByRole('region', { name: 'PGP key text' });
      expect(region).toHaveAttribute('tabindex', '0');
      expect(within(region).getByText(/BEGIN PGP PUBLIC KEY BLOCK/)).toBeInTheDocument();
    });

    it('should sit in the tab order between Close and Copy', async () => {
      const user = userEvent.setup({ writeToClipboard: false });
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

      screen.getByRole('button', { name: /close/i }).focus();
      await user.tab();
      expect(screen.getByRole('region', { name: 'PGP key text' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Copy Key' })).toHaveFocus();
    });
  });

  it('should announce that the key details are still loading', () => {
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={LOADING_ARMORED_KEY} />);
    const loading = screen.getByText('Loading key details...');
    expect(loading).toHaveAttribute('role', 'status');
  });

  it('should announce a parse failure assertively', async () => {
    const openpgp = await import('openpgp');
    vi.mocked(openpgp.readKey).mockRejectedValueOnce(new Error('parse failure'));
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={ALERT_ARMORED_KEY} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Could not parse key details');
    });
  });

  it('should display error message when key parsing fails', async () => {
    const openpgp = await import('openpgp');
    vi.mocked(openpgp.readKey).mockRejectedValueOnce(new Error('parse failure'));
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={UNPARSEABLE_ARMORED_KEY} />
    );
    await waitFor(() => {
      expect(screen.getByText('Could not parse key details')).toBeInTheDocument();
    });
  });
});
