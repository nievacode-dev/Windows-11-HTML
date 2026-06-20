// js/task-manager.js

const tmWindow = document.getElementById("taskManagerWindow");
let tmUpdateInterval = null;
let tmChartInterval = null;

// --- Graph Data & Rendering Setup ---
// We keep an array of 60 points for 60 seconds of history
const graphDataCpu = new Array(60).fill(0);
const graphDataMem = new Array(60).fill(0);
const graphDataDisk = new Array(60).fill(0);
const graphDataWifi = new Array(60).fill(0);
const graphDataGpu = new Array(60).fill(0);
let currentCpu = 10;
let currentMem = 25; // representing percent
let currentDisk = 0;
let currentWifi = 0;
let currentGpu = 2;
let timeStep = 0;

// Processes
const baseProcesses = [
    { name: "System Idle Process", icon: "icon/explorer.ico", cpu: 85, mem: 0.1, disk: 0, net: 0, gpu: 0 },
    { name: "System", icon: "icon/explorer.ico", cpu: 1.2, mem: 4.5, disk: 0.1, net: 0, gpu: 0 },
    { name: "Desktop Window Manager", icon: "icon/explorer.ico", cpu: 0.8, mem: 120, disk: 0, net: 0, gpu: 2.1 },
    { name: "Windows Explorer", icon: "icon/explorer.ico", cpu: 0.5, mem: 85, disk: 0, net: 0, gpu: 0.1 },
    { name: "Microsoft Edge", icon: "icon/edge.ico", cpu: 2.5, mem: 450, disk: 0, net: 1.2, gpu: 1.5 },
    { name: "Settings", icon: "icon/settings.ico", cpu: 0, mem: 45, disk: 0, net: 0, gpu: 0 },
    { name: "Windows Terminal", icon: "icon/cmd.png", cpu: 0.1, mem: 60, disk: 0, net: 0, gpu: 0.2 },
    { name: "Antimalware Service Executable", icon: "icon/defender.ico", cpu: 1.5, mem: 150, disk: 2.5, net: 0, gpu: 0 },
    { name: "Task Manager", icon: "icon/taskview2.ico", cpu: 2.1, mem: 60, disk: 0.1, net: 0, gpu: 0.5 },
    { name: "Registry", icon: "icon/explorer.ico", cpu: 0, mem: 35, disk: 0, net: 0, gpu: 0 },
    { name: "WMI Provider Host", icon: "icon/explorer.ico", cpu: 0.1, mem: 15, disk: 0, net: 0, gpu: 0 },
    { name: "Service Host: Local System", icon: "icon/explorer.ico", cpu: 0.2, mem: 80, disk: 0.1, net: 0.1, gpu: 0 }
];

let processes = [...baseProcesses];
let currentSort = { col: 'cpu', asc: false };

// --- Window Management Hooks ---
window.openTaskManagerWindow = function() {
    const isHidden = !tmWindow.classList.contains('tm-visible');

    if (isHidden) {
        tmWindow.classList.remove('hidden', 'minimizing');
        tmWindow.classList.add('tm-visible');

        if (!windows['taskManager']) {
            windows['taskManager'] = {
                element: tmWindow,
                isMaximized: false,
                isMinimized: false,
                appTitle: "Task Manager",
                appIcon: "icon/taskview2.ico",
                x: parseInt(tmWindow.style.left) || 150,
                y: parseInt(tmWindow.style.top) || 80,
                width: 800,
                height: 600,
                originalState: null,
                taskbarElement: null,
                desktopId: typeof activeDesktopId !== 'undefined' ? activeDesktopId : 1
            };

            const dragHandle = tmWindow.querySelector(".tm-drag-region");
            const resizeHan = tmWindow.querySelector(".window-resize");
            makeWindowInteractive('taskManager', dragHandle, resizeHan);
        }

        if (!windows['taskManager'].taskbarElement) {
            createTaskbarItem('taskManager');
        }

        updateZIndex('taskManager');
        startTaskManagerUpdates();
    } else {
        if (windows['taskManager'] && windows['taskManager'].isMinimized) {
            minimizeWindow('taskManager');
        } else {
            updateZIndex('taskManager');
        }
    }
};

window.closeTaskManagerWindow = function() {
    const el = tmWindow;
    const win = windows['taskManager'];

    if (win && win.taskbarElement) {
        win.taskbarElement.remove();
        win.taskbarElement = null;
    }

    if (activeWindowId === 'taskManager') {
        activeWindowId = null;
    }

    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
    void el.offsetWidth;

    el.classList.add('closing');
    stopTaskManagerUpdates();

    setTimeout(() => {
        el.classList.remove('closing', 'tm-visible');
        el.style.opacity = '';
        el.style.transform = '';
        if (win) win.isMinimized = false;
    }, 200);
};

// --- Initialization & Loop ---

function startTaskManagerUpdates() {
    if (!tmUpdateInterval) {
        tmUpdateInterval = setInterval(updateData, 1500);
    }
    if (!tmChartInterval) {
        // Draw chart roughly matching monitor refresh for smooth scrolling
        tmChartInterval = setInterval(drawCharts, 50);
    }
}

function stopTaskManagerUpdates() {
    if (tmUpdateInterval) clearInterval(tmUpdateInterval);
    if (tmChartInterval) clearInterval(tmChartInterval);
    tmUpdateInterval = null;
    tmChartInterval = null;
}

function updateData() {
    // 1. Modulate process data slightly
    let totalCpu = 0;
    processes.forEach(p => {
        if (p.name !== "System Idle Process") {
            // Random walk within bounds
            p.cpu = Math.max(0, Math.min(100, p.cpu + (Math.random() - 0.5) * 2));
            p.mem = Math.max(10, p.mem + (Math.random() - 0.5) * 5);
            p.disk = Math.max(0, p.disk + (Math.random() - 0.6) * 1);
            p.net = Math.max(0, p.net + (Math.random() - 0.7) * 0.5);
            p.gpu = Math.max(0, p.gpu + (Math.random() - 0.5) * 0.5);
            totalCpu += p.cpu;
        }
    });

    // Update Idle Process
    const idle = processes.find(p => p.name === "System Idle Process");
    if (idle) {
        idle.cpu = Math.max(0, 100 - totalCpu);
        totalCpu += idle.cpu; 
    }

    // 2. Sort Process Table
    sortProcessesArray();
    renderProcessesTable();

    // 3. Update Overall Perf Data
    // We sample a new data point for the graph
    currentCpu = Math.min(100, totalCpu - (idle ? idle.cpu : 0));
    currentMem = 25 + (Math.random() - 0.5) * 2; // steady at ~25% (4GB / 16GB)

    // Shift arrays
    graphDataCpu.push(currentCpu);
    graphDataCpu.shift();

    graphDataMem.push(currentMem);
    graphDataMem.shift();

    currentDisk = Math.min(100, (Math.random() * 15));
    currentWifi = Math.min(100, (Math.random() * 20));
    currentGpu = Math.min(100, totalCpu * 0.4 + (Math.random() * 8));

    graphDataDisk.push(currentDisk);
    graphDataDisk.shift();
    graphDataWifi.push(currentWifi);
    graphDataWifi.shift();
    graphDataGpu.push(currentGpu);
    graphDataGpu.shift();

    // Update summary texts
    document.getElementById("tmPerfCpuUsageMini").textContent = `${currentCpu.toFixed(0)}%`;
    document.getElementById("tmCpuPercentLarge").textContent = `${currentCpu.toFixed(0)}%`;
    document.getElementById("tmCpuUtilStat").textContent = `${currentCpu.toFixed(0)}%`;
    
    // Slight flux in speed
    const speed = (4.12 + (Math.random() * 0.2 - 0.1)).toFixed(2);
    document.getElementById("tmCpuSpeedStat").textContent = `${speed} GHz`;

    const memGb = (currentMem / 100 * 16).toFixed(1);
    document.getElementById("tmPerfMemUsageMini").textContent = `${memGb}/16.0 GB`;
    if (document.getElementById("tmMemUseStat")) {
        document.getElementById("tmMemUseStat").textContent = `${memGb} GB (120 MB)`;
        document.getElementById("tmMemAvailStat").textContent = `${(16 - Number(memGb)).toFixed(1)} GB`;
    }

    const diskElem = document.getElementById("tmPerfDiskUsageMini");
    if (diskElem) diskElem.textContent = `${currentDisk.toFixed(0)}%`;
    const wifiElem = document.getElementById("tmPerfWifiUsageMini");
    if (wifiElem) wifiElem.textContent = `${currentWifi.toFixed(0)} Kbps`;
    const gpuElem = document.getElementById("tmPerfGpuUsageMini");
    if (gpuElem) gpuElem.textContent = `${currentGpu.toFixed(0)}%`;
}

// --- Table UI ---

function getUsageClass(val, thresholds) {
    if (val >= thresholds[2]) return "usage-crit";
    if (val >= thresholds[1]) return "usage-high";
    if (val >= thresholds[0]) return "usage-med";
    return "usage-low";
}

function renderProcessesTable() {
    const tbody = document.getElementById("tmProcessesBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    processes.forEach(p => {
        const tr = document.createElement("tr");

        // Format values
        const isCpuIdle = p.name === "System Idle Process";
        const cpuClass = getUsageClass(p.cpu, isCpuIdle ? [101,101,101] : [15, 40, 80]); // idle doesn't get colored
        const memClass = getUsageClass(p.mem, [1000, 2000, 4000]);
        const diskClass = getUsageClass(p.disk, [10, 50, 90]);
        const netClass = getUsageClass(p.net, [5, 20, 50]);
        const gpuClass = getUsageClass(p.gpu, [20, 60, 90]);

        const cpuStr = p.cpu.toFixed(1) + "%";
        const memStr = (p.mem >= 1000 ? (p.mem/1024).toFixed(1) + " GB" : p.mem.toFixed(1) + " MB");
        const diskStr = p.disk.toFixed(1) + " MB/s";
        const netStr = p.net.toFixed(1) + " Mbps";
        const gpuStr = p.gpu.toFixed(1) + "%";

        tr.innerHTML = `
            <td>
              <div class="proc-name-cell">
                <img src="${p.icon}" class="proc-icon" onerror="this.src='icon/folder.ico'">
                <span>${p.name}</span>
              </div>
            </td>
            <td></td>
            <td class="proc-stat-col">
              <div class="proc-stat-bg ${cpuClass}"></div>
              ${p.cpu > 0 ? cpuStr : '0%'}
            </td>
            <td class="proc-stat-col">
              <div class="proc-stat-bg ${memClass}"></div>
              ${p.mem > 0 ? `<span class="color-sub">${memStr.split(' ')[0]}</span> ${memStr.split(' ')[1]}` : '0 MB'}
            </td>
            <td class="proc-stat-col">
              <div class="proc-stat-bg ${diskClass}"></div>
              ${p.disk > 0.1 ? diskStr : '0 MB/s'}
            </td>
            <td class="proc-stat-col">
              <div class="proc-stat-bg ${netClass}"></div>
              ${p.net > 0.1 ? netStr : '0 Mbps'}
            </td>
            <td class="proc-stat-col">
              <div class="proc-stat-bg ${gpuClass}"></div>
              ${p.gpu > 0.1 ? gpuStr : '0%'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function sortTmProcesses(col) {
    if (currentSort.col === col) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = col;
        currentSort.asc = false; // default descending for metrics
    }
    sortProcessesArray();
    renderProcessesTable();
}

function sortProcessesArray() {
    processes.sort((a, b) => {
        let valA = a[currentSort.col];
        let valB = b[currentSort.col];
        
        if (typeof valA === 'number' && typeof valB === 'number') {
            return currentSort.asc ? valA - valB : valB - valA;
        }
        return 0;
    });
}

// --- Navigation Tabs ---
window.switchTmTab = function(tabName) {
    document.querySelectorAll('.tm-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tm-tab-content').forEach(el => el.classList.remove('active'));

    // activate clicked
    const idx = tabName === 'processes' ? 0 : 1; 
    document.querySelectorAll('.tm-nav-item')[idx].classList.add('active');

    if (tabName === 'processes') {
        document.getElementById('tmProcessesTab').classList.add('active');
    } else if (tabName === 'performance') {
        document.getElementById('tmPerformanceTab').classList.add('active');
        // Force resize update for canvas
        drawCharts(); 
    }
};

window.switchPerfView = function(viewName) {
    document.querySelectorAll('.tm-perf-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tm-perf-view').forEach(el => el.classList.remove('active'));

    if (viewName === 'cpu') {
        document.getElementById('perfItemCpu').classList.add('active');
        document.getElementById('tmCpuView').classList.add('active');
    } else if (viewName === 'memory') {
        document.getElementById('perfItemMemory').classList.add('active');
        document.getElementById('tmMemView').classList.add('active');
    } else if (viewName === 'disk') {
        const perfItem = document.getElementById('perfItemDisk');
        if (perfItem) perfItem.classList.add('active');
        const viewItem = document.getElementById('tmDiskView');
        if (viewItem) viewItem.classList.add('active');
    } else if (viewName === 'wifi') {
        const perfItem = document.getElementById('perfItemWifi');
        if (perfItem) perfItem.classList.add('active');
        const viewItem = document.getElementById('tmWifiView');
        if (viewItem) viewItem.classList.add('active');
    } else if (viewName === 'gpu') {
        const perfItem = document.getElementById('perfItemGpu');
        if (perfItem) perfItem.classList.add('active');
        const viewItem = document.getElementById('tmGpuView');
        if (viewItem) viewItem.classList.add('active');
    }
};

// --- Graphs rendering ---
function drawLineChart(canvasId, dataArray, colorStroke, colorFill) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Handle responsive sizing implicitly (the container scales)
    // For crispness, set internal canvas size to match layout size
    canvas.width = canvas.parentElement.clientWidth || 300;
    canvas.height = canvas.parentElement.clientHeight || 100;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const dataLen = dataArray.length;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Grid (only for large charts)
    if (canvasId.includes("Large")) {
        ctx.strokeStyle = document.body.classList.contains("light-mode") ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        // vertical
        for (let i = 1; i < 4; i++) {
            const x = (width / 4) * i;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        // horizontal
        for (let i = 1; i < 4; i++) {
            const y = (height / 4) * i;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    }

    // Prepare line
    ctx.beginPath();
    const xStep = width / (dataLen - 1);
    
    // Determine Y scaling
    // Max value is always 100% implicitly
    const maxVal = 100;

    for (let i = 0; i < dataLen; i++) {
        const val = dataArray[i];
        const x = i * xStep;
        const y = height - (val / maxVal * height);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    // Stroke
    ctx.strokeStyle = colorStroke;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = colorFill;
    ctx.fill();
}

function drawCharts() {
    const isLight = document.body.classList.contains('light-mode');
    
    // CPU Theme (Cyan/Blue)
    const cpuStroke = isLight ? "#0067c0" : "#60CDFF";
    const cpuFill = isLight ? "rgba(0, 103, 192, 0.15)" : "rgba(96, 205, 255, 0.15)";
    
    // Mem Theme (Purple)
    const memStroke = isLight ? "#8b008b" : "#D27CFF";
    const memFill = isLight ? "rgba(139, 0, 139, 0.15)" : "rgba(210, 124, 255, 0.15)";

    // Update the CSS grid border color to match theme dynamically if we want, but handled in CSS

    // Draw Mini
    drawLineChart("tmCpuMiniChart", graphDataCpu, cpuStroke, cpuFill);
    drawLineChart("tmMemMiniChart", graphDataMem, memStroke, memFill);
    
    if (document.getElementById("tmDiskMiniChart")) {
        const diskStroke = isLight ? "#008000" : "#4CAF50";
        const diskFill = isLight ? "rgba(0, 128, 0, 0.15)" : "rgba(76, 175, 80, 0.15)";
        drawLineChart("tmDiskMiniChart", graphDataDisk, diskStroke, diskFill);
    }
    if (document.getElementById("tmWifiMiniChart")) {
        const wifiStroke = isLight ? "#800080" : "#9C27B0";
        const wifiFill = isLight ? "rgba(128, 0, 128, 0.15)" : "rgba(156, 39, 176, 0.15)";
        drawLineChart("tmWifiMiniChart", graphDataWifi, wifiStroke, wifiFill);
    }
    if (document.getElementById("tmGpuMiniChart")) {
        const gpuStroke = isLight ? "#d2691e" : "#FF9800";
        const gpuFill = isLight ? "rgba(210, 105, 30, 0.15)" : "rgba(255, 152, 0, 0.15)";
        drawLineChart("tmGpuMiniChart", graphDataGpu, gpuStroke, gpuFill);
    }

    // Draw Large (only if active view to save performance)
    if (document.getElementById('tmPerformanceTab').classList.contains('active')) {
        if (document.getElementById('tmCpuView').classList.contains('active')) {
            drawLineChart("tmCpuLargeChart", graphDataCpu, cpuStroke, cpuFill);
        } else if (document.getElementById('tmMemView').classList.contains('active')) {
            drawLineChart("tmMemLargeChart", graphDataMem, memStroke, memFill);
        } else if (document.getElementById('tmDiskView') && document.getElementById('tmDiskView').classList.contains('active')) {
            const diskStroke = isLight ? "#008000" : "#4CAF50";
            const diskFill = isLight ? "rgba(0, 128, 0, 0.15)" : "rgba(76, 175, 80, 0.15)";
            drawLineChart("tmDiskLargeChart", graphDataDisk, diskStroke, diskFill);
        } else if (document.getElementById('tmWifiView') && document.getElementById('tmWifiView').classList.contains('active')) {
            const wifiStroke = isLight ? "#800080" : "#9C27B0";
            const wifiFill = isLight ? "rgba(128, 0, 128, 0.15)" : "rgba(156, 39, 176, 0.15)";
            drawLineChart("tmWifiLargeChart", graphDataWifi, wifiStroke, wifiFill);
        } else if (document.getElementById('tmGpuView') && document.getElementById('tmGpuView').classList.contains('active')) {
            const gpuStroke = isLight ? "#d2691e" : "#FF9800";
            const gpuFill = isLight ? "rgba(210, 105, 30, 0.15)" : "rgba(255, 152, 0, 0.15)";
            drawLineChart("tmGpuLargeChart", graphDataGpu, gpuStroke, gpuFill);
        }
    }
}

// Ensure initial render
renderProcessesTable();
drawCharts();
