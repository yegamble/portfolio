import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProfilePicture from '@/components/ProfilePicture';
import testEn from '../fixtures/translations/en.json';

const profileAlt = testEn.hero.profileAlt;

function getAvatar(): HTMLImageElement {
  return screen.getByRole('img', { name: profileAlt }) as HTMLImageElement;
}

describe('ProfilePicture', () => {
  describe('Image rendering', () => {
    it('should render the avatar with the translated alt text', () => {
      render(<ProfilePicture />);
      expect(getAvatar()).toBeInTheDocument();
    });

    it('should fall back to the JPEG for browsers without WebP', () => {
      render(<ProfilePicture />);
      expect(getAvatar()).toHaveAttribute('src', '/images/profile.jpg');
    });

    it('should offer WebP sources for standard and retina displays', () => {
      const { container } = render(<ProfilePicture />);
      const source = container.querySelector('picture > source');

      expect(source).toHaveAttribute('type', 'image/webp');
      expect(source).toHaveAttribute(
        'srcset',
        '/images/profile-256.webp 1x, /images/profile-320.webp 2x'
      );
    });

    it('should reserve its layout box with intrinsic dimensions', () => {
      render(<ProfilePicture />);
      const img = getAvatar();

      expect(img).toHaveAttribute('width', '160');
      expect(img).toHaveAttribute('height', '160');
    });
  });

  describe('Loading priority', () => {
    // The avatar is above the fold in every viewport, so deferring it costs
    // Largest Contentful Paint directly.
    it('should not lazy-load the avatar', () => {
      render(<ProfilePicture />);
      expect(getAvatar()).not.toHaveAttribute('loading', 'lazy');
    });

    it('should request the avatar at high fetch priority', () => {
      render(<ProfilePicture />);
      expect(getAvatar()).toHaveAttribute('fetchpriority', 'high');
    });

    it('should decode off the main thread', () => {
      render(<ProfilePicture />);
      expect(getAvatar()).toHaveAttribute('decoding', 'async');
    });
  });

  describe('When the image fails to load', () => {
    it('should remove the broken image so the placeholder shows through', () => {
      render(<ProfilePicture />);

      fireEvent.error(getAvatar());

      expect(screen.queryByRole('img', { name: profileAlt })).not.toBeInTheDocument();
    });

    it('should keep the decorative placeholder in place', () => {
      const { container } = render(<ProfilePicture />);

      fireEvent.error(getAvatar());

      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('SVG avatar placeholder', () => {
    it('should render a decorative SVG behind the photo', () => {
      const { container } = render(<ProfilePicture />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should size the placeholder from its viewBox rather than fixed attributes', () => {
      const { container } = render(<ProfilePicture />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('viewBox');
      expect(svg).not.toHaveAttribute('width');
      expect(svg).not.toHaveAttribute('height');
    });
  });

  describe('Custom className', () => {
    it('should accept and apply a custom className prop', () => {
      const { container } = render(<ProfilePicture className="mb-8" />);
      expect(container.firstElementChild?.className).toContain('mb-8');
    });
  });
});
