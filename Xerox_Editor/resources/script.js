function l(msg, data = null) {
    if (data) {
        console.log(`[LOG] ${msg}`, data);
    } else {
        console.log(`[LOG] ${msg}`);
    }
}

function updateModificationState() {
    // 1. Define neutral defaults
    const isDefaultRotation = rotationAngle === 0;
    const isDefaultBrightness = Number(brightness) === 100;
    const isDefaultContrast = Number(contrast) === 100;
    const isDefaultGrayscale = !isGrayScale;

    // 2. Check Crop Points (Compare against the 'start' and 'end' constants)
    const isDefaultPoints = points.every((p, i) => {
        const defaultPoints = [
            { x: start, y: start },
            { x: end, y: start },
            { x: end, y: end },
            { x: start, y: end }
        ];
        // Using a small epsilon for float comparison
        return Math.abs(p.x - defaultPoints[i].x) < 0.0001 &&
            Math.abs(p.y - defaultPoints[i].y) < 0.0001;
    });

    // 3. Determine if any change exists
    const hasChanged = !(isDefaultRotation && isDefaultBrightness &&
        isDefaultContrast && isDefaultGrayscale && isDefaultPoints);

    // 4. Update Global Variable and UI
    isModified = hasChanged;

    if (elements.saveBtn) {
        elements.saveBtn.disabled = !isModified;
        elements.saveBtn.style.opacity = isModified ? "1" : "0.5";
    }
}

function updateCursor() {
    if (!elements.canvasWrapper) return;

    let cursor = "default";

    if (isPanning) {
        cursor = "grabbing";
    } else if (spacePressed) {
        cursor = "grab";
    }
    else if (hoveredPoint !== -1) {
        cursor = "pointer";
    } else if (hoveredEdge !== -1) {
        // Vertical edges (1 and 3) use horizontal resize, 
        // Horizontal edges (0 and 2) use vertical resize
        cursor = (hoveredEdge === 1 || hoveredEdge === 3) ? "ew-resize" : "ns-resize";
    }

    elements.canvasWrapper.style.cursor = cursor;
    // Optional: Sync canvas cursor if needed
    if (elements.canvas) elements.canvas.style.cursor = cursor;
}

Neutralino.events.on("ready", async () => {
    l("System: Native SDK Ready");
    l("System: Launch Args", NL_ARGS);
    if (NL_ARGS[1] && isLikelyImagePath(NL_ARGS[1])) {
        l("System: Auto-loading image from args", NL_ARGS[1]);
        await loadImageFromPath(NL_ARGS[1]);
    }
});

Neutralino.init();

Neutralino.events.on("windowClose", () => {
    l("System: Window Close Triggered");
    Neutralino.app.exit();
});

const APP_CONFIG = {
    MAX_FILE_SIZE_MB: 10,
};

const UI_CONFIG = {
    ids: {
        main: "main",
        fileInput: "fileInput",
        chooseBtn: "chooseBtn",
        imgIco: "imgIco",
        landing: "landing",
        editor: "editor",
        resetAll: "resetAll",
        saveBtn: "saveBtn",
        canvas: "perspectiveCanvas",
        canvasWrapper: "canvasWrapper",
        cropResetBtn: "cropResetBtn",
        rotateRightBtn: "rotateRightBtn",
        rotateLeftBtn: "rotateLeftBtn",
        rotateResetBtn: "rotateResetBtn",
        brightnessInput: "brightnessInput",
        brightnessVal: "brightnessVal",
        contrastInput: "contrastInput",
        contrastVal: "contrastVal",
        grayscaleToggle: "grayscaleToggle",
        clearWorkspace: "ClearWorkspace"
    },
    classes: {
        editorActive: "editorActive"
    }
};

const $ = (id) => document.getElementById(id);

const elements = {};

Object.keys(UI_CONFIG.ids).forEach(key => {
    const el = $(UI_CONFIG.ids[key]);
    if (el) elements[key] = el;
});

let currentImage = null;
let currentFilePath = null;

const PADDING_FACTOR = 0.05;
const start = PADDING_FACTOR / (1 + PADDING_FACTOR * 2);
const end = (1 + PADDING_FACTOR) / (1 + PADDING_FACTOR * 2);

let points = [
    { x: start, y: start },
    { x: end, y: start },
    { x: end, y: end },
    { x: start, y: end }
];

let isGrayScale = false;
let brightness = 100;
let contrast = 100;
let rotationAngle = 0;

let isModified = false;

const EDGE_HANDLE_WIDTH = 30;
const EDGE_HANDLE_HEIGHT = 10;

// Interaction State
let draggingPoint = -1;
let draggingEdge = -1;
let hoveredPoint = -1;
let hoveredEdge = -1;
let zoom = 1;
let panX = 0, panY = 0;
let isPanning = false, spacePressed = false;
let lastMousePos = { x: 0, y: 0 };

const MIN_ZOOM = 0.5, MAX_ZOOM = 5;

function isLikelyImagePath(path) {
    const valid = /\.(jpg|jpeg|png|webp|bmp|gif|tif|tiff)$/i.test(path);
    return valid;
}

function getMimeTypeFromPath(path) {
    if (!path) return "image/jpeg";
    const ext = path.split('.').pop().toLowerCase();
    const type = {
        'png': "image/png",
        'webp': "image/webp",
        'gif': "image/gif"
    }[ext] || "image/jpeg";
    l(`File: Detected MIME type for ${ext}`, type);
    return type;
}

function checkFileSize(sizeInBytes) {
    const sizeMB = sizeInBytes / (1024 * 1024);
    l(`File: Checking size: ${sizeMB.toFixed(2)} MB`);
    if (sizeMB > APP_CONFIG.MAX_FILE_SIZE_MB) {
        l("Error: File too large");
        alert(`File is too large! (${sizeMB.toFixed(1)}MB)\nPlease select an image under ${APP_CONFIG.MAX_FILE_SIZE_MB}MB.`);
        return false;
    }
    return true;
}

async function loadImageFromPath(filePath) {
    l("File: Loading from path", filePath);
    if (!filePath) return;
    try {
        const stats = await Neutralino.filesystem.getStats(filePath);
        if (!checkFileSize(stats.size)) {
            return;
        }
        const bin = await Neutralino.filesystem.readBinaryFile(filePath);
        const blob = new Blob([bin], { type: "application/octet-stream" });
        currentFilePath = filePath;
        loadImageFromBlob(blob);

    } catch (err) {
        console.error("Error reading file:", err);
        l("Error: File load failed", err);
        alert("Could not load file. It may be locked or inaccessible.");
    }
}

function loadImageFromBlob(blob) {
    l("File: Processing Blob data...");
    if (!checkFileSize(blob.size)) return;
    const img = new Image();
    img.onload = () => {
        l("Event: Image Loaded Successfully");
        currentImage = img;
        elements.main.classList.add(UI_CONFIG.classes.editorActive);
        resetAllEverything();
    };
    img.onerror = () => {
        l("Error: Failed to render image data");
        alert("Failed to render image data");
    }
    img.src = URL.createObjectURL(blob);
}

function applyImageFiltersAndRotation(ctx, img, width, height) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotationAngle * Math.PI) / 180);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${isGrayScale ? 100 : 0}%)`;
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    updateModificationState();
}

function drawCanvas() {
    if (!currentImage || !elements.canvas) return;
    const ctx = elements.canvas.getContext("2d");
    const isRotated90 = (rotationAngle / 90) % 2 !== 0;
    const imgW = isRotated90 ? currentImage.height : currentImage.width;
    const imgH = isRotated90 ? currentImage.width : currentImage.height;
    const canvasW_Base = imgW * (1 + PADDING_FACTOR * 2);
    const canvasH_Base = imgH * (1 + PADDING_FACTOR * 2);
    const fitScale = Math.min(
        (elements.canvasWrapper.clientWidth / canvasW_Base) * 0.9,
        (elements.canvasWrapper.clientHeight / canvasH_Base) * 0.9,
        1
    );
    elements.canvas.width = canvasW_Base * fitScale * zoom;
    elements.canvas.height = canvasH_Base * fitScale * zoom;
    ctx.save();
    ctx.scale(fitScale * zoom, fitScale * zoom);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasW_Base, canvasH_Base);
    applyImageFiltersAndRotation(ctx, currentImage, canvasW_Base, canvasH_Base);
    ctx.restore();
    drawCropOverlay(ctx);
}

function drawCropOverlay(ctx) {
    const w = elements.canvas.width;
    const h = elements.canvas.height;
    // Boundary
    ctx.strokeStyle = "#007aff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x * w, p.y * h) : ctx.lineTo(p.x * w, p.y * h));
    ctx.closePath();
    ctx.stroke();
    // Corners
    points.forEach((p, i) => {
        ctx.fillStyle = (hoveredPoint === i || draggingPoint === i) ? "#4f46e5" : "#00c3ff";
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 8, 0, Math.PI * 2);
        ctx.fill();
    });
    // Edges (Sliders)
    for (let i = 0; i < 4; i++) {
        const p1 = points[i], p2 = points[(i + 1) % 4];
        const mx = ((p1.x + p2.x) / 2) * w;
        const my = ((p1.y + p2.y) / 2) * h;
        ctx.fillStyle = (hoveredEdge === i || draggingEdge === i) ? "#4f46e5" : "#00c3ff";

        ctx.beginPath();
        if (i === 0 || i === 2) ctx.roundRect(mx - 15, my - 5, 30, 10, 5); // Horiz
        else ctx.roundRect(mx - 5, my - 15, 10, 30, 5); // Vert
        ctx.fill();
    }
}

function updateCanvasTransform() {
    if (elements.canvas) {
        elements.canvas.style.transform = `translate(${panX}px, ${panY}px)`;
    }
}

function getNormCoords(ex, ey) {
    const r = elements.canvas.getBoundingClientRect();
    return { x: (ex - r.left) / r.width, y: (ey - r.top) / r.height };
}

function handleMouseMove(e) {
    const pos = getNormCoords(e.clientX, e.clientY);
    const rect = elements.canvas.getBoundingClientRect();
    if (isPanning) {
        panX += (e.clientX - lastMousePos.x);
        panY += (e.clientY - lastMousePos.y);
        elements.canvas.style.transform = `translate(${panX}px, ${panY}px)`;
    } else if (draggingPoint !== -1) {
        points[draggingPoint].x = Math.max(0, Math.min(1, pos.x));
        points[draggingPoint].y = Math.max(0, Math.min(1, pos.y));
        drawCanvas();
    } else if (draggingEdge !== -1) {
        const p1 = points[draggingEdge], p2 = points[(draggingEdge + 1) % 4];
        if (draggingEdge === 0 || draggingEdge === 2) p1.y = p2.y = Math.max(0, Math.min(1, pos.y));
        else p1.x = p2.x = Math.max(0, Math.min(1, pos.x));
        drawCanvas();
    } else {
        // Hover Detection
        let hp = -1, he = -1;
        points.forEach((p, i) => {
            if (Math.hypot(p.x - pos.x, p.y - pos.y) < 0.15) hp = i;
        });
        if (hp === -1) {
            for (let i = 0; i < 4; i++) {
                const p1 = points[i], p2 = points[(i + 1) % 4];
                const screenMidX = ((p1.x + p2.x) / 2) * rect.width + rect.left;
                const screenMidY = ((p1.y + p2.y) / 2) * rect.height + rect.top;
                if (Math.abs(e.clientX - screenMidX) < 20 && Math.abs(e.clientY - screenMidY) < 20) he = i;
            }
        }
        if (hp !== hoveredPoint || he !== hoveredEdge) {
            hoveredPoint = hp; hoveredEdge = he;
            drawCanvas();
        }
    }
    updateCursor();
    lastMousePos = { x: e.clientX, y: e.clientY };
}

elements.chooseBtn.onclick = async () => {
    const entries = await Neutralino.os.showOpenDialog("Open image", {
        filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp"] }]
    });
    if (entries && entries[0]) loadImageFromPath(entries[0]);
};

elements.fileInput.onchange = (e) => {
    if (e.target.files[0]) processImageBlob(e.target.files[0]);
};

elements.canvasWrapper.onmousedown = (e) => {
    const pos = getNormCoords(e.clientX, e.clientY);

    if (spacePressed || e.button === 1) {
        isPanning = true;
    } else if (hoveredPoint !== -1) {
        draggingPoint = hoveredPoint;
        // Snap point to cursor immediately
        points[draggingPoint].x = Math.max(0, Math.min(1, pos.x));
        points[draggingPoint].y = Math.max(0, Math.min(1, pos.y));
        drawCanvas();
    } else if (hoveredEdge !== -1) {
        draggingEdge = hoveredEdge;
        // Snap edge to cursor immediately
        const p1 = points[draggingEdge], p2 = points[(draggingEdge + 1) % 4];
        if (draggingEdge === 0 || draggingEdge === 2) {
            p1.y = p2.y = Math.max(0, Math.min(1, pos.y));
        } else {
            p1.x = p2.x = Math.max(0, Math.min(1, pos.x));
        }
        drawCanvas();
    }

    if (draggingPoint !== -1 || draggingEdge !== -1) {
        updateModificationState();
    }
    updateCursor();
};

elements.canvasWrapper.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    drawCanvas();
}, { passive: false });

window.onmousemove = handleMouseMove;
window.onmouseup = () => { isPanning = false; draggingPoint = -1; draggingEdge = -1; updateCursor(); };

window.onkeydown = (e) => {
    if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        l("Command: Reset View Shortcut");
        zoom = 1; panX = 0; panY = 0;
        updateCanvasTransform(); drawCanvas();
    } else if (e.code === "Space" && !spacePressed) {
        spacePressed = true;
        l("Input: Spacebar Down -> Pan Mode Ready");
    }
    updateCursor();
};

window.onkeyup = (e) => {
    if (e.code === "Space") {
        spacePressed = false;
    }
    updateCursor();
};
window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("drop", e => e.preventDefault());

function triggerFileSelect() {
    l("UI: Triggering Native File Select");
    if (elements.chooseBtn) elements.chooseBtn.click();
}

elements.imgIco.onclick = triggerFileSelect;

elements.chooseBtn.onclick = async () => {
    l("Action: Opening Native File Dialog");
    const entries = await Neutralino.os.showOpenDialog("Open image", {
        filters: [
            { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "bmp", "gif", "tif", "tiff"] },
            { name: "All files", extensions: ["*"] }
        ]
    });
    if (entries && entries[0]) {
        l("Action: File Selected from Dialog", entries[0]);
        await loadImageFromPath(entries[0]);
    }
};

elements.fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        l("Action: Browser File Selected", file.name);
        if (checkFileSize(file.size)) {
            loadImageFromBlob(file);
        }
    }
};

elements.clearWorkspace.onclick = () => {
    currentImage = null;
    currentFilePath = null;
    elements.main.classList.remove(UI_CONFIG.classes.editorActive);
    const ctx = elements.canvas.getContext("2d");
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
};

function getPerspectiveTransform(srcPoints, dstPoints) {
    l("Math: Calculating Homography Matrix");
    const a = [], b = [];
    for (let i = 0; i < 4; i++) {
        a.push([srcPoints[i].x, srcPoints[i].y, 1, 0, 0, 0, -dstPoints[i].x * srcPoints[i].x, -dstPoints[i].x * srcPoints[i].y]);
        a.push([0, 0, 0, srcPoints[i].x, srcPoints[i].y, 1, -dstPoints[i].y * srcPoints[i].x, -dstPoints[i].y * srcPoints[i].y]);
        b.push(dstPoints[i].x, dstPoints[i].y);
    }
    const x = gaussianElimination(a, b);
    x.push(1);
    return x;
}

function gaussianElimination(a, b) {
    const n = a.length;
    for (let i = 0; i < n; i++) {
        let max = i;
        for (let j = i + 1; j < n; j++) if (Math.abs(a[j][i]) > Math.abs(a[max][i])) max = j;
        [a[i], a[max]] = [a[max], a[i]];
        [b[i], b[max]] = [b[max], b[i]];
        for (let j = i + 1; j < n; j++) {
            const f = a[j][i] / a[i][i];
            b[j] -= f * b[i];
            for (let k = i; k < n; k++) a[j][k] -= f * a[i][k];
        }
    }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let s = 0;
        for (let j = i + 1; j < n; j++) s += a[i][j] * x[j];
        x[i] = (b[i] - s) / a[i][i];
    }
    return x;
}

function applyMatrix(m, x, y) {
    const d = m[6] * x + m[7] * y + 1;
    return {
        x: (m[0] * x + m[1] * y + m[2]) / d,
        y: (m[3] * x + m[4] * y + m[5]) / d
    };
}

function bilinearInterpolate(imgData, x, y, width) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = x0 + 1, y1 = y0 + 1;
    const dx = x - x0, dy = y - y0;
    const getP = (px, py) => {
        const i = (py * width + px) * 4;
        return { r: imgData[i], g: imgData[i + 1], b: imgData[i + 2] };
    };
    const p00 = getP(x0, y0);
    const p10 = getP(x1, y0);
    const p01 = getP(x0, y1);
    const p11 = getP(x1, y1);
    const interpolate = (c00, c10, c01, c11) =>
        c00 * (1 - dx) * (1 - dy) + c10 * dx * (1 - dy) + c01 * (1 - dx) * dy + c11 * dx * dy;
    return {
        r: interpolate(p00.r, p10.r, p01.r, p11.r),
        g: interpolate(p00.g, p10.g, p01.g, p11.g),
        b: interpolate(p00.b, p10.b, p01.b, p11.b)
    };
}

function perspectiveTransform(pts, targetW, targetH) {
    l("Action: Starting Perspective Transform (Including Padding)");
    const destCanvas = document.createElement("canvas");
    destCanvas.width = targetW;
    destCanvas.height = targetH;
    const destCtx = destCanvas.getContext("2d");
    const isRot = (rotationAngle / 90) % 2 !== 0;
    const imgW = isRot ? currentImage.height : currentImage.width;
    const imgH = isRot ? currentImage.width : currentImage.height;
    const tempSrc = document.createElement("canvas");
    tempSrc.width = imgW * (1 + PADDING_FACTOR * 2);
    tempSrc.height = imgH * (1 + PADDING_FACTOR * 2);
    const tempCtx = tempSrc.getContext("2d");
    tempCtx.fillStyle = "#FFFFFF";
    tempCtx.fillRect(0, 0, tempSrc.width, tempSrc.height);
    tempCtx.save();
    applyImageFiltersAndRotation(tempCtx, currentImage, tempSrc.width, tempSrc.height);
    tempCtx.restore();
    const srcImageData = tempCtx.getImageData(0, 0, tempSrc.width, tempSrc.height);
    const srcData = srcImageData.data;
    const matrix = getPerspectiveTransform(
        [{ x: 0, y: 0 }, { x: targetW, y: 0 }, { x: targetW, y: targetH }, { x: 0, y: targetH }],
        pts.map(p => ({ x: p.x * tempSrc.width, y: p.y * tempSrc.height }))
    );
    const outData = destCtx.createImageData(targetW, targetH);
    const data = outData.data;
    for (let y = 0; y < targetH; y++) {
        for (let x = 0; x < targetW; x++) {
            const p = applyMatrix(matrix, x, y);
            if (p.x >= 0 && p.x < tempSrc.width - 1 && p.y >= 0 && p.y < tempSrc.height - 1) {
                const color = bilinearInterpolate(srcData, p.x, p.y, tempSrc.width);
                const idx = (y * targetW + x) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }
    }
    destCtx.putImageData(outData, 0, 0);
    return destCanvas;
}

function resetAllEverything() {
    l("Action: Resetting All State");
    points = [
        { x: start, y: start },
        { x: end, y: start },
        { x: end, y: end },
        { x: start, y: end }
    ];
    brightness = 100;
    contrast = 100;
    isGrayScale = false;
    rotationAngle = 0;
    zoom = 1;
    panX = 0;
    panY = 0;
    elements.brightnessInput.value = 100; elements.brightnessVal.textContent = 100;
    elements.contrastInput.value = 100; elements.contrastVal.textContent = 100;
    elements.grayscaleToggle.checked = false;
    updateCanvasTransform();
    drawCanvas();
    updateModificationState();
}

elements.brightnessInput.oninput = () => {
    brightness = elements.brightnessInput.value;
    elements.brightnessVal.textContent = brightness;
    drawCanvas();
};

elements.contrastInput.oninput = () => {
    contrast = elements.contrastInput.value;
    elements.contrastVal.textContent = contrast;
    drawCanvas();
};

[
    [elements.brightnessInput, elements.brightnessVal, 'brightness'],
    [elements.contrastInput, elements.contrastVal, 'contrast']
].forEach(([input, display, key]) => {
    if (!input) return;
    input.parentElement.addEventListener("wheel", (e) => {
        e.preventDefault();
        const direction = e.deltaY < 0 ? 1 : -1;
        const step = parseFloat(input.step || 5);
        const newVal = Math.min(200, Math.max(0, parseFloat(input.value) + (direction * step)));
        input.value = newVal;
        if (display) display.textContent = newVal;
        if (key === 'brightness') brightness = newVal;
        if (key === 'contrast') contrast = newVal;
        drawCanvas();
    }, { passive: false });
});

elements.grayscaleToggle.onchange = (e) => {
    l(`UI: Grayscale Toggled: ${e.target.checked}`);
    isGrayScale = e.target.checked;
    drawCanvas();
};

const rotate = (deg) => {
    l(`Action: Rotate ${deg} degrees`);
    rotationAngle = (rotationAngle + deg + 360) % 360;
    drawCanvas();
};

elements.rotateRightBtn.onclick = () => rotate(90);
elements.rotateLeftBtn.onclick = () => rotate(-90);
elements.rotateResetBtn.onclick = () => { rotationAngle = 0; drawCanvas(); };

elements.cropResetBtn.onclick = () => {
    l("Action: Reset Crop Points");
    points = [
        { x: start, y: start },
        { x: end, y: start },
        { x: end, y: end },
        { x: start, y: end }
    ];
    drawCanvas();
};

elements.resetAll.onclick = resetAllEverything;

async function canvasToArrayBuffer(canvas, mimeType = "image/jpeg", quality = 0.95) {
    l(`Export: Converting canvas to Blob (${mimeType})...`);
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error("Failed to export image"));
            resolve(await blob.arrayBuffer());
        }, mimeType, quality);
    });
}

elements.saveBtn.onclick = async () => {
    if (!currentImage || !currentFilePath) return;
    l("Action: SAVE BUTTON CLICKED (With Padding Support)");
    elements.saveBtn.disabled = true;
    elements.saveBtn.textContent = "Processing...";
    try {
        const isRot = (rotationAngle / 90) % 2 !== 0;
        const imgW = isRot ? currentImage.height : currentImage.width;
        const imgH = isRot ? currentImage.width : currentImage.height;
        const sourceW = imgW * (1 + PADDING_FACTOR * 2);
        const sourceH = imgH * (1 + PADDING_FACTOR * 2);
        const outW = Math.round(Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) * sourceW);
        const outH = Math.round(Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y) * sourceH);
        const resultCanvas = perspectiveTransform(points, outW, outH);
        const mimeType = getMimeTypeFromPath(currentFilePath);
        const buffer = await canvasToArrayBuffer(resultCanvas, mimeType, 0.95);
        const pathParts = currentFilePath.split(/[\\/]/);
        const originalFullName = pathParts.pop();
        const dirPath = pathParts.join("/");
        const extIndex = originalFullName.lastIndexOf(".");
        const baseName = originalFullName.substring(0, extIndex);
        const extension = originalFullName.substring(extIndex);
        const sse = "SSE"
        const randomStr = Math.random().toString(36).substring(2, 7);
        const targetPath = `${dirPath}/${baseName}_${sse}_${randomStr}${extension}`;
        l(`Export: Writing to disk: ${targetPath}`);
        await Neutralino.filesystem.writeBinaryFile(targetPath, buffer);
        l("Export: Success!");
        elements.saveBtn.textContent = "Saved New!";
        elements.saveBtn.disabled = false;
        await loadImageFromPath(targetPath);
        setTimeout(() => {
            elements.saveBtn.textContent = "Save as New";
        }, 200);
        updateModificationState()
    } catch (err) {
        console.error(err);
        l("Error: Save failed", err);
        alert("Save failed: " + err.message);
        elements.saveBtn.textContent = "Error";
        elements.saveBtn.disabled = false;
    }
};

window.onresize = () => {
    drawCanvas();
};