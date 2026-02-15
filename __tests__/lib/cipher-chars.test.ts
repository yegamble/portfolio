import { describe, it, expect } from 'vitest';
import {
  getRandomCipherChar,
  isScramblable,
} from '@/lib/cipher-chars';

describe('cipher-chars utility', () => {
  describe('getRandomCipherChar', () => {
    it('should return a single character string', () => {
      const char = getRandomCipherChar();
      expect(char).toBeTypeOf('string');
      expect(Array.from(char).length).toBe(1);
    });

    it('should return characters from multiple scripts across multiple calls', () => {
      const chars = new Set<string>();
      for (let i = 0; i < 100; i++) {
        chars.add(getRandomCipherChar());
      }
      expect(chars.size).toBeGreaterThanOrEqual(30);
    });

    it('should return valid Unicode characters', () => {
      for (let i = 0; i < 50; i++) {
        const char = getRandomCipherChar();
        expect(Array.from(char).length).toBe(1);
        expect(char.trim()).toBe(char);
      }
    });
  });

  describe('isScramblable', () => {
    it('should return false for whitespace', () => {
      expect(isScramblable(' ')).toBe(false);
      expect(isScramblable('\t')).toBe(false);
      expect(isScramblable('\n')).toBe(false);
    });

    it('should return false for digits', () => {
      expect(isScramblable('0')).toBe(false);
      expect(isScramblable('5')).toBe(false);
      expect(isScramblable('9')).toBe(false);
    });

    it('should return false for common punctuation', () => {
      expect(isScramblable('.')).toBe(false);
      expect(isScramblable(',')).toBe(false);
      expect(isScramblable('!')).toBe(false);
      expect(isScramblable('?')).toBe(false);
      expect(isScramblable('-')).toBe(false);
      expect(isScramblable('(')).toBe(false);
      expect(isScramblable(')')).toBe(false);
    });

    it('should return true for Latin alphabetic characters', () => {
      expect(isScramblable('A')).toBe(true);
      expect(isScramblable('Z')).toBe(true);
      expect(isScramblable('a')).toBe(true);
      expect(isScramblable('z')).toBe(true);
    });

    it('should return true for Hebrew characters', () => {
      expect(isScramblable('א')).toBe(true);
      expect(isScramblable('ת')).toBe(true);
    });

    it('should return true for Cyrillic characters', () => {
      expect(isScramblable('А')).toBe(true);
      expect(isScramblable('Я')).toBe(true);
    });

    it('should return true for CJK characters', () => {
      expect(isScramblable('的')).toBe(true);
      expect(isScramblable('国')).toBe(true);
    });

    it('should return true for Arabic characters', () => {
      expect(isScramblable('ا')).toBe(true);
      expect(isScramblable('ي')).toBe(true);
    });

    it('should handle surrogate pairs and multi-byte characters correctly', () => {
      expect(isScramblable('😀')).toBe(false);
      expect(isScramblable('🔥')).toBe(false);

      expect(isScramblable('ab')).toBe(false);

      expect(Array.from('😀').length).toBe(1);
      expect(Array.from('🔥').length).toBe(1);
    });
  });
});
