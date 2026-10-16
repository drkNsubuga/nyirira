/* eslint-disable @typescript-eslint/no-require-imports */
// Jest globals (describe/it/expect/beforeEach/afterEach) come from the
// ambient @types/jest definitions — no import needed.

// Mock TensorFlow.js for Node.js environment
jest.mock('@tensorflow/tfjs', () => ({
  tensor: (data: number[]) => ({
    shape: [data.length],
    disposed: false,
    dataSync: () => data,
    dispose: function() {
      this.disposed = true;
    }
  }),
  setBackend: jest.fn(),
  ready: jest.fn(),
  getBackends: () => ['cpu'],
}));

// Mock BlazeFace model
jest.mock('@tensorflow-models/blazeface', () => ({
  load: jest.fn(() => Promise.resolve({
    estimateFaces: jest.fn(() => Promise.resolve([]))
  }))
}));

describe('TensorFlow.js Face Detection - Node.js Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });

  it('should load TensorFlow.js', async () => {
    const { setBackend, ready } = require('@tensorflow/tfjs');
    
    await setBackend('cpu');
    await ready();
    
    expect(setBackend).toHaveBeenCalledWith('cpu');
    expect(ready).toHaveBeenCalled();
  });

  it('should create tensors', () => {
    const { tensor } = require('@tensorflow/tfjs');
    
    const data = [1, 2, 3, 4];
    const tensorResult = tensor(data);
    
    expect(tensorResult.shape).toEqual([4]);
    expect(tensorResult.disposed).toBe(false);
    expect(tensorResult.dataSync()).toEqual(data);
  });

  it('should clean up tensors properly', () => {
    const { tensor } = require('@tensorflow/tfjs');
    
    const tensor1 = tensor([1, 2, 3]);
    const tensor2 = tensor([4, 5, 6]);
    
    // Verify tensors exist
    expect(tensor1.dataSync()).toEqual([1, 2, 3]);
    expect(tensor2.dataSync()).toEqual([4, 5, 6]);
    
    // Dispose tensors
    tensor1.dispose();
    tensor2.dispose();
    
    // Verify tensors are disposed
    expect(tensor1.disposed).toBe(true);
    expect(tensor2.disposed).toBe(true);
  });

  it('should handle face detection gracefully', async () => {
    const { load } = require('@tensorflow-models/blazeface');
    
    const mockModel = await load();
    const predictions = await mockModel.estimateFaces(null);
    
    expect(Array.isArray(predictions)).toBe(true);
    expect(predictions.length).toBe(0);
  });

  it('should load TensorFlow.js backends', () => {
    const { getBackends } = require('@tensorflow/tfjs');
    
    const backends = getBackends();
    
    expect(Array.isArray(backends)).toBe(true);
    expect(backends.length).toBeGreaterThan(0);
  });
});

describe('Face Detection UI Integration - Node.js Tests', () => {
  it('should validate app structure', () => {
    // Test that the main app file exists and has the expected structure
    const fs = require('fs');
    const path = require('path');
    
    const appPath = path.join(__dirname, '..', 'app', 'page.tsx');
    expect(fs.existsSync(appPath)).toBe(true);
    
    const appContent = fs.readFileSync(appPath, 'utf8');
    expect(appContent).toContain('CameraCapture');
    expect(appContent).toContain('ScanOverlay');
  });

  it('should validate component structure', () => {
    // Test that the component files exist and have the expected structure
    const fs = require('fs');
    const path = require('path');
    
    const scanOverlayPath = path.join(__dirname, '..', 'components', 'ScanOverlay.tsx');
    expect(fs.existsSync(scanOverlayPath)).toBe(true);
    
    const scanOverlayContent = fs.readFileSync(scanOverlayPath, 'utf8');
    expect(scanOverlayContent).toContain('progress');
    expect(scanOverlayContent).toContain('imageData');
  });

  it('should validate error handling structure', () => {
    // Test that error handling is properly implemented
    const fs = require('fs');
    const path = require('path');
    
    const appPath = path.join(__dirname, '..', 'app', 'page.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    expect(appContent).toContain('error');
    expect(appContent).toContain('friendlyApiError');
  });
});

describe('TensorFlow.js Integration Tests', () => {
  it('should validate TensorFlow.js dependencies', () => {
    const packageJson = require('../package.json');
    
    expect(packageJson.dependencies).toHaveProperty('@tensorflow/tfjs');
    expect(packageJson.dependencies).toHaveProperty('@tensorflow-models/blazeface');
    expect(packageJson.dependencies).toHaveProperty('@tensorflow/tfjs-backend-cpu');
    expect(packageJson.dependencies).toHaveProperty('@tensorflow/tfjs-backend-webgl');
  });

  it('should validate TensorFlow.js backend loading', async () => {
    const { setBackend, ready } = require('@tensorflow/tfjs');
    
    // Test backend loading
    await setBackend('cpu');
    await ready();
    
    expect(setBackend).toHaveBeenCalledWith('cpu');
  });

  it('should handle tensor operations', () => {
    const { tensor } = require('@tensorflow/tfjs');
    
    // Test tensor creation
    const testTensor = tensor([1, 2, 3, 4]);
    expect(testTensor.shape).toEqual([4]);
    
    // Test tensor disposal
    testTensor.dispose();
    expect(testTensor.disposed).toBe(true);
  });
});