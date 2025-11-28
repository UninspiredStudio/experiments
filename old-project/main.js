document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('a');
    const headerContent = document.querySelector('.header-content');
    const infoBlocks = document.querySelector('.info-blocks');
    const canvasContainer = document.getElementById('canvasContainer'); // Get canvas container
    let isAnimating = false; // Prevent multiple clicks during animation

    // --- START: Added code to reset animation states on load ---
    // Select all elements that might have exit animations applied
    const animatedElements = document.querySelectorAll('.header-content, .info-blocks, .project-image, .project-header');
    // Define the classes to remove - include slide-up and remove shrink-height if fully replaced
    const animationClassesToRemove = ['fade-out', 'slide-up', 'fade-out-transition', 'slide-up-transition'];
    
    animatedElements.forEach(element => {
        if (element) { // Check if element exists before removing classes
            animationClassesToRemove.forEach(cls => element.classList.remove(cls));
            // Also reset inline styles that might be set during animation
            if (element.classList.contains('project-image')) {
                element.style.maxHeight = ''; // Reset max-height 
                element.style.paddingTop = ''; // Reset padding
                element.style.paddingBottom = ''; // Reset padding
            }
             if (element === canvasContainer) {
                 element.classList.remove('fade-in', 'fade-in-transition');
                 element.style.opacity = '0'; // Ensure canvas starts hidden unless explicitly faded in
             } else {
                 // Reset opacity for other elements to ensure they are visible
                 element.style.opacity = '';
             }
        }
    });
    // Ensure canvas starts hidden (it has its own fade-in logic in animatePageExit)
    if (canvasContainer) {
      canvasContainer.classList.remove('fade-in', 'fade-in-transition');
      canvasContainer.style.opacity = '0';
    }
    // --- END: Added code ---

    const FADE_DURATION = 300;
    const SHRINK_DURATION = 500; // Kept for reference if used elsewhere, but slide uses new constant
    const SLIDE_UP_DURATION = 800; // New duration for image slide
    const CANVAS_FADE_IN_DURATION = 700;
    // Calculate total duration for navigation delay using the new slide duration
    const TOTAL_NAVIGATE_DELAY = FADE_DURATION + FADE_DURATION + SLIDE_UP_DURATION + FADE_DURATION; // header + info + image slide + title fade
    // Keep original warp speed duration for now - might need review based on desired effect
    const TOTAL_WARP_ANIMATION_DURATION = FADE_DURATION * 3 + SLIDE_UP_DURATION;
    // Update warp speed duration to cover the full sequence including canvas fade
    const FULL_ANIMATION_DURATION = TOTAL_NAVIGATE_DELAY + CANVAS_FADE_IN_DURATION; 

    links.forEach(link => {
        link.addEventListener('click', (event) => {
            // Ignore links that don't navigate away (e.g., fragments #)
            // Also ignore links explicitly marked to not trigger the animation
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || link.classList.contains('no-exit-animation')) {
                return; 
            }

            // Prevent multiple rapid clicks triggering the animation
            if (isAnimating) {
                event.preventDefault();
                return;
            }
            isAnimating = true;

            event.preventDefault(); // Prevent immediate navigation
            const targetUrl = href;

            // Find parent project card elements if the link is inside one
            const projectCard = link.closest('.project-card');
            const projectImage = projectCard ? projectCard.querySelector('.project-image') : null;
            const projectHeader = projectCard ? projectCard.querySelector('.project-header') : null;

            // --- Animation Sequence --- 
            animatePageExit(targetUrl, projectImage, projectHeader);
        });
    });

    // --- Add pageshow listener ---
    window.addEventListener('pageshow', (event) => {
        // Check if the page is loaded from the back-forward cache
        if (event.persisted) {
            console.log("Page loaded from bfcache. Resetting elements.");
            // Reset animation flag if necessary
            isAnimating = false; 

            // Select elements that were animated
            const headerContent = document.querySelector('.header-content');
            const infoBlocks = document.querySelector('.info-blocks');
            const allProjectImages = document.querySelectorAll('.project-image');
            const allProjectHeaders = document.querySelectorAll('.project-header');
            const canvasContainer = document.getElementById('canvasContainer');

            const elementsToReset = [
                headerContent, 
                infoBlocks, 
                canvasContainer, 
                ...allProjectImages, 
                ...allProjectHeaders
            ];
            const classesToRemove = ['fade-out', 'slide-up', 'fade-in', 'fade-out-transition', 'slide-up-transition', 'fade-in-transition'];

            elementsToReset.forEach(element => {
                if (element) {
                    classesToRemove.forEach(cls => element.classList.remove(cls));
                    // Reset inline styles potentially added by animations
                    element.style.opacity = ''; 
                    element.style.animation = ''; // Reset animation property
                    if (element.classList.contains('project-image')) {
                       element.style.maxHeight = ''; // Reset max-height for images
                       element.style.paddingTop = '';
                       element.style.paddingBottom = '';
                    }
                     // Ensure canvas starts hidden again if we navigate back quickly before its fade-in completes
                    if (element === canvasContainer) {
                         element.style.opacity = '0'; 
                    }
                }
            });
             // Re-apply initial styles if needed (e.g., if elements should start faded in on normal load)
             // For now, we assume elements should be visible by default unless canvas.
             if (headerContent) headerContent.style.opacity = '1';
             if (infoBlocks) infoBlocks.style.opacity = '1';
             allProjectImages.forEach(img => img.style.opacity = '1');
             allProjectHeaders.forEach(hdr => hdr.style.opacity = '1');


            // Optional: Re-initialize canvas warp speed if needed, though it might reset automatically
            // if (window.warpSpeed !== undefined) {
            //     window.warpSpeed = 0.2; // Reset to initial baseWarpSpeed from canvas.js
            // }
            // Optional: If canvas animation needs reset
            // if (typeof init === 'function') {
            //    // Consider if re-running init() is safe and desired here
            // }
        }
    });
    // --- End pageshow listener ---

    async function animatePageExit(targetUrl, projectImage, projectHeader) {
        // Animate warp speed concurrently over the extended duration
        animateWarpSpeed(window.warpSpeed, 5, FULL_ANIMATION_DURATION);

        // Select ALL project images
        const allProjectImages = document.querySelectorAll('.project-image');

        // --- Start Sequential Animations --- 
        // 1. Header fade out
        await applyAnimation(headerContent, 'fade-out', FADE_DURATION);

        // 2. Info blocks fade out
        await applyAnimation(infoBlocks, 'fade-out', FADE_DURATION);

        // --- Start Canvas Fade-in (Concurrent with next steps) ---
        // Start canvas fade-in AFTER text disappears
        // MOVED: applyAnimation(canvasContainer, 'fade-in', CANVAS_FADE_IN_DURATION);

        // 3. All Project images slide up concurrently
        const imageSlidePromises = [];
        allProjectImages.forEach(img => {
            // Set initial max-height based on current rendered height for transition
            img.style.maxHeight = `${img.offsetHeight}px`; 
            // Force reflow to apply max-height before adding transition class
            img.offsetHeight; 
            imageSlidePromises.push(applyAnimation(img, 'slide-up', SLIDE_UP_DURATION)); // Use new duration
        });
        await Promise.all(imageSlidePromises);

        // 4. All Project headers fade out concurrently (using .project-header selector as per user change)
        const allProjectTitles = document.querySelectorAll('.project-header');
        const titleFadePromises = [];
        allProjectTitles.forEach(title => {
            titleFadePromises.push(applyAnimation(title, 'fade-out', FADE_DURATION));
        });
        await Promise.all(titleFadePromises);

        // --- Start Canvas Fade-in AFTER project headers finish animating ---
        applyAnimation(canvasContainer, 'fade-in', CANVAS_FADE_IN_DURATION);

        // Ensure warp speed animation has time to finish (or use Promise.all)
        // Navigation is handled after the last animation step implicitly by the total duration

        // 5. Navigate after the total sequential duration including title fade
        setTimeout(() => {
            window.location.href = targetUrl;
            // Reset animation flag *just before* navigation, though likely not needed
            // isAnimating = false; 
        }, TOTAL_NAVIGATE_DELAY); // Use the existing sequential duration for navigation delay
    }

    function applyAnimation(element, animationClass, duration) {
        return new Promise(resolve => {
            if (!element) {
                resolve(); // Resolve immediately if element doesn't exist
                return;
            }

            // Reset initial animation if applying fade-out to header/info
            if ((element === headerContent || element === infoBlocks) && animationClass === 'fade-out') {
                element.style.animation = 'none';
            }

            // Determine the correct transition class based on the animation class
            let transitionClass;
            if (animationClass === 'fade-out') {
                transitionClass = 'fade-out-transition';
            } else if (animationClass === 'slide-up') {
                transitionClass = 'slide-up-transition';
            } else if (animationClass === 'fade-in') {
                transitionClass = 'fade-in-transition';
            } else {
                 // Fallback or error if needed
                transitionClass = '';
            }
            
            if (transitionClass) {
                element.classList.add(transitionClass);
            }
            
            // Use requestAnimationFrame to ensure the transition class is applied before the animation class
            requestAnimationFrame(() => {
                 element.classList.add(animationClass);
            });

            // Resolve the promise after the transition duration
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    // Function to animate window.warpSpeed over a duration
    function animateWarpSpeed(startValue, endValue, duration) {
        const startTime = performance.now();

        function step(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1); // Ensure progress doesn't exceed 1
            
            // Simple linear interpolation
            window.warpSpeed = startValue + (endValue - startValue) * progress;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                window.warpSpeed = endValue; // Ensure final value is set
            }
        }

        requestAnimationFrame(step);
    }
});
