let windowId = 0;
let windows = {};
let activeWindowId = null;

// Workspaces / Desktops Tracking
let desktops = [{ id: 1, name: "Desktop 1" }];
let activeDesktopId = 1;
let desktopCounter = 1;

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
  let snapHoverTimer = null;
  maximizeBtn.addEventListener("mouseenter", () => {
    snapHoverTimer = setTimeout(() => {
      showSnapLayoutMenu(id, maximizeBtn);
    }, 500);
  });
  maximizeBtn.addEventListener("mouseleave", () => {
    clearTimeout(snapHoverTimer);
  });

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

  // Trigger open animation (class-based so it fires only once on initial insert)
  requestAnimationFrame(() => {
    windowElement.classList.add('opening');
    setTimeout(() => windowElement.classList.remove('opening'), 250);
  });

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
    taskbarElement: null,
    desktopId: activeDesktopId,
    isSnapped: false
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
  let hasDetached = false;

  titleBar.addEventListener("pointerdown", (e) => {
    // Ignore if clicked on controls or tabs
    if (e.target.closest('.control-btn, .new-tab-btn, .terminal-tab, .edge-tab, .edge-tab-add')) return;

    updateZIndex(windowId);
    isDragging = true;
    hasDetached = false;
    titleBar.setPointerCapture(e.pointerId);

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
    const dist = Math.hypot(deltaX, deltaY);

    // If window was maximized or snapped, detach and restore original size upon drag movement
    if ((win.isMaximized || win.isSnapped) && !hasDetached) {
      if (dist > 3) {
        hasDetached = true;
        const currentWidth = el.offsetWidth || window.innerWidth;
        const pointerPercent = Math.max(0.1, Math.min(0.9, (startPointerX - el.offsetLeft) / currentWidth));

        win.isMaximized = false;
        win.isSnapped = false;
        el.classList.remove("maximized");

        const targetWidth = (win.originalState && win.originalState.width) ? win.originalState.width : 600;
        const targetHeight = (win.originalState && win.originalState.height) ? win.originalState.height : 400;

        win.width = targetWidth;
        win.height = targetHeight;
        el.style.width = `${targetWidth}px`;
        el.style.height = `${targetHeight}px`;

        win.x = e.clientX - (targetWidth * pointerPercent);
        win.y = Math.max(0, e.clientY - 15);
        el.style.left = `${win.x}px`;
        el.style.top = `${win.y}px`;

        startX = win.x;
        startY = win.y;
        startPointerX = e.clientX;
        startPointerY = e.clientY;
      }
      return;
    }

    win.x = startX + deltaX;
    win.y = startY + deltaY;

    // Stop dragging above top edge
    if (win.y < 0) win.y = 0;

    // Windows 11 style top snap menu logic
    let newSnapType = null;
    let overSnapMenuRegion = false;
    const menu = document.getElementById("snapLayoutMenu");
    
    let isOverMenu = false;
    if (menu && menu.dataset.visibleTop === "true") {
      const rect = menu.getBoundingClientRect();
      if (e.clientX >= rect.left - 20 && e.clientX <= rect.right + 20 &&
          e.clientY >= 0 && e.clientY <= rect.bottom + 20) {
        isOverMenu = true;
      }
    }

    if (e.clientY <= 20 || isOverMenu) {
      if (menu && !menu.dataset.visibleTop) {
        menu.classList.add("visible");
        menu.dataset.visibleTop = "true";
        menu.style.top = '10px';
        menu.style.left = '50%';
        menu.style.transform = 'translateX(-50%)';
      }
      
      const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);
      const menuEl = elementsUnderCursor.find(el => el.id === 'snapLayoutMenu');
      const snapGrid = elementsUnderCursor.find(el => el.classList.contains('snap-grid'));
      const snapRegion = elementsUnderCursor.find(el => el.classList.contains('snap-region'));
      
      document.querySelectorAll('.snap-region').forEach(r => r.classList.remove('hovered'));
      document.querySelectorAll('.snap-grid').forEach(g => g.classList.remove('hovered'));
      
      if (snapGrid) {
        snapGrid.classList.add('hovered');
        overSnapMenuRegion = true;
      }

      if (snapRegion) {
        snapRegion.classList.add('hovered');
        newSnapType = snapRegion.dataset.snap;
        overSnapMenuRegion = true;
      } else if (menuEl) {
        overSnapMenuRegion = true;
      }
    } else {
      if (menu && menu.dataset.visibleTop) {
        menu.classList.remove("visible");
        delete menu.dataset.visibleTop;
        menu.style.transform = '';
        menu.style.left = '';
        menu.style.top = '';
        document.querySelectorAll('.snap-region').forEach(r => r.classList.remove('hovered'));
        document.querySelectorAll('.snap-grid').forEach(g => g.classList.remove('hovered'));
      }
    }

    if (!overSnapMenuRegion) {
      newSnapType = checkSnapZones(e.clientX, e.clientY);
    } else {
      if (newSnapType) {
        showSnapPreview(newSnapType);
      } else {
        hideSnapPreview();
      }
    }
    
    currentSnapType = newSnapType;
  });

  titleBar.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    titleBar.releasePointerCapture(e.pointerId);
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;

    const menu = document.getElementById("snapLayoutMenu");
    if (menu && menu.dataset.visibleTop) {
      menu.classList.remove("visible");
      delete menu.dataset.visibleTop;
      menu.style.transform = '';
      menu.style.left = '';
      menu.style.top = '';
      document.querySelectorAll('.snap-region').forEach(r => r.classList.remove('hovered'));
      document.querySelectorAll('.snap-grid').forEach(g => g.classList.remove('hovered'));
    }

    // Apply Snapping if applicable
    if (currentSnapType) {
      applySnap(windowId, currentSnapType);
      const snappedType = currentSnapType;
      currentSnapType = null;
      hideSnapPreview();
      
      if (snappedType !== 'maximize') {
        setTimeout(() => showSnapAssist(snappedType), 300);
      }
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

    if (!win.isMaximized && !win.isSnapped) {
      win.originalState = {
        x: win.x,
        y: win.y,
        width: win.width,
        height: win.height
      };
    }
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
  } else if (type === 'left' || type === 'left-half') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '0';
    snapPreview.style.width = '50%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'right' || type === 'right-half') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '50%';
    snapPreview.style.width = '50%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'left-large') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '0';
    snapPreview.style.width = '60%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'right-small') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '60%';
    snapPreview.style.width = '40%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'left-third') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '0';
    snapPreview.style.width = '33.33%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'mid-third') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '33.33%';
    snapPreview.style.width = '33.33%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'right-third') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '66.66%';
    snapPreview.style.width = '33.33%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'top-left-quarter') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '0';
    snapPreview.style.width = '50%';
    snapPreview.style.height = `calc(50% - ${taskbarHeight / 2}px)`;
  } else if (type === 'top-right-quarter') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '50%';
    snapPreview.style.width = '50%';
    snapPreview.style.height = `calc(50% - ${taskbarHeight / 2}px)`;
  } else if (type === 'bottom-left-quarter') {
    snapPreview.style.top = `calc(50% - ${taskbarHeight / 2}px)`;
    snapPreview.style.left = '0';
    snapPreview.style.width = '50%';
    snapPreview.style.height = `calc(50% - ${taskbarHeight / 2}px)`;
  } else if (type === 'bottom-right-quarter') {
    snapPreview.style.top = `calc(50% - ${taskbarHeight / 2}px)`;
    snapPreview.style.left = '50%';
    snapPreview.style.width = '50%';
    snapPreview.style.height = `calc(50% - ${taskbarHeight / 2}px)`;
  } else if (type === 'left-quarter') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '0';
    snapPreview.style.width = '25%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'mid-half') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '25%';
    snapPreview.style.width = '50%';
    snapPreview.style.height = `calc(100% - ${taskbarHeight}px)`;
  } else if (type === 'right-quarter') {
    snapPreview.style.top = '0';
    snapPreview.style.left = '75%';
    snapPreview.style.width = '25%';
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
  if (!win.isMaximized && !win.isSnapped) {
    win.originalState = {
      x: win.x,
      y: win.y,
      width: win.width || el.offsetWidth || 600,
      height: win.height || el.offsetHeight || 400
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

    // Handle all snap regions
    const taskbarHeight = 48;
    win.y = 0;

    if (type === 'left' || type === 'left-half') {
      win.x = 0;
      win.width = window.innerWidth / 2;
      win.height = window.innerHeight - taskbarHeight;
    } else if (type === 'right' || type === 'right-half') {
      win.x = window.innerWidth / 2;
      win.width = window.innerWidth / 2;
      win.height = window.innerHeight - taskbarHeight;
    } else if (type === 'left-large') {
      win.x = 0;
      win.width = window.innerWidth * 0.6;
      win.height = window.innerHeight - taskbarHeight;
    } else if (type === 'right-small') {
      win.x = window.innerWidth * 0.6;
      win.width = window.innerWidth * 0.4;
      win.height = window.innerHeight - taskbarHeight;
    } else if (type === 'left-third') {
      win.x = 0;
      win.width = window.innerWidth / 3;
      win.height = window.innerHeight - taskbarHeight;
    } else if (type === 'mid-third') {
      win.x = window.innerWidth / 3;
      win.width = window.innerWidth / 3;
      win.height = window.innerHeight - taskbarHeight;
    } else if (type === 'right-third') {
      win.x = (window.innerWidth / 3) * 2;
      win.width = window.innerWidth / 3;
      win.height = window.innerHeight - taskbarHeight;
    } else if (type === 'top-left-quarter') {
      win.x = 0;
      win.y = 0;
      win.width = window.innerWidth / 2;
      win.height = (window.innerHeight - taskbarHeight) / 2;
    } else if (type === 'top-right-quarter') {
      win.x = window.innerWidth / 2;
      win.y = 0;
      win.width = window.innerWidth / 2;
      win.height = (window.innerHeight - taskbarHeight) / 2;
    } else if (type === 'bottom-left-quarter') {
      win.x = 0;
      win.y = (window.innerHeight - taskbarHeight) / 2;
      win.width = window.innerWidth / 2;
      win.height = (window.innerHeight - taskbarHeight) / 2;
    } else if (type === 'bottom-right-quarter') {
      win.x = window.innerWidth / 2;
      win.y = (window.innerHeight - taskbarHeight) / 2;
      win.width = window.innerWidth / 2;
      win.height = (window.innerHeight - taskbarHeight) / 2;
    } else if (type === 'left-quarter') {
      win.x = 0;
      win.width = window.innerWidth / 4;
      win.height = window.innerHeight - taskbarHeight;
    } else if (type === 'mid-half') {
      win.x = window.innerWidth / 4;
      win.width = window.innerWidth / 2;
      win.height = window.innerHeight - taskbarHeight;
    } else if (type === 'right-quarter') {
      win.x = (window.innerWidth / 4) * 3;
      win.width = window.innerWidth / 4;
      win.height = window.innerHeight - taskbarHeight;
    }

    el.style.top = `${win.y}px`;
    el.style.left = `${win.x}px`;
    el.style.width = `${win.width}px`;
    el.style.height = `${win.height}px`;
    
    win.isSnapped = type;
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

// Workspace Logic
function switchDesktop(id) {
  if (activeDesktopId === id) return;
  activeDesktopId = id;

  Object.keys(windows).forEach(winId => {
    const win = windows[winId];
    if (win.desktopId !== activeDesktopId) {
      win.element.style.display = 'none';
      if (win.taskbarElement) win.taskbarElement.style.display = 'none';
    } else {
      if (!win.isMinimized) {
        win.element.style.display = 'flex';
      }
      if (win.taskbarElement) win.taskbarElement.style.display = 'flex';
    }
  });
}

function addDesktop() {
  desktopCounter++;
  const newDesktop = { id: desktopCounter, name: `Desktop ${desktops.length + 1}` };
  desktops.push(newDesktop);
  renderTaskViewDesktops();
}

// Taskbar Logic
let taskbarRegistry = {}; // mapping appId -> { element: DOM, windows: [id1, id2], isPinned: true/false }

let previewHoverTimeout = null;
let previewHideTimeout = null;
let previewLiveSyncTimer = null;
let tooltipTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("taskbarPreviewMenu");
  if (menu) {
    menu.addEventListener("mouseenter", () => clearTimeout(previewHideTimeout));
    menu.addEventListener("mouseleave", () => hideTaskbarPreview());
  }
  setupTaskbarTooltips();

  // Dismiss tooltips and previews when clicking anywhere outside
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("#taskbarPreviewMenu") && !e.target.closest(".taskbar-item") && !e.target.closest(".taskbar-app") && !e.target.closest(".search-taskbar-btn") && !e.target.closest(".quick-settings-btn") && !e.target.closest(".tray") && !e.target.closest(".date-times")) {
      hideTaskbarPreview(true);
      hideTaskbarTooltip(true);
    }
  });
});

function getAppDisplayName(appId, appTitle, element) {
  if (appTitle && appTitle !== "Application" && appTitle !== "Window") return appTitle;
  if (element) {
    if (element.dataset && element.dataset.appTitle) return element.dataset.appTitle;
    const img = element.querySelector("img");
    if (img && img.alt && img.alt !== "Application") return img.alt;
  }
  const knownTitles = {
    "explorer": "File Explorer",
    "edge": "Microsoft Edge",
    "cmd": "Windows Terminal",
    "terminal": "Windows Terminal",
    "taskmgr": "Task Manager",
    "taskManager": "Task Manager",
    "settings": "Settings",
    "recycle-bin": "Recycle Bin",
    "notepad": "Notepad",
    "store": "Microsoft Store",
    "vscode": "Visual Studio Code"
  };
  if (knownTitles[appId]) return knownTitles[appId];
  return appId ? appId.charAt(0).toUpperCase() + appId.slice(1).replace(/-/g, " ") : "Application";
}

function showTaskbarTooltip(targetEl, text) {
  const previewMenu = document.getElementById("taskbarPreviewMenu");
  if (previewMenu && previewMenu.classList.contains("visible")) return;

  let tooltip = document.getElementById("taskbarTooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "taskbarTooltip";
    tooltip.className = "taskbar-tooltip";
    document.body.appendChild(tooltip);
  }

  tooltip.textContent = text;

  const rect = targetEl.getBoundingClientRect();
  const centerX = rect.left + (rect.width / 2);

  const halfWidth = (tooltip.offsetWidth || 70) / 2;
  const padding = 8;
  let clampedX = centerX;
  if (clampedX - halfWidth < padding) clampedX = halfWidth + padding;
  else if (clampedX + halfWidth > window.innerWidth - padding) clampedX = window.innerWidth - padding - halfWidth;

  tooltip.style.left = `${clampedX}px`;
  tooltip.classList.add("visible");
}

function hideTaskbarTooltip(instant = false) {
  clearTimeout(tooltipTimeout);
  tooltipTimeout = null;
  const tooltip = document.getElementById("taskbarTooltip");
  if (tooltip) {
    tooltip.classList.remove("visible");
  }
}

function renderLiveWindowPreview(win, container) {
  container.innerHTML = "";
  const origEl = win.element;
  if (!origEl) return;

  const viewport = document.createElement("div");
  viewport.className = "tv-card-preview-viewport";

  const scaleWrapper = document.createElement("div");
  scaleWrapper.className = "tv-card-preview-scaler";

  // Deep clone the window element
  const clone = origEl.cloneNode(true);

  // Strip IDs to avoid collision with live DOM
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));

  // Strip transitional & hiding classes
  clone.classList.remove("hidden", "minimizing", "opening", "closing", "animating");

  // Enforce preview styles
  clone.style.position = "absolute";
  clone.style.top = "0";
  clone.style.left = "0";
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.display = "flex";
  clone.style.flexDirection = "column";
  clone.style.visibility = "visible";
  clone.style.opacity = "1";
  clone.style.pointerEvents = "none";
  clone.style.userSelect = "none";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "6px";
  clone.style.overflow = "hidden";

  // Compute dimensions accurately, handling maximized and minimized windows
  let origW = origEl.offsetWidth;
  let origH = origEl.offsetHeight;

  if (win.isMaximized) {
    origW = window.innerWidth;
    origH = window.innerHeight - 48;
  } else {
    if (!origW || origW < 100) origW = win.width || (win.originalState && win.originalState.width) || 800;
    if (!origH || origH < 80) origH = win.height || (win.originalState && win.originalState.height) || 500;
  }

  clone.style.width = origW + "px";
  clone.style.height = origH + "px";

  // Copy input values
  const origInputs = origEl.querySelectorAll("input, textarea, select");
  const cloneInputs = clone.querySelectorAll("input, textarea, select");
  for (let i = 0; i < origInputs.length; i++) {
    if (cloneInputs[i]) {
      cloneInputs[i].value = origInputs[i].value;
      if (origInputs[i].checked !== undefined) {
        cloneInputs[i].checked = origInputs[i].checked;
      }
    }
  }

  // Copy Canvas bitmap buffers (live Task Manager CPU/Memory/GPU charts)
  const origCanvases = origEl.querySelectorAll("canvas");
  const cloneCanvases = clone.querySelectorAll("canvas");
  for (let i = 0; i < origCanvases.length; i++) {
    const src = origCanvases[i];
    const dst = cloneCanvases[i];
    if (src && dst && src.width > 0 && src.height > 0) {
      dst.width = src.width;
      dst.height = src.height;
      const ctx = dst.getContext("2d");
      if (ctx) {
        try {
          ctx.drawImage(src, 0, 0);
        } catch (e) {}
      }
    }
  }

  // Copy scroll positions
  const origScrolls = origEl.querySelectorAll("*");
  const cloneScrolls = clone.querySelectorAll("*");
  for (let i = 0; i < origScrolls.length; i++) {
    if (cloneScrolls[i]) {
      if (origScrolls[i].scrollTop > 0) cloneScrolls[i].scrollTop = origScrolls[i].scrollTop;
      if (origScrolls[i].scrollLeft > 0) cloneScrolls[i].scrollLeft = origScrolls[i].scrollLeft;
    }
  }

  // Scaling calculation
  const viewW = container.clientWidth || 206;
  const viewH = container.clientHeight || 116;
  const scale = Math.min(viewW / origW, viewH / origH);
  const scaledW = origW * scale;
  const scaledH = origH * scale;
  const offsetX = Math.max(0, (viewW - scaledW) / 2);
  const offsetY = Math.max(0, (viewH - scaledH) / 2);

  scaleWrapper.style.width = origW + "px";
  scaleWrapper.style.height = origH + "px";
  scaleWrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  scaleWrapper.style.transformOrigin = "top left";

  scaleWrapper.appendChild(clone);
  viewport.appendChild(scaleWrapper);
  container.appendChild(viewport);
}

function syncLivePreviews() {
  const menu = document.getElementById("taskbarPreviewMenu");
  if (!menu || !menu.classList.contains("visible")) {
    if (previewLiveSyncTimer) {
      clearInterval(previewLiveSyncTimer);
      previewLiveSyncTimer = null;
    }
    return;
  }

  const cards = menu.querySelectorAll(".tv-card");
  if (cards.length === 0) {
    hideTaskbarPreview(true);
    return;
  }

  cards.forEach(card => {
    const windowId = card.dataset.windowId;
    const win = windows[windowId];
    if (!win || !win.element) return;

    // Update title text if changed
    const titleEl = card.querySelector(".tv-card-title");
    let currentTitle = win.appTitle || "Window";
    if (windowId === "cmd" && win.element) {
      const activeTab = win.element.querySelector(".terminal-tab.active span");
      if (activeTab && activeTab.textContent) currentTitle = activeTab.textContent;
    }
    if (titleEl && titleEl.textContent !== currentTitle) {
      titleEl.textContent = currentTitle;
    }

    // Sync live canvas contents
    const origCanvases = win.element.querySelectorAll("canvas");
    const cloneCanvases = card.querySelectorAll("canvas");
    if (origCanvases.length > 0 && origCanvases.length === cloneCanvases.length) {
      for (let i = 0; i < origCanvases.length; i++) {
        const src = origCanvases[i];
        const dst = cloneCanvases[i];
        if (src && dst && src.width > 0 && src.height > 0) {
          if (dst.width !== src.width) dst.width = src.width;
          if (dst.height !== src.height) dst.height = src.height;
          const ctx = dst.getContext("2d");
          if (ctx) {
            try {
              ctx.clearRect(0, 0, dst.width, dst.height);
              ctx.drawImage(src, 0, 0);
            } catch (e) {}
          }
        }
      }
    }

    // Sync input and textarea values
    const origInputs = win.element.querySelectorAll("input, textarea, select");
    const cloneInputs = card.querySelectorAll("input, textarea, select");
    for (let i = 0; i < origInputs.length; i++) {
      if (cloneInputs[i] && cloneInputs[i].value !== origInputs[i].value) {
        cloneInputs[i].value = origInputs[i].value;
      }
    }

    // Sync Terminal content
    if (windowId === "cmd") {
      const origBody = win.element.querySelector(".terminal-body");
      const cloneBody = card.querySelector(".terminal-body");
      if (origBody && cloneBody && origBody.innerHTML !== cloneBody.innerHTML) {
        cloneBody.innerHTML = origBody.innerHTML;
      }
    }

    // Sync Task Manager live numbers / process rows
    if (windowId === "taskManager") {
      const origProcesses = win.element.querySelector("#tmProcessTableBody");
      const cloneProcesses = card.querySelector("#tmProcessTableBody");
      if (origProcesses && cloneProcesses && origProcesses.innerHTML !== cloneProcesses.innerHTML) {
        cloneProcesses.innerHTML = origProcesses.innerHTML;
      }
      const origCpuSummary = win.element.querySelector("#tmCpuUsageVal");
      const cloneCpuSummary = card.querySelector("#tmCpuUsageVal");
      if (origCpuSummary && cloneCpuSummary && origCpuSummary.textContent !== cloneCpuSummary.textContent) {
        cloneCpuSummary.textContent = origCpuSummary.textContent;
      }
    }
  });
}

function positionTaskbarPreview(taskbarElement) {
  const menu = document.getElementById("taskbarPreviewMenu");
  if (!menu || !taskbarElement) return;

  const rect = taskbarElement.getBoundingClientRect();
  const taskbarCenter = rect.left + (rect.width / 2);

  const menuWidth = menu.offsetWidth || (menu.children.length * 228 + 16);
  const halfWidth = menuWidth / 2;
  const padding = 10;

  let leftPos = taskbarCenter;
  if (leftPos - halfWidth < padding) {
    leftPos = halfWidth + padding;
  } else if (leftPos + halfWidth > window.innerWidth - padding) {
    leftPos = window.innerWidth - padding - halfWidth;
  }

  menu.style.left = `${leftPos}px`;
}

function showTaskbarPreview(appId, taskbarElement) {
  const reg = taskbarRegistry[appId];
  if (!reg || !reg.windows || reg.windows.length === 0) {
    hideTaskbarPreview(true);
    return;
  }

  hideTaskbarTooltip(true);

  const menu = document.getElementById("taskbarPreviewMenu");
  if (!menu) return;

  clearTimeout(previewHideTimeout);
  menu.innerHTML = "";

  reg.windows.forEach(windowId => {
    const win = windows[windowId];
    if (!win) return;

    const card = document.createElement("div");
    card.className = "tv-card";
    card.dataset.windowId = windowId;

    // Header
    const header = document.createElement("div");
    header.className = "tv-card-header";

    const titleContainer = document.createElement("div");
    titleContainer.className = "tv-card-title-container";

    if (win.appIcon) {
      const icon = document.createElement("img");
      icon.src = win.appIcon;
      icon.className = "tv-card-icon";
      titleContainer.appendChild(icon);
    }

    let currentTitle = win.appTitle || "Window";
    if (windowId === "cmd" && win.element) {
      const activeTab = win.element.querySelector(".terminal-tab.active span");
      if (activeTab && activeTab.textContent) currentTitle = activeTab.textContent;
    }

    const title = document.createElement("div");
    title.className = "tv-card-title";
    title.textContent = currentTitle;
    titleContainer.appendChild(title);

    const closeBtn = document.createElement("div");
    closeBtn.className = "tv-card-close";
    closeBtn.textContent = "×";
    closeBtn.title = "Close";
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeWindow(windowId);
      card.remove();
      if (menu.children.length === 0) {
        hideTaskbarPreview(true);
      } else {
        positionTaskbarPreview(taskbarElement);
      }
    };

    header.appendChild(titleContainer);
    header.appendChild(closeBtn);

    // Realtime window preview block
    const previewBox = document.createElement("div");
    previewBox.className = "tv-card-preview";
    renderLiveWindowPreview(win, previewBox);

    card.appendChild(header);
    card.appendChild(previewBox);

    card.onclick = (e) => {
      e.stopPropagation();
      if (win.isMinimized) minimizeWindow(windowId);
      updateZIndex(windowId);
      hideTaskbarPreview(true);
    };

    menu.appendChild(card);
  });

  positionTaskbarPreview(taskbarElement);
  menu.classList.add("visible");

  // Re-adjust positioning once rendered
  requestAnimationFrame(() => positionTaskbarPreview(taskbarElement));

  if (!previewLiveSyncTimer) {
    previewLiveSyncTimer = setInterval(syncLivePreviews, 60);
  }
}

function hideTaskbarPreview(instant = false) {
  const menu = document.getElementById("taskbarPreviewMenu");
  if (!menu) return;
  if (previewLiveSyncTimer) {
    clearInterval(previewLiveSyncTimer);
    previewLiveSyncTimer = null;
  }
  if (instant) {
    clearTimeout(previewHideTimeout);
    menu.classList.remove("visible");
  } else {
    clearTimeout(previewHideTimeout);
    previewHideTimeout = setTimeout(() => {
      menu.classList.remove("visible");
    }, 150);
  }
}

function attachTaskbarItemHover(taskbarItem, appId, appTitleGetter) {
  taskbarItem.addEventListener("mouseenter", () => {
    clearTimeout(previewHideTimeout);
    clearTimeout(previewHoverTimeout);
    clearTimeout(tooltipTimeout);

    const reg = taskbarRegistry[appId];
    const hasOpenWindows = reg && reg.windows && reg.windows.length > 0;

    const isAnyActive =
      (document.getElementById("taskbarTooltip") && document.getElementById("taskbarTooltip").classList.contains("visible")) ||
      (document.getElementById("taskbarPreviewMenu") && document.getElementById("taskbarPreviewMenu").classList.contains("visible"));

    const delay = isAnyActive ? 40 : 260;

    if (hasOpenWindows) {
      hideTaskbarTooltip(true);
      previewHoverTimeout = setTimeout(() => {
        showTaskbarPreview(appId, taskbarItem);
      }, delay);
    } else {
      hideTaskbarPreview(true);
      tooltipTimeout = setTimeout(() => {
        const rawTitle = typeof appTitleGetter === "function" ? appTitleGetter() : appTitleGetter;
        const title = getAppDisplayName(appId, rawTitle, taskbarItem);
        showTaskbarTooltip(taskbarItem, title);
      }, delay);
    }
  });

  taskbarItem.addEventListener("mouseleave", () => {
    clearTimeout(previewHoverTimeout);
    clearTimeout(tooltipTimeout);
    hideTaskbarPreview();
    hideTaskbarTooltip();
  });

  taskbarItem.addEventListener("click", () => {
    hideTaskbarTooltip(true);
  });
}

function setupTaskbarTooltips() {
  const items = [
    { selector: "#startLogo", text: "Start" },
    { selector: "#searchBtn", text: "Search" },
    { selector: "#taskViewBtn", text: "Task View" },
    { selector: "#widgetsIcon", text: "Widgets" },
    { selector: "#trayBtn", text: "Show hidden icons" },
    { selector: "#quickSettingsBtn", text: "Internet, sound, battery" },
    { selector: ".language", text: "English (United States)\nUS keyboard" },
    {
      selector: "#dateTimes",
      text: () => {
        const d = new Date();
        return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      }
    }
  ];

  items.forEach(({ selector, text }) => {
    const el = document.querySelector(selector);
    if (!el || el.dataset.tooltipAttached === "true") return;
    el.dataset.tooltipAttached = "true";

    el.addEventListener("mouseenter", () => {
      if (selector === "#startLogo") {
        const startMenu = document.getElementById("startMenu");
        if (startMenu && startMenu.classList.contains("menu-open")) return;
      }
      if (selector === "#searchBtn") {
        const searchMenu = document.getElementById("searchMenu");
        if (searchMenu && searchMenu.classList.contains("menu-open")) return;
      }
      if (selector === "#quickSettingsBtn") {
        const quickSettings = document.getElementById("quickSettings");
        if (quickSettings && quickSettings.style.display === "block") return;
      }
      if (selector === "#widgetsIcon") {
        const widgetsMenu = document.getElementById("widgetsMenu");
        if (widgetsMenu && widgetsMenu.style.display === "block") return;
      }

      clearTimeout(tooltipTimeout);
      const isAnyActive =
        (document.getElementById("taskbarTooltip") && document.getElementById("taskbarTooltip").classList.contains("visible")) ||
        (document.getElementById("taskbarPreviewMenu") && document.getElementById("taskbarPreviewMenu").classList.contains("visible"));

      const delay = isAnyActive ? 40 : 260;
      tooltipTimeout = setTimeout(() => {
        hideTaskbarPreview(true);
        const str = typeof text === "function" ? text() : text;
        showTaskbarTooltip(el, str);
      }, delay);
    });

    el.addEventListener("mouseleave", () => {
      clearTimeout(tooltipTimeout);
      hideTaskbarTooltip();
    });

    el.addEventListener("click", () => {
      hideTaskbarTooltip(true);
    });
  });
}

function detachTaskbarItem(windowId, win) {
  if (win && win.appId && taskbarRegistry[win.appId]) {
    const reg = taskbarRegistry[win.appId];
    reg.windows = reg.windows.filter(id => id !== windowId);
    
    if (reg.windows.length === 0) {
      reg.element.classList.remove("open", "stacked", "active");
      if (!reg.isPinned) {
        reg.element.remove();
        delete taskbarRegistry[win.appId];
      }
      hideTaskbarPreview(true);
    } else {
      if (reg.windows.length === 1) reg.element.classList.remove("stacked");
      if (activeWindowId === windowId) {
        updateZIndex(reg.windows[0]);
      }
      // Update preview if it's currently showing this app
      const menu = document.getElementById("taskbarPreviewMenu");
      if (menu && menu.classList.contains("visible")) {
        showTaskbarPreview(win.appId, reg.element);
      }
    }
  }
}

function handleTaskbarClick(appId, appTitle, appIcon) {
  const reg = taskbarRegistry[appId];
  if (!reg || reg.windows.length === 0) {
    if (appId === 'cmd') {
      if (typeof openTerminalWindow === 'function') openTerminalWindow();
    } else if (appId === 'taskmgr' || appId === 'taskManager') {
      if (typeof openTaskManagerWindow === 'function') openTaskManagerWindow();
    } else if (appId === 'settings') {
      if (typeof openSettingsWindow === 'function') openSettingsWindow();
    } else {
      createWindow(appTitle, appId, appIcon);
    }
  } else if (reg.windows.length === 1) {
    const windowId = reg.windows[0];
    const win = windows[windowId];
    if (activeWindowId === windowId && !win.isMinimized) {
      minimizeWindow(windowId);
    } else {
      if (win.isMinimized) minimizeWindow(windowId); // restores
      else updateZIndex(windowId);
    }
  } else {
    // Show thumbnail preview instantly instead of cycling
    const menu = document.getElementById("taskbarPreviewMenu");
    if (menu && menu.classList.contains("visible")) {
      hideTaskbarPreview(true);
    } else {
      showTaskbarPreview(appId, reg.element);
    }
  }
}

function createTaskbarItem(windowId) {
  const win = windows[windowId];
  const taskbarApps = document.getElementById("taskbarApps");
  
  let appId = win.element && win.element.dataset.appId && win.element.dataset.appId !== "null" 
    ? win.element.dataset.appId 
    : win.appTitle.toLowerCase().replace(/\s+/g, '-');
  if (windowId === 'edge') appId = 'edge';
  if (windowId === 'cmd') appId = 'cmd';
  if (windowId === 'taskManager') appId = 'taskmgr';
  if (windowId === 'settings') appId = 'settings';
  
  win.appId = appId;
  if (win.element) win.element.dataset.appId = appId;

  if (!taskbarRegistry[appId]) {
    const taskbarItem = document.createElement("div");
    taskbarItem.classList.add("taskbar-item");
    taskbarItem.setAttribute("draggable", "true");
    taskbarItem.dataset.appId = appId;

    if (win.appIcon) {
      const iconImg = document.createElement("img");
      iconImg.src = win.appIcon;
      iconImg.classList.add("taskbar-icon");
      taskbarItem.appendChild(iconImg);
    }

    const indicator = document.createElement("div");
    indicator.classList.add("taskbar-indicator");
    taskbarItem.appendChild(indicator);

    taskbarItem.onclick = (e) => {
      e.stopPropagation();
      handleTaskbarClick(appId, win.appTitle, win.appIcon);
    };

    setupTaskbarContextMenu(taskbarItem, appId, win.appTitle, win.appIcon);
    attachTaskbarItemHover(taskbarItem, appId, () => win.appTitle);

    if (taskbarApps) taskbarApps.appendChild(taskbarItem);
    
    taskbarRegistry[appId] = {
      element: taskbarItem,
      windows: [],
      isPinned: false
    };
  }

  const reg = taskbarRegistry[appId];
  if (!reg.windows.includes(windowId)) {
    reg.windows.push(windowId);
  }
  win.taskbarElement = reg.element;

  reg.element.classList.add("open");
  if (reg.windows.length > 1) {
    reg.element.classList.add("stacked");
  } else {
    reg.element.classList.remove("stacked");
  }
}

function minimizeWindow(windowId) {
  const win = windows[windowId];
  const el = win.element;

  if (win.isMinimized) {
    // Restore: snap back to visible
    el.classList.remove('minimizing', 'hidden');
    // Force a repaint so the removal registers before transition kicks in
    void el.offsetWidth;
    win.isMinimized = false;
    updateZIndex(windowId);
  } else {
    // Minimize: animate out then hide
    el.classList.add('minimizing');

    setTimeout(() => {
      el.classList.add('hidden');
      el.classList.remove('minimizing');
    }, 200);

    win.isMinimized = true;

    if (activeWindowId === windowId) {
      activeWindowId = null;
      if (win.taskbarElement) win.taskbarElement.classList.remove('active');
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
    win.isSnapped = false;
  } else {
    // Maximize
    if (!win.isMaximized && !win.isSnapped) {
      win.originalState = {
        x: win.x,
        y: win.y,
        width: win.width || el.offsetWidth || 600,
        height: win.height || el.offsetHeight || 400
      };
    }

    el.classList.add("maximized");
    el.style.width = ''; // Handled by CSS class important tags
    el.style.height = '';
    el.style.top = '';
    el.style.left = '';

    win.isMaximized = true;
    win.isSnapped = false;
  }

  setTimeout(() => el.classList.remove("animating"), 300);
}

// Close window
function closeWindow(windowId) {
  const el = document.getElementById(windowId);
  const win = windows[windowId];

  if (windowId === 'cmd') {
    // For the Terminal, we animate close then hide (don't destroy DOM)
    detachTaskbarItem(windowId, win);
    if (win) win.taskbarElement = null;
    if (activeWindowId === 'cmd') activeWindowId = null;
    if (el) {
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
      void el.offsetWidth;
      el.classList.add('closing');
      setTimeout(() => {
        el.classList.remove('closing');
        el.style.setProperty('display', 'none', 'important');
        if (win) win.isMinimized = false;
        delete windows[windowId];
      }, 200);
    } else {
      delete windows[windowId];
    }
    return;
  }

  if (windowId === 'taskManager') {
    if (typeof closeTaskManagerWindow === 'function') {
      closeTaskManagerWindow();
    } else {
      detachTaskbarItem(windowId, win);
      if (win) win.taskbarElement = null;
      if (activeWindowId === 'taskManager') activeWindowId = null;
      const tm = document.getElementById("taskManagerWindow");
      if (tm) {
        tm.classList.remove('tm-visible');
        if (win) win.isMinimized = false;
        delete windows['taskManager'];
      }
    }
    return;
  }

  if (windowId === 'settings') {
    if (typeof closeSettingsWindow === 'function') {
      closeSettingsWindow();
    }
    return;
  }

  detachTaskbarItem(windowId, win);
  if (win) win.taskbarElement = null;

  // Stamp the current rendered values explicitly so the CSS transition
  // has a concrete starting point (animation-held values don't count).
  if (el) {
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
    // Force a reflow so the browser registers the above values before
    // we switch to the closing state.
    void el.offsetWidth;

    el.classList.add("closing");
    setTimeout(() => {
      el.remove();
      delete windows[windowId];
    }, 200); // matches 0.18 s CSS transition with a small buffer
  } else {
    delete windows[windowId];
  }
}

// Global hook up
function initializeAppShortcuts() {
  const startApps = document.querySelectorAll(".start-app");

  startApps.forEach(startApp => {
    startApp.style.cursor = "pointer";
    const newStartApp = startApp.cloneNode(true);
    startApp.parentNode.replaceChild(newStartApp, startApp);

    newStartApp.setAttribute("draggable", "true");
    newStartApp.addEventListener("dragstart", (e) => {
      const appNameSpan = newStartApp.querySelector(".start-app-name");
      const appTitle = appNameSpan ? appNameSpan.textContent : "Application";
      let appId = appTitle.toLowerCase().replace(/\s+/g, '-');
      if (appTitle.toLowerCase() === 'microsoft edge' || appTitle.toLowerCase() === 'edge') appId = 'edge';
      if (appTitle.toLowerCase() === 'command prompt' || appTitle.toLowerCase() === 'terminal') appId = 'cmd';
      const iconImg = newStartApp.querySelector("img.app-list");
      const appIcon = iconImg ? iconImg.src : "";

      e.dataTransfer.setData("text/plain", JSON.stringify({
        appId, appTitle, appIcon
      }));
      e.dataTransfer.effectAllowed = "copy";
    });

    newStartApp.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const menusToHide = ["contextMenu", "appContextMenu", "taskbarContextMenu", "recycleBinMenu", "quickLink"];
      menusToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
      });

      const menu = document.getElementById("startAppContextMenu");
      if (!menu) return;

      const appNameSpan = newStartApp.querySelector(".start-app-name");
      const appTitle = appNameSpan ? appNameSpan.textContent : "Application";
      let appId = appTitle.toLowerCase().replace(/\s+/g, '-');
      if (appTitle.toLowerCase() === 'microsoft edge' || appTitle.toLowerCase() === 'edge') appId = 'edge';
      if (appTitle.toLowerCase() === 'command prompt' || appTitle.toLowerCase() === 'terminal') appId = 'cmd';
      const iconImg = newStartApp.querySelector("img.app-list");
      const appIcon = iconImg ? iconImg.src : "";

      menu.dataset.targetId = appId;
      menu.dataset.targetTitle = appTitle;
      menu.dataset.targetIcon = appIcon;

      const isPinned = taskbarRegistry[appId] && taskbarRegistry[appId].isPinned;
      const pinTextEl = document.getElementById("startAppPinText");
      const pinIconEl = document.getElementById("startAppPinIcon");
      if (pinTextEl) pinTextEl.textContent = isPinned ? "Unpin from taskbar" : "Pin to taskbar";
      if (pinIconEl) pinIconEl.innerHTML = isPinned ? "&#xe77a;" : "&#xe840;";

      menu.style.display = "block";
      menu.style.left = e.pageX + "px";
      menu.style.top = e.pageY + "px";
    });

    newStartApp.addEventListener("click", (e) => {
      e.stopPropagation();
      
      const startMenu = document.getElementById("startMenu");
      if (startMenu && startMenu.classList.contains("menu-open")) {
        startMenu.classList.remove("menu-open");
      }
      
      const appNameSpan = newStartApp.querySelector(".start-app-name");
      const appTitle = appNameSpan ? appNameSpan.textContent : "Application";
      const iconImg = newStartApp.querySelector("img.app-list");
      const appIcon = iconImg ? iconImg.src : "";
      let appId = appTitle.toLowerCase().replace(/\s+/g, '-');
      if (appTitle.toLowerCase() === 'microsoft edge' || appTitle.toLowerCase() === 'edge') appId = 'edge';
      if (appTitle.toLowerCase() === 'command prompt' || appTitle.toLowerCase() === 'terminal') appId = 'cmd';

      if (appId === 'cmd') {
        if (typeof openTerminalWindow === 'function') openTerminalWindow();
      } else {
        createWindow(appTitle, appId, appIcon);
      }
    });
  });
}

function initializeTaskbarApps() {
  const pinnedApps = document.querySelectorAll(".taskbar-item.pinned");
  pinnedApps.forEach(appEl => {
    appEl.setAttribute("draggable", "true");
    const appId = appEl.dataset.appId;
    const imgEl = appEl.querySelector("img");
    const appTitle = imgEl ? imgEl.alt : "Application";
    const appIcon = imgEl ? imgEl.src : null;
    
    taskbarRegistry[appId] = {
      element: appEl,
      windows: [],
      isPinned: true
    };
    
    appEl.addEventListener("click", (e) => {
      e.stopPropagation();
      handleTaskbarClick(appId, appTitle, appIcon);
    });
    
    setupTaskbarContextMenu(appEl, appId, appTitle, appIcon);
    attachTaskbarItemHover(appEl, appId, () => appTitle);
  });
  setupTaskbarTooltips();
}

function removeDesktop(id) {
  if (desktops.length <= 1) return;
  const idx = desktops.findIndex(d => d.id === id);
  if (idx === -1) return;

  const fallbackDeskId = idx > 0 ? desktops[idx - 1].id : desktops[idx + 1].id;

  Object.keys(windows).forEach(winId => {
    if (windows[winId].desktopId === id) {
      windows[winId].desktopId = fallbackDeskId;
    }
  });

  if (activeDesktopId === id) {
    switchDesktop(fallbackDeskId);
  }

  desktops.splice(idx, 1);

  const taskViewOverlay = document.getElementById("taskViewOverlay");
  const taskViewBtn = document.getElementById("taskViewBtn");
  if (taskViewOverlay && taskViewOverlay.classList.contains("visible") && taskViewBtn) {
    taskViewOverlay.classList.remove("visible");
    setTimeout(() => {
      taskViewBtn.dispatchEvent(new Event('click'));
    }, 10);
  } else {
    renderTaskViewDesktops();
  }
}

// Task View Logic
function renderTaskViewDesktops() {
  const taskViewDesktops = document.getElementById("taskViewDesktops");
  if (!taskViewDesktops) return;

  taskViewDesktops.innerHTML = "";

  desktops.forEach((desk, index) => {
    const dItem = document.createElement("div");
    dItem.className = "desktop-item";
    if (desk.id === activeDesktopId) dItem.classList.add("active");

    // Header (name above preview)
    const nameSpan = document.createElement("span");
    nameSpan.className = "desktop-name";
    nameSpan.textContent = desk.name;

    // Preview image
    const preview = document.createElement("div");
    preview.className = "desktop-preview";
    preview.style.backgroundImage = "url('wallpaper/windows-11-blue-material-3y-1920x1080.jpg')";

    // Optional indicator
    const indicator = document.createElement("div");
    indicator.className = "desktop-indicator";

    dItem.appendChild(nameSpan);
    dItem.appendChild(preview);
    dItem.appendChild(indicator);

    if (desktops.length > 1) {
      const closeDeskBtn = document.createElement("div");
      closeDeskBtn.className = "desktop-close";
      closeDeskBtn.textContent = "×";
      closeDeskBtn.onclick = (e) => {
        e.stopPropagation();
        removeDesktop(desk.id);
      };
      dItem.appendChild(closeDeskBtn);
    }

    dItem.onclick = (e) => {
      e.stopPropagation();
      switchDesktop(desk.id);
      document.getElementById("taskViewOverlay").classList.remove("visible");
    };

    taskViewDesktops.appendChild(dItem);
  });

  // "New desktop" button
  const newBtn = document.createElement("div");
  newBtn.className = "desktop-item new-desktop";

  const newName = document.createElement("span");
  newName.className = "desktop-name";
  newName.textContent = "New desktop";

  const box = document.createElement("div");
  box.className = "desktop-preview ico-box";
  const plusIcon = document.createElement("span");
  plusIcon.className = "ico";
  plusIcon.textContent = "+";
  box.appendChild(plusIcon);

  newBtn.appendChild(newName);
  newBtn.appendChild(box);

  // invisible indicator for alignment
  const ghostIndicator = document.createElement("div");
  ghostIndicator.className = "desktop-indicator";
  newBtn.appendChild(ghostIndicator);

  newBtn.onclick = (e) => {
    e.stopPropagation();
    addDesktop();
  };

  taskViewDesktops.appendChild(newBtn);
}

function initializeTaskView() {
  const taskViewBtn = document.getElementById("taskViewBtn");
  const taskViewOverlay = document.getElementById("taskViewOverlay");
  const taskViewWindows = document.getElementById("taskViewWindows");

  if (!taskViewBtn || !taskViewOverlay || !taskViewWindows) return;

  function toggleTaskView() {
    if (taskViewOverlay.classList.contains("visible")) {
      taskViewOverlay.classList.remove("visible");
      taskViewWindows.innerHTML = "";
    } else {
      taskViewWindows.innerHTML = "";
      // Filter windows for only the active desktop
      const windowIds = Object.keys(windows).filter(id => windows[id].desktopId === activeDesktopId);

      if (windowIds.length === 0) {
        taskViewWindows.innerHTML = "<div style='color:white; font-size:14px;'>No open windows</div>";
      } else {
        windowIds.forEach(id => {
          const win = windows[id];
          if (win.element && win.element.style.display !== 'none' || win.isMinimized) {
            const card = document.createElement("div");
            card.className = "tv-card";
            card.dataset.windowId = id;
            card.style.display = "flex";

            const header = document.createElement("div");
            header.className = "tv-card-header";

            const titleContainer = document.createElement("div");
            titleContainer.className = "tv-card-title-container";

            if (win.appIcon) {
              const icon = document.createElement("img");
              icon.src = win.appIcon;
              icon.className = "tv-card-icon";
              titleContainer.appendChild(icon);
            }

            const title = document.createElement("div");
            title.className = "tv-card-title";
            title.textContent = win.appTitle || "Window";
            titleContainer.appendChild(title);

            const closeBtn = document.createElement("div");
            closeBtn.className = "tv-card-close";
            closeBtn.textContent = "×";
            closeBtn.onclick = (e) => {
              e.stopPropagation();
              closeWindow(id);
              card.remove();
              if (Object.keys(windows).filter(wid => windows[wid].desktopId === activeDesktopId).length === 0) {
                taskViewWindows.innerHTML = "<div style='color:white; font-size:14px;'>No open windows</div>";
              }
            };

            header.appendChild(titleContainer);
            header.appendChild(closeBtn);

            const preview = document.createElement("div");
            preview.className = "tv-card-preview";
            if (win.appIcon) {
              const previewIcon = document.createElement("img");
              previewIcon.src = win.appIcon;
              preview.appendChild(previewIcon);
            } else {
              const fallback = document.createElement("div");
              fallback.textContent = win.appTitle ? win.appTitle[0].toUpperCase() : "W";
              fallback.style.fontSize = "32px";
              fallback.style.color = "white";
              preview.appendChild(fallback);
            }

            card.appendChild(header);
            card.appendChild(preview);

            card.onclick = () => {
              if (win.isMinimized) {
                minimizeWindow(id);
              }
              updateZIndex(id);
              taskViewOverlay.classList.remove("visible");
            };

            taskViewWindows.appendChild(card);
          }
        });
      }

      renderTaskViewDesktops();
      taskViewOverlay.classList.add("visible");
    }
  }

  taskViewBtn.addEventListener("click", toggleTaskView);

  // Hover-to-open with a 500ms delay (matches real Windows 11 behaviour)
  let taskViewHoverTimer = null;
  taskViewBtn.addEventListener("mouseenter", () => {
    if (!taskViewOverlay.classList.contains("visible")) {
      taskViewHoverTimer = setTimeout(() => {
        toggleTaskView();
      }, 500);
    }
  });
  taskViewBtn.addEventListener("mouseleave", () => {
    clearTimeout(taskViewHoverTimer);
  });

  taskViewOverlay.addEventListener("click", (e) => {
    if (e.target === taskViewOverlay || e.target === taskViewWindows) {
      taskViewOverlay.classList.remove("visible");
      taskViewOverlay.classList.remove("snap-assist");
      taskViewOverlay.style.cssText = '';
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && taskViewOverlay.classList.contains("visible")) {
      taskViewOverlay.classList.remove("visible");
      taskViewOverlay.classList.remove("snap-assist");
      taskViewOverlay.style.cssText = '';
    }
  });
}

// Snap Assist logic
let currentSnapWindowId = null;

function showSnapLayoutMenu(windowId, btnElement) {
  currentSnapWindowId = windowId;
  const menu = document.getElementById("snapLayoutMenu");
  if (!menu) return;
  const rect = btnElement.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 10}px`;
  let leftPos = rect.left + rect.width / 2 - 125;
  if (leftPos + 250 > window.innerWidth) leftPos = window.innerWidth - 260;
  if (leftPos < 10) leftPos = 10;
  menu.style.left = `${leftPos}px`;
  menu.classList.add("visible");
}

function showSnapAssist(snappedType) {
  const desktopWindows = Object.keys(windows).filter(id => windows[id].desktopId === activeDesktopId);
  if (desktopWindows.length <= 1) return;

  const taskViewBtn = document.getElementById("taskViewBtn");
  if (!taskViewBtn) return;
  const taskViewOverlay = document.getElementById("taskViewOverlay");
  
  // Open task view
  taskViewBtn.dispatchEvent(new Event('click'));
  
  // Convert it into snap assist picker
  taskViewOverlay.classList.add("snap-assist");
  
  const taskbarHeight = 48;
  taskViewOverlay.style.position = 'fixed';
  taskViewOverlay.style.height = `${window.innerHeight - taskbarHeight}px`;

  // Remove ALL snapped windows from the picker
  Object.keys(windows).forEach(id => {
    if (windows[id].isSnapped || id === currentSnapWindowId) {
      const snappedCard = taskViewOverlay.querySelector(`.tv-card[data-window-id="${id}"]`);
      if (snappedCard) snappedCard.remove();
    }
  });
  
  // Position the picker in the empty space
  if (snappedType === 'left' || snappedType === 'left-half') {
    taskViewOverlay.style.left = '50%';
    taskViewOverlay.style.width = '50%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType === 'right' || snappedType === 'right-half') {
    taskViewOverlay.style.left = '0';
    taskViewOverlay.style.width = '50%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType === 'left-large') {
    taskViewOverlay.style.left = '60%';
    taskViewOverlay.style.width = '40%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType === 'right-small') {
    taskViewOverlay.style.left = '0';
    taskViewOverlay.style.width = '60%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType === 'left-third') {
    taskViewOverlay.style.left = '33.33%';
    taskViewOverlay.style.width = '66.66%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType === 'mid-third') {
    taskViewOverlay.style.left = '66.66%';
    taskViewOverlay.style.width = '33.33%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType === 'right-third') {
    taskViewOverlay.style.left = '0';
    taskViewOverlay.style.width = '66.66%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType === 'left-quarter') {
    taskViewOverlay.style.left = '25%';
    taskViewOverlay.style.width = '75%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType === 'mid-half') {
    taskViewOverlay.style.left = '75%';
    taskViewOverlay.style.width = '25%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType === 'right-quarter') {
    taskViewOverlay.style.left = '0';
    taskViewOverlay.style.width = '75%';
    taskViewOverlay.style.top = '0';
  } else if (snappedType.includes('quarter')) {
    // Fill the other half horizontally for simplicity in snap assist
    if (snappedType.includes('left')) {
      taskViewOverlay.style.left = '50%';
      taskViewOverlay.style.width = '50%';
    } else {
      taskViewOverlay.style.left = '0';
      taskViewOverlay.style.width = '50%';
    }
  }

  // Hook card clicks to snap them into the remaining spot
  setTimeout(() => {
    const cards = document.querySelectorAll('.tv-card');
    cards.forEach(card => {
      // Overwrite the click behavior to snap the new window
      const oldClick = card.onclick;
      card.onclick = (e) => {
        const clickedWindowId = card.dataset.windowId;
        oldClick.call(card, e);
        
        // Let the window restore first, then snap
        setTimeout(() => {
          let oppositeSnap = 'right-half';
          if (snappedType === 'left' || snappedType === 'left-half') oppositeSnap = 'right-half';
          else if (snappedType === 'right' || snappedType === 'right-half') oppositeSnap = 'left-half';
          else if (snappedType === 'left-large') oppositeSnap = 'right-small';
          else if (snappedType === 'right-small') oppositeSnap = 'left-large';
          else if (snappedType === 'left-third') oppositeSnap = 'mid-third';
          else if (snappedType === 'mid-third') oppositeSnap = 'right-third';
          else if (snappedType === 'right-third') oppositeSnap = 'mid-third';
          else if (snappedType === 'left-quarter') oppositeSnap = 'mid-half';
          else if (snappedType === 'mid-half') oppositeSnap = 'right-quarter';
          else if (snappedType === 'right-quarter') oppositeSnap = 'mid-half';
          
          if (clickedWindowId) {
            applySnap(clickedWindowId, oppositeSnap);
            // Re-invoke snap assist if we have 3-region layouts and there's another window to snap?
            // Windows 11 does this, but for simplicity we can just let it end after one snap or re-trigger
            // Let's re-trigger if it was a 3-part layout and more windows exist
            const layout3 = ['left-third', 'mid-third', 'left-quarter', 'mid-half'];
            if (layout3.includes(snappedType)) {
              setTimeout(() => {
                currentSnapWindowId = clickedWindowId;
                showSnapAssist(oppositeSnap);
              }, 300);
            }
          }
          // Reset overlay styling
          taskViewOverlay.classList.remove("snap-assist");
          taskViewOverlay.style.cssText = '';
        }, 50);
      };
    });
  }, 100);
}

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("snapLayoutMenu");
  if (!menu) return;

  menu.addEventListener("mouseenter", () => {
    menu.classList.add("visible");
  });
  
  menu.addEventListener("mouseleave", () => {
    menu.classList.remove("visible");
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !e.target.closest('.maximize')) {
      menu.classList.remove("visible");
    }
  });

  menu.querySelectorAll(".snap-region").forEach(region => {
    region.addEventListener("click", (e) => {
      e.stopPropagation();
      const snapType = region.dataset.snap;
      if (currentSnapWindowId && snapType) {
        applySnap(currentSnapWindowId, snapType);
        menu.classList.remove("visible");
        setTimeout(() => showSnapAssist(snapType), 300);
      }
    });
  });
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeAppShortcuts();
    initializeTaskbarApps();
    initializeTaskView();
    initializeTaskbarDragDrop();
  });
} else {
  initializeAppShortcuts();
  initializeTaskbarApps();
  initializeTaskView();
  initializeTaskbarDragDrop();
}

function setupTaskbarContextMenu(taskbarItem, appId, appTitle, appIcon) {
  taskbarItem.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const menu = document.getElementById("taskbarContextMenu");
    if (!menu) return;

    // Hide others
    const contextMenu = document.getElementById("contextMenu");
    const appContextMenu = document.getElementById("appContextMenu");
    if (contextMenu) contextMenu.style.display = "none";
    if (appContextMenu) appContextMenu.style.display = "none";

    // Setup content
    const iconEl = document.getElementById("tbContextIcon");
    if (iconEl && appIcon) iconEl.src = appIcon;
    const nameEl = document.getElementById("tbContextName");
    if (nameEl) nameEl.textContent = appTitle || "Application";
    
    const isPinned = taskbarRegistry[appId] && taskbarRegistry[appId].isPinned;
    const pinTextEl = document.getElementById("tbContextPinText");
    const pinIconEl = document.getElementById("tbContextPinIcon");
    if (pinTextEl) pinTextEl.textContent = isPinned ? "Unpin from taskbar" : "Pin to taskbar";
    if (pinIconEl) pinIconEl.innerHTML = isPinned ? "&#xe77a;" : "&#xe840;";
    
    const actionBtn = document.getElementById("tbContextPinAction");
    if (actionBtn) {
      actionBtn.onclick = () => {
        togglePinTaskbarItem(appId, appTitle, appIcon);
        menu.style.display = "none";
      };
    }

    menu.style.display = "block";
    
    // Position menu above taskbar, centered on the icon
    const rect = taskbarItem.getBoundingClientRect();
    let x = rect.left + (rect.width / 2) - (menu.offsetWidth / 2);
    let y = rect.top - menu.offsetHeight - 8; // 8px padding above taskbar
    
    if (x < 0) x = 0;
    if (x + menu.offsetWidth > window.innerWidth) x = window.innerWidth - menu.offsetWidth;
    if (y < 0) y = 0;
    
    menu.style.left = x + "px";
    menu.style.top = y + "px";
  });
}

function togglePinTaskbarItem(appId, appTitle, appIcon) {
  let reg = taskbarRegistry[appId];
  const taskbarApps = document.getElementById("taskbarApps");
  
  if (!reg) {
    // Need to pin a currently non-existent taskbar item
    const taskbarItem = document.createElement("div");
    taskbarItem.classList.add("taskbar-item", "pinned");
    taskbarItem.setAttribute("draggable", "true");
    taskbarItem.dataset.appId = appId;
    
    if (appIcon) {
      const iconImg = document.createElement("img");
      iconImg.src = appIcon;
      iconImg.classList.add("taskbar-icon");
      taskbarItem.appendChild(iconImg);
    }
    
    const indicator = document.createElement("div");
    indicator.classList.add("taskbar-indicator");
    taskbarItem.appendChild(indicator);
    
    taskbarItem.onclick = (e) => {
      e.stopPropagation();
      handleTaskbarClick(appId, appTitle, appIcon);
    };
    
    setupTaskbarContextMenu(taskbarItem, appId, appTitle, appIcon);
    attachTaskbarItemHover(taskbarItem, appId, () => appTitle);
    
    if (taskbarApps) taskbarApps.appendChild(taskbarItem);
    
    taskbarRegistry[appId] = {
      element: taskbarItem,
      windows: [],
      isPinned: true
    };
  } else {
    if (reg.isPinned) {
      // Unpin
      reg.isPinned = false;
      reg.element.classList.remove("pinned");
      if (reg.windows.length === 0) {
        reg.element.remove();
        delete taskbarRegistry[appId];
      }
    } else {
      // Pin
      reg.isPinned = true;
      reg.element.classList.add("pinned");
    }
  }
}

let draggedTaskbarItem = null;

function initializeTaskbarDragDrop() {
  const taskbarApps = document.getElementById("taskbarApps");
  if (!taskbarApps) return;

  taskbarApps.addEventListener("dragstart", (e) => {
    const item = e.target.closest(".taskbar-item");
    if (!item) return;
    draggedTaskbarItem = item;
    // Set some data to make drag valid in Firefox/others
    e.dataTransfer.setData("text/plain", JSON.stringify({ isSort: true }));
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => { item.style.opacity = '0.4'; }, 0);
  });

  taskbarApps.addEventListener("dragend", (e) => {
    if (draggedTaskbarItem) {
      draggedTaskbarItem.style.opacity = '1';
      draggedTaskbarItem = null;
    }
    taskbarApps.style.backgroundColor = "";
  });

  taskbarApps.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (draggedTaskbarItem) {
      // Sorting
      const targetItem = e.target.closest(".taskbar-item");
      if (targetItem && targetItem !== draggedTaskbarItem) {
        const rect = targetItem.getBoundingClientRect();
        const midPoint = rect.left + rect.width / 2;
        if (e.clientX < midPoint) {
          taskbarApps.insertBefore(draggedTaskbarItem, targetItem);
        } else {
          taskbarApps.insertBefore(draggedTaskbarItem, targetItem.nextSibling);
        }
      }
    } else {
      // Pinning
      e.dataTransfer.dropEffect = "copy";
      taskbarApps.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    }
  });

  taskbarApps.addEventListener("dragleave", (e) => {
    if (!draggedTaskbarItem) {
      taskbarApps.style.backgroundColor = "";
    }
  });

  taskbarApps.addEventListener("drop", (e) => {
    e.preventDefault();
    taskbarApps.style.backgroundColor = "";
    if (draggedTaskbarItem) {
      return; // Handled by dragover
    }
    
    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data && data.appId && !data.isSort) {
        const reg = taskbarRegistry[data.appId];
        if (!reg || !reg.isPinned) {
          togglePinTaskbarItem(data.appId, data.appTitle, data.appIcon);
        }
      }
    } catch (err) {
      console.error("Taskbar drop error", err);
    }
  });
}

function initializeStartAppContextMenu() {
  const pinAction = document.getElementById("startAppPinAction");
  if (pinAction) {
    pinAction.addEventListener("click", () => {
      const menu = document.getElementById("startAppContextMenu");
      if (!menu) return;
      const appId = menu.dataset.targetId;
      const appTitle = menu.dataset.targetTitle;
      const appIcon = menu.dataset.targetIcon;
      if (appId) {
        togglePinTaskbarItem(appId, appTitle, appIcon);
      }
      menu.style.display = "none";
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeStartAppContextMenu();
  });
} else {
  initializeStartAppContextMenu();
}
