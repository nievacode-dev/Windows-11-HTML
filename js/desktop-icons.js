// js/desktop-icons.js
// Handles draggable desktop icons, grid snapping, layout persistence, selection, double-click, and slow click-to-rename

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

        DesktopIconManager.instance = this;
        this.init();
    }

    init() {
        this.setupToggleMenu();
        this.initializeIcons();
        this.setupDragEvents();
        this.setupGlobalEvents();

        // Observe body for new icons (like the New Folder context menu action)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('app-desktop')) {
                            this.setupNewIcon(node);
                            this.bindDesktopItemEvents(node);
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
            e.stopPropagation();
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

            const contextMenu = document.getElementById('contextMenu');
            if (contextMenu) contextMenu.style.display = 'none';
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

        let defaultRow = 0;
        let defaultCol = 0;
        const maxRows = Math.floor((window.innerHeight - 80) / this.gridCellHeight);

        icons.forEach(icon => {
            if (!icon.dataset.id) {
                icon.dataset.id = "icon_" + Math.random().toString(36).substr(2, 9);
            }

            const savedPos = localStorage.getItem(`desktop_pos_${icon.dataset.id}`);

            if (savedPos) {
                const { left, top } = JSON.parse(savedPos);
                this.setPosition(icon, left, top);
            } else {
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

            this.bindDesktopItemEvents(icon);
        });
    }

    setupNewIcon(icon) {
        if (!icon.dataset.id) {
            icon.dataset.id = "icon_" + Math.random().toString(36).substr(2, 9);
        }

        let placed = false;
        let c = 0, r = 0;
        const maxRows = Math.floor((window.innerHeight - 80) / this.gridCellHeight);

        while (!placed && c < 20) {
            const left = this.paddingLeft + (c * this.gridCellWidth);
            const top = this.paddingTop + (r * this.gridCellHeight);

            let collision = false;
            document.querySelectorAll('.app-desktop').forEach(other => {
                if (other !== icon) {
                    const rect = other.getBoundingClientRect();
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
        left = Math.max(0, Math.min(left, window.innerWidth - 75));
        top = Math.max(0, Math.min(top, window.innerHeight - 100));

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

    bindDesktopItemEvents(icon) {
        if (icon._eventsBound) return;
        icon._eventsBound = true;

        // Selection & Slow Click-to-Rename
        icon.addEventListener("click", (e) => {
            // If we are currently editing the name, let editing happen
            const nameSpan = icon.querySelector(".app-name");
            if (nameSpan && nameSpan.isContentEditable) {
                e.stopPropagation();
                return;
            }

            e.stopPropagation();

            const isAlreadyActive = icon.classList.contains("active");
            const now = Date.now();
            const lastClickTime = icon._lastClickTime || 0;
            const timeSinceLastClick = now - lastClickTime;

            if (!isAlreadyActive) {
                // First click: select icon
                document.querySelectorAll(".app-desktop").forEach(a => a.classList.remove("active"));
                icon.classList.add("active");
                icon._lastClickTime = now;
                icon._lastClickTarget = e.target;
            } else {
                // Already selected: check if clicked on name after delay
                const clickedOnName = e.target.closest(".app-name");
                if (clickedOnName && timeSinceLastClick >= 500) {
                    // Slow click on name -> Trigger rename!
                    DesktopIconManager.startRename(icon);
                } else {
                    icon._lastClickTime = now;
                    icon._lastClickTarget = e.target;
                }
            }
        });

        // Double-click to open window
        icon.addEventListener("dblclick", (e) => {
            const nameSpan = icon.querySelector(".app-name");
            if (nameSpan && nameSpan.isContentEditable) {
                e.stopPropagation();
                return;
            }

            e.stopPropagation();
            this.openDesktopApp(icon);
        });
    }

    openDesktopApp(icon) {
        if (typeof createWindow !== 'function') return;

        const id = icon.dataset.id || "";
        const title = icon.dataset.title || (icon.querySelector(".app-name") ? icon.querySelector(".app-name").textContent.trim() : "Application");
        const img = icon.querySelector("img.application, img.app");
        const iconSrc = img ? img.src : "icon/folder.ico";

        if (id === "recycle-bin") {
            createWindow("Recycle Bin", "recycle-bin", iconSrc);
        } else if (id === "browser" || id === "edge") {
            createWindow("Microsoft Edge", "edge", "icon/edge.ico");
        } else if (id.startsWith("folder")) {
            createWindow(title, "explorer", "icon/folder.ico");
        } else if (id === "cmd") {
            if (typeof openTerminalWindow === 'function') openTerminalWindow();
        } else {
            createWindow(title, id, iconSrc);
        }
    }

    static startRename(icon) {
        if (!icon) return;
        const nameSpan = icon.querySelector('.app-name');
        if (!nameSpan || nameSpan.isContentEditable) return;

        const originalText = nameSpan.textContent.trim();
        nameSpan.contentEditable = "true";
        nameSpan.focus();

        // Select all text in nameSpan
        try {
            const range = document.createRange();
            range.selectNodeContents(nameSpan);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (err) {
            console.error("Selection error:", err);
        }

        let isDone = false;
        const finishRename = (commit) => {
            if (isDone) return;
            isDone = true;

            nameSpan.contentEditable = "false";
            nameSpan.removeEventListener("keydown", onKeyDown);
            nameSpan.removeEventListener("blur", onBlur);
            nameSpan.removeEventListener("mousedown", stopProp);
            nameSpan.removeEventListener("click", stopProp);
            nameSpan.removeEventListener("dblclick", stopProp);

            const newText = nameSpan.textContent.trim();
            if (commit && newText !== "") {
                icon.dataset.title = newText;
                nameSpan.textContent = newText;
            } else {
                nameSpan.textContent = originalText;
            }
        };

        const onKeyDown = (e) => {
            e.stopPropagation(); // prevent global shortcuts like s, r, d
            if (e.key === "Enter") {
                e.preventDefault();
                finishRename(true);
            } else if (e.key === "Escape") {
                e.preventDefault();
                finishRename(false);
            }
        };

        const onBlur = () => {
            finishRename(true);
        };

        const stopProp = (e) => {
            e.stopPropagation();
        };

        nameSpan.addEventListener("keydown", onKeyDown);
        nameSpan.addEventListener("blur", onBlur);
        nameSpan.addEventListener("mousedown", stopProp);
        nameSpan.addEventListener("click", stopProp);
        nameSpan.addEventListener("dblclick", stopProp);
    }

    setupGlobalEvents() {
        // Deselect all desktop icons when clicking empty background
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".app-desktop") &&
                !e.target.closest(".taskbar") &&
                !e.target.closest(".start-menu") &&
                !e.target.closest(".search-menu") &&
                !e.target.closest(".quick-settings") &&
                !e.target.closest(".context-menu") &&
                !e.target.closest(".window")) {
                document.querySelectorAll(".app-desktop").forEach(icon => {
                    icon.classList.remove("active");
                });
            }
        });

        // F2 to rename active desktop icon
        document.addEventListener("keydown", (e) => {
            if (e.key === "F2") {
                const activeIcon = document.querySelector(".app-desktop.active");
                if (activeIcon) {
                    e.preventDefault();
                    DesktopIconManager.startRename(activeIcon);
                }
            }
        });
    }

    setupDragEvents() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.start-app') || e.target.closest('.app-desktop')) {
                if (!e.target.closest('.taskbar-item')) {
                    e.preventDefault();
                }
            }
        });

        let potentialDrag = null;

        document.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click

            // Ignore drag start if editing name
            const editing = e.target.closest('.app-name[contenteditable="true"]');
            if (editing) return;

            // 1. Check if dragging from Start Menu
            const startApp = e.target.closest('.start-app');
            if (startApp) {
                const img = startApp.querySelector('img');
                const span = startApp.querySelector('span');

                if (img && span) {
                    potentialDrag = {
                        type: 'startMenu',
                        img: img,
                        span: span,
                        startX: e.clientX,
                        startY: e.clientY
                    };
                    return;
                }
            }

            // 2. Check if dragging desktop icon
            const icon = e.target.closest('.app-desktop');
            if (!icon) return;

            if (e.detail > 1) return;

            potentialDrag = {
                type: 'desktopIcon',
                element: icon,
                startX: e.clientX,
                startY: e.clientY
            };
        });

        document.addEventListener('mousemove', (e) => {
            if (potentialDrag && !this.isDragging) {
                const dist = Math.hypot(e.clientX - potentialDrag.startX, e.clientY - potentialDrag.startY);
                if (dist > 5) {
                    if (potentialDrag.type === 'startMenu') {
                        const { img, span } = potentialDrag;
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

                        this.bindDesktopItemEvents(icon);
                        document.body.appendChild(icon);

                        this.isDragging = true;
                        this.currentIcon = icon;

                        this.offsetX = this.gridCellWidth / 2;
                        this.offsetY = this.gridCellHeight / 2;

                        this.setPosition(icon, e.clientX - this.offsetX, e.clientY - this.offsetY);
                    } else if (potentialDrag.type === 'desktopIcon') {
                        const icon = potentialDrag.element;
                        this.isDragging = true;
                        this.currentIcon = icon;

                        icon.classList.remove('grid-aligned');
                        icon.classList.add('dragging');

                        const rect = icon.getBoundingClientRect();
                        icon.dataset.originalLeft = rect.left;
                        icon.dataset.originalTop = rect.top;

                        this.offsetX = e.clientX - rect.left;
                        this.offsetY = e.clientY - rect.top;
                    }
                }
            }

            if (!this.isDragging || !this.currentIcon) return;

            const newLeft = e.clientX - this.offsetX;
            const newTop = e.clientY - this.offsetY;

            this.setPosition(this.currentIcon, newLeft, newTop);
        });

        document.addEventListener('mouseup', (e) => {
            potentialDrag = null;

            if (!this.isDragging || !this.currentIcon) return;

            const icon = this.currentIcon;
            this.isDragging = false;
            this.currentIcon = null;

            icon.classList.remove('dragging');

            if (icon.dataset.fromStartMenu === "true") {
                const startMenu = document.getElementById('startMenu');
                if (startMenu && startMenu.classList.contains("menu-open")) {
                    const smRect = startMenu.getBoundingClientRect();
                    if (e.clientX >= smRect.left && e.clientX <= smRect.right &&
                        e.clientY >= smRect.top && e.clientY <= smRect.bottom) {
                        icon.remove();
                        return;
                    }
                }
                icon.dataset.fromStartMenu = "false";
                if (startMenu) {
                    startMenu.classList.remove("menu-open");
                    startMenu.style.bottom = "";
                }
            }

            const rect = icon.getBoundingClientRect();
            let finalLeft = rect.left;
            let finalTop = rect.top;

            if (this.alignToGrid) {
                const snapped = this.calculateSnappedPosition(finalLeft, finalTop);

                if (this.isCellOccupied(snapped.left, snapped.top, icon)) {
                    if (icon.dataset.originalLeft !== undefined && icon.dataset.originalTop !== undefined) {
                        finalLeft = parseFloat(icon.dataset.originalLeft);
                        finalTop = parseFloat(icon.dataset.originalTop);
                    } else {
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

            setTimeout(() => {
                icon.classList.remove('grid-aligned');
            }, 200);
        });
    }
}

// Global hook
window.startDesktopRename = (icon) => {
    DesktopIconManager.startRename(icon);
};

document.addEventListener('DOMContentLoaded', () => {
    new DesktopIconManager();
});
