import { describe, it, expect } from 'vitest';
import { 
  validateCoordinates,
  validateFileType,
  sanitizeFileName
} from '../validation';

describe('Validation Utils', () => {
  describe('validateCoordinates', () => {
    it('accepts valid coordinates', () => {
      expect(() => validateCoordinates({ latitude: 45.0, longitude: -75.0 })).not.toThrow();
      expect(() => validateCoordinates({ latitude: 0.0, longitude: 100.0 })).not.toThrow();
    });

    it('rejects invalid latitude', () => {
      expect(() => validateCoordinates({ latitude: 91, longitude: 0 })).toThrow('Invalid latitude');
      expect(() => validateCoordinates({ latitude: -91, longitude: 0 })).toThrow('Invalid latitude');
    });

    it('rejects invalid longitude', () => {
      expect(() => validateCoordinates({ latitude: 0, longitude: 181 })).toThrow('Invalid longitude');
      expect(() => validateCoordinates({ latitude: 0, longitude: -181 })).toThrow('Invalid longitude');
    });

    it('rejects (0,0) coordinates', () => {
      expect(() => validateCoordinates({ latitude: 0, longitude: 0 })).toThrow('GPS may not be functioning');
    });
  });

  describe('validateFileType', () => {
    it('accepts valid image files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileType(file)).toBe(true);
    });

    it('accepts valid video files', () => {
      const file = new File([''], 'test.mp4', { type: 'video/mp4' });
      expect(validateFileType(file)).toBe(true);
    });

    it('rejects invalid file types', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(validateFileType(file)).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('removes special characters', () => {
      expect(sanitizeFileName('test@file#name.jpg')).toBe('test_file_name.jpg');
    });

    it('replaces spaces with underscores', () => {
      expect(sanitizeFileName('test file name.jpg')).toBe('test_file_name.jpg');
    });

    it('preserves valid characters', () => {
      expect(sanitizeFileName('test_file-123.jpg')).toBe('test_file-123.jpg');
    });
  });
});
