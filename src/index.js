// GLOBALS
let hue = 0;
let size = 10;
let autopaint = true;
let manualpaint = false;
let brush;
const imageData = [];

// CANVAS
const canvas = document.getElementById("canvas");
// TODO: check how to avoid double clicking the canvas and selecting the whole page
// canvas.ondblclick = function(ev){
//   ev.preventDefault();
//   ev.stopPropagation();
// }
const ctx = canvas.getContext("2d");

// MANUAL PAINT
canvas.onmousedown = function (ev) {
  saveImageData();
  manualpaint = true;
};
canvas.onmouseup = function (ev) {
  manualpaint = false;
};

// SAVING IMAGE BUFFER
function saveImageData() {
    imageData.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if(imageData.length > 10){
      imageData.shift();
    }
}

function recoverImageData() {
  if (imageData.length) {
    data = imageData.pop();
    ctx.putImageData(data, 0, 0);
  } else {
    console.log("Nothing to undo");
  }
}

// UNDO FUNCTIONALITY
function onCtrlZ(ev) {
  console.log(ev);
  const comboKey = ev.ctrlKey || ev.metaKey;
  if (comboKey && ev.key === "z") {
    recoverImageData();
  }
}

window.addEventListener("keydown", onCtrlZ);

// RESET
const resetElem = document.getElementById("reset");
resetElem.onclick = (ev) => {
  saveImageData();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// BRUSH
const brushElem = document.getElementById("brush");
brush = brushElem.value;
brushElem.onchange = (ev) => (brush = ev.target.value);

// INSTANCE SIZE
const instanceSizeElem = document.getElementById("instance-size");
instanceSizeElem.onchange = changeSize;
instanceSizeElem.value = size;

function changeSize(ev) {
  size = ev.target.value;
}

// AUTO PAINT
const autoPaintElem = document.getElementById("auto-paint");
autoPaintElem.onchange = autoPaintOnChange;
const drawingEventType = { false: "onmousedown", true: "onmousemove" };

function autoPaintOnChange(ev) {
  autopaint = ev.target.checked;
}

// MODES
const modeElem = document.getElementById("modality");
const modes = { single, rotated, reflected };

// WRAPPERS
const paintWrapper = (paintType) => (ev) =>
  autopaint || manualpaint ? paintType(ev) : null;

//initialize mode
canvas[drawingEventType[autopaint]] = paintWrapper(single);
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

const brushes = { circle, square };

function circle(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();
}

function square(x, y) {
  ctx.strokeRect(x, y, size, size);
}

function draw(ev) {
  const { x, y } = ev;
  const { r, g, b } = hslToRgb(hue);
  // ctx.fillStyle = "rgb()";
  // ctx.fillRect(x, y, 100, 100);
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  brushes[brush](x, y);
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
