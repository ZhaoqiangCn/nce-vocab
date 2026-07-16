const TOTAL_WORDS=UNITS.reduce((s,u)=>s+u.w.length,0);
function englishNoteKey(text){return String(text).toLowerCase().replace(/[^a-z]/g,'')}
const NOTE_HINTS=(()=>{
  const m=new Map();
  UNITS.forEach(u=>u.w.forEach(w=>{
    const key=englishNoteKey(w[0]);
    if(key&&!m.has(key))m.set(key,w[2]);
  }));
  return m;
})();
const NOTE_MAX_HINT_WORDS=UNITS.reduce((max,u)=>Math.max(max,...u.w.map(w=>String(w[0]).trim().split(/\s+/).length)),1);



/* ================= 状态存取 ================= */
const KEY='nce1_progress_v1';
const STATE_VERSION=6;
let ROOT,S;
const SKINS=[
  {id:'default',name:'方块小狐狸',rarity:'普通',cost:0,theme:'default',desc:'经典方块背包'},
  {id:'grass',name:'草地方块探险家',rarity:'普通',theme:'grass',desc:'草块帽和绿披风'},
  {id:'mine',name:'矿洞小勇士',rarity:'稀有',theme:'mine',desc:'矿灯和岩石护甲'},
  {id:'snow',name:'雪原建造师',rarity:'稀有',theme:'snow',desc:'冰晶帽和雪块披风'},
  {id:'lava',name:'熔岩守护者',rarity:'史诗',theme:'lava',desc:'熔岩边框和火光护符'},
  {id:'sky',name:'天空岛飞行员',rarity:'稀有',theme:'sky',desc:'云朵翼和蓝天背包'},
  {id:'circuit',name:'红石工程师',rarity:'史诗',theme:'circuit',desc:'机关线圈和按钮徽章'},
  {id:'crystal',name:'晶石学霸',rarity:'史诗',theme:'crystal',desc:'晶洞光翼和紫晶帽'},
  {id:'castle',name:'黄金城堡',rarity:'传说',theme:'castle',desc:'金砖王冠和城堡披风'},
  {id:'ender',name:'末影星空',rarity:'传说',theme:'ender',desc:'深空披风和传送光环'},
  {id:'library',name:'图书馆法师',rarity:'稀有',theme:'library',desc:'书页斗篷和知识徽章'},
  {id:'diamond',name:'钻石护卫',rarity:'传说',theme:'diamond',desc:'钻石护甲和守护光翼'}
];
const SKIN_MAP=Object.fromEntries(SKINS.map(s=>[s.id,s]));
const SKIN_ALIASES={forest:'grass',ocean:'sky',star:'ender',candy:'library',gold:'castle'};
const MATERIALS=[
  {id:'wood',name:'木头',short:'木',color:'#b77836'},
  {id:'stone',name:'石头',short:'石',color:'#7f8a99'},
  {id:'grass',name:'草块',short:'草',color:'#49a24a'},
  {id:'snow',name:'雪块',short:'雪',color:'#95d9ff'},
  {id:'crystal',name:'晶石',short:'晶',color:'#8c6bff'},
  {id:'stardust',name:'星尘',short:'星',color:'#f0b92f'}
];
const MATERIAL_MAP=Object.fromEntries(MATERIALS.map(m=>[m.id,m]));
const BUILD_ITEMS=[
  {id:'grass_tile',name:'草地方块',kind:'tile',rarity:'普通',cost:{grass:1},unlock:true,desc:'给小岛铺一块草地'},
  {id:'wood_house',name:'木头小屋',kind:'building',rarity:'普通',cost:{wood:6,stone:2},unlock:true,desc:'第一座学习小屋'},
  {id:'tree',name:'方块树',kind:'decor',rarity:'普通',cost:{wood:3,grass:2},desc:'让小岛更有生气'},
  {id:'bridge',name:'木桥',kind:'decor',rarity:'稀有',cost:{wood:5,stone:1},desc:'连接两片学习区域'},
  {id:'bookshelf',name:'书架',kind:'building',rarity:'稀有',cost:{wood:4,crystal:1},desc:'收藏学过的知识'},
  {id:'word_monument',name:'单词碑',kind:'building',rarity:'稀有',cost:{stone:5,crystal:2},earned:true,gate:'完成整课后解锁',desc:'纪念完成的单词'},
  {id:'review_tower',name:'复习塔',kind:'building',rarity:'史诗',cost:{stone:6,snow:4,crystal:2},desc:'提醒定期复习'},
  {id:'wrong_furnace',name:'错题熔炉',kind:'building',rarity:'史诗',cost:{stone:6,crystal:2,stardust:1},earned:true,gate:'错题复仇全对后解锁',desc:'把错题炼成材料'},
  {id:'star_fountain',name:'星星喷泉',kind:'decor',rarity:'传说',cost:{crystal:5,stardust:5},desc:'小岛中心装饰'},
  {id:'pet_den',name:'宠物窝',kind:'building',rarity:'传说',cost:{wood:8,grass:4,stardust:3},desc:'学习伙伴休息的地方'}
];
const BUILD_MAP=Object.fromEntries(BUILD_ITEMS.map(b=>[b.id,b]));
function skinArt(id,cls){
  const theme=(SKIN_MAP[id]||SKIN_MAP.default).theme;
  const cfg={
    default:{bg:'#fff3df',accent:'#ffb14d',hat:'#ffd34d',wing:''},
    grass:{bg:'#ddf3c9',accent:'#49a24a',hat:'#5fbf55',wing:'#a7dc72'},
    mine:{bg:'#e2e6ed',accent:'#6f7f91',hat:'#707784',wing:'#9aa4b5'},
    snow:{bg:'#e4f8ff',accent:'#57b8e8',hat:'#bdefff',wing:'#d6f7ff'},
    lava:{bg:'#ffe2c8',accent:'#ef5b2a',hat:'#ff7a2f',wing:'#ffb34a'},
    sky:{bg:'#ddf3ff',accent:'#4facfe',hat:'#9de2ff',wing:'#c8f1ff'},
    circuit:{bg:'#ffe2e2',accent:'#d83b3b',hat:'#333b4d',wing:'#ff7a7a'},
    crystal:{bg:'#eee5ff',accent:'#8c6bff',hat:'#b19cff',wing:'#d8c9ff'},
    castle:{bg:'#fff0bf',accent:'#d69a00',hat:'#ffd34d',wing:'#ffe08a'},
    ender:{bg:'#e4dcff',accent:'#5e43bd',hat:'#1e2540',wing:'#9d7dff'},
    library:{bg:'#fff0d6',accent:'#8d5a2b',hat:'#b77836',wing:'#e8c88f'},
    diamond:{bg:'#dcfbff',accent:'#24b6c9',hat:'#8df3ff',wing:'#b6f8ff'}
  }[theme];
  const wing=cfg.wing?`<rect x="18" y="53" width="22" height="27" rx="4" fill="${cfg.wing}" stroke="#40516d" stroke-width="3"/><rect x="80" y="53" width="22" height="27" rx="4" fill="${cfg.wing}" stroke="#40516d" stroke-width="3"/>`:'';
  return `<svg class="${cls||'skin-svg'} ${theme}" viewBox="0 0 120 120" aria-hidden="true">
    <rect x="6" y="6" width="108" height="108" rx="28" fill="${cfg.bg}"/>
    ${wing}
    <rect x="34" y="46" width="52" height="44" rx="8" fill="#f79037" stroke="#8a4a24" stroke-width="4"/>
    <rect x="40" y="28" width="18" height="23" rx="3" fill="#f79037" stroke="#8a4a24" stroke-width="4"/>
    <rect x="62" y="28" width="18" height="23" rx="3" fill="#f79037" stroke="#8a4a24" stroke-width="4"/>
    <rect x="43" y="66" width="34" height="19" rx="5" fill="#fff1df"/>
    <rect x="47" y="57" width="8" height="8" rx="2" fill="#2b2630"/><rect x="65" y="57" width="8" height="8" rx="2" fill="#2b2630"/>
    <path d="M57 72h6" stroke="#62351d" stroke-width="3" stroke-linecap="round"/>
    <rect x="42" y="36" width="36" height="13" rx="3" fill="${cfg.hat}" stroke="#40516d" stroke-width="3"/>
    <rect x="52" y="84" width="16" height="16" rx="4" fill="${cfg.accent}" stroke="#fff" stroke-width="3"/>
    <path d="M60 88l2 4 4 .5-3 2.5.8 4-3.8-2-3.8 2 .8-4-3-2.5 4-.5z" fill="#fff7bf"/>
  </svg>`;
}
function defaultParentStats(){
  return {totalSec:0,sessions:0,answers:0,correct:0,days:{},units:{}};
}
function defaultRewards(){
  return {coins:80,inventory:['default'],equipped:'default',gacha:{pulls:0,pity:0,history:[],daily:{}}};
}
function defaultBuild(){
  return {materials:{wood:0,stone:0,grass:0,snow:0,crystal:0,stardust:0},island:{size:8,tiles:[]},unlockedBlocks:['grass_tile','wood_house'],placed:[],starterClaimed:false};
}
function defaultState(){
  return {v:STATE_VERSION,w:{},notes:{},xp:0,badges:[],days:{},streak:0,lastDay:null,rev:0,combo:0,bestCombo:0,set:{n:10,rate:0.85,sound:true,kbMode:false,gachaOn:true,dailyPullLimit:3},shields:0,shieldDate:null,missions:null,wrongPool:{},sprintBest:0,revengeFixed:0,tierBadges:{},blindDone:0,blindHighScore:0,parent:defaultParentStats(),rewards:defaultRewards(),build:defaultBuild()};
}
function normalizeRewards(raw){
  const d=defaultRewards();
  const r=Object.assign(d,raw&&typeof raw==='object'?raw:{});
  r.coins=Number.isFinite(r.coins)?Math.max(0,Math.round(r.coins)):d.coins;
  r.inventory=Array.isArray(r.inventory)?r.inventory.map(id=>SKIN_ALIASES[id]||id).filter(id=>SKIN_MAP[id]):['default'];
  if(!r.inventory.includes('default'))r.inventory.unshift('default');
  r.inventory=[...new Set(r.inventory)];
  r.equipped=SKIN_ALIASES[r.equipped]||r.equipped;
  r.equipped=SKIN_MAP[r.equipped]&&r.inventory.includes(r.equipped)?r.equipped:'default';
  r.gacha=Object.assign({pulls:0,pity:0,history:[]},r.gacha&&typeof r.gacha==='object'?r.gacha:{});
  r.gacha.pulls=Number.isFinite(r.gacha.pulls)?Math.max(0,Math.round(r.gacha.pulls)):0;
  r.gacha.pity=Number.isFinite(r.gacha.pity)?Math.max(0,Math.round(r.gacha.pity)):0;
  r.gacha.history=Array.isArray(r.gacha.history)?r.gacha.history.slice(0,30):[];
  r.gacha.daily=r.gacha.daily&&typeof r.gacha.daily==='object'?r.gacha.daily:{};
  return r;
}
function normalizeBuild(raw){
  const b=Object.assign(defaultBuild(),raw&&typeof raw==='object'?raw:{});
  const def=defaultBuild();
  b.materials=Object.assign({},def.materials,b.materials||{});
  MATERIALS.forEach(m=>{b.materials[m.id]=Number.isFinite(b.materials[m.id])?Math.max(0,Math.round(b.materials[m.id])):0});
  b.island=Object.assign({},def.island,b.island||{});
  b.island.size=Number.isFinite(b.island.size)?Math.min(12,Math.max(6,Math.round(b.island.size))):8;
  b.island.tiles=Array.isArray(b.island.tiles)?b.island.tiles.filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)):[];
  b.unlockedBlocks=Array.isArray(b.unlockedBlocks)?b.unlockedBlocks.filter(id=>BUILD_MAP[id]):def.unlockedBlocks.slice();
  b.unlockedBlocks=[...new Set(b.unlockedBlocks.concat(def.unlockedBlocks))];
  b.placed=Array.isArray(b.placed)?b.placed.filter(p=>BUILD_MAP[p.itemId]&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({id:p.id||buildPlacedId(),itemId:p.itemId,x:Math.round(p.x),y:Math.round(p.y),level:Math.min(3,Math.max(1,Math.round(p.level||1)))})):[];
  b.starterClaimed=!!b.starterClaimed;
  return b;
}
function normalizeParentStats(raw,legacy){
  const p=Object.assign(defaultParentStats(),raw&&typeof raw==='object'?raw:{});
  p.totalSec=Number.isFinite(p.totalSec)?Math.max(0,Math.round(p.totalSec)):0;
  p.sessions=Number.isFinite(p.sessions)?Math.max(0,Math.round(p.sessions)):0;
  p.answers=Number.isFinite(p.answers)?Math.max(0,Math.round(p.answers)):0;
  p.correct=Number.isFinite(p.correct)?Math.max(0,Math.round(p.correct)):0;
  p.days=p.days&&typeof p.days==='object'?p.days:{};
  p.units=p.units&&typeof p.units==='object'?p.units:{};
  if(!raw&&legacy){
    let r=0,w=0;
    Object.values(legacy.days||{}).forEach(d=>{r+=Number(d.r)||0;w+=Number(d.w)||0});
    p.answers=r+w;p.correct=r;
    Object.entries(legacy.w||{}).forEach(([id,st])=>{
      const ui=unitIndexFromId(id);
      if(ui===null)return;
      const u=ensureParentUnitIn(p,ui);
      const ok=Number(st&&st.r)||0,bad=Number(st&&st.wr)||0;
      u.answers+=ok+bad;u.correct+=ok;u.wrong+=bad;
    });
  }
  Object.keys(p.units).forEach(k=>{
    const u=Object.assign({answers:0,correct:0,wrong:0,sec:0,last:null},p.units[k]||{});
    u.answers=Number.isFinite(u.answers)?Math.max(0,Math.round(u.answers)):0;
    u.correct=Number.isFinite(u.correct)?Math.max(0,Math.round(u.correct)):0;
    u.wrong=Number.isFinite(u.wrong)?Math.max(0,Math.round(u.wrong)):0;
    u.sec=Number.isFinite(u.sec)?Math.max(0,Math.round(u.sec)):0;
    p.units[k]=u;
  });
  return p;
}
function ensureParentUnitIn(parent,ui){
  const key=String(ui);
  if(!parent.units[key])parent.units[key]={answers:0,correct:0,wrong:0,sec:0,last:null};
  return parent.units[key];
}
function migrateProfile(d){
  if(!d||typeof d!=='object'||!d.w)return null;
  const defaults=defaultState();
  const next=Object.assign({},defaults,d);
  next.v=STATE_VERSION;
  next.w=d.w&&typeof d.w==='object'?d.w:{};
  next.notes=d.notes&&typeof d.notes==='object'?d.notes:{};
  next.badges=Array.isArray(d.badges)?d.badges:[];
  next.days=d.days&&typeof d.days==='object'?d.days:{};
  next.set=Object.assign({},defaults.set,d.set||{});
  next.wrongPool=d.wrongPool&&typeof d.wrongPool==='object'?d.wrongPool:{};
  next.tierBadges=d.tierBadges&&typeof d.tierBadges==='object'?d.tierBadges:{};
  next.xp=Number.isFinite(next.xp)?next.xp:0;
  next.streak=Number.isFinite(next.streak)?next.streak:0;
  next.rev=Number.isFinite(next.rev)?next.rev:0;
  next.combo=Number.isFinite(next.combo)?next.combo:0;
  next.bestCombo=Number.isFinite(next.bestCombo)?next.bestCombo:0;
  next.shields=Number.isFinite(next.shields)?next.shields:0;
  next.sprintBest=Number.isFinite(next.sprintBest)?next.sprintBest:0;
  next.revengeFixed=Number.isFinite(next.revengeFixed)?next.revengeFixed:0;
  next.blindDone=Number.isFinite(next.blindDone)?next.blindDone:0;
  next.blindHighScore=Number.isFinite(next.blindHighScore)?next.blindHighScore:0;
  next.parent=normalizeParentStats(d.parent,d);
  next.rewards=normalizeRewards(d.rewards);
  next.build=normalizeBuild(d.build);
  return next;
}
function profileId(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function defaultRoot(profile){
  const id=profileId();
  return {v:STATE_VERSION,activeProfileId:id,profiles:{[id]:{id,name:'小朋友',avatar:'default',data:profile||defaultState()}}};
}
function migrateRoot(raw){
  if(!raw||typeof raw!=='object')return null;
  if(raw.profiles&&typeof raw.profiles==='object'){
    const root={v:STATE_VERSION,activeProfileId:raw.activeProfileId,profiles:{}};
    Object.entries(raw.profiles).forEach(([id,p])=>{
      const data=migrateProfile(p&&p.data?p.data:p);
      if(data)root.profiles[id]={id,name:(p&&p.name)||'小朋友',avatar:(p&&p.avatar)||'default',data};
    });
    const ids=Object.keys(root.profiles);
    if(!ids.length)return defaultRoot(defaultState());
    if(!root.profiles[root.activeProfileId])root.activeProfileId=ids[0];
    return root;
  }
  const profile=migrateProfile(raw);
  return profile?defaultRoot(profile):null;
}
function loadRoot(){try{return migrateRoot(JSON.parse(localStorage.getItem(KEY)))}catch(e){return null}}
ROOT=loadRoot()||defaultRoot(defaultState());
S=ROOT.profiles[ROOT.activeProfileId].data;
function activeProfile(){return ROOT.profiles[ROOT.activeProfileId]}
function save(){if(ROOT&&S){activeProfile().data=S;ROOT.v=STATE_VERSION;localStorage.setItem(KEY,JSON.stringify(ROOT))}}
save();
function todayStr(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return todayStr(d)}
const INTERVALS=[0,1,2,4,7,15,30,60]; // box 1..7

function markActivity(){
  const t=todayStr();
  if(S.lastDay!==t){
    const y=new Date();y.setDate(y.getDate()-1);
    S.streak=(S.lastDay===todayStr(y))?S.streak+1:1;
    S.lastDay=t;
  }
  if(!S.days[t])S.days[t]={n:0,rv:0,r:0,w:0};
  return S.days[t];
}
function unitIndexFromId(id){
  const m=String(id||'').match(/^(?:note-)?(\d+)-/);
  if(!m)return null;
  const ui=Number(m[1]);
  return Number.isInteger(ui)&&ui>=0&&ui<UNITS.length?ui:null;
}
function ensureParentStats(){
  S.parent=normalizeParentStats(S.parent,S);
  return S.parent;
}
function ensureParentUnit(ui){
  return ensureParentUnitIn(ensureParentStats(),ui);
}
function recordParentAnswer(item,ok){
  const ui=unitIndexFromId(item&&item.id);
  if(ui===null)return;
  const p=ensureParentStats();
  p.answers++;
  if(ok)p.correct++;
  const u=ensureParentUnit(ui);
  u.answers++;
  if(ok)u.correct++;
  else u.wrong++;
  u.last=todayStr();
  if(SES&&SES.unitHits)SES.unitHits[ui]=(SES.unitHits[ui]||0)+1;
}
function recordParentSession(session){
  if(!session||!session.startedAt)return;
  const total=(session.right||0)+(session.wrong||0);
  if(total<=0)return;
  const sec=Math.max(5,Math.min(7200,Math.round((Date.now()-session.startedAt)/1000)));
  const p=ensureParentStats();
  p.totalSec+=sec;
  p.sessions++;
  const t=todayStr();
  if(!p.days[t])p.days[t]={sec:0,sessions:0};
  p.days[t].sec+=sec;
  p.days[t].sessions++;
  const hits=session.unitHits||{};
  const hitTotal=Object.values(hits).reduce((s,n)=>s+n,0);
  Object.entries(hits).forEach(([ui,n])=>{
    const u=ensureParentUnit(+ui);
    u.sec+=hitTotal?Math.round(sec*n/hitTotal):0;
  });
}
function formatStudyTime(sec){
  sec=Math.max(0,Math.round(sec||0));
  if(sec<60)return sec+'秒';
  const min=Math.round(sec/60);
  if(min<60)return min+'分钟';
  const h=Math.floor(min/60),m=min%60;
  return m?h+'小时'+m+'分钟':h+'小时';
}
function parentAccuracy(correct,total){
  return total?Math.round(correct/total*100)+'%':'-';
}
function buildPlacedId(){return 'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function ensureBuild(){
  S.build=normalizeBuild(S.build);
  return S.build;
}
function materialText(cost){
  const parts=[];
  Object.entries(cost||{}).forEach(([id,n])=>parts.push(`${MATERIAL_MAP[id]?MATERIAL_MAP[id].short:id}${n}`));
  return parts.length?parts.join(' '):'免费';
}
function canAfford(cost){
  const b=ensureBuild();
  return Object.entries(cost||{}).every(([id,n])=>(b.materials[id]||0)>=n);
}
function spendMaterials(cost){
  if(!canAfford(cost))return false;
  const b=ensureBuild();
  Object.entries(cost||{}).forEach(([id,n])=>b.materials[id]-=n);
  return true;
}
function addMaterials(mat){
  const b=ensureBuild();
  Object.entries(mat||{}).forEach(([id,n])=>{if(MATERIAL_MAP[id])b.materials[id]=(b.materials[id]||0)+Math.max(0,Math.round(n))});
}
function claimStarterBuildPack(){
  const b=ensureBuild();
  if(b.starterClaimed){toast('新手礼包已经领过啦');return}
  addMaterials({wood:16,stone:8,grass:14,crystal:2});
  ensureBuild().starterClaimed=true;
  save();renderIslandPage();toast('已领取新手建造礼包');
}
function awardMaterials(reason,result){
  const right=(result&&result.right)||0,wrong=(result&&result.wrong)||0,mode=(result&&result.mode)||'learn';
  const mat={wood:Math.max(1,Math.floor(right/3)),grass:Math.max(0,Math.floor(right/4))};
  if(right>=5)mat.stone=(mat.stone||0)+1;
  if(mode==='blind'&&right>=10)mat.snow=(mat.snow||0)+Math.max(1,Math.floor(right/10));
  if(mode==='review'&&right>=8)mat.snow=(mat.snow||0)+1;
  if(mode==='review'||mode==='revenge')mat.crystal=(mat.crystal||0)+Math.max(1,Math.floor(right/6));
  if(mode==='note')mat.wood=(mat.wood||0)+1;
  if(wrong===0&&right>0)mat.stardust=(mat.stardust||0)+1;
  addMaterials(mat);
  return mat;
}
function unlockBuildItem(itemId){
  const b=ensureBuild();
  if(!BUILD_MAP[itemId])return false;
  if(!b.unlockedBlocks.includes(itemId))b.unlockedBlocks.push(itemId);
  return true;
}
function blueprintCost(item){
  if(item.rarity==='普通')return {wood:2,grass:2};
  if(item.rarity==='稀有')return {wood:4,stone:3};
  if(item.rarity==='史诗')return {stone:5,crystal:2};
  return {crystal:4,stardust:3};
}
function unlockBuildByMaterials(itemId){
  const item=BUILD_MAP[itemId];
  if(!item)return;
  if(ensureBuild().unlockedBlocks.includes(itemId)){selectBuildItem(itemId);return}
  if(item.earned){toast(item.gate||'需要完成学习目标解锁');return}
  const cost=blueprintCost(item);
  if(!spendMaterials(cost)){toast('解锁蓝图材料不够：'+materialText(cost));return}
  unlockBuildItem(itemId);
  save();renderBuildInventory();renderMaterialBar();toast('已解锁蓝图：'+item.name);
}
let SELECTED_BUILD_ITEM='grass_tile';
function selectBuildItem(itemId){
  if(!BUILD_MAP[itemId])return;
  SELECTED_BUILD_ITEM=itemId;
  renderBuildInventory();
}
function placedAt(x,y){
  return ensureBuild().placed.find(p=>p.x===x&&p.y===y);
}
function tileAt(x,y){
  return ensureBuild().island.tiles.find(t=>t.x===x&&t.y===y);
}
function placeBuildItem(itemId,x,y){
  const b=ensureBuild(),item=BUILD_MAP[itemId];
  if(!item)return;
  if(!b.unlockedBlocks.includes(itemId)){toast('还没有解锁这个蓝图');return}
  if(x<0||y<0||x>=b.island.size||y>=b.island.size)return;
  if(item.kind!=='tile'&&placedAt(x,y)){toast('这里已经有建筑啦');return}
  if(item.kind==='tile'&&tileAt(x,y)){toast('这块地已经铺好了');return}
  if(!spendMaterials(item.cost)){toast('材料不够：'+materialText(item.cost));return}
  const next=ensureBuild();
  if(item.kind==='tile')next.island.tiles.push({x,y,itemId});
  else next.placed.push({id:buildPlacedId(),itemId,x,y,level:1});
  save();renderIsland();renderBuildInventory();
}
function removeBuildItem(placedId){
  const b=ensureBuild();
  const idx=b.placed.findIndex(p=>p.id===placedId);
  if(idx<0)return;
  b.placed.splice(idx,1);
  save();renderIsland();renderBuildInventory();toast('已收回建筑');
}
function upgradeBuildItem(placedId){
  const b=ensureBuild();
  const p=b.placed.find(x=>x.id===placedId);
  if(!p||p.level>=3){toast('已经满级啦');return}
  const item=BUILD_MAP[p.itemId],cost={};
  Object.entries(item.cost||{}).forEach(([id,n])=>cost[id]=Math.max(1,Math.ceil(n*(p.level+1)/2)));
  if(!spendMaterials(cost)){toast('升级材料不够：'+materialText(cost));return}
  const fresh=ensureBuild().placed.find(x=>x.id===placedId);
  if(fresh)fresh.level++;
  save();renderIsland();renderBuildInventory();toast(`${item.name} 升到 ${fresh?fresh.level:p.level} 级`);
}
function buildArt(itemId,level){
  const item=BUILD_MAP[itemId]||BUILD_MAP.grass_tile;
  const lv=level||1;
  const label={grass_tile:'▦',wood_house:'⌂',tree:'♣',bridge:'=',bookshelf:'▤',word_monument:'碑',review_tower:'塔',wrong_furnace:'炉',star_fountain:'✦',pet_den:'窝'}[item.id]||'■';
  return `<span class="build-art ${item.id} lv${lv}">${label}</span>`;
}
function renderIsland(){
  const b=ensureBuild();
  const grid=document.getElementById('island-grid');
  if(!grid)return;
  grid.style.gridTemplateColumns=`repeat(${b.island.size},1fr)`;
  grid.innerHTML='';
  for(let y=0;y<b.island.size;y++){
    for(let x=0;x<b.island.size;x++){
      const tile=tileAt(x,y),placed=placedAt(x,y);
      const cell=document.createElement('button');
      cell.className='island-cell'+(tile?' has-tile':'')+(placed?' has-build':'');
      cell.innerHTML=placed?`${buildArt(placed.itemId,placed.level)}<i>${placed.level}</i>`:(tile?buildArt(tile.itemId,1):'');
      cell.onclick=()=>{
        if(placed){showBuildDetail(placed.id);return}
        placeBuildItem(SELECTED_BUILD_ITEM,x,y);
      };
      grid.appendChild(cell);
    }
  }
  renderMaterialBar();
}
function renderMaterialBar(){
  const bar=document.getElementById('material-bar');
  if(!bar)return;
  const b=ensureBuild();
  bar.innerHTML=MATERIALS.map(m=>`<span style="--mc:${m.color}"><b>${m.short}</b>${b.materials[m.id]||0}</span>`).join('');
}
function renderBuildInventory(){
  const box=document.getElementById('build-inventory');
  if(!box)return;
  const b=ensureBuild();
  box.innerHTML='';
  BUILD_ITEMS.forEach(item=>{
    const unlocked=b.unlockedBlocks.includes(item.id),selected=SELECTED_BUILD_ITEM===item.id;
    const d=document.createElement('button');
    d.className='build-tool'+(selected?' on':'')+(unlocked?'':' locked');
    d.innerHTML=`${buildArt(item.id,1)}<b>${item.name}</b><i>${unlocked?materialText(item.cost):(item.earned?item.gate:'蓝图 '+materialText(blueprintCost(item)))}</i>`;
    d.onclick=()=>unlocked?selectBuildItem(item.id):unlockBuildByMaterials(item.id);
    box.appendChild(d);
  });
}
function showBuildDetail(placedId){
  const p=ensureBuild().placed.find(x=>x.id===placedId);
  if(!p)return;
  const item=BUILD_MAP[p.itemId];
  const box=document.getElementById('build-detail');
  box.style.display='block';
  box.innerHTML=`<b>${item.name} · ${p.level}级</b><p>${item.desc}</p><div class="note-actions"><button class="sbtn primary" onclick="upgradeBuildItem('${p.id}')">升级</button><button class="sbtn" onclick="removeBuildItem('${p.id}')">收回</button></div>`;
}
function renderIslandPage(){
  applySkin();ensureBuild();renderMaterialBar();renderIsland();renderBuildInventory();
  const claim=document.getElementById('build-starter-claim');
  if(claim)claim.style.display=ensureBuild().starterClaimed?'none':'block';
  const detail=document.getElementById('build-detail');if(detail){detail.style.display='none';detail.innerHTML='';}
}
function currentSkin(){
  const rewards=normalizeRewards(S.rewards);
  S.rewards=rewards;
  return SKIN_MAP[rewards.equipped]||SKIN_MAP.default;
}
function applySkin(){
  const skin=currentSkin();
  document.body.dataset.skin=skin.theme;
  const mascot=document.getElementById('home-mascot');
  if(mascot)mascot.innerHTML=skinArt(skin.id,'skin-mini');
  const hero=document.getElementById('hero-fox');
  if(hero)hero.innerHTML=skinArt(skin.id,'skin-hero-art');
  const coin=document.getElementById('coin-count');
  if(coin)coin.textContent=S.rewards.coins;
  const name=document.getElementById('profile-name-home');
  if(name)name.textContent=activeProfile().name;
  const skinName=document.getElementById('skin-name-home');
  if(skinName)skinName.textContent=skin.name;
}
function switchProfile(id){
  if(!ROOT.profiles[id])return;
  activeProfile().data=S;
  ROOT.activeProfileId=id;
  S=ROOT.profiles[id].data;
  save();
  toast('已切换到 '+ROOT.profiles[id].name);
  go('home');
}
function createProfile(){
  const name=prompt('给孩子起个昵称：','小朋友');
  if(name===null)return;
  const clean=name.trim().slice(0,12)||'小朋友';
  activeProfile().data=S;
  const id=profileId();
  ROOT.profiles[id]={id,name:clean,avatar:'default',data:defaultState()};
  ROOT.activeProfileId=id;
  S=ROOT.profiles[id].data;
  save();
  toast('新账户创建好了');
  go('home');
}
function renameProfile(){
  const p=activeProfile();
  const name=prompt('修改孩子昵称：',p.name);
  if(name===null)return;
  p.name=name.trim().slice(0,12)||p.name;
  save();renderProfiles();renderHome();renderParent();
}
function renderProfiles(){
  const box=document.getElementById('profile-list');
  if(!box)return;
  box.innerHTML='';
  Object.values(ROOT.profiles).forEach(p=>{
    const data=p.data||defaultState();
    const skin=SKIN_MAP[(data.rewards&&data.rewards.equipped)||'default']||SKIN_MAP.default;
    const d=document.createElement('div');
    d.className='profile-row'+(p.id===ROOT.activeProfileId?' on':'');
    d.innerHTML=`${skinArt(skin.id,'skin-profile-art')}<div><b>${safeText(p.name)}</b><i>${learnedCountFor(data)} 个词 · ${formatStudyTime((data.parent&&data.parent.totalSec)||0)}</i></div><button>${p.id===ROOT.activeProfileId?'使用中':'切换'}</button>`;
    d.onclick=()=>switchProfile(p.id);
    box.appendChild(d);
  });
}
function learnedCountFor(data){return Object.keys((data&&data.w)||{}).length}
function profileExportPayload(){
  const p=activeProfile();
  return {type:'nce-vocab-profile',v:STATE_VERSION,exportedAt:new Date().toISOString(),profile:{id:p.id,name:p.name,avatar:p.avatar,data:S}};
}
function exportProfile(){
  const p=activeProfile();
  const safeName=p.name.replace(/[\\/:*?"<>|]/g,'_');
  const blob=new Blob([JSON.stringify(profileExportPayload(),null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='新概念单词岛_'+safeName+'_存档_'+todayStr()+'.json';a.click();
  toast('已导出当前孩子存档');
}
function importProfileFile(inp){
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const raw=JSON.parse(r.result);
      let incoming=null;
      if(raw&&raw.type==='nce-vocab-profile'&&raw.profile)incoming=raw.profile;
      else if(raw&&raw.w)incoming={name:'导入账户',avatar:'default',data:raw};
      else if(raw&&raw.profiles){
        const root=migrateRoot(raw),first=root&&root.profiles[root.activeProfileId];
        if(first)incoming=first;
      }
      const data=migrateProfile(incoming&&incoming.data);
      if(!data){toast('存档格式不对哦');return}
      activeProfile().data=S;
      const id=profileId();
      ROOT.profiles[id]={id,name:(incoming.name||'导入账户').slice(0,12),avatar:incoming.avatar||'default',data};
      ROOT.activeProfileId=id;S=data;save();
      toast('孩子存档已导入');
      go('home');
    }catch(e){toast('存档格式不对哦')}
  };
  r.readAsText(f);inp.value='';
}

/* ================= 语音 ================= */
let VOICE=null;
function pickVoice(){const vs=speechSynthesis.getVoices();VOICE=vs.find(v=>v.lang==='en-US')||vs.find(v=>v.lang&&v.lang.startsWith('en'))||null}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function speak(t){
  if(!('speechSynthesis' in window))return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(t);
  u.lang='en-US';if(VOICE)u.voice=VOICE;u.rate=S.set.rate;
  speechSynthesis.speak(u);
}

/* ================= 音效 ================= */
let AC=null;
function beep(type){
  if(!S.set.sound)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    const seq=type==='ok'?[[660,0,.09],[880,.09,.12]]:type==='bad'?[[220,0,.18]]:type==='win'?[[523,0,.1],[659,.1,.1],[784,.2,.1],[1047,.3,.25]]:[[500,0,.05]];
    seq.forEach(([f,dl,du])=>{
      const o=AC.createOscillator(),g=AC.createGain();
      o.type='triangle';o.frequency.value=f;o.connect(g);g.connect(AC.destination);
      const t=AC.currentTime+dl;g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+du);
      o.start(t);o.stop(t+du);
    });
  }catch(e){}
}

/* ================= 彩带 ================= */
function confetti(){
  const c=document.getElementById('confetti'),x=c.getContext('2d');
  c.width=innerWidth;c.height=innerHeight;
  const P=[];const colors=['#ff6b6b','#ffd34d','#4facfe','#00c6a7','#b28bff','#ff9a3c'];
  for(let i=0;i<120;i++)P.push({x:Math.random()*c.width,y:-20-Math.random()*c.height*.5,r:4+Math.random()*6,co:colors[i%6],vy:2+Math.random()*3,vx:(Math.random()-.5)*2,a:Math.random()*6});
  let n=0;
  (function f(){
    x.clearRect(0,0,c.width,c.height);
    P.forEach(p=>{p.y+=p.vy;p.x+=p.vx;p.a+=.1;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.co;x.fillRect(-p.r/2,-p.r/2,p.r,p.r*.6);x.restore()});
    if(++n<130)requestAnimationFrame(f);else x.clearRect(0,0,c.width,c.height);
  })();
}
function toast(msg){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),2200);
}
/* 页面内确认框，替代原生 confirm（平板 WebView 上原生弹窗会失灵/卡死） */
function ask(msg,yesLabel,onYes){
  const d=document.createElement('div');d.className='badgepop';
  d.innerHTML=`<div class="in"><p style="font-size:17px;line-height:1.6;margin-bottom:18px">${msg}</p>
    <div style="display:flex;gap:10px">
      <button class="sbtn" style="flex:1;padding:13px">取消</button>
      <button class="sbtn primary" style="flex:1;padding:13px">${yesLabel}</button>
    </div></div>`;
  const [no,yes]=d.querySelectorAll('button');
  no.onclick=()=>d.remove();
  yes.onclick=()=>{d.remove();onYes()};
  d.addEventListener('click',e=>{if(e.target===d)d.remove()});
  document.body.appendChild(d);
}

/* ================= 勋章 ================= */
const BADGES=[
 {id:'b1',e:'🐣',n:'第一个单词',d:'学会1个单词',f:()=>learnedCount()>=1},
 {id:'b2',e:'🌱',n:'崭露头角',d:'学会50个单词',f:()=>learnedCount()>=50},
 {id:'b3',e:'💪',n:'百词斩将',d:'学会100个单词',f:()=>learnedCount()>=100},
 {id:'b4',e:'🚀',n:'突飞猛进',d:'学会200个单词',f:()=>learnedCount()>=200},
 {id:'b5',e:'🏔️',n:'登峰造极',d:'学会400个单词',f:()=>learnedCount()>=400},
 {id:'b6',e:'👑',n:'全书通关',d:'学完全部单词',f:()=>learnedCount()>=TOTAL_WORDS},
 {id:'b7',e:'🔥',n:'三日之火',d:'连续学习3天',f:()=>S.streak>=3},
 {id:'b8',e:'⚡',n:'七日闪电',d:'连续学习7天',f:()=>S.streak>=7},
 {id:'b9',e:'🏆',n:'三周王者',d:'连续学习21天',f:()=>S.streak>=21},
 {id:'b10',e:'🎯',n:'十连神射',d:'连续答对10题',f:()=>S.bestCombo>=10},
 {id:'b11',e:'🛡️',n:'复习卫士',d:'累计复习100次',f:()=>S.rev>=100},
 {id:'b12',e:'⭐',n:'首战告捷',d:'完成第一个单元',f:()=>doneUnits()>=1},
 {id:'b13',e:'🌟',n:'半程之星',d:'完成36个单元',f:()=>doneUnits()>=36},
];
const TIER_BADGES=[
 {id:'t1',e:'📚',n:'词汇大师',metric:()=>learnedCount(),tiers:[50,200,400]},
 {id:'t2',e:'🔥',n:'坚持不懈',metric:()=>S.streak,tiers:[3,7,21]},
 {id:'t3',e:'⏱️',n:'冲刺高手',metric:()=>S.sprintBest,tiers:[5,10,15]},
 {id:'t4',e:'⚔️',n:'错题复仇者',metric:()=>S.revengeFixed,tiers:[3,10,25]},
 {id:'t5',e:'📝',n:'盲答新星',metric:()=>S.blindDone||0,tiers:[3,10,25]},
 {id:'t6',e:'🎓',n:'盲答大师',metric:()=>S.blindHighScore||0,tiers:[1,5,15]},
];
function tierOf(tb){const v=tb.metric();let t=0;tb.tiers.forEach((th,i)=>{if(v>=th)t=i+1});return t;}
function checkTierBadges(){
  TIER_BADGES.forEach(tb=>{
    const newTier=tierOf(tb);
    const oldTier=S.tierBadges[tb.id]||0;
    if(newTier>oldTier){
      S.tierBadges[tb.id]=newTier;save();
      const tierName=['','铜','银','金'][newTier];
      const b={id:tb.id+'_'+newTier,e:tb.e,n:`${tb.n}·${tierName}`,d:`达到 ${tb.tiers[newTier-1]}`};
      if(IN_SESSION){PENDING_BADGES.push(b);toast(`🏅 ${tierName}级勋章：${tb.n}`);beep('win');}
      else enqueueBadge(b);
    }
  });
}
let PENDING_BADGES=[],badgeQueue=[];
function checkBadges(){
  BADGES.forEach(b=>{
    if(!S.badges.includes(b.id)&&b.f()){
      S.badges.push(b.id);save();
      if(IN_SESSION){PENDING_BADGES.push(b);toast('🏅 解锁新勋章：'+b.n);beep('win');}
      else enqueueBadge(b);
    }
  });
  checkTierBadges();
}
function enqueueBadge(b){badgeQueue.push(b);if(badgeQueue.length===1)showBadgePop(b);}
function showBadgePop(b){
  const d=document.createElement('div');d.className='badgepop';
  d.innerHTML=`<div class="in"><span>${b.e}</span><h2 style="margin:8px 0 4px">获得勋章！</h2><b style="font-size:18px">${b.n}</b><p style="color:#8a97ad;font-size:13px;margin:6px 0 16px">${b.d}</p><button class="sbtn primary" style="width:100%;padding:12px">收下啦 🎉</button></div>`;
  const close=()=>{d.remove();badgeQueue.shift();if(badgeQueue.length)showBadgePop(badgeQueue[0]);};
  d.querySelector('button').onclick=close;
  d.addEventListener('click',e=>{if(e.target===d)close();});
  document.body.appendChild(d);beep('win');confetti();
}

/* ================= 统计辅助 ================= */
function learnedCount(){return Object.keys(S.w).length}
function masterCount(){return Object.values(S.w).filter(x=>x.b>=5).length}
function unitProgress(ui){const u=UNITS[ui];let n=0;for(let i=0;i<u.w.length;i++)if(S.w[ui+'-'+i])n++;return n}
function doneUnits(){let n=0;for(let i=0;i<UNITS.length;i++)if(unitProgress(i)>=UNITS[i].w.length)n++;return n}
function dueIds(){const t=todayStr();return Object.keys(S.w).filter(id=>S.w[id].d<=t)}
function firstIncompleteUnit(){for(let i=0;i<UNITS.length;i++)if(unitProgress(i)<UNITS[i].w.length)return i;return -1}
function levelInfo(){
  const titles=['新手上路','单词学徒','拼写小将','词汇骑士','单词达人','拼写高手','词汇大师','单词王者','传奇学霸'];
  const lv=Math.floor(S.xp/200)+1;
  return {lv,name:titles[Math.min(lv-1,titles.length-1)],cur:S.xp%200,need:200};
}

/* ================= 护盾 / 每日任务 / 错题池 ================= */
function ensureDailyShield(){
  const t=todayStr();
  if(S.shieldDate!==t){S.shields=Math.min((S.shields||0)+1,2);S.shieldDate=t;save();}
}
function missionGoals(){
  const lv=levelInfo().lv;
  return {newwords:Math.min(5+lv,15),accQ:15,accMin:0.8,challenge:1};
}
function ensureDailyMissions(){
  const t=todayStr();
  if(!S.missions||S.missions.date!==t){S.missions={date:t,goals:missionGoals(),claimed:false};save();}
}
function missionStatus(){
  ensureDailyMissions();
  const day=S.days[S.missions.date]||{n:0,r:0,w:0,rv:0};
  const g=S.missions.goals;
  const m1={label:`学习新词 ${Math.min(day.n,g.newwords)}/${g.newwords}`,done:day.n>=g.newwords};
  const totalQ=day.r+day.w,acc=totalQ?day.r/totalQ:0;
  const m2={label:`答题 ${Math.min(totalQ,g.accQ)}/${g.accQ} 且正确率≥${Math.round(g.accMin*100)}%`,done:totalQ>=g.accQ&&acc>=g.accMin};
  const m3={label:'完成1次冲刺/复仇局/盲答闯关',done:!!day.challengeDone};
  const list=[m1,m2,m3];
  return {list,finished:list.filter(x=>x.done).length,claimed:S.missions.claimed};
}
function claimMissionReward(){
  const st=missionStatus();
  if(st.finished<2||st.claimed)return;
  S.missions.claimed=true;S.xp+=120;awardCoins(30,'今日任务');awardMaterials('今日任务',{right:8,wrong:0,mode:'daily'});save();
  toast('🎁 今日任务奖励 +120 XP，+30 金币和材料！');checkBadges();renderHome();
}
function fixWrongInPool(id){if(S.wrongPool[id])delete S.wrongPool[id];}

/* ================= 导航 ================= */
function go(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById('scr-'+name).classList.add('on');
  if(name==='home')renderHome();
  if(name==='units')renderUnits();
  if(name==='stats')renderStats();
  if(name==='parent')renderParent();
  if(name==='profiles')renderProfiles();
  if(name==='island')renderIslandPage();
  if(name==='bag')renderBag();
  if(name==='gacha')renderGacha();
  if(name==='badges')renderBadges();
  if(name==='settings')renderSettings();
  window.scrollTo(0,0);
}

/* ================= 首页 ================= */
function renderHome(){
  ensureDailyShield();
  applySkin();
  const h=new Date().getHours();
  const learned=learnedCount();
  document.getElementById('greet').textContent=h<12?'早上好呀！☀️':h<18?'下午好呀！🌤️':'晚上好呀！🌙';
  const due=dueIds().length;
  document.getElementById('c-streak').textContent=S.streak;
  document.getElementById('c-learned').textContent=learned;
  document.getElementById('c-master').textContent=masterCount();
  document.getElementById('c-shield').textContent=S.shields;
  const L=levelInfo();
  document.getElementById('lvl-name').textContent=`Lv.${L.lv} ${L.name}`;
  document.getElementById('lvl-xp').textContent=`${L.cur}/${L.need} XP`;
  document.getElementById('lvl-fill').style.width=(L.cur/L.need*100)+'%';
  const br=document.getElementById('btn-review');
  document.getElementById('due-hint').textContent=due?`有 ${due} 个单词等着你复习`:'今天没有要复习的单词啦';
  br.className='bigbtn '+(due?'btn-review':'btn-gray');
  const ui=firstIncompleteUnit();
  document.getElementById('learn-hint').textContent=ui<0?'全部单词都学完啦！':`下一站：Unit ${ui+1}（第${UNITS[ui].l}课）${UNITS[ui].t}`;
  document.getElementById('subgreet').textContent=due?'先复习，再学新词，效果最好哦':'今天也要加油背单词哦';
  renderMissionCard();
  const wrongN=Object.keys(S.wrongPool).length;
  const rb=document.getElementById('btn-revenge');
  rb.disabled=wrongN===0;
  rb.innerHTML=`<span>⚔️</span>错题复仇局${wrongN?`(${wrongN})`:'<small>暂无错题</small>'}`;
  const sb=document.getElementById('btn-sprint');
  sb.disabled=learned<5;
  sb.innerHTML=`<span>⏱️</span>60秒冲刺${learned<5?`<small>还差 ${5-learned} 个词</small>`:''}`;
  const xb=document.getElementById('btn-blind');
  xb.disabled=learned<10;
  xb.innerHTML=`<span>📝</span>盲答闯关${learned<10?`<small>还差 ${10-learned} 个词</small>`:''}`;
}
function renderMissionCard(){
  const st=missionStatus();
  const box=document.getElementById('mission-list');box.innerHTML='';
  st.list.forEach(m=>{
    const d=document.createElement('div');d.className='mission-row'+(m.done?' done':'');
    d.innerHTML=`<span class="mk">${m.done?'✓':''}</span><span class="mt">${m.label}</span>`;
    box.appendChild(d);
  });
  document.getElementById('mission-status').textContent=`已完成 ${st.finished}/3`;
  const claimBtn=document.getElementById('mission-claim');
  claimBtn.style.display=(st.finished>=2&&!st.claimed)?'block':'none';
}
function learnNext(){const ui=firstIncompleteUnit();if(ui<0){toast('🎉 全书学完啦！');return}openSheet(ui)}

/* ================= 单元列表 ================= */
function renderUnits(){
  const box=document.getElementById('unit-list');box.innerHTML='';
  const stages=['第一关 · 出发啦 🚂','第二关 · 小树林 🌳','第三关 · 大湖边 ⛵','第四关 · 高山上 ⛰️','第五关 · 星空下 🌟','第六关 · 城堡前 🏰'];
  const rec=firstIncompleteUnit();
  UNITS.forEach((u,i)=>{
    if(i%12===0){const s=document.createElement('div');s.className='stage';s.textContent=stages[i/12];box.appendChild(s)}
    const p=unitProgress(i),tot=u.w.length,done=p>=tot;
    const d=document.createElement('div');d.className='unit'+(i===rec?' rec':'');
    d.innerHTML=`<div class="num${done?' done':''}">${done?'⭐':i+1}</div>
      <div class="info"><b>Lesson ${u.l} · ${u.t}</b><i>${tot} 个单词${i===rec?' · 推荐从这里继续':''}</i>
      <div class="ubar"><div style="width:${p/tot*100}%"></div></div></div>
      <div class="st">${done?'✅':p>0?'📖':'✏️'}</div>`;
    d.onclick=()=>openSheet(i);
    box.appendChild(d);
  });
}

/* ================= 单元详情（单词本） ================= */
let SHEET_UI=0,SHEET_CARD_INDEX=0;
let NOTE_RECALL_PARTS=[],NOTE_RECALL_INDEX=0,NOTE_RECALL_RESULTS=[],NOTE_RECALL_STARTED=0,NOTE_RECALL_SESSION_SAVED=false;
function renderStudyCard(){
  const u=UNITS[SHEET_UI];
  const i=Math.min(Math.max(SHEET_CARD_INDEX,0),u.w.length-1);
  SHEET_CARD_INDEX=i;
  const w=u.w[i],ipa=ipaOf(w[0]);
  const learned=!!S.w[SHEET_UI+'-'+i];
  document.getElementById('study-meta').textContent=`${i+1}/${u.w.length} · Lesson ${u.l}${learned?' · 已学':' · 新词'}`;
  document.getElementById('study-word').textContent=w[0];
  document.getElementById('study-ipa').textContent=ipa?`/${ipa}/`:'';
  document.getElementById('study-cn').textContent=`${w[1]?w[1]+' ':''}${w[2]}`;
}
function prevStudyCard(){
  const u=UNITS[SHEET_UI];
  SHEET_CARD_INDEX=(SHEET_CARD_INDEX-1+u.w.length)%u.w.length;
  renderStudyCard();
}
function nextStudyCard(){
  const u=UNITS[SHEET_UI];
  SHEET_CARD_INDEX=(SHEET_CARD_INDEX+1)%u.w.length;
  renderStudyCard();
}
function speakStudyCard(){speak(UNITS[SHEET_UI].w[SHEET_CARD_INDEX][0])}
function noteKey(ui){return String(ui)}
function currentLessonNote(){return S.notes[noteKey(SHEET_UI)]||''}
function formatLessonNote(text){
  return String(text)
    .replace(/，/g,',')
    .split(',')
    .map(x=>x.trim().replace(/\s+/g,' '))
    .filter(Boolean)
    .join(',');
}
function lessonNoteParts(note){return formatLessonNote(note===undefined?currentLessonNote():note).split(',').filter(Boolean)}
function renderLessonNoteItems(parts){
  const box=document.getElementById('note-items');
  if(!box)return;
  if(!parts.length){box.innerHTML='';return}
  box.innerHTML=parts.map((p,i)=>`<span><b>${i+1}</b>${safeText(p)}</span>`).join('');
}
function renderLessonNote(){
  const note=currentLessonNote();
  const parts=lessonNoteParts(note);
  const inp=document.getElementById('note-input');
  const status=document.getElementById('note-status');
  const btn=document.getElementById('note-recall-btn');
  if(inp)inp.value=note;
  if(status)status.textContent=parts.length?`已保存 ${parts.length} 条`:'未保存';
  if(btn)btn.disabled=!parts.length;
  renderLessonNoteItems(parts);
}
function renderSheetLearnButton(){
  const u=UNITS[SHEET_UI],p=unitProgress(SHEET_UI);
  const noteN=lessonNoteParts(S.notes[noteKey(SHEET_UI)]||'').length;
  const btn=document.getElementById('sheet-learn');
  btn.innerHTML=`🎯 预习完成，开始挑战<small>${u.w.length} 个单词${noteN?` + ${noteN} 条笔记`:''}，当前已学 ${p} 个</small>`;
  btn.onclick=()=>startLearn(SHEET_UI);
}
function markLessonNoteDirty(){
  const saved=currentLessonNote();
  const current=document.getElementById('note-input').value;
  const status=document.getElementById('note-status');
  const clean=formatLessonNote(current);
  renderLessonNoteItems(lessonNoteParts(current));
  if(status)status.textContent=clean===saved?(clean?`已保存 ${lessonNoteParts(clean).length} 条`:'未保存'):'未保存修改';
}
function saveLessonNote(){
  const inp=document.getElementById('note-input');
  const text=formatLessonNote(inp.value);
  inp.value=text;
  if(text)S.notes[noteKey(SHEET_UI)]=text;
  else delete S.notes[noteKey(SHEET_UI)];
  save();
  renderLessonNote();
  renderSheetLearnButton();
  toast(text?'笔记已保存 ✅':'笔记已清空');
}
function startNoteRecall(){
  const parts=lessonNoteParts();
  if(!parts.length){toast('先写一点笔记再默写哦');return}
  const u=UNITS[SHEET_UI];
  document.getElementById('note-recall-title').textContent=`Lesson ${u.l} · 默写笔记`;
  NOTE_RECALL_PARTS=parts;
  NOTE_RECALL_INDEX=0;
  NOTE_RECALL_RESULTS=[];
  NOTE_RECALL_STARTED=Date.now();
  NOTE_RECALL_SESSION_SAVED=false;
  renderNoteRecallQuestion();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById('scr-note').classList.add('on');
  window.scrollTo(0,0);
  setTimeout(()=>document.getElementById('note-recall-input').focus(),80);
}
function backToLessonSheet(){openSheet(SHEET_UI)}
function currentNoteRecallPart(){return NOTE_RECALL_PARTS[NOTE_RECALL_INDEX]||''}
function renderNoteRecallQuestion(){
  const u=UNITS[SHEET_UI];
  const info=noteRecallInfo(currentNoteRecallPart());
  document.getElementById('note-recall-prompt').innerHTML=`${u.t} · 第 ${NOTE_RECALL_INDEX+1}/${NOTE_RECALL_PARTS.length} 条笔记${notePromptHTML(info)}`;
  document.getElementById('note-recall-input').value='';
  document.getElementById('note-recall-result').innerHTML='';
  document.getElementById('note-original').style.display='none';
  document.getElementById('note-original').innerHTML='';
  document.getElementById('note-submit-btn').disabled=false;
  const next=document.getElementById('note-next-btn');
  next.disabled=true;
  next.textContent=NOTE_RECALL_INDEX>=NOTE_RECALL_PARTS.length-1?'完成':'下一条 →';
}
function normalizeNoteText(text){
  return String(text).toLowerCase().replace(/[\s.,!?;:'"`~()[\]{}<>，。！？；：“”‘’、（）【】《》—…·\-_/\\|]+/g,'');
}
function noteChineseHintFromEnglish(text){
  const tokens=(String(text).toLowerCase().match(/[a-z]+/g)||[]);
  const hints=[];
  let known=0;
  for(let i=0;i<tokens.length;){
    let hit=null,step=1;
    for(let len=Math.min(NOTE_MAX_HINT_WORDS,tokens.length-i);len>=1;len--){
      const key=tokens.slice(i,i+len).join('');
      if(NOTE_HINTS.has(key)){hit=NOTE_HINTS.get(key);step=len;break}
    }
    if(hit){hints.push(hit);known++}
    else hints.push('？');
    i+=step;
  }
  if(!tokens.length)return '';
  const useful=known/tokens.length>=0.35||known>=2;
  return useful?hints.join(' / '):'中文提示暂缺';
}
function noteRecallInfo(note){
  const original=String(note||'').trim();
  const chineseChars=/[\u3400-\u9fff]/;
  const chineseKeep=/[\u3400-\u9fff，。！？；：“”‘’、（）【】《》]/;
  if(!chineseChars.test(original)){
    const prompt=noteChineseHintFromEnglish(original);
    return {original,prompt:prompt||'中文提示暂缺',target:original,hasChinese:false,hasCue:!!prompt&&prompt!=='中文提示暂缺'};
  }
  const prompt=[...original].filter(ch=>chineseKeep.test(ch)).join('').replace(/^[，。！？；、]+|[，。！？；、]+$/g,'');
  const target=original.replace(/[\u3400-\u9fff，。！？；：“”‘’、（）【】《》]/g,' ').replace(/\s+/g,' ').trim();
  if(target)return {original,prompt,target,hasChinese:true,hasCue:true};
  return {original,prompt:'中文笔记',target:original,hasChinese:true,hasCue:false};
}
function notePromptHTML(info,label){
  if(info.hasCue){
    return `<div class="note-cue"><b>${label||'中文提示'}</b><span>${safeText(info.prompt)}</span></div>`;
  }
  return `<div class="note-cue muted"><b>${safeText(info.prompt)}</b><span>请默写这条英文笔记</span></div>`;
}
function lcsMask(target,given){
  const a=[...target],b=[...given];
  const dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=a.length-1;i>=0;i--){
    for(let j=b.length-1;j>=0;j--){
      dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
    }
  }
  const mask=Array(a.length).fill(false);
  let i=0,j=0;
  while(i<a.length&&j<b.length){
    if(a[i]===b[j]){mask[i]=true;i++;j++}
    else if(dp[i+1][j]>=dp[i][j+1])i++;
    else j++;
  }
  return {score:a.length?dp[0][0]/a.length:(b.length?0:1),mask};
}
function noteDiffHTML(original,mask){
  const compact=normalizeNoteText(original);
  let k=0,html='';
  [...original].forEach(ch=>{
    if(normalizeNoteText(ch)){
      html+=`<span class="${mask[k]?'hit':'miss'}">${safeText(ch)}</span>`;
      k++;
    }else{
      html+=safeText(ch);
    }
  });
  if(k!==compact.length)return safeText(original);
  return html;
}
function noteScore(original,given){
  const target=normalizeNoteText(original),answer=normalizeNoteText(given);
  return lcsMask(target,answer);
}
function noteAnswerHTML(info,result){
  const full=info.original!==info.target?`<p>完整笔记：${safeText(info.original)}</p>`:'';
  return `<b>正确答案</b><div>${noteDiffHTML(info.target,result.mask)}</div>${full}`;
}
function submitSessionNote(){
  if(!CUR||CUR.kind!=='note'||CUR._locked)return;
  const inp=document.getElementById('note-session-input');
  const given=inp.value.trim();
  if(!given){toast('先默写一点内容再确认');inp.focus();return}
  CUR._locked=true;
  const info=noteRecallInfo(CUR.note);
  const result=noteScore(info.target,given);
  const pct=Math.round(result.score*100);
  const ok=pct>=80;
  const fb=document.getElementById('fb');
  const originalBox=document.getElementById('note-session-original');
  originalBox.style.display='block';
  originalBox.innerHTML=noteAnswerHTML(info,result);
  fb.textContent=ok?`笔记默写 ${pct}% ✅`:`笔记默写 ${pct}%，再写一遍`;
  fb.className=ok?'fb good':'fb badc';
  gradeSessionNote(ok,pct);
}
function gradeSessionNote(ok,pct){
  const day=markActivity();
  if(ok){
    const noWrong=!CUR.attempted;
    S.combo++;S.bestCombo=Math.max(S.bestCombo,S.combo);
    let gain=pct>=95?10:7;
    if(!CUR.counted){
      CUR.counted=true;
      if(noWrong){SES.right++;day.r++;recordParentAnswer(CUR,true)}
      if(S.combo>=8)gain=Math.round(gain*1.5);
      else if(S.combo>=3)gain=Math.round(gain*1.2);
    }else gain=0;
    S.xp+=gain;SES.xp+=gain;
    save();checkBadges();
    SES.queue.shift();
    renderBoard();
    setTimeout(nextCard,1000);
    return;
  }
  if(S.shields>0){S.shields--;toast('🛡️ 护盾帮你挡了一下，连击保住了！')}
  else S.combo=0;
  if(!CUR.attempted){SES.wrong++;day.w++;recordParentAnswer(CUR,false)}
  CUR.attempted=true;CUR.retry=(CUR.retry||0)+1;
  save();
  setTimeout(()=>{
    CUR._locked=false;
    document.getElementById('note-session-input').value='';
    document.getElementById('note-session-input').focus();
  },1500);
}
function submitNoteRecall(){
  const info=noteRecallInfo(currentNoteRecallPart());
  const given=document.getElementById('note-recall-input').value.trim();
  if(!given){toast('先默写一点内容再交卷');return}
  const result=noteScore(info.target,given);
  const pct=Math.round(result.score*100);
  const title=pct>=90?'太稳了':pct>=70?'基本记住了':'还要再看一遍';
  const firstSubmit=!Number.isFinite(NOTE_RECALL_RESULTS[NOTE_RECALL_INDEX]);
  NOTE_RECALL_RESULTS[NOTE_RECALL_INDEX]=pct;
  if(firstSubmit)recordParentAnswer({id:`note-${SHEET_UI}-${NOTE_RECALL_INDEX}`},pct>=80);
  document.getElementById('note-recall-result').innerHTML=`<div class="note-score ${pct>=90?'good':pct>=70?'mid':'low'}"><b>${pct}%</b><span>${title}</span></div>`;
  const originalBox=document.getElementById('note-original');
  originalBox.style.display='block';
  originalBox.innerHTML=noteAnswerHTML(info,result);
  document.getElementById('note-submit-btn').disabled=true;
  document.getElementById('note-next-btn').disabled=false;
}
function revealLessonNote(){
  const note=currentNoteRecallPart()||currentLessonNote().trim();
  if(!note){toast('还没有保存笔记');return}
  const originalBox=document.getElementById('note-original');
  originalBox.style.display='block';
  originalBox.innerHTML=`<b>笔记原文</b><div>${safeText(note).replace(/\n/g,'<br>')}</div>`;
}
function retryNoteRecall(){
  document.getElementById('note-recall-input').value='';
  document.getElementById('note-recall-result').innerHTML='';
  document.getElementById('note-original').style.display='none';
  document.getElementById('note-submit-btn').disabled=false;
  document.getElementById('note-next-btn').disabled=true;
  document.getElementById('note-recall-input').focus();
}
function nextNoteRecall(){
  if(NOTE_RECALL_INDEX<NOTE_RECALL_PARTS.length-1){
    NOTE_RECALL_INDEX++;
    renderNoteRecallQuestion();
    setTimeout(()=>document.getElementById('note-recall-input').focus(),60);
    return;
  }
  const done=NOTE_RECALL_RESULTS.filter(x=>Number.isFinite(x));
  const avg=done.length?Math.round(done.reduce((s,x)=>s+x,0)/done.length):0;
  if(!NOTE_RECALL_SESSION_SAVED){
    const right=done.filter(x=>x>=80).length,wrong=done.length-right;
    recordParentSession({startedAt:NOTE_RECALL_STARTED,right,wrong,unitHits:{[SHEET_UI]:done.length}});
    awardCoins(right*2+(wrong===0&&right?6:0),'默写笔记');
    awardMaterials('默写笔记',{right,wrong,mode:'note'});
    NOTE_RECALL_SESSION_SAVED=true;
    save();
  }
  document.getElementById('note-recall-result').innerHTML=`<div class="note-score ${avg>=90?'good':avg>=70?'mid':'low'}"><b>${avg}%</b><span>全部 ${NOTE_RECALL_PARTS.length} 条完成</span></div>`;
  document.getElementById('note-original').style.display='none';
  document.getElementById('note-next-btn').disabled=true;
}
function openSheet(ui){
  SHEET_UI=ui;
  SHEET_CARD_INDEX=0;
  const u=UNITS[ui];
  document.getElementById('sheet-title').textContent=`Unit ${ui+1} · Lesson ${u.l}`;
  renderSheetLearnButton();
  renderStudyCard();
  renderLessonNote();
  const box=document.getElementById('sheet-words');box.innerHTML='';
  u.w.forEach((w,i)=>{
    const st=S.w[ui+'-'+i];
    const lv=st?(st.b>=5?['熟',5]:st.b>=3?['稳',3]:['学',1]):['新',0];
    const ipa=ipaOf(w[0]);
    const d=document.createElement('div');d.className='wline';
    d.innerHTML=`<span class="we">${w[0]}${ipa?`<i class="wipa">/${ipa}/</i>`:''}</span><span class="wc">${w[1]} ${w[2]}</span><span class="lv l${lv[1]||''}">${lv[0]}</span><button class="ws">🔊</button>`;
    d.querySelector('.ws').onclick=e=>{e.stopPropagation();speak(w[0])};
    box.appendChild(d);
  });
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById('scr-sheet').classList.add('on');
  window.scrollTo(0,0);
}

/* ================= 学习/复习会话 ================= */
let SES=null,IN_SESSION=false;
function beginSession(session){
  SES=session;
  SES.startedAt=Date.now();
  SES.unitHits={};
  S.combo=0;
  IN_SESSION=true;
  PENDING_BADGES=[];
  save();
}
function startLearn(ui){
  // 整篇课文一次性挑战：本单元全部单词，直接拼写（先在单词表上自学，再一次挑战）
  const u=UNITS[ui];
  const wordItems=u.w.map((w,i)=>({id:ui+'-'+i,w,mode:S.w[ui+'-'+i]?'review':'learn',phase:'spell'}));
  const noteItems=lessonNoteParts(S.notes[noteKey(ui)]||'').map((note,i)=>({id:`note-${ui}-${i}`,kind:'note',note,mode:'note',phase:'note'}));
  const items=wordItems.concat(noteItems);
  beginSession({queue:items,total:items.length,right:0,wrong:0,xp:0,mode:'challenge'});
  SES.board=makeBoard(items.length);
  go('sess');nextCard();
}
function startReview(){
  const ids=dueIds();
  if(!ids.length){toast('今天没有要复习的单词哦 👍');return}
  shuffle(ids);
  const items=ids.map(id=>{const[a,b]=id.split('-');return{id,w:UNITS[+a].w[+b],mode:'review',phase:'spell'}});
  beginSession({queue:items,total:items.length,right:0,wrong:0,xp:0,mode:'review'});
  SES.board=makeBoard(items.length);
  go('sess');nextCard();
}
function pickSprintItem(){
  const ids=Object.keys(S.w);
  const id=ids[Math.floor(Math.random()*ids.length)];
  const[a,b]=id.split('-');
  return{id,w:UNITS[+a].w[+b],mode:'sprint',phase:'spell'};
}
function startSprint(){
  if(learnedCount()<5){toast('先学会至少5个单词，再来冲刺吧！');return}
  beginSession({queue:[pickSprintItem()],total:null,right:0,wrong:0,xp:0,mode:'sprint',sprint:true,timeLeft:60});
  go('sess');
  startSprintTimer();
  nextCard();
}
function startRevenge(ids){
  const list=(ids&&ids.length)?ids.slice():Object.keys(S.wrongPool);
  if(!list.length){toast('太棒了，现在没有错题需要复仇！');return}
  shuffle(list);
  const items=list.map(id=>{const[a,b]=id.split('-');return{id,w:UNITS[+a].w[+b],mode:'revenge',phase:'spell'}});
  beginSession({queue:items,total:items.length,right:0,wrong:0,xp:0,mode:'revenge'});
  SES.board=makeBoard(items.length);
  go('sess');nextCard();
}
let LAST_BLIND_WRONG=[];
function startBlindExam(){
  if(learnedCount()<10){toast('先学会至少10个单词，再来挑战盲答闯关吧！');return}
  const ids=Object.keys(S.w);shuffle(ids);
  const n=Math.min(20,ids.length);
  const pool=ids.slice(0,n).map(id=>{const[a,b]=id.split('-');return{id,w:UNITS[+a].w[+b],phase:'spell'}});
  beginSession({mode:'blind',pool,idx:0,answers:[],total:n,xp:0});
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById('scr-sess').classList.add('on');
  window.scrollTo(0,0);
  nextBlindQuestion();
}
function nextBlindQuestion(){
  CUR=SES.pool[SES.idx];
  document.getElementById('fb').textContent='';document.getElementById('fb').className='fb';
  document.getElementById('boardwrap').style.display='none';
  document.getElementById('sess-fill').style.width=(SES.idx/SES.total*100)+'%';
  document.getElementById('combo-el').textContent='';
  document.getElementById('shield-el').textContent='';
  document.getElementById('sprint-timer').style.display='none';
  const bp=document.getElementById('blind-progress');
  bp.style.display='inline-block';bp.textContent=`📝 ${SES.idx+1}/${SES.total}`;
  showSpell();
}
function toggleFlag(){
  if(!CUR)return;
  CUR.flagged=!CUR.flagged;
  document.getElementById('btn-flag').textContent=CUR.flagged?'🚩 已标记':'🏳️ 标记不确定';
  beep('tap');
}
function blindSubmit(){
  if(!CUR||CUR._locked)return;
  CUR._locked=true;
  const inp=document.getElementById('spell-input');
  const typed=inp.value.toLowerCase().replace(/[^a-z]/g,'');
  SES.answers.push({id:CUR.id,w:CUR.w,given:typed,ipaGiven:phoneAnswer(),ipaTarget:PHONE_TARGET.join(''),ipaText:PHONE_IPA,flagged:!!CUR.flagged});
  SES.idx++;
  const fb=document.getElementById('fb');
  fb.textContent='已记录，下一题 →';fb.className='fb';
  setTimeout(()=>{
    if(SES.idx>=SES.pool.length){finishBlindExam();return}
    nextBlindQuestion();
  },500);
}
function finishBlindExam(){
  IN_SESSION=false;
  const day=markActivity();
  let right=0;
  SES.answers.forEach(a=>{
    const target=a.w[0].toLowerCase().replace(/[^a-z]/g,'');
    const wordOk=a.given===target;
    const ipaOk=!a.ipaGiven||a.ipaGiven===a.ipaTarget;
    const ok=wordOk;
    a.ok=ok;
    a.wordOk=wordOk;
    a.ipaOk=ipaOk;
    recordParentAnswer(a,ok);
    if(ok){right++;day.r++}else{day.w++}
    const st=S.w[a.id];
    if(st){
      if(ok){const nb=Math.min(st.b+1,7);st.b=nb;st.d=addDays(INTERVALS[nb]);st.r++}
      else{st.b=1;st.d=addDays(1);st.wr=(st.wr||0)+1;S.rev++;day.rv++}
    }
    if(ok)fixWrongInPool(a.id);
    else S.wrongPool[a.id]=(S.wrongPool[a.id]||0)+1;
  });
  SES.breakdown={
    blank:SES.answers.filter(a=>!a.given&&!a.ipaGiven).length,
    unsure:SES.answers.filter(a=>a.flagged).length,
    typo:SES.answers.filter(a=>!a.ok&&(a.given||a.ipaGiven)&&!a.flagged).length
  };
  const total=SES.answers.length;
  const acc=total?right/total:0;
  let xp=right*10+20;
  if(acc>=0.9)xp+=40;else if(acc>=0.8)xp+=20;
  S.xp+=xp;SES.xp=xp;SES.right=right;SES.wrong=total-right;
  day.challengeDone=true;
  S.blindDone=(S.blindDone||0)+1;
  if(acc>=0.9)S.blindHighScore=(S.blindHighScore||0)+1;
  LAST_BLIND_WRONG=SES.answers.filter(a=>!a.ok).map(a=>a.id);
  recordParentSession(SES);
  const coins=awardCoins(sessionCoinReward(SES),'盲答闯关');
  if(coins)SES.coins=coins;
  awardMaterials('盲答闯关',{right,wrong:total-right,mode:'blind'});
  save();checkBadges();
  renderBlindResult(acc);
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById('scr-blindresult').classList.add('on');
  window.scrollTo(0,0);
  document.getElementById('blind-progress').style.display='none';
  const pend=PENDING_BADGES.slice();PENDING_BADGES=[];
  if(pend.length)setTimeout(()=>pend.forEach(enqueueBadge),600);
}
function renderBlindResult(acc){
  document.getElementById('bx-emoji').textContent=acc>=0.9?'🏆':acc>=0.8?'🎉':acc>=0.6?'📝':'💪';
  document.getElementById('bx-title').textContent=`交卷啦！正确率 ${Math.round(acc*100)}%`;
  document.getElementById('bx-sub').textContent=acc>=0.9?'满分学霸操作！':acc>=0.8?'非常棒，继续保持！':'没关系，来看看错在哪里吧';
  const b=SES.breakdown||{blank:0,typo:0,unsure:0};
  document.getElementById('bx-breakdown').innerHTML=`<div class="mini"><b>${b.blank}</b><i>不会</i></div><div class="mini"><b>${b.typo}</b><i>拼错</i></div><div class="mini"><b>${b.unsure}</b><i>标记</i></div>`;
  document.getElementById('bx-right').textContent=SES.right;
  document.getElementById('bx-wrong').textContent=SES.wrong;
  document.getElementById('bx-xp').textContent='+'+SES.xp;
  document.getElementById('bx-revenge-btn').style.display=SES.wrong>0?'block':'none';
  if(acc===1){confetti();beep('win')}
}
function openBlindReview(){
  const box=document.getElementById('blind-review-list');box.innerHTML='';
  SES.answers.forEach(a=>{
    const ipa=ipaOf(a.w[0]);
    const d=document.createElement('div');d.className='wline';
    const tags=[];
    if(!a.given&&!a.ipaGiven)tags.push('不会');
    if(a.flagged)tags.push('不确定');
    if(!a.ok&&(a.given||a.ipaGiven)&&!a.flagged)tags.push('拼错');
    d.innerHTML=`<span class="we" style="min-width:130px">${a.w[0]}${ipa?`<i class="wipa">/${ipa}/</i>`:''}</span>
      <span class="wc">${a.w[2]}<br><b style="color:${a.wordOk?'#149c66':'#e04444'}">你写：${a.given||'（空）'}</b>${a.wordOk?'':' <span style="color:#8a97ad">'+'正确：'+a.w[0]+'</span>'}${a.ipaText?`<br><b style="color:${a.ipaOk?'#149c66':'#e04444'}">音标：/${a.ipaGiven||'（空）'}/</b>${a.ipaOk?'':' <span style="color:#8a97ad">正确：/'+a.ipaText+'/</span>'}`:''}</span>
      <span class="review-tags">${tags.map(t=>`<i>${t}</i>`).join('')}<b>${a.ok?'✅':'❌'}</b></span>`;
    box.appendChild(d);
  });
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById('scr-blindreview').classList.add('on');
  window.scrollTo(0,0);
}
function backToBlindResult(){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById('scr-blindresult').classList.add('on');
}
function blindRevengeAgain(){startRevenge(LAST_BLIND_WRONG.slice())}
let sprintInterval=null;
function startSprintTimer(){
  clearInterval(sprintInterval);
  const el=document.getElementById('sprint-timer');
  el.style.display='inline-block';
  updateSprintTimerUI();
  sprintInterval=setInterval(()=>{
    SES.timeLeft--;
    updateSprintTimerUI();
    if(SES.timeLeft<=0){clearInterval(sprintInterval);sprintInterval=null;endSession(false);}
  },1000);
}
function updateSprintTimerUI(){
  const el=document.getElementById('sprint-timer');
  if(el&&SES)el.textContent='⏱️ '+Math.max(SES.timeLeft,0)+'s';
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}
function makeBoard(n){const b=[];for(let i=0;i<n;i++)b.push({type:(i%5===4)?'gift':(i%3===1)?'coin':'word'});return b}
function tileHTML(c,cleared){
  if(c.k==='pad')return '<div class="btile pad"></div>';
  if(c.k==='start')return '<div class="btile start">🚩</div>';
  if(c.k==='finish'){const fin=cleared>=SES.total;return `<div class="btile finish${fin?' cur':''}">${fin?'🦊':'🏁'}</div>`;}
  const i=c.i,t=SES.board[i]||{type:'word'};
  if(i<cleared)return `<div class="btile done">${t.type==='gift'?'🏆':t.type==='coin'?'💰':'⭐'}</div>`;
  if(i===cleared)return '<div class="btile cur">🦊</div>';
  const ic=t.type==='gift'?'🎁':t.type==='coin'?'🪙':`<span class="n">${i+1}</span>`;
  return `<div class="btile up">${ic}</div>`;
}
function renderBoard(){
  const b=document.getElementById('board');if(!b||!SES||!SES.board)return;
  const cleared=SES.total-SES.queue.length;
  const cells=[{k:'start'}];
  for(let i=0;i<SES.total;i++)cells.push({k:'word',i});
  cells.push({k:'finish'});
  const tot=cells.length;
  const narrow=window.innerWidth<=420;
  const cols=narrow?(tot<=5?tot:tot<=12?5:6):(tot<=6?tot:tot<=12?6:tot<=24?7:8);
  while(cells.length%cols)cells.push({k:'pad'});
  const rows=cells.length/cols;
  let html='';
  for(let r=0;r<rows;r++){
    let row=cells.slice(r*cols,(r+1)*cols);
    if(r%2===1)row=row.reverse();          // 蛇形绕行，像大富翁棋盘
    html+=row.map(c=>tileHTML(c,cleared)).join('');
  }
  b.style.gridTemplateColumns=`repeat(${cols},1fr)`;
  b.innerHTML=html;
}
function quitSession(){
  if(SES&&SES.mode==='blind'){
    ask('要放弃本次盲答闯关吗？<br>本局不会计分哦','放弃',()=>{
      IN_SESSION=false;
      document.getElementById('blind-progress').style.display='none';
      go('home');renderHome();
    });
    return;
  }
  ask('要退出本次练习吗？<br>已完成的进度会保存哦 💾','退出',()=>endSession(true));
}

let CUR=null,ANSWER='',SLOTS=[],POS=0,FIRST=true,HINTS=0,RETRY=0;
let PHONE_TARGET=[],PHONE_PICKED=[],PHONE_OPTIONS=[],PHONE_IPA='';
function nextCard(){
  document.getElementById('fb').textContent='';document.getElementById('fb').className='fb';
  if(SES.sprint){
    if(SES.timeLeft<=0){endSession(false);return}
    if(!SES.queue.length)SES.queue.push(pickSprintItem());
  }else if(!SES.queue.length){endSession(false);return}
  CUR=SES.queue[0];
  const boardwrap=document.getElementById('boardwrap');
  if(SES.sprint){
    boardwrap.style.display='none';
    document.getElementById('sess-fill').style.width='100%';
  }else{
    boardwrap.style.display='';
    const done=SES.total-SES.queue.filter(q=>!q.counted).length;
    document.getElementById('sess-fill').style.width=(Math.min(done,SES.total)/SES.total*100)+'%';
    renderBoard();
  }
  document.getElementById('combo-el').textContent=S.combo>=2?`🔥x${S.combo}`:'';
  document.getElementById('shield-el').textContent=S.shields>0?`🛡️x${S.shields}`:'';
  if(CUR.kind==='note')showSessionNote();
  else if(CUR.phase==='present')showPresent();
  else showSpell();
}
function showPresent(){
  const w=CUR.w;
  document.getElementById('qcard').innerHTML=
    `<span class="pos">${w[1]||'词组'}</span><div class="en-big">${w[0]}</div><div class="cn" style="font-size:20px;color:#5b6b88">${w[2]}</div><button class="spk" onclick="speakCur()">🔊</button>`;
  document.getElementById('spell-area').style.display='none';
  document.getElementById('note-session-area').style.display='none';
  document.getElementById('present-area').style.display='block';
  speak(w[0]);
}
function presentDone(){CUR.phase='spell';showSpell()}
function speakCur(){speak(CUR.w[0])}
function cleanIpa(ipa){return (ipa||'').replace(/[ˈˌ\/\s]/g,'')}
function tokenizeIpa(ipa){
  const s=cleanIpa(ipa);
  const multi=['iː','uː','ɑː','ɔː','ɜː','eɪ','aɪ','ɔɪ','əʊ','aʊ','ɪə','eə','ʊə','tʃ','dʒ'];
  const out=[];
  for(let i=0;i<s.length;){
    const m=multi.find(x=>s.slice(i,i+x.length)===x);
    if(m){out.push(m);i+=m.length}
    else{out.push(s[i]);i++}
  }
  return out.filter(Boolean);
}
function shuffleCopy(a){const b=a.slice();shuffle(b);return b}
function hasPhoneTask(){return PHONE_TARGET.length>0}
function phoneAnswer(){return PHONE_PICKED.map(x=>x.t).join('')}
function phoneCorrect(){return !hasPhoneTask()||phoneAnswer()===PHONE_TARGET.join('')}
function phoneAttempted(){return hasPhoneTask()&&PHONE_PICKED.length>0}
function setupPhonics(ipa){
  PHONE_IPA=ipa||'';
  PHONE_TARGET=tokenizeIpa(ipa);
  PHONE_PICKED=[];
  PHONE_OPTIONS=shuffleCopy(PHONE_TARGET.map((t,i)=>({t,i})));
  const area=document.getElementById('phonics-area');
  if(!PHONE_TARGET.length){area.style.display='none';renderPhonics();return}
  area.style.display='block';
  renderPhonics();
}
function renderPhonics(state){
  const slots=document.getElementById('phonics-slots');
  const opts=document.getElementById('phonics-options');
  if(!slots||!opts)return;
  slots.innerHTML='';opts.innerHTML='';
  PHONE_TARGET.forEach((t,i)=>{
    const d=document.createElement('div');
    d.className='phone-slot'+(PHONE_PICKED[i]?' filled':'')+(state==='ok'?' ok':state==='bad'?' bad':'');
    d.textContent=PHONE_PICKED[i]?PHONE_PICKED[i].t:'';
    slots.appendChild(d);
  });
  PHONE_OPTIONS.forEach((p,idx)=>{
    const b=document.createElement('button');
    b.className='phone-option';
    b.textContent=p.t;
    b.disabled=!!p.used||PHONE_PICKED.length>=PHONE_TARGET.length||!!(CUR&&CUR._locked);
    b.onclick=()=>pickPhoneme(idx);
    opts.appendChild(b);
  });
}
function pickPhoneme(idx){
  if(!CUR||CUR.phase!=='spell'||CUR._locked)return;
  const p=PHONE_OPTIONS[idx];
  if(!p||p.used||PHONE_PICKED.length>=PHONE_TARGET.length)return;
  p.used=true;PHONE_PICKED.push(p);
  renderPhonics();
  updateSubmitState();
  beep('tap');
}
function deletePhoneme(){
  if(!CUR||CUR.phase!=='spell'||CUR._locked||!PHONE_PICKED.length)return;
  const p=PHONE_PICKED.pop();
  p.used=false;
  renderPhonics();
  updateSubmitState();
  beep('tap');
}
function resetPhonics(){
  PHONE_OPTIONS.forEach(p=>p.used=false);
  PHONE_PICKED=[];
  renderPhonics();
}
function showSessionNote(){
  const idx=(CUR.id.match(/note-\d+-(\d+)/)||[])[1];
  const info=noteRecallInfo(CUR.note);
  document.getElementById('qcard').innerHTML=
    `<span class="pos">课文笔记</span><div class="cn">默写第 ${idx?+idx+1:''} 条笔记</div>${notePromptHTML(info)}<p style="color:#8a97ad;font-size:14px;margin-top:8px">看中文提示，默写对应笔记</p>`;
  document.getElementById('spell-area').style.display='none';
  document.getElementById('present-area').style.display='none';
  document.getElementById('note-session-area').style.display='block';
  const inp=document.getElementById('note-session-input');
  inp.value='';
  document.getElementById('note-session-original').style.display='none';
  document.getElementById('note-session-original').innerHTML='';
  setTimeout(()=>inp.focus(),60);
}
function showSpell(){
  const w=CUR.w;
  FIRST=CUR.attempted?false:true;HINTS=0;RETRY=CUR.retry||0;
  const ipa=ipaOf(w[0]);
  const phoneTokens=tokenizeIpa(ipa);
  document.getElementById('qcard').innerHTML=
    `<span class="pos">${w[1]||'词组'}</span>${ipa&&!phoneTokens.length?`<div class="ipa">/${ipa}/</div>`:''}<div class="cn">${w[2]}</div><button class="spk" onclick="speakCur()">🔊</button>`;
  document.getElementById('present-area').style.display='none';
  document.getElementById('note-session-area').style.display='none';
  document.getElementById('spell-area').style.display='block';
  ANSWER=w[0];SLOTS=[];POS=-1;
  const box=document.getElementById('tiles');box.innerHTML='';
  [...ANSWER].forEach((ch,i)=>{
    const t=document.createElement('div');
    if(/[a-zA-Z]/.test(ch)){t.className='tile';t.dataset.i=i;SLOTS.push({i,ch,el:t,val:''})}
    else{t.className='tile fix';t.textContent=ch===' '?'␣':ch}
    box.appendChild(t);
  });
  POS=0;markCursor();
  const inp=document.getElementById('spell-input');
  inp.value='';
  setupPhonics(ipa);
  inp.setAttribute('inputmode',S.set.kbMode?'text':'none');
  document.getElementById('btn-kb-toggle').textContent=S.set.kbMode?'✍️ 手写':'⌨️ 键盘';
  document.getElementById('spell-hint').textContent=S.set.kbMode?'⌨️ 已切到系统键盘，可以打字或点麦克风说话':'✍️ 用 Apple Pencil 直接在框里写字就行';
  inp.oninput=syncInputToTiles;
  inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();submitSpell()}};
  updateSubmitState(0);
  setTimeout(()=>inp.focus(),50);
  const blind=SES&&SES.mode==='blind';
  document.getElementById('btn-hint').style.display=blind?'none':'';
  const flagBtn=document.getElementById('btn-flag');
  flagBtn.style.display=blind?'block':'none';
  if(blind)flagBtn.textContent=CUR.flagged?'🚩 已标记':'🏳️ 标记不确定';
}
function toggleKeyboard(){
  S.set.kbMode=!S.set.kbMode;save();
  const inp=document.getElementById('spell-input');
  inp.setAttribute('inputmode',S.set.kbMode?'text':'none');
  document.getElementById('btn-kb-toggle').textContent=S.set.kbMode?'✍️ 手写':'⌨️ 键盘';
  document.getElementById('spell-hint').textContent=S.set.kbMode?'⌨️ 已切到系统键盘，可以打字或点麦克风说话':'✍️ 用 Apple Pencil 直接在框里写字就行';
  inp.blur();setTimeout(()=>inp.focus(),50);
}
function markCursor(){SLOTS.forEach((s,j)=>s.el.classList.toggle('cur',j===POS))}
function letterAnswer(){return ANSWER.toLowerCase().replace(/[^a-z]/g,'')}
function safeText(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function wordSegments(answer){
  return answer.split(/([\s-]+)/).map(part=>{
    if(/[\s-]+/.test(part))return part;
    const letters=part.replace(/[^a-zA-Z]/g,'');
    if(!letters)return part;
    return letters[0].toLowerCase()+Array(Math.max(letters.length-1,0)).fill('_').join('');
  }).join(' ');
}
function spellDiffHTML(typed,target){
  const t=target.toLowerCase().replace(/[^a-z]/g,'');
  let html='<div class="spell-diff">';
  for(let i=0;i<t.length;i++){
    const miss=(typed[i]||'')!==t[i];
    html+=`<span class="${miss?'miss':''}">${safeText(t[i])}</span>`;
  }
  return html+'</div>';
}
function spellHintHTML(typed,retry){
  const target=letterAnswer();
  const first=target[0]||'';
  const bad=target.split('').find((ch,i)=>(typed[i]||'')&&typed[i]!==ch);
  const parts=[`首字母 ${safeText(first)}`,`分段 ${safeText(wordSegments(ANSWER))}`];
  if(bad)parts.push(`留意 ${safeText(bad)}`);
  if(retry>=2)parts.push('灰字描红');
  return `<div class="word-hint">${parts.join(' · ')}</div>${spellDiffHTML(typed,ANSWER)}`;
}
function typedLetterCount(){
  const inp=document.getElementById('spell-input');
  return inp?inp.value.toLowerCase().replace(/[^a-z]/g,'').length:0;
}
function updateSubmitState(count){
  const btn=document.getElementById('btn-submit');
  const letters=count===undefined?typedLetterCount():count;
  const wordReady=letters>=SLOTS.length;
  if(btn)btn.disabled=!wordReady;
}
function syncInputToTiles(){
  if(!CUR||CUR.phase!=='spell')return;
  const inp=document.getElementById('spell-input');
  const letters=[...inp.value.toLowerCase().replace(/[^a-z]/g,'')];
  SLOTS.forEach((s,i)=>{
    const ch=letters[i]||'';
    s.val=ch;s.el.textContent=ch;s.el.classList.remove('ghost');
  });
  POS=Math.min(letters.length,SLOTS.length);markCursor();
  updateSubmitState(letters.length);
  if(letters.length>=SLOTS.length&&!hasPhoneTask())setTimeout(()=>{if(CUR&&!CUR._locked){if(SES&&SES.mode==='blind')blindSubmit();else check();}},250);
}
function deleteLast(){
  if(!CUR||CUR.phase!=='spell')return;
  const inp=document.getElementById('spell-input');
  inp.value=inp.value.slice(0,-1);
  syncInputToTiles();
  beep('tap');
  inp.focus();
}
function useHint(){
  if(!CUR||CUR.phase!=='spell'||(SES&&SES.mode==='blind'))return;
  const inp=document.getElementById('spell-input');
  const target=letterAnswer();
  const typed=inp.value.toLowerCase().replace(/[^a-z]/g,'');
  let i=0;while(i<typed.length&&i<target.length&&typed[i]===target[i])i++;
  inp.value=target.slice(0,i+1);
  syncInputToTiles();
  HINTS++;
  document.getElementById('fb').textContent='💡 提示已用，这个词要多练一遍哦';
  document.getElementById('fb').className='fb';
  inp.focus();
}
function submitSpell(){
  if(!CUR||CUR.phase!=='spell')return;
  const inp=document.getElementById('spell-input');
  const typed=inp.value.toLowerCase().replace(/[^a-z]/g,'');
  if(typed.length<SLOTS.length){
    toast('还没写完哦，写完整再确认');
    inp.focus();
    return;
  }
  if(SES&&SES.mode==='blind'){blindSubmit();return;}
  check();
}
function check(){
  if(!CUR||CUR._locked)return;
  CUR._locked=true;
  const inp=document.getElementById('spell-input');
  const typed=inp.value.toLowerCase().replace(/[^a-z]/g,'');
  const wordOk=typed.length>0&&typed===letterAnswer();
  const phoneOk=!phoneAttempted()||phoneCorrect();
  const ok=wordOk;
  const fb=document.getElementById('fb');
  if(ok){
    SLOTS.forEach(s=>{s.el.classList.remove('cur');s.el.classList.add('ok')});
    if(phoneAttempted())renderPhonics(phoneOk?'ok':'bad');
    beep('ok');
    grade(true);
  }else{
    SLOTS.forEach((s,i)=>{if((typed[i]||'')!==s.ch.toLowerCase())s.el.classList.add('bad');s.el.classList.remove('cur')});
    if(phoneAttempted())renderPhonics(phoneOk?'ok':'bad');
    beep('bad');
    const nextRetry=(CUR.retry||0)+1;
    fb.innerHTML=`正确拼写：<b style="font-size:22px">${ANSWER}</b>${phoneAttempted()&&!phoneOk?`<br>正确音标：<b style="font-size:20px">/${PHONE_IPA}/</b>`:''}${spellHintHTML(typed,nextRetry)}`;
    fb.className='fb badc';
    speak(ANSWER);
    grade(false);
  }
}
function grade(ok){
  const st=S.w[CUR.id];
  const day=markActivity();
  if(ok){
    const noWrong=!CUR.attempted, clean=noWrong&&HINTS===0;
    S.combo++;S.bestCombo=Math.max(S.bestCombo,S.combo);
    let gain=0;
    if(!CUR.counted){
      CUR.counted=true;
      if(noWrong){SES.right++;day.r++;recordParentAnswer(CUR,true)}
      if(CUR.mode==='learn'){
        S.w[CUR.id]={b:1,d:addDays(1),r:1,wr:0};day.n++;gain=10;
      }else if(CUR.mode==='review'){
        S.rev++;day.rv++;
        const nb=clean?Math.min(st.b+1,7):st.b;
        st.b=nb;st.d=addDays(INTERVALS[nb]);st.r++;
        gain=clean?8:4;
      }else if(CUR.mode==='sprint'){
        gain=12; // 冲刺模式不改动记忆曲线盒子，纯速度练习
      }else if(CUR.mode==='revenge'){
        if(!S.w[CUR.id]){S.w[CUR.id]={b:1,d:addDays(1),r:1,wr:0};day.n++}
        else{const rst=S.w[CUR.id];const nb=clean?Math.min(rst.b+1,7):rst.b;rst.b=nb;rst.d=addDays(INTERVALS[nb]);rst.r++}
        fixWrongInPool(CUR.id);S.revengeFixed=(S.revengeFixed||0)+1;
        gain=clean?8:4;
      }else{ // quiz
        gain=3;
      }
      const mult=S.combo>=8?1.5:S.combo>=3?1.2:1;
      if(mult>1)gain=Math.round(gain*mult);
      if(S.combo===3)toast('🔥 连击×3！经验加成 1.2倍');
      if(S.combo===8)toast('🔥🔥 连击×8！经验加成 1.5倍');
      if(!SES.sprint){
        const bt=SES.board&&SES.board[SES.total-SES.queue.length];
        if(bt&&bt.type==='gift'){gain+=8;toast('🎁 打开宝箱，+8 XP！')}
        else if(bt&&bt.type==='coin'){gain+=3;toast('🪙 捡到金币，+3 XP')}
      }
    }
    S.xp+=gain;SES.xp+=gain;
    if(gain){
      const q=document.getElementById('qcard');
      const f=document.createElement('div');f.className='xpfloat';f.textContent='+'+gain+' XP';
      q.appendChild(f);setTimeout(()=>f.remove(),1000);
    }
    const fb=document.getElementById('fb');
    fb.textContent=['真棒！🎉','好厉害！👍','完全正确！✨','拼得漂亮！🌟'][Math.floor(Math.random()*4)];
    fb.className='fb good';
    SES.queue.shift();
    if(!SES.sprint)renderBoard();
    save();checkBadges();
    setTimeout(nextCard,900);
  }else{
    if(S.shields>0){
      S.shields--;
      toast('🛡️ 护盾帮你挡了一下，连击保住了！');
    }else{
      S.combo=0;
    }
    if(!CUR.attempted){
      SES.wrong++;day.w++;
      recordParentAnswer(CUR,false);
      S.wrongPool[CUR.id]=(S.wrongPool[CUR.id]||0)+1;
      if((CUR.mode==='review'||CUR.mode==='revenge')&&S.w[CUR.id]){
        S.w[CUR.id].b=1;S.w[CUR.id].d=addDays(1);S.w[CUR.id].wr=(S.w[CUR.id].wr||0)+1;S.rev++;day.rv++;
      }
    }
    CUR.attempted=true;CUR.retry=(CUR.retry||0)+1;
    save();
    if(SES.sprint){
      // 冲刺模式：错了直接换下一个词，不占用宝贵的时间重拼
      SES.queue.shift();
      setTimeout(nextCard,1100);
    }else{
      // 重拼同一个词
      setTimeout(()=>{SLOTS.forEach(s=>{s.val='';s.el.textContent=s.el.classList.contains('fix')?s.el.textContent:'';s.el.classList.remove('bad','ok')});
        resetPhonics();
        // 错2次后给灰色描红
        if(CUR.retry>=2)SLOTS.forEach(s=>{s.el.textContent=s.ch.toLowerCase();s.el.classList.add('ghost')});
        POS=0;markCursor();CUR._locked=false;
        updateSubmitState(0);
        const inp=document.getElementById('spell-input');inp.value='';inp.focus();
      },1600);
    }
  }
}
function endSession(quit){
  IN_SESSION=false;
  if(sprintInterval){clearInterval(sprintInterval);sprintInterval=null;}
  const timerEl=document.getElementById('sprint-timer');if(timerEl)timerEl.style.display='none';
  const total=SES.right+SES.wrong;
  if((SES.mode==='sprint'||SES.mode==='revenge')&&total>0){
    const day=markActivity();day.challengeDone=true;
  }
  if(SES.mode==='sprint'){S.sprintBest=Math.max(S.sprintBest||0,SES.right);}
  let doubled=false;
  if(SES.mode==='revenge'&&!quit&&SES.wrong===0&&SES.right>0){
    const bonus=SES.xp;S.xp+=bonus;SES.xp+=bonus;doubled=true;
  }
  document.getElementById('res-emoji').textContent=quit?'💾':SES.wrong===0&&total>0?'🏆':'🎉';
  document.getElementById('res-title').textContent=quit?'进度已保存':
    SES.mode==='sprint'?`冲刺结束！答对 ${SES.right} 题`:
    SES.mode==='revenge'?(SES.wrong===0&&total>0?'复仇成功，全部拿下！':'复仇完成'):
    (SES.wrong===0&&total>0?'全对！太厉害了！':'完成啦！');
  document.getElementById('res-sub').textContent=
    SES.mode==='sprint'?'再来一局，挑战自己的最高分吧！⏱️':
    SES.mode==='revenge'?(doubled?'全对通关，双倍经验已到账 🔥':'错题都变成了你的手下败将 💪'):
    SES.mode==='challenge'?'整篇课文都闯关完啦！明天记得回来复习 🌱':
    SES.mode==='review'?'记忆小种子又长大了一点 🌱':'温故而知新！';
  document.getElementById('res-right').textContent=SES.right;
  document.getElementById('res-wrong').textContent=SES.wrong;
  document.getElementById('res-xp').textContent='+'+SES.xp;
  if(!quit&&SES.wrong===0&&total>0){confetti();beep('win')}
  recordParentSession(SES);
  const coins=quit?0:awardCoins(sessionCoinReward(SES),'学习挑战');
  if(!quit&&total>0)awardMaterials('学习挑战',{right:SES.right,wrong:SES.wrong,mode:SES.mode});
  if(!quit&&SES.mode==='challenge'&&total>0)unlockBuildItem('word_monument');
  if(!quit&&SES.mode==='revenge'&&SES.wrong===0&&total>0)unlockBuildItem('wrong_furnace');
  if(coins)toast(`获得 ${coins} 金币和建造材料`);
  save();checkBadges();
  go('result');
  document.getElementById('scr-result').classList.add('on');
  const pend=PENDING_BADGES.slice();PENDING_BADGES=[];
  if(pend.length)setTimeout(()=>pend.forEach(enqueueBadge),600);
}

/* ================= 统计页 ================= */
function renderStats(){
  document.getElementById('s-learned').textContent=learnedCount();
  document.getElementById('s-master').textContent=masterCount();
  let r=0,w=0;Object.values(S.days).forEach(d=>{r+=d.r;w+=d.w});
  document.getElementById('s-acc').textContent=(r+w)?Math.round(r/(r+w)*100)+'%':'-';
  document.getElementById('s-streak').textContent=S.streak;
  document.getElementById('s-rev').textContent=S.rev;
  document.getElementById('s-units').textContent=doneUnits()+'/72';
  const ch=document.getElementById('chart'),xs=document.getElementById('chart-x');
  ch.innerHTML='';xs.innerHTML='';
  const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push(todayStr(d))}
  const vals=days.map(d=>{const x=S.days[d];return x?x.r+x.w:0});
  const mx=Math.max(...vals,1);
  days.forEach((d,i)=>{
    const b=document.createElement('div');b.className='bar';b.style.height=Math.max(vals[i]/mx*100,3)+'%';
    if(vals[i])b.innerHTML=`<i>${vals[i]}</i>`;
    ch.appendChild(b);
    const s=document.createElement('span');s.textContent=+d.slice(8);xs.appendChild(s);
  });
  const pct=learnedCount()/TOTAL_WORDS*100;
  document.getElementById('s-total-fill').style.width=pct+'%';
  document.getElementById('s-total-txt').textContent=`已学 ${learnedCount()} / ${TOTAL_WORDS} 个单词（${Math.round(pct)}%）`;
}
function weakUnitRows(){
  const p=ensureParentStats();
  const wrongByUnit={};
  Object.keys(S.wrongPool||{}).forEach(id=>{
    const ui=unitIndexFromId(id);
    if(ui!==null)wrongByUnit[ui]=(wrongByUnit[ui]||0)+1;
  });
  return UNITS.map((u,ui)=>{
    const st=p.units[String(ui)]||{answers:0,correct:0,wrong:0,sec:0};
    const answers=st.answers||0,correct=st.correct||0,wrong=st.wrong||0,pool=wrongByUnit[ui]||0;
    const acc=answers?correct/answers:null;
    const learned=unitProgress(ui),total=u.w.length;
    const lowAcc=answers>=3&&acc<0.8;
    const lightPractice=learned>0&&answers<3;
    const score=pool*5+wrong*2+(lowAcc?Math.round((0.8-acc)*20):0)+(lightPractice?1:0);
    return {ui,u,answers,correct,wrong,pool,acc,learned,total,score,lowAcc,lightPractice};
  }).filter(x=>x.score>0||x.pool>0).sort((a,b)=>b.score-a.score||b.wrong-a.wrong||a.ui-b.ui).slice(0,6);
}
function renderParent(){
  const p=ensureParentStats();
  const today=p.days[todayStr()]||{sec:0,sessions:0};
  document.getElementById('p-time-total').textContent=formatStudyTime(p.totalSec);
  document.getElementById('p-time-today').textContent=formatStudyTime(today.sec||0);
  document.getElementById('p-acc').textContent=parentAccuracy(p.correct,p.answers);
  document.getElementById('p-answers').textContent=p.answers;
  document.getElementById('p-sessions').textContent=p.sessions;
  document.getElementById('p-summary').textContent=p.answers?
    `累计 ${p.answers} 次答题，答对 ${p.correct} 次。学习时长从本版本开始自动累计。`:
    '还没有新的练习记录。孩子完成一次挑战后，这里会自动更新。';
  const goff=document.getElementById('parent-gacha-on');
  if(goff)goff.value=S.set.gachaOn===false?'关':'开';
  const glim=document.getElementById('parent-gacha-limit');
  if(glim)glim.value=String(Number.isFinite(+S.set.dailyPullLimit)?+S.set.dailyPullLimit:3);
  const box=document.getElementById('parent-weak-list');
  box.innerHTML='';
  const rows=weakUnitRows();
  if(!rows.length){
    box.innerHTML='<div class="empty-parent">暂时没有明显薄弱单元。继续练习后，这里会自动分析。</div>';
    return;
  }
  rows.forEach(x=>{
    const accText=x.answers?parentAccuracy(x.correct,x.answers):'练习不足';
    const reasons=[];
    if(x.pool)reasons.push(`错题池 ${x.pool} 个`);
    if(x.lowAcc)reasons.push('正确率偏低');
    if(x.lightPractice)reasons.push('练习次数少');
    if(x.wrong)reasons.push(`累计错 ${x.wrong} 次`);
    const pct=x.answers?Math.round(x.correct/x.answers*100):0;
    const d=document.createElement('div');
    d.className='weak-row';
    d.onclick=()=>openSheet(x.ui);
    d.innerHTML=`<div class="weak-title"><b>Unit ${x.ui+1} · Lesson ${x.u.l}</b><span>${accText}</span></div>
      <p>${safeText(x.u.t)} · 已学 ${x.learned}/${x.total}</p>
      <div class="weak-bar"><div style="width:${pct}%"></div></div>
      <i>${reasons.join(' · ')}</i>`;
    box.appendChild(d);
  });
}
function awardCoins(amount,reason){
  amount=Math.max(0,Math.round(amount||0));
  if(!amount)return 0;
  S.rewards=normalizeRewards(S.rewards);
  S.rewards.coins+=amount;
  const h=S.rewards.gacha.history;
  h.unshift({type:'coin',amount,reason,date:todayStr()});
  S.rewards.gacha.history=h.slice(0,30);
  return amount;
}
function sessionCoinReward(session){
  if(!session)return 0;
  const total=(session.right||0)+(session.wrong||0);
  if(!total)return 0;
  let coins=(session.right||0)*2;
  if(session.wrong===0)coins+=10;
  if(session.mode==='blind'&&session.right/total>=0.9)coins+=15;
  if(session.mode==='revenge'&&session.wrong===0)coins+=8;
  if(session.mode==='challenge')coins+=6;
  return coins;
}
function equipSkin(id){
  S.rewards=normalizeRewards(S.rewards);
  if(!S.rewards.inventory.includes(id)){toast('还没有获得这个皮肤');return}
  S.rewards.equipped=id;
  save();applySkin();renderBag();toast('已换上 '+SKIN_MAP[id].name);
}
function renderBag(){
  applySkin();
  const skin=currentSkin();
  const hero=document.getElementById('skin-hero');
  hero.innerHTML=`<div class="skin-preview ${skin.theme}">${skinArt(skin.id,'skin-preview-art')}</div><div><b>${skin.name}</b><i>${skin.rarity} · ${skin.desc}</i><p>金币：${S.rewards.coins}</p></div>`;
  const grid=document.getElementById('skin-grid');grid.innerHTML='';
  SKINS.forEach(sk=>{
    const owned=S.rewards.inventory.includes(sk.id),on=S.rewards.equipped===sk.id;
    const d=document.createElement('div');
    d.className='skin-card '+sk.theme+(owned?' owned':'')+(on?' on':'');
    d.innerHTML=`<div class="skin-avatar">${skinArt(sk.id,'skin-card-art')}</div><b>${sk.name}</b><i>${sk.rarity}</i><p>${sk.desc}</p><button class="sbtn ${on?'':'primary'}" ${owned?'':'disabled'}>${on?'已装备':owned?'装备':'未获得'}</button>`;
    d.querySelector('button').onclick=()=>equipSkin(sk.id);
    grid.appendChild(d);
  });
}
function drawSkin(){
  S.rewards=normalizeRewards(S.rewards);
  const pity=S.rewards.gacha.pity;
  const roll=Math.random();
  let pool;
  if(pity>=9||roll<0.06)pool=SKINS.filter(s=>s.rarity==='传说');
  else if(roll<0.24)pool=SKINS.filter(s=>s.rarity==='史诗');
  else if(roll<0.68)pool=SKINS.filter(s=>s.rarity==='稀有');
  else pool=SKINS.filter(s=>s.rarity==='普通');
  return pool[Math.floor(Math.random()*pool.length)]||SKIN_MAP.default;
}
function drawGachaReward(){
  const roll=Math.random();
  if(roll<0.45){
    const packs=[
      {wood:8,grass:5},
      {stone:6,wood:4},
      {snow:6,crystal:1},
      {crystal:3,stardust:1}
    ];
    return {type:'material',materials:packs[Math.floor(Math.random()*packs.length)]};
  }
  if(roll<0.7){
    const locked=BUILD_ITEMS.filter(b=>!ensureBuild().unlockedBlocks.includes(b.id)&&!b.unlock&&!b.earned);
    if(locked.length)return {type:'blueprint',itemId:locked[Math.floor(Math.random()*locked.length)].id};
  }
  return {type:'skin',skin:drawSkin()};
}
function todayPulls(){
  S.rewards=normalizeRewards(S.rewards);
  return S.rewards.gacha.daily[todayStr()]||0;
}
function pullGacha(){
  S.rewards=normalizeRewards(S.rewards);
  if(S.set.gachaOn===false){toast('家长已关闭抽奖，可以继续建造小岛');return}
  const limit=Number.isFinite(+S.set.dailyPullLimit)?+S.set.dailyPullLimit:3;
  if(todayPulls()>=limit){toast('今天抽奖次数用完啦，明天再来');return}
  if(S.rewards.coins<60){toast('金币不够，完成学习可以获得金币');return}
  S.rewards.coins-=60;
  S.rewards.gacha.pulls++;
  S.rewards.gacha.daily[todayStr()]=todayPulls()+1;
  const reward=drawGachaReward();
  if(reward.type==='skin'){
    const skin=reward.skin;
    const owned=S.rewards.inventory.includes(skin.id);
    let bonus=0;
    if(owned){
      bonus=skin.rarity==='传说'?45:skin.rarity==='史诗'?30:skin.rarity==='稀有'?18:10;
      S.rewards.coins+=bonus;
    }else{
      S.rewards.inventory.push(skin.id);
    }
    S.rewards.gacha.pity=skin.rarity==='传说'?0:S.rewards.gacha.pity+1;
    S.rewards.gacha.history.unshift({type:'skin',skin:skin.id,duplicate:owned,bonus,date:todayStr()});
    document.getElementById('gacha-stage').innerHTML=skinArt(skin.id,'skin-gacha-art');
    toast(owned?`抽到重复${skin.name}，返还 ${bonus} 金币`:`抽到新皮肤：${skin.name}`);
  }else if(reward.type==='blueprint'){
    unlockBuildItem(reward.itemId);
    const item=BUILD_MAP[reward.itemId];
    S.rewards.gacha.pity++;
    S.rewards.gacha.history.unshift({type:'blueprint',itemId:item.id,date:todayStr()});
    document.getElementById('gacha-stage').innerHTML=`<div class="gacha-blueprint">${buildArt(item.id,1)}</div>`;
    toast('抽到新蓝图：'+item.name);
  }else{
    addMaterials(reward.materials);
    S.rewards.gacha.pity++;
    S.rewards.gacha.history.unshift({type:'material',materials:reward.materials,reason:'抽奖材料包',date:todayStr()});
    document.getElementById('gacha-stage').innerHTML='<div class="gacha-material">▦</div>';
    toast('抽到材料包：'+materialText(reward.materials));
  }
  S.rewards.gacha.history=S.rewards.gacha.history.slice(0,30);
  save();
  renderGacha();
}
function renderGacha(){
  applySkin();
  S.rewards=normalizeRewards(S.rewards);
  const limit=Number.isFinite(+S.set.dailyPullLimit)?+S.set.dailyPullLimit:3;
  const off=S.set.gachaOn===false;
  document.getElementById('gacha-info').textContent=off?'家长已关闭抽奖；小岛建造仍可使用':`当前金币 ${S.rewards.coins} · 今日 ${todayPulls()}/${limit} · 已抽 ${S.rewards.gacha.pulls} 次`;
  document.getElementById('gacha-pity').textContent=`传说保底还差 ${Math.max(0,10-S.rewards.gacha.pity)} 抽`;
  const box=document.getElementById('gacha-history');box.innerHTML='';
  const hist=S.rewards.gacha.history.filter(x=>['skin','material','blueprint'].includes(x.type)).slice(0,8);
  if(!hist.length){box.innerHTML='<div class="empty-parent">还没有抽奖记录。</div>';return}
  hist.forEach(x=>{
    const d=document.createElement('div');d.className='gacha-row';
    if(x.type==='skin'){
      const sk=SKIN_MAP[SKIN_ALIASES[x.skin]||x.skin]||SKIN_MAP.default;
      d.innerHTML=`${skinArt(sk.id,'skin-history-art')}<div><b>${sk.name}</b><i>${x.duplicate?`重复返还 ${x.bonus} 金币`:'新皮肤'} · ${x.date}</i></div>`;
    }else if(x.type==='blueprint'){
      const item=BUILD_MAP[x.itemId]||BUILD_MAP.wood_house;
      d.innerHTML=`${buildArt(item.id,1)}<div><b>${item.name} 蓝图</b><i>已解锁 · ${x.date}</i></div>`;
    }else{
      d.innerHTML=`<span class="mat-pack">▦</span><div><b>材料包</b><i>${materialText(x.materials)} · ${x.date}</i></div>`;
    }
    box.appendChild(d);
  });
}

/* ================= 勋章页 ================= */
function renderBadges(){
  const g=document.getElementById('badge-grid');g.innerHTML='';
  BADGES.forEach(b=>{
    const got=S.badges.includes(b.id);
    const d=document.createElement('div');d.className='badge'+(got?' got':'');
    d.innerHTML=`<span>${b.e}</span><b>${b.n}</b><i>${b.d}</i>`;
    g.appendChild(d);
  });
  const tl=document.getElementById('tier-badge-list');tl.innerHTML='';
  TIER_BADGES.forEach(tb=>{
    const tier=tierOf(tb);
    const v=tb.metric();
    const nextTh=tb.tiers[tier]||tb.tiers[tb.tiers.length-1];
    const prevTh=tier>0?tb.tiers[tier-1]:0;
    const pct=tier>=3?100:Math.min(100,Math.round((v-prevTh)/(nextTh-prevTh)*100));
    const tierName=['未解锁','铜','银','金'][tier];
    const d=document.createElement('div');d.className='tbadge';
    d.innerHTML=`<span class="ticon">${tb.e}</span>
      <div class="tinfo"><b>${tb.n} <span style="color:#8a97ad;font-weight:400">${tierName}</span></b>
      <i>${tier>=3?'已满级 '+tb.tiers[2]:`${v}/${nextTh}`}</i>
      <div class="tbar"><div style="width:${pct}%"></div></div></div>
      <div class="tdots"><span class="${tier>=1?'on1':''}"></span><span class="${tier>=2?'on2':''}"></span><span class="${tier>=3?'on3':''}"></span></div>`;
    tl.appendChild(d);
  });
}

/* ================= 设置页 ================= */
function renderSettings(){
  document.getElementById('set-rate').value=S.set.rate;
  document.getElementById('set-sound').value=S.set.sound?'开':'关';
}
function exportData(){
  exportProfile();
}
function importData(inp){
  importProfileFile(inp);
}
function resetAll(){
  ask('确定要<b>清空全部学习进度</b>吗？<br>此操作不能撤销，建议先导出备份！','清空进度',()=>{
    localStorage.removeItem(KEY);location.reload();
  });
}

/* 启动 */
go('home');



