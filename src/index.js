// GLOBALS
let hue = 0;
let size = 30;
let halfSize = size / 2;
let autopaint = true;
let manualpaint = false;
let brush;
let mouse = { x: 0, y: 0 };
const imageData = [];
const divisions = 5;

// CANVAS
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = 500;

window.addEventListener("resize", (ev) => {
  saveImageData();
  canvas.width = window.innerWidth;
  restoreImageData();
});
// TODO: check how to avoid double clicking the canvas and selecting the whole page
// canvas.ondblclick = function(ev){
//   ev.preventDefault();
//   ev.stopPropagation();
// }
const ctx = canvas.getContext("2d", { willReadFrequently: true });
function drawPlane() {
  ctx.strokeStyle = "black";
  ctx.strokeRect(0, canvas.height / 2, canvas.width, 0);
  ctx.strokeRect(canvas.width / 2, 0, 0, canvas.height);
}
drawPlane();

// MANUAL PAINT
canvas.onmousedown = function (ev) {
  saveImageData();
  manualpaint = true;
  draw(ev);
};
canvas.onmouseup = function (ev) {
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

// RESET
const resetElem = document.getElementById("reset");
resetElem.onclick = (ev) => {
  saveImageData();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// BRUSH
const brushElem = document.getElementById("brush");
brush = brushElem.value;
brushElem.onchange = (ev) => {
  brush = ev.target.value;
  modifyCursor(mouse);
};

// INSTANCE SIZE
const instanceSizeElem = document.getElementById("instance-size");
instanceSizeElem.addEventListener("input", changeSize);
instanceSizeElem.value = size;

function changeSize(ev) {
  size = ev.target.value;
  halfSize = size / 2;
  modifyCursor(mouse);
}

// AUTO PAINT
const autoPaintElem = document.getElementById("auto-paint");
autoPaintElem.onchange = autoPaintOnChange;

function autoPaintOnChange(ev) {
  autopaint = ev.target.checked;
}

// MODES
const modeElem = document.getElementById("modality");
const modes = { single, rotated, reflected, division };

// WRAPPERS
const paintWrapper = (paintType) => (ev) =>
  autopaint || manualpaint ? paintType(ev) : null;

//initialize mode
canvas.onmousemove = paintWrapper(single);
modeElem.onchange = modeOnChange;

function modeOnChange(ev) {
  const mode = ev?.target.value;
  setMode(mode);
}

function setMode(mode) {
  // switch mode and its event handler based on autopaint
  canvas.onmousemove = paintWrapper(modes[mode]);
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

// function division(ev) {
//   const angle = Math.PI * 2 / divisions;
//   for(let segment=0; segment < divisions; segment++){
//     ctx.save();
//     if(segment){
//       ctx.rotate(segment * angle)
//       ctx.translate()
//     }
//     draw(ev);
//     hue++;
//     hue %= 360;
//     ctx.restore();
//   }
// }

function getCuadrand(dx, dy) {
  const x = dx/Math.abs(dx)
  const y = dy/Math.abs(dy)
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

function getXinCircle(angle, radius){
  return Math.cos(angle * Math.PI / 180) * radius;
}
function getYinCircle(angle, radius){
  return Math.sin(angle * Math.PI / 180) * radius;
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
  const cuadrant = getCuadrand(dx,dy)
  const thetha = angleNormalize[cuadrant](pointAngle);
  // ctx.strokeRect(x,y,30,30)
  for(let i=0; i <= divisions; i++){
    const angle = (i * angleDivision) - thetha;
    const newX = getXinCircle(angle, radius);
    const newY = getYinCircle(angle, radius);
    console.log({newX, newY})
    // ctx.strokeRect(newX + centerX,newY + centerY,30,30)
    draw({x: newX + centerX, y: newY + centerY})
    hue++;
    hue %= 360;
  }

}

const brushes = { circle, square };

function circle(x, y, ctx, centered = true) {
  ctx.beginPath();
  const position = (val) => (centered ? val : val + halfSize);
  ctx.arc(position(x), position(y), halfSize, 0, Math.PI * 2);
  ctx.stroke();
}

function square(x, y, ctx, centered = true) {
  const centeredAmount = centered ? halfSize : 0;
  ctx.strokeRect(x - centeredAmount, y - centeredAmount, size, size);
}

function draw(ev) {
  const { x, y } = ev;
  const { r, g, b } = hslToRgb(hue);
  // ctx.fillStyle = "rgb()";
  // ctx.fillRect(x, y, 100, 100);
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  brushes[brush](x, y, ctx);
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
  // ctxMouseCanvas.strokeRect(0,0, size, size)
  brushes[brush](0, 0, ctxMouseCanvas, false);
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
    }, 20);
  }
}
modifyCursor(ctxMouseCanvas);
document.addEventListener("mousemove", centerCursor);
