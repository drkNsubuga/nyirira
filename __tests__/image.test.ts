import { compressImage } from '@/lib/image';

describe('compressImage', () => {
  const tinyImage =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  it('returns a data URL string without throwing', async () => {
    const result = await compressImage(tinyImage);
    expect(typeof result).toBe('string');
    expect(result.startsWith('data:image')).toBe(true);
  });

  it('falls back to the original data when image decoding is unavailable', async () => {
    // jsdom does not decode images, so dimensions come back as 0 and the
    // original data URL is returned unchanged.
    const result = await compressImage('data:image/jpeg;base64,not-a-real-image');
    expect(result).toBe('data:image/jpeg;base64,not-a-real-image');
  });

  it('resolves (never hangs) even for empty input', async () => {
    await expect(compressImage('')).resolves.toBeDefined();
  });
});
