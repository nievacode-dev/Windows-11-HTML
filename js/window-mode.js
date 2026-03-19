let windowId = 0;
let windows = {};
let activeWindowId = null;

// Snap preview element
const snapPreview = document.createElement("div");
snapPreview.classList.add("snap-preview");
document.body.appendChild(snapPreview);

// Create a new window
function createWindow(appTitle = "Window", appId = null, appIcon = null) {
  windowId++;
  const id = `window-${windowId}`;
  
  const windowElement = document.createElement("div");
  windowElement.classList.add("window");
  windowElement.id = id;
  windowElement.dataset.appId = appId;
  windowElement.style.left = `${100 + (windowId % 5) * 30}px`;
  windowElement.style.top = `${50 + (windowId % 5) * 30}px`;
  
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
  minimizeBtn.textContent = "−";
  minimizeBtn.onpointerdown = (e) => e.stopPropagation(); // prevent drag
  minimizeBtn.onclick = (e) => {
    e.stopPropagation();
    minimizeWindow(id);
  };
  
  // Maximize button
  const maximizeBtn = document.createElement("button");
  maximizeBtn.classList.add("control-btn", "maximize");
  maximizeBtn.textContent = "□";
  maximizeBtn.onpointerdown = (e) => e.stopPropagation();
  maximizeBtn.onclick = (e) => {
    e.stopPropagation();
    maximizeWindow(id);
  };
  
  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.classList.add("control-btn", "close");
  closeBtn.textContent = "×";
  closeBtn.onpointerdown = (e) => e.stopPropagation();
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
  
  // Store window info
  windows[id] = {
    element: windowElement,
    isMaximized: false,
    isMinimized: false,
    appTitle: appTitle,
    appIcon: appIcon,
    x: parseInt(windowElement.style.left),
    y: parseInt(windowElement.style.top),
    width: 600,
    height: 400,
    originalState: null,
    taskbarElement: null
  };
  
  // Create taskbar icon
  createTaskbarItem(id);
  
  // Setup Interaction
  makeWindowInteractive(id, titleBar, resizeHandle);
  
  // Set initial z-index (bring to front)
  updateZIndex(id);
  
  return id;
}

// Unified Interaction Engine (Drag & Resize via rAF)
function makeWindowInteractive(windowId, titleBar, resizeHandle) {
  const win = windows[windowId];
  const el = win.element;
  
  if (el.dataset.interactiveHooked === "true") return;
  el.dataset.interactiveHooked = "true";
  
  // State 
  let isDragging = false;
  let isResizing = false;
  let startPointerX, startPointerY;
  let startX, startY;
  let startW, startH;
  let animationFrameId = null;
  
  let currentSnapType = null; // 'maximize', 'left', 'right'
  
  // Helper to render frame
  const renderLoop = () => {
    if (isDragging) {
      el.style.left = `${win.x}px`;
      el.style.top = `${win.y}px`;
      animationFrameId = requestAnimationFrame(renderLoop);
    } else if (isResizing) {
      el.style.width = `${win.width}px`;
      el.style.height = `${win.height}px`;
      animationFrameId = requestAnimationFrame(renderLoop);
    }
  };

  // Dragging Logic
  titleBar.addEventListener("pointerdown", (e) => {
    // Ignore if clicked on controls
    if (e.target.closest('.control-btn')) return;
    
    updateZIndex(windowId);
    isDragging = true;
    titleBar.setPointerCapture(e.pointerId);
    
    // If maximized, restore and attach to cursor proportionally
    if (win.isMaximized) {
      const pointerPercent = e.clientX / window.innerWidth;
      
      // Detach and restore width implicitly
      win.isMaximized = false;
      el.classList.remove("maximized");
      
      const targetWidth = win.originalState ? win.originalState.width : 600;
      el.style.width = `${targetWidth}px`;
      
      win.x = e.clientX - (targetWidth * pointerPercent);
      win.y = 0;
      el.style.left = `${win.x}px`;
      el.style.top = `${win.y}px`;
      
      // Save state so snap assist works smoothly
      win.originalState = { width: targetWidth, height: win.originalState ? win.originalState.height : 400 };
    }
    
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    startX = win.x;
    startY = win.y;
    
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(renderLoop);
    }
  });
  
  titleBar.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPointerX;
    const deltaY = e.clientY - startPointerY;
    
    win.x = startX + deltaX;
    win.y = startY + deltaY;
    
    // Stop dragging above top edge
    if (win.y < 0) win.y = 0;
    
    // Snap Preview Logic
    currentSnapType = checkSnapZones(e.clientX, e.clientY);
  });
  
  titleBar.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    titleBar.releasePointerCapture(e.pointerId);
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    
    // Apply Snapping if applicable
    if (currentSnapType) {
      applySnap(windowId, currentSnapType);
      currentSnapType = null;
      hideSnapPreview();
    }
  });

  // Double click Title bar to maximize
  titleBar.addEventListener("dblclick", (e) => {
    if (e.target.closest('.control-btn')) return;
    maximizeWindow(windowId);
  });

  // Resizing Logic
  resizeHandle.addEventListener("pointerdown", (e) => {
    updateZIndex(windowId);
    isResizing = true;
    resizeHandle.setPointerCapture(e.pointerId);
    
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    
    startW = el.offsetWidth;
    startH = el.offsetHeight;
    
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(renderLoop);
    }
  });
  
  resizeHandle.addEventListener("pointermove", (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startPointerX;
    const deltaY = e.clientY - startPointerY;
    
    win.width = Math.max(300, startW + deltaX); // Min bounds
    win.height = Math.max(200, startH + deltaY);
  });
  
  resizeHandle.addEventListener("pointerup", (e) => {
    if (!isResizing) return;
    isResizing = false;
    resizeHandle.releasePointerCapture(e.pointerId);
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  });

  // Focus on content click
  el.addEventListener("pointerdown", () => {
    if (activeWindowId !== windowId) {
      updateZIndex(windowId);
    }
  });
}

// Snap Assist Logic
function checkSnapZones(clientX, clientY) {
  const edgeThreshold = 10;
  hideSnapPreview(); // reset
  
  if (clientY <= edgeThreshold) {
    showSnapPreview('maximize');
    return 'maximize';
  } else if (clientX <= edgeThreshold) {
    showSnapPreview('left');
    return 'left';
  } else if (clientX >= window.innerWidth - edgeThreshold) {
    showSnapPreview('right');
    return 'right';
  }
  
  return null;
}

function showSnapPreview(type) {
  snapPreview.classList.add("visible");
  const taskbarHeight = 48; // Estimate
  
  if (type === 'maximize') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '0';
    snapPreview.style.width = '100%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'left') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '0';
    snapPreview.style.width = '50%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'right') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '50%';
    snapPreview.style.width = '50%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  }
}

function hideSnapPreview() {
  snapPreview.classList.remove("visible");
}

function applySnap(windowId, type) {
  const win = windows[windowId];
  const el = win.element;
  
  // Save state before snapping
  if (!win.isMaximized) {
    win.originalState = {
      x: win.x,
      y: win.y,
      width: el.offsetWidth,
      height: el.offsetHeight
    };
  }
  
  el.classList.add("animating"); // Enable layout transitions explicitly
  
  // Force reflow to ensure transition is disabled/enabled properly
  void el.offsetWidth;
  
  if (type === 'maximize') {
    maximizeWindow(windowId, true); // true = force maximize, skipping toggle logic slightly
  } else {
    win.isMaximized = false;
    el.classList.remove("maximized");
    
    // Half screen coordinates
    const taskbarHeight = 48;
    win.y = 0;
    win.width = window.innerWidth / 2;
    win.height = window.innerHeight - taskbarHeight;
    
    if (type === 'left') {
      win.x = 0;
    } else if (type === 'right') {
      win.x = window.innerWidth / 2;
    }
    
    el.style.top = `${win.y}px`;
    el.style.left = `${win.x}px`;
    el.style.width = `${win.width}px`;
    el.style.height = `${win.height}px`;
  }
  
  // Clean up animation class after transition
  setTimeout(() => el.classList.remove("animating"), 300);
}

// Update z-index to bring window to front
function updateZIndex(windowId) {
  if (activeWindowId === windowId) return;
  activeWindowId = windowId;
  
  let maxZIndex = 1000;
  
  // Remove active class from all windows and find highest z
  Object.keys(windows).forEach(id => {
    windows[id].element.classList.remove("active");
    if (windows[id].taskbarElement) {
      windows[id].taskbarElement.classList.remove("active");
    }
    const zIndex = parseInt(window.getComputedStyle(windows[id].element).zIndex) || 0;
    if (zIndex > maxZIndex) {
      maxZIndex = zIndex;
    }
  });
  
  // Set new z-index and active class
  const el = windows[windowId].element;
  el.style.zIndex = maxZIndex + 1;
  el.classList.add("active");
  if (windows[windowId].taskbarElement) {
    windows[windowId].taskbarElement.classList.add("active");
  }
}

// Taskbar Logic
function createTaskbarItem(windowId) {
  const win = windows[windowId];
  const taskbarApps = document.getElementById("taskbarApps");
  
  if (taskbarApps) {
    const taskbarItem = document.createElement("div");
    taskbarItem.classList.add("taskbar-item", "open");
    taskbarItem.dataset.windowId = windowId;
    
    if (win.appIcon) {
      const iconImg = document.createElement("img");
      iconImg.src = win.appIcon;
      iconImg.classList.add("taskbar-icon");
      taskbarItem.appendChild(iconImg);
    }
    
    const indicator = document.createElement("div");
    indicator.classList.add("taskbar-indicator");
    taskbarItem.appendChild(indicator);
    
    taskbarItem.onclick = () => {
      if (activeWindowId === windowId && !win.isMinimized) {
        minimizeWindow(windowId);
      } else {
        if (win.isMinimized) {
          minimizeWindow(windowId); // Restores it
        } else {
          updateZIndex(windowId);
        }
      }
    };
    
    taskbarApps.appendChild(taskbarItem);
    win.taskbarElement = taskbarItem;
  }
}

// Minimize window
function minimizeWindow(windowId) {
  const win = windows[windowId];
  const el = win.element;
  
  if (win.isMinimized) {
    // Restore
    el.classList.remove("minimizing");
    el.classList.remove("hidden");
    win.isMinimized = false;
    
    updateZIndex(windowId);
  } else {
    // Minimize
    el.classList.add("minimizing");
    
    setTimeout(() => {
        el.classList.add("hidden");
    }, 200); // Wait for animation
    
    win.isMinimized = true;
    
    // Remove focus state visually from taskbar
    if (activeWindowId === windowId) {
      activeWindowId = null;
      if (win.taskbarElement) {
        win.taskbarElement.classList.remove("active");
      }
    }
  }
}

// Maximize window
function maximizeWindow(windowId, forceMaximize = false) {
  const win = windows[windowId];
  const el = win.element;
  
  el.classList.add("animating"); // Ensure smooth transition
  void el.offsetWidth; // Force layout
  
  if (win.isMaximized && !forceMaximize) {
    // Restore
    el.classList.remove("maximized");
    
    if (win.originalState) {
        win.width = win.originalState.width;
        win.height = win.originalState.height;
        win.x = win.originalState.x;
        win.y = win.originalState.y;
    }
    
    el.style.width = `${win.width}px`;
    el.style.height = `${win.height}px`;
    el.style.top = `${win.y}px`;
    el.style.left = `${win.x}px`;
    
    win.isMaximized = false;
  } else {
    // Maximize
    if (!win.isMaximized) {
      win.originalState = { x: win.x, y: win.y, width: el.offsetWidth, height: el.offsetHeight };
    }
    
    el.classList.add("maximized");
    el.style.width = ''; // Handled by CSS class important tags
    el.style.height = ''; 
    el.style.top = ''; 
    el.style.left = '';
    
    win.isMaximized = true;
  }
  
  setTimeout(() => el.classList.remove("animating"), 300);
}

// Close window
function closeWindow(windowId) {
  const el = document.getElementById(windowId);
  const win = windows[windowId];
  
  if (windowId === 'cmd') {
      // For the Terminal, we just hide it instead of destroying the DOM
      if (el) el.style.display = 'none';
      if (win && win.taskbarElement) {
          win.taskbarElement.remove();
      }
      delete windows[windowId];
      return;
  }
  
  if (win && win.taskbarElement) {
    win.taskbarElement.remove();
  }
  
  el.classList.add("closing");
  setTimeout(() => {
    el.remove();
    delete windows[windowId];
  }, 150); // Matches opactity transition time
}

// Global hook up
function initializeAppShortcuts() {
  const appShortcuts = document.querySelectorAll(".app-shortcut, .start-app");
  
  appShortcuts.forEach(shortcut => {
    shortcut.style.cursor = "pointer";
    const newShortcut = shortcut.cloneNode(true);
    shortcut.parentNode.replaceChild(newShortcut, shortcut);
    
    newShortcut.addEventListener("click", (e) => {
      e.stopPropagation();
      let appTitle = "Application";
      let appId = null;
      let appIcon = null;
      
      if (newShortcut.classList.contains("app-shortcut")) {
        const appDesktop = newShortcut.closest(".app-desktop");
        appTitle = appDesktop.dataset.title || "Application";
        appId = appDesktop.dataset.id || null;
        const iconImg = newShortcut.querySelector("img.app");
        if (iconImg) appIcon = iconImg.src;
      } else if (newShortcut.classList.contains("start-app")) {
        const appNameSpan = newShortcut.querySelector(".start-app-name");
        appTitle = appNameSpan ? appNameSpan.textContent : "Application";
        const iconImg = newShortcut.querySelector("img.app-list");
        if (iconImg) appIcon = iconImg.src;
      }
      
      if (appId === 'cmd') {
          if (typeof openTerminalWindow === 'function') openTerminalWindow();
      } else if (appTitle.toLowerCase() === 'settings' || appId === 'settings') {
          if (typeof openSettingsWindow === 'function') openSettingsWindow();
      } else {
          createWindow(appTitle, appId, appIcon);
      }
    });
    
    newShortcut.addEventListener("dblclick", (e) => e.stopPropagation());
  });
}

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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeAppShortcuts();
    initializeTaskbarApps();
  });
} else {
  initializeAppShortcuts();
  initializeTaskbarApps();
}
