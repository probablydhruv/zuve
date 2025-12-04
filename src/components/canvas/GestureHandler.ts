/**
 * GestureHandler - Multi-touch gesture detection for iPad
 * 
 * Detects:
 * - Two-finger tap → Undo
 * - Three-finger tap → Redo
 * - Two-finger drag → Pan
 * - Two-finger pinch → Zoom
 * 
 * Differentiates between taps (quick touch + release) and gestures (touch + movement)
 */

// ============================================================================
// Types
// ============================================================================

export type GestureType =
    | 'none'
    | 'undo'           // Two-finger tap
    | 'redo'           // Three-finger tap
    | 'pan'            // Two-finger drag
    | 'zoom'           // Two-finger pinch
    | 'drawing'        // Single finger/pencil drawing

export interface GestureState {
    type: GestureType
    startTime: number
    startTouches: TouchInfo[]
    currentTouches: TouchInfo[]
    hasMoved: boolean
    pinchStartDistance: number
    panStartCenter: { x: number; y: number }
}

interface TouchInfo {
    identifier: number
    x: number
    y: number
    timestamp: number
}

export interface GestureCallbacks {
    onUndo?: () => void
    onRedo?: () => void
    onPanStart?: (center: { x: number; y: number }) => void
    onPanMove?: (deltaX: number, deltaY: number, center: { x: number; y: number }) => void
    onPanEnd?: () => void
    onZoomStart?: (center: { x: number; y: number }) => void
    onZoom?: (scale: number, center: { x: number; y: number }) => void
    onZoomEnd?: () => void
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
    // Maximum time (ms) for a touch to be considered a "tap"
    tapMaxDuration: 300,

    // Maximum distance (px) a finger can move and still be a "tap"
    tapMaxDistance: 20,

    // Minimum time between gesture recognitions to prevent double-triggers
    gestureCooldown: 300,

    // Minimum pinch distance change (px) to trigger zoom
    minPinchDelta: 5
}

// ============================================================================
// GestureHandler Class
// ============================================================================

export class GestureHandler {
    private state: GestureState | null = null
    private callbacks: GestureCallbacks
    private lastGestureTime: number = 0
    private lastPinchDistance: number = 0
    private lastPanCenter: { x: number; y: number } = { x: 0, y: 0 }

    constructor(callbacks: GestureCallbacks = {}) {
        this.callbacks = callbacks
    }

    /**
     * Update callbacks (e.g., when undo/redo functions change)
     */
    setCallbacks(callbacks: GestureCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks }
    }

    /**
     * Handle touch start event
     * Returns the detected gesture type
     */
    handleTouchStart(event: TouchEvent): GestureType {
        const now = Date.now()
        const touches = this.extractTouches(event)

        // If we're in cooldown, ignore new touches
        if (now - this.lastGestureTime < CONFIG.gestureCooldown) {
            return this.state?.type || 'none'
        }

        if (touches.length === 1) {
            // Single touch - could be drawing
            this.state = {
                type: 'drawing',
                startTime: now,
                startTouches: touches,
                currentTouches: touches,
                hasMoved: false,
                pinchStartDistance: 0,
                panStartCenter: { x: touches[0].x, y: touches[0].y }
            }
            return 'drawing'
        }

        if (touches.length === 2) {
            // Two-finger touch - could be undo, pan, or zoom
            const center = this.getTouchCenter(touches)
            const distance = this.getTouchDistance(touches)

            this.state = {
                type: 'none', // Will be determined on move or end
                startTime: now,
                startTouches: touches,
                currentTouches: touches,
                hasMoved: false,
                pinchStartDistance: distance,
                panStartCenter: center
            }

            this.lastPinchDistance = distance
            this.lastPanCenter = center

            return 'none'
        }

        if (touches.length === 3) {
            // Three-finger touch - could be redo
            const center = this.getTouchCenter(touches)

            this.state = {
                type: 'none',
                startTime: now,
                startTouches: touches,
                currentTouches: touches,
                hasMoved: false,
                pinchStartDistance: 0,
                panStartCenter: center
            }

            return 'none'
        }

        return 'none'
    }

    /**
     * Handle touch move event
     * Returns the current gesture type and whether it should block drawing
     */
    handleTouchMove(event: TouchEvent): { type: GestureType; blockDrawing: boolean } {
        if (!this.state) {
            return { type: 'none', blockDrawing: false }
        }

        const touches = this.extractTouches(event)
        this.state.currentTouches = touches

        // Check if fingers have moved significantly
        const maxMovement = this.getMaxMovement()
        if (maxMovement > CONFIG.tapMaxDistance) {
            this.state.hasMoved = true
        }

        // Handle two-finger gestures
        if (touches.length === 2 && this.state.startTouches.length === 2) {
            const center = this.getTouchCenter(touches)
            const distance = this.getTouchDistance(touches)

            // Determine if this is pan or zoom based on distance change
            const distanceChange = Math.abs(distance - this.state.pinchStartDistance)

            if (distanceChange > CONFIG.minPinchDelta) {
                // It's a zoom gesture
                if (this.state.type !== 'zoom') {
                    this.state.type = 'zoom'
                    this.callbacks.onZoomStart?.(center)
                }

                const scale = distance / this.lastPinchDistance
                this.callbacks.onZoom?.(scale, center)
                this.lastPinchDistance = distance

                return { type: 'zoom', blockDrawing: true }
            } else if (this.state.hasMoved) {
                // It's a pan gesture
                if (this.state.type !== 'pan') {
                    this.state.type = 'pan'
                    this.callbacks.onPanStart?.(center)
                }

                const deltaX = center.x - this.lastPanCenter.x
                const deltaY = center.y - this.lastPanCenter.y
                this.callbacks.onPanMove?.(deltaX, deltaY, center)
                this.lastPanCenter = center

                return { type: 'pan', blockDrawing: true }
            }
        }

        // Three-finger move - nothing special yet
        if (touches.length === 3) {
            return { type: 'none', blockDrawing: true }
        }

        // Single touch - drawing
        if (touches.length === 1) {
            return { type: 'drawing', blockDrawing: false }
        }

        return { type: this.state.type, blockDrawing: touches.length > 1 }
    }

    /**
     * Handle touch end event
     * Returns the final gesture type (may trigger undo/redo)
     */
    handleTouchEnd(event: TouchEvent): GestureType {
        if (!this.state) {
            return 'none'
        }

        const now = Date.now()
        const duration = now - this.state.startTime
        const remainingTouches = event.touches.length

        // Handle ongoing zoom/pan
        if (this.state.type === 'zoom') {
            if (remainingTouches === 0) {
                this.callbacks.onZoomEnd?.()
                this.resetState()
            }
            return 'zoom'
        }

        if (this.state.type === 'pan') {
            if (remainingTouches === 0) {
                this.callbacks.onPanEnd?.()
                this.resetState()
            }
            return 'pan'
        }

        // Check for tap gestures (quick touch without movement)
        if (remainingTouches === 0 &&
            duration < CONFIG.tapMaxDuration &&
            !this.state.hasMoved) {

            const touchCount = this.state.startTouches.length

            if (touchCount === 2) {
                // Two-finger tap = Undo
                this.lastGestureTime = now
                this.callbacks.onUndo?.()
                this.resetState()
                return 'undo'
            }

            if (touchCount === 3) {
                // Three-finger tap = Redo
                this.lastGestureTime = now
                this.callbacks.onRedo?.()
                this.resetState()
                return 'redo'
            }
        }

        if (remainingTouches === 0) {
            this.resetState()
        }

        return 'none'
    }

    /**
     * Check if a gesture is currently in progress that should block drawing
     */
    shouldBlockDrawing(): boolean {
        if (!this.state) return false
        return this.state.currentTouches.length > 1
    }

    /**
     * Get current gesture state
     */
    getState(): GestureState | null {
        return this.state
    }

    /**
     * Reset gesture state
     */
    resetState(): void {
        this.state = null
    }

    // ============================================================================
    // Private Helpers
    // ============================================================================

    private extractTouches(event: TouchEvent): TouchInfo[] {
        const touches: TouchInfo[] = []
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i]
            touches.push({
                identifier: touch.identifier,
                x: touch.clientX,
                y: touch.clientY,
                timestamp: Date.now()
            })
        }
        return touches
    }

    private getTouchCenter(touches: TouchInfo[]): { x: number; y: number } {
        if (touches.length === 0) return { x: 0, y: 0 }

        const sum = touches.reduce(
            (acc, t) => ({ x: acc.x + t.x, y: acc.y + t.y }),
            { x: 0, y: 0 }
        )

        return {
            x: sum.x / touches.length,
            y: sum.y / touches.length
        }
    }

    private getTouchDistance(touches: TouchInfo[]): number {
        if (touches.length < 2) return 0

        const dx = touches[1].x - touches[0].x
        const dy = touches[1].y - touches[0].y
        return Math.sqrt(dx * dx + dy * dy)
    }

    private getMaxMovement(): number {
        if (!this.state) return 0

        let maxDist = 0
        for (const current of this.state.currentTouches) {
            const start = this.state.startTouches.find(t => t.identifier === current.identifier)
            if (start) {
                const dx = current.x - start.x
                const dy = current.y - start.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                maxDist = Math.max(maxDist, dist)
            }
        }

        return maxDist
    }
}

// ============================================================================
// Singleton Instance (for simpler usage)
// ============================================================================

let gestureHandlerInstance: GestureHandler | null = null

export function getGestureHandler(callbacks?: GestureCallbacks): GestureHandler {
    if (!gestureHandlerInstance) {
        gestureHandlerInstance = new GestureHandler(callbacks)
    } else if (callbacks) {
        gestureHandlerInstance.setCallbacks(callbacks)
    }
    return gestureHandlerInstance
}
