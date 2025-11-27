'use client'

import React from 'react';
import { Line, Text, Group } from 'react-konva';
import { ShapeDetectionResult } from './ShapeRecognition';

interface ShapePreviewProps {
  detectedShape: ShapeDetectionResult;
  perfectShapePoints: number[];
  onApply: () => void;
  onCancel: () => void;
  visible: boolean;
}

export const ShapePreview: React.FC<ShapePreviewProps> = ({
  detectedShape,
  perfectShapePoints,
  onApply,
  onCancel,
  visible
}) => {
  if (!visible || !detectedShape || perfectShapePoints.length === 0) {
    return null;
  }

  const getShapeColor = (type: string) => {
    switch (type) {
      case 'circle':
        return '#007AFF';
      case 'oval':
        return '#5AC8FA';
      case 'square':
        return '#34C759';
      case 'rectangle':
        return '#30D158';
      case 'triangle':
        return '#FF9500';
      case 'line':
        return '#AF52DE';
      default:
        return '#007AFF';
    }
  };

  const getShapeIcon = (type: string) => {
    switch (type) {
      case 'circle':
        return '⭕';
      case 'oval':
        return '🞄';
      case 'square':
        return '⬜';
      case 'rectangle':
        return '▭';
      case 'triangle':
        return '🔺';
      case 'line':
        return '📏';
      default:
        return '🔷';
    }
  };

  const getShapeName = (type: string) => {
    switch (type) {
      case 'circle':
        return 'Circle';
      case 'oval':
        return 'Oval';
      case 'square':
        return 'Square';
      case 'rectangle':
        return 'Rectangle';
      case 'triangle':
        return 'Triangle';
      case 'line':
        return 'Line';
      default:
        return 'Shape';
    }
  };

  const color = getShapeColor(detectedShape.type);
  const icon = getShapeIcon(detectedShape.type);
  const label = getShapeName(detectedShape.type);
  const confidence = Math.round(detectedShape.confidence * 100);

  return (
    <Group>
      {/* Perfect shape preview */}
      <Line
        points={perfectShapePoints}
        stroke={color}
        strokeWidth={3}
        dash={[10, 5]}
        opacity={0.8}
        lineCap="round"
        lineJoin="round"
      />
      
      {/* Shape label */}
      {detectedShape.perfectShape?.center && (
        <Text
          x={detectedShape.perfectShape.center.x}
          y={detectedShape.perfectShape.center.y - 30}
          text={`${icon} Perfect ${label}`}
          fontSize={16}
          fill={color}
          fontStyle="bold"
          offsetX={80}
          align="center"
        />
      )}
      
      {/* Confidence percentage */}
      {detectedShape.perfectShape?.center && (
        <Text
          x={detectedShape.perfectShape.center.x}
          y={detectedShape.perfectShape.center.y - 10}
          text={`${confidence}% confidence`}
          fontSize={12}
          fill={color}
          opacity={0.8}
          offsetX={50}
          align="center"
        />
      )}
    </Group>
  );
};

export default ShapePreview;
