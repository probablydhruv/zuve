import DollarOneShapeDetectionDemo from '@/components/canvas/DollarOneShapeDetectionDemo';
import React from 'react';

const DollarOneDemoPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">$1 Recognizer Demo</h1>
      <p className="mb-6 text-lg text-gray-600 max-w-2xl text-center">
        Experience the power of the $1 Recognizer algorithm! Draw rough shapes (circle, square, rectangle, triangle, line) 
        and hold your finger/stylus for 500ms to see them perfected with 99% accuracy.
      </p>
      <div className="mb-4 p-4 bg-green-50 rounded-lg max-w-2xl">
        <h3 className="font-semibold text-green-800 mb-2">🎉 Advanced Geometric Filters!</h3>
        <p className="text-sm text-green-700 mb-2">
          Now using $1 Recognizer + Geometric Filters + Fuzzy Logic for maximum accuracy! The system analyzes corners, aspect ratio, and roundness to override incorrect $1 classifications.
        </p>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Ramer-Douglas-Peucker</strong> - precise corner detection</li>
          <li>• <strong>Geometric override</strong> - corrects $1 mistakes</li>
          <li>• <strong>Fuzzy logic</strong> - combines multiple signals</li>
          <li>• <strong>User feedback logging</strong> - learns from corrections</li>
          <li>• <strong>Template learning</strong> - adds user examples automatically</li>
        </ul>
      </div>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg max-w-2xl">
        <h3 className="font-semibold text-blue-800 mb-2">Why $1 Recognizer?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>99% accuracy</strong> vs 91% for convex hull approaches</li>
          <li>• <strong>~100 lines of code</strong> vs 400-600 lines for complex algorithms</li>
          <li>• <strong>Real-time performance</strong> with O(n) complexity</li>
          <li>• <strong>Template-based</strong> - easy to add new shapes</li>
          <li>• <strong>Rotation, scale, and position invariant</strong></li>
        </ul>
      </div>
      <div className="border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
        <DollarOneShapeDetectionDemo />
      </div>
    </div>
  );
};

export default DollarOneDemoPage;
