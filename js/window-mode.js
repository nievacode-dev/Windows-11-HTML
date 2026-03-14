// Grab all icons and windows
const icons = document.querySelectorAll('.app-icon');
const windows = document.querySelectorAll('.window');

// Global state variables
let isDragging = false;
let activeWindow = null; // Tracks WHICH window is currently being dragged
let offsetX = 0;
let offsetY = 0;
let zIndexCounter = 10;  // Starts at 10, goes up every time a window is clicked

// Function to bring a window to the front
function bringToFront(win) {
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
}

// 1. Open Apps on Double Click
icons.forEach(icon => {
    icon.addEventListener('dblclick', () => {
        // Find the window that matches the icon's data-window attribute
        const targetClass = icon.getAttribute('data-window');
        const targetWindow = document.querySelector(`.window.${targetClass}`);
        
        if (targetWindow) {
            targetWindow.classList.remove('hidden');
            bringToFront(targetWindow);
        }
    });
});

// 2. Setup Controls and Dragging for EACH window
windows.forEach(win => {
    // Scope the controls to this specific window
    const minBtn = win.querySelector('.minimize');
    const maxBtn = win.querySelector('.maximize');
    const closeBtn = win.querySelector('.close');
    const titleBar = win.querySelector('.title-bar');

    // Bring window to front when clicking anywhere on it
    win.addEventListener('mousedown', () => bringToFront(win));

    // Window Controls
    minBtn.addEventListener('click', () => win.classList.add('hidden'));
    maxBtn.addEventListener('click', () => win.classList.toggle('maximized'));
    closeBtn.addEventListener('click', () => {
        win.classList.add('hidden');
        win.classList.remove('maximized');
    });

    // Dragging Initiation
    titleBar.addEventListener('mousedown', (e) => {
        if (win.classList.contains('maximized')) return;

        isDragging = true;
        activeWindow = win; // Set this window as the one being dragged
        win.classList.add('dragging');
        
        const rect = win.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });
});

// 3. Global Dragging Logic
document.addEventListener('mousemove', (e) => {
    // Only drag if we are dragging AND we know which window is active
    if (!isDragging || !activeWindow) return;

    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    newY = Math.max(0, newY); // Don't drag above the screen

    // Apply coordinates to the currently active window
    activeWindow.style.left = `${newX}px`;
    activeWindow.style.top = `${newY}px`;
});

document.addEventListener('mouseup', () => {
    if (activeWindow) {
        activeWindow.classList.remove('dragging');
    }
    isDragging = false;
    activeWindow = null; // Clear the active window
});