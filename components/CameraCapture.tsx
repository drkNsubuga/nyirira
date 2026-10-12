'use client';

import { useRef, useState } from 'react';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { CameraError } from '@/lib/types';

interface CameraCaptureProps {
  onImageCapture: (imageData: string) => void;
}

export default function CameraCapture({ onImageCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode('camera');
    } catch (err) {
      const errorObject = err as { name?: string; message?: string };
      if (errorObject.name === 'NotAllowedError' || errorObject.name === 'PermissionDeniedError') {
        setError({
          type: 'permission-denied',
          message: 'Camera permission denied. Please allow camera access to continue.',
        });
      } else if (errorObject.name === 'NotSupportedError') {
        setError({
          type: 'not-supported',
          message: 'Camera is not supported on this device. Use file upload instead.',
        });
      } else {
        setError({
          type: 'unknown',
          message: `Error accessing camera: ${errorObject.message ?? 'Unknown error'}`,
        });
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        setMode('preview');
      }
    }
  };

  const confirmImage = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
    }
  };

  const cancelCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setMode('select');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError({
        type: 'unknown',
        message: `File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError({
        type: 'unknown',
        message: 'Please select a valid image file (JPG, PNG, etc.)',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setCapturedImage(result);
        setMode('preview');
      }
    };
    reader.onerror = () => {
      setError({
        type: 'unknown',
        message: 'Error reading file. Please try again.',
      });
    };
    reader.readAsDataURL(file);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setMode('camera');
  };

  if (mode === 'select') {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Capture Your Selfie</h2>
          <p className="text-slate-600 mb-8">
            Take a clear selfie or upload a recent photo for accurate skin analysis.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">{error.message}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={startCamera}
              className="flex flex-col items-center justify-center gap-2 p-6 bg-white hover:bg-emerald-50 border-2 border-emerald-200 rounded-xl transition-all hover:border-emerald-400 hover:shadow-md"
            >
              <Camera className="w-8 h-8 text-emerald-600" />
              <span className="font-semibold text-slate-900">Take Photo</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 bg-white hover:bg-amber-50 border-2 border-amber-200 rounded-xl transition-all hover:border-amber-400 hover:shadow-md"
            >
              <Upload className="w-8 h-8 text-amber-600" />
              <span className="font-semibold text-slate-900">Upload</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <p className="text-xs text-slate-500 mt-6 text-center">
            Max file size: 10MB. Supported formats: JPG, PNG, WEBP
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'camera') {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto max-h-96 bg-black" />
          <canvas ref={canvasRef} className="hidden" />

          <div className="p-6 bg-white flex gap-4">
            <button
              onClick={capturePhoto}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Capture
            </button>
            <button
              onClick={cancelCamera}
              className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'preview' && capturedImage) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          <div
            className="w-full h-80 bg-cover bg-center"
            style={{ backgroundImage: `url(${capturedImage})` }}
          />

          <div className="p-6 flex gap-4">
            <button
              onClick={confirmImage}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Analyze
            </button>
            <button
              onClick={retakePhoto}
              className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              Retake
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
