// Windows 11 Settings App Integration

// Get Elements
const settingsContainer = document.getElementById("settingsWindow");

// ── Color Mode ───────────────────────────────────────────────────────────────

function applyColorMode(mode) {
    if (mode === 'Light') {
        document.body.classList.add('light-mode');
    } else {
        // Dark or Custom → remove light-mode
        document.body.classList.remove('light-mode');
    }
    localStorage.setItem('colorMode', mode);

    // Keep dropdown in sync (in case called from outside)
    const sel = document.querySelector('.color-mode-select');
    if (sel) sel.value = mode;
}

// Apply saved preference on page load
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('colorMode') || 'Dark';
    applyColorMode(saved);

    // Wire up the dropdown (first time, before Settings window is opened)
    const sel = document.querySelector('.color-mode-select');
    if (sel) {
        sel.value = saved;
        sel.addEventListener('change', () => applyColorMode(sel.value));
    }
});

// Export to Global window functions
window.openSettingsWindow = function() {
    const isHidden = !settingsContainer.classList.contains('settings-visible');

    if (isHidden) {
        // Remove any leftover hidden/minimizing state
        settingsContainer.classList.remove('hidden', 'minimizing');
        settingsContainer.style.removeProperty('display');
        // Show via CSS class (avoids !important inline style that blocks minimize)
        settingsContainer.classList.add('settings-visible');

        // Register it as a window for interaction engine if it wasn't already
        if (!windows['settings']) {
            windows['settings'] = {
                element: settingsContainer,
                isMaximized: false,
                isMinimized: false,
                appTitle: "Settings",
                appIcon: "icon/settings.ico",
                x: parseInt(settingsContainer.style.left) || 100,
                y: parseInt(settingsContainer.style.top) || 50,
                width: 1000,
                height: 700,
                originalState: null,
                taskbarElement: null
            };

            const dragHandle = settingsContainer.querySelector(".settings-drag-region");
            const resizeHan = settingsContainer.querySelector(".window-resize");
            makeWindowInteractive('settings', dragHandle, resizeHan);
        }

        // Always create a fresh taskbar item on open
        if (!windows['settings'].taskbarElement) {
            createTaskbarItem('settings');
        }

        updateZIndex('settings');

        // Sync dropdown to current mode each time Settings opens
        const sel = settingsContainer.querySelector('.color-mode-select');
        if (sel) {
            const saved = localStorage.getItem('colorMode') || 'Dark';
            sel.value = saved;
            // Re-attach listener (safe to add multiple times as long as fn reference differs,
            // so use a named data attribute guard)
            if (!sel.dataset.modeListenerAttached) {
                sel.dataset.modeListenerAttached = '1';
                sel.addEventListener('change', () => applyColorMode(sel.value));
            }
        }
    } else {
        // If minimized, restore it
        if (windows['settings'] && windows['settings'].isMinimized) {
            minimizeWindow('settings');
        } else {
            updateZIndex('settings');
        }
    }
};

window.closeSettingsWindow = function() {
    const el = settingsContainer;
    const win = windows['settings'];

    // Remove the taskbar entry
    if (win && win.taskbarElement) {
        win.taskbarElement.remove();
        win.taskbarElement = null;
    }

    // Clear focus state
    if (activeWindowId === 'settings') {
        activeWindowId = null;
    }

    // Play the closing animation, then hide
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
    void el.offsetWidth;

    el.classList.add('closing');
    setTimeout(() => {
        el.classList.remove('closing', 'settings-visible');
        el.style.opacity = '';
        el.style.transform = '';
        if (win) win.isMinimized = false;
    }, 200);
};
