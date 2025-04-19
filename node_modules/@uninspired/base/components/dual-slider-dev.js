class DualSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // --- State Variables ---
        this._value = 0;
        this._handleValue = 0;
        this._isDraggingFill = false;
        this._isDraggingHandle = false;
        this._handleWidth = 16;
        this._minValue = 0;
        this._maxValue = 100;
        this._unit = '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    
                    /*  Base Token System Variables */
                    --slider-track-bg: var(--us-bg-low);
                    --slider-fill-bg: var(--us-bg-high);
                    --slider-handle-bg: var(--us-accent-high);
                    --slider-description-color: var(--us-fg-default);
                    --slider-value-color: var(--us-fg-subtext);
                    --slider-border-radius: var(--us-radii-micro-medium);
                    --slider-handle-border-radius: var(--us-radii-micro-small);

                    /* Component Variables */
                    --slider-height: 40px;
                    
                    display: block;
                    user-select: none;
                    cursor: pointer;
                    position: relative;
                    height: var(--slider-height);
                    width: 100%;
                    margin-top: 24px;
                }

                .track {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: var(--slider-track-bg);
                    border-radius: var(--slider-border-radius);
                    overflow: hidden;
                }

                .fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    background-color: var(--slider-fill-bg);
                    border-top-left-radius: var(--slider-border-radius);
                    border-bottom-left-radius: var(--slider-border-radius);
                    pointer-events: auto;
                    z-index: 1;
                }

                .handle {
                    position: absolute;
                    top: 0;
                    width: ${this._handleWidth}px;
                    height: 100%;
                    background-color: var(--slider-handle-bg);
                    border-radius: var(--slider-handle-border-radius);
                    box-sizing: border-box;
                    cursor: grab;
                    z-index: 2;
                    pointer-events: auto;
                    transition: box-shadow 0.2s ease;
                }
                :host([dragging-handle]) .handle {
                    cursor: grabbing;
                    box-shadow: var(--slider-handle-focus-shadow);
                }
                :host([hide-handle]) .handle {
                    display: none;
                }

                .description {
                    position: absolute;
                    top: -24px;
                    left: 0;
                    color: var(--slider-description-color);
                    white-space: nowrap;
                    pointer-events: none;
                }

                .value-display {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: var(--slider-value-color);
                    pointer-events: none;
                    z-index: 3;
                    white-space: nowrap;
                }
            </style>

            <div class="description typo-label"></div>
            <div class="track">
                <div class="fill"></div>
                <div class="handle"></div>
                <div class="value-display typo-body-bold"></div>
            </div>
        `;

        this._trackElement = this.shadowRoot.querySelector('.track');
        this._fillElement = this.shadowRoot.querySelector('.fill');
        this._handleElement = this.shadowRoot.querySelector('.handle');
        this._descriptionElement = this.shadowRoot.querySelector('.description');
        this._valueDisplayElement = this.shadowRoot.querySelector('.value-display');

        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._updateSliderPosition = this._updateSliderPosition.bind(this);
    }

    connectedCallback() {
        console.log('DualSlider connected.');
        this.addEventListener('mousedown', this._handleMouseDown);

        // Process attributes
        this._descriptionElement.textContent = this.getAttribute('label') || '';
        
        // Get min and max values for display
        this._minValue = this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0;
        this._maxValue = this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : 100;
        this._unit = this.getAttribute('unit') || '';

        const initialValue = parseFloat(this.getAttribute('value'));
        this.value = isNaN(initialValue) ? 0 : Math.max(0, Math.min(1, initialValue));

        const initialHandleValue = parseFloat(this.getAttribute('handle-value'));
        this.handleValue = isNaN(initialHandleValue) ? 0 : Math.max(0, Math.min(1, initialHandleValue));

        if (this.hasAttribute('hide-handle')) {
            this.setAttribute('hide-handle', '');
        }

        this._updateSliderPosition();
        this._updateValueDisplay();
    }

    disconnectedCallback() {
        console.log('DualSlider disconnected.');
        this.removeEventListener('mousedown', this._handleMouseDown);
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
    }

    static get observedAttributes() {
        return ['value', 'handle-value', 'label', 'hide-handle', 'min', 'max', 'unit'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`);
        
        if (name === 'value' && !this._isDraggingFill && !isNaN(parseFloat(newValue))) {
            this.value = Math.max(0, Math.min(1, parseFloat(newValue)));
        } else if (name === 'handle-value' && !this._isDraggingHandle && !isNaN(parseFloat(newValue))) {
            if (!this.hasAttribute('hide-handle')) {
                this.handleValue = Math.max(0, Math.min(1, parseFloat(newValue)));
            }
        } else if (name === 'label') {
            this._descriptionElement.textContent = newValue || '';
        } else if (name === 'min') {
            this._minValue = !isNaN(parseFloat(newValue)) ? parseFloat(newValue) : 0;
            this._updateValueDisplay();
        } else if (name === 'max') {
            this._maxValue = !isNaN(parseFloat(newValue)) ? parseFloat(newValue) : 100;
            this._updateValueDisplay();
        } else if (name === 'unit') {
            this._unit = newValue || '';
            this._updateValueDisplay();
        } else if (name === 'hide-handle') {
            if (newValue !== null) {
                this.setAttribute('hide-handle', '');
                if (this._isDraggingHandle) {
                    this._handleMouseUp(null);
                }
            } else {
                this.removeAttribute('hide-handle');
            }
        }
    }

    get value() {
        return this._value;
    }
    set value(newValue) {
        const clampedValue = Math.max(0, Math.min(1, newValue));
        if (this._value !== clampedValue) {
            this._value = clampedValue;
            this._updateSliderPosition();
            this._updateValueDisplay();
            this._dispatchChangeEvent();
        }
    }

    get handleValue() {
        return this._handleValue;
    }
    set handleValue(newValue) {
        const clampedValue = Math.max(0, Math.min(1, newValue));
         if (this._handleValue !== clampedValue) {
            this._handleValue = clampedValue;
            this._updateSliderPosition();
            this._updateValueDisplay();
            this._dispatchChangeEvent();
        }
    }

    // New helper method to convert normalized value to display value
    _getDisplayValue(normalizedValue) {
        const range = this._maxValue - this._minValue;
        const actualValue = (normalizedValue * range) + this._minValue;
        return Math.round(actualValue * 10) / 10; // Round to 1 decimal place
    }

    // New method to update the displayed value
    _updateValueDisplay() {
        const displayValue = this._getDisplayValue(this._value);
        this._valueDisplayElement.textContent = `${displayValue}${this._unit}`;
    }

    _dispatchChangeEvent() {
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: this._value,
                handleValue: this._handleValue,
                displayValue: this._getDisplayValue(this._value),
                displayHandleValue: this._getDisplayValue(this._handleValue)
            },
            bubbles: true,
            composed: true
        }));
    }


    _handleMouseDown(event) {
        const target = event.composedPath()[0];
        const handleIsHidden = this.hasAttribute('hide-handle');

        if (target === this._handleElement && !handleIsHidden) {
            this._isDraggingHandle = true;
            this.setAttribute('dragging-handle', '');
            this._handleElement.style.cursor = 'grabbing';
            console.log("Dragging Handle START");
        } else if (target === this._fillElement || target === this._trackElement || target === this) {
             this._isDraggingFill = true;
            this.style.cursor = 'grabbing';
            console.log("Dragging Fill START");
            this._updateValueFromMouseEvent(event);
        } else {
            return;
        }

        event.preventDefault();

        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp, { once: true });
    }

    _handleMouseMove(event) {
        if (this._isDraggingFill || this._isDraggingHandle) {
             this._updateValueFromMouseEvent(event);
        }
    }

    _handleMouseUp(event) {
        console.log("Dragging END");
        if (this._isDraggingFill) {
            this._isDraggingFill = false;
            this.style.cursor = 'pointer';
        }
        if (this._isDraggingHandle) {
            this._isDraggingHandle = false;
            this.removeAttribute('dragging-handle');
            this._handleElement.style.cursor = 'grab';
        }

        document.removeEventListener('mousemove', this._handleMouseMove);
    }

    _updateValueFromMouseEvent(event) {
        const rect = this._trackElement.getBoundingClientRect();
        const trackWidth = rect.width;
        const clickX = event.clientX - rect.left;
        const handleIsHidden = this.hasAttribute('hide-handle');

        if (this._isDraggingFill) {
            const rawValue = clickX / trackWidth;
            this.value = Math.max(0, Math.min(1, rawValue));
            console.log("Updating Fill Value:", this.value, "Display:", this._getDisplayValue(this.value));

        } else if (this._isDraggingHandle && !handleIsHidden) {
            const maxHandleLeft = trackWidth - this._handleWidth;

            let newHandleValue = 0;
            if (maxHandleLeft > 0) {
                const clampedClickX = Math.max(0, Math.min(clickX, maxHandleLeft));
                newHandleValue = clampedClickX / maxHandleLeft;
            }
            this.handleValue = newHandleValue;
            console.log("Updating Handle Value:", this.handleValue, "Display:", this._getDisplayValue(this.handleValue));
        }
    }

    _updateSliderPosition() {
        const trackWidth = this._trackElement.offsetWidth;
        const maxHandleLeft = trackWidth - this._handleWidth;
        const handleIsHidden = this.hasAttribute('hide-handle');

        const fillWidth = this._value * trackWidth;
        this._fillElement.style.width = `${Math.max(0, fillWidth)}px`;

        if (!handleIsHidden) {
            const handleLeft = this._handleValue * maxHandleLeft;
            this._handleElement.style.left = `${Math.max(0, handleLeft)}px`;
        } else {
            this._handleElement.style.left = '0px';
        }
        
        // Update the displayed value
        this._updateValueDisplay();
    }
}

customElements.define('dual-slider', DualSlider);
