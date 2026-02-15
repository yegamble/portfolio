import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProfilePicture from '@/components/ProfilePicture';

describe('ProfilePicture', () => {
  describe('Image rendering', () => {
    it('should render a profile image with correct alt text', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
      expect(img).toBeInTheDocument();
    });

    it('should render the image with the correct src', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
      expect(img).toHaveAttribute('src', expect.stringContaining('profile.jpg'));
    });

    it('should render with priority loading (no lazy loading)', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
      expect(img).not.toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Circular styling', () => {
    it('should render with rounded-full for circular shape', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
      const circleContainer = img.closest('.rounded-full');
      expect(circleContainer).toBeInTheDocument();
    });

    it('should render with a primary ring border', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
      const ringContainer = img.closest('.ring-2');
      expect(ringContainer).toBeInTheDocument();
    });

    it('should render with overflow hidden for circular crop', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
      const container = img.closest('.overflow-hidden');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Sizing', () => {
    it('should render with base size of 128px (h-32 w-32)', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
      const sizeContainer = img.closest('.h-32');
      expect(sizeContainer).toBeInTheDocument();
      expect(sizeContainer).toHaveClass('w-32');
    });

    it('should scale up on sm breakpoint (sm:h-40 sm:w-40)', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
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
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
      expect(img).toHaveClass('object-cover');
    });

    it('should have width and height attributes set', () => {
      render(<ProfilePicture />);
      const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
      expect(img).toHaveAttribute('width', '160');
      expect(img).toHaveAttribute('height', '160');
    });
  });
});
