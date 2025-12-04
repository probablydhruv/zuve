/**
 * VariableWidthRenderer - Render strokes with pressure/velocity-based width variation
 * 
 * Renders strokes as connected shapes (quads or circles) instead of simple lines,
 * allowing each segment to have its own width based on pressure and velocity.
 */

import type { StrokePoint, Stroke } from './DrawingEngine'
import { interpolateCatmullRom, type InterpolatedPoint } from './CatmullRomSpline'

// ============================================================================
// Types
// ============================================================================

export interface RenderOptions {
    minWidthRatio: number      // Minimum width as ratio of base (0.1 = 10%)
    maxWidthRatio: number      // Maximum width as ratio of base (1.5 = 150%)
    pressureInfluence: number  // How much pressure affects width (0-1)
    velocityInfluence: number  // How much velocity affects width (0-1)
    taperStart: number         // Length in pixels to taper at start
    taperEnd: number           // Length in pixels to taper at end
    smoothingTension: number   // Catmull-Rom tension (0-1)
    interpolationSegments: number // Points per segment for smoothing
}

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
    minWidthRatio: 0.2,
    maxWidthRatio: 1.2,
    pressureInfluence: 0.8,
    velocityInfluence: 0.2,
    taperStart: 15,
    taperEnd: 15,
    smoothingTension: 0.3,   // Reduced from 0.5 - less aggressive smoothing
    interpolationSegments: 2  // Reduced from 4 - fewer intermediate points
}

// ============================================================================
// Width Calculation
// ============================================================================

/**
 * Calculate the width at a given point based on pressure, velocity, and position
 */
export function calculateWidthAtPoint(
    point: InterpolatedPoint,
    baseWidth: number,
    pointIndex: number,
    totalPoints: number,
    strokeLength: number,
    options: RenderOptions
): number {
    // Base width modulated by pressure
    const pressureFactor = options.pressureInfluence * point.pressure +
        (1 - options.pressureInfluence) * 1.0

    // Velocity factor (faster = thinner)
    // Normalize velocity (assuming typical range 0-5 px/ms)
    const normalizedVelocity = Math.min(1, point.velocity / 5)
    const velocityFactor = 1 - (normalizedVelocity * options.velocityInfluence)

    // Combined factor before tapering
    let widthFactor = pressureFactor * velocityFactor

    // Clamp to min/max ratio
    widthFactor = Math.max(options.minWidthRatio,
        Math.min(options.maxWidthRatio, widthFactor))

    // Apply tapering at start and end
    const distanceFromStart = (pointIndex / totalPoints) * strokeLength
    const distanceFromEnd = ((totalPoints - pointIndex) / totalPoints) * strokeLength

    if (distanceFromStart < options.taperStart) {
        const taperFactor = distanceFromStart / options.taperStart
        widthFactor *= easeInQuad(taperFactor)
    }

    if (distanceFromEnd < options.taperEnd) {
        const taperFactor = distanceFromEnd / options.taperEnd
        widthFactor *= easeOutQuad(taperFactor)
    }

    return baseWidth * widthFactor
}

// Easing functions for smooth tapering
function easeInQuad(t: number): number {
    return t * t
}

function easeOutQuad(t: number): number {
    return t * (2 - t)
}

// ============================================================================
// Geometry Generation
// ============================================================================

/**
 * Generate a quad strip for a stroke with variable width
 * Returns an array of points forming a closed polygon
 */
export function generateStrokeGeometry(
    stroke: Stroke,
    options: RenderOptions = DEFAULT_RENDER_OPTIONS
): number[] {
    if (stroke.points.length < 2) {
        return generateDotGeometry(stroke.points[0], stroke.baseWidth)
    }

    // Use original points directly instead of heavy interpolation
    // This preserves the natural feel of the stroke
    const points = stroke.points

    if (points.length < 2) {
        return generateDotGeometry(stroke.points[0], stroke.baseWidth)
    }

    // Calculate stroke length for tapering
    let strokeLength = 0
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x
        const dy = points[i].y - points[i - 1].y
        strokeLength += Math.sqrt(dx * dx + dy * dy)
    }

    // Generate left and right edge points
    const leftEdge: { x: number; y: number }[] = []
    const rightEdge: { x: number; y: number }[] = []

    for (let i = 0; i < points.length; i++) {
        const point = points[i]
        const width = calculateWidthAtPoint(
            { x: point.x, y: point.y, pressure: point.pressure, velocity: point.velocity, t: 0 },
            stroke.baseWidth,
            i,
            points.length,
            strokeLength,
            options
        )
        const halfWidth = width / 2

        // Calculate perpendicular direction
        let perpX: number, perpY: number

        if (i === 0) {
            // First point: direction to next point
            const dx = points[1].x - point.x
            const dy = points[1].y - point.y
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            perpX = -dy / len
            perpY = dx / len
        } else if (i === points.length - 1) {
            // Last point: direction from previous point
            const dx = point.x - points[i - 1].x
            const dy = point.y - points[i - 1].y
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            perpX = -dy / len
            perpY = dx / len
        } else {
            // Middle points: average direction
            const dx1 = point.x - points[i - 1].x
            const dy1 = point.y - points[i - 1].y
            const dx2 = points[i + 1].x - point.x
            const dy2 = points[i + 1].y - point.y

            // Average the two directions
            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1

            const avgDx = dx1 / len1 + dx2 / len2
            const avgDy = dy1 / len1 + dy2 / len2
            const avgLen = Math.sqrt(avgDx * avgDx + avgDy * avgDy) || 1

            perpX = -avgDy / avgLen
            perpY = avgDx / avgLen
        }

        leftEdge.push({
            x: point.x + perpX * halfWidth,
            y: point.y + perpY * halfWidth
        })
        rightEdge.push({
            x: point.x - perpX * halfWidth,
            y: point.y - perpY * halfWidth
        })
    }

    // Create closed polygon: left edge forward, right edge backward
    const polygon: number[] = []

    // Left edge (forward)
    for (const point of leftEdge) {
        polygon.push(point.x, point.y)
    }

    // Right edge (backward)
    for (let i = rightEdge.length - 1; i >= 0; i--) {
        polygon.push(rightEdge[i].x, rightEdge[i].y)
    }

    return polygon
}

/**
 * Generate geometry for a single dot (when stroke is just one point)
 */
function generateDotGeometry(point: StrokePoint, baseWidth: number): number[] {
    const radius = (baseWidth * point.pressure) / 2
    const segments = 16
    const polygon: number[] = []

    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        polygon.push(
            point.x + Math.cos(angle) * radius,
            point.y + Math.sin(angle) * radius
        )
    }

    return polygon
}

// ============================================================================
// Konva Rendering Helpers
// ============================================================================

/**
 * Generate a Konva-compatible sceneFunc for custom stroke rendering
 * Use this with Konva.Shape component
 */
export function createStrokeSceneFunc(
    stroke: Stroke,
    options: RenderOptions = DEFAULT_RENDER_OPTIONS
) {
    const geometry = generateStrokeGeometry(stroke, options)

    return (context: any, shape: any) => {
        if (geometry.length < 4) return

        context.beginPath()
        context.moveTo(geometry[0], geometry[1])

        for (let i = 2; i < geometry.length; i += 2) {
            context.lineTo(geometry[i], geometry[i + 1])
        }

        context.closePath()
        context.fillStrokeShape(shape)
    }
}

/**
 * Render stroke as a series of circles (stamp-based rendering)
 * Better for textured brushes, slightly slower
 */
export function generateCircleStamps(
    stroke: Stroke,
    spacingRatio: number = 0.25,  // Spacing as ratio of width
    options: RenderOptions = DEFAULT_RENDER_OPTIONS
): Array<{ x: number; y: number; radius: number; opacity: number }> {
    if (stroke.points.length === 0) return []

    if (stroke.points.length === 1) {
        const point = stroke.points[0]
        return [{
            x: point.x,
            y: point.y,
            radius: (stroke.baseWidth * point.pressure) / 2,
            opacity: stroke.opacity
        }]
    }

    // Interpolate points
    const interpolated = interpolateCatmullRom(
        stroke.points,
        options.smoothingTension,
        options.interpolationSegments
    )

    // Calculate stroke length
    let strokeLength = 0
    for (let i = 1; i < interpolated.length; i++) {
        const dx = interpolated[i].x - interpolated[i - 1].x
        const dy = interpolated[i].y - interpolated[i - 1].y
        strokeLength += Math.sqrt(dx * dx + dy * dy)
    }

    const stamps: Array<{ x: number; y: number; radius: number; opacity: number }> = []
    let accumulatedDistance = 0

    for (let i = 0; i < interpolated.length; i++) {
        const point = interpolated[i]
        const width = calculateWidthAtPoint(
            point,
            stroke.baseWidth,
            i,
            interpolated.length,
            strokeLength,
            options
        )
        const radius = width / 2
        const spacing = width * spacingRatio

        if (i === 0 || accumulatedDistance >= spacing) {
            stamps.push({
                x: point.x,
                y: point.y,
                radius,
                opacity: stroke.opacity * point.pressure
            })
            accumulatedDistance = 0
        }

        if (i > 0) {
            const dx = point.x - interpolated[i - 1].x
            const dy = point.y - interpolated[i - 1].y
            accumulatedDistance += Math.sqrt(dx * dx + dy * dy)
        }
    }

    return stamps
}

/**
 * Simple line points for fallback/preview rendering
 * Just returns the centerline with smoothing applied
 */
export function generateSimpleLinePoints(
    stroke: Stroke,
    options: RenderOptions = DEFAULT_RENDER_OPTIONS
): number[] {
    if (stroke.points.length < 2) {
        return stroke.points.flatMap(p => [p.x, p.y])
    }

    const interpolated = interpolateCatmullRom(
        stroke.points,
        options.smoothingTension,
        options.interpolationSegments
    )

    return interpolated.flatMap(p => [p.x, p.y])
}
