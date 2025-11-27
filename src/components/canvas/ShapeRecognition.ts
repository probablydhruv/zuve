// Shape Recognition Utilities for Procreate-like QuickShape functionality

export interface Point {
  x: number;
  y: number;
}

export interface ShapeDetectionResult {
  type: 'circle' | 'oval' | 'square' | 'rectangle' | 'triangle' | 'line' | 'none';
  confidence: number;
  perfectShape?: {
    center: Point;
    radius?: number;
    width?: number;
    height?: number;
    points?: Point[];
  };
}

// Calculate the distance between two points
function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Calculate the angle between three points
function angle(p1: Point, p2: Point, p3: Point): number {
  const a = distance(p1, p2);
  const b = distance(p2, p3);
  const c = distance(p1, p3);
  return Math.acos((a * a + b * b - c * c) / (2 * a * b));
}

// Check if a path forms a closed shape
function isClosedPath(points: Point[]): boolean {
  if (points.length < 3) return false;
  
  const first = points[0];
  const last = points[points.length - 1];
  const threshold = 20; // pixels
  
  return distance(first, last) < threshold;
}

// Detect if a path is a circle
interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  aspectRatio: number;
}

function getBoundingBox(points: Point[]): BoundingBox {
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  const width = maxX - minX;
  const height = maxY - minY;
  const aspectRatio = Math.min(width, height) / Math.max(width, height || 1);

  return { minX, maxX, minY, maxY, width, height, aspectRatio };
}

export function detectCircle(points: Point[]): ShapeDetectionResult {
  if (points.length < 8) {
    return { type: 'none', confidence: 0 };
  }

  // Calculate center point
  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const center = { x: centerX, y: centerY };

  // Calculate average radius and consistency
  const radii = points.map(p => distance(p, center));
  const avgRadius = radii.reduce((sum, r) => sum + r, 0) / radii.length;
  const radiusVariance = radii.reduce((sum, r) => sum + Math.pow(r - avgRadius, 2), 0) / radii.length;
  const radiusConsistency = 1 - (Math.sqrt(radiusVariance) / Math.max(avgRadius, 1));

  // Check curvature by comparing angle differences
  let curvatureConsistency = 0;
  for (let i = 0; i < points.length - 2; i++) {
    const angle1 = angle(points[i], center, points[i + 1]);
    const angle2 = angle(points[i + 1], center, points[i + 2]);
    if (Math.abs(angle1 - angle2) < 0.15) {
      curvatureConsistency++;
    }
  }
  curvatureConsistency = curvatureConsistency / Math.max(points.length - 2, 1);

  const boundingBox = getBoundingBox(points);
  const aspectRatio = boundingBox.aspectRatio;

  const circularConfidence =
    Math.max(0, Math.min(1,
      radiusConsistency * 0.6 +
      curvatureConsistency * 0.35 +
      aspectRatio * 0.05
    ));

  // Only classify as circle/oval if we have very strong circular characteristics
  // Also check aspect ratio - if it's very rectangular, don't classify as circle/oval
  if (circularConfidence < 0.75 || aspectRatio < 0.6) {
    return { type: 'none', confidence: 0 };
  }

  const type = aspectRatio < 0.85 ? 'oval' : 'circle';

  return {
    type,
    confidence: circularConfidence,
    perfectShape: {
      center,
      width: boundingBox.width,
      height: boundingBox.height,
      radius: (boundingBox.width + boundingBox.height) / 4
    }
  };
}

// Detect if a path is a square/rectangle
export function detectQuadrilateral(points: Point[]): ShapeDetectionResult {
  if (points.length < 8) {
    console.log('Quadrilateral: Not enough points:', points.length);
    return { type: 'none', confidence: 0 };
  }

  const bbox = getBoundingBox(points);
  const center = { x: (bbox.minX + bbox.maxX) / 2, y: (bbox.minY + bbox.maxY) / 2 };

  const corners = findCorners(points, 2.0);
  const simplified = simplifyPath(points, Math.min(bbox.width, bbox.height) * 0.08);
  const simplifiedCorners = findCorners(simplified, 1.8);

  const cornerScore = Math.min(1, (corners.length + simplifiedCorners.length) / 6);

  const parallelScore = checkParallelSides(points, bbox);
  const orthogonalityScore = evaluateRightAngles(corners, center);

  const edgeCoverage = calculateEdgeCoverage(points, bbox);

  const quadConfidence = Math.max(0,
    cornerScore * 0.3 +
    parallelScore * 0.3 +
    orthogonalityScore * 0.2 +
    edgeCoverage * 0.2
  );

  const aspectRatio = bbox.aspectRatio;
  const isSquare = aspectRatio > 0.7;
  const isRectangle = aspectRatio > 0.1;

  const type: ShapeDetectionResult['type'] = isSquare ? 'square' : isRectangle ? 'rectangle' : 'none';

  console.log('Quadrilateral detection:', {
    points: points.length,
    aspectRatio: aspectRatio.toFixed(3),
    corners: corners.length,
    simplifiedCorners: simplifiedCorners.length,
    cornerScore: cornerScore.toFixed(3),
    parallelScore: parallelScore.toFixed(3),
    orthogonalityScore: orthogonalityScore.toFixed(3),
    edgeCoverage: edgeCoverage.toFixed(3),
    quadConfidence: quadConfidence.toFixed(3),
    isSquare,
    isRectangle,
    type
  });

  if (type === 'none') {
    return { type: 'none', confidence: quadConfidence };
  }

  let adjustedConfidence = Math.max(quadConfidence, 0.35);
  if (type === 'square') {
    adjustedConfidence += Math.min(0.25, Math.max(0, (aspectRatio - 0.9) * 0.8));
  }

  const finalConfidence = Math.min(1, Math.max(0, adjustedConfidence));
  console.log('Quadrilateral final:', { type, confidence: finalConfidence.toFixed(3) });

  return {
    type,
    confidence: finalConfidence,
    perfectShape: {
      center,
      width: bbox.width,
      height: bbox.height
    }
  };
}

// Helper function to find corners in the path
function simplifyPath(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;

  const simplified: Point[] = [points[0]];
  let previous = points[0];

  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    const angleBetween = angle(previous, current, next);
    const isSharp = angleBetween < 2.6;
    const distanceFromPrevious = distance(previous, current);
    if (isSharp || distanceFromPrevious > tolerance) {
      simplified.push(current);
      previous = current;
    }
  }

  simplified.push(points[points.length - 1]);
  return simplified;
}

function findCorners(points: Point[], threshold: number = 1.4): Point[] {
  const corners: Point[] = [];

  for (let i = 1; i < points.length - 1; i++) {
    const pointAngle = angle(points[i - 1], points[i], points[i + 1]);
    if (pointAngle < threshold) {
      corners.push(points[i]);
    }
  }

  return corners;
}

// Helper function to check if opposite sides are parallel
function checkParallelSides(points: Point[], bbox: BoundingBox): number {
  const threshold = Math.min(bbox.width, bbox.height) * 0.2;
  let parallelCount = 0;

  const topPoints = points.filter(p => Math.abs(p.y - bbox.minY) < threshold);
  const bottomPoints = points.filter(p => Math.abs(p.y - bbox.maxY) < threshold);

  if (topPoints.length > 1 && bottomPoints.length > 1) {
    const topSlope = calculateSlope(topPoints);
    const bottomSlope = calculateSlope(bottomPoints);
    if (Math.abs(topSlope - bottomSlope) < 0.35) parallelCount++;
  }

  const leftPoints = points.filter(p => Math.abs(p.x - bbox.minX) < threshold);
  const rightPoints = points.filter(p => Math.abs(p.x - bbox.maxX) < threshold);

  if (leftPoints.length > 1 && rightPoints.length > 1) {
    const leftSlope = calculateSlope(leftPoints);
    const rightSlope = calculateSlope(rightPoints);
    if (Math.abs(leftSlope - rightSlope) < 0.35) parallelCount++;
  }

  return parallelCount / 2;
}

// Helper function to calculate slope of points
function calculateSlope(points: Point[]): number {
  if (points.length < 2) return 0;
  
  const first = points[0];
  const last = points[points.length - 1];
  
  if (Math.abs(last.x - first.x) < 0.001) return Infinity;
  
  return (last.y - first.y) / (last.x - first.x);
}

function evaluateRightAngles(corners: Point[], center: Point): number {
  if (corners.length < 3) return 0;

  const sortedCorners = [...corners].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });

  let rightAngles = 0;
  for (let i = 0; i < sortedCorners.length; i++) {
    const prev = sortedCorners[(i - 1 + sortedCorners.length) % sortedCorners.length];
    const current = sortedCorners[i];
    const next = sortedCorners[(i + 1) % sortedCorners.length];
    const cornerAngle = angle(prev, current, next);
    if (cornerAngle > 1.35 && cornerAngle < 2.2) {
      rightAngles++;
    }
  }

  return Math.min(1, rightAngles / 4);
}

function calculateEdgeCoverage(points: Point[], bbox: BoundingBox): number {
  let coverage = 0;
  const threshold = Math.min(bbox.width, bbox.height) * 0.12;

  const edges = [
    { key: 'top', match: (p: Point) => Math.abs(p.y - bbox.minY) < threshold },
    { key: 'bottom', match: (p: Point) => Math.abs(p.y - bbox.maxY) < threshold },
    { key: 'left', match: (p: Point) => Math.abs(p.x - bbox.minX) < threshold },
    { key: 'right', match: (p: Point) => Math.abs(p.x - bbox.maxX) < threshold }
  ];

  edges.forEach(edge => {
    const edgePoints = points.filter(edge.match);
    if (edgePoints.length > Math.max(2, points.length * 0.05)) {
      coverage++;
    }
  });

  return coverage / edges.length;
}

// Detect if a path is a triangle
export function detectTriangle(points: Point[]): ShapeDetectionResult {
  if (points.length < 5) {
    return { type: 'none', confidence: 0 };
  }

  console.log('Triangle detection:', { points: points.length });

  // Method 1: Look for sharp angles (corners)
  const corners: Point[] = [];
  const angleThreshold = 2.5; // More lenient for rough triangles

  for (let i = 1; i < points.length - 1; i++) {
    const pointAngle = angle(points[i - 1], points[i], points[i + 1]);
    if (pointAngle < angleThreshold) {
      corners.push(points[i]);
    }
  }

  console.log('Triangle corners found:', corners.length);

  if (corners.length >= 3) {
    const sortedCorners = corners
      .map((corner) => {
        const i = points.findIndex(p => p === corner);
        if (i > 0 && i < points.length - 1) {
          const pointAngle = angle(points[i - 1], points[i], points[i + 1]);
          return { corner, angle: pointAngle };
        }
        return { corner, angle: Math.PI };
      })
      .sort((a, b) => a.angle - b.angle)
      .slice(0, 3)
      .map(item => item.corner);

    const triangleValid = validateTriangle(sortedCorners);
    if (triangleValid) {
      console.log('Triangle detected via corners:', { confidence: 0.4 });
      return {
        type: 'triangle',
        confidence: 0.4,
        perfectShape: {
          center: {
            x: sortedCorners.reduce((sum, p) => sum + p.x, 0) / 3,
            y: sortedCorners.reduce((sum, p) => sum + p.y, 0) / 3
          },
          points: sortedCorners
        }
      };
    }
  }

  // Method 2: Use extreme points (top, bottom, left, right)
  const extremeCorners = findTriangleCorners(points);
  if (extremeCorners.length === 3 && validateTriangle(extremeCorners)) {
    console.log('Triangle detected via extremes:', { confidence: 0.35 });
    return {
      type: 'triangle',
      confidence: 0.35,
      perfectShape: {
        center: {
          x: extremeCorners.reduce((sum, p) => sum + p.x, 0) / 3,
          y: extremeCorners.reduce((sum, p) => sum + p.y, 0) / 3
        },
        points: extremeCorners
      }
    };
  }

  // Method 3: Use side counting
  const sideCount = countSides(points);
  if (sideCount >= 2 && sideCount <= 4) {
    const alternativeCorners = findTriangleCorners(points);
    if (alternativeCorners.length === 3 && validateTriangle(alternativeCorners)) {
      console.log('Triangle detected via sides:', { confidence: 0.3 });
      return {
        type: 'triangle',
        confidence: 0.3,
        perfectShape: {
          center: {
            x: alternativeCorners.reduce((sum, p) => sum + p.x, 0) / 3,
            y: alternativeCorners.reduce((sum, p) => sum + p.y, 0) / 3
          },
          points: alternativeCorners
        }
      };
    }
  }

  // Method 4: Simple three-point triangle (for very rough drawings)
  if (points.length >= 5) {
    const simpleCorners = [
      points[0],
      points[Math.floor(points.length / 2)],
      points[points.length - 1]
    ];
    
    if (validateTriangle(simpleCorners)) {
      console.log('Triangle detected via simple method:', { confidence: 0.25 });
      return {
        type: 'triangle',
        confidence: 0.25,
        perfectShape: {
          center: {
            x: simpleCorners.reduce((sum, p) => sum + p.x, 0) / 3,
            y: simpleCorners.reduce((sum, p) => sum + p.y, 0) / 3
          },
          points: simpleCorners
        }
      };
    }
  }

  console.log('No triangle detected');
  return { type: 'none', confidence: 0 };
}

function validateTriangle(corners: Point[]): boolean {
  if (corners.length !== 3) return false;

  // Check minimum distance between corners (more lenient)
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      if (distance(corners[i], corners[j]) < 15) {
        return false;
      }
    }
  }

  // Check minimum area (more lenient)
  const [p1, p2, p3] = corners;
  const area = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)) / 2;
  return area > 25;
}

function countSides(points: Point[]): number {
  const angleThreshold = 1.65;
  let sideCount = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const pointAngle = angle(points[i - 1], points[i], points[i + 1]);
    if (pointAngle < angleThreshold) {
      sideCount++;
    }
  }

  return sideCount;
}

function findTriangleCorners(points: Point[]): Point[] {
  const top = points.reduce((min, p) => p.y < min.y ? p : min);
  const bottom = points.reduce((max, p) => p.y > max.y ? p : max);
  const left = points.reduce((min, p) => p.x < min.x ? p : min);
  const right = points.reduce((max, p) => p.x > max.x ? p : max);

  const extremes = [top, bottom, left, right];
  const uniqueExtremes = extremes.filter((point, index, arr) =>
    arr.findIndex(p => distance(p, point) < 30) === index
  );

  if (uniqueExtremes.length >= 3) {
    const center = {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length
    };

    return uniqueExtremes
      .sort((a, b) => distance(a, center) - distance(b, center))
      .slice(0, 3);
  }

  // Fallback: Use first, middle, and last points
  if (points.length >= 3) {
    return [
      points[0],
      points[Math.floor(points.length / 2)],
      points[points.length - 1]
    ];
  }

  return [];
}

// Detect if a path is a straight line
function detectLine(points: Point[]): ShapeDetectionResult {
  if (points.length < 3) {
    return { type: 'none', confidence: 0 };
  }

  // Calculate the line from first to last point
  const first = points[0];
  const last = points[points.length - 1];
  
  // Calculate how close each point is to the line
  let totalDeviation = 0;
  const lineLength = distance(first, last);
  
  if (lineLength < 10) {
    return { type: 'none', confidence: 0 };
  }

  for (const point of points) {
    // Calculate perpendicular distance from point to line
    const A = last.y - first.y;
    const B = first.x - last.x;
    const C = last.x * first.y - first.x * last.y;
    const deviation = Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
    totalDeviation += deviation;
  }

  const avgDeviation = totalDeviation / points.length;
  const confidence = Math.max(0, 1 - (avgDeviation / 20)); // 20px threshold

  if (confidence > 0.6) {
    return {
      type: 'line',
      confidence,
      perfectShape: {
        center: {
          x: (first.x + last.x) / 2,
          y: (first.y + last.y) / 2
        },
        points: [first, last]
      }
    };
  }

  return { type: 'none', confidence: 0 };
}

// Main shape detection function
export function detectShape(points: Point[]): ShapeDetectionResult {
  console.log('=== detectShape called with', points.length, 'points ===');
  
  if (points.length < 3) {
    console.log('Not enough points for detection');
    return { type: 'none', confidence: 0 };
  }

  // First check if it's a closed shape
  const isClosed = isClosedPath(points);
  console.log('Is closed path:', isClosed);
  
  if (isClosed) {
    // For closed shapes, check all types and return the best match
    const results: ShapeDetectionResult[] = [];
    
    // Detect all possible shapes
    const circleResult = detectCircle(points);
    const quadResult = detectQuadrilateral(points);
    const triangleResult = detectTriangle(points);
    
    console.log('Shape detection results:', {
      circle: { type: circleResult.type, confidence: circleResult.confidence.toFixed(3) },
      quad: { type: quadResult.type, confidence: quadResult.confidence.toFixed(3) },
      triangle: { type: triangleResult.type, confidence: triangleResult.confidence.toFixed(3) }
    });
    
    console.log('Detailed scores:', {
      circleConfidence: circleResult.confidence.toFixed(3),
      quadConfidence: quadResult.confidence.toFixed(3),
      triangleConfidence: triangleResult.confidence.toFixed(3)
    });
    
    // Debug: Log triangle detection details
    if (triangleResult.type !== 'none') {
      console.log('Triangle detection successful:', {
        type: triangleResult.type,
        confidence: triangleResult.confidence.toFixed(3),
        perfectShape: triangleResult.perfectShape
      });
    }
    
    // Add results with different thresholds for each shape type
    if (circleResult.confidence > 0.8) {
      results.push(circleResult);
    }
    if (quadResult.confidence > 0.05) {
      results.push(quadResult);
    }
    if (triangleResult.confidence > 0.05) {
      results.push(triangleResult);
    }
    
    console.log('Results after threshold filtering:', results.map(r => ({ type: r.type, confidence: r.confidence.toFixed(3) })));
    
    // If no results, return none
    if (results.length === 0) {
      console.log('No results passed threshold, returning none');
      return { type: 'none', confidence: 0 };
    }
    
    // Sort by confidence and return the best match
    results.sort((a, b) => b.confidence - a.confidence);
    
    // Only return if confidence is high enough
    if (results[0].confidence > 0.2) {
      console.log('Best result:', { type: results[0].type, confidence: results[0].confidence.toFixed(3) });
      return results[0];
    }
    
    // If the best match is not confident enough, check for specific patterns
    // Prioritize squares/rectangles over circles for rectangular-looking shapes
    // Also prioritize rectangles based on aspect ratio
    const bbox = getBoundingBox(points);
    const aspectRatio = bbox.aspectRatio;
    
    // Always prioritize quadrilaterals over circles when both are detected
    if (quadResult.confidence > 0.3 && circleResult.confidence > 0.7) {
      console.log('Prioritizing quad over circle (both detected):', { 
        quadType: quadResult.type, 
        quadConfidence: quadResult.confidence.toFixed(3),
        circleConfidence: circleResult.confidence.toFixed(3)
      });
      return quadResult;
    }
    
    if (aspectRatio < 0.7 && quadResult.confidence > 0.05) {
      console.log('Prioritizing quad based on aspect ratio:', { 
        aspectRatio: aspectRatio.toFixed(3), 
        type: quadResult.type, 
        confidence: quadResult.confidence.toFixed(3) 
      });
      return quadResult;
    }
    
    if (quadResult.confidence > circleResult.confidence && quadResult.confidence > 0.05) {
      console.log('Prioritizing quad over circle:', { type: quadResult.type, confidence: quadResult.confidence.toFixed(3) });
      return quadResult;
    }

    // Prioritize triangles over circles when triangle confidence is reasonable
    if (triangleResult.confidence > 0.2 && triangleResult.type !== 'none') {
      console.log('Prioritizing triangle (high confidence):', { type: triangleResult.type, confidence: triangleResult.confidence.toFixed(3) });
      return triangleResult;
    }
    
    if (triangleResult.confidence > circleResult.confidence && triangleResult.confidence > 0.05) {
      console.log('Prioritizing triangle over circle:', { type: triangleResult.type, confidence: triangleResult.confidence.toFixed(3) });
      return triangleResult;
    }
    
    console.log('Returning best result despite low confidence:', { type: results[0].type, confidence: results[0].confidence.toFixed(3) });
    return results[0];
  } else {
    // For open shapes, check line
    const lineResult = detectLine(points);
    if (lineResult.confidence > 0.6) return lineResult;
  }

  return { type: 'none', confidence: 0 };
}

// Generate perfect shape path for Konva
export function generatePerfectShapePath(result: ShapeDetectionResult): string {
  if (!result.perfectShape) return '';

  switch (result.type) {
    case 'circle':
    case 'oval':
      const { center, width: ovalWidth, height: ovalHeight } = result.perfectShape;
      const rx = (ovalWidth ?? 0) / 2;
      const ry = (ovalHeight ?? 0) / 2;
      return `M ${center.x - rx} ${center.y} A ${rx} ${ry} 0 1 0 ${center.x + rx} ${center.y} A ${rx} ${ry} 0 1 0 ${center.x - rx} ${center.y}`;

    case 'square':
    case 'rectangle':
      const { center: sqCenter, width, height } = result.perfectShape;
      const halfW = width! / 2;
      const halfH = height! / 2;
      return `M ${sqCenter.x - halfW} ${sqCenter.y - halfH} L ${sqCenter.x + halfW} ${sqCenter.y - halfH} L ${sqCenter.x + halfW} ${sqCenter.y + halfH} L ${sqCenter.x - halfW} ${sqCenter.y + halfH} Z`;

    case 'triangle':
      const { points: triPoints } = result.perfectShape;
      if (triPoints && triPoints.length === 3) {
        return `M ${triPoints[0].x} ${triPoints[0].y} L ${triPoints[1].x} ${triPoints[1].y} L ${triPoints[2].x} ${triPoints[2].y} Z`;
      }
      return '';

    case 'line':
      const { points: linePoints } = result.perfectShape;
      if (linePoints && linePoints.length === 2) {
        return `M ${linePoints[0].x} ${linePoints[0].y} L ${linePoints[1].x} ${linePoints[1].y}`;
      }
      return '';

    default:
      return '';
  }
}

// Generate perfect shape points array for Konva Line component
export function generatePerfectShapePoints(result: ShapeDetectionResult): number[] {
  if (!result.perfectShape) return [];

  switch (result.type) {
    case 'circle':
    case 'oval':
      const { center, width: ellipseWidth, height: ellipseHeight } = result.perfectShape;
      const rx = (ellipseWidth ?? 0) / 2;
      const ry = (ellipseHeight ?? 0) / 2;
      const segments = 36;
      const ellipsePoints: number[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * 2 * Math.PI;
        ellipsePoints.push(center.x + rx * Math.cos(theta), center.y + ry * Math.sin(theta));
      }
      return ellipsePoints;

    case 'square':
    case 'rectangle':
      const { center: sqCenter, width, height } = result.perfectShape;
      const halfW = width! / 2;
      const halfH = height! / 2;
      return [
        sqCenter.x - halfW, sqCenter.y - halfH,
        sqCenter.x + halfW, sqCenter.y - halfH,
        sqCenter.x + halfW, sqCenter.y + halfH,
        sqCenter.x - halfW, sqCenter.y + halfH,
        sqCenter.x - halfW, sqCenter.y - halfH // Close the square
      ];

    case 'triangle':
      const { points: triPoints } = result.perfectShape;
      if (triPoints && triPoints.length === 3) {
        return [
          triPoints[0].x, triPoints[0].y,
          triPoints[1].x, triPoints[1].y,
          triPoints[2].x, triPoints[2].y,
          triPoints[0].x, triPoints[0].y // Close the triangle
        ];
      }
      return [];

    case 'line':
      const { points: linePoints } = result.perfectShape;
      if (linePoints && linePoints.length === 2) {
        return [linePoints[0].x, linePoints[0].y, linePoints[1].x, linePoints[1].y];
      }
      return [];

    default:
      return [];
  }
}
