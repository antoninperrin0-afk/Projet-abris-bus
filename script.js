// ANIMATION LOGO AU CLIC
const logo = document.getElementById("logo");
logo.addEventListener("click", () => {
  logo.classList.remove("logo-anim");
  void logo.offsetWidth; 
  logo.classList.add("logo-anim");
});

// Horloge
function updateClock(){
  const n=new Date();
  document.getElementById('clock').textContent=
    n.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
setInterval(updateClock,1000);
updateClock();

// Mode nuit
function checkNightMode(){
  const h=new Date().getHours();
  document.body.classList.toggle('night',h>=20||h<=6);
}
setInterval(checkNightMode,60000);
checkNightMode();

// Variables globales
let autoScroll = true;
let scrollInterval = null;

const mapFrame=document.getElementById('map');
const meteoFrame=document.getElementById('meteoFrame');
const busFrame=document.getElementById('busFrame');
const cityLabel=document.getElementById('cityLabel');
const coordsDiv=document.getElementById('coords');
const alertBanner=document.getElementById('alertBanner');
const iaResume=document.getElementById('iaResume');
const actualitesDiv=document.getElementById('actualites');
const toggleScrollBtn=document.getElementById('toggleScrollBtn');
const backToTopBtn=document.getElementById('backToTopBtn');
const loadingActus=document.getElementById('loadingActus');

// Bouton pause auto-scroll
toggleScrollBtn.addEventListener('click', () => {
  autoScroll = !autoScroll;
  toggleScrollBtn.textContent = autoScroll ? '⏸ Pause' : '▶ Auto';
});

// Bouton retour en haut
actualitesDiv.addEventListener('scroll', () => {
  backToTopBtn.style.display = actualitesDiv.scrollTop > 50 ? 'block' : 'none';
});

backToTopBtn.addEventListener('click', () => {
  autoScroll = false;
  toggleScrollBtn.textContent = '▶ Auto';
  actualitesDiv.scrollTo({ top: 0, behavior: 'smooth' });
});

// Recherche ville
function rechercherVille(){
  const ville = document.getElementById('adresse').value;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ville)}`)
  .then(r => r.json())
  .then(d => {
    if(!d.length) return alert('Ville introuvable');

    const lat = d[0].lat;
    const lon = d[0].lon;
    const nom = d[0].display_name.split(',')[0];

    cityLabel.textContent = nom;
    coordsDiv.textContent = `📍 ${lat}, ${lon}`;

    mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(nom)}&z=14&output=embed&layer=transit`;
    meteoFrame.src = `https://www.meteoblue.com/fr/meteo/widget/three/${lat},${lon}`;
    busFrame.src = `https://www.google.com/maps?q=bus+${encodeURIComponent(nom)}&output=embed&layer=transit`;

    genererResumeIA(nom);
    evaluerTrafic(nom);
    chargerActualites(nom);
  });
}

// IA résumé
function genererResumeIA(ville){
  const phrases=[`Circulation fluide à ${ville}.`,`Quelques ralentissements possibles à ${ville}.`,`Trafic surveillé à ${ville}.`];
  iaResume.textContent='🧠 Résumé IA : '+phrases[Math.floor(Math.random()*phrases.length)];
}

// Trafic
function evaluerTrafic(ville){
  const niveaux=['🟢 Trafic faible','🟠 Trafic moyen','🔴 Trafic élevé'];
  alertBanner.textContent='🚦 '+niveaux[Math.floor(Math.random()*niveaux.length)]+' à '+ville;
  alertBanner.style.display='block';
}

// Actualités
function chargerActualites(ville){
  loadingActus.style.display = 'block';
  actualitesDiv.innerHTML = '';

  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(ville+' trafic bus grève accident')}&hl=fr&gl=FR&ceid=FR:fr`;

  fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
  .then(res=>res.json())
  .then(data=>{
    actualitesDiv.innerHTML='';
    data.items.slice(0,20).forEach(item=>{
      const div=document.createElement('div');
      div.className='actualiteItem';
      div.innerHTML=`<div class="title">${item.title}</div><a class="link" href="${item.link}" target="_blank">En savoir plus</a>`;
      actualitesDiv.appendChild(div);
    });
    startScrolling();
    loadingActus.style.display = 'none';
  });
}

// Scroll automatique
function startScrolling(){
  if(scrollInterval) clearInterval(scrollInterval);
  scrollInterval = setInterval(()=>{
    if(!autoScroll) return;
    actualitesDiv.scrollTop += 1;
    if(actualitesDiv.scrollTop >= actualitesDiv.scrollHeight - actualitesDiv.clientHeight){
      actualitesDiv.scrollTop = 0;
    }
  }, 20);
}

actualitesDiv.addEventListener('mouseenter',()=>autoScroll=false);
actualitesDiv.addEventListener('mouseleave',()=>autoScroll=true);
actualitesDiv.addEventListener('touchstart',()=>autoScroll=false);
actualitesDiv.addEventListener('touchend',()=>autoScroll=true);

setInterval(rechercherVille,600000);
window.onload=rechercherVille;

// Accès chauffeur (modale)
document.getElementById("accesPrive").addEventListener("click", () => {
  const code = prompt("Code d'accès chauffeur :");

  if(code === "jesuischauffeur"){
    window.location.href = "chauffeur.html";
  } else if(code !== null){
    alert("Code incorrect");
  }
});
