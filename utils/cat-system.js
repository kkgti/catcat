/**
 * 猫系统 —— 性格、语录、放置逻辑
 * 同步自 preview.html
 */
var scene = require('./scene');

var QUOTES = [
  '你怎么发现我的！不可能！', '再给我5分钟好不好...',
  '我变成拖鞋的时候脚好臭...', '你是不是开挂了？',
  '我明明变得很像的！', '哼，下次我藏得更好！',
  '被你找到了，好丢猫的脸...', '我还以为我已经融入环境了',
  '说好的猫生自由呢？', '你盯着我看好久了对不对',
  '别碰我！我是一本正经的书！', '猫猫我啊，最讨厌被找到了',
  '你能假装没看见我吗...', '又被抓了，今天第几次了？',
  '喵呜... 我认输了...', '我只是在这里午睡而已！',
];

var CAT_PERSONALITIES = [
  {
    id: 'active', name: '好动猫', desc: '坐不住，频繁穿帮',
    wobbleCooldown: [2, 4], wobbleDuration: [0.5, 0.8], wobbleStrength: 4,
    tailCooldown: [4, 8], tailDuration: [1.2, 2.0],
    bubbleCooldown: [5, 10], bubbleDuration: [1.5, 2.5],
    bubbleTexts: ['喵~', '喵呜!', '好无聊~', '嘿嘿'],
    eyeCooldown: [6, 12], eyeDuration: [0.8, 1.5],
    breathe: true, color: '#ff9944',
  },
  {
    id: 'quiet', name: '安静猫', desc: '很少动，耐心观察才能发现',
    wobbleCooldown: [8, 15], wobbleDuration: [0.2, 0.4], wobbleStrength: 2,
    tailCooldown: [12, 22], tailDuration: [0.6, 1.0],
    bubbleCooldown: [15, 25], bubbleDuration: [1.0, 1.5],
    bubbleTexts: ['zzZ', '...', '💤'],
    eyeCooldown: [10, 18], eyeDuration: [0.5, 0.8],
    breathe: true, color: '#aaaaaa',
  },
  {
    id: 'sneaky', name: '狡猾猫', desc: '穿帮很少，但会制造假线索',
    wobbleCooldown: [6, 12], wobbleDuration: [0.3, 0.5], wobbleStrength: 2.5,
    tailCooldown: [10, 18], tailDuration: [0.5, 0.8],
    bubbleCooldown: [12, 20], bubbleDuration: [1.0, 1.5],
    bubbleTexts: ['...嘻嘻', '🤫'],
    eyeCooldown: [8, 14], eyeDuration: [0.4, 0.7],
    breathe: false, color: '#886644',
    fakeWobble: true,
  },
  {
    id: 'tsundere', name: '傲娇猫', desc: '忍不住嘲讽你，话很多',
    wobbleCooldown: [4, 8], wobbleDuration: [0.3, 0.6], wobbleStrength: 3,
    tailCooldown: [6, 12], tailDuration: [1.0, 1.8],
    bubbleCooldown: [4, 8], bubbleDuration: [2.0, 3.0],
    bubbleTexts: ['你找不到我的~', '笨蛋!', '哼!', '看这边啦~', '我才不会动呢', '无聊...'],
    eyeCooldown: [5, 10], eyeDuration: [0.8, 1.2],
    breathe: true, color: '#ffcc66',
  },
];

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length-1; i > 0; i--) {
    var j = Math.floor(Math.random()*(i+1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function randRange(arr) {
  return arr[0] + Math.random() * (arr[1] - arr[0]);
}

function pickQuote(used) {
  var avail = QUOTES.filter(function(q){ return used.indexOf(q)===-1; });
  if (!avail.length) avail = QUOTES;
  var q = avail[Math.floor(Math.random()*avail.length)];
  used.push(q);
  return q;
}

// 重叠检测
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return !(ax + aw <= bx || bx + bw <= ax || ay + ah <= by || by + bh <= ay);
}

function hasOverlap(ix, iy, sw, sh, placed) {
  for (var j = 0; j < placed.length; j++) {
    var p = placed[j];
    if (rectsOverlap(ix, iy, sw, sh, p.x, p.y, p.w, p.h)) return true;
  }
  return false;
}

/**
 * 放置物品
 * @param {Array} templates - 物品模板数组
 * @param {Array} existing - 已放置物品（用于重叠检测）
 * @param {string} roomId - 房间ID
 * @returns {Array} 已放置的物品数组
 */
function placeItems(templates, existing, roomId) {
  var placed = existing ? existing.slice() : [];
  var result = [];
  var layout = scene.ROOM_LAYOUTS[roomId] || {};
  var extras = scene.ROOM_LAYOUTS[roomId + '_extra'] || [];

  for (var i = 0; i < templates.length; i++) {
    var tmpl = templates[i];
    var candidates = [];

    // 1. 固定布局位置
    var pos = layout[tmpl.id];
    if (pos) {
      candidates.push({
        bx: pos.x + (Math.random() - 0.5) * 12,
        by: pos.y + (Math.random() - 0.5) * 8,
        dp: pos.depth || pos.y
      });
    }

    // 2. 备用位置（打乱）
    var shuffledExtras = shuffle(extras);
    for (var ei = 0; ei < shuffledExtras.length; ei++) {
      candidates.push({
        bx: shuffledExtras[ei].x + (Math.random() - 0.5) * 20,
        by: shuffledExtras[ei].y + (Math.random() - 0.5) * 15,
        dp: shuffledExtras[ei].y
      });
    }

    // 3. 随机后备
    for (var ri = 0; ri < 8; ri++) {
      var rbx = 100 + Math.random() * 550;
      var rby = scene.BACK_B + 60 + Math.random() * 240;
      candidates.push({ bx: rbx, by: rby, dp: rby });
    }

    // 逐个尝试，选第一个不重叠的
    var chosen = null;
    for (var ci = 0; ci < candidates.length; ci++) {
      var c = candidates[ci];
      var scale = (tmpl.zone === 'wall_decor') ? scene.ITEM_SCALE : scene.getItemScale(c.by);
      var sw = tmpl.w * scale;
      var sh = tmpl.h * scale;
      var ix = c.bx - sw / 2;
      var iy = c.by - sh;
      ix = Math.max(4, Math.min(scene.VIEW_W - sw - 4, ix));
      iy = Math.max(4, Math.min(scene.VIEW_H - sh - 4, iy));

      if (!hasOverlap(ix, iy, sw, sh, placed)) {
        chosen = { ix:ix, iy:iy, bx:ix+sw/2, by:iy+sh, sw:sw, sh:sh, dp:c.dp, scale:scale };
        break;
      }
    }

    // 兜底
    if (!chosen) {
      var c = candidates[0];
      var scale = (tmpl.zone === 'wall_decor') ? scene.ITEM_SCALE : scene.getItemScale(c.by);
      var sw = tmpl.w * scale;
      var sh = tmpl.h * scale;
      var ix = Math.max(4, Math.min(scene.VIEW_W - sw - 4, c.bx - sw/2));
      var iy = Math.max(4, Math.min(scene.VIEW_H - sh - 4, c.by - sh));
      chosen = { ix:ix, iy:iy, bx:ix+sw/2, by:iy+sh, sw:sw, sh:sh, dp:c.dp, scale:scale };
    }

    var item = {
      id:tmpl.id, name:tmpl.name, zone:tmpl.zone, draw:tmpl.draw,
      origW:tmpl.w, origH:tmpl.h, scale:chosen.scale,
      x:chosen.ix, y:chosen.iy, w:chosen.sw, h:chosen.sh,
      baseX:chosen.bx, baseY:chosen.by, depth:chosen.dp
    };
    placed.push(item);
    result.push(item);
  }
  return result;
}

module.exports = {
  QUOTES: QUOTES,
  CAT_PERSONALITIES: CAT_PERSONALITIES,
  shuffle: shuffle,
  randRange: randRange,
  pickQuote: pickQuote,
  placeItems: placeItems,
};
