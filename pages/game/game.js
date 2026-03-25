var GameEngine = require('../../utils/game-engine');

Page({
  data: {},

  onLoad: function(options) {
    // 从 URL 参数获取关卡索引，默认第一关
    var idx = parseInt(options.roomIdx, 10);
    this.roomIdx = isNaN(idx) ? 0 : idx;
  },

  onReady: function() {
    this.engine = new GameEngine();
    this._initCanvas();
  },

  _initCanvas: function() {
    var self = this;
    var query = tt.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec(function(res) {
        if (!res || !res[0]) {
          console.error('Canvas 获取失败');
          return;
        }

        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = tt.getSystemInfoSync().pixelRatio || 2;
        var width = res[0].width;
        var height = res[0].height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        self.canvas = canvas;
        self.canvasWidth = width;
        self.canvasHeight = height;
        self.dpr = dpr;

        // 将 requestAnimationFrame 挂到 ctx 上供引擎使用
        ctx.requestAnimationFrame = canvas.requestAnimationFrame.bind(canvas);
        ctx.cancelAnimationFrame = canvas.cancelAnimationFrame
          ? canvas.cancelAnimationFrame.bind(canvas)
          : null;

        self.engine.init(ctx, width, height, dpr);

        // 返回关卡选择回调
        self.engine.onShowLevelSelect = function() {
          tt.navigateBack();
        };

        // 游戏结束回调
        self.engine.onGameEnd = function(result) {
          console.log('游戏结束', result);
        };

        // 启动指定关卡
        self.engine.startGame(self.roomIdx);
      });
  },

  onTouchStart: function(e) {
    if (!this.engine) return;
    var touch = e.touches[0];
    this.engine.handleTouchStart(touch.x, touch.y);
  },

  onTouchMove: function(e) {
    if (!this.engine) return;
    var touch = e.touches[0];
    this.engine.handleTouchMove(touch.x, touch.y);
  },

  onTouchEnd: function(e) {
    if (!this.engine) return;
    // touchend 时 touches 为空，用 changedTouches
    var touch = e.changedTouches && e.changedTouches[0];
    if (!touch) return;
    this.engine.handleTouchEnd(touch.x, touch.y);
  },

  onUnload: function() {
    if (this.engine) {
      this.engine.stop();
    }
  },
});
