const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let h = 0;

canvas.onmousemove = function (ev) {
  const { x, y } = ev;
  const { r, g, b } = hslToRgb(h);
  h++;
  h %= 360;
  // ctx.fillStyle = "rgb()";
  // ctx.fillRect(x, y, 100, 100);
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.stroke();
};

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
