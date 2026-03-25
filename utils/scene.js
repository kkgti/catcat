/**
 * 场景系统 —— 一点透视房间 + 物品模板 + 布局
 * 同步自 preview.html
 */
var draw = require('./draw-utils');

// ==================== 透视房间参数 ====================
var VIEW_W = 750, VIEW_H = 900;
var BACK_L = 60, BACK_R = 690;
var BACK_T = 75, BACK_B = 400;
var FLOOR_B = 760;
var ITEM_SCALE = 0.6;

var CAT_COLORS = ['#ff9944', '#ffcc66', '#aaaaaa', '#886644', '#ffddaa', '#dd8866'];

function getItemScale(y) {
  var t = (y - BACK_B) / (FLOOR_B - BACK_B);
  t = Math.max(0, Math.min(1, t));
  return 0.55 + t * 0.30;
}

// ==================== 客厅物品模板 ====================
var ITEM_TEMPLATES = [
  {
    id:'sofa', name:'沙发', w:260, h:110, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,12,'#8B6F47');
      draw.roundRect(ctx,x+8,y+8,w-16,h*0.55,8,'#A0845C');
      draw.roundRect(ctx,x+15,y+15,50,32,6,'#cc7755');
      draw.roundRect(ctx,x+72,y+15,50,32,6,'#5588aa');
      draw.roundRect(ctx,x+130,y+15,50,32,6,'#cc7755');
      draw.roundRect(ctx,x+188,y+15,50,32,6,'#77aa77');
    }
  },
  {
    id:'table', name:'茶几', w:150, h:70, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,6,'#A0522D');
      draw.roundRect(ctx,x+5,y+5,w-10,h-10,4,'#C4793A');
    }
  },
  {
    id:'tv', name:'电视', w:180, h:120, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,8,'#222');
      var flk=Date.now()/1000;
      var br=Math.floor(51+Math.sin(flk*2.1)*8);
      var bg=Math.floor(68+Math.sin(flk*1.7)*6);
      var bb=Math.floor(85+Math.sin(flk*3.3)*5);
      draw.roundRect(ctx,x+8,y+8,w-16,h-30,4,'rgb('+br+','+bg+','+bb+')');
      var hlx=((flk*0.3)%1.0)*(w-24);
      ctx.fillStyle='rgba(150,200,255,'+(0.06+Math.sin(flk*1.5)*0.03)+')';
      ctx.fillRect(x+12,y+12,hlx,(h-38)*0.4);
      draw.roundRect(ctx,x+65,y+h-18,50,16,3,'#333');
    }
  },
  {
    id:'tv_stand', name:'电视柜', w:280, h:45, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,6,'#5c4a3a');
      draw.roundRect(ctx,x+5,y+3,80,h-6,3,'#4a3a2a');
      draw.roundRect(ctx,x+90,y+3,80,h-6,3,'#4a3a2a');
      draw.roundRect(ctx,x+175,y+3,100,h-6,3,'#4a3a2a');
    }
  },
  {
    id:'bookshelf', name:'书架', w:110, h:170, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#6b4226');
      ctx.fillStyle='#5a3520'; ctx.fillRect(x+4,y+h*0.33,w-8,4); ctx.fillRect(x+4,y+h*0.66,w-8,4);
      draw.roundRect(ctx,x+8,y+6,18,h*0.3-10,2,'#cc4444');
      draw.roundRect(ctx,x+28,y+8,15,h*0.3-12,2,'#4466cc');
      draw.roundRect(ctx,x+45,y+4,20,h*0.3-8,2,'#44aa44');
      draw.roundRect(ctx,x+68,y+10,16,h*0.3-14,2,'#cc8844');
      draw.roundRect(ctx,x+10,y+h*0.33+8,25,h*0.3-12,2,'#dd6666');
      draw.roundRect(ctx,x+38,y+h*0.33+10,18,h*0.3-14,2,'#6688dd');
      draw.roundRect(ctx,x+60,y+h*0.33+6,20,h*0.3-10,2,'#66bb66');
      ctx.beginPath(); ctx.arc(x+25,y+h*0.66+25,12,0,Math.PI*2); ctx.fillStyle='#ddd'; ctx.fill();
      draw.roundRect(ctx,x+55,y+h*0.66+10,30,35,3,'#aa8855');
    }
  },
  {
    id:'vase', name:'花瓶', w:40, h:70, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.moveTo(x+w*0.3,y); ctx.quadraticCurveTo(x,y+h*0.6,x+w*0.15,y+h);
      ctx.lineTo(x+w*0.85,y+h); ctx.quadraticCurveTo(x+w,y+h*0.6,x+w*0.7,y);
      ctx.closePath(); ctx.fillStyle='#4488aa'; ctx.fill();
      draw.ellipse(ctx,x+w*0.5,y-10,12,8,'#ff6688');
      draw.ellipse(ctx,x+w*0.3,y-5,8,6,'#ff8866');
    }
  },
  {
    id:'candle', name:'蜡烛', w:30, h:60, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w/2,y+h-5,w*0.6,8,'#bb9944');
      draw.roundRect(ctx,x+w*0.25,y+h*0.2,w*0.5,h*0.75,3,'#ffffee');
      ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.quadraticCurveTo(x+w*0.7,y+h*0.12,x+w/2,y+h*0.2);
      ctx.quadraticCurveTo(x+w*0.3,y+h*0.12,x+w/2,y); ctx.fillStyle='#ffaa33'; ctx.fill();
    }
  },
  {
    id:'lamp', name:'台灯', w:50, h:90, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.moveTo(x+10,y); ctx.lineTo(x,y+35); ctx.lineTo(x+w,y+35); ctx.lineTo(x+w-10,y);
      ctx.closePath(); ctx.fillStyle='#ffdd88'; ctx.fill();
      ctx.fillStyle='rgba(255,221,136,0.15)'; ctx.beginPath(); ctx.arc(x+w/2,y+20,35,0,Math.PI*2); ctx.fill();
      draw.roundRect(ctx,x+w/2-4,y+35,8,40,2,'#888');
      draw.ellipse(ctx,x+w/2,y+h-5,18,6,'#666');
    }
  },
  {
    id:'clock', name:'时钟', w:55, h:55, zone:'wall_decor',
    draw:function(ctx,x,y,w,h){
      var cx=x+w/2,cy=y+h/2,r=w/2;
      ctx.beginPath(); ctx.arc(cx,cy,r+2,0,Math.PI*2); ctx.fillStyle='#996633'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#fffff0'; ctx.fill();
      for(var i=0;i<12;i++){var a=(i/12)*Math.PI*2-Math.PI/2;
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*(r-6),cy+Math.sin(a)*(r-6));
        ctx.lineTo(cx+Math.cos(a)*(r-2),cy+Math.sin(a)*(r-2)); ctx.strokeStyle='#333'; ctx.lineWidth=1.5; ctx.stroke();}
      var now=Date.now()/1000;
      var secA=(now%60)/60*Math.PI*2-Math.PI/2;
      var minA=((now/60)%60)/60*Math.PI*2-Math.PI/2;
      var hrA=((now/3600)%12)/12*Math.PI*2-Math.PI/2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(hrA)*(r*0.4),cy+Math.sin(hrA)*(r*0.4));
      ctx.strokeStyle='#333'; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(minA)*(r*0.6),cy+Math.sin(minA)*(r*0.6));
      ctx.strokeStyle='#555'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(secA)*(r*0.7),cy+Math.sin(secA)*(r*0.7));
      ctx.strokeStyle='#cc3333'; ctx.lineWidth=0.8; ctx.stroke(); ctx.lineCap='butt';
      ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fillStyle='#333'; ctx.fill();
    }
  },
  {
    id:'plant', name:'盆栽', w:55, h:80, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.moveTo(x+8,y+h*0.45); ctx.lineTo(x+2,y+h); ctx.lineTo(x+w-2,y+h); ctx.lineTo(x+w-8,y+h*0.45);
      ctx.closePath(); ctx.fillStyle='#cc6633'; ctx.fill();
      draw.ellipse(ctx,x+w*0.5,y+h*0.25,22,15,'#44aa55');
      draw.ellipse(ctx,x+w*0.25,y+h*0.35,14,10,'#55bb66');
      draw.ellipse(ctx,x+w*0.75,y+h*0.32,14,10,'#55bb66');
    }
  },
  {
    id:'pillow', name:'靠枕', w:55, h:45, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,12,'#ee8866');
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x+10,y+10); ctx.lineTo(x+w-10,y+h-10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w-10,y+10); ctx.lineTo(x+10,y+h-10); ctx.stroke();
    }
  },
  {
    id:'teddy', name:'玩偶熊', w:48, h:55, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w/2,y+h*0.65,w*0.4,h*0.3,'#bb8844');
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.3,w*0.32,0,Math.PI*2); ctx.fillStyle='#cc9955'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.28,y+h*0.12,7,0,Math.PI*2); ctx.fillStyle='#bb8844'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.72,y+h*0.12,7,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.38,y+h*0.27,3,0,Math.PI*2); ctx.fillStyle='#333'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.62,y+h*0.27,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.35,3,0,Math.PI*2); ctx.fillStyle='#885533'; ctx.fill();
    }
  },
  {
    id:'cup', name:'杯子', w:28, h:38, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#eee');
      draw.roundRect(ctx,x+3,y+3,w-6,h*0.3,2,'#c8a070');
      ctx.beginPath(); ctx.arc(x+w+5,y+h*0.4,8,-Math.PI*0.5,Math.PI*0.5);
      ctx.strokeStyle='#ddd'; ctx.lineWidth=2.5; ctx.stroke();
    }
  },
  {
    id:'frame', name:'相框', w:70, h:55, zone:'wall_decor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,3,'#996633');
      draw.roundRect(ctx,x+6,y+6,w-12,h-12,2,'#aaddff');
      ctx.fillStyle='#88bb44'; ctx.fillRect(x+6,y+h*0.5,w-12,h*0.5-6);
    }
  },
  {
    id:'rug', name:'地毯', w:240, h:100, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,8,'#884466');
      draw.roundRect(ctx,x+12,y+12,w-24,h-24,6,'#995577');
      draw.roundRect(ctx,x+24,y+24,w-48,h-48,4,'#aa6688');
      draw.ellipse(ctx,x+w/2,y+h/2,25,12,'#bb7799');
    }
  },
  {
    id:'shoe', name:'拖鞋', w:42, h:22, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,8,'#ff9977');
      draw.roundRect(ctx,x+8,y+3,w*0.5,h*0.5,3,'#ffbb99');
    }
  },
  {
    id:'basket', name:'收纳篮', w:55, h:40, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.2,w,h*0.8,6,'#cc9966');
      ctx.strokeStyle='#aa7744'; ctx.lineWidth=1;
      for(var i=0;i<4;i++){var yy=y+h*0.3+i*h*0.16; ctx.beginPath(); ctx.moveTo(x+4,yy); ctx.lineTo(x+w-4,yy); ctx.stroke();}
      ctx.beginPath(); ctx.moveTo(x+w*0.3,y+h*0.2); ctx.quadraticCurveTo(x+w/2,y-2,x+w*0.7,y+h*0.2);
      ctx.strokeStyle='#bb8855'; ctx.lineWidth=3; ctx.stroke();
    }
  },
  {
    id:'remote', name:'遥控器', w:22, h:55, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#222');
      ctx.beginPath(); ctx.arc(x+w/2,y+12,4,0,Math.PI*2); ctx.fillStyle='#ff3333'; ctx.fill();
      draw.roundRect(ctx,x+4,y+22,14,6,2,'#444');
      draw.roundRect(ctx,x+4,y+31,14,6,2,'#444');
    }
  },
  {
    id:'chair', name:'椅子', w:65, h:80, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+5,y,w-10,h*0.45,4,'#7a5c3a');
      draw.roundRect(ctx,x,y+h*0.4,w,h*0.25,4,'#8B6F47');
      ctx.fillStyle='#6a4c2a';
      ctx.fillRect(x+5,y+h*0.65,6,h*0.35); ctx.fillRect(x+w-11,y+h*0.65,6,h*0.35);
    }
  },
  {
    id:'mirror', name:'镜子', w:50, h:70, zone:'wall_decor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,20,'#aa8855');
      draw.roundRect(ctx,x+4,y+4,w-8,h-8,16,'#cce8ff');
      ctx.fillStyle='rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.moveTo(x+12,y+8); ctx.lineTo(x+22,y+8); ctx.lineTo(x+10,y+h*0.5); ctx.closePath(); ctx.fill();
    }
  },
  {
    id:'trashbin', name:'垃圾桶', w:40, h:55, zone:'floor',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.moveTo(x+4,y+h*0.15); ctx.lineTo(x,y+h); ctx.lineTo(x+w,y+h); ctx.lineTo(x+w-4,y+h*0.15);
      ctx.closePath(); ctx.fillStyle='#889988'; ctx.fill();
      draw.roundRect(ctx,x-2,y+h*0.08,w+4,h*0.1,3,'#778877');
      draw.roundRect(ctx,x+2,y,w-4,h*0.12,4,'#99aa99');
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.06,3,0,Math.PI*2); ctx.fillStyle='#667766'; ctx.fill();
    }
  },
  {
    id:'fishbowl', name:'鱼缸', w:55, h:50, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.45,w*0.45,0,Math.PI*2); ctx.fillStyle='rgba(100,200,255,0.3)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.45,w*0.45,0,Math.PI*2); ctx.strokeStyle='rgba(150,220,255,0.5)'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='rgba(80,180,240,0.2)'; ctx.fillRect(x+w*0.1,y+h*0.25,w*0.8,h*0.45);
      var ft=Date.now()/1500;
      var fx=x+w*0.5+Math.sin(ft)*w*0.15;
      var fy=y+h*0.45+Math.sin(ft*1.7)*3;
      var faceL=Math.cos(ft)<0;
      ctx.save(); ctx.translate(fx,fy); if(faceL)ctx.scale(-1,1);
      ctx.beginPath(); ctx.ellipse(0,0,6,4,0,0,Math.PI*2); ctx.fillStyle='#ff6633'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-11,-4); ctx.lineTo(-11,4); ctx.closePath(); ctx.fill();
      ctx.restore();
      var sway=Math.sin(Date.now()/900)*3;
      ctx.beginPath(); ctx.moveTo(x+w*0.65,y+h*0.7);
      ctx.quadraticCurveTo(x+w*0.6+sway,y+h*0.5,x+w*0.68+sway*0.5,y+h*0.35);
      ctx.strokeStyle='#44aa44'; ctx.lineWidth=2; ctx.stroke();
    }
  },
  {
    id:'umbrella', name:'雨伞', w:30, h:70, zone:'floor',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.moveTo(x+w/2,y+h*0.15); ctx.lineTo(x+w/2,y+h*0.9);
      ctx.strokeStyle='#886644'; ctx.lineWidth=3; ctx.stroke();
      ctx.beginPath(); ctx.arc(x+w/2+6,y+h*0.9,6,0,Math.PI); ctx.strokeStyle='#886644'; ctx.lineWidth=3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w*0.2,y+h*0.15); ctx.lineTo(x+w/2,y); ctx.lineTo(x+w*0.8,y+h*0.15);
      ctx.closePath(); ctx.fillStyle='#dd4466'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+w*0.3,y+h*0.15); ctx.lineTo(x+w/2,y+h*0.02); ctx.strokeStyle='#cc3355'; ctx.lineWidth=1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w*0.7,y+h*0.15); ctx.lineTo(x+w/2,y+h*0.02); ctx.stroke();
    }
  },
  {
    id:'books', name:'一摞书', w:45, h:35, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.6,w,h*0.4,2,'#cc4444');
      draw.roundRect(ctx,x+2,y+h*0.35,w-4,h*0.3,2,'#4466cc');
      draw.roundRect(ctx,x+4,y+h*0.1,w-8,h*0.3,2,'#44aa44');
      draw.roundRect(ctx,x+1,y,w*0.7,h*0.15,2,'#cc8844');
    }
  },
];

// ---- 猫伪装模板（客厅）----
var CAT_DISGUISE_TEMPLATES = [
  {
    id:'dis_radio', name:'收音机', w:50, h:35, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,5,'#778899');
      ctx.beginPath(); ctx.arc(x+w*0.35,y+h*0.5,h*0.3,0,Math.PI*2); ctx.fillStyle='#556677'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.72,y+h*0.35,5,0,Math.PI*2); ctx.fillStyle='#ffcc44'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.72,y+h*0.7,4,0,Math.PI*2); ctx.fillStyle='#ff6644'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+w*0.85,y); ctx.lineTo(x+w*0.85,y-15); ctx.strokeStyle='#aaa'; ctx.lineWidth=1.5; ctx.stroke();
    }
  },
  {
    id:'dis_bottle', name:'水瓶', w:22, h:55, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.25,y,w*0.5,h*0.12,2,'#4499dd');
      draw.roundRect(ctx,x+w*0.1,y+h*0.22,w*0.8,h*0.75,4,'#66bbee');
      ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(x+w*0.15,y+h*0.45,w*0.7,h*0.48);
      draw.roundRect(ctx,x+w*0.15,y+h*0.55,w*0.7,h*0.2,2,'#fff');
    }
  },
  {
    id:'dis_hat', name:'帽子', w:50, h:30, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w/2,y+h*0.75,w*0.5,h*0.2,'#cc4444');
      ctx.beginPath(); ctx.moveTo(x+w*0.15,y+h*0.7); ctx.quadraticCurveTo(x+w/2,y-h*0.1,x+w*0.85,y+h*0.7);
      ctx.fillStyle='#dd5555'; ctx.fill();
      ctx.fillStyle='#222'; ctx.fillRect(x+w*0.18,y+h*0.55,w*0.64,h*0.12);
    }
  },
  {
    id:'dis_guitar', name:'吉他', w:35, h:75, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w/2,y+h*0.72,w*0.45,h*0.22,'#bb7733');
      draw.ellipse(ctx,x+w/2,y+h*0.48,w*0.32,h*0.15,'#bb7733');
      draw.roundRect(ctx,x+w*0.42,y,w*0.16,h*0.5,2,'#996622');
      ctx.strokeStyle='#ddd'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(x+w*0.45,y+h*0.05); ctx.lineTo(x+w*0.45,y+h*0.88); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w*0.55,y+h*0.05); ctx.lineTo(x+w*0.55,y+h*0.88); ctx.stroke();
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.72,6,0,Math.PI*2); ctx.fillStyle='#664411'; ctx.fill();
    }
  },
  {
    id:'dis_globe', name:'地球仪', w:48, h:55, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.25,y+h*0.88,w*0.5,h*0.12,3,'#887766');
      ctx.beginPath(); ctx.moveTo(x+w/2,y+h*0.45); ctx.lineTo(x+w/2,y+h*0.88);
      ctx.strokeStyle='#887766'; ctx.lineWidth=3; ctx.stroke();
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.38,w*0.38,0,Math.PI*2); ctx.fillStyle='#4488bb'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.4,y+h*0.32,6,0,Math.PI*2); ctx.fillStyle='#55aa55'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.6,y+h*0.38,8,0,Math.PI*2); ctx.fill();
    }
  },
  {
    id:'dis_trophy', name:'奖杯', w:35, h:55, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.15,y+h*0.85,w*0.7,h*0.15,3,'#887755');
      draw.roundRect(ctx,x+w*0.38,y+h*0.55,w*0.24,h*0.32,2,'#ccaa44');
      ctx.beginPath(); ctx.moveTo(x+w*0.1,y+h*0.05); ctx.lineTo(x+w*0.15,y+h*0.45);
      ctx.quadraticCurveTo(x+w/2,y+h*0.58,x+w*0.85,y+h*0.45);
      ctx.lineTo(x+w*0.9,y+h*0.05); ctx.closePath(); ctx.fillStyle='#ffcc33'; ctx.fill();
      ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#996600'; ctx.fillText('★',x+w/2,y+h*0.28);
    }
  },
  {
    id:'dis_alarm', name:'闹钟', w:42, h:45, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.arc(x+w*0.25,y+h*0.12,6,0,Math.PI*2); ctx.fillStyle='#dd6644'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.75,y+h*0.12,6,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.5,w*0.42,0,Math.PI*2); ctx.fillStyle='#dd6644'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.5,w*0.35,0,Math.PI*2); ctx.fillStyle='#fffff0'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+w/2,y+h*0.5); ctx.lineTo(x+w/2+8,y+h*0.5-3);
      ctx.strokeStyle='#333'; ctx.lineWidth=2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w/2,y+h*0.5); ctx.lineTo(x+w/2-2,y+h*0.5-10);
      ctx.strokeStyle='#333'; ctx.lineWidth=1.5; ctx.stroke();
    }
  },
];

// ==================== 厨房物品模板 ====================
var KITCHEN_ITEMS = [
  { id:'fridge', name:'冰箱', w:100, h:180, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,6,'#e8e8e8');
      ctx.strokeStyle='#ccc'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+5,y+h*0.35); ctx.lineTo(x+w-5,y+h*0.35); ctx.stroke();
      draw.roundRect(ctx,x+w-14,y+h*0.12,4,h*0.15,2,'#aaa');
      draw.roundRect(ctx,x+w-14,y+h*0.45,4,h*0.2,2,'#aaa');
    }},
  { id:'stove', name:'灶台', w:120, h:80, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#333');
      draw.roundRect(ctx,x+3,y+3,w-6,h-6,3,'#444');
      ctx.strokeStyle='#777'; ctx.lineWidth=2;
      [[0.25,0.35,14],[0.75,0.35,14],[0.25,0.7,10],[0.75,0.7,10]].forEach(function(b){
        ctx.beginPath(); ctx.arc(x+w*b[0],y+h*b[1],b[2],0,Math.PI*2); ctx.stroke();
      });
    }},
  { id:'k_counter', name:'料理台', w:250, h:50, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#c8b090');
      draw.roundRect(ctx,x+5,y+5,w*0.4-5,h-10,3,'#b8a080');
      draw.roundRect(ctx,x+w*0.45,y+5,w*0.5,h-10,3,'#b8a080');
    }},
  { id:'k_sink', name:'水槽', w:80, h:50, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#bbb');
      ctx.beginPath(); ctx.ellipse(x+w/2,y+h*0.55,w*0.35,h*0.3,0,0,Math.PI*2); ctx.fillStyle='#999'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+w/2,y+5); ctx.lineTo(x+w/2,y-8); ctx.lineTo(x+w/2+12,y-8);
      ctx.strokeStyle='#999'; ctx.lineWidth=3; ctx.stroke();
    }},
  { id:'microwave', name:'微波炉', w:65, h:45, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#ddd');
      draw.roundRect(ctx,x+5,y+5,w*0.6,h-10,2,'#334');
      ctx.beginPath(); ctx.arc(x+w*0.82,y+h*0.35,3,0,Math.PI*2); ctx.fillStyle='#66cc66'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.82,y+h*0.65,3,0,Math.PI*2); ctx.fillStyle='#888'; ctx.fill();
    }},
  { id:'pot', name:'汤锅', w:50, h:45, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w/2,y+h*0.6,w*0.45,h*0.35,'#888');
      draw.ellipse(ctx,x+w/2,y+h*0.55,w*0.38,h*0.28,'#555');
      draw.ellipse(ctx,x+w/2,y+h*0.35,w*0.42,h*0.12,'#999');
      ctx.fillStyle='#777'; ctx.fillRect(x-5,y+h*0.45,8,6); ctx.fillRect(x+w-3,y+h*0.45,8,6);
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.3,4,0,Math.PI*2); ctx.fillStyle='#333'; ctx.fill();
    }},
  { id:'pan', name:'平底锅', w:60, h:30, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w*0.4,y+h*0.5,w*0.38,h*0.45,'#555');
      draw.ellipse(ctx,x+w*0.4,y+h*0.45,w*0.3,h*0.32,'#666');
      draw.roundRect(ctx,x+w*0.7,y+h*0.3,w*0.32,h*0.3,3,'#8B6F47');
    }},
  { id:'cutting_board', name:'砧板', w:55, h:38, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,5,'#d4a76a');
      ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.lineWidth=0.5;
      for(var i=1;i<6;i++){ ctx.beginPath(); ctx.moveTo(x+5,y+i*h/6); ctx.lineTo(x+w-5,y+i*h/6); ctx.stroke(); }
    }},
  { id:'toaster', name:'烤面包机', w:38, h:32, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.2,w,h*0.8,5,'#cc8844');
      draw.roundRect(ctx,x+6,y,w*0.33,h*0.35,2,'#a86a30');
      draw.roundRect(ctx,x+w*0.5,y,w*0.33,h*0.35,2,'#a86a30');
    }},
  { id:'kettle', name:'水壶', w:40, h:50, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.moveTo(x+w*0.2,y+h*0.25); ctx.quadraticCurveTo(x,y+h*0.7,x+w*0.15,y+h);
      ctx.lineTo(x+w*0.85,y+h); ctx.quadraticCurveTo(x+w,y+h*0.7,x+w*0.8,y+h*0.25);
      ctx.closePath(); ctx.fillStyle='#dd4444'; ctx.fill();
      draw.roundRect(ctx,x+w*0.25,y+h*0.12,w*0.5,h*0.16,3,'#cc3333');
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.08,3,0,Math.PI*2); ctx.fillStyle='#333'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+w,y+h*0.35); ctx.lineTo(x+w+10,y+h*0.2);
      ctx.strokeStyle='#cc3333'; ctx.lineWidth=4; ctx.stroke();
    }},
  { id:'fruit_bowl', name:'果盘', w:60, h:45, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.ellipse(x+w/2,y+h*0.7,w*0.48,h*0.28,0,0,Math.PI); ctx.fillStyle='#ddc8a0'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.35,y+h*0.45,8,0,Math.PI*2); ctx.fillStyle='#ff4444'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.55,y+h*0.4,7,0,Math.PI*2); ctx.fillStyle='#ffaa22'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.7,y+h*0.5,6,0,Math.PI*2); ctx.fillStyle='#44bb44'; ctx.fill();
    }},
  { id:'k_stool', name:'厨房凳', w:45, h:70, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+2,y,w-4,h*0.15,8,'#aa8866');
      ctx.fillStyle='#8B6F47';
      ctx.fillRect(x+6,y+h*0.15,5,h*0.85); ctx.fillRect(x+w-11,y+h*0.15,5,h*0.85);
      ctx.fillRect(x+10,y+h*0.6,w-20,4);
    }},
];

var KITCHEN_DISGUISES = [
  { id:'dis_blender', name:'搅拌机', w:30, h:55, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.1,y+h*0.7,w*0.8,h*0.3,4,'#888');
      ctx.beginPath(); ctx.moveTo(x+w*0.15,y+h*0.7); ctx.lineTo(x+w*0.2,y+h*0.15);
      ctx.lineTo(x+w*0.8,y+h*0.15); ctx.lineTo(x+w*0.85,y+h*0.7); ctx.closePath();
      ctx.fillStyle='rgba(150,200,255,0.4)'; ctx.fill(); ctx.strokeStyle='rgba(150,200,255,0.6)'; ctx.lineWidth=1; ctx.stroke();
      draw.roundRect(ctx,x+w*0.25,y,w*0.5,h*0.18,3,'#666');
    }},
  { id:'dis_mug', name:'马克杯', w:32, h:35, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.1,w*0.75,h*0.9,4,'#4488aa');
      ctx.beginPath(); ctx.arc(x+w*0.75+6,y+h*0.45,8,-Math.PI*0.4,Math.PI*0.4);
      ctx.strokeStyle='#4488aa'; ctx.lineWidth=3; ctx.stroke();
      draw.ellipse(ctx,x+w*0.375,y+h*0.15,w*0.3,h*0.08,'#c8a070');
    }},
  { id:'dis_rolling', name:'擀面杖', w:60, h:18, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.15,y+h*0.15,w*0.7,h*0.7,h*0.3,'#d4a76a');
      ctx.fillStyle='#aa8855'; ctx.fillRect(x,y+h*0.3,w*0.18,h*0.4);
      ctx.fillStyle='#aa8855'; ctx.fillRect(x+w*0.82,y+h*0.3,w*0.18,h*0.4);
    }},
  { id:'dis_thermos', name:'保温杯', w:25, h:55, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.15,w,h*0.85,4,'#336688');
      draw.roundRect(ctx,x+w*0.15,y,w*0.7,h*0.2,3,'#557799');
      ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(x+3,y+h*0.4,w*0.3,h*0.35);
    }},
  { id:'dis_wafflemaker', name:'华夫饼机', w:42, h:38, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,6,'#222');
      draw.roundRect(ctx,x+4,y+h*0.1,w-8,h*0.4,3,'#333');
      ctx.strokeStyle='#444'; ctx.lineWidth=0.8;
      for(var i=1;i<4;i++){ ctx.beginPath(); ctx.moveTo(x+6+i*8,y+h*0.12); ctx.lineTo(x+6+i*8,y+h*0.48); ctx.stroke(); }
      for(var j=1;j<3;j++){ ctx.beginPath(); ctx.moveTo(x+6,y+h*0.12+j*6); ctx.lineTo(x+w-6,y+h*0.12+j*6); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x+w+3,y+h*0.5,4,0,Math.PI*2); ctx.fillStyle='#44cc44'; ctx.fill();
    }},
];

// ==================== 卧室物品模板 ====================
var BEDROOM_ITEMS = [
  { id:'bed', name:'床', w:220, h:130, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,8,'#6a5acd');
      draw.roundRect(ctx,x+5,y+5,w-10,h-10,6,'#7b68ee');
      draw.roundRect(ctx,x+10,y+10,60,30,10,'#eee');
      draw.roundRect(ctx,x+80,y+12,55,28,10,'#eef');
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x+10,y+55); ctx.lineTo(x+w-10,y+55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+10,y+80); ctx.lineTo(x+w-10,y+80); ctx.stroke();
    }},
  { id:'nightstand', name:'床头柜', w:55, h:50, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#5c4a3a');
      draw.roundRect(ctx,x+4,y+h*0.55,w-8,h*0.35,3,'#4a3a2a');
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.72,3,0,Math.PI*2); ctx.fillStyle='#aa9977'; ctx.fill();
    }},
  { id:'wardrobe', name:'衣柜', w:130, h:190, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#7a5c3a');
      draw.roundRect(ctx,x+5,y+5,w/2-8,h-10,3,'#8B6F47');
      draw.roundRect(ctx,x+w/2+3,y+5,w/2-8,h-10,3,'#8B6F47');
      draw.roundRect(ctx,x+w/2-5,y+h*0.4,4,h*0.15,2,'#aa9977');
      draw.roundRect(ctx,x+w/2+1,y+h*0.4,4,h*0.15,2,'#aa9977');
    }},
  { id:'b_desk', name:'书桌', w:150, h:60, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h*0.35,4,'#8B6F47');
      ctx.fillStyle='#6a4c2a';
      ctx.fillRect(x+8,y+h*0.35,6,h*0.65); ctx.fillRect(x+w-14,y+h*0.35,6,h*0.65);
      draw.roundRect(ctx,x+w*0.55,y+h*0.35,w*0.35,h*0.55,3,'#7a5c3a');
      ctx.beginPath(); ctx.arc(x+w*0.72,y+h*0.6,3,0,Math.PI*2); ctx.fillStyle='#aa9977'; ctx.fill();
    }},
  { id:'b_chair', name:'转椅', w:55, h:70, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+8,y,w-16,h*0.4,6,'#444');
      draw.roundRect(ctx,x+3,y+h*0.35,w-6,h*0.2,4,'#555');
      ctx.fillStyle='#777'; ctx.fillRect(x+w/2-3,y+h*0.55,6,h*0.25);
      draw.ellipse(ctx,x+w/2,y+h*0.88,w*0.4,h*0.08,'#666');
    }},
  { id:'poster', name:'海报', w:80, h:60, zone:'wall_decor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,2,'#2a2a4a');
      ctx.fillStyle='#fff';
      [[0.2,0.3],[0.5,0.2],[0.8,0.4],[0.35,0.6],[0.65,0.7],[0.15,0.8]].forEach(function(p){
        ctx.beginPath(); ctx.arc(x+w*p[0],y+h*p[1],1.5,0,Math.PI*2); ctx.fill();
      });
      draw.ellipse(ctx,x+w*0.7,y+h*0.25,12,12,'#ffd700');
    }},
  { id:'backpack', name:'书包', w:45, h:55, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.15,w,h*0.85,8,'#3366aa');
      draw.roundRect(ctx,x+w*0.15,y,w*0.7,h*0.25,5,'#2255aa');
      ctx.strokeStyle='#ffcc44'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(x+w*0.3,y+h*0.35); ctx.lineTo(x+w*0.7,y+h*0.35); ctx.stroke();
      draw.roundRect(ctx,x+w*0.2,y+h*0.5,w*0.6,h*0.3,4,'#2855aa');
    }},
  { id:'headphones', name:'耳机', w:40, h:42, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.35,w*0.4,Math.PI,0);
      ctx.strokeStyle='#333'; ctx.lineWidth=4; ctx.stroke();
      draw.ellipse(ctx,x+w*0.15,y+h*0.6,8,12,'#444');
      draw.ellipse(ctx,x+w*0.85,y+h*0.6,8,12,'#444');
      draw.ellipse(ctx,x+w*0.15,y+h*0.6,5,8,'#555');
      draw.ellipse(ctx,x+w*0.85,y+h*0.6,5,8,'#555');
    }},
  { id:'b_slippers', name:'棉拖鞋', w:42, h:24, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w*0.45,h,8,'#aa6699');
      draw.roundRect(ctx,x+w*0.55,y+h*0.1,w*0.45,h*0.9,8,'#aa6699');
      draw.roundRect(ctx,x+4,y+2,w*0.45-8,h*0.4,4,'#cc88bb');
      draw.roundRect(ctx,x+w*0.55+4,y+h*0.12,w*0.45-8,h*0.38,4,'#cc88bb');
    }},
  { id:'tissue_box', name:'纸巾盒', w:38, h:22, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#66aacc');
      draw.roundRect(ctx,x+w*0.3,y-4,w*0.4,h*0.4,2,'#fff');
    }},
  { id:'clothes_pile', name:'衣服堆', w:60, h:35, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+5,y+h*0.4,w*0.7,h*0.6,4,'#dd6666');
      draw.roundRect(ctx,x+w*0.3,y+h*0.2,w*0.6,h*0.5,4,'#4488cc');
      draw.roundRect(ctx,x+w*0.15,y,w*0.5,h*0.4,3,'#ffcc66');
    }},
  { id:'b_rug', name:'圆形地毯', w:140, h:90, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w/2,y+h/2,w*0.5,h*0.5,'#996677');
      draw.ellipse(ctx,x+w/2,y+h/2,w*0.35,h*0.35,'#aa7788');
      draw.ellipse(ctx,x+w/2,y+h/2,w*0.15,h*0.15,'#bb8899');
    }},
];

var BEDROOM_DISGUISES = [
  { id:'dis_musicbox', name:'音乐盒', w:38, h:32, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.3,w,h*0.7,4,'#bb8844');
      draw.roundRect(ctx,x+3,y+h*0.35,w-6,h*0.15,2,'#ddaa55');
      ctx.beginPath(); ctx.moveTo(x+2,y+h*0.3); ctx.lineTo(x+w*0.3,y); ctx.lineTo(x+w-2,y+h*0.3);
      ctx.closePath(); ctx.fillStyle='#cc9944'; ctx.fill();
      ctx.font='10px sans-serif'; ctx.fillStyle='#ffd700'; ctx.textAlign='center'; ctx.fillText('♪',x+w*0.6,y+h*0.15);
    }},
  { id:'dis_snowglobe', name:'水晶球', w:42, h:48, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.15,y+h*0.8,w*0.7,h*0.2,3,'#555');
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.45,w*0.4,0,Math.PI*2);
      ctx.fillStyle='rgba(200,230,255,0.3)'; ctx.fill();
      ctx.strokeStyle='rgba(200,230,255,0.5)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='#cc6644'; ctx.fillRect(x+w*0.35,y+h*0.4,w*0.3,h*0.2);
      ctx.beginPath(); ctx.moveTo(x+w*0.3,y+h*0.4); ctx.lineTo(x+w/2,y+h*0.25); ctx.lineTo(x+w*0.7,y+h*0.4);
      ctx.fillStyle='#884433'; ctx.fill();
    }},
  { id:'dis_piggy', name:'存钱罐', w:45, h:38, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w*0.45,y+h*0.55,w*0.4,h*0.35,'#ffaaaa');
      ctx.beginPath(); ctx.arc(x+w*0.15,y+h*0.45,8,0,Math.PI*2); ctx.fillStyle='#ffbbbb'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.2,y+h*0.4,2,0,Math.PI*2); ctx.fillStyle='#333'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.1,y+h*0.48,1.5,0,Math.PI*2); ctx.fillStyle='#dd8888'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.18,y+h*0.48,1.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#cc8888'; ctx.fillRect(x+w*0.4,y+h*0.2,w*0.2,3);
      ctx.fillStyle='#ffaaaa'; ctx.fillRect(x+w*0.25,y+h*0.8,5,h*0.2); ctx.fillRect(x+w*0.55,y+h*0.8,5,h*0.2);
    }},
  { id:'dis_toycar', name:'玩具车', w:48, h:25, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.1,y+h*0.2,w*0.8,h*0.5,4,'#ff4444');
      ctx.beginPath(); ctx.moveTo(x+w*0.2,y+h*0.2); ctx.lineTo(x+w*0.3,y); ctx.lineTo(x+w*0.7,y); ctx.lineTo(x+w*0.8,y+h*0.2);
      ctx.fillStyle='#66bbff'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.22,y+h*0.85,h*0.15,0,Math.PI*2); ctx.fillStyle='#333'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.78,y+h*0.85,h*0.15,0,Math.PI*2); ctx.fill();
    }},
  { id:'dis_rubiks', name:'魔方', w:30, h:30, zone:'any',
    draw:function(ctx,x,y,w,h){
      var s=w/3; var colors=['#ff3333','#3366ff','#ffcc33','#33cc33','#ff9933','#ffffff'];
      for(var r=0;r<3;r++) for(var c=0;c<3;c++){
        ctx.fillStyle=colors[(r*3+c)%6]; ctx.fillRect(x+c*s+1,y+r*s+1,s-2,s-2);
      }
      ctx.strokeStyle='#111'; ctx.lineWidth=1.5; ctx.strokeRect(x,y,w,h);
    }},
];

// ==================== 浴室物品模板 ====================
var BATHROOM_ITEMS = [
  { id:'bathtub', name:'浴缸', w:220, h:100, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.2,w,h*0.8,12,'#e8e8e8');
      draw.roundRect(ctx,x+8,y+h*0.28,w-16,h*0.65,8,'#d0e8f0');
      ctx.fillStyle='rgba(100,180,220,0.15)'; ctx.fillRect(x+12,y+h*0.5,w-24,h*0.38);
      // 水龙头
      ctx.fillStyle='#bbb'; ctx.fillRect(x+w-30,y,12,h*0.3);
      ctx.beginPath(); ctx.arc(x+w-24,y,8,0,Math.PI*2); ctx.fillStyle='#ccc'; ctx.fill();
    }},
  { id:'toilet', name:'马桶', w:60, h:70, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.1,y+h*0.5,w*0.8,h*0.5,6,'#f0f0f0');
      draw.ellipse(ctx,x+w/2,y+h*0.4,w*0.42,h*0.2,'#f5f5f5');
      draw.roundRect(ctx,x+w*0.2,y,w*0.6,h*0.35,4,'#e8e8e8');
      ctx.fillStyle='#ddd'; ctx.fillRect(x+w*0.42,y+h*0.08,w*0.16,h*0.12);
    }},
  { id:'sink_bath', name:'洗手台', w:110, h:55, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,6,'#ddd');
      draw.ellipse(ctx,x+w/2,y+h*0.6,w*0.35,h*0.25,'#c8c8c8');
      ctx.fillStyle='#bbb'; ctx.fillRect(x+w/2-4,y-10,8,14);
      ctx.beginPath(); ctx.arc(x+w/2,y-10,6,0,Math.PI*2); ctx.fillStyle='#ccc'; ctx.fill();
      // 镜子
      draw.roundRect(ctx,x+w*0.15,y-70,w*0.7,60,6,'#aac8dd');
      ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(x+w*0.2,y-65,w*0.3,50);
    }},
  { id:'shower', name:'淋浴', w:80, h:180, zone:'wall',
    draw:function(ctx,x,y,w,h){
      // 玻璃隔断
      ctx.fillStyle='rgba(180,220,240,0.2)'; ctx.fillRect(x,y,w,h);
      ctx.strokeStyle='rgba(180,220,240,0.4)'; ctx.lineWidth=2;
      ctx.strokeRect(x,y,w,h);
      // 花洒
      draw.roundRect(ctx,x+w*0.3,y+5,w*0.4,8,3,'#ccc');
      ctx.fillStyle='#bbb'; ctx.fillRect(x+w/2-3,y+13,6,20);
      // 水滴
      ctx.fillStyle='rgba(100,180,220,0.15)';
      for(var d=0;d<5;d++){
        var dx=x+w*0.2+d*w*0.15, dy=y+40+((Date.now()/300+d*50)%h*0.6);
        ctx.beginPath(); ctx.arc(dx,dy,1.5,0,Math.PI*2); ctx.fill();
      }
    }},
  { id:'bath_shelf', name:'浴室架', w:80, h:80, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#e0e0e0');
      ctx.fillStyle='#d0d0d0'; ctx.fillRect(x+3,y+h*0.48,w-6,3);
      // 上层 - 瓶瓶罐罐
      draw.roundRect(ctx,x+8,y+8,12,h*0.38,3,'#66aacc');
      draw.roundRect(ctx,x+24,y+12,10,h*0.34,3,'#cc6688');
      draw.roundRect(ctx,x+38,y+6,14,h*0.40,3,'#88bb66');
      draw.roundRect(ctx,x+56,y+10,12,h*0.36,3,'#ddaa44');
      // 下层
      draw.roundRect(ctx,x+10,y+h*0.55,20,h*0.35,3,'#eee');
      draw.roundRect(ctx,x+35,y+h*0.58,18,h*0.32,2,'#f8e0c0');
      draw.roundRect(ctx,x+58,y+h*0.56,14,h*0.34,3,'#aaddee');
    }},
  { id:'bath_mat', name:'浴室垫', w:100, h:40, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,8,'#88bbaa');
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1;
      for(var i=1;i<5;i++){ ctx.beginPath(); ctx.moveTo(x+i*w/5,y+3); ctx.lineTo(x+i*w/5,y+h-3); ctx.stroke(); }
    }},
  { id:'towel_rack', name:'毛巾架', w:60, h:50, zone:'wall',
    draw:function(ctx,x,y,w,h){
      ctx.fillStyle='#ccc'; ctx.fillRect(x,y,w,4);
      ctx.fillStyle='#ccc'; ctx.fillRect(x+5,y,4,15); ctx.fillRect(x+w-9,y,4,15);
      // 毛巾
      draw.roundRect(ctx,x+3,y+8,w*0.45,h*0.8,3,'#ff9999');
      draw.roundRect(ctx,x+w*0.5,y+6,w*0.45,h*0.85,3,'#99ccff');
    }},
  { id:'laundry_basket', name:'脏衣篓', w:55, h:60, zone:'floor',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.moveTo(x+5,y); ctx.lineTo(x+w-5,y);
      ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.closePath();
      ctx.fillStyle='#c0a070'; ctx.fill();
      ctx.strokeStyle='#a08050'; ctx.lineWidth=1;
      for(var r=0;r<4;r++){ ctx.beginPath(); ctx.moveTo(x+2,y+r*h/4+8); ctx.lineTo(x+w-2,y+r*h/4+8); ctx.stroke(); }
      // 衣服露出
      ctx.fillStyle='#6688cc'; ctx.fillRect(x+8,y-5,15,10);
      ctx.fillStyle='#cc6666'; ctx.fillRect(x+w-22,y-3,14,8);
    }},
];

var BATHROOM_DISGUISES = [
  { id:'dis_ducky', name:'小黄鸭', w:35, h:30, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w*0.5,y+h*0.65,w*0.4,h*0.3,'#ffdd44');
      ctx.beginPath(); ctx.arc(x+w*0.35,y+h*0.3,w*0.22,0,Math.PI*2); ctx.fillStyle='#ffdd44'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.28,y+h*0.22,2,0,Math.PI*2); ctx.fillStyle='#333'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+w*0.2,y+h*0.3); ctx.lineTo(x+w*0.05,y+h*0.35); ctx.lineTo(x+w*0.2,y+h*0.4);
      ctx.fillStyle='#ff8800'; ctx.fill();
    }},
  { id:'dis_shampoo', name:'洗发水', w:25, h:55, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.2,w,h*0.8,5,'#cc66aa');
      draw.roundRect(ctx,x+w*0.2,y,w*0.6,h*0.25,3,'#dd77bb');
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(x+3,y+h*0.35,w*0.35,h*0.4);
      ctx.fillStyle='#fff'; ctx.font='8px sans-serif'; ctx.textAlign='center'; ctx.fillText('S',x+w/2,y+h*0.6);
    }},
  { id:'dis_soap', name:'肥皂', w:35, h:22, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,6,'#aaddcc');
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(x+4,y+3,w*0.4,h*0.4);
      // 肥皂泡
      ctx.beginPath(); ctx.arc(x+w*0.8,y-3,4,0,Math.PI*2); ctx.fillStyle='rgba(200,230,255,0.4)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.9,y-8,3,0,Math.PI*2); ctx.fill();
    }},
  { id:'dis_toothbrush_cup', name:'漱口杯', w:28, h:40, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.1,y+h*0.25,w*0.8,h*0.75,4,'#88ccee');
      ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(x+w*0.15,y+h*0.3,w*0.3,h*0.65);
      // 牙刷
      ctx.fillStyle='#44aa44'; ctx.fillRect(x+w*0.3,y,4,h*0.5);
      draw.roundRect(ctx,x+w*0.22,y,10,6,2,'#66cc66');
      ctx.fillStyle='#ff6666'; ctx.fillRect(x+w*0.55,y+h*0.05,4,h*0.45);
      draw.roundRect(ctx,x+w*0.47,y+h*0.05,10,6,2,'#ff8888');
    }},
  { id:'dis_sponge', name:'海绵', w:35, h:24, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,5,'#ffdd55');
      ctx.fillStyle='rgba(0,0,0,0.05)';
      for(var i=0;i<6;i++){
        var px=x+5+i*5, py=y+4+(i%2)*6;
        ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2); ctx.fill();
      }
      draw.roundRect(ctx,x,y+h*0.7,w,h*0.3,3,'#55aa55');
    }},
  { id:'dis_candle_bath', name:'香薰蜡烛', w:25, h:35, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+2,y+h*0.3,w-4,h*0.7,4,'#f0e0d0');
      ctx.fillStyle='#ddd'; ctx.fillRect(x+w/2-1,y+h*0.15,2,h*0.18);
      // 火焰
      var flicker=Math.sin(Date.now()/200)*2;
      ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.quadraticCurveTo(x+w/2+5+flicker,y+h*0.12,x+w/2,y+h*0.2);
      ctx.quadraticCurveTo(x+w/2-5+flicker,y+h*0.12,x+w/2,y);
      ctx.fillStyle='#ffaa33'; ctx.fill();
    }},
];

// ==================== 书房物品模板 ====================
var STUDY_ITEMS = [
  { id:'s_desk', name:'大书桌', w:260, h:65, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h*0.35,4,'#5a4030');
      ctx.fillStyle='#4a3020';
      ctx.fillRect(x+10,y+h*0.35,8,h*0.65); ctx.fillRect(x+w-18,y+h*0.35,8,h*0.65);
      draw.roundRect(ctx,x+w*0.65,y+h*0.35,w*0.28,h*0.55,3,'#5a4030');
      ctx.beginPath(); ctx.arc(x+w*0.79,y+h*0.55,3,0,Math.PI*2); ctx.fillStyle='#aa9977'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.79,y+h*0.75,3,0,Math.PI*2); ctx.fill();
    }},
  { id:'s_bookcase', name:'大书柜', w:160, h:200, zone:'wall',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#5c3a20');
      // 4层隔板
      for(var s=1;s<4;s++){
        ctx.fillStyle='#4a2a15'; ctx.fillRect(x+4,y+h*s/4,w-8,4);
      }
      // 书（每层不同）
      var bookColors=[['#cc4444','#4466cc','#44aa44','#cc8844','#8855aa','#dd6666'],
                      ['#5588aa','#aa6633','#66bb66','#cc4466','#ddaa44'],
                      ['#885533','#6677cc','#cc5555','#44aa88','#aa77cc','#ddbb44'],
                      ['#997744','#5599bb','#cc6644','#669966']];
      for(var r=0;r<4;r++){
        var bx=x+8, by=y+h*r/4+8, bh=h/4-14;
        for(var b=0;b<bookColors[r].length;b++){
          var bw=10+Math.floor(b*3%8);
          draw.roundRect(ctx,bx,by+(bh-bh*0.9)/2,bw,bh*0.9,1,bookColors[r][b]);
          bx+=bw+2;
        }
      }
    }},
  { id:'s_chair', name:'皮椅', w:65, h:80, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+5,y,w-10,h*0.5,8,'#6a3a20');
      draw.roundRect(ctx,x,y+h*0.4,w,h*0.22,6,'#7a4a30');
      ctx.fillStyle='#555'; ctx.fillRect(x+w/2-3,y+h*0.62,6,h*0.2);
      draw.ellipse(ctx,x+w/2,y+h*0.9,w*0.35,h*0.06,'#444');
      // 扶手
      ctx.fillStyle='#6a3a20';
      ctx.fillRect(x-3,y+h*0.2,8,h*0.3); ctx.fillRect(x+w-5,y+h*0.2,8,h*0.3);
    }},
  { id:'s_lamp', name:'台灯', w:40, h:55, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.ellipse(ctx,x+w/2,y+h*0.92,w*0.3,h*0.06,'#555');
      ctx.fillStyle='#666'; ctx.fillRect(x+w/2-2,y+h*0.35,4,h*0.55);
      ctx.beginPath(); ctx.moveTo(x+w*0.1,y+h*0.4); ctx.lineTo(x+w*0.3,y);
      ctx.lineTo(x+w*0.7,y); ctx.lineTo(x+w*0.9,y+h*0.4); ctx.closePath();
      ctx.fillStyle='#ddcc88'; ctx.fill();
      var glow=ctx.createRadialGradient(x+w/2,y+h*0.3,3,x+w/2,y+h*0.3,30);
      glow.addColorStop(0,'rgba(255,220,150,0.12)'); glow.addColorStop(1,'rgba(255,220,150,0)');
      ctx.fillStyle=glow; ctx.fillRect(x-10,y-10,w+20,h*0.6);
    }},
  { id:'globe_study', name:'地球仪', w:50, h:60, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.25,y+h*0.88,w*0.5,h*0.12,3,'#6a5a4a');
      ctx.fillStyle='#6a5a4a'; ctx.fillRect(x+w/2-2,y+h*0.45,4,h*0.43);
      ctx.beginPath(); ctx.arc(x+w/2,y+h*0.38,w*0.38,0,Math.PI*2); ctx.fillStyle='#4488bb'; ctx.fill();
      ctx.fillStyle='#55aa55';
      ctx.beginPath(); ctx.arc(x+w*0.38,y+h*0.3,7,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.62,y+h*0.4,9,0,Math.PI*2); ctx.fill();
    }},
  { id:'filing_cabinet', name:'文件柜', w:60, h:100, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,3,'#778899');
      for(var d=0;d<3;d++){
        var dy=y+5+d*h/3;
        draw.roundRect(ctx,x+4,dy,w-8,h/3-8,2,'#8899aa');
        ctx.beginPath(); ctx.arc(x+w/2,dy+(h/3-8)/2,3,0,Math.PI*2); ctx.fillStyle='#aab'; ctx.fill();
      }
    }},
  { id:'s_rug', name:'地毯', w:180, h:60, zone:'floor',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y,w,h,4,'#8b4513');
      draw.roundRect(ctx,x+6,y+6,w-12,h-12,3,'#a0522d');
      ctx.strokeStyle='rgba(255,215,0,0.3)'; ctx.lineWidth=1;
      ctx.strokeRect(x+12,y+12,w-24,h-24);
    }},
  { id:'s_window_plant', name:'窗台植物', w:35, h:40, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.15,y+h*0.55,w*0.7,h*0.45,4,'#cc8855');
      ctx.fillStyle='#5a3a1a'; ctx.fillRect(x+w*0.2,y+h*0.6,w*0.6,h*0.1);
      // 叶子
      ctx.fillStyle='#44aa44';
      ctx.beginPath(); ctx.ellipse(x+w*0.3,y+h*0.3,8,14,-.3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+w*0.6,y+h*0.25,7,12,.4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+w*0.45,y+h*0.15,6,13,0,0,Math.PI*2); ctx.fill();
    }},
];

var STUDY_DISGUISES = [
  { id:'dis_inkwell', name:'墨水瓶', w:28, h:32, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.1,y+h*0.35,w*0.8,h*0.65,4,'#334');
      draw.roundRect(ctx,x+w*0.25,y+h*0.2,w*0.5,h*0.2,2,'#445');
      ctx.fillStyle='rgba(20,20,60,0.6)'; ctx.fillRect(x+w*0.2,y+h*0.45,w*0.6,h*0.35);
      // 羽毛笔
      ctx.save(); ctx.translate(x+w*0.7,y+h*0.2); ctx.rotate(-0.4);
      ctx.fillStyle='#eee'; ctx.fillRect(-1,0,3,-30);
      ctx.beginPath(); ctx.moveTo(1,-28); ctx.lineTo(-4,-35); ctx.lineTo(6,-35); ctx.fill();
      ctx.restore();
    }},
  { id:'dis_hourglass', name:'沙漏', w:28, h:45, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.1,y,w*0.8,h*0.08,2,'#aa8855');
      draw.roundRect(ctx,x+w*0.1,y+h*0.92,w*0.8,h*0.08,2,'#aa8855');
      // 上半
      ctx.beginPath(); ctx.moveTo(x+w*0.15,y+h*0.08); ctx.lineTo(x+w*0.42,y+h*0.48);
      ctx.lineTo(x+w*0.58,y+h*0.48); ctx.lineTo(x+w*0.85,y+h*0.08); ctx.closePath();
      ctx.fillStyle='rgba(220,200,150,0.4)'; ctx.fill();
      // 下半
      ctx.beginPath(); ctx.moveTo(x+w*0.15,y+h*0.92); ctx.lineTo(x+w*0.42,y+h*0.52);
      ctx.lineTo(x+w*0.58,y+h*0.52); ctx.lineTo(x+w*0.85,y+h*0.92); ctx.closePath();
      ctx.fillStyle='rgba(220,200,150,0.4)'; ctx.fill();
      // 沙子
      ctx.fillStyle='#ddc080'; ctx.fillRect(x+w*0.2,y+h*0.7,w*0.6,h*0.22);
    }},
  { id:'dis_magnifier', name:'放大镜', w:38, h:40, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.arc(x+w*0.45,y+h*0.4,w*0.32,0,Math.PI*2);
      ctx.strokeStyle='#aa8855'; ctx.lineWidth=3; ctx.stroke();
      ctx.fillStyle='rgba(200,230,255,0.25)'; ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(x+w*0.38,y+h*0.32,w*0.12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#8a6a3a'; ctx.fillRect(x+w*0.7,y+h*0.7,w*0.3,h*0.08);
      ctx.save(); ctx.translate(x+w*0.7,y+h*0.7); ctx.rotate(0.7);
      ctx.fillRect(0,-3,w*0.4,6); ctx.restore();
    }},
  { id:'dis_scroll', name:'卷轴', w:50, h:22, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x+w*0.08,y+h*0.15,w*0.84,h*0.7,3,'#f0e4c8');
      ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.lineWidth=0.5;
      for(var l=0;l<4;l++){ ctx.beginPath(); ctx.moveTo(x+w*0.15,y+h*0.3+l*4); ctx.lineTo(x+w*0.85,y+h*0.3+l*4); ctx.stroke(); }
      draw.ellipse(ctx,x+w*0.06,y+h/2,h*0.3,h*0.45,'#d4c0a0');
      draw.ellipse(ctx,x+w*0.94,y+h/2,h*0.3,h*0.45,'#d4c0a0');
    }},
  { id:'dis_compass', name:'指南针', w:35, h:35, zone:'any',
    draw:function(ctx,x,y,w,h){
      ctx.beginPath(); ctx.arc(x+w/2,y+h/2,w*0.45,0,Math.PI*2); ctx.fillStyle='#aa8855'; ctx.fill();
      ctx.beginPath(); ctx.arc(x+w/2,y+h/2,w*0.38,0,Math.PI*2); ctx.fillStyle='#fffff0'; ctx.fill();
      // 指针
      ctx.fillStyle='#cc3333';
      ctx.beginPath(); ctx.moveTo(x+w/2,y+h*0.2); ctx.lineTo(x+w*0.45,y+h/2); ctx.lineTo(x+w*0.55,y+h/2); ctx.fill();
      ctx.fillStyle='#3366cc';
      ctx.beginPath(); ctx.moveTo(x+w/2,y+h*0.8); ctx.lineTo(x+w*0.45,y+h/2); ctx.lineTo(x+w*0.55,y+h/2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+w/2,y+h/2,2,0,Math.PI*2); ctx.fillStyle='#333'; ctx.fill();
    }},
  { id:'dis_bookstack', name:'书堆', w:40, h:35, zone:'any',
    draw:function(ctx,x,y,w,h){
      draw.roundRect(ctx,x,y+h*0.65,w,h*0.12,2,'#cc4444');
      draw.roundRect(ctx,x+2,y+h*0.45,w*0.9,h*0.12,2,'#4466cc');
      draw.roundRect(ctx,x-1,y+h*0.25,w*0.95,h*0.12,2,'#44aa44');
      draw.roundRect(ctx,x+3,y+h*0.05,w*0.85,h*0.12,2,'#cc8844');
      // 书脊文字暗示
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=0.5;
      ctx.beginPath(); ctx.moveTo(x+8,y+h*0.08); ctx.lineTo(x+w*0.6,y+h*0.08); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+5,y+h*0.28); ctx.lineTo(x+w*0.5,y+h*0.28); ctx.stroke();
    }},
];

// ==================== 关卡配置 ====================
var ROOMS = [
  { id:'livingroom', name:'客厅', emoji:'🛋️', desc:'温馨客厅，猫咪入门级',
    catCount:2, lives:3, behaviorMult:1.0, envDistraction:0.2,
    hintDelay:20, fakeWobbleInterval:[12,25], wobbleStrengthMult:1.2,
    items:ITEM_TEMPLATES, disguises:CAT_DISGUISE_TEMPLATES, bgType:'livingroom' },
  { id:'kitchen', name:'厨房', emoji:'🍳', desc:'美食飘香，猫咪更机警',
    catCount:3, lives:3, behaviorMult:1.2, envDistraction:0.5,
    hintDelay:18, fakeWobbleInterval:[8,20], wobbleStrengthMult:1.0,
    items:KITCHEN_ITEMS, disguises:KITCHEN_DISGUISES, bgType:'kitchen' },
  { id:'bedroom', name:'卧室', emoji:'🛏️', desc:'安静卧室，狡猾猫出没',
    catCount:3, lives:2, behaviorMult:1.5, envDistraction:0.8,
    hintDelay:12, fakeWobbleInterval:[5,15], wobbleStrengthMult:0.7,
    items:BEDROOM_ITEMS, disguises:BEDROOM_DISGUISES, bgType:'bedroom' },
  { id:'bathroom', name:'浴室', emoji:'🛁', desc:'水汽弥漫，猫咪隐匿',
    catCount:3, lives:3, behaviorMult:1.3, envDistraction:0.6,
    hintDelay:16, fakeWobbleInterval:[12,22], wobbleStrengthMult:0.85,
    items:BATHROOM_ITEMS, disguises:BATHROOM_DISGUISES, bgType:'bathroom' },
  { id:'study', name:'书房', emoji:'📚', desc:'书海迷宫，大师级挑战',
    catCount:4, lives:2, behaviorMult:2.0, envDistraction:1.0,
    hintDelay:25, fakeWobbleInterval:[5,12], wobbleStrengthMult:0.65,
    items:STUDY_ITEMS, disguises:STUDY_DISGUISES, bgType:'study' },
];

// ==================== 房间布局系统 ====================
var ROOM_LAYOUTS = {
  livingroom: {
    bookshelf:{x:140, y:412}, tv:{x:540, y:340}, tv_stand:{x:540, y:412},
    plant:{x:660, y:415}, vase:{x:490, y:380, depth:412}, fishbowl:{x:610, y:378, depth:412},
    clock:{x:375, y:180}, frame:{x:200, y:220}, mirror:{x:480, y:200},
    sofa:{x:320, y:490}, lamp:{x:140, y:485},
    pillow:{x:260, y:480, depth:489}, teddy:{x:395, y:485, depth:489},
    table:{x:340, y:535}, chair:{x:560, y:520},
    cup:{x:360, y:510, depth:535}, remote:{x:320, y:512, depth:535},
    candle:{x:380, y:508, depth:535}, books:{x:300, y:514, depth:535},
    rug:{x:340, y:560, depth:470},
    basket:{x:120, y:690}, shoe:{x:360, y:710},
    umbrella:{x:620, y:685}, trashbin:{x:580, y:715},
  },
  livingroom_extra: [
    {x:200, y:560}, {x:460, y:480}, {x:600, y:600}, {x:280, y:650},
    {x:500, y:680}, {x:160, y:620}, {x:440, y:440}, {x:650, y:540},
  ],
  kitchen: {
    k_counter:{x:170, y:412}, k_sink:{x:320, y:412}, stove:{x:460, y:412}, fridge:{x:640, y:412},
    microwave:{x:135, y:378, depth:412}, toaster:{x:210, y:382, depth:412},
    kettle:{x:270, y:376, depth:412}, cutting_board:{x:360, y:380, depth:412},
    pot:{x:440, y:378, depth:412}, pan:{x:500, y:382, depth:412},
    k_stool:{x:350, y:530}, fruit_bowl:{x:300, y:490},
  },
  kitchen_extra: [
    {x:240, y:530}, {x:500, y:540}, {x:180, y:580}, {x:420, y:600}, {x:580, y:560},
  ],
  bedroom: {
    wardrobe:{x:140, y:412}, b_desk:{x:560, y:412}, poster:{x:370, y:195},
    headphones:{x:600, y:378, depth:412}, tissue_box:{x:530, y:382, depth:412},
    bed:{x:300, y:540}, nightstand:{x:140, y:530}, b_chair:{x:530, y:520},
    b_rug:{x:320, y:600, depth:500},
    backpack:{x:480, y:590}, b_slippers:{x:350, y:690}, clothes_pile:{x:200, y:630},
  },
  bedroom_extra: [
    {x:420, y:510}, {x:200, y:600}, {x:580, y:590}, {x:340, y:520}, {x:520, y:670}, {x:160, y:670},
  ],
  bathroom: {
    bathtub:{x:400, y:490}, toilet:{x:140, y:520}, sink_bath:{x:320, y:412},
    shower:{x:600, y:412}, bath_shelf:{x:170, y:412},
    towel_rack:{x:520, y:340}, bath_mat:{x:350, y:600, depth:500},
    laundry_basket:{x:560, y:620},
  },
  bathroom_extra: [
    {x:250, y:540}, {x:480, y:530}, {x:160, y:620}, {x:380, y:680}, {x:600, y:560},
    {x:300, y:450}, {x:520, y:460}, {x:200, y:700},
  ],
  study: {
    s_desk:{x:375, y:412}, s_bookcase:{x:140, y:412}, s_chair:{x:400, y:510},
    s_lamp:{x:280, y:378, depth:412}, globe_study:{x:530, y:378, depth:412},
    filing_cabinet:{x:600, y:530}, s_rug:{x:350, y:580, depth:490},
    s_window_plant:{x:480, y:380, depth:412},
  },
  study_extra: [
    {x:260, y:530}, {x:500, y:540}, {x:180, y:600}, {x:420, y:620}, {x:600, y:600},
    {x:340, y:470}, {x:560, y:470}, {x:200, y:680}, {x:480, y:700},
  ],
};

// ==================== 背景绘制函数 ====================

function drawPerspectiveRoom(ctx, sideWall, backWall, floorColor, floorColor2, ceilingColor) {
  ctx.fillStyle = ceilingColor;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // 地板
  ctx.beginPath();
  ctx.moveTo(BACK_L, BACK_B); ctx.lineTo(BACK_R, BACK_B);
  ctx.lineTo(VIEW_W, FLOOR_B); ctx.lineTo(0, FLOOR_B);
  ctx.closePath();
  var fg = ctx.createLinearGradient(0, BACK_B, 0, FLOOR_B);
  fg.addColorStop(0, floorColor2); fg.addColorStop(1, floorColor);
  ctx.fillStyle = fg; ctx.fill();
  // 左墙
  ctx.beginPath();
  ctx.moveTo(BACK_L, BACK_T); ctx.lineTo(0, 0);
  ctx.lineTo(0, FLOOR_B); ctx.lineTo(BACK_L, BACK_B);
  ctx.closePath();
  var lg = ctx.createLinearGradient(0, 0, BACK_L, 0);
  lg.addColorStop(0, sideWall); lg.addColorStop(1, backWall);
  ctx.fillStyle = lg; ctx.fill();
  // 右墙
  ctx.beginPath();
  ctx.moveTo(BACK_R, BACK_T); ctx.lineTo(VIEW_W, 0);
  ctx.lineTo(VIEW_W, FLOOR_B); ctx.lineTo(BACK_R, BACK_B);
  ctx.closePath();
  var rg = ctx.createLinearGradient(VIEW_W, 0, BACK_R, 0);
  rg.addColorStop(0, sideWall); rg.addColorStop(1, backWall);
  ctx.fillStyle = rg; ctx.fill();
  // 后墙
  ctx.fillStyle = backWall;
  ctx.fillRect(BACK_L, BACK_T, BACK_R - BACK_L, BACK_B - BACK_T);
  // 天花板
  ctx.beginPath();
  ctx.moveTo(BACK_L, BACK_T); ctx.lineTo(BACK_R, BACK_T);
  ctx.lineTo(VIEW_W, 0); ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = ceilingColor; ctx.fill();
  // 边线
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(BACK_L, BACK_T, BACK_R - BACK_L, BACK_B - BACK_T);
  ctx.beginPath();
  ctx.moveTo(BACK_L, BACK_T); ctx.lineTo(0, 0);
  ctx.moveTo(BACK_R, BACK_T); ctx.lineTo(VIEW_W, 0);
  ctx.moveTo(BACK_L, BACK_B); ctx.lineTo(0, FLOOR_B);
  ctx.moveTo(BACK_R, BACK_B); ctx.lineTo(VIEW_W, FLOOR_B);
  ctx.stroke();
}

function drawWoodPlanks(ctx, dark, light, num) {
  ctx.save();
  for (var i = 0; i <= num; i++) {
    var u = i / num;
    var topX = BACK_L + (BACK_R - BACK_L) * u;
    var botX = VIEW_W * u;
    ctx.strokeStyle = (i % 2 === 0) ? dark : light;
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(topX, BACK_B); ctx.lineTo(botX, FLOOR_B); ctx.stroke();
  }
  ctx.strokeStyle = dark; ctx.lineWidth = 0.3;
  for (var r = 1; r < 7; r++) {
    var t = r / 7;
    var y = BACK_B + (FLOOR_B - BACK_B) * t;
    var xl = BACK_L + (0 - BACK_L) * t;
    var xr = BACK_R + (VIEW_W - BACK_R) * t;
    ctx.beginPath(); ctx.moveTo(xl, y); ctx.lineTo(xr, y); ctx.stroke();
  }
  ctx.restore();
}

function drawFloorGrid(ctx, lineColor, rows, cols) {
  ctx.save();
  ctx.strokeStyle = lineColor; ctx.lineWidth = 0.5;
  for (var i = 1; i < rows; i++) {
    var t = i / rows;
    var y = BACK_B + (FLOOR_B - BACK_B) * t;
    var xl = BACK_L + (0 - BACK_L) * t;
    var xr = BACK_R + (VIEW_W - BACK_R) * t;
    ctx.beginPath(); ctx.moveTo(xl, y); ctx.lineTo(xr, y); ctx.stroke();
  }
  for (var j = 1; j < cols; j++) {
    var u = j / cols;
    ctx.beginPath();
    ctx.moveTo(BACK_L + (BACK_R - BACK_L) * u, BACK_B);
    ctx.lineTo(VIEW_W * u, FLOOR_B);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWindow(ctx, lPct, rPct, tPct, bPct, skyColor, isNight) {
  var wL = BACK_L + (BACK_R - BACK_L) * lPct;
  var wR = BACK_L + (BACK_R - BACK_L) * rPct;
  var wT = BACK_T + (BACK_B - BACK_T) * tPct;
  var wB = BACK_T + (BACK_B - BACK_T) * bPct;
  var wW = wR - wL, wH = wB - wT;
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(wL - 4, wT - 4, wW + 8, wH + 8);
  ctx.fillStyle = skyColor;
  ctx.fillRect(wL, wT, wW, wH);
  ctx.save();
  ctx.beginPath(); ctx.rect(wL, wT, wW, wH); ctx.clip();
  if (!isNight) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    var ct1 = ((Date.now() / 18000) % 1.4) - 0.2;
    var cx1 = wL + ct1 * wW, cy1 = wT + wH * 0.25;
    ctx.beginPath(); ctx.arc(cx1,cy1,7,0,Math.PI*2); ctx.arc(cx1+9,cy1-3,5,0,Math.PI*2); ctx.arc(cx1+16,cy1,6,0,Math.PI*2); ctx.fill();
    var ct2 = ((Date.now() / 25000 + 0.5) % 1.4) - 0.2;
    var cx2 = wL + ct2 * wW, cy2 = wT + wH * 0.55;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(cx2,cy2,5,0,Math.PI*2); ctx.arc(cx2+8,cy2-2,4,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255,255,220,0.4)';
    for (var si=0; si<5; si++) {
      var starX = wL + ((si*137+50) % wW);
      var starY = wT + ((si*89+20) % wH);
      var twinkle = 0.2 + Math.sin(Date.now()/600 + si*2) * 0.3;
      ctx.globalAlpha = twinkle;
      ctx.beginPath(); ctx.arc(starX, starY, 1.2, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(wL, wT, wW * 0.4, wH);
  ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3;
  var mx = (wL + wR) / 2, my = (wT + wB) / 2;
  ctx.beginPath(); ctx.moveTo(mx, wT); ctx.lineTo(mx, wB); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wL, my); ctx.lineTo(wR, my); ctx.stroke();
  // 窗帘
  var curtColor = isNight ? 'rgba(120,100,140,0.75)' : 'rgba(180,140,90,0.7)';
  var curtW = wW * 0.18;
  ctx.fillStyle = curtColor;
  ctx.beginPath();
  ctx.moveTo(wL - 6, wT - 10); ctx.lineTo(wL + curtW, wT - 10);
  ctx.quadraticCurveTo(wL + curtW - 4, my, wL + curtW + 4, wB + 6);
  ctx.lineTo(wL - 6, wB + 6); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(wR + 6, wT - 10); ctx.lineTo(wR - curtW, wT - 10);
  ctx.quadraticCurveTo(wR - curtW + 4, my, wR - curtW - 4, wB + 6);
  ctx.lineTo(wR + 6, wB + 6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(wL + curtW * 0.5, wT); ctx.lineTo(wL + curtW * 0.5, wB + 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wR - curtW * 0.5, wT); ctx.lineTo(wR - curtW * 0.5, wB + 4); ctx.stroke();
  ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(wL - 16, wT - 12); ctx.lineTo(wR + 16, wT - 12); ctx.stroke();
  ctx.fillStyle = '#6a5a4a';
  ctx.beginPath(); ctx.arc(wL - 16, wT - 12, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(wR + 16, wT - 12, 4, 0, Math.PI*2); ctx.fill();
  // 地板光斑
  ctx.save();
  ctx.globalAlpha = isNight ? 0.04 : 0.07;
  ctx.fillStyle = isNight ? '#aaaadd' : '#ffdd88';
  ctx.beginPath();
  ctx.moveTo(wL, BACK_B); ctx.lineTo(wR, BACK_B);
  ctx.lineTo(wR + (FLOOR_B - BACK_B) * 0.35, FLOOR_B - 50);
  ctx.lineTo(wL - (FLOOR_B - BACK_B) * 0.08, FLOOR_B - 50);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  return {l:wL, r:wR, t:wT, b:wB};
}

function drawCeilingLight(ctx) {
  var cx = (BACK_L + BACK_R) / 2, cy = BACK_T - 5;
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, BACK_T - 45); ctx.lineTo(cx, cy); ctx.stroke();
  ctx.fillStyle = '#e8d8b0';
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy);
  ctx.lineTo(cx + 13, cy + 15); ctx.lineTo(cx - 13, cy + 15);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 1; ctx.stroke();
  ctx.save();
  var glow = ctx.createRadialGradient(cx, cy + 12, 4, cx, cy + 12, 140);
  glow.addColorStop(0, 'rgba(255,220,150,0.14)');
  glow.addColorStop(0.5, 'rgba(255,210,130,0.05)');
  glow.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 140, cy - 30, 280, 180);
  ctx.restore();
}

function drawBaseboard(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(BACK_L, BACK_B - 12, BACK_R - BACK_L, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(BACK_L, BACK_B - 12, BACK_R - BACK_L, 2);
  var wainY = BACK_T + (BACK_B - BACK_T) * 0.55;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(BACK_L, wainY); ctx.lineTo(BACK_R, wainY); ctx.stroke();
}

function drawWarmGlow(ctx, x, y, radius, color) {
  ctx.save();
  var g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawLivingroomBg(ctx) {
  drawPerspectiveRoom(ctx, '#7a6e5e', '#8a7d6e', '#9a7e58', '#8a7050', '#4a4038');
  drawWoodPlanks(ctx, 'rgba(60,40,20,0.07)', 'rgba(60,40,20,0.03)', 12);
  drawWindow(ctx, 0.12, 0.38, 0.12, 0.60, '#6699bb', false);
  drawBaseboard(ctx, '#5a4a3a');
  drawCeilingLight(ctx);
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  var wainY = BACK_T + (BACK_B - BACK_T) * 0.55;
  ctx.fillRect(BACK_L, wainY, BACK_R - BACK_L, BACK_B - wainY - 12);
  var glowPulse = 1.0 + Math.sin(Date.now() / 2000) * 0.08;
  drawWarmGlow(ctx, 140, 510, 130 * glowPulse, 'rgba(255,200,100,0.06)');
}

function drawKitchenBg(ctx) {
  drawPerspectiveRoom(ctx, '#c8b898', '#ddd0b8', '#c0a878', '#b09868', '#d8ccb0');
  drawFloorGrid(ctx, 'rgba(100,80,50,0.06)', 10, 10);
  ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 0.5;
  for (var t = 0; t < (BACK_B - BACK_T); t += 25) {
    ctx.beginPath(); ctx.moveTo(BACK_L, BACK_T + t); ctx.lineTo(BACK_R, BACK_T + t); ctx.stroke();
  }
  for (var s = 0; s < (BACK_R - BACK_L); s += 35) {
    ctx.beginPath(); ctx.moveTo(BACK_L + s, BACK_T); ctx.lineTo(BACK_L + s, BACK_B); ctx.stroke();
  }
  drawWindow(ctx, 0.35, 0.62, 0.10, 0.50, '#88bbdd', false);
  drawBaseboard(ctx, '#a09078');
  drawCeilingLight(ctx);
}

function drawBedroomBg(ctx) {
  drawPerspectiveRoom(ctx, '#6a6080', '#7a7090', '#7a6858', '#6a5848', '#3a3248');
  drawWoodPlanks(ctx, 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.02)', 10);
  ctx.fillStyle = 'rgba(255,255,200,0.06)';
  for (var si = 0; si < 25; si++) {
    var sx = BACK_L + 15 + ((si * 47) % (BACK_R - BACK_L - 30));
    var sy = BACK_T + 12 + ((si * 31) % (BACK_B - BACK_T - 24));
    var sr = 0.8 + (si % 4) * 0.5;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
  }
  var win = drawWindow(ctx, 0.55, 0.82, 0.10, 0.55, '#223355', true);
  var moonX = win.l + (win.r - win.l) * 0.3, moonY = win.t + (win.b - win.t) * 0.3;
  ctx.beginPath(); ctx.arc(moonX, moonY, 10, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,200,0.5)'; ctx.fill();
  ctx.save();
  var mg = ctx.createRadialGradient(moonX, moonY, 3, moonX, moonY, 60);
  mg.addColorStop(0, 'rgba(220,220,255,0.10)');
  mg.addColorStop(1, 'rgba(220,220,255,0)');
  ctx.fillStyle = mg;
  ctx.fillRect(moonX - 60, moonY - 60, 120, 120);
  ctx.restore();
  drawBaseboard(ctx, '#5a5040');
  drawCeilingLight(ctx);
  var glowPulse2 = 1.0 + Math.sin(Date.now() / 2500) * 0.06;
  drawWarmGlow(ctx, 140, 530, 110 * glowPulse2, 'rgba(255,190,100,0.06)');
}

function drawBathroomBg(ctx) {
  drawPerspectiveRoom(ctx, '#a8c8d8', '#b8d8e8', '#d0dde8', '#c0ccd8', '#8ab0c8');
  // 瓷砖墙（后墙格子）
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.5;
  for (var ty = 0; ty < (BACK_B - BACK_T); ty += 30) {
    ctx.beginPath(); ctx.moveTo(BACK_L, BACK_T + ty); ctx.lineTo(BACK_R, BACK_T + ty); ctx.stroke();
  }
  for (var tx = 0; tx < (BACK_R - BACK_L); tx += 40) {
    ctx.beginPath(); ctx.moveTo(BACK_L + tx, BACK_T); ctx.lineTo(BACK_L + tx, BACK_B); ctx.stroke();
  }
  // 地砖
  drawFloorGrid(ctx, 'rgba(0,0,0,0.06)', 8, 8);
  // 小窗（毛玻璃感）
  var wL = BACK_L + (BACK_R - BACK_L) * 0.38;
  var wR = BACK_L + (BACK_R - BACK_L) * 0.62;
  var wT = BACK_T + (BACK_B - BACK_T) * 0.08;
  var wB = BACK_T + (BACK_B - BACK_T) * 0.40;
  ctx.fillStyle = '#5a4a3a'; ctx.fillRect(wL - 3, wT - 3, wR - wL + 6, wB - wT + 6);
  ctx.fillStyle = 'rgba(200,230,255,0.5)'; ctx.fillRect(wL, wT, wR - wL, wB - wT);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(wL, wT, (wR - wL) * 0.4, wB - wT);
  // 水汽效果
  ctx.save(); ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#fff';
  for (var si = 0; si < 15; si++) {
    var sx = BACK_L + 20 + ((si * 53) % (BACK_R - BACK_L - 40));
    var sy = BACK_T + 30 + ((si * 37) % (BACK_B - BACK_T));
    var sr = 15 + (si % 5) * 8;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
  drawBaseboard(ctx, '#90a8b8');
  drawCeilingLight(ctx);
}

function drawStudyBg(ctx) {
  drawPerspectiveRoom(ctx, '#5a4a38', '#6a5a48', '#6a5838', '#5a4828', '#3a3028');
  drawWoodPlanks(ctx, 'rgba(40,25,10,0.08)', 'rgba(40,25,10,0.04)', 10);
  // 壁纸花纹
  ctx.fillStyle = 'rgba(180,150,100,0.06)';
  for (var pi = 0; pi < 20; pi++) {
    var px = BACK_L + 20 + ((pi * 41) % (BACK_R - BACK_L - 40));
    var py = BACK_T + 15 + ((pi * 29) % (BACK_B - BACK_T - 30));
    ctx.font = '8px serif'; ctx.fillText('❖', px, py);
  }
  // 窗户
  drawWindow(ctx, 0.60, 0.85, 0.10, 0.55, '#6699bb', false);
  drawBaseboard(ctx, '#4a3a28');
  drawCeilingLight(ctx);
  // 暖光（台灯光晕）
  var glowPulse = 1.0 + Math.sin(Date.now() / 2200) * 0.06;
  drawWarmGlow(ctx, 300, 420, 120 * glowPulse, 'rgba(255,210,120,0.06)');
}

function drawRoomBackground(ctx, bgType) {
  if (bgType === 'kitchen') return drawKitchenBg(ctx);
  if (bgType === 'bedroom') return drawBedroomBg(ctx);
  if (bgType === 'bathroom') return drawBathroomBg(ctx);
  if (bgType === 'study') return drawStudyBg(ctx);
  return drawLivingroomBg(ctx);
}

module.exports = {
  VIEW_W: VIEW_W,
  VIEW_H: VIEW_H,
  BACK_L: BACK_L,
  BACK_R: BACK_R,
  BACK_T: BACK_T,
  BACK_B: BACK_B,
  FLOOR_B: FLOOR_B,
  ITEM_SCALE: ITEM_SCALE,
  CAT_COLORS: CAT_COLORS,
  getItemScale: getItemScale,
  ROOMS: ROOMS,
  ROOM_LAYOUTS: ROOM_LAYOUTS,
  drawRoomBackground: drawRoomBackground,
  CAT_DISGUISE_TEMPLATES: CAT_DISGUISE_TEMPLATES,
  KITCHEN_DISGUISES: KITCHEN_DISGUISES,
  BEDROOM_DISGUISES: BEDROOM_DISGUISES,
  BATHROOM_DISGUISES: BATHROOM_DISGUISES,
  STUDY_DISGUISES: STUDY_DISGUISES,
};
