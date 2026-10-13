import { renderExportCanvas, exportResultAsPng } from '@/lib/export';
import { AnalysisResponse } from '@/lib/types';

const sampleAnalysis: AnalysisResponse = {
  skinAnalysis: {
    healthScore: 72,
    spots: { count: 8, severity: 'mild', description: 'spots' },
    texture: { smoothness: 68, roughness: 32, description: 'texture' },
    redness: { level: 35, description: 'redness' },
    safetyFlags: [],
    barrierRepairRegimen: [],
  },
  vto: {
    recommendedLipShades: [
      { name: 'Terracotta', hexColor: '#8B4513', undertone: 'warm', description: 'warm tone' },
    ],
    outfitPalette: {
      primary: '#C1440E',
      secondary: '#1F4E5F',
      accent: '#E1A95F',
      inspiration: 'Kitenge-inspired',
    },
    description: 'harmonious palette',
  },
  timestamp: '2026-10-12T10:00:00.000Z',
  imageWidth: 720,
  imageHeight: 960,
};

describe('export', () => {
  let ctxMock: Record<string, jest.Mock>;

  beforeEach(() => {
    ctxMock = {
      fillRect: jest.fn(),
      fillText: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      arcTo: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      drawImage: jest.fn(),
    };
    // jsdom does not implement the canvas 2d context; provide a stub.
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(ctxMock) as never;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('renderExportCanvas', () => {
    it('draws the results onto a canvas', () => {
      const canvas = renderExportCanvas(sampleAnalysis);
      expect(canvas).not.toBeNull();
      expect(ctxMock.fillRect).toHaveBeenCalled();
      // Brand header + score + palette + lip shade + footer text.
      expect(ctxMock.fillText).toHaveBeenCalledWith('Nyirira', 48, 80);
      expect(ctxMock.fillText).toHaveBeenCalledWith('72', 72, 250);
      expect(ctxMock.fillText).toHaveBeenCalledWith('Terracotta', 108, expect.any(Number));
    });
  });

  describe('exportResultAsPng', () => {
    it('triggers a PNG download via an anchor click', () => {
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});

      exportResultAsPng(sampleAnalysis);

      expect(clickSpy).toHaveBeenCalledTimes(1);
      const anchor = clickSpy.mock.instances[0] as unknown as HTMLAnchorElement;
      expect(anchor.download).toBe('nyirira-result-72.png');
      // jsdom's canvas.toDataURL is a stub, so only assert the anchor was wired
      // to download the generated PNG filename.
      expect(typeof anchor.href).toBe('string');
    });
  });
});
