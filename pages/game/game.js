var GameEngine = require('../../utils/game-engine');

Page({
  data: {},

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
        self.engine.onGameEnd = function(result) {
          console.log('游戏结束', result);
        };
        self.engine.startGame();
      });
  },

  onTouchStart: function(e) {
    if (!this.engine) return;
    var touch = e.touches[0];
    // 抖音小程序 touch 坐标就是相对 Canvas 的坐标
    this.engine.handleTap(touch.x, touch.y);
  },

  onUnload: function() {
    if (this.engine) {
      this.engine.stop();
    }
  },
});
