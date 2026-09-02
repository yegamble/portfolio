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
const PHASE_ARMORED_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'PhaseKeyData');
const SILENCE_ARMORED_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'SilenceKeyData');
const CACHED_ARMORED_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'CachedKeyData');
const ALERT_ARMORED_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'AlertKeyData');
const ESCAPED_SOURCE_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'EscapedKeyData');
const BASE64_SOURCE_KEY = TEST_ARMORED_KEY.replace('TestKeyData', 'Base64KeyData');

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
      expect(screen.getByRole('status')).toHaveTextContent('Copied!');
    });
  });

  it('should keep the copy button label static so the outcome renames nothing', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

    // The live region is mounted from the first render; a region that appears
    // together with its first message is not announced.
    expect(screen.getByRole('status')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy Key' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Copied!');
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
        expect(screen.getByRole('status')).toHaveTextContent('Copy failed');
      });
      expect(screen.getByRole('status')).not.toHaveTextContent('Copied!');
    });

    it('should tell the user when the browser exposes no Clipboard API at all', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

      screen.getByRole('button', { name: 'Copy Key' }).click();

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Copy failed');
      });
    });

    it('should announce the outcome politely rather than renaming the button', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Document is not focused'));
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

      screen.getByRole('button', { name: 'Copy Key' }).click();

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Copy failed');
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
        expect(screen.getByRole('status')).toHaveTextContent('Copy failed');

        await act(async () => {
          vi.advanceTimersByTime(2000);
        });
        expect(screen.getByRole('status')).toHaveTextContent('');
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

  describe('the status region', () => {
    it('should be the only one, so nothing competes to be announced', async () => {
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={LOADING_ARMORED_KEY} />);
      expect(screen.getAllByRole('status')).toHaveLength(1);
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Key details loaded');
      });
      expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    it('should announce that the key details are still loading', () => {
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={PHASE_ARMORED_KEY} />);
      expect(screen.getByRole('status')).toHaveTextContent('Loading key details...');
    });

    it('should announce the parse finishing, then fall silent', async () => {
      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={SILENCE_ARMORED_KEY} />);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Key details loaded');
      });

      // The announcement is an event, not a label — it goes back to empty so
      // the next thing the region says is heard as new.
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(''), {
        timeout: 4000,
      });
    });

    it('should say nothing on reopen, when the details are already there', async () => {
      const { unmount } = render(
        <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={CACHED_ARMORED_KEY} />
      );
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Key details loaded');
      });
      unmount();

      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={CACHED_ARMORED_KEY} />);
      expect(screen.getByRole('status')).toHaveTextContent('');
      expect(screen.getByText('Test User <test@example.com>')).toBeInTheDocument();
    });
  });

  it('should announce a parse failure assertively', async () => {
    const openpgp = await import('openpgp');
    vi.mocked(openpgp.readKey).mockRejectedValueOnce(new Error('parse failure'));
    render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={ALERT_ARMORED_KEY} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Could not parse key details');
    });
  });

  // NEXT_PUBLIC_PGP_PUBLIC_KEY travels through .env files, Cloudflare's
  // dashboard and CI secrets, and each of them mangles a multi-line value
  // differently. The modal normalises what it is handed before parsing it, and
  // the key block is what a visitor copies, so the decoding has to survive as
  // far as the DOM.
  describe('the armored key it is handed', () => {
    function keyBlockText(): string {
      return screen.getByRole('region', { name: 'PGP key text' }).textContent ?? '';
    }

    it('should turn the literal backslash-n of a quoted env var into real newlines', async () => {
      const { readKey } = await import('openpgp');
      vi.mocked(readKey).mockClear();

      const escaped = ESCAPED_SOURCE_KEY.replace(/\n/g, '\\n');
      expect(escaped).not.toContain('\n');

      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={escaped} />);

      await waitFor(() => {
        expect(readKey).toHaveBeenCalledWith({ armoredKey: ESCAPED_SOURCE_KEY });
      });
      // A single-line key block is not a usable key: the header, the payload
      // and the footer have to sit on their own lines to be copied out.
      expect(keyBlockText()).toContain('\n');
      expect(keyBlockText()).not.toContain('\\n');
    });

    it('should decode a base64-armored key before parsing and showing it', async () => {
      const { readKey } = await import('openpgp');
      vi.mocked(readKey).mockClear();

      const encoded = btoa(BASE64_SOURCE_KEY);

      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={encoded} />);

      await waitFor(() => {
        expect(readKey).toHaveBeenCalledWith({ armoredKey: BASE64_SOURCE_KEY });
      });
      expect(keyBlockText()).toContain('BEGIN PGP PUBLIC KEY BLOCK');
      expect(keyBlockText()).not.toContain(encoded);
    });

    it('should show a value that is neither armored nor base64 as it stands', async () => {
      const { readKey } = await import('openpgp');
      vi.mocked(readKey).mockClear();
      vi.mocked(readKey).mockRejectedValueOnce(new Error('not a key'));

      // Not base64 (`!` is outside the alphabet) and not an armored block, so
      // atob throws and there is nothing to decode. Showing the raw value is
      // what lets someone see that the deployment handed the page a
      // placeholder rather than a key.
      const misconfigured = 'set-me-in-the-dashboard!';

      render(<PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={misconfigured} />);

      await waitFor(() => {
        expect(readKey).toHaveBeenCalledWith({ armoredKey: misconfigured });
      });
      expect(keyBlockText()).toBe(misconfigured);
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not parse key details');
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
