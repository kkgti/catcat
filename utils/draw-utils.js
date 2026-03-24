/**
 * 绘制工具函数 —— 用代码绘制所有游戏图形
 */

// 绘制圆角矩形
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

// 绘制椭圆
function ellipse(ctx, cx, cy, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

// 绘制猫咪（被发现后的形态）
function drawCat(ctx, x, y, size, color) {
  var s = size;
  // 身体
  ellipse(ctx, x, y + s * 0.1, s * 0.35, s * 0.3, color);
  // 头
  ctx.beginPath();
  ctx.arc(x, y - s * 0.2, s * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // 耳朵
  ctx.beginPath();
  ctx.moveTo(x - s * 0.18, y - s * 0.35);
  ctx.lineTo(x - s * 0.08, y - s * 0.52);
  ctx.lineTo(x + s * 0.02, y - s * 0.35);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.18, y - s * 0.35);
  ctx.lineTo(x + s * 0.08, y - s * 0.52);
  ctx.lineTo(x - s * 0.02, y - s * 0.35);
  ctx.fillStyle = color;
  ctx.fill();
  // 眼睛
  ctx.beginPath();
  ctx.arc(x - s * 0.08, y - s * 0.22, s * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = '#333';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s * 0.08, y - s * 0.22, s * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = '#333';
  ctx.fill();
  // 眼睛高光
  ctx.beginPath();
  ctx.arc(x - s * 0.06, y - s * 0.24, s * 0.015, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s * 0.10, y - s * 0.24, s * 0.015, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  // 鼻子
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.15);
  ctx.lineTo(x - s * 0.025, y - s * 0.13);
  ctx.lineTo(x + s * 0.025, y - s * 0.13);
  ctx.fillStyle = '#ff9999';
  ctx.fill();
  // 嘴巴
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.13);
  ctx.quadraticCurveTo(x - s * 0.06, y - s * 0.08, x - s * 0.08, y - s * 0.10);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.13);
  ctx.quadraticCurveTo(x + s * 0.06, y - s * 0.08, x + s * 0.08, y - s * 0.10);
  ctx.stroke();
}

// 绘制文字（居中）
function drawText(ctx, text, x, y, fontSize, color, align) {
  ctx.font = fontSize + 'px sans-serif';
  ctx.fillStyle = color || '#fff';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

module.exports = {
  roundRect: roundRect,
  ellipse: ellipse,
  drawCat: drawCat,
  drawText: drawText,
};
