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

const terminal = document.getElementById("terminal");
const history = document.getElementById("history");
const input = document.getElementById("command-input");
const prompt = document.getElementById("prompt");

function addHistoryEntry(text) {
  const entry = document.createElement("div");
  entry.textContent = text;
  history.appendChild(entry);
  terminal.scrollTop = terminal.scrollHeight;
}

function updatePrompt() {
  prompt.textContent = getCurrentPath() + ">";
}
updatePrompt();

input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const commandLine = input.value.trim();
    if (!commandLine) {
      input.value = "";
      return;
    }

    addHistoryEntry(getCurrentPath() + "> " + commandLine);

    commandHistory.push(commandLine);
    historyIndex = commandHistory.length;

    const [cmd, ...args] = commandLine.split(" ");

    if (commands.hasOwnProperty(cmd.toLowerCase())) {
      const output = await commands[cmd.toLowerCase()](args);
      if (output) addHistoryEntry(output);
      updatePrompt();
    } else {
      addHistoryEntry(
        `'${cmd}' is not recognized as an internal or external command.`
      );
    }

    input.value = "";
    terminal.scrollTop = terminal.scrollHeight;
  } else if (e.key === "ArrowUp") {
    if (commandHistory.length === 0) return;
    if (historyIndex > 0) {
      historyIndex--;
      input.value = commandHistory[historyIndex];
    } else if (historyIndex === 0) {
      input.value = commandHistory[0];
    }
    setTimeout(
      () => input.setSelectionRange(input.value.length, input.value.length),
      0
    );
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    if (commandHistory.length === 0) return;
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      input.value = commandHistory[historyIndex];
    } else {
      historyIndex = commandHistory.length;
      input.value = "";
    }
    setTimeout(
      () => input.setSelectionRange(input.value.length, input.value.length),
      0
    );
    e.preventDefault();
  }
});

// document.onclick = function () {
//   setTimeout(() => {
//     document.getElementById("cmd").style.display = "block";
//     setTimeout(() => {
//       closeTab('cmd');
//     }, 220);
//   }, 2000);
// }