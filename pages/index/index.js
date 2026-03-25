var scene = require('../../utils/scene');
var GameEngine = require('../../utils/game-engine');
var codexMod = require('../../utils/codex');

Page({
  data: {
    rooms: [],
    achievements: [],
    achieveCount: 0,
    showAchievements: false,
    showCodex: false,
    codexRooms: [],
    codexFound: 0,
    codexTotal: 0,
    codexPct: 0,
  },

  onLoad: function() {
    this._buildRoomList();
    this._buildAchievements();
    this._buildCodex();
  },

  onShow: function() {
    this._buildRoomList();
    this._buildAchievements();
    this._buildCodex();
  },

  _buildRoomList: function() {
    var progress = this._loadProgress();
    var rooms = [];
    for (var i = 0; i < scene.ROOMS.length; i++) {
      var r = scene.ROOMS[i];
      var p = progress[r.id] || {};
      var unlocked = i === 0 || p.unlocked;
      var stars = p.stars || 0;
      rooms.push({
        idx: i,
        name: r.name,
        emoji: r.emoji,
        desc: r.desc,
        catCount: r.catCount,
        lives: r.lives,
        unlocked: unlocked,
        stars: stars,
      });
    }
    this.setData({ rooms: rooms });
  },

  _buildAchievements: function() {
    var unlocked = this._loadAchievements();
    var list = [];
    var count = 0;
    for (var i = 0; i < GameEngine.ACHIEVEMENTS.length; i++) {
      var a = GameEngine.ACHIEVEMENTS[i];
      var done = !!unlocked[a.id];
      if (done) count++;
      list.push({
        id: a.id,
        name: a.name,
        icon: a.icon,
        desc: a.desc,
        done: done,
      });
    }
    this.setData({ achievements: list, achieveCount: count });
  },

  _loadProgress: function() {
    try {
      var data = tt.getStorageSync('catHideProgress');
      return data ? JSON.parse(data) : {};
    } catch(e) {
      return {};
    }
  },

  _loadAchievements: function() {
    try {
      var data = tt.getStorageSync('catHideAchieve');
      return data ? JSON.parse(data).unlocked || {} : {};
    } catch(e) {
      return {};
    }
  },

  onSelectRoom: function(e) {
    var idx = e.currentTarget.dataset.idx;
    var room = this.data.rooms[idx];
    if (!room || !room.unlocked) {
      tt.showToast({ title: '通关上一关解锁', icon: 'none' });
      return;
    }
    tt.navigateTo({
      url: '/pages/game/game?roomIdx=' + idx
    });
  },

  onToggleAchievements: function() {
    this.setData({ showAchievements: !this.data.showAchievements });
  },

  _buildCodex: function() {
    var data = codexMod.getData();
    var cc = codexMod.getCount();
    var rooms = [];
    codexMod.CODEX_ROOMS.forEach(function(room) {
      var items = [];
      var roomFound = 0;
      room.disguises.forEach(function(d) {
        var found = !!data[d.id];
        if (found) roomFound++;
        items.push({ id: d.id, name: d.name, found: found });
      });
      rooms.push({
        id: room.id, name: room.name, emoji: room.emoji,
        items: items, found: roomFound, total: room.disguises.length,
      });
    });
    var pct = cc.total > 0 ? Math.round(cc.found / cc.total * 100) : 0;
    this.setData({
      codexRooms: rooms, codexFound: cc.found,
      codexTotal: cc.total, codexPct: pct,
    });
  },

  onToggleCodex: function() {
    this.setData({ showCodex: !this.data.showCodex });
  },
});
