'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { AnalysisResponse } from '@/lib/types';

interface SkinConditionMarker {
  id: string;
  type: 'spot' | 'redness' | 'texture';
  x: number;
  y: number;
  size: number;
  severity: number;
  description: string;
}

interface ImageOverlayProps {
  analysis: AnalysisResponse;
  imageData: string;
  className?: string;
}

export default function ImageOverlay({ analysis, imageData, className = '' }: ImageOverlayProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedMarker, setSelectedMarker] = useState<SkinConditionMarker | null>(null);

  // Mock marker data - in real implementation, this would come from the API
  const markers: SkinConditionMarker[] = [
    ...(Array.from({ length: analysis.skinAnalysis.spots.count }, (_, i) => ({
      id: `spot-${i}`,
      type: 'spot' as const,
      x: 20 + i * 15,
      y: 30 + i * 10,
      size: 8 + Math.random() * 4,
      severity: 3 + Math.random() * 5,
      description: 'Hyperpigmented spot detected'
    }))),
    
    ...(Array.from({ length: Math.floor(analysis.skinAnalysis.redness.level / 20) }, (_, i) => ({
      id: `redness-${i}`,
      type: 'redness' as const,
      x: 40 + i * 20,
      y: 50 + i * 15,
      size: 15 + Math.random() * 10,
      severity: analysis.skinAnalysis.redness.level / 10,
      description: 'Mild redness detected'
    }))),
    
    ...(Array.from({ length: Math.floor(analysis.skinAnalysis.texture.smoothness / 25) }, (_, i) => ({
      id: `texture-${i}`,
      type: 'texture' as const,
      x: 60 + i * 12,
      y: 25 + i * 18,
      size: 12 + Math.random() * 6,
      severity: analysis.skinAnalysis.texture.smoothness / 10,
      description: 'Texture irregularity detected'
    })))
  ];

  const getMarkerColor = (type: SkinConditionMarker['type']) => {
    switch (type) {
      case 'spot': return 'rgba(139, 69, 19, 0.7)';
      case 'redness': return 'rgba(220, 38, 38, 0.6)';
      case 'texture': return 'rgba(75, 85, 99, 0.6)';
    }
  };

  const getMarkerBorder = (type: SkinConditionMarker['type']) => {
    switch (type) {
      case 'spot': return '2px solid #8B4513';
      case 'redness': return '2px solid #DC2626';
      case 'texture': return '2px solid #4B5563';
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const handleReset = () => {
    setZoom(1);
    setSelectedMarker(null);
  };

  const handleMarkerClick = (marker: SkinConditionMarker) => {
    setSelectedMarker(selectedMarker?.id === marker.id ? null : marker);
  };

  const [showTooltips, setShowTooltips] = useState(true);

  return (
    <div className={`relative ${className}`}>
      {/* Image container with zoom controls */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        <div 
          className="relative transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={imageData}
            alt="Skin analysis"
            className="w-full h-auto"
            style={{ maxHeight: '600px' }}
          />
          
          {/* Condition overlays */}
          <div className="absolute inset-0">
            {markers.map((marker) => (
              <div
                key={marker.id}
                className={`absolute cursor-pointer transition-all duration-200 hover:scale-110 ${
                  selectedMarker?.id === marker.id ? 'ring-4 ring-blue-400 z-10' : ''
                }`}
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${marker.size}px`,
                  height: `${marker.size}px`,
                  backgroundColor: getMarkerColor(marker.type),
                  border: getMarkerBorder(marker.type),
                  borderRadius: '50%',
                  opacity: 0.8,
                }}
                onClick={() => handleMarkerClick(marker)}
              >
                {/* Severity indicator */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {marker.severity.toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="absolute top-2 right-2 flex gap-1 bg-white bg-opacity-90 rounded-lg shadow-md p-1">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTooltips(!showTooltips)}
              className={`p-2 hover:bg-gray-100 rounded transition-colors ${showTooltips ? 'bg-blue-100' : ''}`}
              title={showTooltips ? 'Hide tooltips' : 'Show tooltips'}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMarkerColor('spot') }} />
          <span>Hyperpigmented Spots ({analysis.skinAnalysis.spots.count})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMarkerColor('redness') }} />
          <span>Redness Level ({analysis.skinAnalysis.redness.level})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMarkerColor('texture') }} />
          <span>Texture Issues ({analysis.skinAnalysis.texture.smoothness})</span>
        </div>
      </div>

      {/* Selected marker details */}
      {selectedMarker && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 capitalize">{selectedMarker.type}</h4>
              <p className="text-sm text-blue-700">{selectedMarker.description}</p>
              <p className="text-xs text-blue-600 mt-1">
                Severity: {selectedMarker.severity.toFixed(1)}/10 | 
                Position: ({selectedMarker.x.toFixed(0)}%, {selectedMarker.y.toFixed(0)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Health score overlay */}
      <div className="mt-3 p-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Overall Skin Health</h4>
            <p className="text-sm opacity-90">Score: {analysis.skinAnalysis.healthScore}/100</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{analysis.skinAnalysis.healthScore}</div>
            <div className="text-xs opacity-90">Out of 100</div>
          </div>
        </div>
      </div>
    </div>
  );
}