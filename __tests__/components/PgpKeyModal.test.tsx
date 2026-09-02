import { act, render, screen, waitFor } from '@testing-library/react';
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
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
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

      screen.getByRole('button', { name: /copy key/i }).click();

      await waitFor(() => {
        expect(screen.getByText('Copy failed')).toBeInTheDocument();
      });
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });

    it('should tell the user when the browser exposes no Clipboard API at all', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

      screen.getByRole('button', { name: /copy key/i }).click();

      await waitFor(() => {
        expect(screen.getByText('Copy failed')).toBeInTheDocument();
      });
    });

    it('should announce the outcome rather than leaving a stale accessible name', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Document is not focused'));
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

      const copyButton = screen.getByRole('button', { name: 'Copy Key' });
      expect(copyButton).toHaveAttribute('aria-live', 'polite');

      copyButton.click();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
      });
    });

    it('should return the button to its idle label once the feedback window closes', async () => {
      vi.useFakeTimers();
      try {
        mockWriteText.mockRejectedValueOnce(new Error('Document is not focused'));
        render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

        await act(async () => {
          screen.getByRole('button', { name: 'Copy Key' }).click();
        });
        expect(screen.getByText('Copy failed')).toBeInTheDocument();

        await act(async () => {
          vi.advanceTimersByTime(2000);
        });
        expect(screen.getByRole('button', { name: 'Copy Key' })).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
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
