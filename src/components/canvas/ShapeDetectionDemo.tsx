'use client'

import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { ShapeDetectionIntegration } from './ShapeDetectionIntegration';

export const ShapeDetectionDemo: React.FC = () => {
  const [demoKey, setDemoKey] = useState(0);

  const resetDemo = () => {
    setDemoKey(prev => prev + 1);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          🎨 Procreate-like Shape Detection Demo
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Draw rough shapes with your mouse or finger and hold for 500ms to see them automatically perfect!
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          💡 Tip: Draw with black strokes on the white canvas below. Hold your drawing for 500ms after finishing to trigger shape detection.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button variant="contained" onClick={resetDemo}>
            Reset Canvas
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              console.log('Test button clicked - checking if drawing works');
              // Add a test line
              const testLine = [100, 100, 200, 200];
              console.log('Test line:', testLine);
            }}
          >
            Test Drawing
          </Button>
        </Stack>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Supported Shapes:
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '20px' }}>⭕</span>
              <Typography variant="body2">Circles</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '20px' }}>⬜</span>
              <Typography variant="body2">Squares</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '20px' }}>🔺</span>
              <Typography variant="body2">Triangles</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '20px' }}>📏</span>
              <Typography variant="body2">Lines</Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            How to use:
          </Typography>
          <ol>
            <li>Draw a rough shape (circle, square, triangle, or line)</li>
            <li>Hold your finger/stylus for 500ms after finishing</li>
            <li>See the perfect shape preview appear</li>
            <li>Click "Apply" to replace with perfect shape, or "Cancel" to keep original</li>
          </ol>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, border: '2px solid #e0e0e0' }}>
        <ShapeDetectionIntegration
          key={demoKey}
          width={800}
          height={600}
        />
      </Paper>
    </Box>
  );
};

export default ShapeDetectionDemo;
