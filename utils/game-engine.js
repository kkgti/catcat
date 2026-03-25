/**
 * 游戏引擎 —— 状态机、渲染循环、碰撞检测、工具系统
 * 同步自 preview.html
 */
var draw = require('./draw-utils');
var scene = require('./scene');
var catSystem = require('./cat-system');
var SFX = require('./sfx');
var codexMod = require('./codex');

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
  { id: 'combo_king',   name: '连击之王',   icon: '🔥', desc: '单局达成4连击' },
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
  // 随机环境事件
  this.envEvent = null;
  this.envEventCooldown = 0;
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
  this.shareBtn = null;
  this.muteBtn = null;
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
  // 连击系统
  this.combo = 0;
  this.maxCombo = 0;
  this.comboTimer = 0;
  this.comboWindow = 8;
  this.comboPopup = null;
  // 暂停
  this.paused = false;
  this.pauseBtn = null;
  this.pauseResumeBtn = null;
  this.pauseRetryBtn = null;
  this.pauseSelectBtn = null;
  // 过渡动画
  this.transTimer = 0;
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
  // 关卡选择 Canvas UI
  this.levelCards = [];
  this.achieveBtnRect = null;
  this.codexBtnRect = null;
  this.subScreen = null;
  this.subCloseBtn = null;
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
      SFX.achieve();
      break;
    }
  }
};

GameEngine.prototype.startGame = function(roomIdx) {
  // 停止旧循环，防止多重 RAF 叠加
  this.stop();
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
  this.introTimer = 5.0;
  this.fakeWobbles = [];
  var fwi = room.fakeWobbleInterval || [8, 20];
  this.fakeWobbleTimer = fwi[0] + Math.random() * (fwi[1] - fwi[0]);
  this.activeTool = null;
  this.retryBtn = null;
  this.nextLevelBtn = null;
  this.selectBtn = null;
  this.shareBtn = null;
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
  this.screenFlash = 0;
  this.timeOfDay = ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)];
  this.achievePopup = null;
  this.envEvent = null;
  this.envEventCooldown = 10 + Math.random() * 8;
  this._usedLaser = false;
  this._usedCatnip = false;
  this._hintTriggered = false;
  this.combo = 0; this.maxCombo = 0; this.comboTimer = 0; this.comboPopup = null;
  this.paused = false;
  this.timeOfDay = ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)];

  var roomId = room.id;
  SFX.startAmbient(roomId);

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
      drawFn: cp.draw, name: cp.name, disguiseId: tmpl.id,
      quote: catSystem.pickQuote(usedQuotes, roomId),
      color: personality.color,
      personality: personality,
      found: false, foundAnim: 0,
      behaviorMult: mult,
      wobbleTimer: catSystem.randRange(personality.wobbleCooldown) * mult,
      wobbleActive: false, wobbleElapsed: 0,
      wobbleDuration: catSystem.randRange(personality.wobbleDuration),
      wobbleCooldown: personality.wobbleCooldown,
      wobbleStrength: personality.wobbleStrength * (room.wobbleStrengthMult || 1),
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
  this._useRAF = !!this.ctx.requestAnimationFrame;
  var self = this;
  function loop() {
    if (!self._running) return;
    self._update();
    self._render();
    if (self._useRAF) {
      self._rafId = self.ctx.requestAnimationFrame(loop);
    } else {
      self._rafId = setTimeout(loop, 16);
    }
  }
  loop();
};

GameEngine.prototype.stop = function() {
  this._running = false;
  if (this._rafId != null) {
    if (this._useRAF && this.ctx.cancelAnimationFrame) {
      this.ctx.cancelAnimationFrame(this._rafId);
    } else {
      clearTimeout(this._rafId);
    }
  }
  this._rafId = null;
};

// ========== 更新逻辑 ==========

GameEngine.prototype._update = function() {
  var now = Date.now();
  if (this.paused) { this.lastTime = now; return; }
  if (this.state === 'ready') { this.lastTime = now; return; }
  var dt = Math.min((now - this.lastTime)/1000, 0.1);
  this.lastTime = now;

  // 开场提示
  if (this.state === 'intro') {
    var prevSec = Math.ceil(this.introTimer);
    this.introTimer -= dt;
    var curSec = Math.ceil(this.introTimer);
    if (curSec !== prevSec && curSec > 0 && curSec <= 3) SFX.tick();
    if (this.introTimer <= -0.5) {
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
    this._updateEnvEvent(dt);
  }

  // 新手引导
  if (this.tutorial && this.state === 'playing') {
    this._updateTutorial(dt);
  }

  // 找到猫动画
  if (this.state === 'found_anim') {
    this.animTimer -= dt;
    if (this.currentFoundCat) {
      this.currentFoundCat.foundAnim = Math.min(1, 1 - this.animTimer/2.0);
    }
    if (this.animTimer <= 0) {
      if (this.currentFoundCat) this.currentFoundCat.foundAnim = 1;
      this.currentFoundCat = null;
      if (this.foundCount >= this.cats.length) {
        this.state = 'win_trans';
        this.transTimer = 1.5;
        SFX.stopAmbient();
        SFX.win();
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
      if (this.lives <= 0) {
        this.state = 'lose_trans';
        this.transTimer = 1.0;
        SFX.stopAmbient();
        SFX.lose();
      } else {
        this.state = 'playing';
      }
    }
  }

  // 胜利过渡动画
  if (this.state === 'win_trans') {
    this.transTimer -= dt;
    if (this.transTimer <= 0) {
      this.state = 'win';
      var stars = this._calcStars();
      var pid = scene.ROOMS[this.currentRoomIdx].id;
      if (!this.levelProgress[pid]) this.levelProgress[pid] = { unlocked: true, stars: 0 };
      if (stars > this.levelProgress[pid].stars) this.levelProgress[pid].stars = stars;
      if (this.currentRoomIdx < scene.ROOMS.length - 1) {
        var nextId = scene.ROOMS[this.currentRoomIdx + 1].id;
        if (!this.levelProgress[nextId]) this.levelProgress[nextId] = { unlocked: false, stars: 0 };
        this.levelProgress[nextId].unlocked = true;
      }
      this._saveProgress();
      this._checkWinAchievements(stars);
    }
  }

  // 失败过渡动画
  if (this.state === 'lose_trans') {
    this.transTimer -= dt;
    if (this.transTimer <= 0) {
      this.state = 'lose';
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

  // 连击倒计时
  if (this.comboTimer > 0) {
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) { this.combo = 0; this.comboTimer = 0; }
  }
  if (this.comboPopup) {
    this.comboPopup.timer -= dt;
    if (this.comboPopup.timer <= 0) this.comboPopup = null;
  }

  // 提示系统：一定时间没找到猫，给出微光提示
  if (this.state === 'playing') {
    var hintDelay = scene.ROOMS[this.currentRoomIdx].hintDelay || 15;
    this._lastFoundTime += dt;
    if (this._lastFoundTime >= hintDelay) {
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

  // screenFlash decay
  if (this.screenFlash > 0) { this.screenFlash -= dt; if (this.screenFlash < 0) this.screenFlash = 0; }

  // 粒子更新
  for (var pi = this.particles.length - 1; pi >= 0; pi--) {
    var p = this.particles[pi];
    p.life -= dt;
    if (p.life <= 0) { this.particles.splice(pi, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt; // 重力
    p.alpha = Math.min(1, p.life / p.maxLife * 2);
    if (p.rot !== undefined && p.rotSpeed) p.rot += p.rotSpeed * dt;
    if (p.type === 'ring' && p.growSpeed) p.radius += p.growSpeed * dt;
  }

  // Toast
  if (this.toastTimer > 0) { this.toastTimer -= dt; if (this.toastTimer <= 0) this.toast = ''; }
};

GameEngine.prototype._updateCatBehaviors = function(dt) {
  var self = this;
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
        cat.bubbleText = catSystem.getBubbleText(p, scene.ROOMS[self.currentRoomIdx].id);
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
    var fwi2 = scene.ROOMS[this.currentRoomIdx].fakeWobbleInterval || [8, 20];
    this.fakeWobbleTimer = fwi2[0] + Math.random() * (fwi2[1] - fwi2[0]);
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

// ========== 随机环境事件 ==========
var ENV_EVENTS = {
  livingroom: [
    { type:'flicker', duration:1.2 },
    { type:'creak', duration:0.8 },
    { type:'shadow', duration:1.5 },
  ],
  kitchen: [
    { type:'flicker', duration:1.2 },
    { type:'steam', duration:2.0 },
    { type:'drip', duration:1.5 },
  ],
  bedroom: [
    { type:'flicker', duration:1.0 },
    { type:'shadow', duration:1.5 },
    { type:'creak', duration:0.8 },
  ],
  bathroom: [
    { type:'drip', duration:1.5 },
    { type:'steam', duration:2.0 },
    { type:'flicker', duration:1.0 },
  ],
  study: [
    { type:'creak', duration:0.8 },
    { type:'flicker', duration:1.0 },
    { type:'shadow', duration:1.5 },
  ],
};

GameEngine.prototype._updateEnvEvent = function(dt) {
  if (this.envEvent) {
    this.envEvent.timer -= dt;
    if (this.envEvent.timer <= 0) {
      this.envEvent = null;
      this.envEventCooldown = 8 + Math.random() * 12;
    }
    return;
  }
  this.envEventCooldown -= dt;
  if (this.envEventCooldown > 0) return;
  var roomId = scene.ROOMS[this.currentRoomIdx].id;
  var pool = ENV_EVENTS[roomId] || ENV_EVENTS.livingroom;
  var evt = pool[Math.floor(Math.random() * pool.length)];
  var srcItem = this.allItems[Math.floor(Math.random() * this.allItems.length)];
  this.envEvent = {
    type: evt.type, duration: evt.duration, timer: evt.duration,
    x: srcItem.baseX, y: srcItem.baseY - srcItem.h * 0.3,
  };
};

GameEngine.prototype._drawEnvEvent = function(ctx) {
  if (!this.envEvent) return;
  var e = this.envEvent;
  var p = 1 - e.timer / e.duration;
  // envDistraction 缩放干扰可见度
  var dist = scene.ROOMS[this.currentRoom] && scene.ROOMS[this.currentRoom].envDistraction;
  var _distSaved = false;
  if (dist !== undefined && dist < 1) { ctx.save(); ctx.globalAlpha *= dist; _distSaved = true; }

  if (e.type === 'flicker') {
    var flk = Math.sin(p * Math.PI * 8);
    if (flk > 0.3) {
      ctx.save(); ctx.globalAlpha = flk * 0.12;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.restore();
    }
  } else if (e.type === 'drip') {
    var dropY = e.y + p * 50;
    var alpha = p < 0.8 ? 0.6 : (1 - p) * 3;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#88ccff';
    ctx.beginPath(); ctx.arc(e.x, dropY, 3 - p * 1.5, 0, Math.PI*2); ctx.fill();
    if (p > 0.7) {
      var rippleP = (p - 0.7) / 0.3;
      ctx.globalAlpha = (1 - rippleP) * 0.3;
      ctx.strokeStyle = '#88ccff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 50, rippleP * 12, rippleP * 4, 0, 0, Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  } else if (e.type === 'steam') {
    ctx.save();
    for (var si = 0; si < 3; si++) {
      var sp = (p + si * 0.15) % 1;
      var sx = e.x + Math.sin(sp * 6 + si) * 8;
      var sy = e.y - sp * 40;
      ctx.globalAlpha = (1 - sp) * 0.2;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(sx, sy, 4 + sp * 6, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  } else if (e.type === 'shadow') {
    var shadowX = scene.BACK_L + p * (scene.BACK_R - scene.BACK_L) * 1.2 - 30;
    ctx.save();
    ctx.globalAlpha = 0.06 * Math.sin(p * Math.PI);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(shadowX, scene.BACK_T + (scene.BACK_B - scene.BACK_T) * 0.3, 25, 45, 0.2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  } else if (e.type === 'creak') {
    var crP = Math.sin(p * Math.PI);
    ctx.save(); ctx.globalAlpha = crP * 0.4;
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    for (var ci = 0; ci < 3; ci++) {
      var cr = 8 + ci * 5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, cr * crP, -0.3 + ci * 0.2, 0.3 + ci * 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }
  // 关闭 envDistraction 的 save
  if (_distSaved) { ctx.restore(); }
};

GameEngine.prototype._calcStars = function() {
  if (this.state !== 'win' && this.state !== 'win_trans') return 0;
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

  // 关卡选择画面
  if (this.state === 'ready') {
    this._drawLevelSelectScreen(ctx);
    ctx.restore();
    return;
  }

  // 开场
  if (this.state === 'intro') {
    var total = 5.0, elapsed = total - this.introTimer;
    var room = scene.ROOMS[this.currentRoomIdx];
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    if (elapsed < 1.5) {
      var p = Math.min(1, elapsed / 0.5);
      var sc = p < 1 ? easeOutBack(p) : 1;
      var fadeIn = Math.min(1, elapsed / 0.4);
      ctx.save(); ctx.globalAlpha = fadeIn;
      ctx.translate(VIEW_W/2, VIEW_H * 0.35); ctx.scale(sc, sc);
      ctx.font = '64px sans-serif'; ctx.fillText(room.emoji, 0, 0);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, (elapsed - 0.3) / 0.4));
      ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = '#ffd700';
      ctx.fillText(room.name, VIEW_W/2, VIEW_H * 0.50);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, (elapsed - 0.6) / 0.4));
      ctx.font = '16px sans-serif'; ctx.fillStyle = '#aaa';
      ctx.fillText('找出隐藏的 ' + room.catCount + ' 只猫咪', VIEW_W/2, VIEW_H*0.58);
      ctx.font = '13px sans-serif'; ctx.fillStyle = '#777';
      ctx.fillText('❤️x' + room.lives + '  仔细观察可疑的动静...', VIEW_W/2, VIEW_H*0.63);
      ctx.restore();
    } else {
      var cdElapsed = elapsed - 1.5;
      var cd = Math.min(3, Math.ceil(this.introTimer));
      var cdText = cd > 0 ? cd.toString() : 'GO!';
      var cdFrac;
      if (cd <= 0) { cdFrac = -this.introTimer; }
      else if (cd >= 3) { cdFrac = cdElapsed; }
      else { cdFrac = cdElapsed - (3.5 - cd); }
      var cdScale = cdFrac < 0.15 ? easeOutBack(cdFrac / 0.15) : 1;
      var cdAlpha = cdFrac < 0.1 ? cdFrac / 0.1 : 1;
      ctx.save(); ctx.globalAlpha = cdAlpha;
      ctx.translate(VIEW_W/2, VIEW_H * 0.45); ctx.scale(cdScale, cdScale);
      ctx.font = 'bold 64px sans-serif';
      ctx.fillStyle = cd > 0 ? '#ffd700' : '#66ff66';
      ctx.fillText(cdText, 0, 0);
      ctx.restore();
      ctx.font = '14px sans-serif'; ctx.fillStyle = '#888';
      ctx.fillText(room.emoji + ' ' + room.name, VIEW_W/2, VIEW_H * 0.60);
    }
    ctx.restore();
    return;
  }

  // 震动偏移
  ctx.translate(this.shakeX, this.shakeY);

  // 背景
  ctx.save();
  scene.drawRoomBackground(ctx, scene.ROOMS[this.currentRoomIdx].bgType);
  this._drawTimeOfDayOverlay(ctx);

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
  // 环境事件
  this._drawEnvEvent(ctx);

  ctx.restore();
  // 关闭外层 s*dpr+shake 变换，HUD/工具栏/Toast/结算在干净的 s*dpr 坐标下绘制
  ctx.restore();

  // 重新应用 s*dpr 变换（不含 shake），让 HUD 坐标与点击坐标对齐
  ctx.save();
  ctx.scale(s*dpr, s*dpr);

  // HUD
  this._drawHUD(ctx);
  this._drawCombo(ctx);
  // 工具栏
  this._drawToolbar(ctx);

  // Toast
  if (this.toast) {
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var tw = ctx.measureText(this.toast).width;
    draw.roundRect(ctx, VIEW_W/2-tw/2-15, VIEW_H*0.88-16, tw+30, 32, 12, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = '#fff'; ctx.fillText(this.toast, VIEW_W/2, VIEW_H*0.88);
  }

  // 暂停菜单
  this._drawPauseMenu(ctx);

  // 过渡动画
  if (this.state === 'win_trans') this._drawWinTransition(ctx);
  if (this.state === 'lose_trans') this._drawLoseTransition(ctx);

  // 结算
  if (this.state === 'win' || this.state === 'lose') {
    this._drawEndScreen(ctx);
  }

  // 分享卡片（覆盖在结算上面）
  if (this.subScreen === 'share_card') {
    this._drawShareCard(ctx);
  }

  // 新手引导覆盖层
  if (this.tutorial && this.state !== 'win' && this.state !== 'lose') {
    this._drawTutorial(ctx);
  }

  // 成就弹窗（最上层）
  this._drawAchievePopup(ctx);

  ctx.restore();
};

// 弹性缓动
function easeOutBack(t) {
  var c = 1.7;
  return 1 + (--t) * t * ((c + 1) * t + c);
}

GameEngine.prototype._drawFoundCat = function(ctx, cat) {
  var p = cat.foundAnim; // 0→1
  var cx = cat.x + cat.w/2, cy = cat.y + cat.h/2;
  var itemScale = cat.scale || ITEM_SCALE;

  // ── 阶段1: 伪装物品剧烈震颤 (0~0.2) ──
  if (p < 0.2) {
    var shakeP = p / 0.2;
    var intensity = shakeP * 6;
    var sx = Math.sin(p * 80) * intensity;
    var sy = Math.cos(p * 60) * intensity * 0.5;
    ctx.save();
    ctx.translate(cat.baseX + sx, cat.baseY + sy);
    ctx.scale(itemScale, itemScale);
    cat.drawFn(ctx, -cat.origW/2, -cat.origH, cat.origW, cat.origH);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = shakeP * 0.4; ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
    for (var li = 0; li < 4; li++) {
      var la = (li/4) * Math.PI * 2 + p * 20;
      var ld = cat.w * 0.4 + shakeP * 8;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(la)*ld, cy + Math.sin(la)*ld);
      ctx.lineTo(cx + Math.cos(la)*(ld+6), cy + Math.sin(la)*(ld+6)); ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // ── 阶段2: 缩小消失 + 烟雾爆发 (0.2~0.45) ──
  if (p < 0.45) {
    var shrinkP = (p - 0.2) / 0.25;
    if (shrinkP < 0.6) {
      var ss = 1 - shrinkP / 0.6;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(shrinkP * 0.5);
      ctx.scale(itemScale * ss, itemScale * ss);
      ctx.globalAlpha = ss;
      cat.drawFn(ctx, -cat.origW/2, -cat.origH/2, cat.origW, cat.origH);
      ctx.restore();
    }
    ctx.save();
    var smokeAlpha = shrinkP < 0.5 ? shrinkP * 2 : 2 - shrinkP * 2;
    ctx.globalAlpha = smokeAlpha * 0.7;
    for (var si = 0; si < 8; si++) {
      var sa = (si/8) * Math.PI * 2 + shrinkP * 2;
      var sd = shrinkP * 40;
      var sr = 5 + shrinkP * 12 - shrinkP * shrinkP * 8;
      var colors = ['#ffd700','#ff9944','#ffcc66','#fff5cc','#ffaa88','#ffe066','#ffbb44','#fff'];
      ctx.beginPath(); ctx.arc(cx + Math.cos(sa)*sd, cy + Math.sin(sa)*sd, sr, 0, Math.PI*2);
      ctx.fillStyle = colors[si]; ctx.fill();
    }
    var flashR = 15 + shrinkP * 25;
    var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
    grd.addColorStop(0, 'rgba(255,255,255,' + (smokeAlpha * 0.8) + ')');
    grd.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(cx - flashR, cy - flashR, flashR*2, flashR*2);
    ctx.restore();
    return;
  }

  // ── 阶段3: 猫咪弹性弹出 + poof云 + 惊讶表情 (0.45~0.7) ──
  var catSize = 42;
  if (p < 0.7) {
    var popP = (p - 0.45) / 0.25;
    var scale = easeOutBack(Math.min(1, popP));
    // "Poof" cloud behind the cat
    ctx.save();
    var poofAlpha = (1 - popP) * 0.6;
    ctx.globalAlpha = poofAlpha;
    var poofColors = ['#fff', '#fff8e1', '#fffbe6', '#f5f5f5'];
    var poofAngles = [0.3, 1.8, 3.4, 5.0];
    for (var pi = 0; pi < 4; pi++) {
      var pa = poofAngles[pi];
      var pDist = 8 + popP * 18;
      var pRadius = 10 + popP * 14 - popP * popP * 6;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(pa) * pDist, cy + Math.sin(pa) * pDist, pRadius * scale, 0, Math.PI * 2);
      ctx.fillStyle = poofColors[pi]; ctx.fill();
    }
    ctx.restore();
    // Cat pops out
    ctx.save();
    ctx.globalAlpha = Math.min(1, popP * 2);
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    draw.drawCat(ctx, 0, 0, catSize, cat.color);
    ctx.restore();
    // Surprised expression
    ctx.save();
    ctx.globalAlpha = Math.min(1, popP * 2.5);
    ctx.font = (14 + popP * 4) + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u{1F63A}', cx, cy - catSize * scale * 0.5 - 12);
    ctx.restore();
    // 散开的星星
    ctx.save(); ctx.globalAlpha = (1 - popP) * 0.6;
    for (var ti = 0; ti < 6; ti++) {
      var ta = (ti/6)*Math.PI*2 - popP*1.5;
      var td = 20 + popP * 30;
      ctx.font = (8 + popP*4) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u2726', cx + Math.cos(ta)*td, cy + Math.sin(ta)*td);
    }
    ctx.restore();
    return;
  }

  // ── 阶段4: 猫咪微跳 + 尾巴摇摆 + 声波 + 庆祝 (0.7~0.85) ──
  if (p < 0.85) {
    var bounceP = (p - 0.7) / 0.15;
    var bounce = Math.sin(bounceP * Math.PI) * 8;
    ctx.save();
    draw.drawCat(ctx, cx, cy - bounce, catSize, cat.color);
    // Happy expression
    ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u{1F638}', cx, cy - bounce - catSize * 0.5 - 12);
    // Tail wag
    ctx.save();
    ctx.strokeStyle = cat.color; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    var tailSwayAngle = Math.sin(bounceP * Math.PI * 4) * 0.6;
    var tailBaseX = cx - catSize * 0.35;
    var tailBaseY = cy - bounce + catSize * 0.15;
    ctx.beginPath(); ctx.moveTo(tailBaseX, tailBaseY);
    ctx.quadraticCurveTo(tailBaseX - 12 + Math.sin(tailSwayAngle) * 10, tailBaseY - 8,
      tailBaseX - 8 + Math.sin(tailSwayAngle) * 14, tailBaseY - 18);
    ctx.stroke();
    ctx.restore();
    // Sound wave arcs ("meow!")
    ctx.save();
    for (var wi = 0; wi < 3; wi++) {
      var waveDelay = wi * 0.15;
      var waveP = Math.max(0, Math.min(1, (bounceP - waveDelay) / 0.5));
      if (waveP > 0 && waveP < 1) {
        ctx.globalAlpha = (1 - waveP) * 0.5;
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5;
        var arcRadius = 15 + waveP * 25;
        ctx.beginPath();
        ctx.arc(cx + catSize * 0.4, cy - bounce - catSize * 0.2, arcRadius, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.stroke();
      }
    }
    ctx.restore();
    // Orbiting decorations with personality icon
    ctx.globalAlpha = 0.5 + Math.sin(bounceP * Math.PI) * 0.5;
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    var personalityIcon = (cat.personality && cat.personality.icon) ? cat.personality.icon : '\u2665';
    var decos = ['\u2665', '\u2605', personalityIcon, '\u2726'];
    for (var di = 0; di < decos.length; di++) {
      var da = (di/decos.length)*Math.PI*2 + bounceP*3;
      var dd = 30 + Math.sin(bounceP*Math.PI)*10;
      ctx.fillText(decos[di], cx + Math.cos(da)*dd, cy - bounce + Math.sin(da)*dd - 5);
    }
    ctx.restore();
    return;
  }

  // ── 阶段5: 静止猫咪 + 打字机语录气泡 + 猫爪装饰 (0.85~1.0) ──
  ctx.save();
  draw.drawCat(ctx, cx, cy, catSize, cat.color);
  var bubbleP = (p - 0.85) / 0.15;
  var fullQuote = cat.quote || '';
  var revealCount = Math.floor(bubbleP * fullQuote.length);
  if (bubbleP >= 1) revealCount = fullQuote.length;
  var visibleText = fullQuote.substring(0, revealCount);
  if (revealCount > 0 || bubbleP > 0.05) {
    ctx.globalAlpha = Math.min(1, bubbleP * 3);
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    var tw = ctx.measureText(fullQuote).width;
    var bx = cx - tw/2 - 12, by = cy - catSize - 32, bw = tw + 24, bh = 28;
    draw.roundRect(ctx, bx, by, bw, bh, 10, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath(); ctx.moveTo(cx - 5, by + bh); ctx.lineTo(cx + 5, by + bh); ctx.lineTo(cx, by + bh + 6); ctx.fill();
    ctx.fillStyle = '#ffd700'; ctx.fillText(visibleText, cx, by + bh - 7);
    if (revealCount < fullQuote.length) {
      var cursorBlink = Math.sin(bubbleP * 40) > 0 ? 1 : 0;
      if (cursorBlink) {
        var partialW = ctx.measureText(visibleText).width;
        ctx.fillRect(cx - tw/2 + partialW, by + bh - 18, 1.5, 12);
      }
    }
    ctx.globalAlpha = Math.min(1, bubbleP * 2);
    ctx.font = '11px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('\u{1F43E}', bx + bw + 3, by + bh / 2);
  }
  ctx.restore();
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
  // 暂停按钮
  ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⏸', VIEW_W - 56, 68);
  this.pauseBtn = { x: VIEW_W - 78, y: 46, w: 44, h: 44 };
  // 音量按钮
  var muteIcon = SFX.isMuted() ? '🔇' : '🔊';
  ctx.fillText(muteIcon, VIEW_W - 22, 68);
  this.muteBtn = { x: VIEW_W - 44, y: 46, w: 44, h: 44 };
};

// ========== 关卡选择画面 ==========

GameEngine.prototype._drawLevelSelectScreen = function(ctx) {
  var grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(0.5, '#16213e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  var cx = VIEW_W / 2;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  ctx.font = '60px sans-serif';
  ctx.fillText('🐱', cx, 52);
  ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#ffd700';
  ctx.fillText('变身躲猫猫', cx, 100);
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#aaa';
  ctx.fillText('Prop Hunt - 找出伪装的猫咪!', cx, 122);

  var tipW = 280, tipH = 60, tipX = cx - tipW/2, tipY = 140;
  draw.roundRect(ctx, tipX, tipY, tipW, tipH, 12, 'rgba(255,255,255,0.08)');
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#ddd';
  ctx.fillText('猫咪变成了房间里的物品', cx, tipY + 16);
  ctx.fillText('观察可疑动静，点击找出所有猫咪', cx, tipY + 34);
  ctx.fillText('小心！点错会扣一颗心 ❤️', cx, tipY + 52);

  this.levelCards = [];
  var ROOMS = scene.ROOMS;
  var cardW = 105, cardH = 130, gap = 12;
  var startY = tipY + tipH + 18;

  var self = this;
  ROOMS.forEach(function(room, idx) {
    var row = Math.floor(idx / 3), col = idx % 3;
    var rowCols = Math.min(3, ROOMS.length - row * 3);
    var rowW = rowCols * cardW + (rowCols - 1) * gap;
    var rx = cx - rowW / 2 + col * (cardW + gap);
    var ry = startY + row * (cardH + gap);

    var prog = self.levelProgress[room.id] || { unlocked: idx === 0, stars: 0 };

    var cardBg = prog.unlocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
    var borderCol = prog.unlocked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
    draw.roundRect(ctx, rx, ry, cardW, cardH, 14, cardBg);
    ctx.strokeStyle = borderCol; ctx.lineWidth = 2;
    draw.roundRect(ctx, rx, ry, cardW, cardH, 14, null, borderCol);

    ctx.save();
    if (!prog.unlocked) ctx.globalAlpha = 0.4;

    var ccx = rx + cardW / 2;
    if (prog.unlocked) {
      ctx.font = '36px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText(room.emoji, ccx, ry + 32);
      ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText(room.name, ccx, ry + 58);
      ctx.font = '11px sans-serif'; ctx.fillStyle = '#aaa';
      ctx.fillText(room.desc, ccx, ry + 78);
      ctx.font = '16px sans-serif'; ctx.fillStyle = '#fff';
      var starStr = '';
      for (var s = 0; s < 3; s++) starStr += s < prog.stars ? '⭐' : '☆';
      ctx.fillText(starStr, ccx, ry + 102);
    } else {
      ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText('🔒', ccx, ry + 38);
      ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText(room.name, ccx, ry + 66);
      ctx.font = '11px sans-serif'; ctx.fillStyle = '#aaa';
      ctx.fillText('通关上一关解锁', ccx, ry + 86);
    }
    ctx.restore();

    self.levelCards.push({ x: rx, y: ry, w: cardW, h: cardH, idx: idx, unlocked: prog.unlocked });
  });

  var btnY = startY + Math.ceil(ROOMS.length / 3) * (cardH + gap) + 8;
  var btnW = 180, btnH = 36;
  var abx = cx - btnW / 2;

  draw.roundRect(ctx, abx, btnY, btnW, btnH, 20, 'rgba(255,215,0,0.15)');
  ctx.strokeStyle = 'rgba(255,215,0,0.4)'; ctx.lineWidth = 2;
  draw.roundRect(ctx, abx, btnY, btnW, btnH, 20, null, ctx.strokeStyle);
  ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
  var aCount = 0;
  for (var k in this.achievements) { if (this.achievements[k]) aCount++; }
  ctx.fillText('🏆 成就 ' + aCount + '/' + ACHIEVEMENTS.length, cx, btnY + btnH / 2);
  this.achieveBtnRect = { x: abx, y: btnY, w: btnW, h: btnH };

  var cbY = btnY + btnH + 10;
  draw.roundRect(ctx, abx, cbY, btnW, btnH, 20, 'rgba(100,200,255,0.12)');
  ctx.strokeStyle = 'rgba(100,200,255,0.35)'; ctx.lineWidth = 2;
  draw.roundRect(ctx, abx, cbY, btnW, btnH, 20, null, ctx.strokeStyle);
  ctx.fillStyle = '#88ccff';
  var cc = codexMod.getCount();
  ctx.fillText('📖 图鉴 ' + cc.found + '/' + cc.total, cx, cbY + btnH / 2);
  this.codexBtnRect = { x: abx, y: cbY, w: btnW, h: btnH };

  if (this.subScreen === 'achieve') this._drawAchieveSubScreen(ctx);
  if (this.subScreen === 'codex') this._drawCodexSubScreen(ctx);
};

GameEngine.prototype._drawAchieveSubScreen = function(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.70)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  var panelW = 340, panelH = Math.min(420, VIEW_H - 80);
  var px = (VIEW_W - panelW) / 2, py = (VIEW_H - panelH) / 2;
  draw.roundRect(ctx, px, py, panelW, panelH, 16, 'rgba(15,15,30,0.95)');
  ctx.strokeStyle = 'rgba(255,215,0,0.4)'; ctx.lineWidth = 2;
  draw.roundRect(ctx, px, py, panelW, panelH, 16, null, ctx.strokeStyle);

  ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('🏆 成就墙', px + 16, py + 24);
  ctx.font = '18px sans-serif'; ctx.fillStyle = '#999'; ctx.textAlign = 'right';
  ctx.fillText('✕', px + panelW - 16, py + 24);
  this.subCloseBtn = { x: px + panelW - 40, y: py + 8, w: 36, h: 32 };

  var headerH = 48;
  var contentTop = py + headerH;
  var contentH = panelH - headerH - 12;
  var scrollY = this.achieveScrollY || 0;

  var cols = 2, itemW = 148, itemH = 70, gapX = 10, gapY = 10;
  var rows = Math.ceil(ACHIEVEMENTS.length / cols);
  var totalContentH = rows * (itemH + gapY) - gapY + 12;
  this.achieveMaxScroll = Math.max(0, totalContentH - contentH);
  if (scrollY > this.achieveMaxScroll) { scrollY = this.achieveMaxScroll; this.achieveScrollY = scrollY; }

  ctx.save();
  ctx.beginPath();
  ctx.rect(px + 4, contentTop, panelW - 8, contentH);
  ctx.clip();

  var gridX = px + (panelW - cols * itemW - gapX) / 2;
  var gridY = contentTop + 6 - scrollY;
  var self = this;

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ACHIEVEMENTS.forEach(function(a, i) {
    var done = !!self.achievements[a.id];
    var col = i % cols, row = Math.floor(i / cols);
    var ix = gridX + col * (itemW + gapX);
    var iy = gridY + row * (itemH + gapY);
    if (iy + itemH < contentTop - 10 || iy > contentTop + contentH + 10) return;
    ctx.save();
    if (!done) ctx.globalAlpha = 0.4;
    draw.roundRect(ctx, ix, iy, itemW, itemH, 10, done ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.05)');
    var border = done ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)';
    ctx.strokeStyle = border; ctx.lineWidth = 1;
    draw.roundRect(ctx, ix, iy, itemW, itemH, 10, null, border);
    var icx = ix + itemW / 2;
    ctx.font = '26px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(done ? a.icon : '🔒', icx, iy + 22);
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(a.name, icx, iy + 42);
    ctx.font = '10px sans-serif'; ctx.fillStyle = '#aaa'; ctx.fillText(a.desc, icx, iy + 58);
    ctx.restore();
  });
  ctx.restore();

  if (this.achieveMaxScroll > 0) {
    var trackH = contentH - 8;
    var thumbH = Math.max(24, trackH * contentH / totalContentH);
    var thumbY = contentTop + 4 + (trackH - thumbH) * (scrollY / this.achieveMaxScroll);
    draw.roundRect(ctx, px + panelW - 10, thumbY, 4, thumbH, 2, 'rgba(255,255,255,0.25)');
  }
};

GameEngine.prototype._drawCodexSubScreen = function(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.70)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  var panelW = 350, panelH = Math.min(480, VIEW_H - 80);
  var px = (VIEW_W - panelW) / 2, py = (VIEW_H - panelH) / 2;
  draw.roundRect(ctx, px, py, panelW, panelH, 16, 'rgba(10,15,30,0.96)');
  ctx.strokeStyle = 'rgba(100,200,255,0.4)'; ctx.lineWidth = 2;
  draw.roundRect(ctx, px, py, panelW, panelH, 16, null, ctx.strokeStyle);

  var cc = codexMod.getCount();
  ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#88ccff';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('📖 猫咪图鉴 ' + cc.found + '/' + cc.total, px + 16, py + 24);
  ctx.font = '18px sans-serif'; ctx.fillStyle = '#999'; ctx.textAlign = 'right';
  ctx.fillText('✕', px + panelW - 16, py + 24);
  this.subCloseBtn = { x: px + panelW - 40, y: py + 8, w: 36, h: 32 };

  var pct = cc.total > 0 ? Math.round(cc.found / cc.total * 100) : 0;
  var barX = px + 16, barY = py + 44, barW = panelW - 32, barH = 16;
  draw.roundRect(ctx, barX, barY, barW, barH, 8, 'rgba(255,255,255,0.1)');
  if (pct > 0) draw.roundRect(ctx, barX, barY, barW * pct / 100, barH, 8, 'rgba(100,200,255,0.5)');
  ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText(pct + '%', barX + barW / 2, barY + barH / 2);

  // 可滚动内容区域
  var headerH = 70;
  var contentTop = py + headerH;
  var contentH = panelH - headerH - 12;
  var scrollY = this.codexScrollY || 0;

  var CROOMS = codexMod.CODEX_ROOMS;
  var codexData = codexMod.getData();
  var itemW = 72, itemH = 48, gapX2 = 8, gridCols = 4;

  // 计算总内容高度
  var totalContentH = 0;
  CROOMS.forEach(function(room) {
    totalContentH += 20;
    var dRows = Math.ceil(room.disguises.length / gridCols);
    totalContentH += dRows * (itemH + 6) + 12;
  });
  this.codexMaxScroll = Math.max(0, totalContentH - contentH);
  if (scrollY > this.codexMaxScroll) { scrollY = this.codexMaxScroll; this.codexScrollY = scrollY; }

  // 裁剪可滚动区域
  ctx.save();
  ctx.beginPath();
  ctx.rect(px + 4, contentTop, panelW - 8, contentH);
  ctx.clip();

  var curY = contentTop + 6 - scrollY;
  ctx.textBaseline = 'middle';
  var gridStartX = px + (panelW - gridCols * itemW - (gridCols - 1) * gapX2) / 2;

  CROOMS.forEach(function(room) {
    var roomFound = 0;
    room.disguises.forEach(function(d) { if (codexData[d.id]) roomFound++; });
    ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'left';
    ctx.fillText(room.emoji + ' ' + room.name + ' (' + roomFound + '/' + room.disguises.length + ')', px + 16, curY + 6);
    curY += 20;

    room.disguises.forEach(function(d, di) {
      var col = di % gridCols, row = Math.floor(di / gridCols);
      var ix = gridStartX + col * (itemW + gapX2);
      var iy = curY + row * (itemH + 6);
      if (iy + itemH < contentTop - 10 || iy > contentTop + contentH + 10) return;
      var found = !!codexData[d.id];
      ctx.save();
      if (!found) ctx.globalAlpha = 0.35;
      draw.roundRect(ctx, ix, iy, itemW, itemH, 8, found ? 'rgba(100,200,255,0.1)' : 'rgba(255,255,255,0.03)');
      var bdr = found ? 'rgba(100,200,255,0.3)' : 'rgba(255,255,255,0.08)';
      ctx.strokeStyle = bdr; ctx.lineWidth = 1;
      draw.roundRect(ctx, ix, iy, itemW, itemH, 8, null, bdr);
      ctx.textAlign = 'center';
      ctx.font = '22px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(found ? '🐱' : '❓', ix + itemW / 2, iy + 18);
      ctx.font = '9px sans-serif'; ctx.fillStyle = found ? '#ccc' : '#666';
      ctx.fillText(found ? d.name : '???', ix + itemW / 2, iy + 38);
      ctx.restore();
    });

    var dRows = Math.ceil(room.disguises.length / gridCols);
    curY += dRows * (itemH + 6) + 12;
  });
  ctx.restore();

  // 滚动条指示器
  if (this.codexMaxScroll > 0) {
    var trackH = contentH - 8;
    var thumbH = Math.max(24, trackH * contentH / totalContentH);
    var thumbY = contentTop + 4 + (trackH - thumbH) * (scrollY / this.codexMaxScroll);
    draw.roundRect(ctx, px + panelW - 10, thumbY, 4, thumbH, 2, 'rgba(255,255,255,0.25)');
  }
};

GameEngine.prototype._handleLevelSelectTap = function(vx, vy) {
  if (this.subScreen) {
    if (this.subCloseBtn) {
      var cb = this.subCloseBtn;
      if (vx >= cb.x && vx <= cb.x+cb.w && vy >= cb.y && vy <= cb.y+cb.h) {
        SFX.tap(); this.subScreen = null; return;
      }
    }
    return;
  }

  for (var i = 0; i < this.levelCards.length; i++) {
    var lc = this.levelCards[i];
    if (vx >= lc.x && vx <= lc.x+lc.w && vy >= lc.y && vy <= lc.y+lc.h) {
      if (lc.unlocked) {
        SFX.tap(); this.startGame(lc.idx);
      }
      return;
    }
  }

  if (this.achieveBtnRect) {
    var ab = this.achieveBtnRect;
    if (vx >= ab.x && vx <= ab.x+ab.w && vy >= ab.y && vy <= ab.y+ab.h) {
      SFX.tap(); this.subScreen = 'achieve'; this.achieveScrollY = 0; return;
    }
  }

  if (this.codexBtnRect) {
    var cb2 = this.codexBtnRect;
    if (vx >= cb2.x && vx <= cb2.x+cb2.w && vy >= cb2.y && vy <= cb2.y+cb2.h) {
      SFX.tap(); this.subScreen = 'codex'; this.codexScrollY = 0; return;
    }
  }
};

GameEngine.prototype._showLevelSelect = function() {
  SFX.stopAmbient();
  if (this.onShowLevelSelect) {
    this.stop();
    this.onShowLevelSelect();
  } else {
    this.state = 'ready';
    this.subScreen = null;
  }
};

GameEngine.prototype._drawPauseMenu = function(ctx) {
  if (!this.paused) return;
  ctx.fillStyle = 'rgba(0,0,0,0.60)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  var cardW = 260, cardH = 260;
  var cardX = (VIEW_W - cardW) / 2, cardY = (VIEW_H - cardH) / 2 - 20;
  draw.roundRect(ctx, cardX, cardY, cardW, cardH, 20, 'rgba(20,18,35,0.95)');
  ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 2;
  draw.roundRect(ctx, cardX, cardY, cardW, cardH, 20, null, ctx.strokeStyle);

  var cx = VIEW_W / 2;
  ctx.font = '30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⏸', cx, cardY + 38);
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#ffd700';
  ctx.fillText('暂停', cx, cardY + 70);

  var btnW = 200, btnH = 42, btnX = cx - btnW / 2;

  var y1 = cardY + 105;
  draw.roundRect(ctx, btnX, y1, btnW, btnH, 20, '#ffd700');
  ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#1a1a2e';
  ctx.fillText('▶ 继续游戏', cx, y1 + btnH / 2);
  this.pauseResumeBtn = { x: btnX, y: y1, w: btnW, h: btnH };

  var y2 = y1 + btnH + 12;
  draw.roundRect(ctx, btnX, y2, btnW, btnH, 20, 'rgba(255,255,255,0.12)');
  ctx.fillStyle = '#ddd';
  ctx.fillText('↻ 重新开始', cx, y2 + btnH / 2);
  this.pauseRetryBtn = { x: btnX, y: y2, w: btnW, h: btnH };

  var y3 = y2 + btnH + 12;
  draw.roundRect(ctx, btnX, y3, btnW, btnH, 20, 'rgba(255,255,255,0.12)');
  ctx.fillStyle = '#bbb';
  ctx.fillText('≡ 选择关卡', cx, y3 + btnH / 2);
  this.pauseSelectBtn = { x: btnX, y: y3, w: btnW, h: btnH };
};

GameEngine.prototype._drawCombo = function(ctx) {
  var now = Date.now() / 1000;

  // ── 1. Combo background pulse: golden/orange/red border glow ──
  if (this.combo >= 2 && this.state === 'playing') {
    var glowAlpha, glowColor1, glowColor2;
    var pulse = (Math.sin(now * 4) + 1) / 2;
    if (this.combo >= 4) {
      glowAlpha = 0.10 + pulse * 0.05;
      glowColor1 = 'rgba(255,68,34,'; glowColor2 = 'rgba(255,120,0,';
    } else if (this.combo >= 3) {
      glowAlpha = 0.06 + pulse * 0.03;
      glowColor1 = 'rgba(255,170,0,'; glowColor2 = 'rgba(255,200,50,';
    } else {
      glowAlpha = 0.03 + pulse * 0.015;
      glowColor1 = 'rgba(255,215,0,'; glowColor2 = 'rgba(255,235,100,';
    }
    ctx.save();
    var edgeSize = 32 + pulse * 12;
    var gradT = ctx.createLinearGradient(0, 0, 0, edgeSize);
    gradT.addColorStop(0, glowColor1 + glowAlpha + ')'); gradT.addColorStop(1, glowColor1 + '0)');
    ctx.fillStyle = gradT; ctx.fillRect(0, 0, VIEW_W, edgeSize);
    var gradB = ctx.createLinearGradient(0, VIEW_H, 0, VIEW_H - edgeSize);
    gradB.addColorStop(0, glowColor1 + glowAlpha + ')'); gradB.addColorStop(1, glowColor1 + '0)');
    ctx.fillStyle = gradB; ctx.fillRect(0, VIEW_H - edgeSize, VIEW_W, edgeSize);
    var gradL = ctx.createLinearGradient(0, 0, edgeSize, 0);
    gradL.addColorStop(0, glowColor2 + glowAlpha + ')'); gradL.addColorStop(1, glowColor2 + '0)');
    ctx.fillStyle = gradL; ctx.fillRect(0, 0, edgeSize, VIEW_H);
    var gradR = ctx.createLinearGradient(VIEW_W, 0, VIEW_W - edgeSize, 0);
    gradR.addColorStop(0, glowColor2 + glowAlpha + ')'); gradR.addColorStop(1, glowColor2 + '0)');
    ctx.fillStyle = gradR; ctx.fillRect(VIEW_W - edgeSize, 0, edgeSize, VIEW_H);
    if (this.combo >= 4 && pulse > 0.85) {
      ctx.fillStyle = 'rgba(255,68,34,' + ((pulse - 0.85) / 0.15 * 0.06) + ')';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    ctx.restore();
  }

  // ── HUD combo indicator (upgraded) ──
  if (this.combo >= 2 && this.state === 'playing') {
    var pct = this.comboTimer / this.comboWindow;
    var barW = 60, barH = 4;
    var bx = VIEW_W - barW - 18, by = 76;
    var breathe = 1 + Math.sin(now * 5) * 0.06;
    ctx.save();
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    var textX = VIEW_W - 22, textY = by - 6;
    ctx.translate(textX, textY); ctx.scale(breathe, breathe); ctx.translate(-textX, -textY);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = this.combo >= 4 ? '#ff6644' : this.combo >= 3 ? '#ffaa00' : '#ffd700';
    var comboLabel = this.combo >= 3 ? '\u{1F525} ' + this.combo + 'x \u8FDE\u51FB!' : this.combo + 'x \u8FDE\u51FB!';
    ctx.fillText(comboLabel, textX, textY);
    ctx.restore();
    draw.roundRect(ctx, bx, by + 2, barW, barH, 2, 'rgba(255,255,255,0.15)');
    var fillW = barW * pct;
    if (fillW > 0) {
      ctx.save();
      ctx.beginPath();
      var r = 2;
      ctx.moveTo(bx + r, by + 2); ctx.lineTo(bx + fillW - r, by + 2);
      ctx.arcTo(bx + fillW, by + 2, bx + fillW, by + 2 + r, r);
      ctx.lineTo(bx + fillW, by + 2 + barH - r);
      ctx.arcTo(bx + fillW, by + 2 + barH, bx + fillW - r, by + 2 + barH, r);
      ctx.lineTo(bx + r, by + 2 + barH);
      ctx.arcTo(bx, by + 2 + barH, bx, by + 2 + barH - r, r);
      ctx.lineTo(bx, by + 2 + r);
      ctx.arcTo(bx, by + 2, bx + r, by + 2, r);
      ctx.closePath(); ctx.clip();
      var barGrad = ctx.createLinearGradient(bx, 0, bx + fillW, 0);
      if (this.combo >= 4) { barGrad.addColorStop(0, '#ff4422'); barGrad.addColorStop(0.5, '#ff8800'); barGrad.addColorStop(1, '#ffcc00'); }
      else if (this.combo >= 3) { barGrad.addColorStop(0, '#ffaa00'); barGrad.addColorStop(1, '#ffd700'); }
      else { barGrad.addColorStop(0, '#ffd700'); barGrad.addColorStop(1, '#ffee88'); }
      ctx.fillStyle = barGrad; ctx.fillRect(bx, by + 2, fillW, barH);
      ctx.restore();
    }
  }

  // ── Combo popup (bigger, with streak trail) ──
  if (this.comboPopup) {
    var p = this.comboPopup;
    var prog = 1 - p.timer / 1.5;
    var alpha = prog < 0.7 ? 1 : 1 - (prog - 0.7) / 0.3;
    var rise = prog * 40;
    var baseScale = prog < 0.15 ? easeOutBack(prog / 0.15) : 1;
    var sx = p.x, sy = p.y - rise;
    var fontSize, color, prefix;
    if (p.count >= 4) { fontSize = 40; color = '#ff4422'; prefix = '\u{1F525}\u{1F525} '; }
    else if (p.count >= 3) { fontSize = 32; color = '#ffaa00'; prefix = '\u{1F525} '; }
    else { fontSize = 24; color = '#ffd700'; prefix = ''; }
    var label = prefix + p.count + 'x COMBO!';
    // Ghost afterimages
    if (p.count >= 3) {
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var gi = 3; gi >= 1; gi--) {
        ctx.globalAlpha = alpha * (0.12 / gi);
        ctx.font = 'bold ' + Math.round(fontSize * baseScale * (1 - gi * 0.08)) + 'px sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(label, sx, sy + gi * 14);
      }
      ctx.restore();
    }
    // Main popup
    ctx.save(); ctx.globalAlpha = alpha; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var shakeX = 0, shakeY = 0;
    if (p.count >= 4 && prog < 0.5) {
      var shakeI = (1 - prog / 0.5) * 3;
      shakeX = Math.sin(now * 47) * shakeI; shakeY = Math.cos(now * 53) * shakeI;
    }
    ctx.font = 'bold ' + Math.round(fontSize * baseScale) + 'px sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3;
    ctx.strokeText(label, sx + shakeX, sy + shakeY);
    ctx.fillStyle = color; ctx.fillText(label, sx + shakeX, sy + shakeY);
    ctx.restore();
  }
};

GameEngine.prototype._getWindowSkyColor = function(timeOfDay) {
  switch (timeOfDay) {
    case 'morning': return '#88bbdd';
    case 'afternoon': return '#6699cc';
    case 'evening': return ['#ff8844', '#6644aa'];
    case 'night': return '#1a1a3a';
    default: return '#6699cc';
  }
};

GameEngine.prototype._drawTimeOfDayOverlay = function(ctx) {
  var tod = this.timeOfDay;
  if (!tod) return;
  ctx.save();
  // 1. Full-viewport colour tint
  var tint;
  switch (tod) {
    case 'morning': tint = 'rgba(255,220,150,0.06)'; break;
    case 'afternoon': tint = 'rgba(255,255,240,0.02)'; break;
    case 'evening': tint = 'rgba(255,160,80,0.10)'; break;
    case 'night': tint = 'rgba(40,60,120,0.12)'; break;
    default: tint = 'rgba(0,0,0,0)';
  }
  ctx.fillStyle = tint; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // 2. Window glow / god-rays
  var winCX = (scene.BACK_L + scene.BACK_R) / 2, winCY = scene.BACK_T + (scene.BACK_B - scene.BACK_T) * 0.3;
  var winW = (scene.BACK_R - scene.BACK_L) * 0.30, winH = (scene.BACK_B - scene.BACK_T) * 0.35;
  if (tod === 'morning') {
    ctx.save(); ctx.globalAlpha = 0.04;
    var rayGrad = ctx.createLinearGradient(winCX - winW/2, winCY, VIEW_W * 0.8, VIEW_H * 0.7);
    rayGrad.addColorStop(0, 'rgba(255,240,180,0.9)'); rayGrad.addColorStop(0.5, 'rgba(255,240,180,0.3)'); rayGrad.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = rayGrad; ctx.beginPath();
    ctx.moveTo(winCX - winW*0.4, winCY - winH*0.4); ctx.lineTo(VIEW_W*0.9, VIEW_H*0.3);
    ctx.lineTo(VIEW_W*0.95, VIEW_H*0.85); ctx.lineTo(winCX - winW*0.4, winCY + winH*0.4);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  if (tod === 'afternoon') {
    ctx.save(); ctx.globalAlpha = 0.05;
    var glowRad = Math.max(winW, winH) * 1.2;
    var ag = ctx.createRadialGradient(winCX, winCY, glowRad*0.15, winCX, winCY, glowRad);
    ag.addColorStop(0, 'rgba(255,255,230,0.7)'); ag.addColorStop(1, 'rgba(255,255,230,0)');
    ctx.fillStyle = ag; ctx.fillRect(winCX-glowRad, winCY-glowRad, glowRad*2, glowRad*2); ctx.restore();
  }
  if (tod === 'evening') {
    ctx.save(); ctx.globalAlpha = 0.07;
    var sunRad = Math.max(winW, winH) * 1.5;
    var sg = ctx.createRadialGradient(winCX, winCY, sunRad*0.1, winCX, winCY, sunRad);
    sg.addColorStop(0, 'rgba(255,140,60,0.8)'); sg.addColorStop(0.5, 'rgba(200,100,120,0.3)'); sg.addColorStop(1, 'rgba(100,70,170,0)');
    ctx.fillStyle = sg; ctx.fillRect(winCX-sunRad, winCY-sunRad, sunRad*2, sunRad*2); ctx.restore();
  }
  // 3. Ambient light spots (evening & night)
  if (tod === 'evening' || tod === 'night') {
    var ceilX = VIEW_W/2, ceilY = scene.BACK_T + 20;
    var ceilR = (scene.BACK_R - scene.BACK_L) * 0.45;
    ctx.save(); ctx.globalAlpha = tod === 'night' ? 0.10 : 0.07;
    var cg = ctx.createRadialGradient(ceilX, ceilY, ceilR*0.05, ceilX, ceilY, ceilR);
    cg.addColorStop(0, 'rgba(255,230,170,0.9)'); cg.addColorStop(0.4, 'rgba(255,220,150,0.4)'); cg.addColorStop(1, 'rgba(255,210,130,0)');
    ctx.fillStyle = cg; ctx.fillRect(ceilX-ceilR, ceilY-ceilR*0.3, ceilR*2, ceilR*1.8); ctx.restore();
    var lampX = scene.BACK_R - (scene.BACK_R-scene.BACK_L)*0.15, lampY = scene.BACK_B + (VIEW_H-scene.BACK_B)*0.35;
    var lampR = (scene.BACK_R-scene.BACK_L)*0.22;
    ctx.save(); ctx.globalAlpha = tod === 'night' ? 0.08 : 0.05;
    var lg = ctx.createRadialGradient(lampX, lampY, lampR*0.05, lampX, lampY, lampR);
    lg.addColorStop(0, 'rgba(255,215,140,0.8)'); lg.addColorStop(0.5, 'rgba(255,200,120,0.3)'); lg.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lampX, lampY, lampR, 0, Math.PI*2); ctx.fill(); ctx.restore();
  }
  // 4. Night vignette
  if (tod === 'night') {
    ctx.save(); ctx.globalAlpha = 0.06;
    var vigR = Math.max(VIEW_W, VIEW_H) * 0.75;
    var vg = ctx.createRadialGradient(VIEW_W/2, VIEW_H/2, vigR*0.45, VIEW_W/2, VIEW_H/2, vigR);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,15,40,0.7)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.restore();
  }
  ctx.restore();
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

GameEngine.prototype._drawWinTransition = function(ctx) {
  var total = 1.5, elapsed = total - this.transTimer;
  var p = Math.min(1, elapsed / total);
  ctx.fillStyle = 'rgba(0,0,0,' + (p * 0.5) + ')';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  var stars = this._calcStars();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (var i = 0; i < 3; i++) {
    var starDelay = 0.2 + i * 0.3;
    var sp = Math.max(0, Math.min(1, (elapsed - starDelay) / 0.4));
    if (sp <= 0) continue;
    var scale = easeOutBack(sp);
    var sx = VIEW_W/2 - 50 + i * 50;
    var sy = VIEW_H * 0.42;
    ctx.save(); ctx.globalAlpha = sp;
    ctx.translate(sx, sy); ctx.scale(scale, scale);
    ctx.font = '44px sans-serif';
    ctx.fillText(i < stars ? '⭐' : '☆', 0, 0);
    ctx.restore();
  }
  if (elapsed > 0.8) {
    var tp = Math.min(1, (elapsed - 0.8) / 0.3);
    ctx.save(); ctx.globalAlpha = tp;
    ctx.font = 'bold 32px sans-serif'; ctx.fillStyle = '#ffd700';
    ctx.fillText('通关!', VIEW_W/2, VIEW_H * 0.55);
    ctx.restore();
  }
};

GameEngine.prototype._drawLoseTransition = function(ctx) {
  var total = 1.0, elapsed = total - this.transTimer;
  var p = Math.min(1, elapsed / total);
  var flashAlpha = p < 0.2 ? p / 0.2 * 0.3 : 0.3 * (1 - (p - 0.2) / 0.8);
  ctx.fillStyle = 'rgba(255,0,0,' + flashAlpha + ')';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(0,0,0,' + (p * 0.6) + ')';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (elapsed > 0.3) {
    var tp = Math.min(1, (elapsed - 0.3) / 0.4);
    var dropY = (1 - tp) * -30;
    ctx.save(); ctx.globalAlpha = tp;
    ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = '#ff5555';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', VIEW_W/2, VIEW_H * 0.45 + dropY);
    ctx.restore();
  }
};

GameEngine.prototype._drawEndScreen = function(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.70)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  var room = scene.ROOMS[this.currentRoomIdx];
  var isWin = this.state === 'win';
  var stars = this._calcStars();

  // ── 卡片容器 ──
  var cardW = 320, cardH = isWin ? 420 : 360;
  var cardX = (VIEW_W - cardW) / 2, cardY = (VIEW_H - cardH) / 2 - 10;

  // 卡片背景（深色磨砂 + 金色/红色边框）
  ctx.save();
  draw.roundRect(ctx, cardX, cardY, cardW, cardH, 20, 'rgba(20,18,35,0.95)');
  ctx.strokeStyle = isWin ? 'rgba(255,215,0,0.4)' : 'rgba(255,100,100,0.3)';
  ctx.lineWidth = 2;
  draw.roundRect(ctx, cardX, cardY, cardW, cardH, 20, null, ctx.strokeStyle);

  var cx = VIEW_W / 2;

  // ── 顶部装饰 ──
  ctx.font = '40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(isWin ? '🎉' : '😿', cx, cardY + 35);

  // 标题
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = isWin ? '#ffd700' : '#ff7777';
  ctx.fillText(isWin ? '全部找到!' : '游戏结束', cx, cardY + 70);

  // 分隔线
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cardX + 30, cardY + 90); ctx.lineTo(cardX + cardW - 30, cardY + 90); ctx.stroke();

  // ── 房间信息 ──
  ctx.font = '16px sans-serif'; ctx.fillStyle = '#bbb';
  ctx.fillText(room.emoji + ' ' + room.name, cx, cardY + 110);

  // ── 统计信息（两列布局）──
  var statY = cardY + 140;
  var leftX = cardX + cardW * 0.30, rightX = cardX + cardW * 0.70;

  // 找到数
  ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#ffd700';
  ctx.fillText(this.foundCount + '/' + this.catCount, leftX, statY);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#888';
  ctx.fillText('猫咪', leftX, statY + 18);

  // 用时
  var mins = Math.floor(this.playTime / 60);
  var secs = Math.floor(this.playTime % 60);
  var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#88ccff';
  ctx.fillText(timeStr, rightX, statY);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#888';
  ctx.fillText('用时', rightX, statY + 18);

  // 第二行统计
  var stat2Y = statY + 48;
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#ff8888';
  ctx.fillText(this.mistakes.toString(), leftX, stat2Y);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#888';
  ctx.fillText('失误', leftX, stat2Y + 16);

  // 最高连击
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = this.maxCombo >= 3 ? '#ffaa00' : '#88ddaa';
  ctx.fillText(this.maxCombo > 0 ? this.maxCombo + 'x' : '-', rightX, stat2Y);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#888';
  ctx.fillText('连击', rightX, stat2Y + 16);

  // ── 星级评价（仅胜利）──
  if (isWin) {
    var starY = stat2Y + 45;
    var t = Date.now() / 1000;
    ctx.font = '34px sans-serif';
    for (var si = 0; si < 3; si++) {
      var sx = cx - 40 + si * 40;
      var bounce = si < stars ? Math.sin(t * 3 + si * 0.5) * 3 : 0;
      ctx.fillText(si < stars ? '⭐' : '☆', sx, starY + bounce);
    }
    // 评语
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#ccc';
    var desc = stars === 3 ? '完美通关! 零失误!' : stars === 2 ? '很棒! 就差一点点' : '通关了! 再接再厉';
    ctx.fillText(desc, cx, starY + 28);
  }

  // ── 底部品牌 ──
  ctx.font = '10px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('变身躲猫猫 🐱', cx, cardY + cardH - 12);

  ctx.restore();

  // ── 按钮区域（卡片下方）──
  var btnStartY = cardY + cardH + 12;
  var btnW = 140, btnH = 38, btnGap = 10;

  // 重玩按钮
  draw.roundRect(ctx, cx - btnW - btnGap/2, btnStartY, btnW, btnH, 20, '#ffd700');
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#1a1a2e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('再来一局', cx - btnW/2 - btnGap/2, btnStartY + btnH/2);
  this.retryBtn = { x: cx - btnW - btnGap/2, y: btnStartY, w: btnW, h: btnH };

  // 右侧按钮：下一关 or 选关
  if (isWin && this.currentRoomIdx < scene.ROOMS.length - 1) {
    draw.roundRect(ctx, cx + btnGap/2, btnStartY, btnW, btnH, 20, '#66bbff');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('下一关', cx + btnW/2 + btnGap/2, btnStartY + btnH/2);
    this.nextLevelBtn = { x: cx + btnGap/2, y: btnStartY, w: btnW, h: btnH };

    // 选关按钮（下方）
    var btn3Y = btnStartY + btnH + 8;
    draw.roundRect(ctx, cx - 70, btn3Y, 140, 34, 18, 'rgba(255,255,255,0.12)');
    ctx.fillStyle = '#bbb'; ctx.font = '13px sans-serif';
    ctx.fillText('选择关卡', cx, btn3Y + 17);
    this.selectBtn = { x: cx - 70, y: btn3Y, w: 140, h: 34 };
  } else {
    this.nextLevelBtn = null;
    draw.roundRect(ctx, cx + btnGap/2, btnStartY, btnW, btnH, 20, 'rgba(255,255,255,0.12)');
    ctx.fillStyle = '#bbb';
    ctx.fillText('选择关卡', cx + btnW/2 + btnGap/2, btnStartY + btnH/2);
    this.selectBtn = { x: cx + btnGap/2, y: btnStartY, w: btnW, h: btnH };
  }

  // ── 分享按钮（仅胜利时显示）──
  if (isWin) {
    var shareY = this.currentRoomIdx < scene.ROOMS.length - 1 ? btnStartY + btnH + 50 : btnStartY + btnH + 12;
    var shareBtnW = 130, shareBtnH = 36;
    var shareBtnX = cx - shareBtnW / 2;
    var shareGrad = ctx.createLinearGradient(shareBtnX, shareY, shareBtnX, shareY + shareBtnH);
    shareGrad.addColorStop(0, '#43b581');
    shareGrad.addColorStop(1, '#2d8b5e');
    draw.roundRect(ctx, shareBtnX, shareY, shareBtnW, shareBtnH, 18, shareGrad);
    ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📤 分享成绩', cx, shareY + shareBtnH / 2);
    this.shareBtn = { x: shareBtnX, y: shareY, w: shareBtnW, h: shareBtnH };
  } else {
    this.shareBtn = null;
  }
};

// ==================== 分享成绩卡片 ====================

GameEngine.prototype._drawShareCard = function(ctx) {
  var room = scene.ROOMS[this.currentRoomIdx];
  var stars = this._calcStars();
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  var cardW = 340, cardH = 440;
  var cardX = (VIEW_W - cardW) / 2, cardY = (VIEW_H - cardH) / 2 - 40;
  ctx.save();
  ctx.shadowColor = 'rgba(255,180,50,0.3)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 4;
  var bgGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  bgGrad.addColorStop(0, '#2a1f3d'); bgGrad.addColorStop(0.4, '#1e1a30'); bgGrad.addColorStop(1, '#15132a');
  draw.roundRect(ctx, cardX, cardY, cardW, cardH, 20, bgGrad);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,215,0,0.5)'; ctx.lineWidth = 2;
  draw.roundRect(ctx, cardX, cardY, cardW, cardH, 20, null, ctx.strokeStyle);
  // 顶部金线
  var topGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
  topGrad.addColorStop(0, '#ffd700'); topGrad.addColorStop(0.5, '#ffaa33'); topGrad.addColorStop(1, '#ffd700');
  draw.roundRect(ctx, cardX + 20, cardY + 1, cardW - 40, 6, 3, topGrad);
  var cx = VIEW_W / 2;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // 标题
  ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#ffd700';
  ctx.fillText('🐱 变身躲猫猫', cx, cardY + 40);
  ctx.strokeStyle = 'rgba(255,215,0,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cardX + 30, cardY + 60); ctx.lineTo(cardX + cardW - 30, cardY + 60); ctx.stroke();
  // 关卡
  ctx.font = '16px sans-serif'; ctx.fillStyle = '#ccc';
  ctx.fillText(room.emoji + ' ' + room.name, cx, cardY + 82);
  // 星级
  var starY = cardY + 118;
  ctx.font = '40px sans-serif';
  var t = Date.now() / 1000;
  for (var i = 0; i < 3; i++) {
    var sx = cx - 48 + i * 48;
    var bounce = i < stars ? Math.sin(t * 2.5 + i * 0.7) * 3 : 0;
    ctx.fillStyle = '#fff';
    ctx.fillText(i < stars ? '⭐' : '☆', sx, starY + bounce);
  }
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#aaa';
  ctx.fillText(stars === 3 ? '🏆 完美通关!' : stars === 2 ? '✨ 出色表现!' : '💪 成功通关!', cx, starY + 32);
  // 数据面板
  var panelY = starY + 58;
  draw.roundRect(ctx, cardX + 20, panelY, cardW - 40, 110, 14, 'rgba(255,255,255,0.05)');
  var lx = cardX + cardW * 0.30, rx = cardX + cardW * 0.70;
  var row1Y = panelY + 28;
  ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#ffd700';
  ctx.fillText(this.foundCount + '/' + this.catCount, lx, row1Y);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#777'; ctx.fillText('🐱 猫咪', lx, row1Y + 20);
  var mins = Math.floor(this.playTime / 60); var secs = Math.floor(this.playTime % 60);
  var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#88ccff'; ctx.fillText(timeStr, rx, row1Y);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#777'; ctx.fillText('⏱ 用时', rx, row1Y + 20);
  var row2Y = row1Y + 52;
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#ff8888'; ctx.fillText(this.mistakes.toString(), lx, row2Y);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#777'; ctx.fillText('❌ 失误', lx, row2Y + 18);
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = this.maxCombo >= 3 ? '#ffaa00' : '#88ddaa';
  ctx.fillText(this.maxCombo > 0 ? this.maxCombo + 'x' : '-', rx, row2Y);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#777'; ctx.fillText('🔥 连击', rx, row2Y + 18);
  // 邀请文字
  ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#ffcc66';
  ctx.fillText('🏃 来挑战我吧!', cx, panelY + 138);
  ctx.font = '10px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('变身躲猫猫 © 2026', cx, cardY + cardH - 14);
  ctx.restore();
  // 底部按钮
  var btnY = cardY + cardH + 16;
  var btnW = 140, btnH = 40, gap = 14;
  var saveBtnX = cx - btnW - gap / 2;
  var saveGrad = ctx.createLinearGradient(saveBtnX, btnY, saveBtnX, btnY + btnH);
  saveGrad.addColorStop(0, '#43b581'); saveGrad.addColorStop(1, '#2d8b5e');
  draw.roundRect(ctx, saveBtnX, btnY, btnW, btnH, 20, saveGrad);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💾 保存图片', saveBtnX + btnW / 2, btnY + btnH / 2);
  this._shareCardSaveBtn = { x: saveBtnX, y: btnY, w: btnW, h: btnH };
  var backBtnX = cx + gap / 2;
  draw.roundRect(ctx, backBtnX, btnY, btnW, btnH, 20, 'rgba(255,255,255,0.12)');
  ctx.fillStyle = '#bbb';
  ctx.fillText('← 返回', backBtnX + btnW / 2, btnY + btnH / 2);
  this._shareCardBackBtn = { x: backBtnX, y: btnY, w: btnW, h: btnH };
};

GameEngine.prototype._saveShareCardAsImage = function() {
  var self = this;
  var canvas = this.ctx && this.ctx.canvas ? this.ctx.canvas : null;
  if (!canvas) return;

  // ── 小程序环境：使用 tt.canvasToTempFilePath + tt.saveImageToPhotosAlbum ──
  // if (typeof tt !== 'undefined' && tt.canvasToTempFilePath) {
  //   tt.canvasToTempFilePath({
  //     canvas: canvas,
  //     success: function(res) {
  //       tt.saveImageToPhotosAlbum({
  //         filePath: res.tempFilePath,
  //         success: function() {
  //           self.toast = '图片已保存到相册!'; self.toastTimer = 2.0;
  //         },
  //         fail: function() {
  //           self.toast = '保存失败，请截图分享'; self.toastTimer = 2.0;
  //         }
  //       });
  //     },
  //     fail: function() {
  //       self.toast = '保存失败，请截图分享'; self.toastTimer = 2.0;
  //     }
  //   });
  //   return;
  // }

  // ── 浏览器环境：toDataURL + download ──
  try {
    var room = scene.ROOMS[this.currentRoomIdx];
    var stars = this._calcStars();
    var dataURL = canvas.toDataURL('image/png');
    var link = document.createElement('a');
    link.download = '躲猫猫成绩_' + room.name + '_' + stars + '星.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    self.toast = '图片已保存!'; self.toastTimer = 2.0;
  } catch (e) {
    self.toast = '保存失败，请截图分享'; self.toastTimer = 2.0;
  }
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
  { id: 'observe', text: '观察房间，有东西在微微晃动...', sub: '', duration: 0, waitTap: false },
  { id: 'tap',     text: '点击它！', sub: '', duration: 0, waitTap: true },
  { id: 'found',   text: '太棒了！找到了！', sub: '继续找剩下的猫咪吧', duration: 2.0, waitTap: false },
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

  if (step.id === 'observe') {
    var cat = this.cats[0];
    if (cat && !cat.found) {
      cat.wobbleActive = true; cat.wobbleElapsed = (cat.wobbleElapsed + dt) % 1.0;
      cat.wobbleDuration = 999; cat.wobbleStrength = 5;
    }
    if (tut.timer >= 3.0) { tut.step++; tut.timer = 0; }
  }

  if (step.id === 'tap') {
    var cat = this.cats[0];
    if (cat && !cat.found) {
      cat.wobbleActive = true; cat.wobbleElapsed = (cat.wobbleElapsed + dt) % 1.0;
      cat.wobbleDuration = 999; cat.wobbleStrength = 5;
      tut.tapTarget = cat;
    } else {
      tut.step = 2; tut.timer = 0;
    }
  }

  if (step.id === 'found' && tut.timer >= step.duration) {
    this._saveTutorialDone();
    this.tutorial = null;
    var cat = this.cats[0];
    if (cat && !cat.found) {
      cat.wobbleActive = false;
      cat.wobbleTimer = catSystem.randRange(cat.personality.wobbleCooldown);
      cat.wobbleStrength = cat.personality.wobbleStrength * (scene.ROOMS[this.currentRoomIdx].wobbleStrengthMult || 1);
    }
  }
};

GameEngine.prototype._drawTutorial = function(ctx) {
  if (!this.tutorial) return;
  var tut = this.tutorial;
  var step = TUT_STEPS[tut.step];
  if (!step) return;
  var now = Date.now();

  ctx.save();

  // --- 背景遮罩 + 目标高亮 ---
  if (step.id === 'observe') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    var cat = this.cats[0];
    if (cat && !cat.found) {
      // 浮动手指指向猫
      var bobY = Math.sin(now / 350) * 8;
      ctx.save();
      ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(255,215,0,0.8)'; ctx.shadowBlur = 12;
      ctx.fillText('👆', cat.x + cat.w / 2, cat.y - 10 + bobY);
      ctx.restore();
    }
  } else if (step.id === 'tap' && tut.tapTarget) {
    var cat = tut.tapTarget;
    var tcx = cat.x + cat.w / 2, tcy = cat.y + cat.h / 2;
    var r = Math.max(cat.w, cat.h) * 0.65;
    // 暗遮罩挖出圆形
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.arc(tcx, tcy, r, 0, Math.PI * 2, true); ctx.fill();
    // 脉动高亮圈
    var pulse = Math.sin(now / 300) * 0.3 + 0.7;
    ctx.strokeStyle = 'rgba(255,215,0,' + pulse.toFixed(2) + ')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(tcx, tcy, r + 4, 0, Math.PI * 2); ctx.stroke();
    // 扩散圈
    var expand = (now % 1200) / 1200;
    ctx.strokeStyle = 'rgba(255,215,0,' + ((1 - expand) * 0.5).toFixed(2) + ')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(tcx, tcy, r + 4 + expand * 18, 0, Math.PI * 2); ctx.stroke();
    // 手指
    var bobY2 = Math.sin(now / 350) * 8;
    ctx.save();
    ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(255,215,0,0.8)'; ctx.shadowBlur = 12;
    ctx.fillText('👆', tcx, tcy + r + 10 + bobY2);
    ctx.restore();
  } else if (step.id === 'found') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // --- 分步气泡 ---
  var bubbleW = 380, bubbleH = step.sub ? 85 : 55;
  var bubbleX = VIEW_W / 2 - bubbleW / 2;
  var bubbleY = VIEW_H * 0.15;
  // 滑入动画
  var slideT = Math.min(tut.timer / 0.3, 1);
  bubbleY += (1 - slideT * slideT) * (-20);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
  draw.roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 16, 'rgba(20,20,30,0.9)');
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,215,0,0.6)'; ctx.lineWidth = 1.5;
  draw.roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 16, null, 'rgba(255,215,0,0.6)');
  // 步骤指示点
  var dotSpacing = 14, dotsW = (TUT_STEPS.length - 1) * dotSpacing;
  var dotStartX = VIEW_W / 2 - dotsW / 2, dotY = bubbleY + bubbleH - 12;
  for (var di = 0; di < TUT_STEPS.length; di++) {
    ctx.beginPath(); ctx.arc(dotStartX + di * dotSpacing, dotY, di === tut.step ? 3.5 : 2, 0, Math.PI * 2);
    ctx.fillStyle = di === tut.step ? '#ffd700' : 'rgba(255,255,255,0.3)'; ctx.fill();
  }
  // 主文字
  ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(step.text, VIEW_W / 2, step.sub ? bubbleY + 28 : bubbleY + bubbleH / 2);
  if (step.sub) { ctx.font = '14px sans-serif'; ctx.fillStyle = '#ddd'; ctx.fillText(step.sub, VIEW_W / 2, bubbleY + 55); }
  ctx.restore();

  // "点击继续"提示
  if (!step.waitTap && step.duration === 0) {
    var alpha = 0.4 + Math.sin(now / 500) * 0.3;
    ctx.globalAlpha = alpha;
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#aaa'; ctx.textAlign = 'center';
    ctx.fillText('点击任意处继续', VIEW_W / 2, bubbleY + bubbleH + 20);
    ctx.globalAlpha = 1;
  }

  // 跳过按钮
  var skipX = VIEW_W - 80, skipY = bubbleY - 30, skipW = 60, skipH = 28;
  ctx.globalAlpha = 0.6;
  draw.roundRect(ctx, skipX, skipY, skipW, skipH, 10, 'rgba(255,255,255,0.15)');
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#ccc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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

  if (tut.skipBtn) {
    var sb = tut.skipBtn;
    if (vx >= sb.x && vx <= sb.x + sb.w && vy >= sb.y && vy <= sb.y + sb.h) {
      this._saveTutorialDone();
      this.tutorial = null;
      var cat = this.cats[0];
      if (cat && !cat.found) {
        cat.wobbleActive = false;
        cat.wobbleTimer = catSystem.randRange(cat.personality.wobbleCooldown);
        cat.wobbleStrength = cat.personality.wobbleStrength * (scene.ROOMS[this.currentRoomIdx].wobbleStrengthMult || 1);
      }
      return true;
    }
  }

  if (step.waitTap) return false;
  if (step.duration > 0) return true;
  tut.step++; tut.timer = 0;
  return true;
};

// ========== 粒子 & 提示 ==========

GameEngine.prototype._spawnParticles = function(cx, cy, intensity) {
  if (intensity === undefined) intensity = 1.0;
  if (this.particles.length > 200) return;
  var symbols = ['⭐', '✨', '💛', '🐱', '❤️'];
  var confettiColors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6FC8', '#C084FC', '#F97316', '#22D3EE'];
  // Emoji particles
  var emojiCount = Math.round(12 * intensity);
  for (var i = 0; i < emojiCount; i++) {
    var angle = (i / emojiCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    var speed = (100 + Math.random() * 120) * intensity;
    var life = 0.8 + Math.random() * 0.6;
    this.particles.push({ type: 'emoji', x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60 * intensity,
      life: life, maxLife: life, alpha: 1, symbol: symbols[i % symbols.length], size: 10 + Math.random() * 8,
      rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 6 });
  }
  // Ring particles
  var ringCount = Math.round(3 * intensity);
  for (var r = 0; r < ringCount; r++) {
    var ringLife = 0.5 + Math.random() * 0.4;
    this.particles.push({ type: 'ring', x: cx, y: cy, vx: 0, vy: 0, life: ringLife, maxLife: ringLife,
      alpha: 1, radius: 4 + r * 6, growSpeed: (80 + Math.random() * 60) * intensity, lineWidth: 2.5 - r * 0.5 });
  }
  // Confetti particles
  var confettiCount = Math.round(8 * intensity);
  for (var c = 0; c < confettiCount; c++) {
    var cAngle = (c / confettiCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    var cSpeed = (60 + Math.random() * 100) * intensity;
    var cLife = 1.0 + Math.random() * 0.8;
    this.particles.push({ type: 'confetti', x: cx + (Math.random()-0.5)*10, y: cy + (Math.random()-0.5)*10,
      vx: Math.cos(cAngle) * cSpeed, vy: Math.sin(cAngle) * cSpeed - 40 * intensity,
      life: cLife, maxLife: cLife, alpha: 1, rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 12, color: confettiColors[c % confettiColors.length] });
  }
  // Trail particles
  var trailCount = Math.round(6 * intensity);
  for (var t = 0; t < trailCount; t++) {
    var tAngle = Math.random() * Math.PI * 2;
    var tSpeed = (40 + Math.random() * 60) * intensity;
    var tLife = 0.3 + Math.random() * 0.3;
    this.particles.push({ type: 'trail', x: cx + (Math.random()-0.5)*16, y: cy + (Math.random()-0.5)*16,
      vx: Math.cos(tAngle) * tSpeed, vy: Math.sin(tAngle) * tSpeed - 20,
      life: tLife, maxLife: tLife, alpha: 0.7, symbol: symbols[Math.floor(Math.random() * symbols.length)], size: 6 + Math.random() * 4 });
  }
  this.screenFlash = 0.15;
};

GameEngine.prototype._drawParticles = function(ctx) {
  // Screen flash overlay
  if (this.screenFlash && this.screenFlash > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(this.screenFlash / 0.15, 1.0) * 0.45;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }
  if (!this.particles.length) return;
  for (var i = 0; i < this.particles.length; i++) {
    var p = this.particles[i];
    ctx.save();
    if (p.type === 'emoji') {
      ctx.globalAlpha = p.alpha * 0.9; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.font = Math.round(p.size) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.symbol, 0, 0);
    } else if (p.type === 'ring') {
      ctx.globalAlpha = p.alpha * 0.7; ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = p.lineWidth * (p.life / p.maxLife);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.stroke();
    } else if (p.type === 'confetti') {
      ctx.globalAlpha = p.alpha * 0.85; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-2.5, -1.5, 5, 3);
    } else if (p.type === 'trail') {
      ctx.globalAlpha = p.alpha * 0.6;
      ctx.font = Math.round(p.size) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.symbol, p.x, p.y);
    }
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
  this._lastTouchY = vy;
};

GameEngine.prototype.handleTouchMove = function(x, y) {
  var vx = x / this.scale;
  var vy = y / this.scale;
  var dx = vx - this._touchStartX;
  var dy = vy - this._touchStartY;
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this._isDragging = true;

  // 子面板滚动
  if (this.subScreen === 'codex' || this.subScreen === 'achieve') {
    var prevY = this._lastTouchY || vy;
    var delta = prevY - vy;
    if (this.subScreen === 'codex') {
      this.codexScrollY = Math.max(0, Math.min(this.codexMaxScroll || 0, (this.codexScrollY || 0) + delta));
    } else {
      this.achieveScrollY = Math.max(0, Math.min(this.achieveMaxScroll || 0, (this.achieveScrollY || 0) + delta));
    }
  }
  this._lastTouchY = vy;
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
  // 分享卡片画面
  if (this.subScreen === 'share_card') {
    if (this._shareCardSaveBtn) {
      var svb = this._shareCardSaveBtn;
      if (vx >= svb.x && vx <= svb.x+svb.w && vy >= svb.y && vy <= svb.y+svb.h) {
        SFX.tap(); this._saveShareCardAsImage(); return;
      }
    }
    if (this._shareCardBackBtn) {
      var bkb = this._shareCardBackBtn;
      if (vx >= bkb.x && vx <= bkb.x+bkb.w && vy >= bkb.y && vy <= bkb.y+bkb.h) {
        SFX.tap(); this.subScreen = null; return;
      }
    }
    return;
  }

  // 关卡选择画面
  if (this.state === 'ready') {
    this._handleLevelSelectTap(vx, vy);
    return;
  }

  // 新手引导拦截（返回 true = 引导消费了这次点击）
  if (this.tutorial && this._handleTutorialTap(vx, vy)) return;

  // 结算画面按钮
  if (this.state === 'win' || this.state === 'lose') {
    if (this.retryBtn) {
      var b = this.retryBtn;
      if (vx >= b.x && vx <= b.x+b.w && vy >= b.y && vy <= b.y+b.h) {
        SFX.tap(); this.startGame(); return;
      }
    }
    if (this.nextLevelBtn) {
      var nb = this.nextLevelBtn;
      if (vx >= nb.x && vx <= nb.x+nb.w && vy >= nb.y && vy <= nb.y+nb.h) {
        SFX.tap(); this.startGame(this.currentRoomIdx + 1); return;
      }
    }
    if (this.selectBtn) {
      var sb = this.selectBtn;
      if (vx >= sb.x && vx <= sb.x+sb.w && vy >= sb.y && vy <= sb.y+sb.h) {
        SFX.tap(); this._showLevelSelect();
        return;
      }
    }
    // 分享按钮
    if (this.shareBtn) {
      var shb = this.shareBtn;
      if (vx >= shb.x && vx <= shb.x+shb.w && vy >= shb.y && vy <= shb.y+shb.h) {
        SFX.tap(); this.subScreen = 'share_card'; return;
      }
    }
    return;
  }

  // 暂停菜单按钮
  if (this.paused) {
    if (this.pauseResumeBtn) {
      var pr = this.pauseResumeBtn;
      if (vx >= pr.x && vx <= pr.x+pr.w && vy >= pr.y && vy <= pr.y+pr.h) {
        SFX.tap(); this.paused = false; SFX.startAmbient(scene.ROOMS[this.currentRoomIdx].id); return;
      }
    }
    if (this.pauseRetryBtn) {
      var pt = this.pauseRetryBtn;
      if (vx >= pt.x && vx <= pt.x+pt.w && vy >= pt.y && vy <= pt.y+pt.h) {
        SFX.tap(); this.paused = false; this.startGame(); return;
      }
    }
    if (this.pauseSelectBtn) {
      var ps = this.pauseSelectBtn;
      if (vx >= ps.x && vx <= ps.x+ps.w && vy >= ps.y && vy <= ps.y+ps.h) {
        SFX.tap(); this.paused = false;
        this._showLevelSelect();
        return;
      }
    }
    return;
  }

  // 暂停按钮（游戏中）
  if (this.pauseBtn && this.state === 'playing') {
    var pb = this.pauseBtn;
    if (vx >= pb.x && vx <= pb.x+pb.w && vy >= pb.y && vy <= pb.y+pb.h) {
      SFX.tap(); this.paused = true; SFX.stopAmbient(); return;
    }
  }

  // 音量按钮（任何游戏状态都可用）
  if (this.muteBtn) {
    var mb = this.muteBtn;
    if (vx >= mb.x && vx <= mb.x+mb.w && vy >= mb.y && vy <= mb.y+mb.h) {
      SFX.toggleMute(); return;
    }
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
    this.animTimer = 2.0;
    this.state = 'found_anim';
    this.toast = '找到了【' + hit.catRef.personality.name + '】!';
    this.toastTimer = 2.0;
    this._lastFoundTime = 0;
    this.hintTimer = 0; this.hintCat = null;
    // 生成庆祝粒子
    SFX.catFound();
    this._spawnParticles(hit.catRef.x + hit.catRef.w/2, hit.catRef.y + hit.catRef.h/2);
    // 引导模式：找到第一只猫后进入 found 步骤
    if (this.tutorial && this.tutorial.step <= 1) {
      this.tutorial.step = 2; this.tutorial.timer = 0;
    }
    // 图鉴收录
    var isNewCodex = codexMod.record(hit.catRef.disguiseId);
    if (isNewCodex) {
      this.toast = '\uD83D\uDCD6 新图鉴! 找到了【' + hit.catRef.personality.name + '】!';
    }
    // 连击系统
    this.combo++;
    this.comboTimer = this.comboWindow;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    if (this.combo >= 2) {
      this.comboPopup = { count: this.combo, timer: 1.5, x: hit.catRef.x + hit.catRef.w/2, y: hit.catRef.y - 10 };
      if (this.combo >= 3) {
        this._spawnParticles(hit.catRef.x + hit.catRef.w/2, hit.catRef.y + hit.catRef.h/2, 1.5);
        this.shakeTimer = 0.15;
      }
      if (this.combo >= 4) { this._unlockAchievement('combo_king'); }
    }
    // 成就：初次接触 + 累计猫数
    this.totalCatsFound++;
    this._unlockAchievement('first_cat');
    if (this.totalCatsFound >= 30) this._unlockAchievement('cat_master');
  } else {
    // 引导模式 tap 步骤：点错不扣血，提示重试
    if (this.tutorial && this.tutorial.step === 1) {
      this.toast = '不是这个哦，找晃动的那个！';
      this.toastTimer = 1.0;
      return;
    }
    this.combo = 0; this.comboTimer = 0;
    this.lives--;
    this.mistakes++;
    SFX.wrong();
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
      SFX.toolUse();
      this.toast = '点击房间中任意位置使用激光笔'; this.toastTimer = 1.5;
    }
  } else if (type === 'catnip') {
    if (this.catnipCooldown > 0 || this.catnipActive) {
      this.toast = '猫薄荷冷却中...'; this.toastTimer = 0.8;
      return;
    }
    this.catnipActive = true;
    this._usedCatnip = true;
    SFX.toolUse();
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
