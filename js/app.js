const KEY="watch-roulette-data-v1";
const makeId=()=>crypto.randomUUID();
const initial={categories:["Trabajo","Daily","Vestir","Casual"],watches:[
{id:makeId(),name:"Seiko 5 6119",categories:["Daily","Casual","Vestir"],uses:0},
{id:makeId(),name:"Camy Montego",categories:["Daily","Casual"],uses:0},
{id:makeId(),name:"PUBULUS Batman",categories:["Trabajo","Daily","Casual"],uses:0},
{id:makeId(),name:"Casio MRW-200H",categories:["Trabajo","Daily","Casual"],uses:0},
{id:makeId(),name:"G-Shock GA-2100 Manga",categories:["Trabajo","Daily","Casual"],uses:0},
{id:makeId(),name:"Timex Ocean",categories:["Daily","Casual"],uses:0}]};
let data=JSON.parse(localStorage.getItem(KEY)||"null")||structuredClone(initial);
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

function home(){
document.querySelector("#app").innerHTML=`
<section class="page">
<div class="intro"><h2>¿Qué tipo de reloj quieres?</h2><p>Selecciona una categoría y deja que la ruleta elija.</p></div>
<div class="grid">
${data.categories.map(c=>{let n=data.watches.filter(w=>w.categories.includes(c)).length;return `<article class="category-card"><button class="card-main" data-cat="${esc(c)}"><span class="category-name">${esc(c)}</span><span class="muted">${n} ${n===1?"reloj":"relojes"}</span><span class="card-action">Girar ruleta</span></button><button class="delete-category" data-del="${esc(c)}">×</button></article>`}).join("")}
<button class="category-card add-card" id="addCategory"><span class="plus">+</span><span>Nueva categoría</span></button>
</div>
<section class="collection"><div class="section-heading"><h2>Mis relojes</h2><button class="primary small" id="addWatch">Añadir reloj</button></div>
<div class="watch-list">${data.watches.map(w=>`<div class="watch-row"><div><strong>${esc(w.name)}</strong><div class="tags">${w.categories.map(c=>`<span>${esc(c)}</span>`).join("")}</div></div><span class="muted">${w.uses} usos</span></div>`).join("")}</div></section>
</section>`;
document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>roulette(b.dataset.cat));
document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>delCat(b.dataset.del));
document.querySelector("#addCategory").onclick=addCat;
document.querySelector("#addWatch").onclick=addWatch;
}

function roulette(category){
const available=data.watches.filter(w=>w.categories.includes(category));
document.querySelector("#app").innerHTML=`
<section class="page roulette-page"><button class="back" id="back">← Volver</button>
<div class="roulette-title"><span class="eyebrow">RULETA</span><h2>${esc(category)}</h2><p>${available.length} ${available.length===1?"reloj disponible":"relojes disponibles"}</p></div>
<div class="result-card" id="result"><span class="eyebrow">¿QUÉ RELOJ TOCA HOY?</span><strong>?</strong></div>
<button class="primary spin" id="spin" ${available.length?"":"disabled"}>GIRAR RULETA</button>
<button class="secondary" id="reset">Reiniciar</button>
${available.length?"":"<p class='empty'>No tienes relojes asignados a esta categoría.</p>"}</section>`;
document.querySelector("#back").onclick=home;
document.querySelector("#reset").onclick=()=>{document.querySelector("#result").innerHTML='<span class="eyebrow">¿QUÉ RELOJ TOCA HOY?</span><strong>?</strong>'};
if(available.length) document.querySelector("#spin").onclick=()=>spin(available);
}

function spin(list){
const result=document.querySelector("#result"),button=document.querySelector("#spin");
button.disabled=true;result.classList.add("spinning");
let ticks=0;
const timer=setInterval(()=>{
result.querySelector("strong").textContent=list[Math.floor(Math.random()*list.length)].name;
if(++ticks>=12){clearInterval(timer);const min=Math.min(...list.map(w=>w.uses));const pool=list.filter(w=>w.uses===min);const winner=pool[Math.floor(Math.random()*pool.length)];winner.uses++;save();result.querySelector("strong").textContent=winner.name;result.classList.remove("spinning");button.disabled=false}},90);
}
function addCat(){const n=prompt("Nombre de la categoría:");if(!n?.trim())return;const c=n.trim();if(data.categories.some(x=>x.toLowerCase()===c.toLowerCase()))return alert("Esa categoría ya existe.");data.categories.push(c);save();home()}
function delCat(c){if(!confirm(`¿Eliminar "${c}"?`))return;data.categories=data.categories.filter(x=>x!==c);data.watches.forEach(w=>w.categories=w.categories.filter(x=>x!==c));save();home()}
function addWatch(){const n=prompt("Nombre del reloj:");if(!n?.trim())return;const s=prompt("Categorías separadas por comas:\n\n"+data.categories.join(", "));const cats=s?s.split(",").map(x=>x.trim()).filter(x=>data.categories.includes(x)):[];data.watches.push({id:makeId(),name:n.trim(),categories:cats,uses:0});save();home()}
let deferred=null;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;document.querySelector("#installBtn").classList.remove("hidden")});
document.querySelector("#installBtn").onclick=async()=>{if(deferred){deferred.prompt();deferred=null}};
if("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
home();
