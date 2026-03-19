let windowId = 0;
let windows = {};

// Create a new window
function createWindow(appTitle = "Window", appId = null, appIcon = null) {
  windowId++;
  const id = `window-${windowId}`;
  
  const windowElement = document.createElement("div");
  windowElement.classList.add("window");
  windowElement.id = id;
  windowElement.dataset.appId = appId;
  windowElement.style.left = `${100 + (windowId % 5) * 20}px`;
  windowElement.style.top = `${50 + (windowId % 5) * 20}px`;
  
  const titleBar = document.createElement("div");
  titleBar.classList.add("title-bar");
  
  const titleText = document.createElement("div");
  titleText.classList.add("title");
  
  // Add app icon to title bar if available
  if (appIcon) {
    const iconImg = document.createElement("img");
    iconImg.src = appIcon;
    iconImg.style.width = "16px";
    iconImg.style.height = "16px";
    iconImg.style.display = "block";
    titleText.appendChild(iconImg);
  }
  
  const titleSpan = document.createElement("span");
  titleSpan.textContent = appTitle;
  titleText.appendChild(titleSpan);
  
  const windowControls = document.createElement("div");
  windowControls.classList.add("window-controls");
  
  // Minimize button
  const minimizeBtn = document.createElement("button");
  minimizeBtn.classList.add("control-btn", "minimize");
  minimizeBtn.textContent = "_";
  minimizeBtn.onclick = (e) => {
    e.stopPropagation();
    minimizeWindow(id);
  };
  
  // Maximize button
  const maximizeBtn = document.createElement("button");
  maximizeBtn.classList.add("control-btn", "maximize");
  maximizeBtn.textContent = "□";
  maximizeBtn.onclick = (e) => {
    e.stopPropagation();
    maximizeWindow(id);
  };
  
  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.classList.add("control-btn", "close");
  closeBtn.textContent = "×";
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeWindow(id);
  };
  
  windowControls.appendChild(minimizeBtn);
  windowControls.appendChild(maximizeBtn);
  windowControls.appendChild(closeBtn);
  
  titleBar.appendChild(titleText);
  titleBar.appendChild(windowControls);
  
  const contentArea = document.createElement("div");
  contentArea.classList.add("window-content");
  contentArea.textContent = `${appTitle} is running...`;
  
  // Add resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.classList.add("window-resize");
  
  windowElement.appendChild(titleBar);
  windowElement.appendChild(contentArea);
  windowElement.appendChild(resizeHandle);
  
  document.body.appendChild(windowElement);
  
  // Make window draggable
  makeWindowDraggable(id);
  
  // Make window resizable
  makeWindowResizable(id);
  
  // Store window info
  windows[id] = {
    element: windowElement,
    isMaximized: false,
    isMinimized: false,
    appTitle: appTitle,
    appIcon: appIcon,
    originalPosition: { 
      top: windowElement.style.top,
      left: windowElement.style.left,
      width: "600px",
      height: "400px"
    }
  };
  
  // Set initial z-index (bring to front)
  updateZIndex(id);
  
  return id;
}

// Make window draggable
function makeWindowDraggable(windowId) {
  const windowElement = document.getElementById(windowId);
  const titleBar = windowElement.querySelector(".title-bar");
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialMouseX = 0;
  let initialMouseY = 0;
  let dragStartTime = 0;
  let wasMaximized = false;
  
  // Double-click to maximize/restore
  titleBar.addEventListener("dblclick", (e) => {
    if (e.target.classList.contains("control-btn")) return;
    maximizeWindow(windowId);
  });
  
  titleBar.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("control-btn")) return;
    
    dragStartTime = Date.now();
    wasMaximized = windows[windowId].isMaximized;
    
    // If window is maximized, restore it but keep dragging
    if (wasMaximized) {
      const mouseXPercent = e.clientX / window.innerWidth;
      maximizeWindow(windowId); // This will restore it
      
      // Position window under cursor
      const newWidth = parseInt(windowElement.style.width) || 600;
      windowElement.style.left = (e.clientX - newWidth * mouseXPercent) + "px";
      windowElement.style.top = "10px";
      
      currentX = windowElement.offsetLeft;
      currentY = windowElement.offsetTop;
    } else {
      currentX = windowElement.offsetLeft;
      currentY = windowElement.offsetTop;
    }
    
    isDragging = true;
    windowElement.classList.add("dragging");
    
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;
    
    updateZIndex(windowId);
  });
  
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - initialMouseX;
    const deltaY = e.clientY - initialMouseY;
    
    windowElement.style.left = (currentX + deltaX) + "px";
    windowElement.style.top = Math.max(0, currentY + deltaY) + "px";
    
    // Snap to top for maximize
    if (e.clientY < 5 && !wasMaximized) {
      windowElement.style.opacity = "0.7";
    } else {
      windowElement.style.opacity = "1";
    }
  });
  
  document.addEventListener("mouseup", (e) => {
    if (isDragging) {
      isDragging = false;
      windowElement.classList.remove("dragging");
      
      // Snap to maximize if dragged to top
      if (e.clientY < 5 && !wasMaximized && Date.now() - dragStartTime > 200) {
        maximizeWindow(windowId);
      }
      
      windowElement.style.opacity = "1";
    }
  });
  
  // Bring window to front on click
  windowElement.addEventListener("mousedown", () => {
    updateZIndex(windowId);
  });
}

// Make window resizable
function makeWindowResizable(windowId) {
  const windowElement = document.getElementById(windowId);
  const resizeHandle = windowElement.querySelector(".window-resize");
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  
  resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = windowElement.offsetWidth;
    startHeight = windowElement.offsetHeight;
    windowElement.classList.add("dragging");
  });
  
  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newWidth = Math.max(400, startWidth + deltaX);
    const newHeight = Math.max(300, startHeight + deltaY);
    
    windowElement.style.width = newWidth + "px";
    windowElement.style.height = newHeight + "px";
  });
  
  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      windowElement.classList.remove("dragging");
    }
  });
}

// Update z-index to bring window to front
function updateZIndex(windowId) {
  let maxZIndex = 1000;
  
  // Remove active class from all windows
  Object.keys(windows).forEach(id => {
    windows[id].element.classList.remove("active");
    const zIndex = parseInt(window.getComputedStyle(windows[id].element).zIndex) || 0;
    if (zIndex > maxZIndex) {
      maxZIndex = zIndex;
    }
  });
  
  // Set new z-index and add active class to focused window
  const windowElement = document.getElementById(windowId);
  windowElement.style.zIndex = maxZIndex + 1;
  windowElement.classList.add("active");
}

// Minimize window
function minimizeWindow(windowId) {
  const windowElement = document.getElementById(windowId);
  const window_data = windows[windowId];
  
  if (window_data.isMinimized) {
    // Restore window
    windowElement.classList.remove("hidden");
    window_data.isMinimized = false;
    
    // Remove from taskbar
    const taskbarItem = document.querySelector(`[data-window-id="${windowId}"]`);
    if (taskbarItem) {
      taskbarItem.remove();
    }
  } else {
    // Minimize window
    windowElement.classList.add("hidden");
    window_data.isMinimized = true;
    
    // Add to taskbar
    const taskbarApps = document.getElementById("taskbarApps");
    if (taskbarApps) {
      const taskbarItem = document.createElement("div");
      taskbarItem.classList.add("minimized-taskbar-item");
      taskbarItem.dataset.windowId = windowId;
      
      // Add icon if available
      if (window_data.appIcon) {
        const iconImg = document.createElement("img");
        iconImg.src = window_data.appIcon;
        iconImg.classList.add("minimized-taskbar-icon");
        taskbarItem.appendChild(iconImg);
      }
      
      
      taskbarItem.onclick = () => minimizeWindow(windowId);
      
      taskbarApps.appendChild(taskbarItem);
    }
  }
  
  updateZIndex(windowId);
}

// Maximize window
function maximizeWindow(windowId) {
  const windowElement = document.getElementById(windowId);
  if (windows[windowId].isMaximized) {
    // Restore to original size
    windowElement.classList.remove("maximized");
    windowElement.style.width = windows[windowId].originalPosition.width;
    windowElement.style.height = windows[windowId].originalPosition.height;
    windowElement.style.top = windows[windowId].originalPosition.top;
    windowElement.style.left = windows[windowId].originalPosition.left;
    windows[windowId].isMaximized = false;
  } else {
    // Maximize
    windows[windowId].originalPosition = {
      top: windowElement.style.top,
      left: windowElement.style.left,
      width: windowElement.style.width,
      height: windowElement.style.height
    };
    windowElement.classList.add("maximized");
    windows[windowId].isMaximized = true;
  }
}

// Close window
function closeWindow(windowId) {
  const windowElement = document.getElementById(windowId);
  
  // Remove from taskbar if minimized
  const taskbarItem = document.querySelector(`[data-window-id="${windowId}"]`);
  if (taskbarItem) {
    taskbarItem.remove();
  }
  
  windowElement.classList.add("closing");
  setTimeout(() => {
    windowElement.remove();
    delete windows[windowId];
  }, 150);
}

// Handle app-shortcut and start-app clicks
function initializeAppShortcuts() {
  const appShortcuts = document.querySelectorAll(".app-shortcut, .start-app");
  
  appShortcuts.forEach(shortcut => {
    shortcut.style.cursor = "pointer";
    
    // Remove any existing listeners by cloning
    const newShortcut = shortcut.cloneNode(true);
    shortcut.parentNode.replaceChild(newShortcut, shortcut);
    
    newShortcut.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Get app title and icon from different sources
      let appTitle = "Application";
      let appId = null;
      let appIcon = null;
      
      if (newShortcut.classList.contains("app-shortcut")) {
        // From desktop app
        const appDesktop = newShortcut.closest(".app-desktop");
        appTitle = appDesktop.dataset.title || "Application";
        appId = appDesktop.dataset.id || null;
        
        // Get icon from app-shortcut
        const iconImg = newShortcut.querySelector("img.app");
        if (iconImg) {
          appIcon = iconImg.src;
        }
      } else if (newShortcut.classList.contains("start-app")) {
        // From start menu app
        const appNameSpan = newShortcut.querySelector(".start-app-name");
        appTitle = appNameSpan ? appNameSpan.textContent : "Application";
        
        // Get icon from start-app
        const iconImg = newShortcut.querySelector("img.app-list");
        if (iconImg) {
          appIcon = iconImg.src;
        }
      }
      
      createWindow(appTitle, appId, appIcon);
    });
    
    // Double-click support
    newShortcut.addEventListener("dblclick", (e) => {
      e.stopPropagation();
    });
  });
}

// Handle .app-tb taskbar icon clicks
function initializeTaskbarApps() {
  const taskbarApps = document.querySelectorAll(".app-tb");
  taskbarApps.forEach(appImg => {
    appImg.style.cursor = "pointer";
    appImg.addEventListener("click", (e) => {
      e.stopPropagation();
      const appTitle = appImg.alt || "Application";
      const appIcon = appImg.src;
      createWindow(appTitle, null, appIcon);
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeAppShortcuts();
    initializeTaskbarApps();
  });
} else {
  initializeAppShortcuts();
  initializeTaskbarApps();
}
