import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  GitHubIcon,
  LinkedInIcon,
  EmailIcon,
  SecureEmailIcon,
  ArrowOutwardIcon,
  ArrowRightIcon,
  FolderIcon,
  LayersIcon,
  KeyIcon,
  USFlagIcon,
  IsraelFlagIcon,
  RussiaFlagIcon,
  EstoniaFlagIcon,
} from '@/components/icons';

const ICONS_CONFIG = [
  {
    name: 'GitHubIcon',
    Component: GitHubIcon,
    viewBox: '0 0 16 16',
  },
  {
    name: 'LinkedInIcon',
    Component: LinkedInIcon,
    viewBox: '0 0 24 24',
  },
  {
    name: 'EmailIcon',
    Component: EmailIcon,
    viewBox: '0 0 24 24',
  },
  {
    name: 'SecureEmailIcon',
    Component: SecureEmailIcon,
    viewBox: '0 0 24 24',
  },
  {
    name: 'ArrowOutwardIcon',
    Component: ArrowOutwardIcon,
    viewBox: '0 0 20 20',
  },
  {
    name: 'ArrowRightIcon',
    Component: ArrowRightIcon,
    viewBox: '0 0 20 20',
  },
  {
    name: 'FolderIcon',
    Component: FolderIcon,
    viewBox: '0 0 24 24',
  },
  {
    name: 'LayersIcon',
    Component: LayersIcon,
    viewBox: '0 0 24 24',
  },
  {
    name: 'KeyIcon',
    Component: KeyIcon,
    viewBox: '0 0 24 24',
  },
] as const;

describe('Icon components', () => {
  ICONS_CONFIG.forEach(({ name, Component, viewBox }) => {
    describe(name, () => {
      it('should render an SVG element', () => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should have aria-hidden attribute', () => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      });

      it('should accept custom className', () => {
        const customClass = 'test-class-123';
        const { container } = render(<Component className={customClass} />);
        expect(container.querySelector('svg')).toHaveClass(customClass);
      });

      it(`should use correct viewBox: ${viewBox}`, () => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg')).toHaveAttribute('viewBox', viewBox);
      });

      it('should use fill="currentColor"', () => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
      });

      it('should have xmlns attribute', () => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg')).toHaveAttribute(
          'xmlns',
          'http://www.w3.org/2000/svg'
        );
      });
    });
  });

  describe('Flag icons', () => {
    const FLAG_ICONS = [
      { name: 'USFlagIcon', Component: USFlagIcon },
      { name: 'IsraelFlagIcon', Component: IsraelFlagIcon },
      { name: 'RussiaFlagIcon', Component: RussiaFlagIcon },
      { name: 'EstoniaFlagIcon', Component: EstoniaFlagIcon },
    ] as const;

    FLAG_ICONS.forEach(({ name, Component }) => {
      describe(name, () => {
        it('should render an SVG element', () => {
          const { container } = render(<Component />);
          expect(container.querySelector('svg')).toBeInTheDocument();
        });

        it('should keep the 3:2 flag aspect ratio', () => {
          const { container } = render(<Component />);
          expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 36 24');
        });

        it('should have aria-hidden attribute', () => {
          const { container } = render(<Component />);
          expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        });

        it('should accept custom className', () => {
          const { container } = render(<Component className="custom-flag" />);
          expect(container.querySelector('svg')).toHaveClass('custom-flag');
        });
      });
    });
  });
});
