"use strict";
/* BBQ Station — приложение */
/* ============================================================
   СЛОЙ ДАННИ — оформен като API на Янак (api.eyanak.com).
   getGroups / getStocks / createOrder повтарят реалните endpoint-и.
   За интеграция: смяна на тялото им с fetch(), UI остава непокътнат.
   Полето modifiers (комбинации) живее ОТ НАША страна — управлява се
   в Администрация и при поръчка се превръща в редове/бележка към ордера.
   ============================================================ */
const YanakAPI = {
  async getGroups(){
    return [{id:1,name:"Скара"},{id:2,name:"Салати"},{id:3,name:"Напитки"},{id:4,name:"Бира"},{id:5,name:"Добавки"}];
  },
  async getStocks(){
    // Реално меню от обекта. Цените са в ЛЕВА. Грамажите при скарата са в сурово състояние.
    // Месата от Скарата са самостоятелни (избор на брой). С флаг garnishable:true
    // в листа се предлагат гарнитури (салати) и хляб — всяка със свой брой и цена.
    return [
      // ── Скара (избор на брой + гарнитури) ──
      {id:101,groupID:1,name:"Кюфте",basicPrice:1.20,price:1.20,emoji:"🧆",description:"90 г · сурово тегло",garnishable:true,modifiers:[]},
      {id:102,groupID:1,name:"Кебапче",basicPrice:1.20,price:1.20,emoji:"🍢",description:"90 г · сурово тегло",garnishable:true,modifiers:[]},
      {id:103,groupID:1,name:"Свинска кълцаница",basicPrice:4.50,price:4.50,emoji:"🍖",description:"220 г · сурово тегло",garnishable:true,modifiers:[]},
      {id:104,groupID:1,name:"Телешка плескавица",basicPrice:3.60,price:3.60,emoji:"🍔",description:"200 г · сурово тегло",garnishable:true,modifiers:[]},
      {id:105,groupID:1,name:"Свинска пържола (врат)",basicPrice:4.60,price:4.60,emoji:"🥩",description:"Вратна · 250 г · сурово тегло",garnishable:true,modifiers:[]},
      {id:106,groupID:1,name:"Свински бекон",basicPrice:3.50,price:3.50,emoji:"🥓",description:"200 г · сурово тегло",garnishable:true,modifiers:[]},
      {id:107,groupID:1,name:"Пилешко филе",basicPrice:4.50,price:4.50,emoji:"🍗",description:"250 г · сурово тегло",garnishable:true,modifiers:[]},
      {id:108,groupID:1,name:"Пилешка пържола (бут)",basicPrice:4.50,price:4.50,emoji:"🍗",description:"Бутче · 250 г · сурово тегло",garnishable:true,modifiers:[]},
      {id:109,groupID:1,name:"Телешка наденица",basicPrice:2.40,price:2.40,emoji:"🌭",description:"125 г · сурово тегло",garnishable:true,modifiers:[]},
      {id:110,groupID:1,name:"Телешки адана кебап",basicPrice:2.60,price:2.60,emoji:"🍢",description:"100 г · сурово тегло",garnishable:true,modifiers:[]},
      // ── Салати (100 г) ──
      {id:201,groupID:2,name:"Боб с лютеница",basicPrice:1.20,price:1.20,emoji:"🫘",description:"100 г",modifiers:[]},
      {id:202,groupID:2,name:"Снежанка",basicPrice:1.20,price:1.20,emoji:"🥒",description:"100 г",modifiers:[]},
      {id:203,groupID:2,name:"Руска салата",basicPrice:1.20,price:1.20,emoji:"🥗",description:"100 г",modifiers:[]},
      {id:204,groupID:2,name:"Чеснова със сирене",basicPrice:1.20,price:1.20,emoji:"🧄",description:"100 г",modifiers:[]},
      {id:205,groupID:2,name:"Кьопоолу",basicPrice:1.20,price:1.20,emoji:"🍆",description:"100 г",modifiers:[]},
      {id:206,groupID:2,name:"Домати с краставици",basicPrice:1.20,price:1.20,emoji:"🍅",description:"100 г",modifiers:[]},
      {id:207,groupID:2,name:"Зеле с моркови",basicPrice:0.60,price:0.60,emoji:"🥬",description:"100 г",modifiers:[]},
      {id:208,groupID:2,name:"Картофена салата",basicPrice:1.20,price:1.20,emoji:"🥔",description:"100 г",modifiers:[]},
      // ── Напитки (безалкохолни + топли) ──
      {id:301,groupID:3,name:"Кока-Кола 0.5 л",basicPrice:1.50,price:1.50,emoji:"🥤",description:"",modifiers:[]},
      {id:302,groupID:3,name:"Кока-Кола 0.33 л",basicPrice:1.30,price:1.30,emoji:"🥤",description:"",modifiers:[]},
      {id:303,groupID:3,name:"Фанта 0.5 л",basicPrice:1.50,price:1.50,emoji:"🥤",description:"",modifiers:[]},
      {id:304,groupID:3,name:"Фанта 0.33 л",basicPrice:1.30,price:1.30,emoji:"🥤",description:"",modifiers:[]},
      {id:305,groupID:3,name:"Спрайт 0.5 л",basicPrice:1.50,price:1.50,emoji:"🥤",description:"",modifiers:[]},
      {id:306,groupID:3,name:"Капи 0.33 л",basicPrice:1.60,price:1.60,emoji:"🧃",description:"",modifiers:[]},
      {id:307,groupID:3,name:"Лимонада 0.5 л",basicPrice:1.00,price:1.00,emoji:"🍋",description:"",modifiers:[]},
      {id:308,groupID:3,name:"Студен чай 0.5 л",basicPrice:1.70,price:1.70,emoji:"🧊",description:"",modifiers:[]},
      {id:309,groupID:3,name:"Кафе",basicPrice:1.00,price:1.00,emoji:"☕",description:"",modifiers:[]},
      {id:310,groupID:3,name:"Чай",basicPrice:0.80,price:0.80,emoji:"🍵",description:"",modifiers:[]},
      // ── Бира (кен 0.5 л) ──
      {id:401,groupID:4,name:"Пиринско",basicPrice:1.50,price:1.50,emoji:"🍺",description:"кен · 0.5 л",modifiers:[]},
      {id:402,groupID:4,name:"Шуменско",basicPrice:1.50,price:1.50,emoji:"🍺",description:"кен · 0.5 л",modifiers:[]},
      {id:403,groupID:4,name:"Загорка",basicPrice:1.50,price:1.50,emoji:"🍺",description:"кен · 0.5 л",modifiers:[]},
      {id:404,groupID:4,name:"Каменица",basicPrice:1.50,price:1.50,emoji:"🍺",description:"кен · 0.5 л",modifiers:[]},
      {id:405,groupID:4,name:"Ариана",basicPrice:1.50,price:1.50,emoji:"🍺",description:"кен · 0.5 л",modifiers:[]},
      // ── Добавки ──
      {id:501,groupID:5,name:"Сос",basicPrice:0.20,price:0.20,emoji:"🥫",description:"30 г",modifiers:[]},
      {id:502,groupID:5,name:"Питка хляб",basicPrice:0.60,price:0.60,emoji:"🍞",description:"100 г",modifiers:[]},
    ];
  },
  async createOrder(payload){
    await new Promise(r=>setTimeout(r,650));
    console.log("→ ЯНАК POST /e-shop/api/order:",payload);
    return {docID:genTrackID()};
  },
};

const state={
  mode:"client", groups:[], items:[], activeGroup:null, productImages:{},
  cart:[], view:"menu", modalItem:null, modalSel:{}, modalQty:1, modalNote:"", modalGarnish:{}, modalShown:false,
  order:{name:"",phone:"",time:"asap"},
  orders:[], activeOrderId:null, autoSim:false,
  tracking:false, trackInput:false, trackInputVal:"", trackErr:"",
  adminTab:"products", adminDraft:null, adminKey:"",
  runtime:{demoMode:true,adminRequired:false},
  menuOverrides:{customItems:[],patches:{},hidden:[]},
};
// Криптографски 5-символен tracking ID (букви + цифри). ~60 млн комбинации.
function genTrackID(){const chars="abcdefghijklmnopqrstuvwxyz0123456789";const a=new Uint8Array(5);
  crypto.getRandomValues(a);for(let i=0;i<5;i++)a[i]=chars.charCodeAt(a[i]%36);
  return String.fromCharCode(...a);}
// Валута: показваме едновременно евро и лева (фиксиран курс 1 € = 1,95583 лв).
// Цените в данните са в ЛЕВА; еврото се изчислява от тях.
const EUR_RATE=1.95583;
const fmtNum=n=>n.toFixed(2).replace(".",",");
const money=n=>fmtNum(n/EUR_RATE)+" € · "+fmtNum(n)+" лв";
// Цена с йерархия: евро (водещо) + лева (приглушено). За по-чист, премиум вид.
const moneyHTML=n=>`<span class="m-eur">${fmtNum(n/EUR_RATE)} €</span><span class="m-lv">${fmtNum(n)} лв</span>`;
const moneyStackHTML=n=>`<span class="money-stack">${moneyHTML(n)}</span>`;
// Пояснение към реда в кошницата: при 2+ бройки показва единичната цена
// в евро и лева (напр. „5 × 0,61 € · 1,20 лв“), консистентно с останалите цени.
function linePortionText(l){
  const parts=[];
  if(l.qty>1) parts.push(l.qty+" × "+money(l.unit));
  if(l.summary&&l.summary.length) parts.push((l.qty>1?"всяка с: ":"+ ")+l.summary.join(" · "));
  return parts.join(" · ");
}

/* ====== ДАННИ ЗА ОБЕКТА — сменете със своите реални стойности ======
   lat/lng са координатите на ресторанта (вижте ги в Google Maps:
   десен бутон → „Какво има тук" показва числата). */
const VENUE={
  name:"BBQ Station",
  address:"Околовръстен път, кв. Младост, гр. София",
  phone:"088 814 0114",
  lat:42.6229811,
  lng:23.391395,
};
const venueTel=()=>VENUE.phone.replace(/[^\d+]/g,"");
const mapEmbedURL=()=>`https://www.google.com/maps?q=${VENUE.lat},${VENUE.lng}&z=16&hl=bg&output=embed`;
const gmapsURL=()=>`https://www.google.com/maps/dir/?api=1&destination=${VENUE.lat},${VENUE.lng}`;
const wazeURL=()=>`https://waze.com/ul?ll=${VENUE.lat},${VENUE.lng}&navigate=yes`;
function venueCard(){return `<div class="venue">
  <div class="venue-h">📍 Къде да ни намерите</div>
  <iframe class="venue-map" src="${mapEmbedURL()}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Карта към ${VENUE.name}"></iframe>
  <div class="venue-body">
    <div class="venue-addr"><span class="vpin">🍽️</span><div><b>${VENUE.name}</b><span>${VENUE.address}</span></div></div>
    <div class="venue-nav">
      <a class="vbtn gmaps" href="${gmapsURL()}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>Google Maps</a>
      <a class="vbtn waze" href="${wazeURL()}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>Waze</a>
    </div>
    <a class="vbtn call" href="tel:${venueTel()}">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>
      Поръчки: ${VENUE.phone}</a>
  </div></div>`;}
const root=document.getElementById("root");
const uid=()=>"o"+Math.random().toString(36).slice(2,7);

// Локално запомняне на поръчки на това устройство. В реалната версия статусът
// се освежава от Янак (GET /order по docID); тук пазим записа за демото.
// try/catch — за да не чупи, ако средата блокира localStorage.
const store={
  read(){try{const r=localStorage.getItem("gb_orders");return r?JSON.parse(r):null;}catch(e){return null;}},
  write(o){try{localStorage.setItem("gb_orders",JSON.stringify(o));}catch(e){}}
};
function persist(){store.write({orders:state.orders.slice(0,10),activeOrderId:state.activeOrderId});}

// Viber през сървърния proxy (Infobip). Първото известие при нова поръчка се праща и от сървъра.
const VIBER={ endpoint:"/api/send-viber" };
function adminHeaders(extra={}){const h={...extra};if(state.adminKey)h["X-Admin-Key"]=state.adminKey;return h;}
function loadAdminKey(){try{state.adminKey=sessionStorage.getItem("bbq_admin_key")||"";}catch(e){state.adminKey="";}}
function saveAdminKey(k){state.adminKey=k||"";try{if(k)sessionStorage.setItem("bbq_admin_key",k);else sessionStorage.removeItem("bbq_admin_key");}catch(e){}}
function normalizePhone(p){let d=(p||"").replace(/[^\d]/g,"");if(d.startsWith("00"))d=d.slice(2);if(d.startsWith("0"))d="359"+d.slice(1);return d;}

// Единен логинг: пише в конзолата на браузъра И праща към сървъра (/api/log),
// за да виждаме целия timeline на едно място — дори при тест от телефон.
function glog(tag,data){
  try{console.log("%c[GB] "+tag,"color:#d25a2a;font-weight:700",data??"");}catch(e){}
  try{fetch("/api/log",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({tag,data}),keepalive:true});}catch(e){}
}

async function sendViber(to,text){ if(!VIBER.endpoint||!to){glog("viber:skip",{to,reason:"няма endpoint/телефон"});return;}
  try{
    const r=await fetch(VIBER.endpoint,{method:"POST",
      headers:adminHeaders({"Content-Type":"application/json"}),
      body:JSON.stringify({to,text})});
    const body=await r.text().catch(()=>"");
    glog("viber:result",{to,httpStatus:r.status,ok:r.ok,response:body.slice(0,300)});
  }
  catch(e){ glog("viber:error",{to,error:String(e)}); /* best-effort: демо нотификацията се показва дори при провал */ } }

// ── Синхронизация на поръчките със сървъра (за тракинг линка от друго устройство) ──
function saveOrderToServer(o){
  try{fetch("/api/orders",{method:"POST",headers:adminHeaders({"Content-Type":"application/json"}),
    body:JSON.stringify(o),keepalive:true});}catch(e){}
}
async function fetchOrderFromServer(docID){
  try{const r=await fetch("/api/orders/"+encodeURIComponent(docID));
    if(!r.ok)return null;return await r.json();}catch(e){return null;}
}
async function fetchAllOrdersFromServer(){
  try{const r=await fetch("/api/orders",{headers:adminHeaders()});
    if(!r.ok)return null;const arr=await r.json();
    return Array.isArray(arr)?arr:null;}catch(e){return null;}
}
function mergeOrders(local,remote){
  const byId=new Map();
  [...(local||[]),...(remote||[])].forEach(o=>{
    if(!o||o.docID===undefined||o.docID===null)return;
    const id=o.docID,prev=byId.get(id);
    if(!prev||(o.updatedAt||0)>=(prev.updatedAt||0))byId.set(id,o);
  });
  return [...byId.values()].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
}
// Автоматичното обновяване е изключено — потребителят обновява ръчно с refresh/F5.
let trackTimer=null;
function startTrackPolling(docID){
  stopTrackPolling();
  // NO-OP: авто-polling е изключен. Потребителят натиска F5 за актуален статус.
}
function stopTrackPolling(){if(trackTimer){clearInterval(trackTimer);trackTimer=null;}}
function normalizeMenuItem(it){
  const p=Number(it.basicPrice)||0;
  return {...it,basicPrice:p,price:Number(it.price??p)||p,
    modifiers:Array.isArray(it.modifiers)?it.modifiers:[],
    available:it.available!==false};
}
function applyMenuOverrides(seedItems,ov){
  const hidden=new Set((ov.hidden||[]).map(Number));
  let items=seedItems.filter(i=>!hidden.has(i.id)).map(i=>normalizeMenuItem({...i}));
  Object.entries(ov.patches||{}).forEach(([id,p])=>{
    const n=Number(id);const it=items.find(x=>x.id===n);
    if(it)Object.assign(it,normalizeMenuItem({...it,...p,id:n}));
  });
  (ov.customItems||[]).forEach(c=>{
    const item=normalizeMenuItem({...c});
    const ix=items.findIndex(x=>x.id===item.id);
    if(ix>=0)items[ix]=item;else items.push(item);
  });
  return items;
}
async function persistMenuOverrides(){
  const body={customItems:state.menuOverrides.customItems,patches:state.menuOverrides.patches,hidden:state.menuOverrides.hidden};
  const r=await fetch("/api/menu-overrides",{method:"POST",headers:adminHeaders({"Content-Type":"application/json"}),body:JSON.stringify(body)});
  if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||"неуспешен запис на менюто");}
}
function isCustomItem(id){return state.menuOverrides.customItems.some(c=>c.id===id);}
function nextProductId(){
  const ids=state.items.map(i=>i.id).concat(state.menuOverrides.customItems.map(c=>c.id));
  return(Math.max(0,...ids,600)+1);
}
function itemToStore(it){
  return{id:it.id,groupID:it.groupID,name:it.name,basicPrice:it.basicPrice,price:it.price??it.basicPrice,
    emoji:it.emoji||"🍽️",description:it.description||"",modifiers:it.modifiers||[],
    garnishable:!!it.garnishable,available:it.available!==false};
}
function groupName(gid){return(state.groups.find(g=>g.id===gid)||{}).name||"—";}

async function boot(){
  if(!document.getElementById("toasts")){const t=document.createElement("div");t.id="toasts";t.setAttribute("role","alert");t.setAttribute("aria-live","polite");document.body.appendChild(t);}
  loadAdminKey();
  try{
    const rc=await fetch("/api/config");
    if(rc.ok)state.runtime=await rc.json();
  }catch(e){}
  if(!state.runtime.demoMode&&new URLSearchParams(location.search).get("admin")==="1")state.mode="admin";
  state.groups=await YanakAPI.getGroups();
  const seed=await YanakAPI.getStocks();
  seed.forEach(i=>{if(i.available===undefined)i.available=true;});
  try{const r=await fetch("/api/menu-overrides");if(r.ok)state.menuOverrides=await r.json()||state.menuOverrides;}catch(e){}
  if(!state.menuOverrides.customItems)state.menuOverrides.customItems=[];
  if(!state.menuOverrides.patches)state.menuOverrides.patches={};
  if(!state.menuOverrides.hidden)state.menuOverrides.hidden=[];
  state.items=applyMenuOverrides(seed,state.menuOverrides);
  try{const r=await fetch("/api/product-images");if(r.ok)state.productImages=await r.json()||{};}catch(e){}
  const saved=store.read();
  if(saved&&saved.orders){state.orders=saved.orders;state.activeOrderId=saved.activeOrderId||null;}
  const serverOrders=await fetchAllOrdersFromServer();
  if(serverOrders&&serverOrders.length){state.orders=mergeOrders(state.orders,serverOrders);persist();}
  state.activeGroup=state.groups[0].id;
  // Линк към статус: ?track=<docID> отваря екрана със статуса на поръчката.
  const trackId=new URLSearchParams(location.search).get("track");
  if(trackId){
    let local=state.orders.find(o=>o.docID===trackId);
    if(!local){
      // Не е на това устройство → дърпаме от сървъра (линкът от Viber работи навсякъде).
      const fresh=await fetchOrderFromServer(trackId);
      if(fresh){state.orders.unshift(fresh);local=fresh;}
    }
    if(local){
      state.tracking=true;state.activeOrderId=trackId;state.view="confirm";
      glog("app:track-link",{docID:trackId,source:"loaded"});
      startTrackPolling(trackId);
    } else {
      glog("app:track-link",{docID:trackId,source:"not-found"});
    }
  }
  glog("app:boot",{groups:state.groups.length,items:state.items.length,savedOrders:state.orders.length});
  let layoutT;
  const onLayoutChange=()=>{clearTimeout(layoutT);layoutT=setTimeout(()=>{syncRotateLock();if(state.mode!=="admin"&&state.view!=="confirm"&&!document.activeElement?.matches("input,textarea,select"))render();},100);};
  window.addEventListener("resize",onLayoutChange);
  window.addEventListener("orientationchange",onLayoutChange);
  syncRotateLock();
  render();
}
function isPhoneLandscape(){return window.matchMedia("(orientation:landscape) and (max-height:520px)").matches;}
function syncRotateLock(){
  const el=document.getElementById("rotateLock");if(!el)return;
  const on=isPhoneLandscape();
  el.classList.toggle("show",on);
  el.hidden=!on;
  document.body.classList.toggle("phone-landscape",on);
}
const cartCount=()=>state.cart.reduce((s,l)=>s+l.qty,0);
const cartTotal=()=>state.cart.reduce((s,l)=>s+l.lineTotal,0);
function lineUnit(item,sel){let p=item.basicPrice;(item.modifiers||[]).forEach(g=>{const c=sel[g.key]||[];g.options.forEach(o=>{if(c.includes(o.id))p+=o.delta;});});return p;}
function selSummary(item,sel){const parts=[];(item.modifiers||[]).forEach(g=>{const c=sel[g.key]||[];g.options.forEach(o=>{if(c.includes(o.id))parts.push(o.name);});});return parts;}

function openItem(item){state.modalItem=item;state.modalQty=1;state.modalNote="";state.modalSel={};state.modalGarnish={};state.modalShown=false;render();
  requestAnimationFrame(()=>{state.modalShown=true;document.getElementById("scrim")?.classList.add("show");document.getElementById("sheet")?.classList.add("show");});}
function closeSheet(){state.modalShown=false;document.getElementById("scrim")?.classList.remove("show");document.getElementById("sheet")?.classList.remove("show");
  setTimeout(()=>{state.modalItem=null;render();},300);}
function keepSheetOpen(){document.getElementById("scrim")?.classList.add("show");document.getElementById("sheet")?.classList.add("show");}
function toggleOpt(k,id,single){const it=state.modalItem;const cur=state.modalSel[k]||[];
  state.modalSel[k]=single?[id]:(cur.includes(id)?cur.filter(x=>x!==id):[...cur,id]);
  const chosen=state.modalSel[k];
  document.querySelectorAll(`.opt[data-grp="${k}"]`).forEach(el=>el.classList.toggle("sel",chosen.includes(el.dataset.opt)));
  updateModalFooter();}
// Гарнитури (салати) и хляб при скарата — всяка със свой брой.
const GRILL_BREAD_IDS=[502];
function garnishItems(){return state.items.filter(i=>i.groupID===2);}
function breadItems(){return state.items.filter(i=>GRILL_BREAD_IDS.includes(i.id));}
function grillExtras(){return garnishItems().concat(breadItems());}
function garRowHTML(g){return `<div class="gar-row">
  <div class="gar-info"><span class="gar-nm">${g.emoji} ${g.name}</span><span class="gar-pr">${money(g.basicPrice)}</span></div>
  <div class="qty sm"><button data-gdec="${g.id}">−</button><b data-gq="${g.id}">${state.modalGarnish[g.id]||0}</b><button data-ginc="${g.id}">+</button></div></div>`;}
// Сметка в листа: месо × брой + сбор от (всяка добавка × нейн брой).
function modalTotal(){const it=state.modalItem;if(!it)return 0;
  if(it.garnishable){let t=it.basicPrice*state.modalQty;
    grillExtras().forEach(g=>{t+=(state.modalGarnish[g.id]||0)*g.basicPrice;});return t;}
  return lineUnit(it,state.modalSel)*state.modalQty;}
function changeGarnish(id,d){const cur=state.modalGarnish[id]||0;
  state.modalGarnish[id]=Math.max(0,cur+d);
  const b=document.querySelector(`.sheet [data-gq="${id}"]`);if(b)b.textContent=state.modalGarnish[id];
  updateModalFooter();}
function updateModalFooter(){const it=state.modalItem;if(!it)return;
  const valid=modalValid();
  const qb=document.querySelector(".sheet .qty:not(.sm) b");if(qb)qb.textContent=state.modalQty;
  const btn=document.getElementById("addCart");if(btn){btn.disabled=!valid;
    const s=btn.querySelectorAll("span");
    if(s[0])s[0].textContent=valid?'Добави в кошницата':'Избери задължителните опции';
    if(s[1])s[1].textContent=money(modalTotal());}}
function modalValid(){const it=state.modalItem;if(!it)return false;return (it.modifiers||[]).every(g=>{const c=(state.modalSel[g.key]||[]).length;return c>=(g.min||0)&&(!g.required||c>=1);});}
// Сбор от гарнитурите на един комбиниран ред (всяка × неин брой).
function garnishTotal(l){return (l.garnishes||[]).reduce((s,g)=>s+g.price*g.qty,0);}
// Имена на гарнитурите за реда: „Снежанка ×2 · Зеле с моркови" (текст за Viber).
function lineGarnishNames(l){return (l.garnishes||[]).map(g=>g.name+(g.qty>1?" ×"+g.qty:"")).join(" · ");}
// Гарнитурите всяка на свой ред (статус/кухня — без цени).
function lineGarnishRows(l){return (l.garnishes||[]).map(g=>`<span class="li-opt">+ ${g.emoji?g.emoji+" ":""}${g.name}${g.qty>1?" ×"+g.qty:""}</span>`).join("");}
// Разбивка на групиран ред: месо и всяка гарнитура на отделен ред със собствена цена.
function lineBreakdownRows(l){
  let rows=`<div class="br"><span class="br-l">${l.qty} × ${fmtNum(l.unit)} лв</span><span class="br-p">${moneyHTML(l.unit*l.qty)}</span></div>`;
  (l.garnishes||[]).forEach(g=>{
    rows+=`<div class="br"><span class="br-l">+ ${g.emoji?g.emoji+" ":""}${g.name}${g.qty>1?" ×"+g.qty:""}</span><span class="br-p">${moneyHTML(g.price*g.qty)}</span></div>`;
  });
  return rows;
}
function addToCart(){const it=state.modalItem;
  if(it.garnishable){
    // Един групиран ред: месо (брой × цена) + избраните гарнитури, всяка със свой брой.
    const garnishes=grillExtras().map(g=>({id:g.id,name:g.name,emoji:g.emoji,price:g.basicPrice,qty:state.modalGarnish[g.id]||0})).filter(g=>g.qty>0);
    const gtot=garnishes.reduce((s,g)=>s+g.price*g.qty,0);const note=state.modalNote.trim();
    // Чисто месо (без гарнитури и бележка) се слива в един ред → „2× Кюфте".
    if(!garnishes.length&&!note){
      const ex=state.cart.find(l=>l.itemId===it.id&&!(l.garnishes&&l.garnishes.length)&&!l.note);
      if(ex){ex.qty+=state.modalQty;ex.lineTotal=ex.unit*ex.qty;closeSheet();return;}
    }
    state.cart.push({lineId:Date.now()+Math.random(),itemId:it.id,name:it.name,emoji:it.emoji,
      sel:{},summary:[],garnishes,note,qty:state.modalQty,unit:it.basicPrice,
      lineTotal:it.basicPrice*state.modalQty+gtot});
    closeSheet();return;
  }
  const unit=lineUnit(it,state.modalSel);
  state.cart.push({lineId:Date.now()+Math.random(),itemId:it.id,name:it.name,emoji:it.emoji,
    sel:JSON.parse(JSON.stringify(state.modalSel)),summary:selSummary(it,state.modalSel),garnishes:[],
    note:state.modalNote.trim(),qty:state.modalQty,unit,lineTotal:unit*state.modalQty});closeSheet();}
// Бързо добавяне за продукти без опции (напр. напитки) — без отваряне на екрана за избор.
function quickAdd(it){
  const unit=lineUnit(it,{});
  const ex=state.cart.find(l=>l.itemId===it.id&&(!l.summary||!l.summary.length)&&!l.note);
  if(ex){ex.qty++;ex.lineTotal=ex.unit*ex.qty;}
  else{state.cart.push({lineId:Date.now()+Math.random(),itemId:it.id,name:it.name,emoji:it.emoji,
    sel:{},summary:[],note:"",qty:1,unit,lineTotal:unit});}
  render();cartToast(it.name);
}
function cartToast(name){const wrap=document.getElementById("toasts");if(!wrap)return;
  const el=document.createElement("div");el.className="toast cart";
  el.innerHTML=`<div class="t-av">✓</div><div class="t-tx"><b>Добавено в кошницата</b>${name}</div>`;
  wrap.appendChild(el);requestAnimationFrame(()=>el.classList.add("show"));
  setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),320);},2200);}
function updateTotalsUI(){const t=cartTotal(),c=cartCount();
  document.querySelectorAll(".js-cart-total").forEach(e=>{
    if(e.classList.contains("money-stack"))e.innerHTML=moneyHTML(t);
    else if(e.querySelector(".money-stack"))e.querySelector(".money-stack").innerHTML=moneyHTML(t);
    else e.textContent=money(t);});
  document.querySelectorAll(".js-cart-count").forEach(e=>e.textContent=c);}
function changeQtyCart(id,d){const l=state.cart.find(x=>x.lineId===id);if(!l)return;
  // Комбо с гарнитури — количеството не се пипа от кошницата (+ добавя само месо).
  if(l.garnishes&&l.garnishes.length)return;
  l.qty=Math.max(1,l.qty+d);l.lineTotal=l.unit*l.qty+garnishTotal(l);
  const el=document.querySelector(`[data-line="${id}"]`);
  if(el){el.querySelector(".lt").innerHTML=moneyStackHTML(l.lineTotal);el.querySelector(".qn").textContent=l.qty;
    const p=el.querySelector(".js-portion");if(p)p.textContent=linePortionText(l);updateTotalsUI();persist();}
  else{persist();render();}}
function removeLine(id){state.cart=state.cart.filter(x=>x.lineId!==id);persist();render();}

async function placeOrder(){
  const btn=document.getElementById("placeBtn");if(btn){btn.disabled=true;btn.textContent="Изпращане…";}
  const payload={type:"takeaway",customer:{name:state.order.name,phone:state.order.phone},pickup:state.order.time,
    lines:state.cart.map(l=>({stockId:l.itemId,qty:l.qty,unitPrice:l.unit,options:(l.garnishes&&l.garnishes.length)?l.garnishes.map(g=>g.name+(g.qty>1?" ×"+g.qty:"")):l.summary,note:l.note})),total:cartTotal()};
  glog("order:submit",payload);
  const res=await YanakAPI.createOrder(payload);
  const rec={docID:res.docID,name:state.order.name,phone:state.order.phone,time:state.order.time,
    lines:state.cart.map(l=>({name:l.name,qty:l.qty,summary:l.summary,garnishes:l.garnishes||[],note:l.note})),total:cartTotal(),status:1,notifs:[]};
  glog("order:created",{docID:res.docID,name:rec.name,phone:rec.phone,pickup:pickupText(rec),
    lines:rec.lines.map(lineLabel),total:rec.total});
  state.orders.unshift(rec);state.activeOrderId=res.docID;state.view="confirm";
  history.replaceState(null,"",keepVParam("track",res.docID));
  const inf=statusInfo(1);
  if(inf){const e={channel:inf.channel,toast:inf.toast,text:messageFor(rec,1),docID:res.docID,time:nowHM()};
    rec.notifs.push(e);toast(e);glog("notify:viber:server",{docID:res.docID,reason:"първо известие от сървъра"});}
  saveOrderToServer(rec);
  state.cart=[];persist();render();
}
let simTimer=null;
const nowHM=()=>{const d=new Date();return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);};
// ── ЕДИН ИЗТОЧНИК НА ИСТИНА ЗА СЪДЪРЖАНИЕТО НА ПОРЪЧКАТА ──
// Едни и същи редове се ползват навсякъде: кошница, екран „Благодарим",
// Viber съобщение и изгледа на кухнята (Администрация). Така няма разминаване.

const PAY_NOTE="💳 Плащане само на място — с карта или в брой.";

// Час за вземане в човешки вид.
function pickupText(o){
  if(!o.time||o.time==="asap")return "сега";
  return "след "+o.time+" мин";
}
// Един ред от поръчката като чист текст: „2× Име (опции) — бел.: …".
function lineLabel(l){
  let line=l.qty+"× "+l.name;
  if(l.garnishes&&l.garnishes.length)line+=" + "+lineGarnishNames(l);
  else if(l.summary&&l.summary.length)line+=" ("+(l.qty>1?"всяка с: ":"")+l.summary.join(", ")+")";
  if(l.note)line+=" — бел.: "+l.note;
  return line;
}
// Списък за текстово съобщение (Viber/SMS).
function orderLinesText(o){return (o.lines||[]).map(l=>"• "+lineLabel(l)).join("\n");}
// Същият списък за HTML (екран на клиента и кухнята).
function orderLinesHTML(o){
  return (o.lines||[]).map(l=>{
    let h=`<b>${l.qty}× ${esc(l.name)}</b>`;
    if(l.garnishes&&l.garnishes.length)h+=lineGarnishRows(l);
    else if(l.summary&&l.summary.length)h+=` <span class="li-opt">${l.qty>1?"всяка с: ":""}${l.summary.join(", ")}</span>`;
    if(l.note)h+=`<span class="li-note">📝 ${esc(l.note)}</span>`;
    return `<div class="ol-line">${h}</div>`;
  }).join("");
}

// Канал + кратък етикет за toast/лога.
// Линк към страницата със статуса на конкретната поръчка.
function statusLink(o){return location.origin+"/?track="+o.docID;}
function statusInfo(s){
  // Известията минават през Viber (реалният канал).
  // Статус 2 („приготвя се") НЕ праща съобщение — само сменя статуса.
  if(s===1)return{channel:"viber",toast:"Получихме поръчката ти ✅"};
  if(s===3)return{channel:"viber",toast:"Готова за вземане ✅ Заповядай!"};
  return null;
}
// Пълният текст, който РЕАЛНО се изпраща (и се показва на клиента 1:1).
function messageFor(o,s){
  if(s===1){
    return [
      "Здравей"+(o.name?", "+o.name:"")+"! 🍽️",
      "Получихме поръчката ти #"+o.docID+".",
      "",
      "🧾 Поръчано:",
      orderLinesText(o),
      "",
      "Общо: "+money(o.total),
      "⏰ За вземане: "+pickupText(o),
      PAY_NOTE,
      "",
      "🔗 Проследи статуса: "+statusLink(o),
    ].join("\n");
  }
  if(s===3){
    return [
      "Поръчка #"+o.docID+" е ГОТОВА за вземане ✅",
      "⏰ Заповядай да я вземеш ("+pickupText(o)+").",
      PAY_NOTE,
      "",
      "🔗 Детайли: "+statusLink(o),
    ].join("\n");
  }
  return "";
}
function toast(e){const wrap=document.getElementById("toasts");if(!wrap)return;
  const el=document.createElement("div");el.className="toast "+e.channel;
  el.innerHTML=`<div class="t-av">${e.channel==='sms'?'✉':'V'}</div><div class="t-tx"><b>${e.channel==='sms'?'SMS':'Viber'} → #${e.docID}</b>${e.toast}</div>`;
  wrap.appendChild(el);requestAnimationFrame(()=>el.classList.add("show"));
  setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),320);},4200);}
const STATUS_NAME=["","приета","приготвя се","готова за вземане","взета"];
function setStatus(docID,s){const o=state.orders.find(x=>x.docID===docID);if(!o)return;o.status=s;
  const inf=statusInfo(s);
  glog("order:status",{docID,status:s,statusName:STATUS_NAME[s]||String(s),channel:inf?inf.channel:"—"});
  if(inf){
    // text = точният текст, който се показва в toast/лога (Viber се праща от сървъра).
    const e={channel:inf.channel,toast:inf.toast,text:messageFor(o,s),docID,time:nowHM()};
    o.notifs.push(e);if(!state.autoSim)toast(e);
  }
  saveOrderToServer(o);
  persist();if(state.view==="confirm" && !state.autoSim)refreshConfirm();}
function trackOrder(docID){state.tracking=true;state.activeOrderId=docID;state.view="confirm";state.trackInput=false;state.trackErr="";history.replaceState(null,"",keepVParam("track",docID));render();}
function advanceOrder(docID){const o=state.orders.find(x=>x.docID===docID);if(o&&o.status<4)setStatus(docID,o.status+1);}
function runAutoSim(docID){state.autoSim=true;const steps=[2,3];let i=0;
  const next=()=>{if(!state.autoSim||state.activeOrderId!==docID)return;
    if(i>=steps.length){state.autoSim=false;return;}
    setStatus(docID,steps[i]);i++;simTimer=setTimeout(next,2000);};
  simTimer=setTimeout(next,1700);}
function stopSim(){state.autoSim=false;clearTimeout(simTimer);}
function keepVParam(k,v){const sp=new URLSearchParams(location.search);sp.set(k,v);return"/?"+sp.toString();}

function clientShell(){
  const foot=appFooter();
  const rail=`<div class="panel-rail">`+cartPanel()+`</div>`;
  const overlays=floatCart()+sheet();
  if(isSidePanelLayout()){
    return `<main class="app" id="main-content">`+header()+
      `<div class="layout"><div class="main">`+trackBanner()+`<div class="menu-sticky">`+tabs()+`</div>`+menu()+foot+
      `</div>`+rail+`</div>`+overlays+`</div>`;
  }
  /* Категориите извън .app — иначе overflow-x:clip чупи sticky на iOS/Android. */
  return `<div class="app app-head">`+header()+trackBanner()+`</div>`+
    `<div class="menu-sticky menu-sticky-mobile">`+tabs()+`</div>`+
    `<div class="app app-body">`+
    `<div class="layout"><div class="main">`+menu()+foot+`</div>`+rail+`</div>`+
    overlays+`</div>`;
}

function refreshConfirm(){
  const el=document.querySelector(".confirm");if(!el)return;
  const o=state.orders.find(x=>x.docID===state.activeOrderId)||{docID:"—",name:"",total:0,status:1,lines:[],notifs:[]};
  const done=o.status>=3;
  const c=el.querySelector(".check-circle");if(c)c.textContent=done?"🎉":"✓";
  const h=el.querySelector("h2");if(h)h.textContent=done?"Поръчката е готова!":"Благодарим!";
  const st=el.querySelector(".stepper");
  if(st){
    const steps=st.querySelectorAll(".step");
    steps.forEach((s,i)=>{const idx=i+1,cls=idx<o.status?"done":idx===o.status?"active":"pending";
      s.className="step "+cls;const d=s.querySelector(".dot");if(d)d.textContent=idx<o.status?"✓":String(idx);});
  }
  const vb=el.querySelector(".vibebox");
  if(vb){
    const last=o.notifs&&o.notifs.length?o.notifs[o.notifs.length-1]:null;
    const av=vb.querySelector(".av"),tx=vb.querySelector(".tx");
    if(av){av.className="av"+(last&&last.channel==="sms"?" sms":"");av.textContent=last&&last.channel==="sms"?"✉":"V";}
    if(tx){const b=tx.querySelector("b");if(b)b.textContent=last?((last.channel==="sms"?"SMS":"Viber")+" до "+(o.phone||"клиента")):"Известие";
      const tn=tx.childNodes[tx.childNodes.length-1];if(tn&&tn.nodeType===3)tn.textContent=last?(last.toast||last.text):"Ще получиш Viber/SMS при промяна на статуса.";}
  }
  const nl=el.querySelector(".nlog");
  if(o.notifs&&o.notifs.length){
    const rendered=nl?nl.querySelectorAll(".nlog-item").length:0;
    for(let i=rendered;i<o.notifs.length;i++){
      const n=o.notifs[i],div=document.createElement("div");div.className="nlog-item";
      div.innerHTML='<span class="ch '+n.channel+'">'+(n.channel==="viber"?"Viber":"SMS")+'</span><span class="nt">'+(n.toast||n.text)+'</span><span class="tm">'+n.time+'</span>';
      if(nl)nl.appendChild(div);
    }
  }
  const ab=el.querySelector("#autoSim"),sb=el.querySelector("#sim");
  if(!done&&state.runtime.demoMode){
    if(ab){ab.disabled=state.autoSim;const sp=ab.querySelector("span");if(sp)sp.textContent=state.autoSim?"⏳ Симулира се…":"▶ Пусни демо на целия път";}
    if(sb)sb.disabled=state.autoSim;
  }
}
function render(){
  const sy=window.scrollY;
  const grab=s=>{const e=document.querySelector(s);return e?e.scrollTop:0;};
  const psT=grab(".panel-scroll"),ssT=grab(".sheet-scroll"),asT=grab(".amodal-scroll");
  const foot=appFooter();
  if(state.mode==="admin"){root.innerHTML=demobar()+`<main class="app" id="main-content">`+adminView()+`</main>`+foot+adminModal();bindCommon();bindAdmin();}
  else if(state.view==="confirm"){
    const ec=document.querySelector(".confirm");
    if(ec){refreshConfirm();}
    else{root.innerHTML=demobar()+`<main class="app" id="main-content">`+confirmView()+`</main>`+foot;}
    bindCommon();bindConfirm();}
  else{root.innerHTML=demobar()+clientShell();bindCommon();bindClient();}
  document.body.classList.toggle("has-demobar",state.mode!=="admin"&&!!state.runtime.demoMode);
  document.body.classList.toggle("cart-open",state.mode!=="admin"&&(state.view==="cart"||state.view==="checkout"));
  document.body.classList.toggle("checkout-full",state.mode!=="admin"&&state.view==="checkout"&&useCheckoutFullscreen());
  document.body.classList.toggle("has-floatcart",state.mode==="client"&&cartCount()>0&&!isSidePanelLayout());
  window.scrollTo(0,sy);
  const set=(s,v)=>{const e=document.querySelector(s);if(e)e.scrollTop=v;};
  set(".panel-scroll",psT);set(".sheet-scroll",ssT);set(".amodal-scroll",asT);
  requestAnimationFrame(()=>{window.scrollTo(0,sy);set(".panel-scroll",psT);set(".sheet-scroll",ssT);set(".amodal-scroll",asT);});
}
function isSidePanelLayout(){
  if(isPhoneLandscape())return false;
  return window.matchMedia("(min-width:768px) and (orientation:landscape)").matches;
}
function sideCartColumnWidth(){
  const w=window.innerWidth;
  if(w<768)return 0;
  return w>=960?Math.min(340,w*0.30):Math.min(300,w*0.34);
}
function isCheckoutSideLayout(){return isSidePanelLayout()&&sideCartColumnWidth()>=320;}
function useCheckoutFullscreen(){return isSidePanelLayout()&&!isCheckoutSideLayout();}

function trackBanner(){
  const active=state.orders.find(o=>o.status<4);
  if(!active && !state.trackInput) return "";
  const labels=["","приета","приготвя се","готова за вземане","взета"];
  let row;
  if(active){
    row=`<div class="tb-l"><span class="tb-dot s${active.status}"></span>
      <div class="tb-tx"><b>Активна поръчка #${active.docID}</b><span>статус: ${labels[active.status]}</span></div></div>
      <button class="tb-btn" data-track="${active.docID}">Виж статуса →</button>`;
  } else {
    row=`<div class="tb-l"><span class="tb-dot s0"></span>
      <div class="tb-tx"><b>Проследи поръчка</b><span>Въведи номер за проверка на статуса</span></div></div>`;
  }
  const inp=state.trackInput?`<div class="tb-input"><input id="trackNum" aria-label="Номер на поръчка" placeholder="напр. k7m2x" value="${state.trackInputVal||''}">
    <button class="tb-go" id="trackGo">Провери</button></div>${state.trackErr?`<div class="tb-err">${state.trackErr}</div>`:''}`:'';
  return `<div class="trackbar ${active?'active':''}">${row}${inp}</div>`;
}

function appFooter(){return `<footer class="site-footer">Разработено от <a href="https://blv.bg" target="_blank" rel="noopener">BLV Systems</a></footer>`;}

function demobar(){
  if(!state.runtime.demoMode)return "";
  return `<div class="demobar"><b>Демо</b>
  <div class="seg">
    <button class="${state.mode==='client'?'on':''}" data-mode="client">🍽️ Клиент</button>
    <button class="${state.mode==='admin'?'on':''}" data-mode="admin">⚙️ Администрация</button>
  </div></div>`;}

function header(){return `<header role="banner"><div class="brand">
    <div><h1><span class="amp">BBQ</span> Station</h1><div class="sub">Поръчка за вземане · ${VENUE.address}</div></div>
    <div class="brand-right"><button class="track-btn" id="trackBtn" aria-label="Проследи поръчка" aria-label="Проследи поръчка"><span class="t-icon" aria-hidden="true">🔍</span> Проследи</button>
    <button class="cart-btn" id="openCart" aria-label="Отвори количка" aria-label="Отвори количка"><span>Кошница</span>${cartCount()?`<span class="count js-cart-count" aria-label="${cartCount()} продукта" aria-label="${cartCount()} продукта">${cartCount()}</span>`:""}</button></div>
  </div></header>`;}
function imgFor(it){return (it&&state.productImages[it.id])||null;}
// Напитки — продуктови снимки без фон; останалите ястия — cover върху градиента.
const PACK_SHOT_GROUPS=new Set([3]);
function isPackShotGroup(gid){return PACK_SHOT_GROUPS.has(Number(gid));}
function isPackShot(it){return it&&isPackShotGroup(it.groupID);}
function packShotForProduct(productId){
  const it=state.items.find(x=>x.id===productId);
  if(it&&isPackShotGroup(it.groupID))return true;
  return isPackShotGroup(state.adminDraft?.groupID);
}
function isAlphaImageFile(file){
  const t=(file.type||"").toLowerCase();
  if(t==="image/png"||t==="image/webp")return true;
  return /\.(png|webp)$/i.test(file.name||"");
}
function canvasHasAlpha(ctx,w,h){
  const data=ctx.getImageData(0,0,w,h).data;
  const step=Math.max(1,Math.floor(Math.sqrt(w*h)/80));
  for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){
    if(data[(y*w+x)*4+3]<252)return true;
  }
  return false;
}
function drawResizedImage(img,w,h,{whiteBg=false}={}){
  const c=document.createElement("canvas");c.width=w;c.height=h;
  const ctx=c.getContext("2d");
  if(whiteBg){ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);}
  ctx.drawImage(img,0,0,w,h);
  return c;
}
function thumbClass(it){const c=["thumb"];if(imgFor(it)&&isPackShot(it))c.push("pack-shot");return c.join(" ");}
// Снимка с „topло" fallback към емоджи, ако още няма качена реална снимка.
function thumbInner(it){const u=imgFor(it);
  return u?`<img class="thumb-img" src="${u}" alt="${(it.name||'').replace(/"/g,'&quot;')}" width="118" height="118" loading="eager" decoding="sync">`:`<span>${it.emoji||"🍽️"}</span>`;}
function scrollToGroup(gid){
  const el=document.getElementById("grp-"+gid);if(!el)return;
  const sticky=document.querySelector(".menu-sticky");
  const tb=document.querySelector(".tabs");const db=document.querySelector(".demobar");
  let margin=12;
  if(sticky){
    const cs=getComputedStyle(sticky);
    const stickTop=cs.position==="sticky"?(parseFloat(cs.top)||0):0;
    const padTop=parseFloat(cs.paddingTop)||0;
    margin=stickTop+padTop+sticky.offsetHeight+12;
  }else if(tb){
    const cs=getComputedStyle(tb);
    const tabTop=cs.position==="sticky"?(parseFloat(cs.top)||0):0;
    const tabH=tb.offsetHeight;
    const dbH=db?db.offsetHeight:0;
    margin=Math.max(dbH,tabTop+tabH)+12;
  }
  el.style.scrollMarginTop=margin+"px";
  // scrollIntoView е по-надеждно от window.scrollTo; на десктоп — веднага (smooth често не скролва).
  const instant=isSidePanelLayout();
  el.scrollIntoView({behavior:instant?"auto":"smooth",block:"start"});
}
function tabs(){return `<div class="tabs" role="tablist">${state.groups.map(g=>
  `<button type="button" role="tab" aria-selected="${g.id===state.activeGroup?'true':'false'}" class="tab ${g.id===state.activeGroup?'active':''}" data-g="${g.id}">${g.name}</button>`).join("")}</div>`;}
function menu(){let out=`<div class="menu">`;state.groups.forEach(g=>{
    const items=state.items.filter(i=>i.groupID===g.id);
    out+=`<div id="grp-${g.id}"><div class="group-title">${g.name} <small>${items.length} ястия</small></div><div class="grid">`;
    items.forEach(it=>{const hasOpt=it.garnishable||(it.modifiers||[]).length>0;const sold=it.available===false;
      out+=`<div class="card ${sold?'sold':''}" data-item="${it.id}" data-sold="${sold}"><div class="${thumbClass(it)}">${thumbInner(it)}</div>
        <div class="card-body"><div class="name">${it.name}</div>${it.description?`<div class="desc">${it.description}</div>`:""}
        <div class="meta"><span class="price">${moneyHTML(it.basicPrice)}</span>${sold?`<span class="badge-sold">изчерпано</span>`:(it.garnishable?`<span class="badge-opt">+ гарнитури · хляб</span>`:(hasOpt?`<span class="badge-opt">с избор</span>`:""))}</div></div>
        ${sold?"":`<div class="add-fab">+</div>`}</div>`;});
    out+=`</div></div>`;});return out+venueCard()+`</div>`;}
function floatCart(){if(!cartCount())return"";return `<div class="floatcart" id="floatcart">
    <button class="btn-primary" id="openCart2"><span>Виж кошницата · <span class="js-cart-count">${cartCount()}</span> ${cartCount()===1?'продукт':'продукта'}</span><span class="js-cart-total">${money(cartTotal())}</span></button></div>`;}

function sheet(){const it=state.modalItem;if(!it)return `<div class="scrim" id="scrim"></div>`;
  const noteBlock=`<div class="opt-group"><div class="opt-head"><h3>Забележка към кухнята</h3></div>
        <textarea class="note-in" id="note" rows="2" placeholder="напр. без лук, добре опечено…">${state.modalNote}</textarea></div>`;
  const qtyRow=(label)=>`<div class="qty-row"><div class="qty-lbl"><span>${label}</span></div>
        <div class="qty"><button id="qminus">−</button><b>${state.modalQty}</b><button id="qplus">+</button></div></div>`;
  let body="";
  if(it.garnishable){
    // Скара: първо брой на месото, после гарнитури и хляб (всяка със свой брояч).
    const gars=garnishItems();const breads=breadItems();
    body=`${it.description?`<div class="sheet-desc">${it.description}</div>`:""}
      ${qtyRow("Брой")}
      <div class="opt-group"><div class="opt-head"><h3>Гарнитури</h3><span class="opt-req optx">по избор</span></div>
        <div class="garnish-list">${gars.map(g=>garRowHTML(g)).join("")}</div></div>
      <div class="opt-group"><div class="opt-head"><h3>Хляб</h3><span class="opt-req optx">по избор</span></div>
        <div class="garnish-list">${breads.map(g=>garRowHTML(g)).join("")}</div></div>
      ${noteBlock}`;
  } else {
    let groups="";
    (it.modifiers||[]).forEach(g=>{const single=g.max===1;const chosen=state.modalSel[g.key]||[];
      groups+=`<div class="opt-group"><div class="opt-head"><h3>${g.title}</h3>
        <span class="opt-req ${g.required?'req':'optx'}">${g.required?'задължително':'по избор'}</span></div>
        ${g.options.map(o=>{const sel=chosen.includes(o.id);
          return `<div class="opt ${single?'':'check'} ${sel?'sel':''}" data-grp="${g.key}" data-opt="${o.id}" data-single="${single}">
            <div class="mark"></div><div class="lbl">${o.name}</div>
            <div class="delta">${o.delta>0?'+ '+money(o.delta):'включено'}</div></div>`;}).join("")}</div>`;});
    body=`${it.description?`<div class="sheet-desc">${it.description}</div>`:""}${groups}${noteBlock}${qtyRow("Брой порции")}`;
  }
  const valid=modalValid();const heroImg=imgFor(it);
  return `<div class="scrim show" id="scrim"></div><div class="sheet${state.modalShown?' show':''}" id="sheet">
    <div class="sheet-hero ${heroImg?'has-img':''}${heroImg&&isPackShot(it)?' pack-shot':''}"${heroImg?` style="background-image:url('${heroImg}')"`:''}>${heroImg?'':`<span class="emoji">${it.emoji||"🍽️"}</span>`}<h2>${it.name}</h2><button class="sheet-close" id="closeSheet">✕</button></div>
    <div class="sheet-scroll">${body}</div>
    <div class="sheet-foot"><button class="btn-primary split" id="addCart" ${valid?'':'disabled'}>
      <span>${valid?'Добави в кошницата':'Избери задължителните опции'}</span><span>${money(modalTotal())}</span></button></div></div>`;}

function cartPanel(){
  const show=(state.view==="cart"||state.view==="checkout");
  const checkoutFull=state.view==="checkout"&&useCheckoutFullscreen();
  const side=isSidePanelLayout()&&!checkoutFull;
  let inner="";let title="Кошница";let backCls="";let closeBtn="";
  let panelCls="panel"+(show?" show":"")+(checkoutFull?" panel-checkout-full":"");
  if(state.view==="checkout"){
    title="Данни за вземане";backCls="show-d";const o=state.order;const ready=o.name.trim()&&o.phone.trim().length>=6;
    inner=`<div class="panel-scroll">
      <div class="field"><label>Име за поръчката</label><input id="f-name" value="${esc(o.name)}" placeholder="напр. Иван"></div>
      <div class="field"><label>Телефон за нотификация</label><input id="f-phone" value="${esc(o.phone)}" placeholder="+359 ..." inputmode="tel"></div>
      <div class="field"><label>Кога ще вземете поръчката?</label><div class="time-opts">
        <div class="time-opt ${o.time==='asap'?'sel':''}" data-time="asap">Сега</div>
        <div class="time-opt ${o.time==='30'?'sel':''}" data-time="30">След 30 мин</div>
        <div class="time-opt ${o.time==='45'?'sel':''}" data-time="45">След 45 мин</div>
        <div class="time-opt ${o.time==='60'?'sel':''}" data-time="60">След 1 час</div></div></div>
      <div class="pay-note"><span class="ic">💳</span><div><b>Плащане само на място — с карта или в брой.</b></div></div>
      <div class="orderbox"><div class="ob-h">🧾 Вашата поръчка</div>
        ${state.cart.map(l=>`<div class="ol-line"><div class="ol-top"><span class="ol-nm">${l.qty}× ${esc(l.name)}</span><span class="ol-pr">${moneyHTML(l.lineTotal)}</span></div>${l.garnishes&&l.garnishes.length?lineBreakdownRows(l):(linePortionText(l)?`<span class="li-opt">${esc(linePortionText(l))}</span>`:"")}${l.note?`<span class="li-note">📝 ${esc(l.note)}</span>`:""}</div>`).join("")}
        <div class="ob-total"><span>Общо</span>${moneyStackHTML(cartTotal())}</div></div></div>
      <div class="sheet-foot"><button class="btn-primary" id="placeBtn" ${ready?'':'disabled'}>
        ${ready?'Изпрати поръчката':'Попълни име и телефон'}</button></div>`;
  } else {
    if(!state.cart.length){
      if(side){panelCls+=" panel-side-empty";inner=`<div class="empty-compact"><span class="empty-ic">🛒</span><span>Добави ястия от менюто</span></div>`;}
      else{title="Кошница";closeBtn=`<button class="panel-close" id="panelClose" type="button" aria-label="Затвори">✕</button>`;
        inner=`<div class="empty-compact"><span class="empty-ic">🛒</span><span>Добави ястия от менюто</span></div>`;}
    }else{
      if(side)title="Кошница · "+cartCount();
      else{title="Кошница";closeBtn=`<button class="panel-close" id="panelClose" type="button" aria-label="Затвори">✕</button>`;}
      inner=`<div class="panel-scroll">${state.cart.map(l=>`<div class="cart-line" data-line="${l.lineId}">
        <div class="top"><div class="nm">${l.emoji} ${esc(l.name)}</div><div class="lt">${moneyStackHTML(l.lineTotal)}</div></div>
        ${l.garnishes&&l.garnishes.length?lineBreakdownRows(l):`<div class="opts js-portion">${linePortionText(l)}</div>`}${l.note?`<div class="opts">📝 ${esc(l.note)}</div>`:""}
        <div class="ctrls">${l.garnishes&&l.garnishes.length?`<span class="qty-lock">за промяна — премахни и добави отново</span>`:
          `<div class="q"><button data-dec="${l.lineId}" aria-label="по-малко">−</button><b class="qn">${l.qty}</b><button data-inc="${l.lineId}" aria-label="повече">+</button></div>`}
          <button class="rm" data-rm="${l.lineId}">премахни</button></div></div>`).join("")}</div>
      <div class="sheet-foot"><button class="btn-primary split" id="toCheckout"><span>Завърши поръчката</span><span class="js-cart-total money-stack">${moneyHTML(cartTotal())}</span></button></div>`;}
  }
  const hideHead=side&&panelCls.includes("panel-side-empty");
  const head=hideHead?"":`<div class="panel-head"><button class="back ${backCls}" id="panelBack" aria-label="Назад"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><h2>${title}</h2>${closeBtn}</div>`;
  return `<div class="${panelCls}" id="panel">${head}${inner}</div>`;
}

function confirmView(){
  const o=state.orders.find(x=>x.docID===state.activeOrderId)||(state.activeOrderId?{docID:state.activeOrderId,name:"",total:0,status:1,lines:[],notifs:[]}:{docID:"—",name:"",total:0,status:1,lines:[],notifs:[]});
  const steps=[{t:"Поръчката е приета",s:"Ресторантът я получи в Янак"},{t:"Приготвя се",s:"Кухнята работи по нея"},{t:"Готова за вземане",s:"Заповядай да я вземеш!"}];
  const stepsHtml=steps.map((st,i)=>{const idx=i+1;let cls=idx<o.status?"done":idx===o.status?"active":"pending";
    return `<div class="step ${cls}"><div class="dot">${idx<o.status?'✓':idx}</div><div class="lbl-s"><b>${st.t}</b><span>${st.s}</span></div></div>`;}).join("");
  const done=o.status>=3;
  const last=o.notifs&&o.notifs.length?o.notifs[o.notifs.length-1]:null;
  const logHtml=(o.notifs||[]).map(n=>`<div class="nlog-item"><span class="ch ${n.channel}">${n.channel==='viber'?'Viber':'SMS'}</span>
     <span class="nt">${n.toast||n.text}</span><span class="tm">${n.time}</span></div>`).join("");
  const orderBox=(o.lines&&o.lines.length)?`<div class="orderbox">
      <div class="ob-h">🧾 Твоята поръчка</div>
      ${orderLinesHTML(o)}
      <div class="ob-meta"><span>⏰ За вземане: ${pickupText(o)}</span><span>${PAY_NOTE}</span></div>
      <div class="ob-total"><span>Общо</span>${moneyStackHTML(o.total)}</div></div>`:"";
  return `<div class="confirm"><div class="confirm-top">BBQ Station</div>
    <div class="check-circle">${done?'🎉':'✓'}</div>
    <h2>${done?'Поръчката е готова!':'Благодарим!'}</h2>
    <div class="ordno">Номер на поръчка: <b>#${o.docID}</b></div>
    <div class="ordno">за ${esc(o.name||'клиент')}</div>
    ${orderBox}
    <div class="vibebox"><div class="av ${last&&last.channel==='sms'?'sms':''}">${last&&last.channel==='sms'?'✉':'V'}</div>
      <div class="tx"><b>${last?((last.channel==='sms'?'SMS':'Viber')+' до '+(o.phone||'клиента')):'Известие'}</b>${last?(last.toast||last.text):'Ще получиш Viber/SMS при промяна на статуса.'}</div></div>
    <div class="stepper">${stepsHtml}</div>
    ${o.notifs&&o.notifs.length?`<div class="nlog"><div class="nlog-h">Изпратени известия</div>${logHtml}</div>`:""}
    <div class="trackcode">Код за проследяване: <b>#${o.docID}</b><span>Запази го — линкът към статуса е и в твоето Viber/SMS известие, така че можеш да се върнеш по всяко време.</span></div>
    ${venueCard()}
    ${!done&&state.runtime.demoMode?`<button class="btn-primary" id="autoSim" ${state.autoSim?'disabled':''} style="margin-top:18px">
        <span>${state.autoSim?'⏳ Симулира се…':'▶ Пусни демо на целия път'}</span></button>
      <button class="sim-btn" id="sim" ${state.autoSim?'disabled':''}>→ Само една стъпка напред</button>`:""}
    ${state.tracking?`<button class="link-btn" id="backMenu">← Обратно към менюто</button>`:`<button class="link-btn" id="newOrder">Нова поръчка</button>`}</div>`;
}

/* ---------------- ADMIN ---------------- */
function adminView(){
  if(state.runtime.adminRequired&&!state.adminKey)return `<div class="admin">${adminGate()}</div>`;
  return `<div class="admin"><div class="admin-head"><h1>Администрация</h1>
      <p>BBQ Station · управление на менюто и поръчките</p></div>
    <div class="admin-wrap">
      <div class="admin-tabs">
        <button class="${state.adminTab==='products'?'on':''}" data-atab="products">Продукти и комбинации</button>
        <button class="${state.adminTab==='orders'?'on':''}" data-atab="orders">Входящи поръчки${state.orders.filter(o=>o.status<3).length?' ('+state.orders.filter(o=>o.status<3).length+')':''}</button>
      </div>
      ${state.adminTab==='products'?adminProducts():adminOrders()}
    </div></div>`;
}
function adminProductRow(it){
  const has=(it.modifiers||[]).length>0;const on=it.available!==false;const custom=isCustomItem(it.id);
  const img=imgFor(it);
  const icoCls="ico"+(img&&isPackShot(it)?" pack-shot":"");
  return `<div class="arow ${on?'':'sold'}" data-edit="${it.id}"><div class="${icoCls}">${img?`<img class="ico-img" src="${img}" alt="">`:(it.emoji||"🍽️")}</div>
    <div class="arow-body"><div class="arow-nm">${it.name}${custom?` <span class="tag has">ръчен</span>`:""}</div>
      <div class="arow-sub">${money(it.basicPrice)}${it.description?" · "+it.description:""} · ${has?(it.modifiers.length+' групи опции'):'без комбинации'}${it.garnishable?" · + гарнитури":""}</div></div>
    <div class="switch ${on?'on':''}" data-toggle="${it.id}"><span class="sw-lbl">${on?'Наличен':'Изчерпан'}</span>
      <span class="track"><span class="knob"></span></span></div>
    <span class="chev">›</span></div>`;
}
function adminProducts(){
  let out=`<div class="info-card"><span class="ic">ℹ️</span><div>
    <b>Добавяйте продукти ръчно</b> и ги слагайте в правилната категория.
    Промените (име, цена, <b>описание</b>, комбинации, наличност) се <b>запазват на сървъра</b> и оцеляват след предеплой.</div></div>
    <div class="adm-toolbar"><button class="btn-primary compact" id="addProd" type="button"><span>+ Нов продукт</span></button></div>`;
  out+=`<div class="grid-admin">`;
  state.groups.forEach(g=>{
    const items=state.items.filter(i=>i.groupID===g.id).sort((a,b)=>a.id-b.id);
    if(!items.length)return;
    out+=`<div class="adm-sect"><h3>${g.name}</h3>`;
    items.forEach(it=>{out+=adminProductRow(it);});
    out+=`</div>`;
  });
  return out+`</div>`;
}
function adminOrders(){
  if(!state.orders.length) return `<div class="empty"><div class="big">📋</div>Все още няма поръчки.<br>Направи една от изгледа „Клиент", за да се появи тук.</div>`;
  const labels=["","Приета","Приготвя се","Готова за вземане","Взета"];
  const pillCls=["","s1","s2","s3","s4"];
  const advText=["","▶ Започни приготвяне","✓ Маркирай готова","📦 Маркирай взета",""];
  return state.orders.map(o=>`<div class="ordcard">
    <div class="oh"><b>#${o.docID}</b><span style="font-family:'Unbounded',sans-serif;font-weight:600">${money(o.total)}</span></div>
    <div class="who">${esc(o.name||'клиент')} · ${esc(o.phone||'—')} · ⏰ ${pickupText(o)}</div>
    <div class="items">${orderLinesHTML(o)}</div>
    <div class="statline"><span class="pill ${pillCls[o.status]}">${labels[o.status]}</span>
      ${o.status<4?`<button class="adv" data-adv="${o.docID}">${advText[o.status]}</button>`:`<span style="font-size:12px;color:var(--muted);margin-left:auto">✓ завършена</span>`}
      ${o.status>=3&&o.status<4?`<span class="ord-notified">✓ клиентът получи нотификация „готова за вземане"</span>`:''}</div></div>`).join("");
}

/* admin editor — продукт, категория, комбинации */
function openEditor(id){const it=state.items.find(x=>x.id===id);if(!it)return;
  state.adminDraft={isNew:false,isCustom:isCustomItem(id),productId:id,name:it.name,emoji:it.emoji||"🍽️",
    basicPrice:it.basicPrice,groupID:it.groupID,description:it.description||"",garnishable:!!it.garnishable,
    available:it.available!==false,modifiers:JSON.parse(JSON.stringify(it.modifiers||[]))};
  state.editorOpen=false;render();
  requestAnimationFrame(()=>{state.editorOpen=true;document.getElementById("ascrim")?.classList.add("show");document.getElementById("amodal")?.classList.add("show");});}
function openNewProduct(){
  state.adminDraft={isNew:true,isCustom:true,productId:nextProductId(),name:"",emoji:"🍽️",basicPrice:0,
    groupID:state.groups[0]?.id||1,description:"",garnishable:false,available:true,modifiers:[]};
  state.editorOpen=false;render();
  requestAnimationFrame(()=>{state.editorOpen=true;document.getElementById("ascrim")?.classList.add("show");document.getElementById("amodal")?.classList.add("show");});
}
function readEditorFields(){
  const d=state.adminDraft;if(!d)return;
  const nm=document.getElementById("pf-name");if(nm)d.name=nm.value;
  const pr=document.getElementById("pf-price");if(pr)d.basicPrice=parseFloat(pr.value)||0;
  const gr=document.getElementById("pf-group");if(gr)d.groupID=+gr.value;
  const ds=document.getElementById("pf-desc");if(ds)d.description=ds.value;
  const em=document.getElementById("pf-emoji");if(em)d.emoji=em.value.trim()||"🍽️";
  const gn=document.getElementById("pf-garnish");if(gn)d.garnishable=gn.checked;
}
function escField(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
const esc=escField;
function adminGate(){
  if(!state.runtime.adminRequired||state.adminKey)return "";
  return `<div class="admin-gate"><h2>Администрация</h2><p>Въведи администраторски ключ за достъп до кухнята и менюто.</p>
    <input id="adminKeyIn" type="password" placeholder="Admin API ключ" autocomplete="current-password">
    <button class="btn-primary compact" id="adminKeyGo" type="button">Вход</button>
    <p class="hint">В продукция админът е на <code>?admin=1</code> — не споделяй линка публично.</p></div>`;
}
function editorFieldsHTML(d){
  const opts=state.groups.map(g=>`<option value="${g.id}" ${d.groupID===g.id?"selected":""}>${g.name}</option>`).join("");
  return `<div class="prod-fields">
    <label class="pf-lbl full">Име на продукта<input id="pf-name" value="${escField(d.name)}" placeholder="напр. Картофена салата"></label>
    <label class="pf-lbl">Цена (лв)<input id="pf-price" type="number" step="0.10" min="0" value="${d.basicPrice??0}"></label>
    <label class="pf-lbl">Категория<select id="pf-group">${opts}</select></label>
    <label class="pf-lbl full">Описание <span class="pf-hint">под името в менюто</span>
      <textarea id="pf-desc" rows="2" placeholder="напр. 100 г · 0.5 л">${escField(d.description)}</textarea></label>
    <label class="pf-lbl">Емоджи<input id="pf-emoji" maxlength="8" value="${(d.emoji||"🍽️").replace(/"/g,"&quot;")}"></label>
    <label class="pf-chk"><input id="pf-garnish" type="checkbox" ${d.garnishable?"checked":""}> Скара с избор на гарнитури</label>
  </div>`;
}
function closeEditor(){state.editorOpen=false;document.getElementById("ascrim")?.classList.remove("show");document.getElementById("amodal")?.classList.remove("show");
  setTimeout(()=>{state.adminDraft=null;render();},250);}
function draftAddGroup(){state.adminDraft.modifiers.push({key:uid(),title:"Нова група",required:false,min:0,max:5,options:[{id:uid(),name:"",delta:0}]});render();keepEditor();}
function draftRemoveGroup(gi){state.adminDraft.modifiers.splice(gi,1);render();keepEditor();}
function draftAddOption(gi){state.adminDraft.modifiers[gi].options.push({id:uid(),name:"",delta:0});render();keepEditor();}
function draftRemoveOption(gi,oi){state.adminDraft.modifiers[gi].options.splice(oi,1);render();keepEditor();}
function draftSetType(gi,val){const g=state.adminDraft.modifiers[gi];if(val==="single"){g.required=true;g.min=1;g.max=1;}else{g.required=false;g.min=0;g.max=5;}render();keepEditor();}
function keepEditor(){document.getElementById("ascrim")?.classList.add("show");document.getElementById("amodal")?.classList.add("show");}
// Смалява снимката в браузъра до разумен размер преди качване (бързо + приятно).
// Прозрачни PNG/WebP + JPEG = черен фон; напитки винаги бял фон, PNG при нужда.
function fileToResizedDataUrl(file,maxDim=800,quality=.82,{packShot=false}={}){
  return new Promise((resolve,reject)=>{
    const img=new Image();const url=URL.createObjectURL(file);
    img.onload=()=>{URL.revokeObjectURL(url);let w=img.width,h=img.height;
      if(w>h&&w>maxDim){h=Math.round(h*maxDim/w);w=maxDim;}
      else if(h>=w&&h>maxDim){w=Math.round(w*maxDim/h);h=maxDim;}
      const probe=drawResizedImage(img,w,h);
      const hasAlpha=packShot||isAlphaImageFile(file)||canvasHasAlpha(probe.getContext("2d"),w,h);
      if(packShot){
        resolve(drawResizedImage(img,w,h,{whiteBg:true}).toDataURL("image/png"));
        return;
      }
      if(hasAlpha){
        resolve(drawResizedImage(img,w,h,{whiteBg:true}).toDataURL("image/jpeg",quality));
        return;
      }
      resolve(drawResizedImage(img,w,h).toDataURL("image/jpeg",quality));};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("невалидна снимка"));};
    img.src=url;});
}
async function uploadProductImage(productId,file){
  try{
    if(productId===null||productId===undefined) throw new Error("Редакторът е затворен — отвори продукта отново");
    if(!/^image\//i.test(file.type||"")&&!/\.(jpe?g|png|webp|gif)$/i.test(file.name||""))
      throw new Error("Файлът не е снимка");
    const packShot=packShotForProduct(productId);
    const dataUrl=await fileToResizedDataUrl(file,800,.82,{packShot});
    const r=await fetch("/api/product-image",{method:"POST",headers:adminHeaders({"Content-Type":"application/json"}),
      body:JSON.stringify({productId,dataUrl})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.url) throw new Error(j.error||"неуспешно качване");
    state.productImages[productId]=j.url;
    glog("admin:image:upload",{productId});
    render();keepEditor();
  }catch(e){glog("admin:image:error",{productId,error:String(e)});alert("Грешка при качване: "+e.message);}
}
async function removeProductImage(productId){
  try{
    await fetch("/api/product-image",{method:"POST",headers:adminHeaders({"Content-Type":"application/json"}),
      body:JSON.stringify({productId,dataUrl:null})});
    delete state.productImages[productId];
    glog("admin:image:remove",{productId});
    render();keepEditor();
  }catch(e){alert("Грешка: "+e.message);}
}

async function saveEditor(){
  const d=state.adminDraft;if(!d)return;
  readEditorFields();
  if(!d.name.trim()){alert("Въведете име на продукта.");return;}
  d.modifiers.forEach(g=>{g.options=g.options.filter(o=>o.name.trim()!=="");});
  const mods=d.modifiers.filter(g=>g.options.length>0);
  const stored=itemToStore({id:d.productId,groupID:d.groupID,name:d.name.trim(),basicPrice:d.basicPrice,
    price:d.basicPrice,emoji:d.emoji,description:d.description,garnishable:d.garnishable,
    available:d.available,modifiers:mods});
  try{
    if(d.isNew){
      state.menuOverrides.customItems.push(stored);
      state.items.push(normalizeMenuItem({...stored}));
      glog("admin:product:create",stored);
    }else if(d.isCustom){
      const ix=state.menuOverrides.customItems.findIndex(c=>c.id===d.productId);
      if(ix>=0)state.menuOverrides.customItems[ix]=stored;
      const it=state.items.find(x=>x.id===d.productId);if(it)Object.assign(it,normalizeMenuItem({...stored}));
      glog("admin:product:update",{id:d.productId});
    }else{
      state.menuOverrides.patches[String(d.productId)]={
        name:stored.name,basicPrice:stored.basicPrice,price:stored.price,groupID:stored.groupID,
        emoji:stored.emoji,description:stored.description,garnishable:stored.garnishable,
        available:stored.available,modifiers:stored.modifiers};
      const it=state.items.find(x=>x.id===d.productId);if(it)Object.assign(it,normalizeMenuItem({...stored}));
      glog("admin:product:patch",{id:d.productId});
    }
    await persistMenuOverrides();
    closeEditor();
  }catch(e){alert("Грешка при запис: "+e.message);}
}
async function deleteAdminProduct(){
  const d=state.adminDraft;if(!d||d.isNew)return;
  const msg=d.isCustom?"Изтриване на този ръчен продукт?":"Скриване на продукта от менюто?";
  if(!confirm(msg))return;
  try{
    if(d.isCustom){
      state.menuOverrides.customItems=state.menuOverrides.customItems.filter(c=>c.id!==d.productId);
      delete state.menuOverrides.patches[String(d.productId)];
    }else if(!state.menuOverrides.hidden.includes(d.productId)){
      state.menuOverrides.hidden.push(d.productId);
    }
    state.items=state.items.filter(i=>i.id!==d.productId);
    await persistMenuOverrides();
    glog("admin:product:remove",{id:d.productId,custom:d.isCustom});
    closeEditor();
  }catch(e){alert("Грешка: "+e.message);}
}

function adminModal(){
  const d=state.adminDraft;if(!d)return `<div class="scrim" id="ascrim"></div>`;
  let groups="";d.modifiers.forEach((g,gi)=>{
    const type=(g.required&&g.max===1)?"single":"multi";
    groups+=`<div class="gcard">
      <div class="gcard-top">
        <input class="gtitle" data-gi="${gi}" value="${g.title.replace(/"/g,'&quot;')}" placeholder="Име на групата">
        <select class="gtype" data-gi="${gi}">
          <option value="single" ${type==='single'?'selected':''}>избор на 1 (задължит.)</option>
          <option value="multi" ${type==='multi'?'selected':''}>няколко (по избор)</option></select>
        <button class="del" data-delg="${gi}">🗑</button></div>
      ${g.options.map((o,oi)=>`<div class="orow">
        <input class="onm" data-gi="${gi}" data-oi="${oi}" value="${o.name.replace(/"/g,'&quot;')}" placeholder="Опция (напр. Пържени картофи)">
        <div class="pricew">+<input class="odelta" data-gi="${gi}" data-oi="${oi}" type="number" step="0.10" value="${o.delta}">
          <span>лв</span></div><button class="del" data-delo="${gi}" data-oi2="${oi}">✕</button></div>`).join("")}
      <button class="addbtn" data-addo="${gi}">+ Добави опция</button></div>`;});
  const imgD=state.productImages[d.productId]||null;
  const title=d.isNew?"Нов продукт":`${d.emoji} ${d.name}`;
  const sub=d.isNew?"Попълни данните и избери категорията":`${groupName(d.groupID)} · ${money(d.basicPrice)}${d.isCustom?" · ръчен продукт":""}`;
  return `<div class="scrim show" id="ascrim"></div>
    <div class="amodal${state.editorOpen?' show':''}" id="amodal">
      <div class="amodal-head"><div><h2>${title}</h2>
        <div class="ro">${sub}</div></div>
        <button class="sheet-close" id="aclose" style="position:static">✕</button></div>
      <div class="amodal-scroll">
        ${editorFieldsHTML(d)}
        <div class="img-edit">
          <div class="img-prev ${imgD?'has':''}${imgD&&isPackShotGroup(d.groupID)?' pack-shot':''}"${imgD?` style="background-image:url('${imgD}')"`:''}>${imgD?'':`<span>${d.emoji||'🍽️'}</span>`}</div>
          <div class="img-actions"><div class="img-h">Снимка на продукта</div>
            <div class="img-row"><label class="btn-ghost compact" for="imgUp">${imgD?'Смени снимка':'Качи снимка'}</label>
              ${imgD?`<button class="link-btn danger" id="imgRm">Премахни</button>`:''}</div>
            <input id="imgUp" type="file" accept="image/*" hidden>
            <div class="img-hint">Ясна снимка на ястието — смалява се автоматично.</div></div>
        </div>
        ${groups||`<p style="color:var(--muted);font-size:13.5px;padding:8px 0">Този продукт няма комбинации. Добави група, за да предложиш избор на гарнитура или добавки.</p>`}
        <button class="addbtn group" id="addg">+ Добави нова група опции</button></div>
      <div class="amodal-foot">${d.isNew?"":`<button class="btn-ghost danger" id="adel" type="button">${d.isCustom?"Изтрий":"Скрий"}</button>`}
        <button class="btn-ghost" id="acancel">Отказ</button>
        <button class="btn-primary compact" id="asave"><span>${d.isNew?"Добави продукта":"Запази"}</span></button></div></div>`;
}

/* ---------------- BINDINGS ---------------- */
function bindCommon(){
  document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{stopSim();state.mode=b.dataset.mode;render();});
}
function bindClient(){
  document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{state.activeGroup=+t.dataset.g;
    scrollToGroup(t.dataset.g);
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");});
  document.querySelectorAll(".card").forEach(c=>c.onclick=()=>{if(c.dataset.sold==="true")return;
    const it=state.items.find(i=>i.id===+c.dataset.item);if(!it)return;
    if(it.garnishable||(it.modifiers||[]).length>0)openItem(it);else quickAdd(it);});
  const oc=document.getElementById("openCart");if(oc)oc.onclick=()=>{state.view="cart";render();};
  const oc2=document.getElementById("openCart2");if(oc2)oc2.onclick=()=>{state.view="cart";render();};
  const cs=document.getElementById("closeSheet");if(cs)cs.onclick=closeSheet;
  const scrim=document.getElementById("scrim");if(scrim)scrim.onclick=closeSheet;
  document.querySelectorAll(".opt").forEach(o=>o.onclick=()=>toggleOpt(o.dataset.grp,o.dataset.opt,o.dataset.single==="true"));
  document.querySelectorAll("[data-ginc]").forEach(b=>b.onclick=()=>changeGarnish(+b.dataset.ginc,1));
  document.querySelectorAll("[data-gdec]").forEach(b=>b.onclick=()=>changeGarnish(+b.dataset.gdec,-1));
  const qm=document.getElementById("qminus");if(qm)qm.onclick=()=>{state.modalQty=Math.max(1,state.modalQty-1);updateModalFooter();};
  const qp=document.getElementById("qplus");if(qp)qp.onclick=()=>{state.modalQty++;updateModalFooter();};
  const note=document.getElementById("note");if(note)note.oninput=e=>{state.modalNote=e.target.value;};
  const ac=document.getElementById("addCart");if(ac)ac.onclick=addToCart;
  const pb=document.getElementById("panelBack");if(pb)pb.onclick=()=>{state.view=(state.view==="checkout")?"cart":"menu";render();};
  const pc=document.getElementById("panelClose");if(pc)pc.onclick=()=>{state.view="menu";render();};
  document.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>changeQtyCart(+b.dataset.inc,1));
  document.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>changeQtyCart(+b.dataset.dec,-1));
  document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>removeLine(+b.dataset.rm));
  const tc=document.getElementById("toCheckout");if(tc)tc.onclick=()=>{state.view="checkout";render();};
  const fn=document.getElementById("f-name");if(fn)fn.oninput=e=>{state.order.name=e.target.value;updatePlace();};
  const fp=document.getElementById("f-phone");if(fp)fp.oninput=e=>{state.order.phone=e.target.value;updatePlace();};
  document.querySelectorAll(".time-opt").forEach(t=>t.onclick=()=>{state.order.time=t.dataset.time;render();});
  const pl=document.getElementById("placeBtn");if(pl)pl.onclick=placeOrder;
  document.querySelectorAll("[data-track]").forEach(b=>b.onclick=()=>trackOrder(b.dataset.track));
  const tt=document.getElementById("trackBtn");if(tt)tt.onclick=()=>{state.trackInput=!state.trackInput;if(!state.trackInput){state.trackErr="";state.trackInputVal="";}render();};
  const tn=document.getElementById("trackNum");if(tn)tn.oninput=e=>{state.trackInputVal=e.target.value;};
  const tg=document.getElementById("trackGo");if(tg)tg.onclick=async()=>{const n=state.trackInputVal.trim();
    if(!n){state.trackErr="Въведи номер на поръчка.";render();return;}
    let o=state.orders.find(x=>x.docID===n);
    if(!o){const fresh=await fetchOrderFromServer(n);
      if(fresh){state.orders.unshift(fresh);o=fresh;persist();}}
    if(o){trackOrder(n);}else{state.trackErr="Поръчка #"+n+" не е намерена. Отвори линка от Viber известието или провери номера.";render();}};
}
function bindConfirm(){
  const o=state.orders.find(x=>x.docID===state.activeOrderId);
  const sim=document.getElementById("sim");if(sim)sim.onclick=()=>{if(o&&o.status<3)setStatus(o.docID,o.status+1);};
  const auto=document.getElementById("autoSim");if(auto)auto.onclick=()=>{if(o)runAutoSim(o.docID);};
  const bm=document.getElementById("backMenu");if(bm)bm.onclick=()=>{state.tracking=false;state.view="menu";render();};
  const no=document.getElementById("newOrder");if(no)no.onclick=()=>{stopSim();state.cart=[];state.view="menu";
    state.order={name:"",phone:"",time:"asap"};state.activeOrderId=null;state.tracking=false;persist();render();};
}
function bindAdmin(){
  const ak=document.getElementById("adminKeyGo");
  if(ak)ak.onclick=()=>{const v=(document.getElementById("adminKeyIn")?.value||"").trim();
    if(!v){alert("Въведи администраторски ключ.");return;}
    saveAdminKey(v);render();};
  document.querySelectorAll("[data-atab]").forEach(b=>b.onclick=()=>{state.adminTab=b.dataset.atab;render();});
  const ap=document.getElementById("addProd");if(ap)ap.onclick=openNewProduct;
  document.querySelectorAll("[data-edit]").forEach(r=>r.onclick=()=>openEditor(+r.dataset.edit));
  document.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=async e=>{e.stopPropagation();
    const it=state.items.find(x=>x.id===+b.dataset.toggle);if(!it)return;
    it.available=it.available===false;
    try{
      if(isCustomItem(it.id)){
        const c=state.menuOverrides.customItems.find(x=>x.id===it.id);if(c)c.available=it.available;
      }else{
        const p=state.menuOverrides.patches[String(it.id)]||{};
        p.available=it.available;state.menuOverrides.patches[String(it.id)]=p;
      }
      await persistMenuOverrides();
      glog("admin:product:availability",{id:it.id,available:it.available});
    }catch(err){alert("Грешка при запис: "+err.message);}
    render();});
  document.querySelectorAll("[data-adv]").forEach(b=>b.onclick=()=>advanceOrder(b.dataset.adv));
  // editor
  const as=document.getElementById("ascrim");if(as)as.onclick=closeEditor;
  const acl=document.getElementById("aclose");if(acl)acl.onclick=closeEditor;
  const acan=document.getElementById("acancel");if(acan)acan.onclick=closeEditor;
  const asv=document.getElementById("asave");if(asv)asv.onclick=()=>saveEditor();
  const adel=document.getElementById("adel");if(adel)adel.onclick=()=>deleteAdminProduct();
  const pfg=document.getElementById("pf-group");if(pfg)pfg.onchange=e=>{
    if(e.target.value==="1"&&state.adminDraft)state.adminDraft.garnishable=true;
    const gn=document.getElementById("pf-garnish");if(gn&&e.target.value==="1")gn.checked=true;};
  const up=document.getElementById("imgUp");if(up)up.onchange=e=>{const f=e.target.files&&e.target.files[0];if(f){const pid=state.adminDraft?.productId;uploadProductImage(pid,f);}};
  const irm=document.getElementById("imgRm");if(irm)irm.onclick=()=>removeProductImage(state.adminDraft.productId);
  const addg=document.getElementById("addg");if(addg)addg.onclick=draftAddGroup;
  document.querySelectorAll("[data-delg]").forEach(b=>b.onclick=()=>draftRemoveGroup(+b.dataset.delg));
  document.querySelectorAll("[data-addo]").forEach(b=>b.onclick=()=>draftAddOption(+b.dataset.addo));
  document.querySelectorAll("[data-delo]").forEach(b=>b.onclick=()=>draftRemoveOption(+b.dataset.delo,+b.dataset.oi2));
  // live edits (no re-render to keep focus)
  document.querySelectorAll(".gtitle").forEach(i=>i.oninput=e=>{state.adminDraft.modifiers[+e.target.dataset.gi].title=e.target.value;});
  document.querySelectorAll(".gtype").forEach(s=>s.onchange=e=>draftSetType(+e.target.dataset.gi,e.target.value));
  document.querySelectorAll(".onm").forEach(i=>i.oninput=e=>{state.adminDraft.modifiers[+e.target.dataset.gi].options[+e.target.dataset.oi].name=e.target.value;});
  document.querySelectorAll(".odelta").forEach(i=>i.oninput=e=>{state.adminDraft.modifiers[+e.target.dataset.gi].options[+e.target.dataset.oi].delta=parseFloat(e.target.value)||0;});
}
function updatePlace(){const o=state.order;const ready=o.name.trim()&&o.phone.trim().length>=6;
  const btn=document.getElementById("placeBtn");if(btn){btn.disabled=!ready;btn.textContent=ready?'Изпрати поръчката':'Попълни име и телефон';}}

boot();
