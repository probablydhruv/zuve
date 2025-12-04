/**
 * DrawingEngine - Core stroke management for Procreate-style drawing
 * 
 * Handles:
 * - Stroke creation and point collection
 * - Pressure, tilt, and velocity tracking per point
 * - Coalesced and predicted event processing
 */

// ============================================================================
// Types
// ============================================================================

export interface StrokePoint {
    x: number
    y: number
    pressure: number      // 0-1 (Apple Pencil pressure, defaults to 1 for mouse)
    tiltX: number         // -90 to 90 degrees
    tiltY: number         // -90 to 90 degrees
    velocity: number      // pixels per millisecond
    timestamp: number     // performance.now() value
}

export interface Stroke {
    id: string
    points: StrokePoint[]
    color: string
    baseWidth: number     // Base brush size before pressure scaling
    opacity: number
    layerId: string
    tool: 'brush' | 'eraser'
    isComplete: boolean
}

export interface PointerData {
    x: number
    y: number
    pressure: number
    tiltX: number
    tiltY: number
    pointerType: 'pen' | 'touch' | 'mouse'
    timestamp: number
}

// ============================================================================
// Drawing Engine Class
// ============================================================================

export class DrawingEngine {
    private activeStroke: Stroke | null = null
    private lastPoint: StrokePoint | null = null

    // Configuration
    private velocitySmoothingFactor = 0.3  // Lower = more responsive, higher = smoother
    private minVelocity = 0.01
    private maxVelocity = 10

    constructor() { }

    /**
     * Create a new stroke when pointer goes down
     */
    createStroke(
        initialPoint: PointerData,
        options: {
            color: string
            baseWidth: number
            opacity: number
            layerId: string
            tool: 'brush' | 'eraser'
        }
    ): Stroke {
        const point = this.createStrokePoint(initialPoint, null)

        this.activeStroke = {
            id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            points: [point],
            color: options.color,
            baseWidth: options.baseWidth,
            opacity: options.opacity,
            layerId: options.layerId,
            tool: options.tool,
            isComplete: false
        }

        this.lastPoint = point
        return this.activeStroke
    }

    /**
     * Add points from pointer move events
     * Handles coalesced events for higher fidelity
     */
    addPoints(events: PointerData[]): Stroke | null {
        if (!this.activeStroke) return null

        for (const event of events) {
            const point = this.createStrokePoint(event, this.lastPoint)
            this.activeStroke.points.push(point)
            this.lastPoint = point
        }

        return this.activeStroke
    }

    /**
     * Add a single point (for predicted events or simple moves)
     */
    addPoint(event: PointerData): Stroke | null {
        return this.addPoints([event])
    }

    /**
     * Finalize the stroke when pointer goes up
     * Returns the completed stroke for history/undo purposes
     */
    finalizeStroke(): Stroke | null {
        if (!this.activeStroke) return null

        this.activeStroke.isComplete = true
        const completedStroke = this.activeStroke

        this.activeStroke = null
        this.lastPoint = null

        return completedStroke
    }

    /**
     * Get the current active stroke (for rendering while drawing)
     */
    getActiveStroke(): Stroke | null {
        return this.activeStroke
    }

    /**
     * Check if currently drawing
     */
    isDrawing(): boolean {
        return this.activeStroke !== null
    }

    /**
     * Cancel the current stroke without saving
     */
    cancelStroke(): void {
        this.activeStroke = null
        this.lastPoint = null
    }

    // ============================================================================
    // Private Helpers
    // ============================================================================

    private createStrokePoint(event: PointerData, lastPoint: StrokePoint | null): StrokePoint {
        // Calculate velocity based on distance and time from last point
        let velocity = 0
        if (lastPoint) {
            const dx = event.x - lastPoint.x
            const dy = event.y - lastPoint.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const dt = event.timestamp - lastPoint.timestamp

            if (dt > 0) {
                const instantVelocity = distance / dt
                // Smooth velocity with exponential moving average
                velocity = lastPoint.velocity * (1 - this.velocitySmoothingFactor) +
                    instantVelocity * this.velocitySmoothingFactor
            } else {
                velocity = lastPoint.velocity
            }
        }

        // Clamp velocity to reasonable range
        velocity = Math.max(this.minVelocity, Math.min(this.maxVelocity, velocity))

        return {
            x: event.x,
            y: event.y,
            pressure: event.pressure,
            tiltX: event.tiltX,
            tiltY: event.tiltY,
            velocity,
            timestamp: event.timestamp
        }
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract pointer data from a native PointerEvent
 * Handles pressure, tilt, and coordinates
 */
export function extractPointerData(
    event: PointerEvent,
    canvasRect: DOMRect,
    stagePosition: { x: number; y: number },
    zoom: number
): PointerData {
    // Convert screen coordinates to canvas-relative coordinates
    const containerX = event.clientX - canvasRect.left
    const containerY = event.clientY - canvasRect.top

    // Convert to stage coordinates (account for pan and zoom)
    const x = (containerX - stagePosition.x) / zoom
    const y = (containerY - stagePosition.y) / zoom

    // Get pointer type
    let pointerType: 'pen' | 'touch' | 'mouse' = 'mouse'
    if (event.pointerType === 'pen') {
        pointerType = 'pen'
    } else if (event.pointerType === 'touch') {
        pointerType = 'touch'
    }

    // Get pressure (defaults to 0.5 for mouse, which we'll treat as 1.0)
    let pressure = event.pressure
    if (pointerType === 'mouse') {
        // Mouse has no pressure info, default to 1.0 when button is pressed
        pressure = event.buttons > 0 ? 1.0 : 0.5
    } else if (pressure === 0) {
        // Some devices report 0 pressure at start, normalize to minimum
        pressure = 0.1
    }

    return {
        x,
        y,
        pressure: Math.max(0.1, Math.min(1.0, pressure)),
        tiltX: event.tiltX || 0,
        tiltY: event.tiltY || 0,
        pointerType,
        timestamp: event.timeStamp || performance.now()
    }
}

/**
 * Extract all coalesced events from a pointer event
 * Falls back to just the main event if coalesced events not supported
 */
export function getCoalescedEvents(event: PointerEvent): PointerEvent[] {
    if (typeof event.getCoalescedEvents === 'function') {
        const coalesced = event.getCoalescedEvents()
        if (coalesced.length > 0) {
            return coalesced
        }
    }
    return [event]
}

/**
 * Extract predicted events for lookahead rendering
 * Reduces perceived latency on supported devices
 */
export function getPredictedEvents(event: PointerEvent): PointerEvent[] {
    if (typeof event.getPredictedEvents === 'function') {
        return event.getPredictedEvents()
    }
    return []
}

/**
 * Check if palm rejection should apply
 * Large touch areas indicate palm contact
 */
export function isPalmTouch(event: PointerEvent): boolean {
    // Palm touches typically have large width/height
    const width = (event as any).width || 0
    const height = (event as any).height || 0

    // Threshold for palm detection (adjust based on testing)
    return width > 30 || height > 30
}

/**
 * Check if this is an Apple Pencil input
 */
export function isApplePencil(event: PointerEvent): boolean {
    return event.pointerType === 'pen'
}
