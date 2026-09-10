/**
 * 浏览器侧运行时。**构建目标和 Node 侧不是一套**（ADR-0012、ADR-0031）。
 *
 * 形状（ADR-0012）：约 1KB 的事件委托内核 + 六个互相独立的特性片段。
 * 编译一本 pamphlet 时由编译器扫 AST 得出用了哪几个，然后**字符串拼接**内嵌进产物——
 * 编译期不跑打包工具。
 *
 * 硬约束：
 *   · 片段之间禁止共享代码（否则拼接会漏依赖）；共用逻辑一律进内核。
 *   · 不能用 ES module（`file://` 下 module script 被 CORS 阻止，双击打开直接失效，ADR-0017）。
 *   · 每个片段自带 `data-pf-feature="名字"` 标记，供测试断言「不用的特性 0 字节」。
 */

export const RUNTIME_FEATURES = [
  'tabs',
  'collapse',
  'steps',
  'reveal',
  'theme',
  'diagram-zoom',
] as const

export type RuntimeFeature = (typeof RUNTIME_FEATURES)[number]

export function isRuntimeFeature(name: string): name is RuntimeFeature {
  return (RUNTIME_FEATURES as readonly string[]).includes(name)
}

/**
 * 内核：只做一件事——按需把片段注册的处理器挂上。
 * 片段通过 `__pf(选择器, 初始化函数)` 声明「页面上有这种元素时做什么」。
 */
const KERNEL = `
var __pfQueue=[];
function __pf(sel,init){__pfQueue.push([sel,init])}
function __pfRun(){for(var i=0;i<__pfQueue.length;i++){var e=__pfQueue[i],n=document.querySelectorAll(e[0]);for(var j=0;j<n.length;j++){e[1](n[j])}}}
`.trim()

const BOOT = `
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',__pfRun)}else{__pfRun()}
`.trim()

/**
 * 六个特性片段。每个都是自包含的：只用 DOM API 和内核的 `__pf`，
 * 不引用其它片段定义的任何标识符。
 */
const FRAGMENTS: Record<RuntimeFeature, string> = {
  // Tab：把真标题（无 JS 时的降级形态，ADR-0015）换成一排按钮
  tabs: `
__pf('[data-pf-tabs]',function(root){
  var panels=[].slice.call(root.querySelectorAll('.pf-tab'));
  if(panels.length===0)return;
  var list=document.createElement('div');
  list.className='pf-tab-list';
  list.setAttribute('role','tablist');
  var buttons=panels.map(function(panel,index){
    var title=panel.querySelector('.pf-tab-title');
    var button=document.createElement('button');
    button.type='button';
    button.className='pf-tab-button';
    button.setAttribute('role','tab');
    button.textContent=title?title.textContent:'面板'+(index+1);
    list.appendChild(button);
    return button;
  });
  function show(index){
    panels.forEach(function(panel,i){
      if(i===index){panel.removeAttribute('hidden')}else{panel.setAttribute('hidden','')}
      buttons[i].setAttribute('aria-selected',i===index?'true':'false');
      buttons[i].tabIndex=i===index?0:-1;
    });
  }
  list.addEventListener('click',function(event){
    var index=buttons.indexOf(event.target);
    if(index>=0){show(index);history.replaceState(null,'','#'+panels[index].getAttribute('data-pf-tab'))}
  });
  list.addEventListener('keydown',function(event){
    var current=buttons.indexOf(document.activeElement);
    if(current<0)return;
    var next=event.key==='ArrowRight'?current+1:event.key==='ArrowLeft'?current-1:-1;
    if(next<0||next>=buttons.length)return;
    event.preventDefault();buttons[next].focus();show(next);
  });
  root.insertBefore(list,root.firstChild);
  root.setAttribute('data-pf-ready','');
  var fromHash=panels.findIndex(function(p){return '#'+p.getAttribute('data-pf-tab')===location.hash});
  var marked=panels.findIndex(function(p){return p.hasAttribute('data-pf-default')});
  show(fromHash>=0?fromHash:marked>=0?marked:0);
});
`,
  // 折叠：<details> 原生就能用，运行时只负责把状态写进 URL 以便深链
  collapse: `
__pf('.pf-collapse',function(node){
  node.addEventListener('toggle',function(){
    var summary=node.querySelector('summary');
    if(node.open&&summary){history.replaceState(null,'','#'+encodeURIComponent(summary.textContent||''))}
  });
});
`,
  // 步骤揭示：编号由浏览器的 <ol> 算（ADR-0025），这里只做进入视口时的显现
  steps: `
__pf('.pf-steps li',function(node){
  if(!('IntersectionObserver' in window))return;
  node.setAttribute('data-pf-pending','');
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){entry.target.removeAttribute('data-pf-pending');io.unobserve(entry.target)}
    });
  },{threshold:0.15});
  io.observe(node);
});
`,
  reveal: `
__pf('[data-pf-reveal]',function(node){
  if(!('IntersectionObserver' in window))return;
  node.setAttribute('data-pf-pending','');
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){entry.target.removeAttribute('data-pf-pending');io.unobserve(entry.target)}
    });
  },{threshold:0.15});
  io.observe(node);
});
`,
  // 主题切换：记忆包在 try/catch 里，localStorage 在 file:// 下三家浏览器行为不同（ADR-0016）
  theme: `
__pf('body',function(body){
  var root=document.documentElement;
  var saved=null;
  try{saved=localStorage.getItem('pf-theme')}catch(e){}
  if(saved){root.setAttribute('data-pf-theme',saved)}
  var button=document.createElement('button');
  button.type='button';
  button.className='pf-theme-toggle';
  button.textContent='切换主题';
  button.addEventListener('click',function(){
    var dark=root.getAttribute('data-pf-theme')==='dark'||
      (!root.getAttribute('data-pf-theme')&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    var next=dark?'light':'dark';
    root.setAttribute('data-pf-theme',next);
    try{localStorage.setItem('pf-theme',next)}catch(e){}
  });
  body.appendChild(button);
});
`,
  // 图表缩放：作用在预渲染好的静态 SVG 上（ADR-0009，不引入运行时图表渲染）
  'diagram-zoom': `
__pf('.pf-diagram[data-pf-zoom] svg',function(svg){
  var scale=1,x=0,y=0,dragging=false,sx=0,sy=0;
  function apply(){svg.style.transformOrigin='0 0';svg.style.transform='translate('+x+'px,'+y+'px) scale('+scale+')'}
  svg.addEventListener('wheel',function(event){
    event.preventDefault();
    scale=Math.min(6,Math.max(0.4,scale*(event.deltaY<0?1.1:0.9)));apply();
  },{passive:false});
  svg.addEventListener('pointerdown',function(event){dragging=true;sx=event.clientX-x;sy=event.clientY-y;svg.setPointerCapture(event.pointerId)});
  svg.addEventListener('pointermove',function(event){if(dragging){x=event.clientX-sx;y=event.clientY-sy;apply()}});
  svg.addEventListener('pointerup',function(){dragging=false});
  svg.addEventListener('dblclick',function(){scale=1;x=0;y=0;apply()});
});
`,
}

/**
 * 只在 `pamphlet serve` 下追加的一段：源文档改了就重新加载。
 *
 * 它必须参与 CSP 哈希的计算（和其它片段一样先拼后哈希），否则浏览器会拒绝执行整段脚本。
 * 正式产物里不含它——`serve` 是开发时的临时形态，不是交付形态。
 */
export const LIVE_RELOAD = `
new EventSource('/__pamphlet_reload').addEventListener('message',function(){location.reload()});
`.trim()

/**
 * 按用到的特性拼出运行时脚本。编译期只做字符串拼接，不跑打包工具（ADR-0012）。
 * 一个特性都没用到时返回空字符串——产物里连 `<script>` 标签都不会有。
 */
export function assembleRuntime(features: Iterable<string>): string {
  const used = RUNTIME_FEATURES.filter((feature) => [...features].includes(feature))
  if (used.length === 0) return ''
  const parts = used.map(
    (feature) => `/* data-pf-feature="${feature}" */\n${FRAGMENTS[feature].trim()}`,
  )
  return [KERNEL, ...parts, BOOT].join('\n')
}
