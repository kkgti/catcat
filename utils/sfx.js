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

// ==================== 环境音效系统 ====================
var audioCtx = null;
var activeTimers = [];
var activeNodes = [];
var ambientRunning = false;

function ctx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return audioCtx;
}

// 时钟滴答：客厅 / 书房
function startClock() {
  var id = setInterval(function() {
    if (muted) return;
    var c = ctx(); if (!c) return;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.03, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.04);
  }, 1000);
  activeTimers.push(id);
}

// 鱼缸气泡：客厅
function startBubbles() {
  function playBubble() {
    if (!ambientRunning) return;
    if (!muted) {
      var c = ctx();
      if (c) {
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'sine';
        var baseFreq = 600 + Math.random() * 400;
        osc.frequency.setValueAtTime(baseFreq, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, c.currentTime + 0.08);
        gain.gain.setValueAtTime(0.025, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.1);
      }
    }
    var delay = 800 + Math.random() * 2200;
    var tid = setTimeout(playBubble, delay);
    activeTimers.push(tid);
  }
  var tid = setTimeout(playBubble, 500 + Math.random() * 1500);
  activeTimers.push(tid);
}

// 风声：卧室（低频白噪声）
function startWind() {
  var c = ctx(); if (!c) return;
  var bufferSize = c.sampleRate * 2;
  var buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
  var noise = c.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  var filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 0.7;
  var gain = c.createGain();
  gain.gain.value = muted ? 0 : 0.04;
  noise.connect(filter); filter.connect(gain); gain.connect(c.destination);
  noise.start();
  activeNodes.push({ source: noise, gain: gain });
  var id = setInterval(function() {
    gain.gain.value = muted ? 0 : 0.04;
  }, 300);
  activeTimers.push(id);
}

// 水滴声：厨房 / 浴室
function startDrips() {
  function playDrip() {
    if (!ambientRunning) return;
    if (!muted) {
      var c = ctx();
      if (c) {
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'sine';
        var freq = 1200 + Math.random() * 800;
        osc.frequency.setValueAtTime(freq, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, c.currentTime + 0.12);
        gain.gain.setValueAtTime(0.035, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.15);
      }
    }
    var delay = 1500 + Math.random() * 4000;
    var tid = setTimeout(playDrip, delay);
    activeTimers.push(tid);
  }
  var tid = setTimeout(playDrip, 300 + Math.random() * 2000);
  activeTimers.push(tid);
}

function stopAmbient() {
  ambientRunning = false;
  for (var i = 0; i < activeTimers.length; i++) {
    clearInterval(activeTimers[i]); clearTimeout(activeTimers[i]);
  }
  activeTimers = [];
  for (var j = 0; j < activeNodes.length; j++) {
    try { activeNodes[j].source.stop(); } catch(e) {}
  }
  activeNodes = [];
}

function startAmbient(roomId) {
  stopAmbient();
  ambientRunning = true;
  switch (roomId) {
    case 'livingroom': startClock(); startBubbles(); break;
    case 'kitchen': startDrips(); break;
    case 'bedroom': startWind(); break;
    case 'bathroom': startDrips(); break;
    case 'study': startClock(); break;
  }
}

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
  startAmbient: startAmbient,
  stopAmbient: stopAmbient,
};
