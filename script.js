// --- CONFIGURATION FIREBASE (ARDUINO) ---
const urlFirebase = "https://abribus-32b7e-default-rtdb.europe-west1.firebasedatabase.app/airsmart.json";

function recupererDonnee() {
    fetch(urlFirebase)
        .then(response => response.json())
        .then(data => {
            if(data) {
                // Mise à jour des IDs 'temp' et 'hum' présents dans index.html
                document.getElementById('temp').innerText = data.temperature + " °C";
                document.getElementById('hum').innerText = data.humidite + " %";
            }
        })
        .catch(err => console.error("Erreur Firebase:", err));
}
// Relève les données toutes les 2 secondes
setInterval(recupererDonnee, 2000);
recupererDonnee();

// --- LOGIQUE HORLOGE ET MODE NUIT ---
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

// --- RECHERCHE VILLE ET APIS ---
let autoScroll = true;
let scrollInterval = null;

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
    
    // Mise à jour dynamique du widget Meteoblue avec les nouvelles coordonnées
    document.getElementById('meteoFrame').src = `https://www.meteoblue.com/fr/meteo/widget/three/${lat},${lon}`;
    
    document.getElementById('busFrame').src = `https://maps.google.com/maps?q=${encodeURIComponent(nom + " bus station")}&z=15&output=embed`;

    genererResumeIA(nom);
    evaluerTrafic(nom);
    chargerActualites(nom);
    localStorage.setItem("villeSauvegardee", villeInput);
  });
}

// --- ACTUALITÉS ET TRAFIC ---
function chargerActualites(ville) {
    const divActu = document.getElementById('actualites');
    const loading = document.getElementById('loadingActus');
    if(loading) loading.style.display = 'block'; // Affiche le chargement

    // On utilise un flux plus rapide et ciblé (JSL Bresse / Louhans)
    const rssLocale = "https://www.lejsl.com/edition-bresse/rss";
    const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssLocale)}`;

    fetch(rssUrl)
        .then(res => res.json())
        .then(data => {
            if(loading) loading.style.display = 'none';
            divActu.innerHTML = '';

            if (data.items && data.items.length > 0) {
                data.items.slice(0, 10).forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'actualiteItem';
                    // On ajoute une petite icône calendrier pour le style STI2D
                    div.innerHTML = `
                        <div class="title">📰 ${item.title}</div>
                        <a class="link" href="${item.link}" target="_blank">Lire l'article</a>
                    `;
                    divActu.appendChild(div);
                });
            } else {
                divActu.innerHTML = '<p>Aucune actualité locale trouvée.</p>';
            }
            startScrolling();
        })
        .catch(err => {
            if(loading) loading.style.display = 'none';
            console.error("Erreur RSS:", err);
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

// Lancement automatique au chargement
window.onload = () => {
  const v = localStorage.getItem("villeSauvegardee") || "Paris 75000";
  document.getElementById("adresse").value = v;
  rechercherVille();
};
// Affiche la fenêtre de connexion
function ouvrirModal() {
  document.getElementById("loginModal").style.display = "flex";
  document.getElementById("passInput").focus();
}

// Cache la fenêtre
function fermerModal() {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("passInput").value = "";
}

// Vérifie le code et redirige
function validerCode() {
    const code = document.getElementById("passInput").value.trim(); 
    
    console.log("Code saisi :", code); // Pour debug dans la console (F12)

    if (code === "jesuischauffeur") {
        alert("Accès Chauffeur validé");
        window.location.href = "chauffeur.html"; 
    } 
    else if (code === "jeuxjeuxjeux") {
        alert("Lancement des jeux...");
        window.location.href = "jeux.html"; 
    }
    else if (code === "antoperso") {
        alert("Lancement de votre page personnel MR PERRIN...");
        window.location.href = "perso.html"; 
    }
    else if (code === "yellowsuit") {
        alert("Lancement de subway surfer...");
        window.location.href = "https://yell0wsuit.page/assets/games/subway-surfers-unity/index.html";    
    else {
        alert("Code incorrect !");
        document.getElementById("passInput").value = "";
  }
}
