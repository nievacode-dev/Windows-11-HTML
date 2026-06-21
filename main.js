const startLogo = document.getElementById("startLogo");
const startMenu = document.getElementById("startMenu");
const searchMenu = document.getElementById("searchMenu");
const searchIcon = document.getElementById("searchIcon");
const shutDownBtn = document.getElementById("shutDownBtn");
const shutDownMenu = document.getElementById("shutDownMenu");
const sleepBtn = document.getElementById("sleepBtn");
const userMenu = document.getElementById("userMenu");
const widgetsIcon = document.getElementById("widgetsIcon");
const widgetsMenu = document.getElementById("widgetsMenu");
const personalize = document.getElementById("personalize");
const body = document.body;

// startLogo.onclick = () => {
//   if (startMenu.style.display === "none" || startMenu.style.display === "") {
//     startMenu.style.display = "block";
//   } else {
//     document.addEventListener("click", function (event) {
//       if (event.target !== startMenu && event.target !== startLogo && event.target !== searchMenu && event.target !== shutDownBtn && event.target !== userMenu && event.target !== shutDownMenu && startMenu.style.display === "block") {
//       if (event.target === body && startMenu.style.display === "block") {
//         startMenu.style.display = "none";
//         startMenu.classList.add("slidedown-anim");
//         setTimeout(() => {
//           startMenu.classList.remove("slidedown-anim");
//         }, 300);
//       }
//     });
//     startMenu.style.display = "none";
//     startMenu.classList.add("slidedown-anim");
//     setTimeout(() => {
//       startMenu.classList.remove("slidedown-anim");
//     }, 300);
//   }
// };

searchBtn.onclick = function (event) {
  if (searchMenu.style.display === "none" || searchMenu.style.display === "") {
    searchMenu.style.display = "block";
    if (event.target === body && startMenu.style.display === "block") {
      startMenu.style.display = "none";
      startMenu.classList.add("slidedown-anim");
      setTimeout(() => {
        startMenu.classList.remove("slidedown-anim");
      }, 300);
    }
  } else {
    searchMenu.style.display = "none";
    searchMenu.classList.add("slidedown-anim");
    setTimeout(() => {
      searchMenu.classList.remove("slidedown-anim");
    }, 300);
  }
};

startLogo.addEventListener("click", function (e) {
  e.stopPropagation();
  startMenu.classList.toggle("menu-open");
  if (searchMenu) {
    searchMenu.classList.remove("menu-open");
    searchMenu.style.display = "none";
  }
});

// searchIcon click now handled by searchBtn in HTML
const searchBtnEl = document.getElementById("searchBtn");
if (searchBtnEl) {
  searchBtnEl.addEventListener("click", function (e) {
    e.stopPropagation();
    if (searchMenu) searchMenu.classList.toggle("menu-open");
    startMenu.classList.remove("menu-open");
  });
}

// All apps logic
document.addEventListener("DOMContentLoaded", () => {
  const allAppsBtn = document.querySelector(".all-apps");
  const backBtn = document.getElementById("backBtn");
  const startMenuViewport = document.getElementById("startMenuViewport");

  if (allAppsBtn && startMenuViewport) {
    allAppsBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent start menu from closing
      startMenuViewport.classList.add("show-all-apps");
    });
  }

  if (backBtn && startMenuViewport) {
    backBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startMenuViewport.classList.remove("show-all-apps");
    });
  }

  // Hook up the all-apps list items to createWindow
  const allAppItems = document.querySelectorAll(".all-app-item");
  allAppItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof createWindow !== 'undefined') {
        const title = item.dataset.title || "Application";
        const iconImg = item.querySelector("img");

        if (typeof createWindow !== 'undefined') {
          createWindow(title, null, iconImg ? iconImg.src : null);
        }

        // Optionally close start menu
        startMenu.classList.remove("menu-open");
      }
    });
  });

  // Reset viewport when start menu closes
  document.addEventListener("click", (e) => {
    // Basic detection if click was outside startmenu
    if (!startMenu.contains(e.target) && e.target !== startLogo) {
      startMenu.classList.remove("menu-open");
      if (startMenuViewport) {
        // delay removal to reset after it's hidden
        setTimeout(() => startMenuViewport.classList.remove("show-all-apps"), 200);
      }
    }
  });
});

// widgetsIcon.onclick = function () {
//   if (
//     widgetsMenu.style.display === "none" ||
//     widgetsMenu.style.display === ""
//   ) {
//     widgetsMenu.style.display = "block";
//   } else {
//     widgetsMenu.style.display = "none";
//     widgetsMenu.classList.add("sideleft-anim");
//     setTimeout(() => {
//       widgetsMenu.classList.remove("sideleft-anim");
//     }, 300);
//   }
// };

// shutDownBtn.onclick = () => {
//   if (
//     shutDownMenu.style.display === "none" ||
//     shutDownMenu.style.display === ""
//   ) {
//     shutDownMenu.style.display = "block";
//     shutDownMenu.style.animation = "shutdownmenu 0.1s";
//     setTimeout(() => {
//       shutDownMenu.style.animation = "";
//     }, 100);
//   } else {
//     document.addEventListener("click", function (event) {
//       if (
//         event.target !== shutDownMenu &&
//         event.target !== startLogo &&
//         event.target !== searchMenu &&
//         event.target !== userMenu &&
//         event.target !== shutDownBtn
//       ) {
//         shutDownMenu.style.display = "none";
//       } else if (event.target === startLogo) {
//         shutDownMenu.style.display = "none";
//         shutDownMenu.style.display = "none";
//         shutDownMenu.style.animation = "shutdownmenudown 0.1s";
//         setTimeout(() => {
//           shutDownMenu.style.animation = "";
//         }, 100);
//       }
//     });
//     shutDownMenu.style.display = "none";
//     shutDownMenu.style.animation = "shutdownmenudown 0.1s";
//     setTimeout(() => {
//       shutDownMenu.style.animation = "";
//     }, 100);
//   }
// };

shutDownBtn.addEventListener("click", function () {
  shutDownMenu.classList.toggle("menu-open");
});

const recycleBin = document.getElementById("recycleBin");
recycleBin.addEventListener("contextmenu", function (event) {
  event.preventDefault();
  event.stopPropagation(); // prevent document handler from hiding the menu right after

  const recycleBinMenu = document.getElementById("recycleBinMenu");
  // getAttribute returns the literal attribute value (e.g. "icon/recyclebinfull.ico")
  const isFull = recycleBin.src.includes("recyclebinfull");

  document.getElementById("emptyBin").style.opacity = isFull ? "1" : "0.3";

  recycleBinMenu.style.display = "block";
  recycleBinMenu.style.left = event.pageX + "px";
  recycleBinMenu.style.top = event.pageY + "px";
});


const emptyBin = document.getElementById("emptyBin");
emptyBin.onclick = function () {
  recycleBin.src = "/Windows_11_24H2/icon/recyclebinempty.ico";
};

// Open Recycle Bin on double-click
recycleBin.addEventListener("dblclick", function () {
  if (typeof createWindow !== "undefined") {
    createWindow("Recycle Bin", "recycle-bin", recycleBin.src);
  }
});

// Wire up the "Open" button in the recycle bin context menu
document.getElementById("openBin").addEventListener("click", function () {
  document.getElementById("recycleBinMenu").style.display = "none";
  if (typeof createWindow !== "undefined") {
    createWindow("Recycle Bin", "recycle-bin", recycleBin.src);
  }
});


document.getElementById("closePopup").onclick = function () {
  document.getElementById("popup").style.display = "none";
  document.getElementById("grayBg").style.display = "none";
};

document.getElementById("closePopup").onclick = function () {
  document.getElementById("popup").style.display = "none";
  document.getElementById("grayBg").style.display = "none";
};

function retryRun(getTagId) {
  document.getElementById("runProgram").style.display = "block";
  document.getElementById(getTagId).style.display = "none";
  document.getElementById("runInput").select();
}

document.getElementById("refresh").onclick = function () {
  // Refresh desktop icons (re-trigger a paint by briefly hiding/showing them)
  const desktopApps = document.querySelectorAll(".app-desktop");
  desktopApps.forEach(el => {
    el.style.visibility = "hidden";
  });
  setTimeout(() => {
    desktopApps.forEach(el => {
      el.style.visibility = "";
    });
  }, 50);
};

// const trayBtn = document.getElementById("trayBtn");
// const trayContent = document.getElementById("trayContent");
// const trayIco = document.getElementById("trayIco");
// trayBtn.onclick = function () {
//   if (
//     trayContent.style.display === "" ||
//     trayContent.style.display === "none"
//   ) {
//     trayContent.style.display = "flex";
//     trayBtn.style.backgroundColor = "rgba(80, 80, 80, 0.4)";
//     trayIco.innerHTML = "&#xe972;";
//     trayIco.style.animation = "tray 0.2s reverse";
//     setTimeout(() => {
//       trayIco.style.animation = "";
//       trayContent.style.animation = "";
//     }, 200);
//   } else {
//     document.addEventListener("click", function (e) {
//       if (
//         e.target !== trayBtn &&
//         e.target !== trayContent &&
//         e.target !== trayIco &&
//         trayContent.style.display === "flex"
//       ) {
//         trayContent.style.display = "none";
//         trayIco.innerHTML = "&#xe971;";
//         trayBtn.style.backgroundColor = "";
//         trayIco.style.animation = "trayreverse";
//         trayIco.style.animationDuration = "0.2s";
//         trayIco.style.animationDirection = "reverse";
//         trayContent.style.animation = "trayclose";
//         trayContent.style.animationDuration = "0.2s";
//         setTimeout(() => {
//           trayIco.style.animation = "";
//           trayContent.style.animation = "";
//         }, 200);
//       }
//     });
//     trayContent.style.display = "none";
//     trayContent.style.animation = "trayclose";
//     trayContent.style.animationDuration = "0.2s";
//     trayIco.innerHTML = "&#xe971;";
//     trayBtn.style.backgroundColor = "";
//     trayIco.style.animation = "trayreverse";
//     trayIco.style.animationDuration = "0.2s";
//     trayIco.style.animationDirection = "reverse";
//     setTimeout(() => {
//       trayIco.style.animation = "";
//       trayContent.style.animation = "";
//     }, 250);
//   }
// };

const contextMenu = document.getElementById("contextMenu");
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();

  // Hide other menus
  document.getElementById("quickLink").style.display = "none";
  const recycleBinMenu = document.getElementById("recycleBinMenu");
  if (recycleBinMenu) recycleBinMenu.style.display = "none";
  const taskbarContextMenu = document.getElementById("taskbarContextMenu");
  if (taskbarContextMenu) taskbarContextMenu.style.display = "none";
  const startAppContextMenu = document.getElementById("startAppContextMenu");
  if (startAppContextMenu) startAppContextMenu.style.display = "none";

  const appDesktop = e.target.closest(".app-desktop");
  const appContextMenu = document.getElementById("appContextMenu");

  if (e.target.closest("#recycleBin") || e.target.closest("#startLogo")) {
    // Handled by their respective listeners, just hide default context
    contextMenu.style.display = "none";
    if (appContextMenu) appContextMenu.style.display = "none";
    return;
  }

  if (appDesktop) {
    contextMenu.style.display = "none";
    if (appContextMenu) {
      appContextMenu.style.display = "block";
      appContextMenu.style.left = e.pageX + "px";
      appContextMenu.style.top = e.pageY + "px";

      // Store reference to right-clicked app
      appContextMenu.dataset.targetId = appDesktop.dataset.id;
      appContextMenu.dataset.targetTitle = appDesktop.dataset.title;
      const img = appDesktop.querySelector("img.app");
      appContextMenu.dataset.targetIcon = img ? img.src : "";
    }
  } else {
    if (appContextMenu) appContextMenu.style.display = "none";
    contextMenu.style.display = "block";
    contextMenu.style.left = e.pageX + "px";
    contextMenu.style.top = e.pageY + "px";
  }
});

// App context menu "Open" logic
document.addEventListener("DOMContentLoaded", () => {
  const appOpenBtn = document.getElementById("appOpenBtn");
  if (appOpenBtn) {
    appOpenBtn.addEventListener("click", () => {
      const appContextMenu = document.getElementById("appContextMenu");
      if (appContextMenu && typeof createWindow !== 'undefined') {
        createWindow(appContextMenu.dataset.targetTitle || "Application",
          appContextMenu.dataset.targetId,
          appContextMenu.dataset.targetIcon);
      }
    });
  }

  const displaySettingsBtn = document.getElementById("displaySettingsBtn");
  if (displaySettingsBtn) {
    displaySettingsBtn.addEventListener("click", () => {
      if (typeof createWindow !== 'undefined') {
        createWindow('Settings', 'settings', 'icon/settings.ico');
      }
    });
  }

  const personalizeBtn = document.getElementById("personalizeBtn");
  if (personalizeBtn) {
    personalizeBtn.addEventListener("click", () => {
      if (typeof createWindow !== 'undefined') {
        createWindow('Settings', 'settings', 'icon/settings.ico');
      }
    });
  }
});

let mouseHover;

document.getElementById("sortBy").addEventListener("mouseenter", () => {
  mouseHover = setTimeout(() => {
    document.getElementById("sortByHover").style.display = "block";
  }, 500);
});

document.getElementById("sortBy").addEventListener("mouseleave", () => {
  clearTimeout(mouseHover);
  document.getElementById("sortByHover").style.display = "none";
});

document.getElementById("view").addEventListener("mouseenter", () => {
  mouseHover = setTimeout(() => {
    document.getElementById("viewHover").style.display = "block";
  }, 500);
});

document.getElementById("view").addEventListener("mouseleave", () => {
  clearTimeout(mouseHover);
  document.getElementById("viewHover").style.display = "none";
});

document.getElementById("newItem").addEventListener("mouseenter", () => {
  mouseHover = setTimeout(() => {
    document.getElementById("newHover").style.display = "block";
  }, 500);
});

document.getElementById("newItem").addEventListener("mouseleave", () => {
  clearTimeout(mouseHover);
  document.getElementById("newHover").style.display = "none";
});

document
  .getElementById("shutdownQuickLink")
  .addEventListener("mouseenter", () => {
    mouseHover = setTimeout(() => {
      document.getElementById("shutdownQuickLinkHover").style.display = "block";
    }, 500);
  });

document
  .getElementById("shutdownQuickLink")
  .addEventListener("mouseleave", () => {
    clearTimeout(mouseHover);
    document.getElementById("shutdownQuickLinkHover").style.display = "none";
  });

document.addEventListener("click", function () {
  document.getElementById("contextMenu").style.display = "none";
  const appContextMenu = document.getElementById("appContextMenu");
  if (appContextMenu) appContextMenu.style.display = "none";
  const taskbarContextMenu = document.getElementById("taskbarContextMenu");
  if (taskbarContextMenu) taskbarContextMenu.style.display = "none";
  const startAppContextMenu = document.getElementById("startAppContextMenu");
  if (startAppContextMenu) startAppContextMenu.style.display = "none";
});

startLogo.addEventListener("contextmenu", function (e) {
  e.preventDefault();

  document.getElementById("quickLink").style.display = "block";
});

window.addEventListener("click", function () {
  document.getElementById("quickLink").style.display = "none";
  recycleBinMenu.style.display = "none";
});

// document.querySelector('input[type="text"]').addEventListener("keydown", function (e) {
//   e.stopPropagation();
// });

document.addEventListener("keydown", function (e) {
  const tag = e.target.tagName;
  const isInput = tag === "INPUT" && e.target.type === "text";
  const isTextarea = tag === "TEXTAREA";
  const isContentEditable = e.target.isContentEditable;
  if (isInput || isTextarea || isContentEditable) {
    return;
  } else if (e.key === "s") {
    document.getElementById("shutdownTab").style.display = "block";
  } else if (e.key === "r") {
    document.getElementById("runProgram").style.display = "block";
  } else if (e.key === "d") {
    recycleBin.src = "/Windows_11_24H2/icon/recyclebinfull.ico";
  } else if (e.key === "x") {
    document.getElementById("quickLink").style.display = "block";
  } else if (e.key === "z") {
    startMenu.style.display = "block";
  }
});

runInput.addEventListener("input", () => {
  if (/[a-zA-z]/.test(runInput.value)) {
    document.getElementById("okBtn").disabled = false;
  } else {
    document.getElementById("okBtn").disabled = true;
  }
});

function runWindows() {
  const runInput = document.getElementById("runInput");
  const runProgram = document.getElementById("runProgram");
  if (runInput.value === "winver") {
    const aboutEl = document.getElementById("aboutTab");
    aboutEl.style.left = "80px";
    aboutEl.style.top = "60px";
    aboutEl.style.animation = "none";
    aboutEl.offsetHeight; // force reflow to restart animation
    aboutEl.style.animation = "";
    aboutEl.style.display = "block";
    runProgram.style.display = "none";
  } else if (runInput.value === "binexe") {
    runProgram.style.display = "none";
  } else if (runInput.value === "cmd") {
    document.getElementById("cmd").style.display = "block";
    runProgram.style.display = "none";
  } else {
    const audio = new Audio("sound/foreground.wav");
    audio.play();
    const runFailed = document.getElementById("runFailed");
    const errorTitle = document.getElementById("errorTitle");
    const getError = document.getElementById("getError");
    runFailed.style.display = "block";
    getError.innerHTML = runInput.value;
    errorTitle.innerHTML = runInput.value;
    runProgram.style.display = "none";
  }
}

function browse() {
  document.getElementById("fileInput").click();
  document.getElementById("fileInput").addEventListener("change", function () {
    const filesIn = document.getElementById("fileInput").files;
    for (let i = 0; i < filesIn.length; i++) {
      runInput.innerHTML = filesIn[i].name;
    }
  });
}

function shutdownwin() {
  const shutdownSelector = document.getElementById("shutdownSelector");
  if (shutdownSelector.value === "sleep") {
    document.getElementById("shutdownTab").style.display = "none";
  } else if (shutdownSelector.value === "restart") {
    document.getElementById("shutdownTab").style.display = "none";
    restart();
  } else {
    document.getElementById("shutdownTab").style.display = "none";
    shutdown();
  }
}

const selectorText = document.getElementById("selectorText");
function shutdownText() {
  if (shutdownSelector.value === "restart") {
    selectorText.innerHTML =
      "Close all apps, turns off the PC, and then turns it on again.";
  } else if (shutdownSelector.value === "shutdown") {
    selectorText.innerHTML = "Close all apps and turns off the PC.";
  } else if (shutdownSelector.value === "sleep") {
    selectorText.innerHTML =
      "The PC stays on but uses low power. Apps stay open so when the PC wakes up, you're instantly back to where you left off.";
  }
}

function getTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  m = checkTime(m);
  document.getElementById("times").textContent = h + ":" + m;
  document.getElementById("clock").textContent = h + ":" + m;
  var t = setTimeout(getTime, 30);
}

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function getDates() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();

  document.getElementById("dates").textContent = dd + "/" + mm + "/" + yyyy;
}

function lockScreenDate() {
  const now = new Date();
  const dayOfWeek = now.toLocaleString("default", { weekday: "long" });
  const month = now.toLocaleString("default", { month: "long" });
  const day = now.getDate();

  const formattedDate = `${dayOfWeek}, ${month} ${day}`;
  document.getElementById("datesLockScreen").textContent = formattedDate;
}

lockScreenDate();

setInterval(getDates, 1000);

window.onload = function () {
  getDates();
  getTime();

  // Boot screen disabled — cookie-based boot removed
  // const bootScreen = document.getElementById("bootScreen");
  // if (bootScreen && bootScreen.style.display !== "none") {
  //   bootScreen.style.transition = "opacity 0.6s ease-out";
  //   setTimeout(() => {
  //     bootScreen.style.opacity = "0";
  //     setTimeout(() => {
  //       bootScreen.style.display = "none";
  //       bootScreen.style.transition = "";
  //       bootScreen.style.opacity = "";
  //       document.cookie = "hasBooted=true; path=/";
  //       sessionStorage.setItem("hasBooted", "true");
  //     }, 650);
  //   }, 800);
  // }
};

function booting() {
  const blackScreenDiv = document.createElement("div");
  const bootingLogo = document.createElement("img");
  body.appendChild(blackScreenDiv);
  bootingLogo.classList.add("booting-logo");
  blackScreenDiv.appendChild(bootingLogo);
  bootingLogo.src = "/Windows_11_24H2/icon/windowsboot.png";
  blackScreenDiv.classList.add("black-screen");
  setTimeout(() => {
    blackScreenDiv.remove();
  }, 7000);
}

const qsBtn = document.getElementById("quickSettingsBtn");
qsBtn.onclick = () => {
  const quickSettings = document.getElementById("quickSettings");
  if (
    quickSettings.style.display === "none" ||
    quickSettings.style.display === ""
  ) {
    quickSettings.style.display = "block";
    quickSettings.style.animation = "startmenu 0.3s";
    setTimeout(() => {
      quickSettings.style.animation = "";
    }, 300);
  } else {
    quickSettings.style.display = "none";
    quickSettings.style.animation = "startmenudown 0.3s";
    setTimeout(() => {
      quickSettings.style.animation = "";
    }, 300);
  }
};

let taskbarApp = document.getElementsByClassName("taskbar-app");
for (let a = 0; a < taskbarApp.length; a++) {
  taskbarApp[a].addEventListener("mousedown", () => {
    taskbarApp[a].style.transform = "scale(0.8)";
    taskbarApp[a].style.animation = "taskbarhold 0.2s";
    console.log("holded");
    setTimeout(() => {
      taskbarApp[a].style.animation = "";
    }, 200);
  });

  taskbarApp[a].addEventListener("mouseup", () => {
    taskbarApp[a].style.transform = "scale(1)";
    taskbarApp[a].style.animation = "taskbarrelease 0.2s";
    setTimeout(() => {
      taskbarApp[a].style.animation = "";
    }, 200);
  });
}

// selection rectangle

let selectionDiv = null;
let startX = 0,
  startYselection = 0;

document.addEventListener("mousedown", function (e) {
  if (e.button !== 0) return;

  if (e.target !== body) return;

  startX = e.pageX;
  startYselection = e.pageY;

  selectionDiv = document.createElement("div");
  selectionDiv.className = "selection-rectangle";
  selectionDiv.style.left = `${startX}px`;
  selectionDiv.style.top = `${startYselection}px`;
  selectionDiv.style.width = "0px";
  selectionDiv.style.height = "0px";
  document.body.appendChild(selectionDiv);

  function onMouseMove(e) {
    const x = Math.min(e.pageX, startX);
    const y = Math.min(e.pageY, startYselection);
    const w = Math.abs(e.pageX - startX);
    const h = Math.abs(e.pageY - startYselection);

    selectionDiv.style.left = `${x}px`;
    selectionDiv.style.top = `${y}px`;
    selectionDiv.style.width = `${w}px`;
    selectionDiv.style.height = `${h}px`;
  }

  function onMouseUp() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    if (selectionDiv) {
      selectionDiv.remove();
      selectionDiv = null;
    }
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

document.getElementById("newFolder").addEventListener("click", function () {
  let divApp = document.createElement("div");
  divApp.classList.add("app-desktop");
  divApp.dataset.id = "folder" + Date.now();
  divApp.dataset.title = "New Folder";
  
  let appShortcut = document.createElement("div");
  appShortcut.className = "app-shortcut";

  let folderNew = document.createElement("img");
  folderNew.src = "icon/folder.ico";
  folderNew.alt = "New Folder";
  folderNew.className = "app application";
  folderNew.id = "emptyFolder" + Date.now();

  let appName = document.createElement("span");
  appName.className = "app-name";
  appName.textContent = "New Folder";

  appShortcut.appendChild(folderNew);
  divApp.appendChild(appShortcut);
  divApp.appendChild(appName);

  // Append to the body alongside other desktop items (before shutdownTab so it stays behind overlays)
  const shutdownTab = document.getElementById("shutdownTab");
  if (shutdownTab) {
    document.body.insertBefore(divApp, shutdownTab);
  } else {
    document.body.appendChild(divApp);
  }

  // Double click opens the File Explorer
  divApp.addEventListener("dblclick", () => {
    if (typeof createWindow === 'function') {
      createWindow("New Folder", "explorer", "icon/folder.ico");
    }
  });

  // Make it selectable like other desktop apps
  divApp.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".app-desktop").forEach(app => app.classList.remove("active"));
    divApp.classList.add("active");
  });
});

// shutdown, sleep, and restart

const blackScreenDiv = document.createElement("div");
const blackScreenTextSpan = document.createElement("span");

function _showBlackScreen() {
  // Clean up any leftover state from a previous call before reusing the div
  blackScreenDiv.className = "";
  blackScreenDiv.style.cssText = "";
  blackScreenDiv.innerHTML = "";
  body.appendChild(blackScreenDiv);
  blackScreenDiv.classList.add("black-screen");
}

function shutdown() {
  _showBlackScreen();
  blackScreenDiv.appendChild(blackScreenTextSpan);
  blackScreenTextSpan.classList.add("black-screen-text");
  blackScreenTextSpan.textContent = "Shutting down";
  setTimeout(() => {
    blackScreenTextSpan.remove();
  }, 7000);
}

function sleep() {
  _showBlackScreen();
  blackScreenDiv.style.cursor = "none";
  setTimeout(() => {
    document.addEventListener("click", function wakeUp() {
      blackScreenDiv.style.cssText = "";
      blackScreenDiv.className = "";
      blackScreenDiv.remove();
      document.removeEventListener("click", wakeUp);
    });
  }, 100);
}

function restart() {
  // Phase 1: "Restarting" text on black screen
  _showBlackScreen();
  blackScreenTextSpan.className = "black-screen-text";
  blackScreenTextSpan.textContent = "Restarting";
  blackScreenDiv.appendChild(blackScreenTextSpan);

  // Phase 2: After 4s, switch to Windows logo + spinner (boot screen style)
  setTimeout(() => {
    blackScreenTextSpan.remove();

    // Build Windows logo
    const restartLogo = document.createElement("img");
    restartLogo.src = "icon/logo-windows-11-icon-1024.png";
    restartLogo.classList.add("booting-logo");
    restartLogo.style.position = "static";

    // Build spinner
    const spinnerDiv = document.createElement("div");
    spinnerDiv.classList.add("boot-spinner");
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement("div");
      dot.classList.add("boot-dot");
      spinnerDiv.appendChild(dot);
    }

    blackScreenDiv.style.flexDirection = "column";
    blackScreenDiv.style.gap = "60px";
    blackScreenDiv.appendChild(restartLogo);
    blackScreenDiv.appendChild(spinnerDiv);

    // Phase 3: Play startup sound then remove overlay
    setTimeout(() => {
      const audio = new Audio("sound/startup.wav");
      audio.play();
    }, 5000);

    setTimeout(() => {
      restartLogo.remove();
      spinnerDiv.remove();
      blackScreenDiv.className = "";
      blackScreenDiv.style.cssText = "";
      blackScreenDiv.remove();
    }, 7000);
  }, 4000);
}

// close, minimize, maximize

function closeTab(getElId) {
  document.getElementById(getElId).style.display = "none";
  document.getElementById(getElId).classList.add("close-anim");
  setTimeout(() => {
    document.getElementById(getElId).classList.remove("close-anim");
  }, 300);
}

function minimizeTab(getElId) {
  document.getElementById(getElId).style.transform = "scale(0.5)";
}

// Opening Window

// run path

function fileBrowse() {
  document.getElementById("runBrowse").click();
}

function writePath() {
  const fileInput = document.getElementById("runBrowse");
  const display = document.getElementById("runInput");

  if (fileInput.files.length > 0) {
    display.value = fileInput.files[0].name;
  }
}

// UAC Functions
let currentUacApp = null;

function promptUAC(app) {
  currentUacApp = app;
  const overlay = document.getElementById("uacOverlay");
  const appNameEl = document.getElementById("uacAppName");
  const appIconEl = document.getElementById("uacAppIcon");

  if (app === 'terminal') {
    appNameEl.innerText = "Windows Terminal";
    appIconEl.src = "icon/terminal.ico";
  } else {
    appNameEl.innerText = "Windows Command Processor";
    appIconEl.src = "icon/cmd.ico";
  }

  overlay.style.display = "flex";

  // Close start menu if open
  const startMenu = document.getElementById("startMenu");
  if (startMenu) {
    startMenu.classList.remove("menu-open");
    startMenu.style.bottom = "";
  }
}

function uacYes() {
  const overlay = document.getElementById("uacOverlay");
  overlay.style.display = "none";

  if (currentUacApp === 'terminal') {
    if (typeof openTerminalWindow === "function") {
      openTerminalWindow();
      setTimeout(() => {
        if (typeof windows !== "undefined" && windows['cmd'] && windows['cmd'].element) {
          const titleEls = windows['cmd'].element.querySelectorAll('.terminal-tab.active span');
          titleEls.forEach(el => {
            if (!el.innerText.startsWith('Administrator:')) {
              el.innerText = 'Administrator: ' + el.innerText;
            }
          });
        }
      }, 100);
    }
  }
}

function uacNo() {
  const overlay = document.getElementById("uacOverlay");
  overlay.style.display = "none";
}

// Dynamic Search Logic
const searchableApps = [
  { name: "Command Prompt", icon: "icon/cmd.ico", action: () => { if (typeof openTerminalWindow === "function") openTerminalWindow(); } },
  { name: "Windows PowerShell", icon: "icon/terminal.ico", action: () => { if (typeof openTerminalWindow === "function") openTerminalWindow(); } },
  { name: "Run", icon: "icon/run.ico", fallbackIcon: "icon/cmd.ico", action: () => { const rp = document.getElementById("runProgram"); if (rp) rp.style.display = "block"; } },
  {
    name: "Shutdown Menu", icon: "icon/shutdown.ico", fallbackIcon: "icon/start2.ico", action: () => {
      const sm = document.getElementById("shutDownMenu");
      const startMenu = document.getElementById("startMenu");
      if (startMenu) {
          startMenu.classList.remove("menu-open");
          startMenu.style.bottom = "";
      }
      if (sm) sm.style.display = sm.style.display === "block" ? "none" : "block";
    }
  },
  { name: "Task Manager", icon: "icon/taskmgr.ico", fallbackIcon: "icon/cmd.ico", action: () => { if (typeof openTaskManagerWindow === "function") openTaskManagerWindow(); } },
  { name: "File Explorer", icon: "icon/explorer.ico", action: () => { console.log("Open File Explorer"); } },
  { name: "Settings", icon: "icon/settings.ico", action: () => { console.log("Open Settings"); } },
  { name: "Microsoft Edge", icon: "icon/edge.ico", action: () => { if (typeof openEdgeWindow === "function") openEdgeWindow(); } },
];

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchMenuInput");
  const searchBody = document.getElementById("searchMenuBody");
  const searchResults = document.getElementById("searchResultsContainer");
  const searchMenu = document.getElementById("searchMenu");

  if (searchInput && searchBody && searchResults) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();

      if (query.length > 0) {
        searchBody.style.display = "none";
        searchResults.style.display = "flex";

        const filtered = searchableApps.filter(app => app.name.toLowerCase().includes(query));

        searchResults.innerHTML = "";

        if (filtered.length === 0) {
          searchResults.innerHTML = `<div style="color: #aaa; text-align: center; margin-top: 20px;">No results found for '${query}'</div>`;
        } else {
          filtered.forEach(app => {
            const item = document.createElement("div");
            item.className = "search-result-item";
            item.innerHTML = `
              <img src="${app.icon}" onerror="this.src='${app.fallbackIcon || 'icon/cmd.ico'}'" />
              <span>${app.name}</span>
            `;
            item.addEventListener("click", () => {
              app.action();
              searchMenu.classList.remove("menu-open");
              searchMenu.style.display = "none";
              searchInput.value = "";
              searchBody.style.display = "flex";
              searchResults.style.display = "none";
            });
            searchResults.appendChild(item);
          });
        }
      } else {
        searchBody.style.display = "flex";
        searchResults.style.display = "none";
      }
    });
  }
});

// Tray and Quick Settings Toggle Logic
const trayBtn = document.getElementById("trayBtn");
const trayContent = document.getElementById("trayContent");
if (trayBtn && trayContent) {
  trayBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    trayContent.classList.toggle("show");
  });
}

const quickSettingsBtn = document.getElementById("quickSettingsBtn");
const quickSettings = document.getElementById("quickSettings");
if (quickSettingsBtn && quickSettings) {
  quickSettingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    quickSettings.classList.toggle("show");
  });
}

// Close when clicking outside
document.addEventListener("click", (e) => {
  if (trayContent && trayContent.classList.contains("show") && !trayBtn.contains(e.target) && !trayContent.contains(e.target)) {
    trayContent.classList.remove("show");
  }
  if (quickSettings && quickSettings.classList.contains("show") && !quickSettingsBtn.contains(e.target) && !quickSettings.contains(e.target)) {
    quickSettings.classList.remove("show");
  }
});

