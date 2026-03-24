var scene = require('../../utils/scene');
var GameEngine = require('../../utils/game-engine');

Page({
  data: {
    rooms: [],
    achievements: [],
    achieveCount: 0,
    showAchievements: false,
  },

  onLoad: function() {
    this._buildRoomList();
    this._buildAchievements();
  },

  onShow: function() {
    this._buildRoomList();
    this._buildAchievements();
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
});
