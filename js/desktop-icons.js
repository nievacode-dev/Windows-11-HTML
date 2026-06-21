// js/desktop-icons.js
// Handles draggable desktop icons, grid snapping, and layout persistence

class DesktopIconManager {
    constructor() {
        this.gridCellWidth = 85;
        this.gridCellHeight = 100;
        this.paddingTop = 10;
        this.paddingLeft = 10;
        
        // Settings
        this.alignToGrid = localStorage.getItem('alignToGrid') !== 'false'; // Default true
        
        // State
        this.isDragging = false;
        this.currentIcon = null;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.init();
    }

    init() {
        this.setupToggleMenu();
        this.initializeIcons();
        this.setupDragEvents();
        
        // Observe body for new icons (like the New Folder context menu action)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('app-desktop')) {
                            this.setupNewIcon(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: false });
    }

    setupToggleMenu() {
        const toggleBtn = document.getElementById('alignToGridToggle');
        if (!toggleBtn) return;

        this.updateToggleUI(toggleBtn);

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing if we don't want to, though Windows usually closes the context menu
            this.alignToGrid = !this.alignToGrid;
            localStorage.setItem('alignToGrid', this.alignToGrid);
            this.updateToggleUI(toggleBtn);
            
            // Re-align all icons instantly if turned on
            if (this.alignToGrid) {
                document.querySelectorAll('.app-desktop').forEach(icon => {
                    const rect = icon.getBoundingClientRect();
                    const snapped = this.calculateSnappedPosition(rect.left, rect.top);
                    icon.classList.add('grid-aligned');
                    this.savePosition(icon, snapped.left, snapped.top);
                });
            }
            
            document.getElementById('contextMenu').style.display = 'none';
        });
    }

    updateToggleUI(btn) {
        if (this.alignToGrid) {
            btn.innerHTML = '<span>&#10003;</span> Align icons to grid';
        } else {
            btn.innerHTML = '<span style="display:inline-block; width:12px;"></span> Align icons to grid';
        }
    }

    initializeIcons() {
        const icons = document.querySelectorAll('.app-desktop');
        
        // Initial layout if positions aren't saved
        let defaultRow = 0;
        let defaultCol = 0;
        const maxRows = Math.floor((window.innerHeight - 80) / this.gridCellHeight); // Leave room for taskbar

        icons.forEach(icon => {
            if (!icon.dataset.id) {
                // Ensure every icon has a unique ID for saving
                icon.dataset.id = "icon_" + Math.random().toString(36).substr(2, 9);
            }

            const savedPos = localStorage.getItem(`desktop_pos_${icon.dataset.id}`);
            
            if (savedPos) {
                const { left, top } = JSON.parse(savedPos);
                this.setPosition(icon, left, top);
            } else {
                // Place in grid column-major order
                const left = this.paddingLeft + (defaultCol * this.gridCellWidth);
                const top = this.paddingTop + (defaultRow * this.gridCellHeight);
                this.setPosition(icon, left, top);
                this.savePosition(icon, left, top);

                defaultRow++;
                if (defaultRow >= maxRows) {
                    defaultRow = 0;
                    defaultCol++;
                }
            }
        });
    }

    setupNewIcon(icon) {
        if (!icon.dataset.id) {
            icon.dataset.id = "icon_" + Math.random().toString(36).substr(2, 9);
        }
        
        // Find first empty spot if we want, or just place at top left
        let placed = false;
        let c = 0, r = 0;
        const maxRows = Math.floor((window.innerHeight - 80) / this.gridCellHeight);
        
        // Simple empty slot finding algorithm
        while (!placed && c < 20) { // Limit to 20 columns
            const left = this.paddingLeft + (c * this.gridCellWidth);
            const top = this.paddingTop + (r * this.gridCellHeight);
            
            let collision = false;
            document.querySelectorAll('.app-desktop').forEach(other => {
                if (other !== icon) {
                    const rect = other.getBoundingClientRect();
                    // Rough collision check
                    if (Math.abs(rect.left - left) < 10 && Math.abs(rect.top - top) < 10) {
                        collision = true;
                    }
                }
            });
            
            if (!collision) {
                this.setPosition(icon, left, top);
                this.savePosition(icon, left, top);
                placed = true;
            } else {
                r++;
                if (r >= maxRows) {
                    r = 0;
                    c++;
                }
            }
        }
    }

    setPosition(icon, left, top) {
        // Constrain to viewport (approximate)
        left = Math.max(0, Math.min(left, window.innerWidth - 75));
        top = Math.max(0, Math.min(top, window.innerHeight - 100)); // Leave taskbar space

        icon.style.left = left + 'px';
        icon.style.top = top + 'px';
    }

    savePosition(icon, left, top) {
        this.setPosition(icon, left, top);
        localStorage.setItem(`desktop_pos_${icon.dataset.id}`, JSON.stringify({ left, top }));
    }

    calculateSnappedPosition(left, top) {
        const col = Math.round((left - this.paddingLeft) / this.gridCellWidth);
        const row = Math.round((top - this.paddingTop) / this.gridCellHeight);
        
        return {
            left: this.paddingLeft + (Math.max(0, col) * this.gridCellWidth),
            top: this.paddingTop + (Math.max(0, row) * this.gridCellHeight)
        };
    }

    isCellOccupied(left, top, ignoreIcon) {
        let occupied = false;
        document.querySelectorAll('.app-desktop').forEach(icon => {
            if (icon !== ignoreIcon) {
                const rect = icon.getBoundingClientRect();
                if (Math.abs(rect.left - left) < 10 && Math.abs(rect.top - top) < 10) {
                    occupied = true;
                }
            }
        });
        return occupied;
    }

    setupDragEvents() {
        document.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click

            // 1. Check if dragging from Start Menu
            const startApp = e.target.closest('.start-app');
            if (startApp) {
                const img = startApp.querySelector('img');
                const span = startApp.querySelector('span');
                
                if (img && span) {
                    const icon = document.createElement('div');
                    icon.className = 'app-desktop dragging';
                    icon.dataset.id = "icon_" + Math.random().toString(36).substr(2, 9);
                    
                    icon.innerHTML = `
                        <div class="app-shortcut">
                            <img src="${img.src}" class="app application" />
                            <img src="icon/shortcut.ico" class="shortcut" />
                        </div>
                        <span class="app-name">${span.innerText}</span>
                    `;
                    icon.dataset.title = span.innerText;
                    icon.dataset.fromStartMenu = "true";

                    // Double click opens the app logic
                    icon.addEventListener("dblclick", () => {
                        if (typeof createWindow === 'function') {
                            createWindow(span.innerText, span.innerText.toLowerCase().replace(/\s/g, ''), img.src);
                        }
                    });

                    icon.addEventListener("click", (ev) => {
                        ev.stopPropagation();
                        document.querySelectorAll(".app-desktop").forEach(a => a.classList.remove("active"));
                        icon.classList.add("active");
                    });

                    document.body.appendChild(icon);

                    this.isDragging = true;
                    this.currentIcon = icon;
                    
                    this.offsetX = this.gridCellWidth / 2;
                    this.offsetY = this.gridCellHeight / 2;

                    this.setPosition(icon, e.clientX - this.offsetX, e.clientY - this.offsetY);
                    e.preventDefault();
                    return;
                }
            }

            // 2. Check if dragging desktop icon
            const icon = e.target.closest('.app-desktop');
            if (!icon) return;

            // Ignore double clicks rapidly creating drag
            if (e.detail > 1) return;

            this.isDragging = true;
            this.currentIcon = icon;
            
            icon.classList.remove('grid-aligned');
            icon.classList.add('dragging');

            const rect = icon.getBoundingClientRect();
            // Save original position in case we need to revert due to overlap
            icon.dataset.originalLeft = rect.left;
            icon.dataset.originalTop = rect.top;

            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.currentIcon) return;

            const newLeft = e.clientX - this.offsetX;
            const newTop = e.clientY - this.offsetY;
            
            this.setPosition(this.currentIcon, newLeft, newTop);
        });

        document.addEventListener('mouseup', (e) => {
            if (!this.isDragging || !this.currentIcon) return;

            const icon = this.currentIcon;
            this.isDragging = false;
            this.currentIcon = null;

            icon.classList.remove('dragging');

            // Handle drop from start menu
            if (icon.dataset.fromStartMenu === "true") {
                const startMenu = document.getElementById('startMenu');
                // Check if dropped inside the start menu
                if (startMenu && startMenu.classList.contains("menu-open")) {
                    const smRect = startMenu.getBoundingClientRect();
                    if (e.clientX >= smRect.left && e.clientX <= smRect.right &&
                        e.clientY >= smRect.top && e.clientY <= smRect.bottom) {
                        icon.remove(); // Destroy if dropped back into start menu
                        return;
                    }
                }
                icon.dataset.fromStartMenu = "false";
                if (startMenu) {
                    startMenu.classList.remove("menu-open"); // Close start menu properly
                    startMenu.style.bottom = ""; // Clean up any inline styles
                }
                // Don't have an original position to revert to, so if occupied, we'll let setupNewIcon handle it
            }

            const rect = icon.getBoundingClientRect();
            let finalLeft = rect.left;
            let finalTop = rect.top;

            if (this.alignToGrid) {
                const snapped = this.calculateSnappedPosition(finalLeft, finalTop);
                
                if (this.isCellOccupied(snapped.left, snapped.top, icon)) {
                    // Revert
                    if (icon.dataset.originalLeft !== undefined && icon.dataset.originalTop !== undefined) {
                        finalLeft = parseFloat(icon.dataset.originalLeft);
                        finalTop = parseFloat(icon.dataset.originalTop);
                    } else {
                        // Find empty slot for start menu drops
                        this.setupNewIcon(icon);
                        return;
                    }
                } else {
                    finalLeft = snapped.left;
                    finalTop = snapped.top;
                }
                
                icon.classList.add('grid-aligned');
            }

            this.savePosition(icon, finalLeft, finalTop);
            
            // Cleanup class after transition
            setTimeout(() => {
                icon.classList.remove('grid-aligned');
            }, 200);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DesktopIconManager();
});
