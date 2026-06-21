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
    desktopId: activeDesktopId
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

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("taskbarPreviewMenu");
  if (menu) {
    menu.addEventListener("mouseenter", () => clearTimeout(previewHideTimeout));
    menu.addEventListener("mouseleave", () => hideTaskbarPreview());
  }
});

function showTaskbarPreview(appId, taskbarElement) {
  const reg = taskbarRegistry[appId];
  if (!reg || reg.windows.length === 0) return;

  const menu = document.getElementById("taskbarPreviewMenu");
  if (!menu) return;

  menu.innerHTML = "";

  reg.windows.forEach(windowId => {
    const win = windows[windowId];
    if (!win) return;

    const card = document.createElement("div");
    card.className = "tv-card";
    
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
    
    const title = document.createElement("div");
    title.className = "tv-card-title";
    title.textContent = win.appTitle || "Window";
    titleContainer.appendChild(title);
    
    const closeBtn = document.createElement("div");
    closeBtn.className = "tv-card-close";
    closeBtn.textContent = "×";
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeWindow(windowId);
      card.remove();
      if (menu.children.length === 0) hideTaskbarPreview(true);
    };
    
    header.appendChild(titleContainer);
    header.appendChild(closeBtn);
    
    // Fake window preview block
    const preview = document.createElement("div");
    preview.className = "tv-card-preview";
    if (win.appIcon) {
      const pIcon = document.createElement("img");
      pIcon.src = win.appIcon;
      pIcon.style.width = "48px";
      pIcon.style.height = "48px";
      pIcon.style.filter = "drop-shadow(0 4px 12px rgba(0,0,0,0.5))";
      preview.appendChild(pIcon);
    }
    
    card.appendChild(header);
    card.appendChild(preview);
    
    card.onclick = (e) => {
      e.stopPropagation();
      if (win.isMinimized) minimizeWindow(windowId);
      updateZIndex(windowId);
      hideTaskbarPreview(true);
    };
    
    menu.appendChild(card);
  });

  const rect = taskbarElement.getBoundingClientRect();
  const taskbarCenter = rect.left + (rect.width / 2);
  menu.style.left = `${taskbarCenter}px`;

  menu.classList.add("visible");
}

function hideTaskbarPreview(instant = false) {
  const menu = document.getElementById("taskbarPreviewMenu");
  if (!menu) return;
  if (instant) {
    menu.classList.remove("visible");
  } else {
    previewHideTimeout = setTimeout(() => {
      menu.classList.remove("visible");
    }, 150);
  }
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
    } else {
      if (reg.windows.length === 1) reg.element.classList.remove("stacked");
      if (activeWindowId === windowId) {
        updateZIndex(reg.windows[0]);
      }
    }
    // Update preview if it's currently showing this app
    const menu = document.getElementById("taskbarPreviewMenu");
    if (menu && menu.classList.contains("visible") && reg.windows.length > 0) {
      showTaskbarPreview(win.appId, reg.element);
    }
  }
}

function handleTaskbarClick(appId, appTitle, appIcon) {
  const reg = taskbarRegistry[appId];
  if (!reg || reg.windows.length === 0) {
    if (appTitle.toLowerCase() === 'microsoft edge' || (appIcon && appIcon.includes('edge.ico'))) {
      if (typeof openEdgeWindow === 'function') openEdgeWindow();
    } else if (appId === 'cmd') {
      if (typeof openTerminalWindow === 'function') openTerminalWindow();
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
  
  win.appId = appId;
  if (win.element) win.element.dataset.appId = appId;

  if (!taskbarRegistry[appId]) {
    const taskbarItem = document.createElement("div");
    taskbarItem.classList.add("taskbar-item");
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

    taskbarItem.addEventListener("mouseenter", () => {
      clearTimeout(previewHideTimeout);
      previewHoverTimeout = setTimeout(() => {
        showTaskbarPreview(appId, taskbarItem);
      }, 300);
    });

    taskbarItem.addEventListener("mouseleave", () => {
      clearTimeout(previewHoverTimeout);
      hideTaskbarPreview();
    });

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
      } else if (appTitle.toLowerCase() === 'microsoft edge' || appTitle.toLowerCase() === 'edge' || appId === 'edge' || appId === 'browser') {
        if (typeof openEdgeWindow === 'function') openEdgeWindow();
      } else {
        createWindow(appTitle, appId, appIcon);
      }
    });

    newShortcut.addEventListener("dblclick", (e) => e.stopPropagation());
  });
}

function initializeTaskbarApps() {
  const pinnedApps = document.querySelectorAll(".taskbar-item.pinned");
  pinnedApps.forEach(appEl => {
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
    
    appEl.addEventListener("mouseenter", () => {
      clearTimeout(previewHideTimeout);
      previewHoverTimeout = setTimeout(() => {
        showTaskbarPreview(appId, appEl);
      }, 300);
    });

    appEl.addEventListener("mouseleave", () => {
      clearTimeout(previewHoverTimeout);
      hideTaskbarPreview();
    });
  });
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
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && taskViewOverlay.classList.contains("visible")) {
      taskViewOverlay.classList.remove("visible");
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeAppShortcuts();
    initializeTaskbarApps();
    initializeTaskView();
  });
} else {
  initializeAppShortcuts();
  initializeTaskbarApps();
  initializeTaskView();
}
