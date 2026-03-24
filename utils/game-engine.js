/**
 * 游戏引擎 —— 状态机、渲染循环、碰撞检测
 * 阶段1：核心可玩版本
 */
var draw = require('./draw-utils');
var scene = require('./scene');
var catSystem = require('./cat-system');

// 游戏状态
var STATE = {
  READY: 'ready',       // 准备开始
  PLAYING: 'playing',   // 游戏中
  FOUND_ANIM: 'found_anim', // 找到猫的动画中
  WRONG_ANIM: 'wrong_anim', // 点错的动画中
  WIN: 'win',           // 全部找到
  LOSE: 'lose',         // 生命耗尽
};

function GameEngine() {
  this.state = STATE.READY;
  this.ctx = null;
  this.canvasW = 0;
  this.canvasH = 0;
  this.scale = 1;

  // 逻辑画布尺寸
  this.LOGIC_W = 750;
  this.LOGIC_H = 900;

  // 游戏数据
  this.lives = 3;
  this.maxLives = 3;
  this.timer = 90;
  this.score = 0;
  this.catCount = 4;
  this.foundCount = 0;

  // 猫系统数据
  this.cats = [];
  this.allItems = [];
  this.replacedIds = [];

  // 动画状态
  this.animTimer = 0;
  this.currentFoundCat = null;
  this.wrongItem = null;
  this.wrongAnimTimer = 0;

  // 时间
  this.lastTime = 0;
  this.timerAccum = 0;

  // 提示文字
  this.toast = '';
  this.toastTimer = 0;

  // 回调
  this.onGameEnd = null;

  // 动画帧 ID
  this._rafId = null;
}

GameEngine.prototype.init = function(ctx, canvasW, canvasH, dpr) {
  this.ctx = ctx;
  this.canvasW = canvasW;
  this.canvasH = canvasH;
  this.dpr = dpr || 1;
  this.scale = canvasW / this.LOGIC_W;
  // 调整逻辑高度以适配屏幕比例
  this.LOGIC_H = canvasH / this.scale;
};

GameEngine.prototype.startGame = function() {
  this.state = STATE.PLAYING;
  this.lives = 3;
  this.timer = 90;
  this.score = 0;
  this.foundCount = 0;
  this.toast = '';
  this.toastTimer = 0;
  this.animTimer = 0;
  this.currentFoundCat = null;
  this.wrongItem = null;

  // 生成猫
  var result = catSystem.generateCats(this.catCount);
  this.cats = result.cats;
  this.allItems = result.allItems;
  this.replacedIds = result.replacedIds;

  this.lastTime = Date.now();
  this.timerAccum = 0;

  this._startLoop();
};

GameEngine.prototype._startLoop = function() {
  var self = this;
  function loop() {
    self._update();
    self._render();
    self._rafId = self.ctx.requestAnimationFrame
      ? self.ctx.requestAnimationFrame(loop)
      : requestAnimationFrame(loop);
  }
  loop();
};

GameEngine.prototype.stop = function() {
  if (this._rafId != null) {
    if (this.ctx.cancelAnimationFrame) {
      this.ctx.cancelAnimationFrame(this._rafId);
    } else {
      cancelAnimationFrame(this._rafId);
    }
    this._rafId = null;
  }
};

// ========== 更新逻辑 ==========

GameEngine.prototype._update = function() {
  var now = Date.now();
  var dt = (now - this.lastTime) / 1000;
  this.lastTime = now;

  if (this.state === STATE.PLAYING) {
    // 倒计时（柔性，不会直接导致失败，但影响评分）
    this.timerAccum += dt;
    if (this.timerAccum >= 1) {
      this.timerAccum -= 1;
      if (this.timer > 0) this.timer--;
    }
  }

  // 找到猫的动画
  if (this.state === STATE.FOUND_ANIM) {
    this.animTimer -= dt;
    if (this.currentFoundCat) {
      this.currentFoundCat.foundAnim = Math.min(1, 1 - this.animTimer / 1.2);
    }
    if (this.animTimer <= 0) {
      this.state = STATE.PLAYING;
      this.currentFoundCat = null;
      // 检查是否全部找到
      if (this.foundCount >= this.cats.length) {
        this.state = STATE.WIN;
        this._onEnd();
      }
    }
  }

  // 点错的动画
  if (this.state === STATE.WRONG_ANIM) {
    this.wrongAnimTimer -= dt;
    if (this.wrongAnimTimer <= 0) {
      this.wrongItem = null;
      if (this.lives <= 0) {
        this.state = STATE.LOSE;
        this._onEnd();
      } else {
        this.state = STATE.PLAYING;
      }
    }
  }

  // Toast 提示
  if (this.toastTimer > 0) {
    this.toastTimer -= dt;
    if (this.toastTimer <= 0) this.toast = '';
  }
};

// ========== 渲染 ==========

GameEngine.prototype._render = function() {
  var ctx = this.ctx;
  var s = this.scale;
  var W = this.LOGIC_W;
  var H = this.LOGIC_H;

  ctx.clearRect(0, 0, this.canvasW * this.dpr, this.canvasH * this.dpr);
  ctx.save();
  ctx.scale(s * this.dpr, s * this.dpr);

  // 背景
  scene.drawBackground(ctx, W, H);

  // 绘制所有物品
  var self = this;
  this.allItems.forEach(function(item) {
    if (item.isCat && item.catRef.found) {
      // 已找到的猫：显示猫的形态
      self._drawFoundCat(ctx, item.catRef);
    } else if (self.wrongItem && self.wrongItem.id === item.id) {
      // 点错动画
      self._drawWrongItem(ctx, item);
    } else {
      // 正常绘制物品（或猫伪装）
      item.drawFn(ctx, item.x, item.y, item.w, item.h);
    }
  });

  // HUD
  this._drawHUD(ctx, W);

  // Toast
  if (this.toast) {
    this._drawToast(ctx, W, H);
  }

  // 结束画面
  if (this.state === STATE.WIN || this.state === STATE.LOSE) {
    this._drawEndScreen(ctx, W, H);
  }

  ctx.restore();
};

GameEngine.prototype._drawFoundCat = function(ctx, cat) {
  var progress = cat.foundAnim;
  // 缩放弹出动画
  var scale = progress < 0.5
    ? 0.5 + progress * 1.5  // 弹出放大
    : 1.2 - (progress - 0.5) * 0.4;  // 回弹到正常
  var cx = cat.x + cat.w / 2;
  var cy = cat.y + cat.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  draw.drawCat(ctx, cx, cy, Math.max(cat.w, cat.h) * 0.8, cat.color);
  ctx.restore();

  // 台词气泡（动画完成后显示）
  if (progress > 0.6) {
    var alpha = Math.min(1, (progress - 0.6) / 0.3);
    ctx.globalAlpha = alpha;
    var bx = cat.x + cat.w / 2;
    var by = cat.y - 30;
    draw.roundRect(ctx, bx - 80, by - 20, 160, 28, 8, 'rgba(0,0,0,0.75)');
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 截断过长的台词
    var txt = cat.quote.length > 14 ? cat.quote.substring(0, 14) + '..' : cat.quote;
    ctx.fillText(txt, bx, by - 6);
    ctx.globalAlpha = 1;
  }
};

GameEngine.prototype._drawWrongItem = function(ctx, item) {
  // 抖动效果
  var shakeX = Math.sin(this.wrongAnimTimer * 30) * 4;
  ctx.save();
  ctx.translate(shakeX, 0);
  item.drawFn(ctx, item.x, item.y, item.w, item.h);
  // 红色闪烁叠加
  ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
  ctx.fillRect(item.x - 3, item.y - 3, item.w + 6, item.h + 6);
  ctx.restore();
};

GameEngine.prototype._drawHUD = function(ctx, W) {
  // 顶部栏背景
  draw.roundRect(ctx, 10, 10, W - 20, 50, 12, 'rgba(0,0,0,0.5)');

  // 生命值（心）
  for (var i = 0; i < this.maxLives; i++) {
    var hx = 25 + i * 35;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(i < this.lives ? '❤️' : '🖤', hx, 40);
  }

  // 倒计时
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = this.timer <= 15 ? '#ff6666' : '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(this.timer + 's', W / 2, 36);

  // 猫计数
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'right';
  ctx.fillText('🐱 ' + this.foundCount + '/' + this.cats.length, W - 25, 36);
};

GameEngine.prototype._drawToast = function(ctx, W, H) {
  var alpha = Math.min(1, this.toastTimer);
  ctx.globalAlpha = alpha;
  draw.roundRect(ctx, W / 2 - 100, H * 0.45, 200, 40, 12, 'rgba(0,0,0,0.7)');
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(this.toast, W / 2, H * 0.45 + 20);
  ctx.globalAlpha = 1;
};

GameEngine.prototype._drawEndScreen = function(ctx, W, H) {
  // 半透明遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);

  var cy = H * 0.4;
  draw.roundRect(ctx, W / 2 - 150, cy - 80, 300, 200, 20, 'rgba(30,30,50,0.95)');

  if (this.state === STATE.WIN) {
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎉 全部找到!', W / 2, cy - 40);

    // 星级评价
    var stars = this._calcStars();
    ctx.font = '36px sans-serif';
    var starStr = '';
    for (var i = 0; i < 3; i++) {
      starStr += i < stars ? '⭐' : '☆';
    }
    ctx.fillText(starStr, W / 2, cy + 5);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('用时 ' + (90 - this.timer) + '秒 | 剩余 ' + this.lives + ' 颗心', W / 2, cy + 45);
  } else {
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ff6666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💔 生命耗尽', W / 2, cy - 40);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('找到了 ' + this.foundCount + '/' + this.cats.length + ' 只猫', W / 2, cy + 10);
  }

  // 再来一局按钮
  draw.roundRect(ctx, W / 2 - 80, cy + 70, 160, 42, 20, '#ffd700');
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#1a1a2e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('再来一局', W / 2, cy + 91);

  // 记录按钮区域用于点击检测
  this._retryBtnArea = {
    x: W / 2 - 80, y: cy + 70, w: 160, h: 42
  };
};

GameEngine.prototype._calcStars = function() {
  var timeUsed = 90 - this.timer;
  if (this.lives === 3 && timeUsed <= 30) return 3;
  if (this.lives >= 2 && timeUsed <= 60) return 2;
  return 1;
};

// ========== 触摸事件 ==========

GameEngine.prototype.handleTap = function(touchX, touchY) {
  // 转换为逻辑坐标
  var lx = touchX / this.scale;
  var ly = touchY / this.scale;

  // 结束状态 —— 检查"再来一局"按钮
  if (this.state === STATE.WIN || this.state === STATE.LOSE) {
    if (this._retryBtnArea) {
      var btn = this._retryBtnArea;
      if (lx >= btn.x && lx <= btn.x + btn.w && ly >= btn.y && ly <= btn.y + btn.h) {
        this.startGame();
      }
    }
    return;
  }

  // 非游戏中状态不响应
  if (this.state !== STATE.PLAYING) return;

  // 检测点击了哪个物品
  var hitItem = null;
  // 从后往前遍历（后绘制的在上面）
  for (var i = this.allItems.length - 1; i >= 0; i--) {
    var item = this.allItems[i];
    // 跳过已找到的猫
    if (item.isCat && item.catRef.found) continue;
    // 碰撞检测（加一点容差）
    var pad = 5;
    if (lx >= item.x - pad && lx <= item.x + item.w + pad &&
        ly >= item.y - pad && ly <= item.y + item.h + pad) {
      hitItem = item;
      break;
    }
  }

  if (!hitItem) return;

  if (hitItem.isCat) {
    // 找到猫了！
    var cat = hitItem.catRef;
    cat.found = true;
    cat.foundAnim = 0;
    this.foundCount++;
    this.score += 100 + this.timer; // 剩余时间越多分越高
    this.currentFoundCat = cat;
    this.animTimer = 1.2;
    this.state = STATE.FOUND_ANIM;
    this.toast = '找到了! 🐱';
    this.toastTimer = 1;
  } else {
    // 点错了
    this.lives--;
    this.wrongItem = hitItem;
    this.wrongAnimTimer = 0.5;
    this.state = STATE.WRONG_ANIM;
    this.toast = '这不是猫! ❌';
    this.toastTimer = 0.8;
  }
};

GameEngine.prototype._onEnd = function() {
  if (this.onGameEnd) {
    this.onGameEnd({
      win: this.state === STATE.WIN,
      score: this.score,
      stars: this._calcStars(),
      timeUsed: 90 - this.timer,
      lives: this.lives,
      foundCount: this.foundCount,
      totalCats: this.cats.length,
      cats: this.cats,
    });
  }
};

module.exports = GameEngine;
