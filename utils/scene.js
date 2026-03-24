/**
 * 场景系统 —— 客厅场景的物品布局与绘制
 * 所有坐标基于 750 x 1200 的逻辑画布，运行时按比例缩放
 */
var draw = require('./draw-utils');

// 猫的颜色池
var CAT_COLORS = ['#ff9944', '#ffcc66', '#aaaaaa', '#886644', '#ffddaa'];

// 物品定义：每个物品有 id, name, x, y, w, h 以及自己的绘制函数
var ITEMS = [
  {
    id: 'sofa', name: '沙发', x: 60, y: 420, w: 280, h: 120,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 12, '#8B6F47');
      draw.roundRect(ctx, x + 8, y + 8, w - 16, h * 0.55, 8, '#A0845C');
      // 靠垫
      draw.roundRect(ctx, x + 15, y + 15, 55, 35, 6, '#cc7755');
      draw.roundRect(ctx, x + 80, y + 15, 55, 35, 6, '#5588aa');
      draw.roundRect(ctx, x + 145, y + 15, 55, 35, 6, '#cc7755');
    }
  },
  {
    id: 'table', name: '茶几', x: 180, y: 560, w: 160, h: 80,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 6, '#A0522D');
      draw.roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 4, '#C4793A');
      // 桌上一个杯子
      draw.roundRect(ctx, x + 65, y + 15, 30, 40, 4, '#eee');
    }
  },
  {
    id: 'tv', name: '电视', x: 180, y: 80, w: 200, h: 130,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 8, '#222');
      draw.roundRect(ctx, x + 8, y + 8, w - 16, h - 30, 4, '#334455');
      // 底座
      draw.roundRect(ctx, x + 75, y + h - 18, 50, 16, 3, '#333');
    }
  },
  {
    id: 'vase1', name: '花瓶A', x: 400, y: 100, w: 40, h: 70,
    draw: function(ctx, x, y, w, h) {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y);
      ctx.quadraticCurveTo(x, y + h * 0.6, x + w * 0.15, y + h);
      ctx.lineTo(x + w * 0.85, y + h);
      ctx.quadraticCurveTo(x + w, y + h * 0.6, x + w * 0.7, y);
      ctx.closePath();
      ctx.fillStyle = '#4488aa';
      ctx.fill();
      // 花
      draw.ellipse(ctx, x + w * 0.5, y - 10, 12, 8, '#ff6688');
      draw.ellipse(ctx, x + w * 0.3, y - 5, 8, 6, '#ff8866');
    }
  },
  {
    id: 'vase2', name: '花瓶B', x: 500, y: 105, w: 38, h: 65,
    draw: function(ctx, x, y, w, h) {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y);
      ctx.quadraticCurveTo(x, y + h * 0.6, x + w * 0.15, y + h);
      ctx.lineTo(x + w * 0.85, y + h);
      ctx.quadraticCurveTo(x + w, y + h * 0.6, x + w * 0.7, y);
      ctx.closePath();
      ctx.fillStyle = '#66aa88';
      ctx.fill();
      draw.ellipse(ctx, x + w * 0.5, y - 8, 10, 7, '#ffcc44');
    }
  },
  {
    id: 'book1', name: '书本A', x: 560, y: 400, w: 50, h: 65,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 3, '#cc4444');
      draw.roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 2, '#dd6666');
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('猫的', x + w / 2, y + h * 0.4);
      ctx.fillText('秘密', x + w / 2, y + h * 0.6);
    }
  },
  {
    id: 'book2', name: '书本B', x: 620, y: 405, w: 48, h: 60,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 3, '#4466cc');
      draw.roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 2, '#6688dd');
    }
  },
  {
    id: 'lamp', name: '台灯', x: 620, y: 250, w: 50, h: 90,
    draw: function(ctx, x, y, w, h) {
      // 灯罩
      ctx.beginPath();
      ctx.moveTo(x + 10, y);
      ctx.lineTo(x, y + 35);
      ctx.lineTo(x + w, y + 35);
      ctx.lineTo(x + w - 10, y);
      ctx.closePath();
      ctx.fillStyle = '#ffdd88';
      ctx.fill();
      // 灯杆
      draw.roundRect(ctx, x + w / 2 - 4, y + 35, 8, 40, 2, '#888');
      // 底座
      draw.ellipse(ctx, x + w / 2, y + h - 5, 18, 6, '#666');
    }
  },
  {
    id: 'clock', name: '时钟', x: 100, y: 100, w: 55, h: 55,
    draw: function(ctx, x, y, w, h) {
      var cx = x + w / 2, cy = y + h / 2, r = w / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 刻度
      for (var i = 0; i < 12; i++) {
        var angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * (r - 6), cy + Math.sin(angle) * (r - 6));
        ctx.lineTo(cx + Math.cos(angle) * (r - 2), cy + Math.sin(angle) * (r - 2));
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // 时针
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 10, cy - 8);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 分针
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 4, cy - 15);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  },
  {
    id: 'plant', name: '盆栽', x: 30, y: 250, w: 55, h: 80,
    draw: function(ctx, x, y, w, h) {
      // 花盆
      ctx.beginPath();
      ctx.moveTo(x + 8, y + h * 0.45);
      ctx.lineTo(x + 2, y + h);
      ctx.lineTo(x + w - 2, y + h);
      ctx.lineTo(x + w - 8, y + h * 0.45);
      ctx.closePath();
      ctx.fillStyle = '#cc6633';
      ctx.fill();
      // 叶子
      draw.ellipse(ctx, x + w * 0.5, y + h * 0.25, 20, 14, '#44aa55');
      draw.ellipse(ctx, x + w * 0.3, y + h * 0.35, 14, 10, '#55bb66');
      draw.ellipse(ctx, x + w * 0.7, y + h * 0.32, 14, 10, '#55bb66');
    }
  },
  {
    id: 'pillow1', name: '靠枕A', x: 370, y: 450, w: 55, h: 45,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 10, '#ee8866');
    }
  },
  {
    id: 'pillow2', name: '靠枕B', x: 440, y: 445, w: 50, h: 48,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 10, '#6688cc');
    }
  },
  {
    id: 'cup', name: '杯子', x: 280, y: 565, w: 28, h: 38,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 4, '#eee');
      // 把手
      ctx.beginPath();
      ctx.arc(x + w + 4, y + h * 0.4, 8, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },
  {
    id: 'frame', name: '相框', x: 480, y: 80, w: 70, h: 55,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 4, '#996633');
      draw.roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 2, '#aaddff');
    }
  },
  {
    id: 'rug', name: '地毯', x: 150, y: 700, w: 250, h: 120,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 8, '#884466');
      draw.roundRect(ctx, x + 15, y + 15, w - 30, h - 30, 6, '#995577');
      // 花纹
      draw.ellipse(ctx, x + w / 2, y + h / 2, 30, 15, '#aa6688');
    }
  },
  {
    id: 'shoe1', name: '拖鞋A', x: 80, y: 780, w: 40, h: 20,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 8, '#ff9977');
    }
  },
  {
    id: 'shoe2', name: '拖鞋B', x: 130, y: 785, w: 40, h: 20,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 8, '#ff9977');
    }
  },
  {
    id: 'remote', name: '遥控器', x: 350, y: 580, w: 22, h: 55,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 4, '#222');
      // 按钮
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 15, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff3333';
      ctx.fill();
      draw.roundRect(ctx, x + 4, y + 25, 14, 8, 2, '#444');
    }
  },
];

// 猫可以伪装成的额外物品（"多出来"的物品模板）
// 每个包含绘制函数和尺寸，用于在场景中随机位置生成
var EXTRA_ITEM_TEMPLATES = [
  {
    type: 'extra_vase', name: '可疑花瓶', w: 38, h: 65,
    draw: function(ctx, x, y, w, h) {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y);
      ctx.quadraticCurveTo(x, y + h * 0.6, x + w * 0.15, y + h);
      ctx.lineTo(x + w * 0.85, y + h);
      ctx.quadraticCurveTo(x + w, y + h * 0.6, x + w * 0.7, y);
      ctx.closePath();
      ctx.fillStyle = '#5599aa';
      ctx.fill();
    }
  },
  {
    type: 'extra_book', name: '可疑书本', w: 48, h: 60,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 3, '#55aa55');
      draw.roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 2, '#77cc77');
    }
  },
  {
    type: 'extra_pillow', name: '可疑靠枕', w: 52, h: 46,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 10, '#cc88aa');
    }
  },
  {
    type: 'extra_cup', name: '可疑杯子', w: 28, h: 38,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 4, '#ddd');
      ctx.beginPath();
      ctx.arc(x + w + 4, y + h * 0.4, 8, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },
  {
    type: 'extra_shoe', name: '可疑拖鞋', w: 40, h: 20,
    draw: function(ctx, x, y, w, h) {
      draw.roundRect(ctx, x, y, w, h, 8, '#77bbff');
    }
  },
];

// 额外物品可放置的空位区域（避免重叠）
var EMPTY_SLOTS = [
  { x: 520, y: 520 },
  { x: 450, y: 700 },
  { x: 600, y: 600 },
  { x: 30, y: 650 },
  { x: 580, y: 150 },
  { x: 100, y: 350 },
  { x: 500, y: 300 },
  { x: 300, y: 300 },
];

// 绘制房间背景
function drawBackground(ctx, W, H) {
  // 墙壁
  ctx.fillStyle = '#3d3d5c';
  ctx.fillRect(0, 0, W, H * 0.55);
  // 地板
  ctx.fillStyle = '#5c4a3a';
  ctx.fillRect(0, H * 0.55, W, H * 0.45);
  // 踢脚线
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(0, H * 0.55 - 4, W, 8);
  // 墙上装饰线
  ctx.strokeStyle = '#4d4d6c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.05);
  ctx.lineTo(W, H * 0.05);
  ctx.stroke();
}

module.exports = {
  ITEMS: ITEMS,
  EXTRA_ITEM_TEMPLATES: EXTRA_ITEM_TEMPLATES,
  EMPTY_SLOTS: EMPTY_SLOTS,
  CAT_COLORS: CAT_COLORS,
  drawBackground: drawBackground,
};
