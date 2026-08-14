const KEY="watch-roulette-data-v2";
const id=()=>crypto.randomUUID();
function load(){
try{
  let x=JSON.parse(localStorage.getItem(KEY));
  if(!x){ const old=JSON.parse(localStorage.getItem("watch-roulette-data-v1")); x=old || structuredClone(initial); }
  x.categories=[...new Set([...(x.categories||[]),...initial.categories])];
  x.watches=x.watches||[];
  const names=new Set(x.watches.map(w=>String(w.name||"").toLowerCase()));
  for(const seed of initial.watches){ if(!names.has(seed.name.toLowerCase())) x.watches.push(seed); }
  x.watches=x.watches.map(w=>({...w,brand:w.brand||"",reference:w.reference||"",photo:w.photo||"",categories:w.categories||[],uses:w.uses||0}));
  return x;
}catch{return structuredClone(initial)}
}
let data=load(); const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const checks=(sel=[])=>data.categories.map(c=>`<label class="check"><input type="checkbox" value="${esc(c)}" ${sel.includes(c)?"checked":""}><span>${esc(c)}</span></label>`).join("");

function home(){document.querySelector("#app").innerHTML=`
<section class="page"><div class="intro"><h2>¿Qué tipo de reloj quieres?</h2><p>Selecciona una categoría y deja que la ruleta elija.</p></div>
<div class="grid">${data.categories.map(c=>{let n=data.watches.filter(w=>w.categories.includes(c)).length;return `<article class="category-card"><button class="card-main" data-cat="${esc(c)}"><span class="category-name">${esc(c)}</span><span class="muted">${n} ${n===1?"reloj":"relojes"}</span><span class="card-action">Girar ruleta</span></button><button class="delete-category" data-del="${esc(c)}">×</button></article>`}).join("")}
<button class="category-card add-card" id="addCategory"><span class="plus">+</span><span>Nueva categoría</span></button></div>
<section class="collection"><div class="section-heading"><h2>Mis relojes</h2><button class="primary small" id="addWatch">Añadir reloj</button></div>
<div class="watch-list">${data.watches.map(w=>`<article class="watch-row">${w.photo?`<img class="watch-thumb" src="${w.photo}" alt="">`:`<div class="watch-thumb placeholder">⌚</div>`}<div class="watch-info"><strong>${esc(w.name)}</strong>${w.brand?`<span class="muted">${esc(w.brand)}${w.reference?" · "+esc(w.reference):""}</span>`:""}<div class="tags">${w.categories.map(c=>`<span>${esc(c)}</span>`).join("")||"<span>Sin categoría</span>"}</div></div><div class="watch-actions"><span class="muted">${w.uses} usos</span><button class="secondary mini" data-edit="${w.id}">Editar</button></div></article>`).join("")}</div></section></section>`;
document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>roulette(b.dataset.cat));document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>delCat(b.dataset.del));document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editWatch(b.dataset.edit));document.querySelector("#addCategory").onclick=addCat;document.querySelector("#addWatch").onclick=()=>editWatch(null)}

function roulette(cat){let list=data.watches.filter(w=>w.categories.includes(cat));document.querySelector("#app").innerHTML=`
<section class="page roulette-page"><button class="back" id="back">← Volver</button><div class="roulette-title"><span class="eyebrow">RULETA</span><h2>${esc(cat)}</h2><p>${list.length} ${list.length===1?"reloj disponible":"relojes disponibles"}</p></div>
<div class="result-card" id="result"><span class="eyebrow">¿QUÉ RELOJ TOCA HOY?</span><strong>?</strong><div id="resultPhoto"></div></div>
<button class="primary spin" id="spin" ${list.length?"":"disabled"}>GIRAR RULETA</button><button class="secondary" id="reset">Reiniciar</button>${list.length?"":"<p class='empty'>No tienes relojes asignados a esta categoría.</p>"}</section>`;
document.querySelector("#back").onclick=home;document.querySelector("#reset").onclick=()=>{document.querySelector("#result").innerHTML='<span class="eyebrow">¿QUÉ RELOJ TOCA HOY?</span><strong>?</strong><div id="resultPhoto"></div>'};if(list.length)document.querySelector("#spin").onclick=()=>spin(list)}
function show(w){let r=document.querySelector("#result");r.querySelector("strong").textContent=w.name;r.querySelector("#resultPhoto").innerHTML=w.photo?`<img class="result-photo" src="${w.photo}" alt="">`:""}
function spin(list){let r=document.querySelector("#result"),b=document.querySelector("#spin");b.disabled=true;r.classList.add("spinning");let n=0,t=setInterval(()=>{show(list[Math.floor(Math.random()*list.length)]);if(++n>=12){clearInterval(t);let m=Math.min(...list.map(w=>w.uses)),p=list.filter(w=>w.uses===m),w=p[Math.floor(Math.random()*p.length)];w.uses++;save();show(w);r.classList.remove("spinning");b.disabled=false}},90)}
function addCat(){let n=prompt("Nombre de la categoría:");if(!n?.trim())return;let c=n.trim();if(data.categories.some(x=>x.toLowerCase()===c.toLowerCase()))return alert("Esa categoría ya existe.");data.categories.push(c);save();home()}
function delCat(c){if(!confirm(`¿Eliminar "${c}"? Los relojes no se borrarán.`))return;data.categories=data.categories.filter(x=>x!==c);data.watches.forEach(w=>w.categories=w.categories.filter(x=>x!==c));save();home()}

function editWatch(wid){let old=wid?data.watches.find(w=>w.id===wid):null,w=old||{id:id(),name:"",brand:"",reference:"",photo:"",categories:[],uses:0};
document.querySelector("#app").innerHTML=`<section class="page editor"><button class="back" id="cancel">← Cancelar</button><h2>${old?"Editar reloj":"Añadir reloj"}</h2><p class="muted">Un reloj puede estar en varias categorías.</p>
<form id="watchForm"><div class="photo-picker"><div id="photoPreview" class="big-photo">${w.photo?`<img src="${w.photo}" alt="">`:"⌚"}</div><label class="primary photo-button">Añadir/cambiar foto<input id="photoInput" type="file" accept="image/*" capture="environment" hidden></label><button type="button" class="secondary" id="removePhoto" ${w.photo?"":"disabled"}>Quitar foto</button></div>
<label>Nombre<input id="name" required value="${esc(w.name)}" placeholder="Ej. Camy Montego"></label><label>Marca<input id="brand" value="${esc(w.brand)}" placeholder="Ej. Camy"></label><label>Referencia<input id="reference" value="${esc(w.reference)}" placeholder="Ej. 7649"></label>
<div><span class="label-title">Categorías</span><div class="checks">${checks(w.categories)||"<span class='muted'>Crea una categoría primero.</span>"}</div></div>
<div class="form-actions"><button class="primary" type="submit">Guardar reloj</button>${old?`<button class="danger" type="button" id="deleteWatch">Eliminar reloj</button>`:""}</div></form></section>`;
let photo=w.photo;document.querySelector("#cancel").onclick=home;
document.querySelector("#photoInput").onchange=e=>{let f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024){alert("La foto supera 5 MB.");e.target.value="";return}let rd=new FileReader();rd.onload=()=>{photo=rd.result;document.querySelector("#photoPreview").innerHTML=`<img src="${photo}" alt="">`;document.querySelector("#removePhoto").disabled=false};rd.readAsDataURL(f)};
document.querySelector("#removePhoto").onclick=()=>{photo="";document.querySelector("#photoPreview").textContent="⌚";document.querySelector("#removePhoto").disabled=true};
document.querySelector("#watchForm").onsubmit=e=>{e.preventDefault();let cats=[...document.querySelectorAll(".checks input:checked")].map(x=>x.value);let u={...w,name:document.querySelector("#name").value.trim(),brand:document.querySelector("#brand").value.trim(),reference:document.querySelector("#reference").value.trim(),photo,categories:cats};if(!u.name)return;if(old)Object.assign(old,u);else data.watches.push(u);save();home()};
if(old)document.querySelector("#deleteWatch").onclick=()=>{if(confirm(`¿Eliminar "${old.name}" definitivamente?`)){data.watches=data.watches.filter(x=>x.id!==old.id);save();home()}}}

let deferred=null;addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;document.querySelector("#installBtn").classList.remove("hidden")});document.querySelector("#installBtn").onclick=()=>{if(deferred){deferred.prompt();deferred=null}};if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));home();