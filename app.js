/**
 * Mirror Generator — app.js
 * Modern ES6+, zero dependencies, native Canvas 2D API
 * Save exports at the ORIGINAL image resolution.
 */
'use strict';

/* ──────────────────────────────────────
   State
────────────────────────────────────── */
const state = {
    img: null,
    mirror: null,
    invertX: false,
    invertY: false,
};

/* ──────────────────────────────────────
   DOM refs
────────────────────────────────────── */
const displayCanvas = document.getElementById('mirror-canvas');
const dCtx = displayCanvas.getContext('2d');
const placeholder = document.getElementById('canvas-placeholder');
const controls = document.getElementById('controls');
const fileInput = document.getElementById('file-upload');
const filePlaceholder = document.getElementById('file-upload-placeholder');
const btnDemo = document.getElementById('btn-demo');
const btnSave = document.getElementById('btn-save');
const btnInfo = document.getElementById('btn-info');
const btnCloseInfo = document.getElementById('btn-close-info');
const infoOverlay = document.getElementById('info-overlay');
const invertXChk = document.getElementById('invert-x');
const invertYChk = document.getElementById('invert-y');
const mirrorBtns = document.querySelectorAll('.mbtn:not(.save-btn)');
const toast = document.getElementById('toast');
const fileMenuToggle = document.getElementById('file-menu-toggle');
const fileDropdown = document.getElementById('file-dropdown');

/* ──────────────────────────────────────
   Toast
────────────────────────────────────── */
let toastTimer = null;
function showToast(msg, duration = 2200) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ──────────────────────────────────────
   Dropdown
────────────────────────────────────── */
function toggleDropdown(forceClose) {
    const open = !fileDropdown.hidden;
    if (forceClose || open) {
        fileDropdown.hidden = true;
        fileMenuToggle.setAttribute('aria-expanded', 'false');
    } else {
        fileDropdown.hidden = false;
        fileMenuToggle.setAttribute('aria-expanded', 'true');
    }
}
fileMenuToggle.addEventListener('click', e => { e.stopPropagation(); toggleDropdown(); });
document.addEventListener('click', () => toggleDropdown(true));
fileDropdown.addEventListener('click', e => e.stopPropagation());

/* ──────────────────────────────────────
   Image loading
────────────────────────────────────── */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
    });
}

async function handleImage(src, label = 'image loaded') {
    toggleDropdown(true);
    try {
        const img = await loadImage(src);
        state.img = img;
        state.mirror = null;

        placeholder.hidden = true;
        displayCanvas.hidden = false;
        controls.hidden = false;

        mirrorBtns.forEach(b => b.classList.remove('active'));

        fitDisplayCanvas(img);
        dCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        dCtx.drawImage(img, 0, 0, displayCanvas.width, displayCanvas.height);

        showToast(label);
    } catch {
        showToast('error loading image', 3500);
    }
}

function handleFileInput(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => handleImage(e.target.result, 'image loaded');
    reader.readAsDataURL(file);
    input.value = '';
}

/* ──────────────────────────────────────
   Canvas sizing (display only)
────────────────────────────────────── */
function fitDisplayCanvas(img) {
    const area = document.getElementById('canvas-area');
    const pad = 24;
    const maxW = area.clientWidth - pad;
    const maxH = area.clientHeight - pad;
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
    displayCanvas.width = Math.round(img.naturalWidth * scale);
    displayCanvas.height = Math.round(img.naturalHeight * scale);
}

/* ──────────────────────────────────────
   Core mirror renderer (canvas-agnostic)
────────────────────────────────────── */
function drawTile(ctx, img, sx, sy, sw, sh, dX, dY, dW, dH, flipX, flipY) {
    ctx.save();
    ctx.translate(dX + dW / 2, dY + dH / 2);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.drawImage(img, sx, sy, sw, sh, -dW / 2, -dH / 2, dW, dH);
    ctx.restore();
}

function renderMirrorOnCtx(ctx, img, cw, ch, mirrorType, ix, iy) {
    ctx.clearRect(0, 0, cw, ch);
    // Use ceil for tile sizes so tiles overlap by 1px — prevents sub-pixel gap
    const hwF = Math.floor(cw / 2), hwC = Math.ceil(cw / 2);
    const hhF = Math.floor(ch / 2), hhC = Math.ceil(ch / 2);
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const hiw = Math.floor(iw / 2), hih = Math.floor(ih / 2);
    // For tile positions use floor, for tile sizes use ceil
    const hw = hwF, hh = hhF;

    switch (mirrorType) {
        case 'left': {
            const [sx, sy, sw, sh] = [0, 0, hiw, ih];
            drawTile(ctx, img, sx, sy, sw, sh, 0, 0, hwC, ch, ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, hw, 0, hwC, ch, !ix, iy);
            break;
        }
        case 'right': {
            const [sx, sy, sw, sh] = [hiw, 0, hiw, ih];
            drawTile(ctx, img, sx, sy, sw, sh, hw, 0, hwC, ch, ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, 0, 0, hwC, ch, !ix, iy);
            break;
        }
        case 'top': {
            const [sx, sy, sw, sh] = [0, 0, iw, hih];
            drawTile(ctx, img, sx, sy, sw, sh, 0, 0, cw, hhC, ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, 0, hh, cw, hhC, ix, !iy);
            break;
        }
        case 'bottom': {
            const [sx, sy, sw, sh] = [0, hih, iw, hih];
            drawTile(ctx, img, sx, sy, sw, sh, 0, hh, cw, hhC, ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, 0, 0, cw, hhC, ix, !iy);
            break;
        }
        case 'top-left': {
            const [sx, sy, sw, sh] = [0, 0, hiw, hih];
            drawTile(ctx, img, sx, sy, sw, sh, 0, 0, hwC, hhC, ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, hw, 0, hwC, hhC, !ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, 0, hh, hwC, hhC, ix, !iy);
            drawTile(ctx, img, sx, sy, sw, sh, hw, hh, hwC, hhC, !ix, !iy);
            break;
        }
        case 'top-right': {
            const [sx, sy, sw, sh] = [hiw, 0, hiw, hih];
            drawTile(ctx, img, sx, sy, sw, sh, hw, 0, hwC, hhC, ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, 0, 0, hwC, hhC, !ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, hw, hh, hwC, hhC, ix, !iy);
            drawTile(ctx, img, sx, sy, sw, sh, 0, hh, hwC, hhC, !ix, !iy);
            break;
        }
        case 'bottom-left': {
            const [sx, sy, sw, sh] = [0, hih, hiw, hih];
            drawTile(ctx, img, sx, sy, sw, sh, 0, hh, hwC, hhC, ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, hw, hh, hwC, hhC, !ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, 0, 0, hwC, hhC, ix, !iy);
            drawTile(ctx, img, sx, sy, sw, sh, hw, 0, hwC, hhC, !ix, !iy);
            break;
        }
        case 'bottom-right': {
            const [sx, sy, sw, sh] = [hiw, hih, hiw, hih];
            drawTile(ctx, img, sx, sy, sw, sh, hw, hh, hwC, hhC, ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, 0, hh, hwC, hhC, !ix, iy);
            drawTile(ctx, img, sx, sy, sw, sh, hw, 0, hwC, hhC, ix, !iy);
            drawTile(ctx, img, sx, sy, sw, sh, 0, 0, hwC, hhC, !ix, !iy);
            break;
        }
    }
}

/* ──────────────────────────────────────
   Display rendering
────────────────────────────────────── */
function renderDisplay() {
    if (!state.img || !state.mirror) return;
    fitDisplayCanvas(state.img);
    renderMirrorOnCtx(dCtx, state.img, displayCanvas.width, displayCanvas.height,
        state.mirror, state.invertX, state.invertY);
}

/* ──────────────────────────────────────
   Save — renders at ORIGINAL resolution
────────────────────────────────────── */
function saveImage() {
    if (!state.img || !state.mirror) {
        showToast('select a mirror first');
        return;
    }
    const img = state.img;
    const ow = img.naturalWidth, oh = img.naturalHeight;

    const offscreen = document.createElement('canvas');
    offscreen.width = ow;
    offscreen.height = oh;
    const octx = offscreen.getContext('2d');

    renderMirrorOnCtx(octx, img, ow, oh, state.mirror, state.invertX, state.invertY);

    offscreen.toBlob(blob => {
        if (!blob) { showToast('save failed'); return; }
        const url = URL.createObjectURL(blob);
        console.log(url);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mirror-${state.mirror}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast(`saved ${ow}×${oh}px`);
    }, 'image/png');
}

/* ──────────────────────────────────────
   Resize
────────────────────────────────────── */
function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

window.addEventListener('resize', debounce(() => {
    if (!state.img) return;
    if (state.mirror) renderDisplay();
    else {
        fitDisplayCanvas(state.img);
        dCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        dCtx.drawImage(state.img, 0, 0, displayCanvas.width, displayCanvas.height);
    }
}, 200));

/* ──────────────────────────────────────
   Event listeners
────────────────────────────────────── */

// File uploads
fileInput.addEventListener('change', () => handleFileInput(fileInput));
filePlaceholder.addEventListener('change', () => handleFileInput(filePlaceholder));

// Demo
btnDemo.addEventListener('click', () => handleImage('./assets/demo.jpg', 'demo loaded'));

// Mirror buttons
mirrorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!state.img) { showToast('load an image first'); return; }
        mirrorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mirror = btn.dataset.mirror;
        renderDisplay();
    });
});

// Invert
invertXChk.addEventListener('change', () => {
    state.invertX = invertXChk.checked;
    if (state.mirror) renderDisplay();
});
invertYChk.addEventListener('change', () => {
    state.invertY = invertYChk.checked;
    if (state.mirror) renderDisplay();
});

// Save
btnSave.addEventListener('click', saveImage);

// Info
btnInfo.addEventListener('click', () => { infoOverlay.hidden = false; });
btnCloseInfo.addEventListener('click', () => { infoOverlay.hidden = true; });
infoOverlay.addEventListener('click', e => { if (e.target === infoOverlay) infoOverlay.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') infoOverlay.hidden = true; });
