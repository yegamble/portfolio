import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PgpKeyModal from '@/components/PgpKeyModal';

const TEST_ARMORED_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: Test
mQENBGRhAAAAAAEIATestKeyData
-----END PGP PUBLIC KEY BLOCK-----`;

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
    render(
      <PgpKeyModal isOpen={false} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render a dialog when isOpen is true', async () => {
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display the modal title', async () => {
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    expect(screen.getByText('PGP Public Key')).toBeInTheDocument();
  });

  it('should display parsed fingerprint', async () => {
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    await waitFor(() => {
      expect(screen.getByText(/abcd 1234/i)).toBeInTheDocument();
    });
  });

  it('should display parsed user ID', async () => {
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    await waitFor(() => {
      expect(screen.getByText('Test User <test@example.com>')).toBeInTheDocument();
    });
  });

  it('should display the algorithm info', async () => {
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    await waitFor(() => {
      expect(screen.getByText(/rsaEncryptSign/)).toBeInTheDocument();
    });
  });

  it('should display the full armored key in a code block', () => {
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    const pre = screen.getByText(/BEGIN PGP PUBLIC KEY BLOCK/);
    expect(pre).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    const backdrop = screen.getByRole('dialog').parentElement!;
    await user.click(backdrop);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have aria-modal attribute', () => {
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('should copy key to clipboard when copy button is clicked', async () => {
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    const copyButton = screen.getByRole('button', { name: /copy key/i });
    copyButton.click();
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(TEST_ARMORED_KEY);
    });
  });

  it('should show copied feedback after clicking copy', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    const copyButton = screen.getByRole('button', { name: /copy key/i });
    await user.click(copyButton);
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should display verify notice', async () => {
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    await waitFor(() => {
      expect(
        screen.getByText(/verify this fingerprint/i)
      ).toBeInTheDocument();
    });
  });

  it('should display error message when key parsing fails', async () => {
    const openpgp = await import('openpgp');
    vi.mocked(openpgp.readKey).mockRejectedValueOnce(new Error('parse failure'));
    render(
      <PgpKeyModal isOpen={true} onClose={mockOnClose} armoredKey={TEST_ARMORED_KEY} />
    );
    await waitFor(() => {
      expect(screen.getByText('Could not parse key details')).toBeInTheDocument();
    });
  });
});
