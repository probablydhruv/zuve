// Procreate-style Shape Recognition using RDP, Convex Hull, and Geometric Ratios
// Based on proven algorithms used in professional drawing applications

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

// Calculate distance between two points
function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Calculate perpendicular distance from point to line
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = lineEnd.y - lineStart.y;
  const B = lineStart.x - lineEnd.x;
  const C = lineEnd.x * lineStart.y - lineStart.x * lineEnd.y;
  return Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
}

// Ramer-Douglas-Peucker Algorithm for stroke simplification
export function ramerDouglasPeucker(points: Point[], epsilon: number = 2.0): Point[] {
  if (points.length < 3) return points;

  const simplified: Point[] = [];
  
  function rdp(points: Point[], epsilon: number): Point[] {
    if (points.length < 3) return points;

    const first = points[0];
    const last = points[points.length - 1];
    
    let maxDistance = 0;
    let maxIndex = 0;

    // Find the point with maximum distance from the line
    for (let i = 1; i < points.length - 1; i++) {
      const dist = perpendicularDistance(points[i], first, last);
      if (dist > maxDistance) {
        maxDistance = dist;
        maxIndex = i;
      }
    }

    // If max distance is greater than epsilon, recursively simplify
    if (maxDistance > epsilon) {
      const leftPoints = rdp(points.slice(0, maxIndex + 1), epsilon);
      const rightPoints = rdp(points.slice(maxIndex), epsilon);
      
      // Combine results, avoiding duplicate middle point
      return [...leftPoints.slice(0, -1), ...rightPoints];
    } else {
      // All points are within epsilon, return just the endpoints
      return [first, last];
    }
  }

  return rdp(points, epsilon);
}

// Calculate polygon area using shoelace formula
function calculateArea(points: Point[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

// Calculate polygon perimeter
function calculatePerimeter(points: Point[]): number {
  if (points.length < 2) return 0;
  
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += distance(points[i], points[j]);
  }
  return perimeter;
}

// Calculate thinness ratio (perimeter^2 / area)
function calculateThinnessRatio(perimeter: number, area: number): number {
  if (area === 0) return Infinity;
  return (perimeter * perimeter) / area;
}

// Graham Scan Algorithm for convex hull
export function computeConvexHull(points: Point[]): Point[] {
  if (points.length < 3) return points;

  // Find the bottom-most point (and leftmost in case of tie)
  let bottomIndex = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].y < points[bottomIndex].y || 
        (points[i].y === points[bottomIndex].y && points[i].x < points[bottomIndex].x)) {
      bottomIndex = i;
    }
  }

  // Swap bottom point with first point
  [points[0], points[bottomIndex]] = [points[bottomIndex], points[0]];

  // Sort points by polar angle with respect to bottom point
  const bottom = points[0];
  points.slice(1).sort((a, b) => {
    const angleA = Math.atan2(a.y - bottom.y, a.x - bottom.x);
    const angleB = Math.atan2(b.y - bottom.y, b.x - bottom.x);
    if (angleA !== angleB) return angleA - angleB;
    return distance(bottom, a) - distance(bottom, b);
  });

  // Build convex hull
  const hull: Point[] = [points[0], points[1]];

  for (let i = 2; i < points.length; i++) {
    while (hull.length > 1 && 
           crossProduct(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0) {
      hull.pop();
    }
    hull.push(points[i]);
  }

  return hull;
}

// Cross product for Graham scan
function crossProduct(O: Point, A: Point, B: Point): number {
  return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
}

// Find minimum area rectangle using rotating calipers
function findMinimumAreaRectangle(points: Point[]): { width: number; height: number; angle: number } {
  if (points.length < 3) {
    const bbox = getBoundingBox(points);
    return { width: bbox.width, height: bbox.height, angle: 0 };
  }

  const hull = computeConvexHull(points);
  let minArea = Infinity;
  let bestRect = { width: 0, height: 0, angle: 0 };

  // Try different rotation angles
  for (let i = 0; i < hull.length; i++) {
    const p1 = hull[i];
    const p2 = hull[(i + 1) % hull.length];
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    // Rotate all points
    const rotated = hull.map(p => ({
      x: p.x * Math.cos(-angle) - p.y * Math.sin(-angle),
      y: p.x * Math.sin(-angle) + p.y * Math.cos(-angle)
    }));

    const bbox = getBoundingBox(rotated);
    const area = bbox.width * bbox.height;

    if (area < minArea) {
      minArea = area;
      bestRect = { width: bbox.width, height: bbox.height, angle };
    }
  }

  return bestRect;
}

// Get bounding box of points
function getBoundingBox(points: Point[]): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } {
  if (points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// Find largest inscribed triangle
function findLargestInscribedTriangle(hull: Point[]): Point[] {
  if (hull.length < 3) return hull.slice(0, 3);

  let maxArea = 0;
  let bestTriangle: Point[] = [];

  // Try all combinations of three points
  for (let i = 0; i < hull.length; i++) {
    for (let j = i + 1; j < hull.length; j++) {
      for (let k = j + 1; k < hull.length; k++) {
        const triangle = [hull[i], hull[j], hull[k]];
        const area = calculateArea(triangle);
        if (area > maxArea) {
          maxArea = area;
          bestTriangle = triangle;
        }
      }
    }
  }

  return bestTriangle;
}

// Least squares circle fitting
function fitCircle(points: Point[]): { center: Point; radius: number } {
  if (points.length < 3) {
    const bbox = getBoundingBox(points);
    return {
      center: { x: (bbox.minX + bbox.maxX) / 2, y: (bbox.minY + bbox.maxY) / 2 },
      radius: Math.max(bbox.width, bbox.height) / 2
    };
  }

  // Calculate centroid
  const centroid = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length
  };

  // Calculate average radius
  const radius = points.reduce((sum, p) => sum + distance(p, centroid), 0) / points.length;

  return { center: centroid, radius };
}

// Least squares line fitting
function fitLine(points: Point[]): { start: Point; end: Point } {
  if (points.length < 2) {
    return { start: points[0] || { x: 0, y: 0 }, end: points[0] || { x: 0, y: 0 } };
  }

  // Calculate centroid
  const centroid = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length
  };

  // Calculate covariance matrix
  let xx = 0, xy = 0, yy = 0;
  for (const point of points) {
    const dx = point.x - centroid.x;
    const dy = point.y - centroid.y;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }

  // Calculate principal axis
  const trace = xx + yy;
  const det = xx * yy - xy * xy;
  const lambda1 = (trace + Math.sqrt(trace * trace - 4 * det)) / 2;
  const lambda2 = (trace - Math.sqrt(trace * trace - 4 * det)) / 2;

  // Choose the larger eigenvalue
  const eigenvector = lambda1 > lambda2 ? 
    { x: xy, y: lambda1 - xx } : 
    { x: lambda2 - yy, y: xy };

  // Normalize eigenvector
  const length = Math.sqrt(eigenvector.x * eigenvector.x + eigenvector.y * eigenvector.y);
  if (length > 0) {
    eigenvector.x /= length;
    eigenvector.y /= length;
  }

  // Project points onto the line and find extent
  const projections = points.map(p => {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    return dx * eigenvector.x + dy * eigenvector.y;
  });

  const minProj = Math.min(...projections);
  const maxProj = Math.max(...projections);

  return {
    start: {
      x: centroid.x + minProj * eigenvector.x,
      y: centroid.y + minProj * eigenvector.y
    },
    end: {
      x: centroid.x + maxProj * eigenvector.x,
      y: centroid.y + maxProj * eigenvector.y
    }
  };
}

// Main shape detection function using Procreate-style approach
export function detectShapeProcreate(points: Point[]): ShapeDetectionResult {
  console.log('=== Procreate-style shape detection ===');
  console.log('Input points:', points.length);

  if (points.length < 3) {
    return { type: 'none', confidence: 0 };
  }

  // Step 1: Simplify stroke using RDP
  const simplified = ramerDouglasPeucker(points, 2.0);
  console.log('Simplified points:', simplified.length);

  // Step 2: Compute convex hull
  const hull = computeConvexHull(simplified);
  console.log('Convex hull points:', hull.length);

  // Step 3: Calculate geometric properties
  const hullArea = calculateArea(hull);
  const hullPerimeter = calculatePerimeter(hull);
  const thinnessRatio = calculateThinnessRatio(hullPerimeter, hullArea);
  
  console.log('Geometric properties:', {
    hullArea: hullArea.toFixed(2),
    hullPerimeter: hullPerimeter.toFixed(2),
    thinnessRatio: thinnessRatio.toFixed(2)
  });

  // Step 4: Shape classification using decision tree
  if (thinnessRatio > 100) {
    // Line detection
    const lineFit = fitLine(simplified);
    const lineLength = distance(lineFit.start, lineFit.end);
    
    if (lineLength > 20) {
      console.log('Detected: Line');
      return {
        type: 'line',
        confidence: 0.9,
        perfectShape: {
          center: {
            x: (lineFit.start.x + lineFit.end.x) / 2,
            y: (lineFit.start.y + lineFit.end.y) / 2
          },
          points: [lineFit.start, lineFit.end]
        }
      };
    }
  }

  if (thinnessRatio >= 12.5 && thinnessRatio <= 13.5) {
    // Circle detection
    const circleFit = fitCircle(simplified);
    const bbox = getBoundingBox(simplified);
    const aspectRatio = Math.min(bbox.width, bbox.height) / Math.max(bbox.width, bbox.height);
    
    console.log('Circle candidate:', {
      aspectRatio: aspectRatio.toFixed(3),
      thinnessRatio: thinnessRatio.toFixed(3)
    });

    if (aspectRatio > 0.85) {
      console.log('Detected: Circle');
      return {
        type: 'circle',
        confidence: 0.85,
        perfectShape: {
          center: circleFit.center,
          radius: circleFit.radius
        }
      };
    } else if (aspectRatio > 0.6) {
      console.log('Detected: Oval');
      return {
        type: 'oval',
        confidence: 0.8,
        perfectShape: {
          center: circleFit.center,
          width: bbox.width,
          height: bbox.height,
          radius: circleFit.radius
        }
      };
    }
  }

  // Triangle detection
  const largestTriangle = findLargestInscribedTriangle(hull);
  const triangleArea = calculateArea(largestTriangle);
  const triangleRatio = hullArea > 0 ? triangleArea / hullArea : 0;
  
  console.log('Triangle analysis:', {
    triangleRatio: triangleRatio.toFixed(3),
    triangleArea: triangleArea.toFixed(2)
  });

  if (triangleRatio > 0.8 && hull.length >= 3) {
    console.log('Detected: Triangle');
    return {
      type: 'triangle',
      confidence: 0.8,
      perfectShape: {
        center: {
          x: largestTriangle.reduce((sum, p) => sum + p.x, 0) / 3,
          y: largestTriangle.reduce((sum, p) => sum + p.y, 0) / 3
        },
        points: largestTriangle
      }
    };
  }

  // Rectangle detection
  const minRect = findMinimumAreaRectangle(hull);
  const rectArea = minRect.width * minRect.height;
  const rectRatio = hullArea > 0 ? hullArea / rectArea : 0;
  const aspectRatio = Math.min(minRect.width, minRect.height) / Math.max(minRect.width, minRect.height);
  
  console.log('Rectangle analysis:', {
    rectRatio: rectRatio.toFixed(3),
    aspectRatio: aspectRatio.toFixed(3),
    width: minRect.width.toFixed(2),
    height: minRect.height.toFixed(2)
  });

  if (rectRatio > 0.9 && hull.length >= 4) {
    if (aspectRatio > 0.9) {
      console.log('Detected: Square');
      return {
        type: 'square',
        confidence: 0.85,
        perfectShape: {
          center: {
            x: simplified.reduce((sum, p) => sum + p.x, 0) / simplified.length,
            y: simplified.reduce((sum, p) => sum + p.y, 0) / simplified.length
          },
          width: minRect.width,
          height: minRect.height
        }
      };
    } else {
      console.log('Detected: Rectangle');
      return {
        type: 'rectangle',
        confidence: 0.8,
        perfectShape: {
          center: {
            x: simplified.reduce((sum, p) => sum + p.x, 0) / simplified.length,
            y: simplified.reduce((sum, p) => sum + p.y, 0) / simplified.length
          },
          width: minRect.width,
          height: minRect.height
        }
      };
    }
  }

  console.log('No shape detected');
  return { type: 'none', confidence: 0 };
}

// Generate perfect shape path for Konva
export function generatePerfectShapePathProcreate(result: ShapeDetectionResult): string {
  if (!result.perfectShape) return '';

  switch (result.type) {
    case 'circle':
      const { center, radius } = result.perfectShape;
      const segments = 36;
      const circlePoints: string[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * 2 * Math.PI;
        const x = center.x + radius! * Math.cos(theta);
        const y = center.y + radius! * Math.sin(theta);
        circlePoints.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
      }
      return circlePoints.join(' ') + ' Z';

    case 'oval':
      const { center: ovalCenter, width: ovalWidth, height: ovalHeight } = result.perfectShape;
      const rx = ovalWidth! / 2;
      const ry = ovalHeight! / 2;
      return `M ${ovalCenter.x - rx} ${ovalCenter.y} A ${rx} ${ry} 0 1 0 ${ovalCenter.x + rx} ${ovalCenter.y} A ${rx} ${ry} 0 1 0 ${ovalCenter.x - rx} ${ovalCenter.y}`;

    case 'square':
    case 'rectangle':
      const { center: rectCenter, width, height } = result.perfectShape;
      const halfW = width! / 2;
      const halfH = height! / 2;
      return `M ${rectCenter.x - halfW} ${rectCenter.y - halfH} L ${rectCenter.x + halfW} ${rectCenter.y - halfH} L ${rectCenter.x + halfW} ${rectCenter.y + halfH} L ${rectCenter.x - halfW} ${rectCenter.y + halfH} Z`;

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
export function generatePerfectShapePointsProcreate(result: ShapeDetectionResult): number[] {
  if (!result.perfectShape) return [];

  switch (result.type) {
    case 'circle':
      const { center, radius } = result.perfectShape;
      const segments = 36;
      const circlePoints: number[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * 2 * Math.PI;
        circlePoints.push(
          center.x + radius! * Math.cos(theta),
          center.y + radius! * Math.sin(theta)
        );
      }
      return circlePoints;

    case 'oval':
      const { center: ovalCenter, width: ovalWidth, height: ovalHeight } = result.perfectShape;
      const rx = ovalWidth! / 2;
      const ry = ovalHeight! / 2;
      const ovalSegments = 36;
      const ovalPoints: number[] = [];
      for (let i = 0; i <= ovalSegments; i++) {
        const theta = (i / ovalSegments) * 2 * Math.PI;
        ovalPoints.push(
          ovalCenter.x + rx * Math.cos(theta),
          ovalCenter.y + ry * Math.sin(theta)
        );
      }
      return ovalPoints;

    case 'square':
    case 'rectangle':
      const { center: rectCenter, width, height } = result.perfectShape;
      const halfW = width! / 2;
      const halfH = height! / 2;
      return [
        rectCenter.x - halfW, rectCenter.y - halfH,
        rectCenter.x + halfW, rectCenter.y - halfH,
        rectCenter.x + halfW, rectCenter.y + halfH,
        rectCenter.x - halfW, rectCenter.y + halfH,
        rectCenter.x - halfW, rectCenter.y - halfH // Close the shape
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
