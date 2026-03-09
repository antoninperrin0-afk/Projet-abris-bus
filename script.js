// --- CONFIGURATION FIREBASE ---
const urlFirebase = "https://abribus-32b7e-default-rtdb.europe-west1.firebasedatabase.app/airsmart.json";

function recupererDonnee() {
    fetch(urlFirebase)
        .then(response => response.json())
        .then(data => {
            if(data) {
                document.getElementById('temp').innerText = data.temperature + " °C";
                document.getElementById('hum').innerText = data.humidite + " %";
            }
        })
        .catch(err => console.error("Erreur Firebase:", err));
}
setInterval(recupererDonnee, 2000);
recupererDonnee();

// --- GESTION MODALE ---
function ouvrirModal() {
  document.getElementById("loginModal").style.display = "flex";
  document.getElementById("passInput").focus();
}
function fermerModal() {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("passInput").value = "";
}
function validerCode() {
  const code = document.getElementById("passInput").value;
  if(code === "jesuischauffeur") {
    window.location.href = "chauffeur.html";
  } else {
    alert("Code incorrect");
    document.getElementById("passInput").value = "";
  }
}

// --- HORLOGE ET MODE NUIT ---
function updateClock(){
  const n = new Date();
  const clockEl = document.getElementById('clock');
  if(clockEl) clockEl.textContent = n.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  checkNightMode();
}
setInterval(updateClock, 1000);
updateClock();

function checkNightMode(){
  const heure = new Date().getHours();
  document.body.classList.toggle("night", heure >= 19 || heure <= 7);
}

// --- RECHERCHE VILLE ET METEO ---
function rechercherVille(){
  const villeInput = document.getElementById('adresse').value;
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(villeInput)}`)
  .then(r => r.json())
  .then(d => {
    if(!d.length) return alert('Ville introuvable');
    const lat = d[0].lat;
    const lon = d[0].lon;
    const nom = d[0].display_name.split(',')[0];

    document.getElementById('cityLabel').textContent = nom;
    document.getElementById('coords').textContent = `📍 ${lat}, ${lon}`;
    document.getElementById('map').src = `https://maps.google.com/maps?q=${encodeURIComponent(nom)}&z=14&output=embed&layer=transit`;
    
    // MISE A JOUR DYNAMIQUE DU WIDGET METEOBLUE
    document.getElementById('meteoFrame').src = `https://www.meteoblue.com/fr/meteo/widget/three/${lat},${lon}`;
    
    document.getElementById('busFrame').src = `https://maps.google.com/maps?q=${encodeURIComponent(nom + " bus station")}&z=15&output=embed`;

    genererResumeIA(nom);
    evaluerTrafic(nom);
    chargerActualites(nom);
    localStorage.setItem("villeSauvegardee", villeInput);
    verifierAlertesChauffeur();
    verifierProchainBusManuel();
  });
}

// --- LOGIQUE ALERTES & ACTUALITÉS ---
let autoScroll = true;
let scrollInterval = null;

function verifierAlertesChauffeur() {
    const zone = document.getElementById("zoneAlerteChauffeur");
    const texte = document.getElementById("texteAlerte");
    const villeAffichee = document.getElementById('cityLabel').textContent;
    const data = localStorage.getItem("alerteAbribus");
    if (data) {
        const alerte = JSON.parse(data);
        if (alerte.texte.includes(villeAffichee) || alerte.villeCible === villeAffichee) {
            zone.style.display = "block";
            texte.innerHTML = `⚠️ MESSAGE CHAUFFEUR (${alerte.heure}) : ${alerte.texte}`;
        } else { zone.style.display = "none"; }
    } else { zone.style.display = "none"; }
}

function verifierProchainBusManuel() {
    const heureManuelle = localStorage.getItem("prochainBus");
    if(heureManuelle) {
        document.getElementById("prochainBus").textContent = `🕒 Prochain bus : ${heureManuelle} (Signalé par chauffeur)`;
    }
}

function chargerActualites(ville){
  const divActu = document.getElementById('actualites');
  const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${ville}+trafic+bus&hl=fr&gl=FR&ceid=FR:fr`)}`;
  fetch(rssUrl).then(res=>res.json()).then(data=>{
    divActu.innerHTML = '';
    data.items.slice(0,10).forEach(item=>{
      const div=document.createElement('div');
      div.className='actualiteItem';
      div.innerHTML=`<div class="title">${item.title}</div><a class="link" href="${item.link}" target="_blank">Lire la suite</a>`;
      divActu.appendChild(div);
    });
    startScrolling();
  });
}

function startScrolling(){
  const divActu = document.getElementById('actualites');
  if(scrollInterval) clearInterval(scrollInterval);
  scrollInterval = setInterval(()=>{
    if(autoScroll) divActu.scrollTop += 1;
    if(divActu.scrollTop >= divActu.scrollHeight - divActu.clientHeight) divActu.scrollTop = 0;
  }, 30);
}

document.getElementById('toggleScrollBtn').addEventListener('click', (e) => {
  autoScroll = !autoScroll;
  e.target.textContent = autoScroll ? '⏸ Pause' : '▶ Auto';
});

function genererResumeIA(ville){
  const phrases=[`Circulation fluide à ${ville}.`,`Ralentissements possibles à ${ville}.`,`Trafic surveillé à ${ville}.` ];
  document.getElementById('iaResume').textContent='🧠 Résumé IA : '+phrases[Math.floor(Math.random()*phrases.length)];
}

function evaluerTrafic(ville){
  const niveaux=['🟢 Trafic faible','🟠 Trafic moyen','🔴 Trafic élevé'];
  const banner = document.getElementById('alertBanner');
  banner.textContent='🚦 '+niveaux[Math.floor(Math.random()*niveaux.length)]+' à '+ville;
  banner.style.display='block';
}

window.onload = () => {
  const v = localStorage.getItem("villeSauvegardee");
  if(v) document.getElementById("adresse").value = v;
  rechercherVille();
};
