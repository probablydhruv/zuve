import { useState, useCallback, useRef } from 'react';
import { detectShape, generatePerfectShapePoints, Point, ShapeDetectionResult } from './ShapeRecognition';
import { detectShapeProcreate, generatePerfectShapePointsProcreate } from './ProcreateShapeRecognition';
import { recognizeDollarOne, generatePerfectShapePointsDollarOne } from './DollarOneRecognizer';

export interface ShapeDetectionState {
  isDetecting: boolean;
  detectedShape: ShapeDetectionResult | null;
  showPreview: boolean;
  currentPath: Point[];
  perfectShapePoints: number[];
}

export interface ShapeDetectionActions {
  startDetection: () => void;
  addPoint: (point: Point) => void;
  endDetection: () => void;
  applyShape: () => void;
  cancelShape: () => void;
  clearDetection: () => void;
}

export function useShapeDetection(
  onShapeDetected: (shape: ShapeDetectionResult, perfectPoints: number[]) => void,
  holdDelay: number = 500,
  detectionMethod: 'original' | 'procreate' | 'dollar-one' = 'dollar-one'
) {
  const [state, setState] = useState<ShapeDetectionState>({
    isDetecting: false,
    detectedShape: null,
    showPreview: false,
    currentPath: [],
    perfectShapePoints: []
  });

  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startDetection = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDetecting: true,
      currentPath: [],
      detectedShape: null,
      showPreview: false
    }));
  }, []);

  const addPoint = useCallback((point: Point) => {
    setState(prev => ({
      ...prev,
      currentPath: [...prev.currentPath, point]
    }));
  }, []);

  const endDetection = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDetecting: false
    }));

    // Clear any existing timeout
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }

    // Start shape detection timeout
    detectionTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        if (prev.currentPath.length < 3) {
          console.log('Not enough points for shape detection:', prev.currentPath.length);
          return prev;
        }

        console.log('Detecting shape with', prev.currentPath.length, 'points');
        
        // Use selected detection method
        let result: ShapeDetectionResult;
        let perfectPoints: number[];
        
        switch (detectionMethod) {
          case 'dollar-one':
            result = recognizeDollarOne(prev.currentPath);
            perfectPoints = generatePerfectShapePointsDollarOne(result);
            break;
          case 'procreate':
            result = detectShapeProcreate(prev.currentPath);
            perfectPoints = generatePerfectShapePointsProcreate(result);
            break;
          case 'original':
          default:
            result = detectShape(prev.currentPath);
            perfectPoints = generatePerfectShapePoints(result);
            break;
        }
        
        console.log('Shape detection result:', result);
        
        // Debug: Log the path points for analysis
        console.log('Path points:', prev.currentPath.length, 'points');
        console.log('First few points:', prev.currentPath.slice(0, 6));
        
        if (result.type !== 'none' && result.confidence > 0.2) {
          console.log('Perfect shape points generated:', perfectPoints.length / 2, 'points');
          
          return {
            ...prev,
            detectedShape: result,
            showPreview: true,
            perfectShapePoints: perfectPoints
          };
        }

        console.log('No shape detected or confidence too low:', result.confidence);
        return prev;
      });
    }, holdDelay);
  }, [holdDelay]);

  const applyShape = useCallback(() => {
    setState(prev => {
      if (prev.detectedShape && prev.perfectShapePoints.length > 0) {
        onShapeDetected(prev.detectedShape, prev.perfectShapePoints);
      }
      
      return {
        ...prev,
        showPreview: false,
        detectedShape: null,
        perfectShapePoints: [],
        currentPath: []
      };
    });
  }, [onShapeDetected]);

  const cancelShape = useCallback(() => {
    setState(prev => ({
      ...prev,
      showPreview: false,
      detectedShape: null,
      perfectShapePoints: []
    }));
  }, []);

  const clearDetection = useCallback(() => {
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }
    
    setState({
      isDetecting: false,
      detectedShape: null,
      showPreview: false,
      currentPath: [],
      perfectShapePoints: []
    });
  }, []);

  return {
    state,
    actions: {
      startDetection,
      addPoint,
      endDetection,
      applyShape,
      cancelShape,
      clearDetection
    }
  };
}
