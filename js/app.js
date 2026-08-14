const KEY="watch-roulette-data-v2";
const SETTINGS="watch-roulette-settings-v3";
const uid=()=>String(Date.now())+"-"+Math.random().toString(36).slice(2,10);
const seedWatches=[
{name:"Seiko 5 6119",brand:"Seiko",reference:"",categories:["Daily","Casual","Vestir"]},
{name:"Cauny Prima",brand:"Cauny",reference:"",categories:["Vestir","Daily"]},
{name:"Camy Montego 7649",brand:"Camy",reference:"7649",categories:["Daily","Casual"]},
{name:"PUBULUS Batman",brand:"PUBULUS",reference:"",categories:["Trabajo","Daily","Casual"]},
{name:"G-Shock GA-2100 Manga Azul",brand:"Casio",reference:"GA-2100",categories:["Trabajo","Daily","Casual"]},
{name:"Casio MRW-200H",brand:"Casio",reference:"MRW-200H",categories:["Trabajo","Daily","Casual"]},
{name:"Timex Ocean",brand:"Timex",reference:"",categories:["Daily","Casual"]},
{name:"Festina F20695/4",brand:"Festina",reference:"F20695/4",categories:["Vestir","Daily","Casual"]},
{name:"Festina F20709/1",brand:"Festina",reference:"F20709/1",categories:["Vestir","Daily","Casual"]},
{name:"Homage JLC Reverso",brand:"AliExpress",reference:"",categories:["Vestir","Casual"]}
];
const seedCategories=["Trabajo","Daily","Vestir","Casual"];

function makeInitial(){
  const watches=seedWatches.map(x=>({id:uid(),photo:"",uses:0,lastUsed:0,...x}));
  return {categories:[...seedCategories],watches};
}
function normalize(d){
  d=d||makeInitial();
  d.categories=Array.isArray(d.categories)?d.categories:seedCategories.slice();
  d.watches=Array.isArray(d.watches)?d.watches:[];
  d.watches=d.watches.map(w=>({...w,id:w.id||uid(),name:w.name||"Sin nombre",brand:w.brand||"",reference:w.reference||"",photo:w.photo||"",categories:Array.isArray(w.categories)?w.categories:[],uses:Number(w.uses)||0,lastUsed:Number(w.lastUsed)||0}));
  // Add missing seed watches without replacing existing user data.
  for(const s of seedWatches){
    if(!d.watches.some(w=>(w.name||"").toLowerCase()===s.name.toLowerCase())){
      d.watches.push({id:uid(),photo:"",uses:0,lastUsed:0,...s});
    }
  }
  for(const c of seedCategories) if(!d.categories.includes(c)) d.categories.push(c);
  return d;
}
function load(){
  try{
    let raw=localStorage.getItem(KEY);
    return normalize(raw?JSON.parse(raw):makeInitial());
  }catch(e){return makeInitial()}
}
let data=load();
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const settings=(()=>{try{return JSON.parse(localStorage.getItem(SETTINGS))||{theme:"system",weighted:true}}catch{return {theme:"system",weighted:true}}})();
function saveSettings(){localStorage.setItem(SETTINGS,JSON.stringify(settings));applyTheme()}
function applyTheme(){
  document.documentElement.dataset.theme=settings.theme;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=settings.theme==="dark"?"#111111":settings.theme==="light"?"#f5f5f5":(matchMedia("(prefers-color-scheme:dark)").matches?"#111111":"#f5f5f5");
}
applyTheme();
matchMedia("(prefers-color-scheme:dark)").addEventListener?.("change",()=>{if(settings.theme==="system")applyTheme()});

function setNav(active){
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.nav===active));
}
function shell(content,active="roulette"){
  document.querySelector("#app").innerHTML=content;
  setNav(active);
  wireNav();
}
function wireNav(){
  document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{if(b.dataset.nav==="roulette")home();if(b.dataset.nav==="collection")collection();if(b.dataset.nav==="settings")settingsPage()});
}

function home(){
 shell(`<section class="page home">
  <div class="hero"><span class="eyebrow">BUENOS DÍAS</span><h2>¿Qué te apetece llevar hoy?</h2><p>Elige una categoría y deja que la ruleta decida por ti.</p></div>
  <div class="category-grid">${data.categories.map(c=>{
    const n=data.watches.filter(w=>w.categories.includes(c)).length;
    return `<article class="category-card"><button class="card-main" data-cat="${esc(c)}"><span class="cat-icon">${c==="Trabajo"?"◉":c==="Daily"?"◷":c==="Vestir"?"✦":"◆"}</span><strong>${esc(c)}</strong><span class="muted">${n} ${n===1?"reloj":"relojes"}</span><span class="card-action">Girar ruleta →</span></button><button class="delete-category" data-del="${esc(c)}" aria-label="Eliminar">×</button></article>`
  }).join("")}<button class="category-card add-card" id="addCategory"><span class="plus">+</span><strong>Nueva categoría</strong></button></div>
  <section class="recent"><div class="section-heading"><div><span class="eyebrow">COLECCIÓN</span><h3>Últimos añadidos</h3></div><button class="text-btn" id="seeCollection">Ver todos →</button></div>
  <div class="horizontal-list">${data.watches.slice().reverse().slice(0,5).map(w=>watchMini(w)).join("")}</div></section>
 </section>`);
 document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>roulette(b.dataset.cat));
 document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>delCat(b.dataset.del));
 document.querySelector("#addCategory").onclick=addCat;
 document.querySelector("#seeCollection").onclick=collection;
}

function watchMini(w){
 return `<button class="mini-watch" data-edit="${w.id}">${w.photo?`<img src="${w.photo}" alt="">`:`<div class="photo-placeholder">⌚</div>`}<span>${esc(w.name)}</span></button>`
}

function collection(){
 shell(`<section class="page collection-page"><div class="page-heading"><div><span class="eyebrow">MI COLECCIÓN</span><h2>${data.watches.length} relojes</h2></div><button class="primary small" id="addWatch">+ Añadir</button></div>
 <div class="search-row"><input id="search" placeholder="Buscar reloj, marca o referencia…"><select id="filter"><option value="">Todas</option>${data.categories.map(c=>`<option>${esc(c)}</option>`).join("")}</select></div>
 <div id="watchGrid" class="watch-grid"></div></section>`,"collection");
 document.querySelector("#addWatch").onclick=()=>editWatch(null);
 const render=()=>{let q=document.querySelector("#search").value.toLowerCase(),f=document.querySelector("#filter").value;
 let list=data.watches.filter(w=>(!q||`${w.name} ${w.brand} ${w.reference}`.toLowerCase().includes(q))&&(!f||w.categories.includes(f)));
 document.querySelector("#watchGrid").innerHTML=list.map(w=>watchCard(w)).join("")||`<div class="empty-card">No hay relojes que coincidan.</div>`;
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editWatch(b.dataset.edit))};
 document.querySelector("#search").oninput=render;document.querySelector("#filter").onchange=render;render();
}
function watchCard(w){
 return `<article class="watch-card"><button class="watch-photo" data-edit="${w.id}">${w.photo?`<img src="${w.photo}" alt="${esc(w.name)}">`:`<span>⌚</span>`}</button><div class="watch-card-body"><div><span class="muted">${esc(w.brand||"Sin marca")}</span><h3>${esc(w.name)}</h3>${w.reference?`<span class="ref">Ref. ${esc(w.reference)}</span>`:""}</div><div class="tags">${w.categories.map(c=>`<span>${esc(c)}</span>`).join("")}</div><div class="card-footer"><span>${w.uses} usos</span><button class="secondary mini" data-edit="${w.id}">Editar</button></div></div></article>`
}

function roulette(cat){
 let list=data.watches.filter(w=>w.categories.includes(cat));
 shell(`<section class="page roulette-page"><button class="back" id="back">← Volver</button><div class="roulette-title"><span class="eyebrow">RULETA</span><h2>${esc(cat)}</h2><p>${list.length} ${list.length===1?"reloj disponible":"relojes disponibles"}</p></div>
 <div class="result-card" id="result"><span class="eyebrow">¿QUÉ RELOJ TOCA HOY?</span><div class="roulette-dial">?</div><strong id="resultName">Listo</strong><div id="resultPhoto"></div></div>
 <button class="primary spin" id="spin" ${list.length?"":"disabled"}>GIRAR RULETA</button><button class="secondary" id="reset">Reiniciar</button>${list.length?"":"<p class='empty'>No tienes relojes asignados a esta categoría.</p>"}</section>`);
 document.querySelector("#back").onclick=home;document.querySelector("#reset").onclick=()=>{document.querySelector("#resultName").textContent="Listo";document.querySelector("#resultPhoto").innerHTML="";document.querySelector(".roulette-dial").textContent="?";};
 if(list.length)document.querySelector("#spin").onclick=()=>spin(list);
}
function chooseWeighted(list){
 if(!settings.weighted)return list[Math.floor(Math.random()*list.length)];
 const min=Math.min(...list.map(w=>w.uses));
 const weights=list.map(w=>1+Math.max(0, w.uses-min)*0.15*-1);
 let total=weights.reduce((a,b)=>a+b,0),r=Math.random()*total;
 for(let i=0;i<list.length;i++){r-=weights[i];if(r<=0)return list[i]} return list[0];
}
function spin(list){
 const dial=document.querySelector(".roulette-dial"),name=document.querySelector("#resultName"),photo=document.querySelector("#resultPhoto"),btn=document.querySelector("#spin");
 btn.disabled=true;document.querySelector("#result").classList.add("spinning");
 let n=0,t=setInterval(()=>{let w=list[Math.floor(Math.random()*list.length)];dial.textContent="◷";name.textContent=w.name;photo.innerHTML=w.photo?`<img class="result-photo" src="${w.photo}" alt="">`:"";
 if(++n>=16){clearInterval(t);let w=chooseWeighted(list);w.uses++;w.lastUsed=Date.now();save();dial.textContent="✓";name.textContent=w.name;photo.innerHTML=w.photo?`<img class="result-photo" src="${w.photo}" alt="">`:"";document.querySelector("#result").classList.remove("spinning");btn.disabled=false}},75);
}

function addCat(){let n=prompt("Nombre de la categoría:");if(!n?.trim())return;let c=n.trim();if(data.categories.some(x=>x.toLowerCase()===c.toLowerCase()))return alert("Esa categoría ya existe.");data.categories.push(c);save();home()}
function delCat(c){if(!confirm(`¿Eliminar "${c}"? Los relojes no se borrarán.`))return;data.categories=data.categories.filter(x=>x!==c);data.watches.forEach(w=>w.categories=w.categories.filter(x=>x!==c));save();home()}

function editWatch(wid){
 let old=wid?data.watches.find(w=>w.id===wid):null,w=old||{id:uid(),name:"",brand:"",reference:"",photo:"",categories:[],uses:0,lastUsed:0};
 shell(`<section class="page editor"><button class="back" id="cancel">← Cancelar</button><div class="editor-heading"><span class="eyebrow">${old?"EDITAR RELOJ":"NUEVO RELOJ"}</span><h2>${old?esc(w.name):"Añadir reloj"}</h2></div>
 <form id="watchForm"><div class="photo-picker"><div id="photoPreview" class="big-photo">${w.photo?`<img src="${w.photo}" alt="">`:"⌚"}</div><label class="primary photo-button">Añadir/cambiar foto<input id="photoInput" type="file" accept="image/*" capture="environment" hidden></label><button type="button" class="secondary" id="removePhoto" ${w.photo?"":"disabled"}>Quitar foto</button></div>
 <label>Nombre<input id="name" required value="${esc(w.name)}" placeholder="Ej. Cauny Prima"></label><label>Marca<input id="brand" value="${esc(w.brand)}" placeholder="Ej. Cauny"></label><label>Referencia<input id="reference" value="${esc(w.reference)}" placeholder="Ej. 7649"></label>
 <div><span class="label-title">Categorías</span><div class="checks">${data.categories.map(c=>`<label class="check"><input type="checkbox" value="${esc(c)}" ${w.categories.includes(c)?"checked":""}><span>${esc(c)}</span></label>`).join("")}</div></div>
 <div class="form-actions"><button class="primary" type="submit">Guardar reloj</button>${old?`<button class="danger" type="button" id="deleteWatch">Eliminar reloj</button>`:""}</div></form></section>`,"collection");
 let photo=w.photo;document.querySelector("#cancel").onclick=collection;
 document.querySelector("#photoInput").onchange=e=>{let f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024){alert("La foto supera 5 MB.");e.target.value="";return}let rd=new FileReader();rd.onload=()=>{photo=rd.result;document.querySelector("#photoPreview").innerHTML=`<img src="${photo}" alt="">`;document.querySelector("#removePhoto").disabled=false};rd.readAsDataURL(f)};
 document.querySelector("#removePhoto").onclick=()=>{photo="";document.querySelector("#photoPreview").textContent="⌚";document.querySelector("#removePhoto").disabled=true};
 document.querySelector("#watchForm").onsubmit=e=>{e.preventDefault();let cats=[...document.querySelectorAll(".checks input:checked")].map(x=>x.value);let u={...w,name:document.querySelector("#name").value.trim(),brand:document.querySelector("#brand").value.trim(),reference:document.querySelector("#reference").value.trim(),photo,categories:cats};if(old)Object.assign(old,u);else data.watches.push(u);save();collection()};
 if(old)document.querySelector("#deleteWatch").onclick=()=>{if(confirm(`¿Eliminar "${old.name}" definitivamente?`)){data.watches=data.watches.filter(x=>x.id!==old.id);save();collection()}}
}

function settingsPage(){
 shell(`<section class="page settings-page"><span class="eyebrow">PERSONALIZACIÓN</span><h2>Ajustes</h2>
 <div class="settings-card"><h3>Apariencia</h3><p class="muted">Sigue el tema de tu dispositivo o elige uno manualmente.</p>
 <div class="theme-options">${["system","light","dark"].map(v=>`<button class="theme-option ${settings.theme===v?"selected":""}" data-theme="${v}"><span>${v==="system"?"◐":v==="light"?"☀":"☾"}</span><strong>${v==="system"?"Automático":v==="light"?"Claro":"Oscuro"}</strong><small>${v==="system"?"Usar el tema del dispositivo":""}</small></button>`).join("")}</div></div>
 <div class="settings-card"><h3>Ruleta</h3><label class="toggle-row"><span><strong>Favorecer relojes menos usados</strong><small>Da más posibilidades a los relojes que llevas menos.</small></span><input id="weighted" type="checkbox" ${settings.weighted?"checked":""}></label></div>
 <div class="settings-card"><h3>Datos</h3><p class="muted">${data.watches.length} relojes · ${data.categories.length} categorías</p><button class="secondary" id="resetUses">Reiniciar estadísticas de uso</button></div>
 </section>`,"settings");
 document.querySelectorAll(".theme-option").forEach(b=>b.onclick=()=>{settings.theme=b.dataset.theme;saveSettings();settingsPage()});
 document.querySelector("#weighted").onchange=e=>{settings.weighted=e.target.checked;saveSettings()};
 document.querySelector("#resetUses").onclick=()=>{if(confirm("¿Reiniciar el número de usos de todos los relojes?")){data.watches.forEach(w=>{w.uses=0;w.lastUsed=0});save();settingsPage()}}
}

addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.deferredInstall=e;document.querySelector("#installBtn").classList.remove("hidden")});
document.querySelector("#installBtn").onclick=async()=>{if(window.deferredInstall){window.deferredInstall.prompt();window.deferredInstall=null}};
if("serviceWorker"in navigator){addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}))}
window.addEventListener("error",e=>{console.error(e.error||e.message)});
home();
