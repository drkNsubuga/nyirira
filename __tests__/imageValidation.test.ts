import {
  MAX_FILE_SIZE_BYTES,
  dataUriByteLength,
  validateImageFile,
  validateImageSize,
  validateImageResolution,
} from '@/lib/imageValidation';

describe('imageValidation', () => {
  describe('validateImageSize', () => {
    it('accepts files under the 10MB limit', () => {
      expect(validateImageSize(1024).valid).toBe(true);
      expect(validateImageSize(MAX_FILE_SIZE_BYTES - 1).valid).toBe(true);
    });

    it('rejects files over the 10MB limit with a friendly message', () => {
      const result = validateImageSize(MAX_FILE_SIZE_BYTES + 1);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/too large/i);
      expect(result.message).toMatch(/10MB/);
    });
  });

  describe('validateImageFile', () => {
    it('accepts jpeg files', () => {
      const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
      expect(validateImageFile(file).valid).toBe(true);
    });

    it('rejects non-image files', () => {
      const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/valid image file/i);
    });

    it('rejects oversized image files', () => {
      // A File whose size we fake via Object.defineProperty.
      const file = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE_BYTES + 1024 });
      expect(validateImageFile(file).valid).toBe(false);
    });
  });

  describe('validateImageResolution', () => {
    it('rejects data URIs exceeding the size limit before loading pixels', async () => {
      const huge = `data:image/jpeg;base64,${'A'.repeat(20_000_000)}`;
      const result = await validateImageResolution(huge);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/too large/i);
    });

    it('passes through when dimensions cannot be read (jsdom)', async () => {
      // jsdom never fires img.onload, so dimensions are unavailable and the
      // server becomes the judge — validation must not block here.
      const result = await validateImageResolution('data:image/jpeg;base64,AAAA');
      expect(result.valid).toBe(true);
    });
  });

  describe('dataUriByteLength', () => {
    it('approximates decoded byte length', () => {
      // 4 base64 chars → 3 bytes
      expect(dataUriByteLength('data:image/jpeg;base64,AAAA')).toBe(3);
      // padding: 'AA==' → 1 byte
      expect(dataUriByteLength('data:image/jpeg;base64,AA==')).toBe(1);
    });
  });
});
