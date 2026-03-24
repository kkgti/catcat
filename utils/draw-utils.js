/**
 * 绘制工具函数 —— 用代码绘制所有游戏图形
 * 同步自 preview.html DrawUtils
 */

// 绘制圆角矩形
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

// 绘制椭圆
function ellipse(ctx, cx, cy, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
}

// 绘制猫咪（被发现后的形态）
function drawCat(ctx, x, y, size, color) {
  var s = size;
  ellipse(ctx, x, y + s*0.1, s*0.35, s*0.3, color);
  ctx.beginPath(); ctx.arc(x, y - s*0.2, s*0.22, 0, Math.PI*2); ctx.fillStyle = color; ctx.fill();
  // 耳朵
  ctx.beginPath(); ctx.moveTo(x-s*0.18,y-s*0.35); ctx.lineTo(x-s*0.08,y-s*0.52); ctx.lineTo(x+s*0.02,y-s*0.35); ctx.fillStyle=color; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x-s*0.15,y-s*0.36); ctx.lineTo(x-s*0.09,y-s*0.47); ctx.lineTo(x,y-s*0.36); ctx.fillStyle='#ff9999'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x+s*0.18,y-s*0.35); ctx.lineTo(x+s*0.08,y-s*0.52); ctx.lineTo(x-s*0.02,y-s*0.35); ctx.fillStyle=color; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x+s*0.15,y-s*0.36); ctx.lineTo(x+s*0.09,y-s*0.47); ctx.lineTo(x,y-s*0.36); ctx.fillStyle='#ff9999'; ctx.fill();
  // 眼睛
  ctx.beginPath(); ctx.arc(x-s*0.08,y-s*0.22,s*0.045,0,Math.PI*2); ctx.fillStyle='#333'; ctx.fill();
  ctx.beginPath(); ctx.arc(x+s*0.08,y-s*0.22,s*0.045,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x-s*0.06,y-s*0.24,s*0.018,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(x+s*0.10,y-s*0.24,s*0.018,0,Math.PI*2); ctx.fill();
  // 鼻+嘴
  ctx.beginPath(); ctx.moveTo(x,y-s*0.15); ctx.lineTo(x-s*0.03,y-s*0.12); ctx.lineTo(x+s*0.03,y-s*0.12); ctx.fillStyle='#ff9999'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x,y-s*0.12); ctx.quadraticCurveTo(x-s*0.06,y-s*0.07,x-s*0.09,y-s*0.09); ctx.strokeStyle='#555'; ctx.lineWidth=1.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x,y-s*0.12); ctx.quadraticCurveTo(x+s*0.06,y-s*0.07,x+s*0.09,y-s*0.09); ctx.stroke();
  // 胡须
  ctx.lineWidth=0.8; ctx.strokeStyle='#888';
  ctx.beginPath(); ctx.moveTo(x-s*0.12,y-s*0.14); ctx.lineTo(x-s*0.28,y-s*0.17); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x-s*0.12,y-s*0.11); ctx.lineTo(x-s*0.28,y-s*0.11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+s*0.12,y-s*0.14); ctx.lineTo(x+s*0.28,y-s*0.17); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+s*0.12,y-s*0.11); ctx.lineTo(x+s*0.28,y-s*0.11); ctx.stroke();
  // 尾巴
  ctx.beginPath(); ctx.moveTo(x+s*0.3,y+s*0.15); ctx.quadraticCurveTo(x+s*0.5,y-s*0.05,x+s*0.4,y-s*0.15);
  ctx.strokeStyle=color; ctx.lineWidth=s*0.06; ctx.lineCap='round'; ctx.stroke(); ctx.lineCap='butt';
}

module.exports = {
  roundRect: roundRect,
  ellipse: ellipse,
  drawCat: drawCat,
};
