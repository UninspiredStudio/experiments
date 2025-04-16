/**
 * BasicSlider Web Component
 *
 * A simple slider component that allows users to select a value
 * within a defined range by dragging the fill area.
 *
 * Attributes:
 * - label: Text description displayed above the slider.
 * - value: The current normalized value of the slider (0 to 1).
 * - min: The minimum display value. Defaults to 0.
 * - max: The maximum display value. Defaults to 100.
 * - unit: The unit symbol to display next to the value (e.g., '%', 'px').
 *
 * Events:
 * - change: Fired when the slider value changes. The event detail contains:
 * { value: normalizedValue, displayValue: calculatedDisplayValue }
 *
 * CSS Variables for Theming:
 * --slider-track-bg: Background color of the track.
 * --slider-fill-bg: Background color of the fill area.
 * --slider-description-color: Color of the label text.
 * --slider-value-color: Color of the value text displayed on the slider.
 * --slider-border-radius: Border radius for the track and fill.
 * --slider-height: Height of the slider component.
 */
class BasicSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // --- State Variables ---
        this._value = 0; // Normalized value (0 to 1)
        this._isDraggingFill = false;
        this._minValue = 0; // Minimum value for display
        this._maxValue = 100; // Maximum value for display
        this._unit = ''; // Unit for display (e.g., '%', 'px')

        // --- Shadow DOM Structure ---
        this.shadowRoot.innerHTML = `
            <style>
                /* Host Styling */
                :host {
                    /* Default Theming Variables (can be overridden) */
                    --slider-track-bg: var(--us-bg-low,); /* Default light gray */
                    --slider-fill-bg: var(--us-bg-high); /* Default purple */
                    --slider-description-color: var(--us-fg-default); /* Default dark gray */
                    --slider-value-color: var(--us-fg-subtext); /* Default white */
                    --slider-border-radius: var(--us-radii-micro-medium); /* Default small radius */

                    /* Component Layout Variables */
                    --slider-height: 48px; /* Height of the slider track */

                    /* Base Styles */
                    display: block; /* Ensure it takes block layout */
                    user-select: none; /* Prevent text selection during drag */
                    cursor: pointer; /* Indicate interactivity */
                    position: relative; /* For absolute positioning of children */
                    height: var(--slider-height); /* Set component height */
                    width: 100%; /* Take full available width */
                    margin-top: 24px; /* Space above the slider (for label) */
                }

                /* Track Styling */
                .track {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: var(--slider-track-bg); /* Use theme variable */
                    border-radius: var(--slider-border-radius); /* Use theme variable */
                    overflow: hidden; /* Clip the fill element */
                }

                /* Fill Styling */
                .fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    background-color: var(--slider-fill-bg); /* Use theme variable */
                    /* Only round top-left and bottom-left corners */
                    border-top-left-radius: var(--slider-border-radius);
                    border-bottom-left-radius: var(--slider-border-radius);
                    pointer-events: auto; /* Allow clicks/drags on the fill */
                    z-index: 1; /* Ensure fill is above track background */
                }
                /* Change cursor when dragging the fill */
                 :host([dragging-fill]) .fill,
                 :host([dragging-fill]) {
                    cursor: grabbing;
                 }


                /* Description (Label) Styling */
                .description {
                    position: absolute;
                    top: -24px; /* Position above the track */
                    left: 0;
                    color: var(--slider-description-color); /* Use theme variable */
                    white-space: nowrap; /* Prevent label wrapping */
                    pointer-events: none; /* Don't interfere with clicks */
                }

                /* Value Display Styling */
                .value-display {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%); /* Center the text */
                    color: var(--slider-value-color); /* Use theme variable */
                    pointer-events: none; /* Don't interfere with clicks */
                    z-index: 3; /* Ensure value is above fill */
                    white-space: nowrap; /* Prevent value wrapping */
                }
            </style>

            <div class="description typo-label-bold"></div>
            <div class="track">
                <div class="fill"></div>
                <div class="value-display typo-label"></div>
            </div>
        `;

        // --- Element References ---
        this._trackElement = this.shadowRoot.querySelector('.track');
        this._fillElement = this.shadowRoot.querySelector('.fill');
        this._descriptionElement = this.shadowRoot.querySelector('.description');
        this._valueDisplayElement = this.shadowRoot.querySelector('.value-display');

        // --- Bind Methods ---
        // Ensure 'this' context is correct in event handlers
        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._updateSliderPosition = this._updateSliderPosition.bind(this);
        this._updateValueDisplay = this._updateValueDisplay.bind(this);
    }

    // --- Lifecycle Callbacks ---

    connectedCallback() {
        console.log('BasicSlider connected.');
        // Add mouse down listener to the component itself
        this.addEventListener('mousedown', this._handleMouseDown);

        // Initialize properties from attributes
        this._descriptionElement.textContent = this.getAttribute('label') || '';
        this._minValue = this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0;
        this._maxValue = this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : 100;
        this._unit = this.getAttribute('unit') || '';

        // Set initial value, clamping between 0 and 1
        const initialValue = parseFloat(this.getAttribute('value'));
        // Use the setter to ensure updates and events fire
        this.value = isNaN(initialValue) ? 0 : Math.max(0, Math.min(1, initialValue));

        // Initial UI update based on attributes/defaults
        this._updateSliderPosition();
        this._updateValueDisplay(); // Ensure display value is correct on load
    }

    disconnectedCallback() {
        console.log('BasicSlider disconnected.');
        // Clean up event listeners to prevent memory leaks
        this.removeEventListener('mousedown', this._handleMouseDown);
        // Remove global listeners if they were added
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
    }

    // --- Attribute Observation ---

    static get observedAttributes() {
        // Define which attributes should trigger attributeChangedCallback
        return ['value', 'label', 'min', 'max', 'unit'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`);

        // Update component state based on attribute changes
        switch (name) {
            case 'value':
                // Only update if not currently dragging and value is valid
                if (!this._isDraggingFill && !isNaN(parseFloat(newValue))) {
                    // Use the setter to handle clamping, UI updates, and events
                    this.value = parseFloat(newValue);
                }
                break;
            case 'label':
                this._descriptionElement.textContent = newValue || '';
                break;
            case 'min':
                this._minValue = !isNaN(parseFloat(newValue)) ? parseFloat(newValue) : 0;
                this._updateValueDisplay(); // Update display when min changes
                break;
            case 'max':
                this._maxValue = !isNaN(parseFloat(newValue)) ? parseFloat(newValue) : 100;
                this._updateValueDisplay(); // Update display when max changes
                break;
            case 'unit':
                this._unit = newValue || '';
                this._updateValueDisplay(); // Update display when unit changes
                break;
        }
    }

    // --- Getters and Setters ---

    get value() {
        return this._value;
    }

    set value(newValue) {
        // Clamp the incoming value between 0 and 1
        const clampedValue = Math.max(0, Math.min(1, newValue));
        // Only update if the value has actually changed
        if (this._value !== clampedValue) {
            this._value = clampedValue;
            this._updateSliderPosition(); // Update the visual fill
            this._updateValueDisplay(); // Update the displayed text value
            this._dispatchChangeEvent(); // Notify listeners of the change
        }
    }

    // --- Helper Methods ---

    /**
     * Converts the normalized slider value (0-1) to the display value
     * based on the min and max attributes.
     * @param {number} normalizedValue - The value between 0 and 1.
     * @returns {number} The calculated display value.
     */
    _getDisplayValue(normalizedValue) {
        const range = this._maxValue - this._minValue;
        const actualValue = (normalizedValue * range) + this._minValue;
        // Round to one decimal place for cleaner display
        return Math.round(actualValue * 10) / 10;
    }

    /**
     * Updates the text content of the value display element.
     */
    _updateValueDisplay() {
        const displayValue = this._getDisplayValue(this._value);
        this._valueDisplayElement.textContent = `${displayValue}${this._unit}`;
    }

    /**
     * Dispatches a custom 'change' event with the current values.
     */
    _dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: this._value, // Normalized value (0-1)
                displayValue: this._getDisplayValue(this._value) // Calculated display value
            },
            bubbles: true, // Allow event to bubble up the DOM
            composed: true // Allow event to cross shadow DOM boundaries
        }));
    }

    // --- Event Handlers ---

    _handleMouseDown(event) {
        // Check if the click was directly on the track or fill
        const target = event.composedPath()[0];
         if (target === this._fillElement || target === this._trackElement || target === this) {
            this._isDraggingFill = true;
            this.setAttribute('dragging-fill', ''); // Add attribute for styling/state
            console.log("Dragging Fill START");

            // Immediately update value based on click position
            this._updateValueFromMouseEvent(event);

            // Prevent default actions like text selection
            event.preventDefault();

            // Add global listeners for mouse move and up
            document.addEventListener('mousemove', this._handleMouseMove);
            // Use { once: true } for mouseup to auto-remove the listener
            document.addEventListener('mouseup', this._handleMouseUp, { once: true });
        }
    }

    _handleMouseMove(event) {
        // Only update if dragging is active
        if (this._isDraggingFill) {
             this._updateValueFromMouseEvent(event);
        }
    }

    _handleMouseUp(event) {
        console.log("Dragging END");
        if (this._isDraggingFill) {
            this._isDraggingFill = false;
            this.removeAttribute('dragging-fill'); // Remove dragging state attribute
        }
        // Clean up the global mousemove listener explicitly
        // (mouseup is handled by { once: true })
        document.removeEventListener('mousemove', this._handleMouseMove);
    }

    /**
     * Calculates and updates the slider's value based on mouse coordinates.
     * @param {MouseEvent} event - The mouse event object.
     */
    _updateValueFromMouseEvent(event) {
        const rect = this._trackElement.getBoundingClientRect();
        const trackWidth = rect.width;
        // Calculate click position relative to the track's left edge
        const clickX = event.clientX - rect.left;

        // Calculate the raw normalized value
        const rawValue = clickX / trackWidth;

        // Use the setter to update the value (handles clamping, UI, events)
        this.value = rawValue;
        // console.log("Updating Fill Value:", this.value, "Display:", this._getDisplayValue(this.value));
    }

    /**
     * Updates the visual width of the fill element based on the current value.
     */
    _updateSliderPosition() {
        const trackWidth = this._trackElement.offsetWidth;
        // Calculate the width of the fill based on the normalized value
        const fillWidth = this._value * trackWidth;
        // Apply the calculated width, ensuring it's not negative
        this._fillElement.style.width = `${Math.max(0, fillWidth)}px`;

        // No need to update handle position anymore

        // Ensure the displayed text value is also up-to-date
        // (though usually called by the setter, this ensures consistency)
        this._updateValueDisplay();
    }
}

// Define the custom element with the tag name 'basic-slider'
customElements.define('basic-slider', BasicSlider);
