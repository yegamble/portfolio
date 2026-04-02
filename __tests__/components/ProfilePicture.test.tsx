import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProfilePicture from '@/components/ProfilePicture';
import en from '../../public/locales/en/translation.json';

const profileAlt = en.hero.profileAlt;

describe('ProfilePicture', () => {
  describe('Image rendering', () => {
    it('should render a profile image with correct alt text', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      expect(img).toBeInTheDocument();
    });

    it('should render the image with the correct src', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      expect(img).toHaveAttribute('src', expect.stringContaining('profile.jpg'));
    });

    it('should render with lazy loading', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Circular styling', () => {
    it('should render with rounded-full for circular shape', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      const circleContainer = img.closest('.rounded-full');
      expect(circleContainer).toBeInTheDocument();
    });

    it('should render with bg-slate-800 placeholder background', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      const container = img.closest('.bg-slate-800');
      expect(container).toBeInTheDocument();
    });

    it('should render with a primary ring border', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      const ringContainer = img.closest('.ring-2');
      expect(ringContainer).toBeInTheDocument();
    });

    it('should render with overflow hidden for circular crop', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      const container = img.closest('.overflow-hidden');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Sizing', () => {
    it('should render with base size of 128px (h-32 w-32)', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      const sizeContainer = img.closest('.h-32');
      expect(sizeContainer).toBeInTheDocument();
      expect(sizeContainer).toHaveClass('w-32');
    });

    it('should scale up on sm breakpoint (sm:h-40 sm:w-40)', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      const sizeContainer = img.closest('.h-32');
      expect(sizeContainer).toHaveClass('sm:h-40', 'sm:w-40');
    });
  });

  describe('Custom className', () => {
    it('should accept and apply custom className prop', () => {
      const { container } = render(<ProfilePicture className="mb-8" />);
      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain('mb-8');
    });

    it('should render with inline-block display by default', () => {
      const { container } = render(<ProfilePicture />);
      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain('inline-block');
    });
  });

  describe('Image attributes', () => {
    it('should render with object-cover for proper image fit', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      expect(img).toHaveClass('object-cover');
    });

    it('should have width and height attributes set', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: new RegExp(profileAlt, 'i') });
      expect(img).toHaveAttribute('width', '160');
      expect(img).toHaveAttribute('height', '160');
    });
  });

  describe('SVG avatar placeholder', () => {
    it('should render an SVG avatar placeholder', () => {
      const { container } = render(<ProfilePicture />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render SVG with aria-hidden for accessibility', () => {
      const { container } = render(<ProfilePicture />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render SVG with currentColor fill', () => {
      const { container } = render(<ProfilePicture />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });

    it('should render SVG with viewBox for flexible sizing', () => {
      const { container } = render(<ProfilePicture />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox');
      expect(svg).not.toHaveAttribute('width');
      expect(svg).not.toHaveAttribute('height');
    });

    it('should render SVG inside the circular container with relative positioning', () => {
      const { container } = render(<ProfilePicture />);
      const svg = container.querySelector('svg');
      const circularContainer = svg?.closest('.rounded-full');
      expect(circularContainer).toBeInTheDocument();
      expect(circularContainer).toHaveClass('relative');
    });
  });
});
