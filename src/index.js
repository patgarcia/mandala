// GLOBALS
let hue = 0;
let size = 30;
let halfSize = size / 2;
let autopaint = true;
let manualpaint = false;
let brush;
let mouse = { x: 0, y: 0 };
let rainbow = true;
let color = "#000";
let fill = false;
const imageData = [];
let divisions = 5;

// Touch check
const touchSupported = !!(
  "ontouchstart" in window || navigator.msMaxTouchPoints
);

// window.addEventListener("touchmove");
const eventListeners = [
  { start: "onmousedown", move: "onmousemove", end: "onmouseup" },
  { start: "ontouchstart", move: "ontouchmove", end: "ontouchend" },
];

// CANVAS
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = 500;
canvas.onchange = ev => console.log("does this work?")

window.addEventListener("resize", (ev) => {
  saveImageData();
  canvas.width = window.innerWidth;
  restoreImageData();
});
const ctx = canvas.getContext("2d", { willReadFrequently: true });

// TODO: check how to avoid double clicking the canvas and selecting the whole page
// canvas.ondblclick = function(ev){
//   ev.preventDefault();
//   ev.stopPropagation();
// }

// VISUAL GUIDES
const canvasGuides = document.getElementById("canvas-guides");
canvasGuides.width = window.innerWidth;
canvasGuides.height = 500;
window.addEventListener("resize", (ev) => {
  canvasGuides.width = window.innerWidth;
  drawPlane(ctxGuides);
});
const ctxGuides = canvasGuides.getContext("2d", { willReadFrequently: true });

function drawPlane(ctx) {
  ctx.strokeStyle = "black";
  ctx.strokeRect(0, canvas.height / 2, canvas.width, 0);
  ctx.strokeRect(canvas.width / 2, 0, 0, canvas.height);
}
drawPlane(ctxGuides);

const guidesElem = document.getElementById("guides");
guidesElem.onclick = (ev) => {
  const { classList } = canvasGuides;
  const isHidden = classList.contains("hide");
  if (isHidden) {
    classList.remove("hide");
    guidesElem.innerText = "hide";
  } else {
    classList.add("hide");
    guidesElem.innerText = "show";
  }
};

function extractTouchData(ev) {
  if (touchSupported) {
    const [touches] = ev.touches;
    ev = { ev, x: touches.clientX, y: touches.clientY };
  }
  return ev;
}

// MANUAL PAINT
canvas[eventListeners[+touchSupported].start] = function (ev) {
  saveImageData();
  manualpaint = true;
  getPaintMode()(ev);
};
canvas[eventListeners[+touchSupported].end] = function (ev) {
  manualpaint = false;
};

// SAVING IMAGE BUFFER
function saveImageData() {
  imageData.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  toggleUndoDisable();
  if (imageData.length > 10) {
    imageData.shift();
  }
}

function restoreImageData() {
  if (imageData.length) {
    data = imageData.pop();
    ctx.putImageData(data, 0, 0);
  } else {
    console.log("Nothing to undo");
  }
  toggleUndoDisable();
}

// UNDO FUNCTIONALITY
function onCtrlZ(ev) {
  const comboKey = ev.ctrlKey || ev.metaKey;
  if (comboKey && ev.key === "z") {
    ev.preventDefault();
    restoreImageData();
  }
}

window.addEventListener("keydown", onCtrlZ);
const undoElem = document.getElementById("undo");
undoElem.onclick = restoreImageData;

function toggleUndoDisable() {
  const undoElem = document.getElementById("undo");
  if (imageData.length) {
    undoElem.disabled = false;
  } else {
    undoElem.disabled = true;
  }
}
function toggleDownloadDisable(override=false) {
  const downloadElem = document.getElementById("download");
  downloadElem.disabled = override ? false : true;
}

// DIVISIONS
const divisionElem = document.getElementById("divisions");
divisionElem.value = divisions;
divisionElem.onchange = (ev) => {
  divisions = ev.target.value;
};

// RESET
const resetElem = document.getElementById("reset");
resetElem.onclick = (ev) => {
  saveImageData();
  toggleDownloadDisable();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// DOWNLOAD
const downloadElem = document.getElementById("download");
downloadElem.onclick = (ev) => downloadImage(ev);

// BRUSH
const brushElem = document.getElementById("brush");
brush = brushElem.value;
brushElem.onchange = (ev) => {
  brush = ev.target.value;
  modifyCursor(mouse);
};

// BRUSH COLOR
const colorElem = document.getElementById("color");
colorElem.oninput = (ev) => {
  color = colorElem.value;
  desaturateRainbow();
};

// RAINBOW
const rainbowElem = document.getElementById("rainbow");
rainbowElem.onchange = (ev) => {
  rainbow = rainbowElem.checked;
  toggleRainbowSaturation();
  saveImageData();
};
const rainbowImgElem = document.getElementById("rainbow-image");
rainbowImgElem.onclick = toggleRainbowCheckbox;

function toggleRainbowCheckbox(ev) {
  rainbowElem.checked = !rainbowElem.checked;
  rainbow = rainbowElem.checked;
  toggleRainbowSaturation();
  saveImageData();
}

function desaturate(elem) {
  elem.classList.add("desaturate");
}
function saturate(elem) {
  elem.classList.remove("desaturate");
}
function toggleRainbowSaturation() {
  if (rainbowElem.checked) {
    saturate(rainbowImgElem);
  } else {
    desaturate(rainbowImgElem);
  }
}
function desaturateRainbow() {
  rainbowElem.checked = false;
  rainbow = false;
  desaturate(rainbowImgElem);
}

// INSTANCE SIZE
const instanceSizeElem = document.getElementById("instance-size");
instanceSizeElem.addEventListener("input", changeSize);
instanceSizeElem.value = size;

function changeSize(ev) {
  size = ev.target.value;
  halfSize = size / 2;
  modifyCursor(mouse);
}

function onBrushSizeKeypress(ev) {
  const { key } = ev;
  let tempSize;
  if (["[", "]"].includes(key)) {
    if (key == "[") {
      tempSize = Math.max(size - 10, 0);
    } else {
      tempSize = Math.min(size + 10, instanceSizeElem.max);
    }
    instanceSizeElem.value = tempSize;
    changeSize({ target: { value: tempSize } });
  }
}
window.addEventListener("keydown", onBrushSizeKeypress);

// AUTO PAINT
const autoPaintElem = document.getElementById("auto-paint");
autoPaintElem.onchange = autoPaintOnChange;

function autoPaintOnChange(ev) {
  autopaint = ev.target.checked;
}
window.addEventListener("keydown", (ev) => {
  if (ev.key === "a") {
    autopaint = !autopaint;
    autoPaintElem.checked = autopaint;
    saveImageData();
  }
});

// FILL
const fillElem = document.getElementById("fill");
fillElem.onchange = fillOnChange;

function fillOnChange(ev) {
  fill = ev.target.checked;
}
window.addEventListener("keydown", (ev) => {
  if (ev.key === "f") {
    fill = !fill;
    fillElem.checked = fill;
    saveImageData();
  }
});

// MODES
const modeElem = document.getElementById("modality");
const modes = { single, rotated, reflected, division };

// WRAPPERS
const paintWrapper = (paintType) => (ev) => {
  ev.preventDefault();
  ev = extractTouchData(ev);
  toggleDownloadDisable(true);
  return autopaint || manualpaint ? paintType(ev) : null;
};

//initialize mode
canvas[eventListeners[+touchSupported].move] = paintWrapper(division);
modeElem.onchange = modeOnChange;

function deactivateDivisions(mode) {
  if (mode !== "division") {
    divisionElem.disabled = true;
  } else {
    divisionElem.disabled = false;
  }
}

function modeOnChange(ev) {
  const mode = ev?.target.value;
  deactivateDivisions(mode);
  setMode(mode);
}

function setMode(mode) {
  // switch mode and its event handler based on autopaint
  canvas[eventListeners[+touchSupported].move] = paintWrapper(modes[mode]);
}

// Utility to access modes before their declaration
function getPaintMode() {
  const modeElem = document.getElementById("modality");
  return paintWrapper(modes[modeElem.value]);
}

function single(ev) {
  draw(ev);
  hue++;
  hue %= 360;
}

function reflected(ev) {
  ctx.save();
  draw(ev);
  ctx.transform(-1, 0, 0, 1, canvas.width, 0);
  draw(ev);
  ctx.restore();
  hue++;
  hue %= 360;
}

function rotated(ev) {
  ctx.save();
  draw(ev);
  ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height);
  draw(ev);
  ctx.restore();
  hue++;
  hue %= 360;
}

function getCuadrand(dx, dy) {
  const x = dx / Math.abs(dx);
  const y = dy / Math.abs(dy);
  if (x == -1 && y == 1) {
    // -1 1
    return 0;
  } else if ((x == 1 || isNaN(x)) && y == 1) {
    return 1;
  } else if (x == 1 && (isNaN(y) || y == -1)) {
    return 2;
  } else {
    return 3;
  }
}

// TODO: Change to radians and simplify division function below
const angleNormalize = [
  (angle) => angle,
  (angle) => 180 - angle,
  (angle) => 180 + Math.abs(angle),
  (angle) => 360 + angle,
];

function getXinCircle(angle, radius) {
  return Math.cos((angle * Math.PI) / 180) * radius;
}
function getYinCircle(angle, radius) {
  return Math.sin((angle * Math.PI) / 180) * radius;
}

function division(ev) {
  const { x, y } = ev;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const dx = centerX - x;
  const dy = centerY - y;
  const radius = Math.sqrt(dx ** 2 + dy ** 2);
  const sinThetha = dy / radius;
  let pointAngle = (Math.asin(sinThetha) * 180) / Math.PI;
  const angleDivision = 360 / divisions;
  const cuadrant = getCuadrand(dx, dy);
  const thetha = angleNormalize[cuadrant](pointAngle);
  // ctx.strokeRect(x,y,30,30)
  for (let i = 0; i <= divisions; i++) {
    const angle = i * angleDivision - thetha;
    const newX = getXinCircle(angle, radius);
    const newY = getYinCircle(angle, radius);
    // ctx.strokeRect(newX + centerX,newY + centerY,30,30)
    draw({ x: newX + centerX, y: newY + centerY });
    hue++;
    hue %= 360;
  }
}

const brushes = { circle, square };

function circle(x, y, ctx, centered = true, cursor = false) {
  ctx.beginPath();
  const position = (val) => (centered ? val : val + halfSize);
  ctx.arc(position(x), position(y), halfSize, 0, Math.PI * 2);
  if (!cursor && fill) {
    ctx.fill();
  }
  ctx.stroke();
}

function square(x, y, ctx, centered = true, cursor = false) {
  const centeredAmount = centered ? halfSize : 0;
  const rectType = !cursor && fill ? "fillRect" : "strokeRect";
  ctx[rectType](x - centeredAmount, y - centeredAmount, size, size);
}

function draw(ev) {
  const { x, y } = ev;
  const { r, g, b } = hslToRgb(hue);
  // ctx.fillStyle = "rgb()";
  // ctx.fillRect(x, y, 100, 100);
  ctx.strokeStyle = rainbow ? `rgb(${r},${g},${b})` : color;
  ctx.fillStyle = rainbow ? `rgb(${r},${g},${b})` : color;
  brushes[brush](x, y, ctx);
}

// DOWNLOAD

function downloadImage(ev) {
  const a = document.createElement("a");
  a.href = canvas
    .toDataURL("image/png", 1)
    .replace("image/png", "image/octet-stream");
  a.download = `mandala.patricio.work.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function hslToRgb(h, s = 100, l = 50) {
  // Convert HSL values to 0-1 range
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    // If saturation is 0, the color is achromatic (gray)
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  // Scale RGB values to 0-255 range and round them
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// MOUSE CANVAS
const mouseCanvas = document.getElementById("canvas-mouse");
mouseCanvas.style.position = "fixed";
mouseCanvas.style.zIndex = -1;
let centerCursorDebounced = false;
const ctxMouseCanvas = mouseCanvas.getContext("2d");
function modifyCursor({ x, y } = {}) {
  mouseCanvas.width = size;
  mouseCanvas.height = size;
  ctxMouseCanvas.strokeStyle = "gray";
  brushes[brush](0, 0, ctxMouseCanvas, false, true);
  centerCursor({ x, y });
}
function centerCursor({ x, y }) {
  mouse = { x, y };
  if (!centerCursorDebounced) {
    mouseCanvas.style.left = `${x - halfSize}px`;
    mouseCanvas.style.top = `${y - halfSize}px`;
    centerCursorDebounced = true;
    setTimeout(() => {
      centerCursorDebounced = false;
    }, 10);
  }
}
modifyCursor(ctxMouseCanvas);
document.addEventListener("mousemove", centerCursor);
