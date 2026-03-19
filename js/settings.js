// Windows 11 Settings App Integration

// Get Elements
const settingsContainer = document.getElementById("settingsWindow");

// Export to Global window functions
window.openSettingsWindow = function() {
    if (settingsContainer.style.getPropertyValue('display') !== "flex") {
        settingsContainer.style.setProperty("display", "flex", "important");
        
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
            createTaskbarItem('settings');
        } else if (!windows['settings'].taskbarElement) {
            // reused window but closed taskbar
            createTaskbarItem('settings');
        }
        
        updateZIndex('settings');
    } else {
        updateZIndex('settings');
    }
};

window.closeSettingsWindow = function() {
    closeWindow('settings');
};
