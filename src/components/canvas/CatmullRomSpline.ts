/**
 * CatmullRomSpline - Smooth curve interpolation for natural-looking strokes
 * 
 * Catmull-Rom splines pass through all control points (unlike Bezier),
 * making them ideal for drawing where the user's points should be on the curve.
 */

import type { StrokePoint } from './DrawingEngine'

// ============================================================================
// Types
// ============================================================================

export interface Point2D {
    x: number
    y: number
}

export interface InterpolatedPoint extends Point2D {
    pressure: number
    velocity: number
    t: number  // Parameter along curve (0-1 within segment)
}

// ============================================================================
// Catmull-Rom Spline Functions
// ============================================================================

/**
 * Interpolate a Catmull-Rom spline through the given control points
 * 
 * @param points - Array of control points (minimum 2)
 * @param tension - Curve tension (0 = straight lines, 0.5 = standard Catmull-Rom, 1 = very curved)
 * @param segmentsPerSpan - Number of interpolated points between each pair of control points
 * @returns Array of interpolated points including pressure and velocity
 */
export function interpolateCatmullRom(
    points: StrokePoint[],
    tension: number = 0.5,
    segmentsPerSpan: number = 8
): InterpolatedPoint[] {
    if (points.length === 0) return []
    if (points.length === 1) {
        return [{
            x: points[0].x,
            y: points[0].y,
            pressure: points[0].pressure,
            velocity: points[0].velocity,
            t: 0
        }]
    }
    if (points.length === 2) {
        return interpolateLinear(points[0], points[1], segmentsPerSpan)
    }

    const result: InterpolatedPoint[] = []
    const alpha = tension

    // For Catmull-Rom, we need 4 points at a time: P0, P1, P2, P3
    // The curve is drawn between P1 and P2
    // We duplicate the first and last points to handle endpoints

    for (let i = 0; i < points.length - 1; i++) {
        // Get the 4 control points
        const p0 = points[Math.max(0, i - 1)]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[Math.min(points.length - 1, i + 2)]

        // Generate interpolated points between p1 and p2
        for (let j = 0; j < segmentsPerSpan; j++) {
            const t = j / segmentsPerSpan

            // Catmull-Rom basis functions with tension
            const t2 = t * t
            const t3 = t2 * t

            // Tension-adjusted coefficients
            const m0x = alpha * (p2.x - p0.x)
            const m0y = alpha * (p2.y - p0.y)
            const m1x = alpha * (p3.x - p1.x)
            const m1y = alpha * (p3.y - p1.y)

            // Hermite basis functions
            const h00 = 2 * t3 - 3 * t2 + 1
            const h10 = t3 - 2 * t2 + t
            const h01 = -2 * t3 + 3 * t2
            const h11 = t3 - t2

            // Interpolated position
            const x = h00 * p1.x + h10 * m0x + h01 * p2.x + h11 * m1x
            const y = h00 * p1.y + h10 * m0y + h01 * p2.y + h11 * m1y

            // Interpolate pressure and velocity linearly
            const pressure = p1.pressure + (p2.pressure - p1.pressure) * t
            const velocity = p1.velocity + (p2.velocity - p1.velocity) * t

            result.push({ x, y, pressure, velocity, t })
        }
    }

    // Add the final point
    const lastPoint = points[points.length - 1]
    result.push({
        x: lastPoint.x,
        y: lastPoint.y,
        pressure: lastPoint.pressure,
        velocity: lastPoint.velocity,
        t: 1
    })

    return result
}

/**
 * Linear interpolation between two points
 */
function interpolateLinear(
    p1: StrokePoint,
    p2: StrokePoint,
    segments: number
): InterpolatedPoint[] {
    const result: InterpolatedPoint[] = []

    for (let i = 0; i <= segments; i++) {
        const t = i / segments
        result.push({
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t,
            pressure: p1.pressure + (p2.pressure - p1.pressure) * t,
            velocity: p1.velocity + (p2.velocity - p1.velocity) * t,
            t
        })
    }

    return result
}

/**
 * Get a single point on the Catmull-Rom curve at parameter t
 * 
 * @param p0 - Control point before the segment
 * @param p1 - Start of segment
 * @param p2 - End of segment  
 * @param p3 - Control point after the segment
 * @param t - Parameter (0 = p1, 1 = p2)
 * @param tension - Curve tension
 */
export function getCatmullRomPoint(
    p0: Point2D,
    p1: Point2D,
    p2: Point2D,
    p3: Point2D,
    t: number,
    tension: number = 0.5
): Point2D {
    const alpha = tension
    const t2 = t * t
    const t3 = t2 * t

    const m0x = alpha * (p2.x - p0.x)
    const m0y = alpha * (p2.y - p0.y)
    const m1x = alpha * (p3.x - p1.x)
    const m1y = alpha * (p3.y - p1.y)

    const h00 = 2 * t3 - 3 * t2 + 1
    const h10 = t3 - 2 * t2 + t
    const h01 = -2 * t3 + 3 * t2
    const h11 = t3 - t2

    return {
        x: h00 * p1.x + h10 * m0x + h01 * p2.x + h11 * m1x,
        y: h00 * p1.y + h10 * m0y + h01 * p2.y + h11 * m1y
    }
}

/**
 * Smooth an array of stroke points in-place using Catmull-Rom
 * Returns new points without modifying the original array
 * 
 * This is a lighter-weight version that just smooths the positions
 * without increasing the point count significantly
 */
export function smoothStrokePoints(
    points: StrokePoint[],
    tension: number = 0.5
): StrokePoint[] {
    if (points.length <= 2) return [...points]

    const smoothed: StrokePoint[] = []

    for (let i = 0; i < points.length; i++) {
        const p0 = points[Math.max(0, i - 1)]
        const p1 = points[i]
        const p2 = points[Math.min(points.length - 1, i + 1)]
        const p3 = points[Math.min(points.length - 1, i + 2)]

        // Smooth position at t=0.5 (between current and next)
        // But we want the point at the current position, so t=0
        // Actually for smoothing, we average the positions slightly
        if (i === 0 || i === points.length - 1) {
            // Keep first and last points unchanged
            smoothed.push({ ...p1 })
        } else {
            // Apply gentle smoothing using neighboring points
            const smoothPoint = getCatmullRomPoint(p0, p0, p2, p2, 0.5, tension)

            // Blend between original and smoothed (keep some original character)
            const blendFactor = 0.3
            smoothed.push({
                ...p1,
                x: p1.x * (1 - blendFactor) + smoothPoint.x * blendFactor,
                y: p1.y * (1 - blendFactor) + smoothPoint.y * blendFactor
            })
        }
    }

    return smoothed
}

/**
 * Calculate the approximate length of a stroke
 */
export function calculateStrokeLength(points: StrokePoint[]): number {
    if (points.length < 2) return 0

    let length = 0
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x
        const dy = points[i].y - points[i - 1].y
        length += Math.sqrt(dx * dx + dy * dy)
    }

    return length
}

/**
 * Resample a stroke to have evenly-spaced points
 * Useful for consistent brush stamp spacing
 */
export function resampleStroke(
    points: StrokePoint[],
    spacing: number
): StrokePoint[] {
    if (points.length < 2) return [...points]

    const result: StrokePoint[] = [points[0]]
    let accumulatedDistance = 0

    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const dx = curr.x - prev.x
        const dy = curr.y - prev.y
        const segmentLength = Math.sqrt(dx * dx + dy * dy)

        if (segmentLength === 0) continue

        // Walk along the segment, adding points at spacing intervals
        let distanceAlongSegment = 0
        while (accumulatedDistance + (segmentLength - distanceAlongSegment) >= spacing) {
            const remainingToNextPoint = spacing - accumulatedDistance
            distanceAlongSegment += remainingToNextPoint
            const t = distanceAlongSegment / segmentLength

            // Interpolate all properties
            result.push({
                x: prev.x + dx * t,
                y: prev.y + dy * t,
                pressure: prev.pressure + (curr.pressure - prev.pressure) * t,
                tiltX: prev.tiltX + (curr.tiltX - prev.tiltX) * t,
                tiltY: prev.tiltY + (curr.tiltY - prev.tiltY) * t,
                velocity: prev.velocity + (curr.velocity - prev.velocity) * t,
                timestamp: prev.timestamp + (curr.timestamp - prev.timestamp) * t
            })

            accumulatedDistance = 0
        }

        accumulatedDistance += segmentLength - distanceAlongSegment
    }

    // Always include the last point
    if (result.length === 0 ||
        result[result.length - 1].x !== points[points.length - 1].x ||
        result[result.length - 1].y !== points[points.length - 1].y) {
        result.push(points[points.length - 1])
    }

    return result
}
