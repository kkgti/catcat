/**
 * 音效系统（小程序版）
 * 接口与 preview.html 的 SFX 模块完全一致
 *
 * 目前为桩实现 —— 方法存在但不发声。
 * 后续可替换为 tt.createInnerAudioContext() + 真实音频文件。
 */

var muted = false;

// TODO: 当有音频文件时，改为 tt.createInnerAudioContext() 播放
function noop() {}

module.exports = {
  catFound: noop,
  wrong: noop,
  win: noop,
  lose: noop,
  tap: noop,
  achieve: noop,
  tick: noop,
  toolUse: noop,
  toggleMute: function() { muted = !muted; return muted; },
  isMuted: function() { return muted; },
};
