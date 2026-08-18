import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
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

// Start original mock
vi.mock('openpgp', () => ({
  readKey: vi.fn(() => new Promise((resolve) => {
    // Simulate some async parsing time
    setTimeout(() => resolve(mockKeyData), 10);
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k })
}));

describe('PgpKeyModal Benchmark', () => {
  it('measures render time', async () => {
    const times: number[] = [];

    // Warm up
    const { unmount: warmup } = render(<PgpKeyModal isOpen={true} onClose={() => {}} armoredKey={TEST_ARMORED_KEY} />);
    await waitFor(() => {
        expect(screen.queryByText('pgp.loading')).not.toBeInTheDocument();
        expect(screen.queryByText('pgp.error')).not.toBeInTheDocument();
    }, { timeout: 10000 });
    warmup();

    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      const { unmount } = render(<PgpKeyModal isOpen={true} onClose={() => {}} armoredKey={TEST_ARMORED_KEY} />);
      await waitFor(() => {
          expect(screen.queryByText('pgp.loading')).not.toBeInTheDocument();
          expect(screen.queryByText('pgp.error')).not.toBeInTheDocument();
      }, { timeout: 10000 });
      const end = performance.now();
      times.push(end - start);
      unmount();
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`Average time to render modal and parse key: ${avg.toFixed(2)}ms`);
    expect(avg).toBeGreaterThan(0);
  }, 30000); // 30s timeout
});
