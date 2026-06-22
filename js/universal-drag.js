// Universal Dragging System for any window or dialog
// Usage: 
// 1. Add data-drag-window="true" to the main window container
// 2. Add data-drag-handle="true" to the titlebar or element you want to drag from

class UniversalDraggable {
    constructor() {
        this.isDragging = false;
        this.currentWindow = null;
        this.offsetX = 0;
        this.offsetY = 0;

        this.init();
    }

    init() {
        document.addEventListener('mousedown', (e) => {
            // Check if we clicked on a drag handle
            const handle = e.target.closest('[data-drag-handle="true"]');
            if (!handle) return;
            
            // Ignore if we clicked a button or interactive element
            if (e.target.closest('button, input, select, textarea, .close-x, .run-close, a, .control-btn, .edge-tab, .edge-tab-add')) return;

            // Find the parent window
            const win = handle.closest('[data-drag-window="true"]');
            if (!win) return;

            this.isDragging = true;
            this.currentWindow = win;
            
            // Bring to front by computing highest z-index
            const allWindows = document.querySelectorAll('.window, [data-drag-window="true"]');
            let maxZ = 0;
            allWindows.forEach(w => {
                const z = parseInt(window.getComputedStyle(w).zIndex) || 0;
                if (z > maxZ) maxZ = z;
            });
            win.style.zIndex = maxZ + 1;

            // Calculate offset relative to the window's top-left corner
            this.offsetX = e.clientX - win.offsetLeft;
            this.offsetY = e.clientY - win.offsetTop;
            
            // Disable transitions for smooth dragging
            win.style.transition = "none"; 
            
            e.preventDefault(); // Prevent text selection
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.currentWindow) return;
            
            const newLeft = e.clientX - this.offsetX;
            const newTop = e.clientY - this.offsetY;
            
            this.currentWindow.style.left = newLeft + "px";
            this.currentWindow.style.top = newTop + "px";
            this.currentWindow.style.position = "absolute";
        });

        document.addEventListener('mouseup', () => {
            if (!this.isDragging) return;
            
            this.isDragging = false;
            if (this.currentWindow) {
                // Restore transition (assumes empty string falls back to CSS stylesheet)
                this.currentWindow.style.transition = "";
                this.currentWindow = null;
            }
        });
    }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new UniversalDraggable();
});
