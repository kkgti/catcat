/**
 * 猫系统（阶段1：基础版）
 * - 随机选择物品位置伪装
 * - 混合模式：部分"替换"原有物品，部分"多出"新物品
 * - 被找到时显示猫 + 台词
 */
var scene = require('./scene');

// 搞笑台词库
var QUOTES = [
  '我在这个花瓶里住了3天了...',
  '你怎么发现我的！不可能！',
  '这个沙发真的很舒服...',
  '再给我5分钟好不好...',
  '我变成拖鞋的时候脚好臭...',
  '你是不是开挂了？',
  '我明明变得很像的！',
  '哼，下次我藏得更好！',
  '被你找到了，好丢猫的脸...',
  '我还以为我已经融入环境了',
  '说好的猫生自由呢？',
  '你盯着我看好久了对不对',
  '我已经是一个成熟的杯子了',
  '别碰我！我是一本正经的书！',
  '猫猫我啊，最讨厌被找到了',
  '你能假装没看见我吗...',
  '我只是在这里午睡而已！',
  '又被抓了，今天第几次了？',
  '我的伪装术还需要修炼...',
  '喵呜... 我认输了...',
];

/**
 * 生成一局游戏的猫数据
 * @param {number} catCount 猫的数量
 * @returns {object} { cats: [...], allItems: [...] }
 *   cats: 每只猫的数据 { id, type, x, y, w, h, drawFn, quote, color, found }
 *   allItems: 包含原有物品和猫伪装物品的完整列表（用于渲染）
 */
function generateCats(catCount) {
  catCount = catCount || 4;

  // 决定多少只猫用"替换"模式，多少用"多出"模式
  var replaceCount = Math.ceil(catCount / 2);  // 一半替换
  var extraCount = catCount - replaceCount;     // 一半多出

  var cats = [];
  var usedQuotes = [];
  var usedItemIds = [];
  var usedSlots = [];

  // 可被替换的物品（排除地毯等大件和不适合替换的）
  var replaceableItems = scene.ITEMS.filter(function(item) {
    return ['rug', 'sofa', 'tv', 'table'].indexOf(item.id) === -1;
  });

  // 随机打乱
  replaceableItems = shuffle(replaceableItems);

  // 生成"替换"类型的猫
  for (var i = 0; i < replaceCount && i < replaceableItems.length; i++) {
    var item = replaceableItems[i];
    usedItemIds.push(item.id);
    cats.push({
      id: 'cat_replace_' + i,
      type: 'replace',
      originalItemId: item.id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      drawFn: createReplaceDraw(item),
      quote: pickQuote(usedQuotes),
      color: scene.CAT_COLORS[i % scene.CAT_COLORS.length],
      found: false,
      foundAnim: 0,
    });
  }

  // 生成"多出"类型的猫
  var availableSlots = shuffle(scene.EMPTY_SLOTS.slice());
  var templates = shuffle(scene.EXTRA_ITEM_TEMPLATES.slice());

  for (var j = 0; j < extraCount && j < availableSlots.length; j++) {
    var slot = availableSlots[j];
    var tmpl = templates[j % templates.length];
    usedSlots.push(slot);
    cats.push({
      id: 'cat_extra_' + j,
      type: 'extra',
      x: slot.x,
      y: slot.y,
      w: tmpl.w,
      h: tmpl.h,
      drawFn: tmpl.draw,
      quote: pickQuote(usedQuotes),
      color: scene.CAT_COLORS[(replaceCount + j) % scene.CAT_COLORS.length],
      found: false,
      foundAnim: 0,
    });
  }

  // 构建完整物品列表（原有物品去掉被替换的 + 猫伪装物品）
  var allItems = [];

  // 添加未被替换的原有物品
  scene.ITEMS.forEach(function(item) {
    if (usedItemIds.indexOf(item.id) === -1) {
      allItems.push({
        id: item.id,
        name: item.name,
        x: item.x, y: item.y, w: item.w, h: item.h,
        drawFn: item.draw,
        isCat: false,
      });
    }
  });

  // 添加猫（伪装成物品）
  cats.forEach(function(cat) {
    allItems.push({
      id: cat.id,
      name: '猫',
      x: cat.x, y: cat.y, w: cat.w, h: cat.h,
      drawFn: cat.drawFn,
      isCat: true,
      catRef: cat,
    });
  });

  return { cats: cats, allItems: allItems, replacedIds: usedItemIds };
}

/**
 * 创建"替换"物品的绘制函数（和原物品相似但有微小差异）
 */
function createReplaceDraw(originalItem) {
  return function(ctx, x, y, w, h) {
    // 先画原物品
    originalItem.draw(ctx, x, y, w, h);
    // 微小差异：稍微偏移或颜色偏差（通过叠加半透明色）
    ctx.fillStyle = 'rgba(255, 200, 100, 0.06)';
    ctx.fillRect(x, y, w, h);
  };
}

function pickQuote(usedList) {
  var available = QUOTES.filter(function(q) {
    return usedList.indexOf(q) === -1;
  });
  if (available.length === 0) available = QUOTES;
  var q = available[Math.floor(Math.random() * available.length)];
  usedList.push(q);
  return q;
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

module.exports = {
  generateCats: generateCats,
  QUOTES: QUOTES,
};
