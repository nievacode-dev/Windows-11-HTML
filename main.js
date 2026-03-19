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

// searchIcon.onclick = function (event) {
//   if (searchMenu.style.display === "none" || searchMenu.style.display === "") {
//     searchMenu.style.display = "block";
//     if (event.target === body && startMenu.style.display === "block") {
//       startMenu.style.display = "none";
//       startMenu.classList.add("slidedown-anim");
//       setTimeout(() => {
//         startMenu.classList.remove("slidedown-anim");
//       }, 300);
//     }
//   } else {
//     searchMenu.style.display = "none";
//     searchMenu.classList.add("slidedown-anim");
//     setTimeout(() => {
//       searchMenu.classList.remove("slidedown-anim");
//     }, 300);
//   }
// };

startLogo.addEventListener("click", function () {
  startMenu.classList.toggle("menu-open");
});

searchIcon.addEventListener("click", function () {
  searchMenu.classList.toggle("menu-open");
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
  const recycleBinMenu = document.getElementById("recycleBinMenu");
  if (
    recycleBin.getAttribute("src") ===
    "/Windows_11_24H2/icon/recyclebinfull.ico"
  ) {
    emptyBin.style.opacity = "1";

    recycleBinMenu.style.display = "block";
    recycleBinMenu.style.left = event.pageX + "px";
    recycleBinMenu.style.top = event.pageY + "px";
  } else {
    emptyBin.style.opacity = "0.3";

    recycleBinMenu.style.display = "block";
    recycleBinMenu.style.left = event.pageX + "px";
    recycleBinMenu.style.top = event.pageY + "px";
  }
});

const emptyBin = document.getElementById("emptyBin");
emptyBin.onclick = function () {
  recycleBin.src = "/Windows_11_24H2/icon/recyclebinempty.ico";
};

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
  document.getElementById(getTagId).classList.add("close-anim");
  document.getElementById("runInput").select();
  setTimeout(() => {
    document.getElementById(getTagId).classList.remove("close-anim");
  }, 300);
}

document.getElementById("refresh").onclick = function () {
  // window.location.reload();
  document.getElementById("newApps").style.display = "none";
  setTimeout(() => {
    document.getElementById("newApps").style.display = "block";
  }, 50);
};

const trayBtn = document.getElementById("trayBtn");
const trayContent = document.getElementById("trayContent");
const trayIco = document.getElementById("trayIco");
trayBtn.onclick = function () {
  if (
    trayContent.style.display === "" ||
    trayContent.style.display === "none"
  ) {
    trayContent.style.display = "flex";
    trayBtn.style.backgroundColor = "rgba(80, 80, 80, 0.4)";
    trayIco.innerHTML = "&#xe972;";
    trayIco.style.animation = "tray 0.2s reverse";
    setTimeout(() => {
      trayIco.style.animation = "";
      trayContent.style.animation = "";
    }, 200);
  } else {
    document.addEventListener("click", function (e) {
      if (
        e.target !== trayBtn &&
        e.target !== trayContent &&
        e.target !== trayIco &&
        trayContent.style.display === "flex"
      ) {
        trayContent.style.display = "none";
        trayIco.innerHTML = "&#xe971;";
        trayBtn.style.backgroundColor = "";
        trayIco.style.animation = "trayreverse";
        trayIco.style.animationDuration = "0.2s";
        trayIco.style.animationDirection = "reverse";
        trayContent.style.animation = "trayclose";
        trayContent.style.animationDuration = "0.2s";
        setTimeout(() => {
          trayIco.style.animation = "";
          trayContent.style.animation = "";
        }, 200);
      }
    });
    trayContent.style.display = "none";
    trayContent.style.animation = "trayclose";
    trayContent.style.animationDuration = "0.2s";
    trayIco.innerHTML = "&#xe971;";
    trayBtn.style.backgroundColor = "";
    trayIco.style.animation = "trayreverse";
    trayIco.style.animationDuration = "0.2s";
    trayIco.style.animationDirection = "reverse";
    setTimeout(() => {
      trayIco.style.animation = "";
      trayContent.style.animation = "";
    }, 250);
  }
};

const contextMenu = document.getElementById("contextMenu");
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();

  contextMenu.style.display = "block";
  contextMenu.style.left = e.pageX + "px";
  contextMenu.style.top = e.pageY + "px";
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
    document.getElementById("aboutTab").style.display = "block";
    runProgram.style.display = "none";
    runProgram.classList.add("close-anim");
    setTimeout(() => {
      runProgram.classList.remove("close-anim");
    }, 300);
  } else if (runInput.value === "binexe") {
    runProgram.style.display = "none";
    runProgram.classList.add("close-anim");
    setTimeout(() => {
      runProgram.classList.remove("close-anim");
    }, 300);
  } else if (runInput.value === "cmd") {
    document.getElementById("cmd").style.display = "block";
    runProgram.style.display = "none";
    runProgram.classList.add("close-anim");
    setTimeout(() => {
      runProgram.classList.remove("close-anim");
    }, 300);
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
    runProgram.classList.add("close-anim");
    setTimeout(() => {
      runProgram.classList.remove("close-anim");
    }, 300);
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
  // document.onclick = () => {
  //   const startUp = new Audio("sound/startup.wav");
  //   setTimeout(function () {
  //     startUp.play();
  //   }, 1000);
  //   booting();
  // };
  getDates();
  getTime();
  // startWindows();
};

// function startWindows() {
//   const clickMeDiv = document.createElement("div");
//   body.appendChild(clickMeDiv);
//   clickMeDiv.classList.add("black-screen");
//   clickMeDiv.classList.add("start-windows");
//   clickMeDiv.textContent = "Click me to start.";
// }

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
  const newApps = document.getElementById("newApps");
  let folderNew = document.createElement("img");
  let divApp = document.createElement("div");
  let appName = document.createElement("span");
  folderNew.src = "/Windows_11_24H2/icon/folder.ico";
  divApp.classList.add("app-desktop");
  divApp.classList.add("app");
  divApp.appendChild(folderNew);
  appName.classList.add("app-name");
  appName.innerHTML = "New Folder";
  folderNew.classList.add("application");
  folderNew.classList.add("app");
  folderNew.id = "emptyFolder";
  newApps.appendChild(divApp);
  divApp.appendChild(appName);
});

// shutdown, sleep, and restart

const blackScreenDiv = document.createElement("div");
const blackScreenTextSpan = document.createElement("span");

function shutdown() {
  body.appendChild(blackScreenDiv);
  blackScreenDiv.classList.add("black-screen");
  blackScreenDiv.appendChild(blackScreenTextSpan);
  blackScreenTextSpan.classList.add("black-screen-text");
  blackScreenTextSpan.textContent = "Shutting down";
  setTimeout(() => {
    blackScreenTextSpan.remove();
  }, 7000);
}

function sleep() {
  body.appendChild(blackScreenDiv);
  blackScreenDiv.classList.add("black-screen");
  blackScreenDiv.style.cursor = "none";
  setTimeout(() => {
    document.addEventListener("click", () => {
      blackScreenDiv.remove();
    });
  }, 100);
}

function restart() {
  body.appendChild(blackScreenDiv);
  blackScreenDiv.classList.add("black-screen");
  blackScreenDiv.appendChild(blackScreenTextSpan);
  blackScreenTextSpan.classList.add("black-screen-text");
  blackScreenTextSpan.textContent = "Restarting";
  setTimeout(() => {
    blackScreenTextSpan.remove();
  }, 7000);
  setTimeout(() => {
    const audio = new Audio("sound/startup.wav");
    audio.play();
  }, 12000);
  setTimeout(() => {
    blackScreenDiv.remove();
  }, 14000);
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
