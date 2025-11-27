'use client'

import React from 'react';
import { Box, Button, Typography, Chip } from '@mui/material';
import { Check, Close, AutoFixHigh } from '@mui/icons-material';
import { ShapeDetectionResult } from './ShapeRecognition';

interface ShapeControlPanelProps {
  detectedShape: ShapeDetectionResult;
  visible: boolean;
  onApply: () => void;
  onCancel: () => void;
}

export const ShapeControlPanel: React.FC<ShapeControlPanelProps> = ({
  detectedShape,
  visible,
  onApply,
  onCancel
}) => {
  if (!visible || !detectedShape) {
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
    <Box
      sx={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        p: 2,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        border: `2px solid ${color}`,
        boxShadow: `0 8px 32px ${color}40`
      }}
    >
      <AutoFixHigh sx={{ color, fontSize: 20 }} />
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600 }}>
          {icon} Perfect {label} detected!
        </Typography>
        <Chip
          label={`${confidence}%`}
          size="small"
          sx={{
            bgcolor: color,
            color: 'white',
            fontSize: '10px',
            height: 20,
            '& .MuiChip-label': {
              px: 1
            }
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<Check />}
          onClick={onApply}
          sx={{
            bgcolor: color,
            color: 'white',
            fontSize: '12px',
            px: 2,
            py: 0.5,
            minWidth: 'auto',
            '&:hover': {
              bgcolor: color,
              opacity: 0.9
            }
          }}
        >
          Apply
        </Button>
        
        <Button
          size="small"
          variant="outlined"
          startIcon={<Close />}
          onClick={onCancel}
          sx={{
            borderColor: color,
            color: color,
            fontSize: '12px',
            px: 2,
            py: 0.5,
            minWidth: 'auto',
            '&:hover': {
              borderColor: color,
              bgcolor: `${color}20`
            }
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default ShapeControlPanel;
