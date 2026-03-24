var scene = require('../../utils/scene');

Page({
  data: {
    rooms: [],
  },

  onLoad: function() {
    this._buildRoomList();
  },

  onShow: function() {
    // 每次返回首页时刷新进度（从游戏页返回时）
    this._buildRoomList();
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

  _loadProgress: function() {
    try {
      var data = tt.getStorageSync('catHideProgress');
      return data ? JSON.parse(data) : {};
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
});
