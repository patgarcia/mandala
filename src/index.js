// GLOBALS
let hue = 0;
let size = 10

// CANVAS
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// RESET
const resetElem = document.getElementById("reset");
resetElem.onclick = ev => ctx.clearRect(0, 0, canvas.width, canvas.height);

// INSTANCE SIZE
const instanceSizeElem = document.getElementById('instance-size');
instanceSizeElem.onchange = changeSize;

function changeSize(ev){
  console.log(ev.target.value)
  size = ev.target.value;
}

// MODES
const modeElem = document.getElementById("modality");
const modes = { single, rotated };
canvas.onmousemove = single;
modeElem.onchange = setMode;


function setMode(ev) {
  canvas.onmousemove = modes[ev.target.value];
}

function single(ev) {
  drawCircle(ev);
  hue++;
  hue %= 360;
}

function rotated(ev) {
  ctx.save();
  drawCircle(ev);
  ctx.translate(canvas.width, canvas.height);
  ctx.rotate(Math.PI);
  drawCircle(ev);
  ctx.restore();
  hue++;
  hue %= 360;
}

function drawCircle(ev) {
  const { x, y } = ev;
  const { r, g, b } = hslToRgb(hue);
  // ctx.fillStyle = "rgb()";
  // ctx.fillRect(x, y, 100, 100);
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();
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
