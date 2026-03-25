/**
 * 猫咪图鉴系统
 * 追踪玩家发现过的伪装物品组合
 */
var scene = require('./scene');

var CODEX_ROOMS = [
  { id:'livingroom', name:'客厅', emoji:'\uD83D\uDECB\uFE0F', disguises: scene.CAT_DISGUISE_TEMPLATES },
  { id:'kitchen',    name:'厨房', emoji:'\uD83C\uDF73', disguises: scene.KITCHEN_DISGUISES },
  { id:'bedroom',    name:'卧室', emoji:'\uD83D\uDECF\uFE0F', disguises: scene.BEDROOM_DISGUISES },
  { id:'bathroom',   name:'浴室', emoji:'\uD83D\uDEC1', disguises: scene.BATHROOM_DISGUISES },
  { id:'study',      name:'书房', emoji:'\uD83D\uDCDA', disguises: scene.STUDY_DISGUISES },
];

var codex = {};

function load() {
  try {
    var data = tt.getStorageSync('catHideCodex');
    if (data) codex = JSON.parse(data);
  } catch(e) {}
}

function save() {
  try { tt.setStorageSync('catHideCodex', JSON.stringify(codex)); } catch(e) {}
}

function record(disguiseId) {
  if (codex[disguiseId]) return false;
  codex[disguiseId] = true;
  save();
  return true;
}

function getCount() {
  var total = 0;
  CODEX_ROOMS.forEach(function(r){ total += r.disguises.length; });
  return { found: Object.keys(codex).length, total: total };
}

function getData() {
  return codex;
}

load();

module.exports = {
  CODEX_ROOMS: CODEX_ROOMS,
  record: record,
  getCount: getCount,
  getData: getData,
  load: load,
};
