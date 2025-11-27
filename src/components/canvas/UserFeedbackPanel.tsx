'use client';

import React, { useState } from 'react';
import { logUserFeedback, getUserFeedbackStats, exportUserFeedback, clearUserFeedback } from './DollarOneRecognizer';
import { Point } from './ShapeRecognition';

interface UserFeedbackPanelProps {
  detectedShape: string;
  detectedConfidence: number;
  points: Point[];
  onShapeCorrection?: (correctedShape: string) => void;
}

const UserFeedbackPanel: React.FC<UserFeedbackPanelProps> = ({
  detectedShape,
  detectedConfidence,
  points,
  onShapeCorrection
}) => {
  const [selectedShape, setSelectedShape] = useState<string>(detectedShape);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const shapeTypes = ['circle', 'square', 'rectangle', 'triangle', 'line', 'none'];

  const handleShapeCorrection = () => {
    if (selectedShape !== detectedShape) {
      logUserFeedback(detectedShape, detectedConfidence, selectedShape, points);
      if (onShapeCorrection) {
        onShapeCorrection(selectedShape);
      }
      console.log(`User corrected ${detectedShape} to ${selectedShape}`);
    }
  };

  const handleShowStats = () => {
    const currentStats = getUserFeedbackStats();
    setStats(currentStats);
    setShowStats(true);
  };

  const handleExportFeedback = () => {
    const feedback = exportUserFeedback();
    const dataStr = JSON.stringify(feedback, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-feedback.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFeedback = () => {
    clearUserFeedback();
    setStats(null);
    setShowStats(false);
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-3">Shape Detection Feedback</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Detected: <span className="font-semibold">{detectedShape}</span> 
          (confidence: {(detectedConfidence * 100).toFixed(1)}%)
        </p>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Was this correct? If not, select the intended shape:
          </label>
          <select
            value={selectedShape}
            onChange={(e) => setSelectedShape(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {shapeTypes.map(shape => (
              <option key={shape} value={shape}>
                {shape === 'none' ? 'Not a shape' : shape}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleShapeCorrection}
          disabled={selectedShape === detectedShape}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {selectedShape === detectedShape ? 'Correct!' : `Correct to ${selectedShape}`}
        </button>
      </div>
      
      <div className="border-t pt-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleShowStats}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Show Stats
          </button>
          <button
            onClick={handleExportFeedback}
            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            Export Data
          </button>
          <button
            onClick={handleClearFeedback}
            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Clear Data
          </button>
        </div>
        
        {showStats && stats && (
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="font-semibold mb-2">Feedback Statistics</h4>
            <div className="text-sm space-y-1">
              <p>Total feedback: {stats.totalFeedback}</p>
              <p>Corrections: {stats.corrections}</p>
              <p>Overall accuracy: {(stats.accuracy * 100).toFixed(1)}%</p>
              
              {Object.keys(stats.shapeStats).length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Per-shape accuracy:</p>
                  {Object.entries(stats.shapeStats).map(([shape, stat]: [string, any]) => (
                    <p key={shape} className="ml-2">
                      {shape}: {(stat.accuracy * 100).toFixed(1)}% ({stat.correct}/{stat.correct + stat.incorrect})
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFeedbackPanel;
