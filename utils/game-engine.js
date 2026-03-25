/**
 * 游戏引擎 —— 状态机、渲染循环、碰撞检测、工具系统
 * 同步自 preview.html
 */
var draw = require('./draw-utils');
var scene = require('./scene');
var catSystem = require('./cat-system');

var VIEW_W = scene.VIEW_W;
var VIEW_H = scene.VIEW_H;
var ITEM_SCALE = scene.ITEM_SCALE;

// ========== 成就定义 ==========
var ACHIEVEMENTS = [
  { id: 'first_cat',    name: '初次接触',   icon: '🐾', desc: '找到第一只猫咪' },
  { id: 'perfect',      name: '完美侦探',   icon: '🏆', desc: '零失误通关任意关卡' },
  { id: 'speed_run',    name: '速度猎人',   icon: '⚡', desc: '60秒内通关' },
  { id: 'all_clear',    name: '全部通关',   icon: '🎖️', desc: '通关所有关卡' },
  { id: 'all_stars',    name: '星光收藏家', icon: '🌟', desc: '所有关卡获得3星' },
  { id: 'cat_master',   name: '猫咪大师',   icon: '👑', desc: '累计找到30只猫' },
  { id: 'tool_user',    name: '工具达人',   icon: '🧰', desc: '同一局中使用两种道具' },
  { id: 'no_hint',      name: '火眼金睛',   icon: '👁️', desc: '不触发提示就通关' },
];

function GameEngine() {
  this.state = 'ready';
  this.ctx = null;
  this.canvasW = 0;
  this.canvasH = 0;
  this.scale = 1;
  this.dpr = 1;
  this.lives = 3;
  this.maxLives = 3;
  this.catCount = 4;
  this.foundCount = 0;
  this.mistakes = 0;
  this.currentRoomIdx = 0;
  this.cats = [];
  this.allItems = [];
  this.animTimer = 0;
  this.currentFoundCat = null;
  this.wrongItem = null;
  this.wrongAnimTimer = 0;
  this.lastTime = 0;
  this.toast = '';
  this.toastTimer = 0;
  this.introTimer = 0;
  this.shakeTimer = 0;
  this.shakeX = 0;
  this.shakeY = 0;
  // 假穿帮
  this.fakeWobbles = [];
  this.fakeWobbleTimer = 0;
  // 工具系统
  this.activeTool = null;
  this.laserCooldown = 0;
  this.laserMaxCD = 12;
  this.laserActive = false;
  this.laserX = 0;
  this.laserY = 0;
  this.laserTargetX = 0;
  this.laserTargetY = 0;
  this.laserTimer = 0;
  this.catnipCooldown = 0;
  this.catnipMaxCD = 18;
  this.catnipActive = false;
  this.catnipX = 0;
  this.catnipY = 0;
  this.catnipTimer = 0;
  this.catnipRadius = 200;
  this.toolBtns = [];
  // 结算按钮
  this.retryBtn = null;
  this.nextLevelBtn = null;
  this.selectBtn = null;
  // 关卡进度
  this.levelProgress = null;
  // 计时器
  this.playTime = 0;
  // 提示系统
  this.hintTimer = 0;
  this.hintCat = null;
  this.hintAlpha = 0;
  this._lastFoundTime = 0;
  // 粒子系统
  this.particles = [];
  // 新手引导
  this.tutorial = null; // { step, timer, tapTarget }
  // 成就系统
  this.achievements = {};    // { id: true } 已解锁
  this.achievePopup = null;  // { name, icon, timer }
  this.totalCatsFound = 0;   // 累计找猫数
  this._usedLaser = false;
  this._usedCatnip = false;
  this._hintTriggered = false;
  // 动画帧 ID
  this._rafId = null;
  // 回调
  this.onGameEnd = null;
  this.onShowLevelSelect = null;
  // 触控状态
  this._touchStartX = 0;
  this._touchStartY = 0;
  this._touchStartTime = 0;
  this._isDragging = false;
}

GameEngine.prototype.init = function(ctx, canvasW, canvasH, dpr) {
  this.ctx = ctx;
  this.canvasW = canvasW;
  this.canvasH = canvasH;
  this.dpr = dpr || 1;
  this.scale = canvasW / VIEW_W;
  this._loadProgress();
  this._loadAchievements();
};

GameEngine.prototype._loadProgress = function() {
  try {
    var data = tt.getStorageSync('catHideProgress');
    if (data) {
      this.levelProgress = JSON.parse(data);
    }
  } catch(e) {}
  if (!this.levelProgress) {
    this.levelProgress = {
      livingroom: {unlocked:true, stars:0},
      kitchen: {unlocked:false, stars:0},
      bedroom: {unlocked:false, stars:0},
      bathroom: {unlocked:false, stars:0},
      study: {unlocked:false, stars:0},
    };
  }
};

GameEngine.prototype._saveProgress = function() {
  try {
    tt.setStorageSync('catHideProgress', JSON.stringify(this.levelProgress));
  } catch(e) {}
};

GameEngine.prototype._loadAchievements = function() {
  try {
    var data = tt.getStorageSync('catHideAchieve');
    if (data) {
      var parsed = JSON.parse(data);
      this.achievements = parsed.unlocked || {};
      this.totalCatsFound = parsed.totalCats || 0;
    }
  } catch(e) {}
};

GameEngine.prototype._saveAchievements = function() {
  try {
    tt.setStorageSync('catHideAchieve', JSON.stringify({
      unlocked: this.achievements,
      totalCats: this.totalCatsFound,
    }));
  } catch(e) {}
};

GameEngine.prototype._unlockAchievement = function(id) {
  if (this.achievements[id]) return; // 已解锁
  this.achievements[id] = true;
  this._saveAchievements();
  // 找到成就信息并弹出
  for (var i = 0; i < ACHIEVEMENTS.length; i++) {
    if (ACHIEVEMENTS[i].id === id) {
      this.achievePopup = { name: ACHIEVEMENTS[i].name, icon: ACHIEVEMENTS[i].icon, timer: 3.0 };
      break;
    }
  }
};

GameEngine.prototype.startGame = function(roomIdx) {
  if (roomIdx !== undefined) this.currentRoomIdx = roomIdx;
  var room = scene.ROOMS[this.currentRoomIdx];
  var mult = room.behaviorMult;

  this.state = 'intro';
  this.catCount = room.catCount;
  this.maxLives = room.lives;
  this.lives = room.lives;
  this.foundCount = 0;
  this.mistakes = 0;
  this.toast = '';
  this.toastTimer = 0;
  this.animTimer = 0;
  this.currentFoundCat = null;
  this.wrongItem = null;
  this.shakeTimer = 0;
  this.introTimer = 2.5;
  this.fakeWobbles = [];
  this.fakeWobbleTimer = 5 + Math.random() * 5;
  this.activeTool = null;
  this.retryBtn = null;
  this.nextLevelBtn = null;
  this.selectBtn = null;
  this.laserCooldown = 0;
  this.laserActive = false;
  this.laserTimer = 0;
  this.catnipCooldown = 0;
  this.catnipActive = false;
  this.catnipTimer = 0;
  this.playTime = 0;
  this.hintTimer = 0;
  this.hintCat = null;
  this.hintAlpha = 0;
  this._lastFoundTime = 0;
  this.particles = [];
  this._usedLaser = false;
  this._usedCatnip = false;
  this._hintTriggered = false;

  var roomId = room.id;

  // 放置房间物品
  var roomItems = catSystem.placeItems(room.items, null, roomId);

  // 随机选猫伪装模板
  var disguises = catSystem.shuffle(room.disguises).slice(0, this.catCount);
  var occupied = roomItems.map(function(it){ return {x:it.x,y:it.y,w:it.w,h:it.h}; });
  var usedQuotes = [];
  this.cats = [];

  for (var i = 0; i < disguises.length; i++) {
    var tmpl = disguises[i];
    var catPlaced = catSystem.placeItems([tmpl], occupied, roomId);
    var cp = catPlaced[0];
    occupied.push({x:cp.x,y:cp.y,w:cp.w,h:cp.h});
    var personality = catSystem.CAT_PERSONALITIES[i % catSystem.CAT_PERSONALITIES.length];
    this.cats.push({
      id: 'cat_'+i,
      x: cp.x, y: cp.y, w: cp.w, h: cp.h,
      origW: cp.origW, origH: cp.origH, scale: cp.scale,
      baseX: cp.baseX, baseY: cp.baseY, depth: cp.depth,
      drawFn: cp.draw, name: cp.name,
      quote: catSystem.pickQuote(usedQuotes, roomId),
      color: personality.color,
      personality: personality,
      found: false, foundAnim: 0,
      behaviorMult: mult,
      wobbleTimer: catSystem.randRange(personality.wobbleCooldown) * mult,
      wobbleActive: false, wobbleElapsed: 0,
      wobbleDuration: catSystem.randRange(personality.wobbleDuration),
      wobbleCooldown: personality.wobbleCooldown,
      wobbleStrength: personality.wobbleStrength,
      tailTimer: catSystem.randRange(personality.tailCooldown) * mult,
      tailActive: false, tailElapsed: 0,
      tailDuration: catSystem.randRange(personality.tailDuration),
      bubbleTimer: catSystem.randRange(personality.bubbleCooldown) * mult,
      bubbleActive: false, bubbleElapsed: 0,
      bubbleDuration: catSystem.randRange(personality.bubbleDuration),
      bubbleText: '',
      eyeTimer: catSystem.randRange(personality.eyeCooldown) * mult,
      eyeActive: false, eyeElapsed: 0,
      eyeDuration: catSystem.randRange(personality.eyeDuration),
    });
  }

  // 合并所有物品
  this.allItems = [];
  var self = this;
  roomItems.forEach(function(it){
    self.allItems.push({
      id:it.id, name:it.name, zone:it.zone, x:it.x, y:it.y, w:it.w, h:it.h,
      origW:it.origW, origH:it.origH, scale:it.scale,
      baseX:it.baseX, baseY:it.baseY, depth:it.depth,
      drawFn:it.draw, isCat:false
    });
  });
  this.cats.forEach(function(cat){
    self.allItems.push({
      id:cat.id, name:cat.name, zone:'floor', x:cat.x, y:cat.y, w:cat.w, h:cat.h,
      origW:cat.origW, origH:cat.origH, scale:cat.scale,
      baseX:cat.baseX, baseY:cat.baseY, depth:cat.depth,
      drawFn:cat.drawFn, isCat:true, catRef:cat
    });
  });

  // 新手引导：第一次玩第一关时触发
  this.tutorial = null;
  if (this.currentRoomIdx === 0 && !this._hasTutorialDone()) {
    this.tutorial = { step: 0, timer: 0, tapTarget: null, skipBtn: null };
  }

  this.lastTime = Date.now();
  this._startLoop();
};

GameEngine.prototype._startLoop = function() {
  this._running = true;
  var self = this;
  function loop() {
    if (!self._running) return;
    self._update();
    self._render();
    if (self.ctx.requestAnimationFrame) {
      self._rafId = self.ctx.requestAnimationFrame(loop);
    }
  }
  loop();
};

GameEngine.prototype.stop = function() {
  this._running = false;
  if (this._rafId != null && this.ctx.cancelAnimationFrame) {
    this.ctx.cancelAnimationFrame(this._rafId);
  }
  this._rafId = null;
};

// ========== 更新逻辑 ==========

GameEngine.prototype._update = function() {
  var now = Date.now();
  var dt = Math.min((now - this.lastTime)/1000, 0.1);
  this.lastTime = now;

  // 开场提示
  if (this.state === 'intro') {
    this.introTimer -= dt;
    if (this.introTimer <= 0) {
      this.state = 'playing';
      var rm = scene.ROOMS[this.currentRoomIdx];
      this.toast = rm.emoji + ' ' + rm.name + ' — 找出' + rm.catCount + '只猫!';
      this.toastTimer = 2.5;
    }
  }

  // 猫穿帮行为更新
  if (this.state === 'playing' || this.state === 'intro') {
    this._updateCatBehaviors(dt);
    this._updateFakeWobbles(dt);
  }

  // 新手引导
  if (this.tutorial && this.state === 'playing') {
    this._updateTutorial(dt);
  }

  // 找到猫动画
  if (this.state === 'found_anim') {
    this.animTimer -= dt;
    if (this.currentFoundCat) {
      this.currentFoundCat.foundAnim = Math.min(1, 1 - this.animTimer/1.5);
    }
    if (this.animTimer <= 0) {
      if (this.currentFoundCat) this.currentFoundCat.foundAnim = 1;
      this.currentFoundCat = null;
      if (this.foundCount >= this.cats.length) {
        this.state = 'win';
        var stars = this._calcStars();
        var pid = scene.ROOMS[this.currentRoomIdx].id;
        if (!this.levelProgress[pid]) this.levelProgress[pid] = { unlocked: true, stars: 0 };
        if (stars > this.levelProgress[pid].stars) {
          this.levelProgress[pid].stars = stars;
        }
        if (this.currentRoomIdx < scene.ROOMS.length - 1) {
          var nextId = scene.ROOMS[this.currentRoomIdx + 1].id;
          if (!this.levelProgress[nextId]) this.levelProgress[nextId] = { unlocked: false, stars: 0 };
          this.levelProgress[nextId].unlocked = true;
        }
        this._saveProgress();
        // 成就检查
        this._checkWinAchievements(stars);
      } else {
        this.state = 'playing';
      }
    }
  }

  // 成就弹窗计时
  if (this.achievePopup) {
    this.achievePopup.timer -= dt;
    if (this.achievePopup.timer <= 0) this.achievePopup = null;
  }

  // 点错动画
  if (this.state === 'wrong_anim') {
    this.wrongAnimTimer -= dt;
    if (this.wrongAnimTimer <= 0) {
      this.wrongItem = null;
      this.state = this.lives <= 0 ? 'lose' : 'playing';
    }
  }

  // 工具冷却
  if (this.laserCooldown > 0) this.laserCooldown -= dt;
  if (this.catnipCooldown > 0) this.catnipCooldown -= dt;

  // 激光笔效果
  if (this.laserActive) {
    this.laserTimer -= dt;
    this.laserX += (this.laserTargetX - this.laserX) * 0.15;
    this.laserY += (this.laserTargetY - this.laserY) * 0.15;
    var self = this;
    this.cats.forEach(function(cat) {
      if (cat.found) return;
      var dx = (cat.x+cat.w/2) - self.laserX, dy = (cat.y+cat.h/2) - self.laserY;
      if (Math.sqrt(dx*dx+dy*dy) < 160) {
        cat.eyeActive = true; cat.eyeElapsed = 0; cat.eyeDuration = 1.5;
        if (!cat.wobbleActive) { cat.wobbleActive = true; cat.wobbleElapsed = 0; cat.wobbleDuration = 0.8; }
      }
    });
    if (this.laserTimer <= 0) { this.laserActive = false; this.activeTool = null; }
  }

  // 猫薄荷效果
  if (this.catnipActive) {
    this.catnipTimer -= dt;
    var self = this;
    this.cats.forEach(function(cat) {
      if (cat.found) return;
      var dx = (cat.x+cat.w/2) - self.catnipX, dy = (cat.y+cat.h/2) - self.catnipY;
      if (Math.sqrt(dx*dx+dy*dy) < self.catnipRadius) {
        if (!cat.wobbleActive) { cat.wobbleActive = true; cat.wobbleElapsed = 0; cat.wobbleDuration = catSystem.randRange([0.5, 1.0]); }
        if (!cat.tailActive) { cat.tailActive = true; cat.tailElapsed = 0; cat.tailDuration = catSystem.randRange([1.0, 2.0]); }
        if (!cat.bubbleActive) {
          cat.bubbleActive = true; cat.bubbleElapsed = 0; cat.bubbleDuration = 2.0;
          cat.bubbleText = ['好香...', '这是什么!', '忍不住了...', '喵~!'][Math.floor(Math.random()*4)];
        }
      }
    });
    if (this.catnipTimer <= 0) { this.catnipActive = false; this.activeTool = null; }
  }

  // 震动
  if (this.shakeTimer > 0) {
    this.shakeTimer -= dt;
    this.shakeX = (Math.random()-0.5) * 8;
    this.shakeY = (Math.random()-0.5) * 8;
    if (this.shakeTimer <= 0) { this.shakeX = 0; this.shakeY = 0; }
  }

  // 计时器
  if (this.state === 'playing') {
    this.playTime += dt;
  }

  // 提示系统：15秒没找到猫，给出微光提示
  if (this.state === 'playing') {
    this._lastFoundTime += dt;
    if (this._lastFoundTime >= 15) {
      var unfound = this.cats.filter(function(c){ return !c.found; });
      if (unfound.length > 0) {
        this.hintCat = unfound[Math.floor(Math.random() * unfound.length)];
        this.hintTimer = 2.0;
        this.hintAlpha = 0;
        this._hintTriggered = true;
        this._lastFoundTime = 0;
      }
    }
    if (this.hintTimer > 0) {
      this.hintTimer -= dt;
      // 淡入淡出：前0.5秒淡入，后0.5秒淡出，中间保持
      if (this.hintTimer > 1.5) this.hintAlpha = (2.0 - this.hintTimer) / 0.5;
      else if (this.hintTimer < 0.5) this.hintAlpha = this.hintTimer / 0.5;
      else this.hintAlpha = 1;
      if (this.hintTimer <= 0) { this.hintCat = null; this.hintAlpha = 0; }
    }
  }

  // 粒子更新
  for (var pi = this.particles.length - 1; pi >= 0; pi--) {
    var p = this.particles[pi];
    p.life -= dt;
    if (p.life <= 0) { this.particles.splice(pi, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt; // 重力
    p.alpha = Math.min(1, p.life / p.maxLife * 2);
  }

  // Toast
  if (this.toastTimer > 0) { this.toastTimer -= dt; if (this.toastTimer <= 0) this.toast = ''; }
};

GameEngine.prototype._updateCatBehaviors = function(dt) {
  this.cats.forEach(function(cat) {
    if (cat.found) return;
    var p = cat.personality;
    // 晃动
    if (!cat.wobbleActive) {
      cat.wobbleTimer -= dt;
      if (cat.wobbleTimer <= 0) { cat.wobbleActive = true; cat.wobbleElapsed = 0; cat.wobbleDuration = catSystem.randRange(p.wobbleDuration); }
    } else {
      cat.wobbleElapsed += dt;
      if (cat.wobbleElapsed >= cat.wobbleDuration) { cat.wobbleActive = false; cat.wobbleTimer = catSystem.randRange(p.wobbleCooldown) * cat.behaviorMult; }
    }
    // 尾巴
    if (!cat.tailActive) {
      cat.tailTimer -= dt;
      if (cat.tailTimer <= 0) { cat.tailActive = true; cat.tailElapsed = 0; cat.tailDuration = catSystem.randRange(p.tailDuration); }
    } else {
      cat.tailElapsed += dt;
      if (cat.tailElapsed >= cat.tailDuration) { cat.tailActive = false; cat.tailTimer = catSystem.randRange(p.tailCooldown) * cat.behaviorMult; }
    }
    // 气泡
    if (!cat.bubbleActive) {
      cat.bubbleTimer -= dt;
      if (cat.bubbleTimer <= 0) {
        cat.bubbleActive = true; cat.bubbleElapsed = 0;
        cat.bubbleDuration = catSystem.randRange(p.bubbleDuration);
        cat.bubbleText = catSystem.getBubbleText(p, scene.ROOMS[this.currentRoomIdx].id);
      }
    } else {
      cat.bubbleElapsed += dt;
      if (cat.bubbleElapsed >= cat.bubbleDuration) { cat.bubbleActive = false; cat.bubbleTimer = catSystem.randRange(p.bubbleCooldown) * cat.behaviorMult; }
    }
    // 眼睛偷看
    if (!cat.eyeActive) {
      cat.eyeTimer -= dt;
      if (cat.eyeTimer <= 0) { cat.eyeActive = true; cat.eyeElapsed = 0; cat.eyeDuration = catSystem.randRange(p.eyeDuration); }
    } else {
      cat.eyeElapsed += dt;
      if (cat.eyeElapsed >= cat.eyeDuration) { cat.eyeActive = false; cat.eyeTimer = catSystem.randRange(p.eyeCooldown) * cat.behaviorMult; }
    }
  });
};

GameEngine.prototype._updateFakeWobbles = function(dt) {
  for (var i = this.fakeWobbles.length - 1; i >= 0; i--) {
    this.fakeWobbles[i].elapsed += dt;
    if (this.fakeWobbles[i].elapsed >= this.fakeWobbles[i].duration) {
      this.fakeWobbles.splice(i, 1);
    }
  }
  this.fakeWobbleTimer -= dt;
  if (this.fakeWobbleTimer <= 0) {
    this.fakeWobbleTimer = 8 + Math.random() * 12;
    var sneakyCats = this.cats.filter(function(c){ return !c.found && c.personality.fakeWobble; });
    if (sneakyCats.length > 0) {
      var sc = sneakyCats[Math.floor(Math.random()*sneakyCats.length)];
      var nearItems = this.allItems.filter(function(it){
        if (it.isCat) return false;
        var dx = (it.x+it.w/2)-(sc.x+sc.w/2), dy = (it.y+it.h/2)-(sc.y+sc.h/2);
        return Math.sqrt(dx*dx+dy*dy) < 320;
      });
      if (nearItems.length > 0) {
        var target = nearItems[Math.floor(Math.random()*nearItems.length)];
        this.fakeWobbles.push({ itemId: target.id, elapsed: 0, duration: 0.3 + Math.random()*0.3 });
      }
    }
  }
};

GameEngine.prototype._getFakeWobble = function(itemId) {
  for (var i = 0; i < this.fakeWobbles.length; i++) {
    if (this.fakeWobbles[i].itemId === itemId) return this.fakeWobbles[i];
  }
  return null;
};

GameEngine.prototype._calcStars = function() {
  if (this.state !== 'win') return 0;
  if (this.mistakes === 0) return 3;
  if (this.mistakes === 1) return 2;
  return 1;
};

// ========== 渲染 ==========

GameEngine.prototype._render = function() {
  var ctx = this.ctx, s = this.scale, dpr = this.dpr;
  ctx.clearRect(0, 0, this.canvasW*dpr, this.canvasH*dpr);
  ctx.save();
  ctx.scale(s*dpr, s*dpr);

  // 开场
  if (this.state === 'intro') {
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('房间里混入了 ' + this.catCount + ' 只猫咪!', VIEW_W/2, VIEW_H*0.4);
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#aaa';
    ctx.fillText('它们伪装成了各种物品', VIEW_W/2, VIEW_H*0.48);
    ctx.fillText('仔细观察可疑的动静...', VIEW_W/2, VIEW_H*0.53);
    var cd = Math.ceil(this.introTimer);
    ctx.font = 'bold 48px sans-serif'; ctx.fillStyle = '#ffd700';
    ctx.fillText(cd > 0 ? cd : 'GO!', VIEW_W/2, VIEW_H*0.65);
    ctx.restore();
    return;
  }

  // 震动偏移
  ctx.translate(this.shakeX, this.shakeY);

  // 背景
  ctx.save();
  scene.drawRoomBackground(ctx, scene.ROOMS[this.currentRoomIdx].bgType);

  // 深度排序
  this.allItems.sort(function(a, b) { return a.depth - b.depth; });

  var self = this;
  this.allItems.forEach(function(item) {
    if (item.isCat && item.catRef.found) {
      self._drawFoundCat(ctx, item.catRef);
      return;
    }

    var offsetX = 0, offsetY = 0;
    if (item.isCat && item.catRef.wobbleActive) {
      offsetX = Math.sin(item.catRef.wobbleElapsed * Math.PI * 8) * item.catRef.wobbleStrength;
    }
    if (item.isCat && item.catRef.personality.breathe && !item.catRef.found) {
      offsetY = Math.sin(Date.now() / 800) * 1.2;
    }
    if (!item.isCat) {
      var fw = self._getFakeWobble(item.id);
      if (fw) { offsetX = Math.sin(fw.elapsed * Math.PI * 8) * 2.5; }
    }

    var drawBX = item.baseX + offsetX;
    var drawBY = item.baseY + offsetY;
    var itemScale = item.scale || ITEM_SCALE;

    // 阴影
    if (item.zone !== 'wall_decor') {
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = '#000';
      ctx.translate(item.baseX + offsetX, item.baseY + 2);
      ctx.scale(1, 0.22);
      ctx.beginPath();
      ctx.arc(0, 0, item.w * 0.38, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // 点错动画
    if (self.wrongItem && self.wrongItem.id === item.id) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(self.wrongAnimTimer*20)*0.3;
      ctx.fillStyle = 'rgba(255,50,50,0.3)';
      ctx.fillRect(item.x + offsetX - 4, item.y + offsetY - 4, item.w + 8, item.h + 8);
      ctx.translate(drawBX, drawBY);
      ctx.scale(itemScale, itemScale);
      item.drawFn(ctx, -item.origW/2, -item.origH, item.origW, item.origH);
      ctx.restore();
      return;
    }

    // 绘制物品
    ctx.save();
    ctx.translate(drawBX, drawBY);
    ctx.scale(itemScale, itemScale);
    item.drawFn(ctx, -item.origW/2, -item.origH, item.origW, item.origH);
    ctx.restore();

    // 猫穿帮效果
    if (item.isCat) {
      var catDrawX = item.x + offsetX, catDrawY = item.y + offsetY;
      self._drawCatTail(ctx, item.catRef, catDrawX, catDrawY);
      self._drawCatBubble(ctx, item.catRef, catDrawX, catDrawY);
      self._drawCatEyes(ctx, item.catRef, catDrawX, catDrawY);
    }
  });

  // 提示微光
  this._drawHint(ctx);
  // 激光笔
  if (this.laserActive) this._drawLaserEffect(ctx);
  // 猫薄荷
  if (this.catnipActive) this._drawCatnipEffect(ctx);
  // 粒子
  this._drawParticles(ctx);

  ctx.restore();
  // 关闭外层 s*dpr+shake 变换，HUD/工具栏/Toast/结算在干净的 s*dpr 坐标下绘制
  ctx.restore();

  // 重新应用 s*dpr 变换（不含 shake），让 HUD 坐标与点击坐标对齐
  ctx.save();
  ctx.scale(s*dpr, s*dpr);

  // HUD
  this._drawHUD(ctx);
  // 工具栏
  this._drawToolbar(ctx);

  // Toast
  if (this.toast) {
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var tw = ctx.measureText(this.toast).width;
    draw.roundRect(ctx, VIEW_W/2-tw/2-15, VIEW_H*0.88-16, tw+30, 32, 12, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = '#fff'; ctx.fillText(this.toast, VIEW_W/2, VIEW_H*0.88);
  }

  // 结算
  if (this.state === 'win' || this.state === 'lose') {
    this._drawEndScreen(ctx);
  }

  // 新手引导覆盖层
  if (this.tutorial && this.state !== 'win' && this.state !== 'lose') {
    this._drawTutorial(ctx);
  }

  // 成就弹窗（最上层）
  this._drawAchievePopup(ctx);

  ctx.restore();
};

GameEngine.prototype._drawFoundCat = function(ctx, cat) {
  var p = cat.foundAnim;
  var cx = cat.x + cat.w/2, cy = cat.y + cat.h/2;
  if (p < 0.4) {
    var smokeP = p / 0.4;
    ctx.save(); ctx.globalAlpha = 1 - smokeP;
    for (var i = 0; i < 5; i++) {
      var angle = (i/5)*Math.PI*2 + p*3;
      var dist = smokeP * 30;
      ctx.beginPath(); ctx.arc(cx + Math.cos(angle)*dist, cy + Math.sin(angle)*dist, 8+smokeP*10, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
    }
    ctx.restore();
  }
  if (p > 0.3) {
    var catP = Math.min(1, (p - 0.3) / 0.5);
    ctx.save();
    ctx.globalAlpha = catP;
    var catSize = 40 * catP;
    draw.drawCat(ctx, cx, cy, catSize, cat.color);
    if (p > 0.5) {
      var bubbleAlpha = Math.min(1, (p-0.5)/0.3);
      ctx.globalAlpha = bubbleAlpha;
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      var tw = ctx.measureText(cat.quote).width;
      draw.roundRect(ctx, cx - tw/2 - 10, cy - catSize - 30, tw + 20, 24, 8, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = '#ffd700'; ctx.fillText(cat.quote, cx, cy - catSize - 12);
    }
    ctx.restore();
  }
};

GameEngine.prototype._drawCatTail = function(ctx, cat, dx, dy) {
  if (!cat.tailActive || cat.found) return;
  var progress = cat.tailElapsed / cat.tailDuration;
  var alpha = progress < 0.3 ? progress/0.3 : progress > 0.7 ? (1-progress)/0.3 : 1;
  ctx.save();
  ctx.globalAlpha = alpha * 0.8;
  var tx = dx + cat.w + 2;
  var ty = dy + cat.h * 0.7;
  var sway = Math.sin(cat.tailElapsed * 5) * 6;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.quadraticCurveTo(tx + 12, ty - 15 + sway, tx + 8, ty - 28 + sway);
  ctx.strokeStyle = cat.color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();
};

GameEngine.prototype._drawCatBubble = function(ctx, cat, dx, dy) {
  if (!cat.bubbleActive || cat.found) return;
  var progress = cat.bubbleElapsed / cat.bubbleDuration;
  var alpha = progress < 0.2 ? progress/0.2 : progress > 0.75 ? (1-progress)/0.25 : 1;
  ctx.save();
  ctx.globalAlpha = alpha * 0.85;
  var bx = dx + cat.w * 0.5;
  var by = dy - 8;
  by -= Math.sin(cat.bubbleElapsed * 2) * 3;
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  var tw = ctx.measureText(cat.bubbleText).width;
  draw.roundRect(ctx, bx-tw/2-8, by-20, tw+16, 22, 8, 'rgba(255,255,255,0.9)');
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.moveTo(bx-4, by+2); ctx.lineTo(bx+4, by+2); ctx.lineTo(bx, by+8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillText(cat.bubbleText, bx, by-2);
  ctx.restore();
};

GameEngine.prototype._drawCatEyes = function(ctx, cat, dx, dy) {
  if (!cat.eyeActive || cat.found) return;
  var progress = cat.eyeElapsed / cat.eyeDuration;
  var alpha = progress < 0.25 ? progress/0.25 : progress > 0.7 ? (1-progress)/0.3 : 1;
  ctx.save();
  ctx.globalAlpha = alpha * 0.7;
  var ex1 = dx + cat.w * 0.35;
  var ex2 = dx + cat.w * 0.65;
  var ey = dy + cat.h - 4;
  var eyeSize = 3;
  ctx.fillStyle = cat.color;
  ctx.beginPath(); ctx.arc(ex1, ey, eyeSize+1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex2, ey, eyeSize+1.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(ex1, ey, eyeSize, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex2, ey, eyeSize, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(ex1+1, ey-1, 1.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex2+1, ey-1, 1.2, 0, Math.PI*2); ctx.fill();
  ctx.restore();
};

GameEngine.prototype._drawLaserEffect = function(ctx) {
  var pulse = 0.6 + Math.sin(Date.now()/80) * 0.4;
  ctx.save();
  ctx.globalAlpha = 0.3 * pulse;
  ctx.beginPath(); ctx.arc(this.laserX, this.laserY, 18, 0, Math.PI*2);
  ctx.fillStyle = '#ff2200'; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(this.laserX, this.laserY, 4, 0, Math.PI*2);
  ctx.fillStyle = '#ff3300'; ctx.fill();
  ctx.beginPath(); ctx.arc(this.laserX, this.laserY, 2, 0, Math.PI*2);
  ctx.fillStyle = '#ff8866'; ctx.fill();
  ctx.restore();
};

GameEngine.prototype._drawCatnipEffect = function(ctx) {
  var progress = 1 - this.catnipTimer / 3.0;
  var alpha = progress < 0.2 ? progress/0.2 * 0.6 : progress > 0.7 ? (1-progress)/0.3 * 0.6 : 0.6;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.arc(this.catnipX, this.catnipY, this.catnipRadius, 0, Math.PI*2);
  ctx.strokeStyle = '#66dd66'; ctx.lineWidth = 2; ctx.stroke();
  var t = Date.now() / 1000;
  for (var i = 0; i < 6; i++) {
    var angle = (i/6)*Math.PI*2 + t*0.5;
    var dist = 8 + Math.sin(t*2+i)*4;
    var lx = this.catnipX + Math.cos(angle)*dist;
    var ly = this.catnipY + Math.sin(angle)*dist;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 5, 3, angle, 0, Math.PI*2);
    ctx.fillStyle = '#44cc44'; ctx.fill();
  }
  for (var j = 0; j < 8; j++) {
    var pa = (j/8)*Math.PI*2 + t;
    var pd = this.catnipRadius * (0.3 + Math.sin(t+j*1.5)*0.2);
    var px = this.catnipX + Math.cos(pa)*pd;
    var py = this.catnipY + Math.sin(pa)*pd;
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI*2);
    ctx.fillStyle = '#88ee88'; ctx.fill();
  }
  ctx.restore();
};

GameEngine.prototype._drawHUD = function(ctx) {
  draw.roundRect(ctx, 10, 10, VIEW_W-20, 44, 14, 'rgba(0,0,0,0.55)');
  ctx.font = '18px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  var heartStr = '';
  for (var i = 0; i < this.maxLives; i++) heartStr += i < this.lives ? '❤️' : '🖤';
  ctx.fillText(heartStr, 22, 33);
  // 计时器
  var mins = Math.floor(this.playTime / 60);
  var secs = Math.floor(this.playTime % 60);
  var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  ctx.font = '14px sans-serif'; ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.fillText(timeStr, VIEW_W/2, 33);
  // 猫计数
  ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'right';
  ctx.fillText('🐱 ' + this.foundCount + ' / ' + this.catCount, VIEW_W-22, 33);
};

GameEngine.prototype._drawToolbar = function(ctx) {
  if (this.state !== 'playing' && this.state !== 'found_anim' && this.state !== 'wrong_anim') return;
  var btnSize = 50, pad = 12;
  var startX = 15, startY = VIEW_H - btnSize - 20;
  this.toolBtns = [];

  var laserReady = this.laserCooldown <= 0 && !this.laserActive;
  var laserSelected = this.activeTool === 'laser';
  this._drawToolBtn(ctx, startX, startY, btnSize, '🔦', '激光笔', laserReady, laserSelected,
    this.laserCooldown > 0 ? Math.ceil(this.laserCooldown) : 0);
  this.toolBtns.push({ x:startX, y:startY, w:btnSize, h:btnSize, type:'laser' });

  var catnipReady = this.catnipCooldown <= 0 && !this.catnipActive;
  var catnipSelected = this.activeTool === 'catnip';
  var cx2 = startX + btnSize + pad;
  this._drawToolBtn(ctx, cx2, startY, btnSize, '🌿', '猫薄荷', catnipReady, catnipSelected,
    this.catnipCooldown > 0 ? Math.ceil(this.catnipCooldown) : 0);
  this.toolBtns.push({ x:cx2, y:startY, w:btnSize, h:btnSize, type:'catnip' });
};

GameEngine.prototype._drawToolBtn = function(ctx, x, y, size, icon, label, ready, selected, cd) {
  ctx.save();
  var bgColor = selected ? 'rgba(255,215,0,0.4)' : ready ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.4)';
  draw.roundRect(ctx, x, y, size, size, 12, bgColor);
  if (selected) {
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.strokeRect(x+1, y+1, size-2, size-2);
  }
  ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = ready || selected ? 1 : 0.4;
  ctx.fillText(icon, x+size/2, y+size/2 - 4);
  ctx.font = '9px sans-serif'; ctx.fillStyle = '#ccc';
  ctx.fillText(label, x+size/2, y+size - 7);
  if (cd > 0) {
    ctx.globalAlpha = 0.8;
    ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#ff6666';
    ctx.fillText(cd + 's', x+size/2, y+size/2 - 2);
  }
  ctx.restore();
};

GameEngine.prototype._drawEndScreen = function(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  var room = scene.ROOMS[this.currentRoomIdx];
  var isWin = this.state === 'win';
  var stars = this._calcStars();

  ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = isWin ? '#ffd700' : '#ff6666';
  ctx.fillText(isWin ? '全部找到!' : '游戏结束', VIEW_W/2, VIEW_H*0.28);

  ctx.font = '16px sans-serif'; ctx.fillStyle = '#aaa';
  ctx.fillText(room.emoji + ' ' + room.name, VIEW_W/2, VIEW_H*0.34);

  ctx.font = '18px sans-serif'; ctx.fillStyle = '#ddd';
  ctx.fillText('找到 ' + this.foundCount + ' / ' + this.catCount + ' 只猫咪', VIEW_W/2, VIEW_H*0.40);
  // 用时
  var mins = Math.floor(this.playTime / 60);
  var secs = Math.floor(this.playTime % 60);
  ctx.font = '14px sans-serif'; ctx.fillStyle = '#999';
  ctx.fillText('用时 ' + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs, VIEW_W/2, VIEW_H*0.45);

  if (isWin) {
    ctx.font = '36px sans-serif';
    var starStr = '';
    for (var i = 0; i < 3; i++) starStr += i < stars ? '⭐' : '☆';
    ctx.fillText(starStr, VIEW_W/2, VIEW_H*0.48);

    ctx.font = '13px sans-serif'; ctx.fillStyle = '#bbb';
    var desc = stars === 3 ? '完美! 零失误!' : stars === 2 ? '很棒! 只错了1次' : '过关了! 但要更仔细哦';
    ctx.fillText(desc, VIEW_W/2, VIEW_H*0.54);
  }

  // 重玩按钮
  var btnY1 = VIEW_H * 0.60, btnW = 160, btnH = 42;
  draw.roundRect(ctx, VIEW_W/2-btnW/2, btnY1, btnW, btnH, 22, '#ffd700');
  ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#1a1a2e';
  ctx.fillText('再来一局', VIEW_W/2, btnY1 + btnH/2);
  this.retryBtn = { x: VIEW_W/2-btnW/2, y: btnY1, w: btnW, h: btnH };

  // 下一关
  if (isWin && this.currentRoomIdx < scene.ROOMS.length - 1) {
    var btnY2 = VIEW_H * 0.69;
    var nextRoom = scene.ROOMS[this.currentRoomIdx + 1];
    draw.roundRect(ctx, VIEW_W/2-btnW/2, btnY2, btnW, btnH, 22, '#66bbff');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('下一关: ' + nextRoom.name, VIEW_W/2, btnY2 + btnH/2);
    this.nextLevelBtn = { x: VIEW_W/2-btnW/2, y: btnY2, w: btnW, h: btnH };
  } else {
    this.nextLevelBtn = null;
  }

  // 选关
  var btnY3 = isWin && this.currentRoomIdx < scene.ROOMS.length - 1 ? VIEW_H * 0.78 : VIEW_H * 0.69;
  draw.roundRect(ctx, VIEW_W/2-btnW/2, btnY3, btnW, btnH, 22, 'rgba(255,255,255,0.15)');
  ctx.fillStyle = '#ddd';
  ctx.fillText('选择关卡', VIEW_W/2, btnY3 + btnH/2);
  this.selectBtn = { x: VIEW_W/2-btnW/2, y: btnY3, w: btnW, h: btnH };
};

// ========== 成就检查 & 渲染 ==========

GameEngine.prototype._checkWinAchievements = function(stars) {
  // 完美侦探：零失误
  if (this.mistakes === 0) this._unlockAchievement('perfect');
  // 速度猎人：60秒内通关
  if (this.playTime <= 60) this._unlockAchievement('speed_run');
  // 工具达人：两种道具都用了
  if (this._usedLaser && this._usedCatnip) this._unlockAchievement('tool_user');
  // 火眼金睛：没触发提示
  if (!this._hintTriggered) this._unlockAchievement('no_hint');
  // 全部通关：所有房间至少1星
  var allClear = true;
  for (var i = 0; i < scene.ROOMS.length; i++) {
    var rp = this.levelProgress[scene.ROOMS[i].id];
    if (!rp || rp.stars < 1) { allClear = false; break; }
  }
  if (allClear) this._unlockAchievement('all_clear');
  // 星光收藏家：所有房间3星
  var allStars = true;
  for (var j = 0; j < scene.ROOMS.length; j++) {
    var rp2 = this.levelProgress[scene.ROOMS[j].id];
    if (!rp2 || rp2.stars < 3) { allStars = false; break; }
  }
  if (allStars) this._unlockAchievement('all_stars');
};

GameEngine.prototype._drawAchievePopup = function(ctx) {
  if (!this.achievePopup) return;
  var p = this.achievePopup;
  // 从顶部滑入
  var slideIn = Math.min(1, (3.0 - p.timer) / 0.4);
  var slideOut = Math.min(1, p.timer / 0.4);
  var alpha = Math.min(slideIn, slideOut);
  var y = 60 + (1 - slideIn) * -50;

  ctx.save();
  ctx.globalAlpha = alpha;
  var boxW = 280, boxH = 50;
  var boxX = VIEW_W / 2 - boxW / 2;
  draw.roundRect(ctx, boxX, y, boxW, boxH, 16, 'rgba(50,40,20,0.92)');
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
  draw.roundRect(ctx, boxX, y, boxW, boxH, 16, null, '#ffd700');

  ctx.font = '22px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(p.icon, boxX + 14, y + boxH / 2);

  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#ffd700';
  ctx.fillText('成就解锁!', boxX + 46, y + 17);
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#eee';
  ctx.fillText(p.name, boxX + 46, y + 35);

  ctx.restore();
};

// ========== 新手引导 ==========

// 引导步骤配置
var TUT_STEPS = [
  { id: 'observe',  text: '仔细看！有些物品在微微晃动...', sub: '那可能是猫咪伪装的！', duration: 0, waitTap: false },
  { id: 'tap',      text: '点击那个晃动的物品！', sub: '👆 试试看', duration: 0, waitTap: true },
  { id: 'found',    text: '太棒了！你找到了一只猫！🎉', sub: '', duration: 2.0, waitTap: false },
  { id: 'clues',    text: '猫咪会露出4种破绽：', sub: '💫晃动  🐾尾巴  💬说话  👀偷看', duration: 0, waitTap: false },
  { id: 'tools',    text: '左下角有道具帮助你：', sub: '🔦激光笔引猫注意  🌿猫薄荷让猫兴奋', duration: 0, waitTap: false },
  { id: 'go',       text: '继续找出剩下的猫咪吧！', sub: '加油！', duration: 1.5, waitTap: false },
];

GameEngine.prototype._hasTutorialDone = function() {
  try { return !!tt.getStorageSync('catHideTutorial'); } catch(e) { return false; }
};

GameEngine.prototype._saveTutorialDone = function() {
  try { tt.setStorageSync('catHideTutorial', '1'); } catch(e) {}
};

GameEngine.prototype._updateTutorial = function(dt) {
  if (!this.tutorial) return;
  var tut = this.tutorial;
  var step = TUT_STEPS[tut.step];
  if (!step) { this.tutorial = null; return; }

  tut.timer += dt;

  // Step 0 (observe): 强制第一只猫持续晃动，等3秒后自动进入下一步
  if (step.id === 'observe') {
    var cat = this.cats[0];
    if (cat && !cat.found) {
      cat.wobbleActive = true; cat.wobbleElapsed = (cat.wobbleElapsed + dt) % 1.0;
      cat.wobbleDuration = 999; cat.wobbleStrength = 5;
    }
    if (tut.timer >= 3.0) { tut.step++; tut.timer = 0; }
  }

  // Step 1 (tap): 保持猫晃动，设置点击目标，等玩家点击
  if (step.id === 'tap') {
    var cat = this.cats[0];
    if (cat && !cat.found) {
      cat.wobbleActive = true; cat.wobbleElapsed = (cat.wobbleElapsed + dt) % 1.0;
      cat.wobbleDuration = 999; cat.wobbleStrength = 5;
      tut.tapTarget = cat;
    } else {
      // 玩家已经找到了（通过正常点击逻辑），跳到 found 步骤
      tut.step = 2; tut.timer = 0;
    }
  }

  // Step 2 (found): 自动等待后进入下一步
  if (step.id === 'found' && tut.timer >= step.duration) {
    tut.step++; tut.timer = 0;
  }

  // Step 3 (clues): 点击继续
  // Step 4 (tools): 点击继续 — 高亮工具栏区域

  // Step 5 (go): 自动等待后结束引导
  if (step.id === 'go' && tut.timer >= step.duration) {
    this._saveTutorialDone();
    this.tutorial = null;
    // 恢复第一只猫的正常行为
    var cat = this.cats[0];
    if (cat && !cat.found) {
      cat.wobbleActive = false;
      cat.wobbleTimer = catSystem.randRange(cat.personality.wobbleCooldown);
      cat.wobbleStrength = cat.personality.wobbleStrength;
    }
  }
};

GameEngine.prototype._drawTutorial = function(ctx) {
  if (!this.tutorial) return;
  var tut = this.tutorial;
  var step = TUT_STEPS[tut.step];
  if (!step) return;

  // 半透明遮罩（非点击区域）
  ctx.save();

  // 如果有点击目标（tap步骤），在目标周围开一个"洞"
  if (step.id === 'tap' && tut.tapTarget) {
    var cat = tut.tapTarget;
    var cx = cat.x + cat.w / 2, cy = cat.y + cat.h / 2;
    var r = Math.max(cat.w, cat.h) * 0.65;

    // 画遮罩但挖洞
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true); // 反向圆弧 = 挖洞
    ctx.fill();

    // 脉动光圈
    var pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.strokeStyle = 'rgba(255,215,0,' + pulse + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();

    // 手指图标
    var fingerY = cy + r + 18 + Math.sin(Date.now() / 400) * 6;
    ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.fillText('👆', cx, fingerY);
  } else if (step.id === 'tools') {
    // 高亮左下角工具栏区域
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.rect(5, VIEW_H - 80, 130, 70); // 工具栏区域反向矩形
    ctx.fill('evenodd');
    // 工具栏光圈
    var pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.strokeStyle = 'rgba(255,215,0,' + pulse + ')';
    ctx.lineWidth = 2;
    draw.roundRect(ctx, 5, VIEW_H - 80, 130, 70, 14, null, ctx.strokeStyle);
  } else if (step.id === 'observe') {
    // observe 步骤：轻遮罩 + 箭头指向第一只猫
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    var cat = this.cats[0];
    if (cat && !cat.found) {
      var cx = cat.x + cat.w / 2, cy = cat.y - 15;
      var bobY = Math.sin(Date.now() / 300) * 6;
      ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('👇', cx, cy + bobY);
    }
  } else {
    // 其他步骤：轻遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // 文字气泡
  var textY = VIEW_H * 0.18;
  var boxW = 460, boxH = step.sub ? 90 : 60;
  var boxX = VIEW_W / 2 - boxW / 2;
  draw.roundRect(ctx, boxX, textY, boxW, boxH, 18, 'rgba(0,0,0,0.8)');
  ctx.strokeStyle = 'rgba(255,215,0,0.5)'; ctx.lineWidth = 1.5;
  draw.roundRect(ctx, boxX, textY, boxW, boxH, 18, null, 'rgba(255,215,0,0.5)');

  ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(step.text, VIEW_W / 2, textY + (step.sub ? 28 : boxH / 2));
  if (step.sub) {
    ctx.font = '14px sans-serif'; ctx.fillStyle = '#ddd';
    ctx.fillText(step.sub, VIEW_W / 2, textY + 58);
  }

  // 点击继续提示（非自动步骤 & 非等待特定点击）
  if (!step.waitTap && step.duration === 0) {
    var alpha = 0.4 + Math.sin(Date.now() / 500) * 0.3;
    ctx.globalAlpha = alpha;
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#aaa';
    ctx.fillText('点击任意处继续', VIEW_W / 2, textY + boxH + 20);
    ctx.globalAlpha = 1;
  }

  // 跳过按钮
  var skipX = VIEW_W - 80, skipY = textY - 30, skipW = 60, skipH = 28;
  ctx.globalAlpha = 0.6;
  draw.roundRect(ctx, skipX, skipY, skipW, skipH, 10, 'rgba(255,255,255,0.15)');
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#ccc'; ctx.textAlign = 'center';
  ctx.fillText('跳过', skipX + skipW / 2, skipY + skipH / 2);
  ctx.globalAlpha = 1;
  tut.skipBtn = { x: skipX, y: skipY, w: skipW, h: skipH };

  ctx.restore();
};

GameEngine.prototype._handleTutorialTap = function(vx, vy) {
  if (!this.tutorial) return false;
  var tut = this.tutorial;
  var step = TUT_STEPS[tut.step];
  if (!step) return false;

  // 跳过按钮
  if (tut.skipBtn) {
    var sb = tut.skipBtn;
    if (vx >= sb.x && vx <= sb.x + sb.w && vy >= sb.y && vy <= sb.y + sb.h) {
      this._saveTutorialDone();
      this.tutorial = null;
      // 恢复猫行为
      var cat = this.cats[0];
      if (cat && !cat.found) {
        cat.wobbleActive = false;
        cat.wobbleTimer = catSystem.randRange(cat.personality.wobbleCooldown);
        cat.wobbleStrength = cat.personality.wobbleStrength;
      }
      return true;
    }
  }

  // 等待特定点击的步骤（tap）：让正常的点击逻辑处理
  if (step.waitTap) return false;

  // 自动计时步骤：忽略点击
  if (step.duration > 0) return true;

  // 点击继续步骤
  tut.step++;
  tut.timer = 0;
  return true;
};

// ========== 粒子 & 提示 ==========

GameEngine.prototype._spawnParticles = function(cx, cy) {
  var symbols = ['⭐', '✨', '💛', '🐱', '❤️'];
  for (var i = 0; i < 12; i++) {
    var angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    var speed = 100 + Math.random() * 120;
    var life = 0.8 + Math.random() * 0.6;
    this.particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      life: life, maxLife: life,
      alpha: 1,
      symbol: symbols[i % symbols.length],
      size: 10 + Math.random() * 8,
    });
  }
};

GameEngine.prototype._drawParticles = function(ctx) {
  if (!this.particles.length) return;
  for (var i = 0; i < this.particles.length; i++) {
    var p = this.particles[i];
    ctx.save();
    ctx.globalAlpha = p.alpha * 0.9;
    ctx.font = Math.round(p.size) + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.symbol, p.x, p.y);
    ctx.restore();
  }
};

GameEngine.prototype._drawHint = function(ctx) {
  if (!this.hintCat || this.hintAlpha <= 0) return;
  var cat = this.hintCat;
  var cx = cat.x + cat.w / 2;
  var cy = cat.y + cat.h / 2;
  var radius = Math.max(cat.w, cat.h) * 0.7;
  var pulse = Math.sin(Date.now() / 200) * 0.15;
  ctx.save();
  ctx.globalAlpha = (0.2 + pulse) * this.hintAlpha;
  var grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
  grad.addColorStop(0, 'rgba(255,215,0,0.5)');
  grad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// ========== 触控处理 ==========

GameEngine.prototype.handleTouchStart = function(x, y) {
  var vx = x / this.scale;
  var vy = y / this.scale;
  this._touchStartX = vx;
  this._touchStartY = vy;
  this._touchStartTime = Date.now();
  this._isDragging = false;
};

GameEngine.prototype.handleTouchMove = function(x, y) {
  var vx = x / this.scale;
  var vy = y / this.scale;
  var dx = vx - this._touchStartX;
  var dy = vy - this._touchStartY;
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this._isDragging = true;
};

GameEngine.prototype.handleTouchEnd = function(x, y) {
  if (this._isDragging) return;
  var elapsed = Date.now() - this._touchStartTime;
  if (elapsed > 500) return;
  var vx = x / this.scale;
  var vy = y / this.scale;
  this._handleTap(vx, vy);
};

GameEngine.prototype._handleTap = function(vx, vy) {
  // 新手引导拦截（返回 true = 引导消费了这次点击）
  if (this.tutorial && this._handleTutorialTap(vx, vy)) return;

  // 结算画面按钮
  if (this.state === 'win' || this.state === 'lose') {
    if (this.retryBtn) {
      var b = this.retryBtn;
      if (vx >= b.x && vx <= b.x+b.w && vy >= b.y && vy <= b.y+b.h) {
        this.startGame(); return;
      }
    }
    if (this.nextLevelBtn) {
      var nb = this.nextLevelBtn;
      if (vx >= nb.x && vx <= nb.x+nb.w && vy >= nb.y && vy <= nb.y+nb.h) {
        this.startGame(this.currentRoomIdx + 1); return;
      }
    }
    if (this.selectBtn) {
      var sb = this.selectBtn;
      if (vx >= sb.x && vx <= sb.x+sb.w && vy >= sb.y && vy <= sb.y+sb.h) {
        this.stop();
        if (this.onShowLevelSelect) this.onShowLevelSelect();
        return;
      }
    }
    return;
  }

  if (this.state !== 'playing') return;

  // 工具栏
  for (var t = 0; t < this.toolBtns.length; t++) {
    var tb = this.toolBtns[t];
    if (vx >= tb.x && vx <= tb.x+tb.w && vy >= tb.y && vy <= tb.y+tb.h) {
      this._handleToolBtnClick(tb.type);
      return;
    }
  }

  // 激光笔使用
  if (this.activeTool === 'laser' && this.laserCooldown <= 0) {
    this.laserActive = true;
    this._usedLaser = true;
    this.laserX = vx; this.laserY = vy;
    this.laserTargetX = vx; this.laserTargetY = vy;
    this.laserTimer = 2.5;
    this.laserCooldown = this.laserMaxCD;
    this.activeTool = null;
    this.toast = '激光笔启动! 观察猫的反应...'; this.toastTimer = 1.5;
    return;
  }

  // 检测点击物品
  var hit = null;
  for (var i = this.allItems.length - 1; i >= 0; i--) {
    var item = this.allItems[i];
    if (item.isCat && item.catRef.found) continue;
    if (vx >= item.x && vx <= item.x + item.w && vy >= item.y && vy <= item.y + item.h) {
      hit = item; break;
    }
  }

  if (!hit) return;

  if (hit.isCat) {
    hit.catRef.found = true;
    hit.catRef.foundAnim = 0;
    this.foundCount++;
    this.currentFoundCat = hit.catRef;
    this.animTimer = 1.5;
    this.state = 'found_anim';
    this.toast = '找到了【' + hit.catRef.personality.name + '】! ' + hit.catRef.quote;
    this.toastTimer = 2.5;
    this._lastFoundTime = 0;
    this.hintTimer = 0; this.hintCat = null;
    // 生成庆祝粒子
    this._spawnParticles(hit.catRef.x + hit.catRef.w/2, hit.catRef.y + hit.catRef.h/2);
    // 引导模式：找到第一只猫后进入 found 步骤
    if (this.tutorial && this.tutorial.step <= 1) {
      this.tutorial.step = 2; this.tutorial.timer = 0;
    }
    // 成就：初次接触 + 累计猫数
    this.totalCatsFound++;
    this._unlockAchievement('first_cat');
    if (this.totalCatsFound >= 30) this._unlockAchievement('cat_master');
    this._saveAchievements();
  } else {
    // 引导模式 tap 步骤：点错不扣血，提示重试
    if (this.tutorial && this.tutorial.step === 1) {
      this.toast = '不是这个哦，找晃动的那个！';
      this.toastTimer = 1.0;
      return;
    }
    this.lives--;
    this.mistakes++;
    this.wrongItem = hit;
    this.wrongAnimTimer = 0.6;
    this.shakeTimer = 0.3;
    this.state = 'wrong_anim';
    this.toast = '这不是猫咪! -1 ❤️';
    this.toastTimer = 1.0;
  }
};

GameEngine.prototype._handleToolBtnClick = function(type) {
  if (type === 'laser') {
    if (this.laserCooldown > 0 || this.laserActive) {
      this.toast = '激光笔冷却中...'; this.toastTimer = 0.8;
      return;
    }
    if (this.activeTool === 'laser') {
      this.activeTool = null;
    } else {
      this.activeTool = 'laser';
      this.toast = '点击房间中任意位置使用激光笔'; this.toastTimer = 1.5;
    }
  } else if (type === 'catnip') {
    if (this.catnipCooldown > 0 || this.catnipActive) {
      this.toast = '猫薄荷冷却中...'; this.toastTimer = 0.8;
      return;
    }
    this.catnipActive = true;
    this._usedCatnip = true;
    this.catnipX = VIEW_W / 2;
    this.catnipY = (scene.BACK_B + scene.FLOOR_B) / 2;
    this.catnipTimer = 3.0;
    this.catnipCooldown = this.catnipMaxCD;
    this.activeTool = null;
    this.toast = '猫薄荷散发香气... 观察附近的物品!'; this.toastTimer = 2.0;
  }
};

GameEngine.ACHIEVEMENTS = ACHIEVEMENTS;
module.exports = GameEngine;
