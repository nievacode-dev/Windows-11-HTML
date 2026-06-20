// Microsoft Edge App Logic

function openEdgeWindow() {
    const el = document.getElementById("edgeWindow");
    if (!el) return;

    // Check if it's already open
    if (windows["edge"]) {
        if (windows["edge"].isMinimized) {
            minimizeWindow("edge");
        }
        updateZIndex("edge");
        return;
    }

    el.style.display = "flex";

    // Trigger open animation
    requestAnimationFrame(() => {
        el.classList.add('opening');
        setTimeout(() => el.classList.remove('opening'), 250);
    });
    // Register the window in the global `windows` object
    windows["edge"] = {
        element: el,
        isMaximized: false,
        isMinimized: false,
        appTitle: "Microsoft Edge",
        appIcon: "icon/edge.ico",
        x: 150,
        y: 80,
        width: 1000,
        height: 600,
        originalState: null,
        taskbarElement: null,
        desktopId: typeof activeDesktopId !== 'undefined' ? activeDesktopId : 1
    };

    // Position window
    el.style.left = `${windows["edge"].x}px`;
    el.style.top = `${windows["edge"].y}px`;
    el.style.width = `${windows["edge"].width}px`;
    el.style.height = `${windows["edge"].height}px`;

    // Make it interactive (drag/resize)
    const titleBar = el.querySelector(".edge-drag-region");
    let resizeHandle = el.querySelector(".window-resize");
    if (!resizeHandle) {
        resizeHandle = document.createElement("div");
        resizeHandle.className = "window-resize";
        el.appendChild(resizeHandle);
    }
    
    makeWindowInteractive("edge", titleBar, resizeHandle);
    createTaskbarItem("edge");
    updateZIndex("edge");
}

function closeEdgeWindow() {
    const el = document.getElementById("edgeWindow");
    if (!el) return;

    const win = windows["edge"];
    if (win && win.taskbarElement) {
        win.taskbarElement.remove();
        win.taskbarElement = null;
    }

    if (activeWindowId === 'edge') {
        activeWindowId = null;
    }

    // Stamp current rendered values so the CSS closing transition has a concrete starting point
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
    void el.offsetWidth;

    el.classList.add('closing');
    setTimeout(() => {
        el.classList.remove('closing');
        el.style.display = 'none';
        el.style.opacity = '';
        el.style.transform = '';
        delete windows["edge"];
    }, 200);
}

// Edge Navigation Functions
function goEdgeHome() {
    const iframe = document.getElementById("edgeIframe");
    const input = document.getElementById("edgeUrlInput");
    if (iframe && input) {
        const homeUrl = "https://en.wikipedia.org";
        iframe.src = homeUrl;
        input.value = homeUrl;
    }
}

function refreshEdge() {
    const iframe = document.getElementById("edgeIframe");
    if (iframe) {
        // iframe.contentWindow.location.reload() can hit CORS issues
        // so we reset src
        const currentSrc = iframe.src;
        iframe.src = 'about:blank';
        setTimeout(() => iframe.src = currentSrc, 50);
    }
}

// Event Listeners for Edge
document.addEventListener("DOMContentLoaded", () => {
    const edgeInput = document.getElementById("edgeUrlInput");
    const edgeIframe = document.getElementById("edgeIframe");

    if (edgeInput && edgeIframe) {
        edgeInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                let url = edgeInput.value.trim();
                if (!url) return;
                
                // Add https if missing protocols (rough check)
                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    if (url.includes(".") && !url.includes(" ")) {
                        url = "https://" + url;
                    } else {
                        // Search query fallback (Bing)
                        url = "https://www.bing.com/search?q=" + encodeURIComponent(url);
                    }
                }
                
                edgeInput.value = url;
                edgeIframe.src = url;
            }
        });
        
        // Try to update input when iframe successfully loads (might fail due to cross-origin)
        edgeIframe.addEventListener("load", () => {
            try {
                // If it's cross origin, this will throw an error and be caught
                edgeInput.value = edgeIframe.contentWindow.location.href;
            } catch (err) {
                // Silent catch: Cross-origin frames obscure URL changes
            }
        });
    }
});
