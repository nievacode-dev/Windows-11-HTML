# Windows 11 Web Experience

**Version 25H2 (OS Build 26200.8655)**

Welcome to a fully interactive, online recreation of **Windows 11 (24H2 / 25H2)**! This project brings the modern desktop experience straight to your browser, built entirely with vanilla **HTML, CSS, and JavaScript**. 

<div align="center">

![Windows 11 Logo](/references/win11_bl.png)

![Windows 11](/references/windows-11-screenshots_21xa.jpg)

</div>

## Key Features

### 🖥️ Desktop & Shell Experience
* **Lock Screen with Swipe-to-Unlock:** Dynamic lock screen showing real-time system clock and date. Supports drag/swipe-up pointer gestures to unlock and access the login dashboard.
* **Centered Taskbar & Start Menu:** Centered taskbar with active application indicator bars and thumbnail previews on hover. Start Menu includes search functionality, pinned apps, alphabetical "All Apps" drawer, user profile, and power controls.
* **Widgets Panel:** Slides out dynamically to show active widgets directly from the taskbar icon.
* **Search Menu:** Responsive searching interface complete with quick searches (Focus, Sound, Bluetooth, Display settings) and top app shortcuts.
* **Quick Settings Panel:** Access toggles for Wi-Fi, Bluetooth, Airplane Mode, Battery Saver, Night Light, and Accessibility. Includes interactive brightness and volume range sliders and a battery life indicator.
* **Tray, Date, & Time:** Working tray showing background app icons, ENG language selector, and calendar popup.
* **Desktop Context Menu (Right-Click):**
  * **View Settings:** Toggle Large/Medium/Small desktop icons, auto-arrange icons, and align-to-grid.
  * **Sorting:** Sort desktop items by name, size, type, or date modified.
  * **New Item creation:** Create folder, shortcuts, bitmaps, Microsoft Office (Word, Excel, PowerPoint) documents, ZIP archives, Google Docs/Sheets/Slides, and Python files.
  * **Desktop Folder Renaming:** Rename folders directly on the desktop using context menus or inline title editing.

### 🪟 Window Management & Snapping Engine
* **Interactive Window Controls:** Drag, resize, minimize, maximize, and close system windows. Includes smooth, springy entry and minimization animation transitions.
* **Windows 11 Snap Layouts:** Hovering over any window's Maximize button displays the snap grid popup with **6 layout grids** (equal halves, 60/40, three columns, halves & quarters, 4 quadrants, and 25/50/25 splits).
* **Pointer Snapping & Previews:** Dragging any window to the edges/corners triggers a translucent visual snap preview. Releasing snaps the window instantly.
* **Snap Assist:** Automatically prompts a window selector overlay in the remaining space of a snapped layout, enabling you to choose another running app to fill the grid.
* **Maximized Pull-Restore:** Dragging a maximized window down from the top edge restores its original size and attaches it to the cursor coordinates.
* **Universal Dragging Utility:** A unified class that provides smooth header-based dragging and custom z-indexing for retro dialogs and prompts.

### 🛠️ Built-in System Applications
* **Windows Terminal (Command Prompt):** Fully interactive shell console supporting multi-tab instances and custom command logic.
* **Task Manager:** 
  * **Processes:** Live table showing running system threads, with column sorting support for CPU, Memory, Disk, Network, and GPU usage.
  * **Performance Monitor:** Real-time updating canvas graphs for CPU (Intel Core i9-14900K), RAM (16GB DDR5), SSD, Wi-Fi, and GPU (NVIDIA RTX 5090) metrics.
* **Microsoft Edge:** Streamlined to render standard web pages within a secure desktop window interface.
* **Settings:** Change theme options (Light / Dark Mode) with persistent storage via `localStorage`.
* **Run Prompt (`Win + R`):** Fully interactive Run dialog that parses commands, triggers native file browse menus, and raises error boxes.
* **About Windows (`winver`):** Classic version panel showing build details.
* **Shut Down Windows:** Retro dialog prompting options to Sleep, Restart, or Shutdown the web OS.

### 🛡️ System Guard & Diagnostics
* **User Account Control (UAC):** Interactive alert prompting user confirmation for administrative permissions (e.g. when launching Admin terminal).
* **Resolution Guard:** Prompts a mobile-blocker warning if your screen width is below 1366px, recommending a desktop viewport (16:9 ratio).

---

### Get Involved!
Whether you're fixing bugs, adding new apps, or refining the UI—your help is welcome! **Feel free to contribute** and be part of this awesome web OS journey.
