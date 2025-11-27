'use client'

import React, { useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line, Group, Rect } from 'react-konva';
import { useShapeDetection } from './useShapeDetection';
import { ShapePreview } from './ShapePreview';
import { ShapeControlPanel } from './ShapeControlPanel';
import { Point } from './ShapeRecognition';

// This is an example of how to integrate shape detection with your existing KonvaCanvas
// You'll need to adapt this to your actual KonvaCanvas component

interface ShapeDetectionIntegrationProps {
  // Add your existing props here
  width: number;
  height: number;
  onShapeDetected?: (shape: string, confidence: number, points: Point[]) => void;
}

export const ShapeDetectionIntegration: React.FC<ShapeDetectionIntegrationProps> = ({
  width,
  height,
  onShapeDetected
}) => {
  const stageRef = useRef<any>(null);
  const [lines, setLines] = useState<number[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);

  // Shape detection hook with $1 Recognizer enabled
  const { state: shapeState, actions: shapeActions } = useShapeDetection(
    useCallback((shape, perfectPoints) => {
      // Replace the last drawn line with the perfect shape
      setLines(prev => {
        const newLines = [...prev];
        if (newLines.length > 0) {
          newLines[newLines.length - 1] = perfectPoints;
        }
        return newLines;
      });
    }, []),
    500, // 500ms hold delay
    'dollar-one' // Use $1 Recognizer (99% accuracy)
  );

  // Handle shape detection callback separately to avoid circular dependency
  React.useEffect(() => {
    if (onShapeDetected && shapeState.detectedShape && currentLine.length > 0) {
      const points: Point[] = [];
      for (let i = 0; i < currentLine.length; i += 2) {
        points.push({ x: currentLine[i], y: currentLine[i + 1] });
      }
      onShapeDetected(shapeState.detectedShape.type, shapeState.detectedShape.confidence, points);
    }
  }, [onShapeDetected, shapeState.detectedShape, currentLine]);

  // Get point from mouse/touch event
  const getPointFromEvent = (e: any): Point => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    // Use Konva's built-in coordinate conversion
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    
    return {
      x: pos.x,
      y: pos.y
    };
  };

  // Handle drawing start
  const handleMouseDown = (e: any) => {
    e.evt.preventDefault();
    setIsDrawing(true);
    const point = getPointFromEvent(e);
    console.log('Mouse down at:', point); // Debug log
    const newLine = [point.x, point.y];
    setCurrentLine(newLine);
    
    // Start shape detection
    shapeActions.startDetection();
    shapeActions.addPoint(point);
  };

  // Handle drawing move
  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;

    const point = getPointFromEvent(e);
    const newLine = [...currentLine, point.x, point.y];
    setCurrentLine(newLine);
    console.log('Drawing line with', newLine.length / 2, 'points'); // Debug log
    
    // Add point to shape detection
    shapeActions.addPoint(point);
  };

  // Handle drawing end
  const handleMouseUp = (e: any) => {
    if (!isDrawing) return;

    setIsDrawing(false);
    console.log('Mouse up, final line:', currentLine); // Debug log
    
    // Add current line to lines array
    setLines(prev => [...prev, currentLine]);
    setCurrentLine([]);
    
    // End shape detection (will trigger detection after hold delay)
    shapeActions.endDetection();
    
    // Debug: Log the final line for analysis
    console.log('Final line points:', currentLine);
    console.log('Number of points:', currentLine.length / 2);
  };

  // Handle shape apply
  const handleApplyShape = () => {
    shapeActions.applyShape();
  };

  // Handle shape cancel
  const handleCancelShape = () => {
    shapeActions.cancelShape();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Shape Control Panel */}
      <ShapeControlPanel
        detectedShape={shapeState.detectedShape!}
        visible={shapeState.showPreview}
        onApply={handleApplyShape}
        onCancel={handleCancelShape}
      />

      {/* Konva Stage */}
      <Stage
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        ref={stageRef}
        style={{ 
          cursor: 'crosshair',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Background Layer */}
        <Layer>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="#ffffff"
            stroke="#e0e0e0"
            strokeWidth={1}
          />
        </Layer>

        {/* Drawing Layer */}
        <Layer>
          {/* Existing lines */}
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line}
              stroke="#000000"
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          
          {/* Current line being drawn */}
          {currentLine.length > 0 && (
            <Line
              points={currentLine}
              stroke="#ff0000"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>

        {/* Shape Preview Layer */}
        <Layer>
          <ShapePreview
            detectedShape={shapeState.detectedShape!}
            perfectShapePoints={shapeState.perfectShapePoints}
            onApply={handleApplyShape}
            onCancel={handleCancelShape}
            visible={shapeState.showPreview}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default ShapeDetectionIntegration;
