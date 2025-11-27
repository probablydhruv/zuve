'use client';

import React, { useState } from 'react';
import { ShapeDetectionIntegration } from './ShapeDetectionIntegration';
import UserFeedbackPanel from './UserFeedbackPanel';
import { Point } from './ShapeRecognition';

const DollarOneShapeDetectionDemo = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastDetection, setLastDetection] = useState<{
    shape: string;
    confidence: number;
    points: Point[];
  } | null>(null);

  const handleShapeDetected = (shape: string, confidence: number, points: Point[]) => {
    setLastDetection({ shape, confidence, points });
    setShowFeedback(true);
  };

  const handleShapeCorrection = (correctedShape: string) => {
    console.log(`Shape corrected from ${lastDetection?.shape} to ${correctedShape}`);
    setShowFeedback(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="mb-4 flex gap-4">
        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showFeedback ? 'Hide Feedback' : 'Show Feedback Panel'}
        </button>
      </div>
      
      <div className="flex gap-4 w-full max-w-6xl">
        <div className="flex-1">
          <ShapeDetectionIntegration 
            width={800} 
            height={600} 
            onShapeDetected={handleShapeDetected}
          />
        </div>
        
        {showFeedback && lastDetection && (
          <div className="w-80">
            <UserFeedbackPanel
              detectedShape={lastDetection.shape}
              detectedConfidence={lastDetection.confidence}
              points={lastDetection.points}
              onShapeCorrection={handleShapeCorrection}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DollarOneShapeDetectionDemo;
