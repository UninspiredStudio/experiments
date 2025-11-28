// --- DOM Elements ---
const canvas = document.getElementById('warpCanvas');
if (!canvas) {
    console.error("Error: Canvas element with id 'warpCanvas' not found.");
}
const ctx = canvas ? canvas.getContext('2d') : null;

// --- Helper Functions ---
/**
 * Gets the value of a CSS custom property (--*) from the root element.
 * @param {string} varName - The name of the CSS variable (e.g., '--us-bg-canvas').
 * @returns {string | null} The variable's value, or null if not found.
 */
function getCssVariable(varName) {
    if (typeof window === 'undefined') return null; // Guard for non-browser environments
    // Trim whitespace and return the value, or null if not found
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || null;
}

/**
 * Converts a HEX color string to an RGB object.
 * @param {string} hex - The hex color string (e.g., '#FFFFFF' or '#FFF').
 * @returns {{r: number, g: number, b: number} | null} An object with r, g, b properties, or null if invalid.
 */
function hexToRgb(hex) {
    if (!hex || !hex.startsWith('#')) return null; // Basic validation
    hex = hex.slice(1);
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return null; // Ensure correct length after expansion

    const bigint = parseInt(hex, 16);
    if (isNaN(bigint)) return null; // Check if parsing failed

    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

// --- Canvas Animation Variables ---
let width, height; // Canvas dimensions
let stars = []; // Array to hold star objects
const numStars = 1500; // Number of stars in the field
const baseWarpSpeed = 0.2; // Constant speed for the stars
// Make warpSpeed global
window.warpSpeed = baseWarpSpeed; // Current speed, now accessible globally
let animationFrameId = null; // ID for the requestAnimationFrame loop
let visibleStarsRatio = 0; // Ratio of stars currently visible (0 to 1)
let starAnimationStartTime = null; // Timestamp when star visibility animation starts
const starAnimationDuration = 1000; // Duration of visibility animation in ms (1 second)

// --- Star Object ---
function Star() {
    /**
     * Resets the star's position to a random point, simulating it appearing at the edge of the view.
     */
    this.resetPosition = function() {
        // Start further away for a denser initial field
        this.z = Math.random() * width;
        // Calculate initial x, y based on z to distribute stars outward
        const initialFactor = width / this.z; // How much to scale x/y based on depth
        // Wider initial spread (1.5x) to fill edges better
        this.x = (Math.random() - 0.5) * width * 1.5 * initialFactor;
        this.y = (Math.random() - 0.5) * height * 1.5 * initialFactor;
        this.pz = this.z; // Previous z position for tail calculation
    };

    /**
     * Updates the star's position based on the warp speed.
     */
    this.update = function() {
        // Move star closer to the viewer
        this.z -= window.warpSpeed * 5; // Adjust multiplier for desired visual speed
        // If star is behind the viewer or too close, reset its position
        if (this.z < 1) {
            this.resetPosition();
        }
    };

    /**
     * Draws the star and its motion trail on the canvas.
     */
    this.draw = function() {
        if (!ctx || this.z <= 0) return; // Don't draw if off-screen or context unavailable

        // Project 3D position (x, y, z) onto 2D canvas
        const factor = width / this.z; // Perspective factor
        const sx = this.x * factor + width / 2; // Screen X
        const sy = this.y * factor + height / 2; // Screen Y

        // Calculate star size based on distance (closer stars are bigger)
        const r = Math.max(0.1, (1 - this.z / width) * 2.5); // Radius

        // Optimization: Don't draw if star is outside the canvas bounds
        if (sx + r < 0 || sx - r > width || sy + r < 0 || sy - r > height) return;

        // Get star color from CSS variable, default to white
        const starColor = getCssVariable('--us-bg-invert-canvas') || 'white';
        ctx.fillStyle = starColor;

        // Draw the star (circle)
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();

        // --- Draw Motion Trail ---
        // Skip trail if previous position wasn't set
        if (this.pz <= 0) {
            this.pz = this.z;
            return;
        }

        // Project previous position
        const p_factor = width / this.pz;
        const px = this.x * p_factor + width / 2; // Previous screen X
        const py = this.y * p_factor + height / 2; // Previous screen Y

        // Only draw trail if there's noticeable movement
        if (Math.abs(sx - px) > 0.1 || Math.abs(sy - py) > 0.1) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(sx, sy);
            // Trail color and opacity (fades with distance)
            ctx.strokeStyle = `rgba(200, 200, 255, ${Math.min(0.8, (1 - this.z / width))})`;
            ctx.lineWidth = r * 1.2; // Trail slightly thicker than star
            ctx.stroke();
        }

        // Update previous position for the next frame's trail
        this.pz = this.z;
    };
}

// --- Initialization ---
/**
 * Sets up the canvas dimensions, creates stars, and starts the animation loop.
 */
function init() {
    if (!canvas || !ctx) return; // Don't proceed if canvas isn't set up

    // Reset visibility on init
    visibleStarsRatio = 0;
    starAnimationStartTime = null;

    // Set canvas size to fill window
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    // Create the stars
    stars = [];
    for (let i = 0; i < numStars; i++) {
        const star = new Star();
        star.resetPosition(); // Initialize position correctly
        stars.push(star);
    }

    // Set initial warp speed
    // Use the global variable
    window.warpSpeed = baseWarpSpeed;

    // Start animation loop if it's not already running
    if (!animationFrameId) {
        animate();
    }
}

// --- Animation Loop ---
/**
 * Clears the canvas, updates and draws each star for every frame.
 */
function animate() {
    if (!ctx) return; // Stop if context is lost

    // Animate star visibility if animation is running
    if (starAnimationStartTime !== null) {
        const elapsed = Date.now() - starAnimationStartTime;
        visibleStarsRatio = Math.min(1, elapsed / starAnimationDuration);
        if (visibleStarsRatio === 1) {
            starAnimationStartTime = null; // Animation finished
        }
    }

    // Use CSS variable for background color, default to black
    const bgCanvasColorHex = getCssVariable('--us-bg-canvas') || '#000000';
    const bgCanvasRgb = hexToRgb(bgCanvasColorHex) || { r: 0, g: 0, b: 0 };

    // Clear the canvas with a semi-transparent overlay for a motion blur effect
    // Adjust alpha based on speed for more/less blur (optional)
    // Use the global variable
    const clearAlpha = Math.min(0.5, 0.1 + window.warpSpeed * 0.05); // Fades previous frame
    ctx.fillStyle = `rgba(${bgCanvasRgb.r}, ${bgCanvasRgb.g}, ${bgCanvasRgb.b}, ${clearAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // Update and draw only the visible stars
    const starsToDraw = Math.floor(numStars * visibleStarsRatio);
    for (let i = 0; i < starsToDraw; i++) {
        if (stars[i]) { // Ensure star exists
            stars[i].update();
            stars[i].draw();
        }
    }

    // Request the next frame
    animationFrameId = requestAnimationFrame(animate);
}

// --- Event Listeners ---
// Re-initialize canvas and stars on window resize
window.addEventListener('resize', init);

// --- Start ---
// Ensure the DOM is ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        setupLinkListeners(); // Add this function call
        // Redundant call to animate() removed, init() handles starting it.
    });
} else {
    // DOM is already ready
    init();
    setupLinkListeners(); // Add this function call
    // Redundant call to animate() removed, init() handles starting it.
}

// --- Link Click Handler ---
/**
 * Adds click listeners to all anchor tags to trigger star animation.
 */
function setupLinkListeners() {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            // Start animation only if not already fully visible or animating
            if (visibleStarsRatio < 1 && starAnimationStartTime === null) {
                starAnimationStartTime = Date.now();
            }
            // Note: We are not calling e.preventDefault(), so the link will still navigate.
        });
    });
}
