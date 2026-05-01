/* scripts/custom-cursor.js */
document.addEventListener("DOMContentLoaded", () => {
    // Check if the cursor is already injected (prevent duplicate on some navigations)
    if (document.getElementById('custom-cursor-container')) return;

    // Inject the cursor HTML
    const cursorHTML = `
        <div id="custom-cursor-container">
            <img id="custom-cursor-image" src="images/mouse.png" alt="mouse cursor">
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', cursorHTML);

    const cursorContainer = document.getElementById('custom-cursor-container');

    // Selector for anything explicitly clickable
    const CLICKABLE = 'a, button, input, .nav-arrow, .clickable, #entrance-trigger, .archive-node, [role="button"], u, .story-tab, .book-popup, .nav-button, .add-story-btn';

    // Follow the mouse pointer using pointermove to capture drag events
    document.addEventListener('pointermove', (e) => {
        cursorContainer.style.left = `${e.clientX}px`;
        cursorContainer.style.top  = `${e.clientY}px`;

        // Also check computed cursor style so canvas & dynamically styled
        // elements (grab, pointer, etc.) trigger the glow correctly
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el) {
            const computed = window.getComputedStyle(el).cursor;
            const isClickable = el.closest(CLICKABLE);
            
            if (computed === 'pointer' || isClickable) {
                cursorContainer.classList.add('hover-active');
            } else {
                cursorContainer.classList.remove('hover-active');
            }
        }
    });

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(CLICKABLE)) {
            cursorContainer.classList.add('hover-active');
        }
    });

    document.addEventListener('mouseout', (e) => {
        // Only remove if we're not moving into another clickable child
        if (e.target.closest(CLICKABLE) && !e.relatedTarget?.closest(CLICKABLE)) {
            cursorContainer.classList.remove('hover-active');
        }
    });
});
