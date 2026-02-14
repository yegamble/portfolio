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
} from '@/components/icons';

describe('Icon components', () => {
  describe('GitHubIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<GitHubIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<GitHubIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply default className', () => {
      const { container } = render(<GitHubIcon />);
      expect(container.querySelector('svg')).toHaveClass('h-5', 'w-5');
    });

    it('should accept custom className', () => {
      const { container } = render(<GitHubIcon className="h-8 w-8" />);
      expect(container.querySelector('svg')).toHaveClass('h-8', 'w-8');
    });

    it('should use correct viewBox for 16x16 icon', () => {
      const { container } = render(<GitHubIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 16 16');
    });
  });

  describe('LinkedInIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<LinkedInIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<LinkedInIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should accept custom className', () => {
      const { container } = render(<LinkedInIcon className="h-6 w-6" />);
      expect(container.querySelector('svg')).toHaveClass('h-6', 'w-6');
    });

    it('should use correct viewBox for 24x24 icon', () => {
      const { container } = render(<LinkedInIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('EmailIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<EmailIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<EmailIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should contain multiple path elements for envelope', () => {
      const { container } = render(<EmailIcon />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(2);
    });
  });

  describe('SecureEmailIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<SecureEmailIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<SecureEmailIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should contain a path with clip rule for lock icon', () => {
      const { container } = render(<SecureEmailIcon />);
      const path = container.querySelector('path[clip-rule]');
      expect(path).toBeInTheDocument();
    });
  });

  describe('ArrowOutwardIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<ArrowOutwardIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<ArrowOutwardIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply default h-4 w-4 className', () => {
      const { container } = render(<ArrowOutwardIcon />);
      expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4');
    });

    it('should accept custom className', () => {
      const { container } = render(<ArrowOutwardIcon className="h-5 w-5 text-text-muted" />);
      expect(container.querySelector('svg')).toHaveClass('h-5', 'w-5', 'text-text-muted');
    });
  });

  describe('ArrowRightIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<ArrowRightIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<ArrowRightIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply default h-4 w-4 className', () => {
      const { container } = render(<ArrowRightIcon />);
      expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4');
    });
  });

  describe('FolderIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<FolderIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<FolderIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply default h-9 w-9 className', () => {
      const { container } = render(<FolderIcon />);
      expect(container.querySelector('svg')).toHaveClass('h-9', 'w-9');
    });

    it('should accept custom className', () => {
      const { container } = render(<FolderIcon className="h-12 w-12" />);
      expect(container.querySelector('svg')).toHaveClass('h-12', 'w-12');
    });
  });

  describe('LayersIcon', () => {
    it('should render an SVG element', () => {
      const { container } = render(<LayersIcon />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<LayersIcon />);
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply default h-9 w-9 className', () => {
      const { container } = render(<LayersIcon />);
      expect(container.querySelector('svg')).toHaveClass('h-9', 'w-9');
    });

    it('should contain multiple path elements for layers', () => {
      const { container } = render(<LayersIcon />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(3);
    });
  });

  describe('All icons share common behavior', () => {
    const icons = [
      { name: 'GitHubIcon', Component: GitHubIcon },
      { name: 'LinkedInIcon', Component: LinkedInIcon },
      { name: 'EmailIcon', Component: EmailIcon },
      { name: 'SecureEmailIcon', Component: SecureEmailIcon },
      { name: 'ArrowOutwardIcon', Component: ArrowOutwardIcon },
      { name: 'ArrowRightIcon', Component: ArrowRightIcon },
      { name: 'FolderIcon', Component: FolderIcon },
      { name: 'LayersIcon', Component: LayersIcon },
    ];

    icons.forEach(({ name, Component }) => {
      it(`${name} should use fill="currentColor"`, () => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
      });

      it(`${name} should have xmlns attribute`, () => {
        const { container } = render(<Component />);
        expect(container.querySelector('svg')).toHaveAttribute(
          'xmlns',
          'http://www.w3.org/2000/svg'
        );
      });
    });
  });
});
