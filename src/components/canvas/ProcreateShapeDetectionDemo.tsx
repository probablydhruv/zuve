'use client'

import React, { useState } from 'react';
import { ShapeDetectionIntegration } from './ShapeDetectionIntegration';

export const ProcreateShapeDetectionDemo: React.FC = () => {
  const [useProcreateDetection, setUseProcreateDetection] = useState(true);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>Procreate-Style Shape Detection Demo</h1>
        <p>
          This demo showcases the new Procreate-style shape detection system using:
        </p>
        <ul>
          <li><strong>Ramer-Douglas-Peucker Algorithm</strong> for stroke simplification</li>
          <li><strong>Convex Hull Analysis</strong> for normalized shape boundaries</li>
          <li><strong>Geometric Ratios</strong> (thinness, area ratios) for classification</li>
          <li><strong>Least Squares Fitting</strong> for precise shape generation</li>
          <li><strong>Decision Tree Classification</strong> with fuzzy logic thresholds</li>
        </ul>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ marginRight: '10px' }}>
            <input
              type="checkbox"
              checked={useProcreateDetection}
              onChange={(e) => setUseProcreateDetection(e.target.checked)}
            />
            Use Procreate-style detection
          </label>
        </div>

        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>How to Use:</h3>
          <ol>
            <li>Draw a rough shape (circle, square, rectangle, triangle, or line)</li>
            <li>Hold your mouse/stylus down for 500ms after completing the shape</li>
            <li>The system will detect and show a preview of the perfect shape</li>
            <li>Click "Apply" to replace your rough drawing with the perfect shape</li>
            <li>Click "Cancel" to keep your original drawing</li>
          </ol>
        </div>

        <div style={{ 
          backgroundColor: '#e8f4fd', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>Detection Thresholds:</h3>
          <ul>
            <li><strong>Lines:</strong> Thinness ratio &gt; 100</li>
            <li><strong>Circles:</strong> Thinness ratio 12.5-13.5, aspect ratio &gt; 0.85</li>
            <li><strong>Ovals:</strong> Thinness ratio 12.5-13.5, aspect ratio 0.6-0.85</li>
            <li><strong>Triangles:</strong> Largest inscribed triangle area / hull area &gt; 0.8</li>
            <li><strong>Rectangles:</strong> Hull area / minimum rectangle area &gt; 0.9</li>
            <li><strong>Squares:</strong> Rectangle detection + aspect ratio &gt; 0.9</li>
          </ul>
        </div>
      </div>

      <div style={{ 
        border: '2px solid #ddd', 
        borderRadius: '8px', 
        padding: '10px',
        backgroundColor: '#fff'
      }}>
        <ShapeDetectionIntegration width={800} height={600} />
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Reset Canvas
        </button>
      </div>
    </div>
  );
};
