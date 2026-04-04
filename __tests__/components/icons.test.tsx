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
} from '@/components/icons';

const ICONS_CONFIG = [
  { name: 'GitHubIcon', Component: GitHubIcon, viewBox: '0 0 16 16', defaultClass: 'h-5 w-5' },
  { name: 'LinkedInIcon', Component: LinkedInIcon, viewBox: '0 0 24 24', defaultClass: 'h-5 w-5' },
  { name: 'EmailIcon', Component: EmailIcon, viewBox: '0 0 24 24', defaultClass: 'h-5 w-5' },
  { name: 'SecureEmailIcon', Component: SecureEmailIcon, viewBox: '0 0 24 24', defaultClass: 'h-5 w-5' },
  { name: 'ArrowOutwardIcon', Component: ArrowOutwardIcon, viewBox: '0 0 20 20', defaultClass: 'h-4 w-4' },
  { name: 'ArrowRightIcon', Component: ArrowRightIcon, viewBox: '0 0 20 20', defaultClass: 'h-4 w-4' },
  {
    name: 'FolderIcon',
    Component: FolderIcon,
    viewBox: '0 0 24 24',
    defaultClass: 'h-9 w-9 text-primary/90',
  },
  {
    name: 'LayersIcon',
    Component: LayersIcon,
    viewBox: '0 0 24 24',
    defaultClass: 'h-9 w-9 text-primary/90',
  },
  {
    name: 'KeyIcon',
    Component: KeyIcon,
    viewBox: '0 0 24 24',
    defaultClass: 'h-5 w-5',
  },
] as const;

describe('Icon components', () => {
  ICONS_CONFIG.forEach(({ name, Component, viewBox, defaultClass }) => {
    describe(name, () => {
      it('should render an SVG element', () => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should have aria-hidden attribute', () => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      });

      it('should apply default className', () => {
        const { container } = render(<Component />);
        const svg = container.querySelector('svg');
        defaultClass.split(' ').forEach((cls) => {
          expect(svg).toHaveClass(cls);
        });
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

  describe('Specific icon requirements', () => {
    it('EmailIcon should contain exactly 2 path elements', () => {
      const { container } = render(<EmailIcon />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(2);
    });

    it('SecureEmailIcon should contain envelope and lock paths', () => {
      const { container } = render(<SecureEmailIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'currentColor');
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(3);
    });

    it('KeyIcon should contain a path element', () => {
      const { container } = render(<KeyIcon />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(1);
    });

    it('ArrowOutwardIcon should contain a path with clip-rule', () => {
      const { container } = render(<ArrowOutwardIcon />);
      const path = container.querySelector('path[clip-rule]');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('clip-rule', 'evenodd');
    });

    it('ArrowRightIcon should contain a path with clip-rule', () => {
      const { container } = render(<ArrowRightIcon />);
      const path = container.querySelector('path[clip-rule]');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('clip-rule', 'evenodd');
    });

    it('LayersIcon should contain exactly 3 path elements', () => {
      const { container } = render(<LayersIcon />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(3);
    });
  });

  describe('Flag icons', () => {
    const FLAG_ICONS = [
      { name: 'USFlagIcon', Component: USFlagIcon },
      { name: 'IsraelFlagIcon', Component: IsraelFlagIcon },
      { name: 'RussiaFlagIcon', Component: RussiaFlagIcon },
    ] as const;

    FLAG_ICONS.forEach(({ name, Component }) => {
      describe(name, () => {
        it('should render an SVG element', () => {
          const { container } = render(<Component />);
          expect(container.querySelector('svg')).toBeInTheDocument();
        });

        it('should have aria-hidden attribute', () => {
          const { container } = render(<Component />);
          expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        });

        it('should have default flag dimensions class', () => {
          const { container } = render(<Component />);
          const svg = container.querySelector('svg');
          expect(svg).toHaveClass('h-4', 'w-6');
        });

        it('should accept custom className', () => {
          const { container } = render(<Component className="custom-flag" />);
          expect(container.querySelector('svg')).toHaveClass('custom-flag');
        });
      });
    });

    it('RussiaFlagIcon should contain 3 rect elements for stripes', () => {
      const { container } = render(<RussiaFlagIcon />);
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBe(3);
    });
  });
});
