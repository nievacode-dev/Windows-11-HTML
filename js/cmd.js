const fileSystem = {
  name: "C:",
  type: "dir",
  parent: null,
  children: [
    {
      name: "Windows",
      type: "dir",
      parent: null,
      children: [
        {
          name: "System32",
          type: "dir",
          parent: null,
          children: [
            { name: "file1.txt", type: "file" },
            { name: "file2.log", type: "file" },
            { name: "docs", type: "dir", parent: null, children: []},
          ],
        },
        {
          name: "SoftwareDistribution",
          type: "dir",
          parent: null,
          children: []
        }
      ],
    },
  ],
};

function setParents(dir) {
  if (!dir.children) return;
  for (const child of dir.children) {
    child.parent = dir;
    if (child.type === "dir") setParents(child);
  }
}
setParents(fileSystem);

let currentDir = fileSystem.children[0].children[0]; // c:/test/user

function getCurrentPath() {
  let parts = [];
  let dir = currentDir;
  while (dir) {
    if (dir.name === "C:") break;
    parts.unshift(dir.name);
    dir = dir.parent;
  }
  return "C:/" + parts.join("/");
}

// Command history
const commandHistory = [];
let historyIndex = -1;

// Helper: find child by name (case-insensitive)
function findChild(dir, name) {
  return dir.children.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

// Helper: remove child by reference from parent's children array
function removeChild(parent, child) {
  const idx = parent.children.indexOf(child);
  if (idx >= 0) parent.children.splice(idx, 1);
}

// Helper: prompt user for confirmation (returns Promise)
function promptConfirm(question) {
  return new Promise((resolve) => {
    const answer = window.prompt(question + " (y/n):");
    resolve(answer && answer.toLowerCase().startsWith("y"));
  });
}

// Recursive delete function with options
async function rmRecursive(target, options) {
  if (target.type === "file") {
    if (options.interactive) {
      const ok = await promptConfirm(`Remove file '${target.name}'?`);
      if (!ok) return false;
    }
    removeChild(target.parent, target);
    return true;
  } else if (target.type === "dir") {
    if (target.children.length > 0) {
      if (!options.recursive) {
        throw new Error(`Cannot remove '${target.name}': Directory not empty.`);
      }
      // Recursively delete children
      for (const child of [...target.children]) {
        const success = await rmRecursive(child, options);
        if (!success) return false; // if user declined interactive prompt
      }
    }
    if (options.interactive) {
      const ok = await promptConfirm(`Remove directory '${target.name}'?`);
      if (!ok) return false;
    }
    removeChild(target.parent, target);
    return true;
  }
}

const commands = {
  help: () => {
    return (
      "Available commands:\n" +
      "help   - Show this help message\n" +
      "echo   - Display messages\n" +
      "clear  - Clear the terminal screen\n" +
      "color  - Change text color (e.g. color red or color #ff0000)\n" +
      "dir    - Show directory listing\n" +
      "ls     - List files and directories\n" +
      "mkdir  - Create a directory\n" +
      "cd     - Change directory\n" +
      "rm     - Remove files or directories\n\n" +
      "rm usage:\n" +
      "rm [-r|-rf] [-i] <name> ...\n" +
      "-r : recursive delete directories\n" +
      "-f : force (ignored here, no error on missing files)\n" +
      "-i : interactive, confirm before each deletion"
    );
  },

  echo: (args) => args.join(" "),

  clear: () => {
    document.getElementById("history").innerHTML = "";
    return "";
  },

  color: (args) => {
    if (!args.length) return "Usage: color [colorname|hex]";
    const colorInput = args[0].toLowerCase();
    const isValidColor = (color) => {
      const s = new Option().style;
      s.color = color;
      return s.color !== "";
    };
    if (isValidColor(colorInput)) {
      // document.body.style.color = colorInput;
      document.getElementById("terminal").style.color = colorInput;
      return `Text color changed to ${colorInput}`;
    } else {
      return `'${colorInput}' is not a valid color`;
    }
  },

  dir: async () => {
    input.disabled = true;
    const lines = [];
    lines.push(` Volume in drive C has no label.`);
    lines.push(` Volume Serial Number is 1234-ABCD`);
    lines.push("");
    lines.push(` Directory of ${getCurrentPath().replace(/\//g, "\\")}`);
    lines.push("");

    for (const item of currentDir.children) {
      const date = "06/09/2025  11:00 AM";
      const size =
        item.type === "dir"
          ? "<DIR>"
          : (Math.floor(Math.random() * 10000) + 1000).toLocaleString();
      lines.push(`${date}    ${size.toString().padEnd(12)} ${item.name}`);
      // await new Promise((r) => setTimeout(r, 80));
      addHistoryEntry(lines[lines.length - 1]);
    }

    input.disabled = false;
    input.focus();
    return "";
  },

  ls: () => {
    if (!currentDir.children.length) return "(empty)";
    return currentDir.children
      .map((i) => i.name + (i.type === "dir" ? "/" : ""))
      .join("  ");
  },

  mkdir: (args) => {
    if (!args.length) return "Usage: mkdir [directory_name]";
    const dirName = args[0];
    if (findChild(currentDir, dirName)) {
      return `A file or directory with the name '${dirName}' already exists.`;
    }
    currentDir.children.push({
      name: dirName,
      type: "dir",
      children: [],
      parent: currentDir,
    });
    return `Directory '${dirName}' created.`;
  },

  cd: (args) => {
    if (!args.length) return getCurrentPath();

    let target = args[0];
    if (target === "." || target === "") {
      return "";
    }
    if (target === "..") {
      if (currentDir.parent && currentDir.parent.name !== "c:") {
        currentDir = currentDir.parent;
      }
      return "";
    }

    const found = findChild(currentDir, target);
    if (found && found.type === "dir") {
      currentDir = found;
      return "";
    } else {
      return `The system cannot find the path specified: ${target}`;
    }
  },

  rm: async (args) => {
    if (!args.length) return "Usage: rm [-r|-rf] [-i] <name> ...";

    // Parse flags and targets
    let recursive = false;
    let interactive = false;
    const targets = [];

    for (const arg of args) {
      if (arg === "-r" || arg === "-rf" || arg === "-fr") {
        recursive = true;
      } else if (arg === "-i") {
        interactive = true;
      } else if (arg.startsWith("-")) {
        return `rm: invalid option '${arg}'`;
      } else {
        targets.push(arg);
      }
    }

    if (targets.length === 0) {
      return "rm: missing operand";
    }

    for (const name of targets) {
      const target = findChild(currentDir, name);
      if (!target) {
        addHistoryEntry(
          `rm: cannot remove '${name}': No such file or directory`
        );
        continue;
      }

      try {
        await rmRecursive(target, { recursive, interactive });
        addHistoryEntry(`Removed '${name}'`);
      } catch (err) {
        addHistoryEntry(`rm: cannot remove '${name}': ${err.message}`);
      }
    }

    return "";
  },
};

// ===================================
// TERMINAL MANAGER (MULTI-TAB LOGIC)
// ===================================

const terminalContainer = document.getElementById("cmd");
const terminalBody = document.getElementById("terminalBody");
const tabsContainer = document.getElementById("terminalTabsContainer");
const newTabBtn = document.getElementById("newTabBtn");

let terminalSessions = {};
let activeSessionId = null;
let tabCounter = 0;

// Boilerplate messages for PowerShell/Terminal feel
const TERMINAL_WELCOME = `Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows
`;

function createTerminalTab() {
  tabCounter++;
  const sessionId = `term-session-${tabCounter}`;
  
  // 1. Create Data Model
  terminalSessions[sessionId] = {
    id: sessionId,
    history: [],
    historyIndex: -1,
    currentDir: fileSystem.children[0].children[0], // Start in c:/Windows/System32 usually
    tabElement: null,
    sessionElement: null,
    inputElement: null,
    historyElement: null,
    promptElement: null
  };
  
  const ctx = terminalSessions[sessionId];
  
  // 2. Create UI Tab
  const tabBtn = document.createElement("div");
  tabBtn.classList.add("terminal-tab");
  tabBtn.innerHTML = `
    <div class="terminal-tab-inner">
      <img src="icon/terminal.ico" class="terminal-tab-icon" onerror="this.src='icon/cmd.ico'" />
      <span>Windows PowerShell</span>
    </div>
    <div class="terminal-tab-close"><span>×</span></div>
  `;
  
  // Tab click activates session
  tabBtn.addEventListener("pointerdown", (e) => {
    // Only switch if we didn't click close
    if (!e.target.closest('.terminal-tab-close')) {
      switchTerminalTab(sessionId);
    }
  });
  
  // Close click
  const closeBtn = tabBtn.querySelector(".terminal-tab-close");
  closeBtn.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    closeTerminalTab(sessionId);
  });
  
  // Insert before the new tab button
  tabsContainer.insertBefore(tabBtn, newTabBtn);
  ctx.tabElement = tabBtn;
  
  // 3. Create Session DOM
  const sessionDiv = document.createElement("div");
  sessionDiv.classList.add("terminal-session");
  
  sessionDiv.innerHTML = `
    <div class="terminal-history">
       <div>${TERMINAL_WELCOME}</div>
    </div>
    <div class="terminal-input-line">
      <span class="terminal-prompt"></span>
      <input type="text" class="terminal-input" autocomplete="off" spellcheck="false" />
    </div>
  `;
  
  ctx.historyElement = sessionDiv.querySelector(".terminal-history");
  ctx.promptElement = sessionDiv.querySelector(".terminal-prompt");
  ctx.inputElement = sessionDiv.querySelector(".terminal-input");
  
  // Attach Key Events to Input
  ctx.inputElement.addEventListener("keydown", (e) => handleTerminalInput(e, sessionId));
  
  // Click anywhere in session focuses input
  sessionDiv.addEventListener("click", () => ctx.inputElement.focus());
  
  terminalBody.appendChild(sessionDiv);
  ctx.sessionElement = sessionDiv;
  
  // Initialize Prompt
  updateSessionPrompt(sessionId);
  
  // Switch to new tab
  switchTerminalTab(sessionId);
  
  return sessionId;
}

function switchTerminalTab(sessionId) {
  // Remove active from old
  if (activeSessionId && terminalSessions[activeSessionId]) {
    const oldCtx = terminalSessions[activeSessionId];
    oldCtx.tabElement.classList.remove("active");
    oldCtx.sessionElement.classList.remove("active");
  }
  
  // Set new active
  activeSessionId = sessionId;
  const newCtx = terminalSessions[sessionId];
  newCtx.tabElement.classList.add("active");
  newCtx.sessionElement.classList.add("active");
  
  // Give focus slightly delayed to ensure display block is processed
  setTimeout(() => {
    newCtx.inputElement.focus();
    newCtx.sessionElement.scrollTop = newCtx.sessionElement.scrollHeight;
  }, 10);
}

function closeTerminalTab(sessionId) {
  const ctx = terminalSessions[sessionId];
  
  // Remove UI
  ctx.tabElement.remove();
  ctx.sessionElement.remove();
  delete terminalSessions[sessionId];
  
  const remainingIds = Object.keys(terminalSessions);
  if (remainingIds.length === 0) {
    // No tabs left, close window
    closeTerminalWindow();
  } else if (activeSessionId === sessionId) {
    // We closed active tab, switch to last available tab
    switchTerminalTab(remainingIds[remainingIds.length - 1]);
  }
}

// Global Terminal Controls
function openTerminalWindow() {
  if (terminalContainer.style.display !== "flex") {
    // If no tabs exist (first open), create one
    if (Object.keys(terminalSessions).length === 0) {
      createTerminalTab();
    }
    
    terminalContainer.style.setProperty("display", "flex", "important");
    
    // Register it as a window for interaction engine if it wasn't already
    if (!windows['cmd']) {
       windows['cmd'] = {
          element: terminalContainer,
          isMaximized: false,
          isMinimized: false,
          appTitle: "Windows Terminal",
          appIcon: "icon/terminal.ico",
          x: parseInt(terminalContainer.style.left) || 150,
          y: parseInt(terminalContainer.style.top) || 100,
          width: 900,
          height: 550,
          originalState: null,
          taskbarElement: null
       };
       
       const dragHandle = terminalContainer.querySelector(".terminal-drag-region");
       const resizeHan = terminalContainer.querySelector(".window-resize");
       makeWindowInteractive('cmd', dragHandle, resizeHan);
       createTaskbarItem('cmd');
    } else if (!windows['cmd'].taskbarElement) {
       // if we reused window but closed taskbar
       createTaskbarItem('cmd');
    }
    
    updateZIndex('cmd');
    
    // Focus active tab input
    if (activeSessionId && terminalSessions[activeSessionId]) {
      setTimeout(() => terminalSessions[activeSessionId].inputElement.focus(), 50);
    }
  } else {
     // If minimizing logic applies, it's handled via taskbar item click in window-mode.js
     updateZIndex('cmd');
  }
}

function closeTerminalWindow() {
  // We don't actually destroy the container, just hide to simulate closing
  closeWindow('cmd');
  // Optional: clear out sessions if you want it to restart fresh next time.
  Object.keys(terminalSessions).forEach(id => {
      terminalSessions[id].tabElement.remove();
      terminalSessions[id].sessionElement.remove();
  });
  terminalSessions = {};
  activeSessionId = null;
  tabCounter = 0;
}

// Event Listeners for + button
newTabBtn.addEventListener("pointerdown", (e) => {
  e.stopPropagation();
  createTerminalTab();
});


// ===================================
// TERMINAL COMMAND PARSING & CONTEXT
// ===================================

function getSessionPath(sessionId) {
  const dir = terminalSessions[sessionId].currentDir;
  let parts = [];
  let current = dir;
  while (current) {
    if (current.name === "C:") break;
    parts.unshift(current.name);
    current = current.parent;
  }
  return "PS C:\\" + parts.join("\\");
}

function updateSessionPrompt(sessionId) {
  const ctx = terminalSessions[sessionId];
  ctx.promptElement.textContent = getSessionPath(sessionId) + ">";
}

function addToSessionHistory(sessionId, text) {
  const ctx = terminalSessions[sessionId];
  const entry = document.createElement("div");
  entry.textContent = text;
  ctx.historyElement.appendChild(entry);
  
  // Scroll
  ctx.sessionElement.scrollTop = ctx.sessionElement.scrollHeight;
}

async function handleTerminalInput(e, sessionId) {
  const ctx = terminalSessions[sessionId];
  
  if (e.key === "Enter") {
    e.preventDefault();
    const commandLine = ctx.inputElement.value.trim();
    
    if (!commandLine) {
      // Just print empty prompt
      addToSessionHistory(sessionId, getSessionPath(sessionId) + "> ");
      ctx.inputElement.value = "";
      ctx.sessionElement.scrollTop = ctx.sessionElement.scrollHeight;
      return;
    }

    addToSessionHistory(sessionId, getSessionPath(sessionId) + "> " + commandLine);

    ctx.history.push(commandLine);
    ctx.historyIndex = ctx.history.length;

    const [cmdStr, ...args] = commandLine.split(" ");
    const cmd = cmdStr.toLowerCase();

    // Since our existing commands rely on global `currentDir`, 
    // we must temporarily swap the global reference for execution
    const tempGlobalDir = currentDir;
    currentDir = ctx.currentDir;

    if (commands.hasOwnProperty(cmd)) {
      // Execute
      try {
        const output = await commands[cmd](args);
        if (output) addToSessionHistory(sessionId, output);
      } catch (err) {
        addToSessionHistory(sessionId, "Error: " + err.message);
      }
      
      // Some commands change the currentDir (e.g., cd)
      // Save it back to the context
      ctx.currentDir = currentDir;
      updateSessionPrompt(sessionId);
    } else {
      addToSessionHistory(sessionId, `${cmdStr} : The term '${cmdStr}' is not recognized as the name of a cmdlet, function, script file, or operable program.`);
    }

    // Restore globals just in case
    currentDir = tempGlobalDir;

    ctx.inputElement.value = "";
    ctx.sessionElement.scrollTop = ctx.sessionElement.scrollHeight;
    
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (ctx.history.length === 0) return;
    if (ctx.historyIndex > 0) {
      ctx.historyIndex--;
      ctx.inputElement.value = ctx.history[ctx.historyIndex];
    } else if (ctx.historyIndex === 0) {
      ctx.inputElement.value = ctx.history[0];
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (ctx.history.length === 0) return;
    if (ctx.historyIndex < ctx.history.length - 1) {
      ctx.historyIndex++;
      ctx.inputElement.value = ctx.history[ctx.historyIndex];
    } else {
      ctx.historyIndex = ctx.history.length;
      ctx.inputElement.value = "";
    }
  }
}