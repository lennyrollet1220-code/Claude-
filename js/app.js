/* ==========================================================================
   FORGE — Application (UI, questionnaire, notifications, installation)
   ========================================================================== */
'use strict';

/* ---------- Icônes ---------- */
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/></svg>',
  food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v8a3 3 0 0 0 3 3v7M10 3v8a3 3 0 0 1-3 3M7 3v5M17 21V3c-2.2 0-4 2.7-4 6s1.8 5 4 5"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18 9 12l6-6"/></svg>',
  chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17l9-10"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  install: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v7M9 11l3 3 3-3"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  plusSq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
};

/* ---------- Stockage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('forge.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('forge.' + k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
  del(k) { try { localStorage.removeItem('forge.' + k); } catch { /* ignore */ } },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const EX_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
const REC_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
const todayOverride = new URLSearchParams(location.search).get('today');
const todayISO = () => todayOverride || isoDate(new Date());
const fmtDate = (iso, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => parseISO(iso).toLocaleDateString('fr-FR', opts);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const bg = (id, w) => `background-image:url('${IMG(id, w)}')`;

/* ==========================================================================
   QUESTIONNAIRE
   ========================================================================== */
const SECTIONS = {
  profil: { label: 'Ton profil', sub: 'Faisons connaissance', img: PHOTOS.motivation },
  objectif: { label: 'Tes objectifs', sub: 'Ce que tu veux vraiment', img: PHOTOS.hero },
  niveau: { label: 'Ton niveau', sub: 'Sois honnête, personne ne juge', img: PHOTOS.pushup },
  orga: { label: 'Ton organisation', sub: 'Un plan qui rentre dans ta vie', img: PHOTOS.gym },
  sante: { label: 'Ta santé', sub: 'Pour s\'entraîner sans se blesser', img: PHOTOS.yoga },
  prefs: { label: 'Tes goûts', sub: 'Le meilleur sport est celui qu\'on aime', img: PHOTOS.ropes },
  nutrition: { label: 'Ton assiette', sub: 'Ton coach alimentaire', img: PHOTOS.foodHero },
  coach: { label: 'Ton coach', sub: 'Motivation quotidienne', img: PHOTOS.runSunset },
};

const O = (v, l, e, d) => ({ v, l, e, d });
const QUESTIONS = [
  // --- Profil ---
  { id: 'prenom', s: 'profil', type: 'text', q: 'Salut ! Comment tu t\'appelles ?', sub: 'Ton coach va t\'appeler comme ça.', ph: 'Ton prénom' },
  { id: 'sexe', s: 'profil', type: 'single', q: 'Tu es…', sub: 'Utile pour calculer tes besoins caloriques.', opts: [O('homme', 'Un homme', '🙋‍♂️'), O('femme', 'Une femme', '🙋‍♀️'), O('autre', 'Je préfère ne pas dire', '🙂')] },
  { id: 'age', s: 'profil', type: 'number', q: 'Quel âge as-tu ?', unit: 'ans', min: 12, max: 90, ph: '25' },
  { id: 'taille', s: 'profil', type: 'number', q: 'Quelle est ta taille ?', unit: 'cm', min: 120, max: 230, ph: '175' },
  { id: 'poids', s: 'profil', type: 'number', q: 'Et ton poids actuel ?', sub: 'Approximatif, c\'est parfait.', unit: 'kg', min: 30, max: 250, ph: '70', decimal: true },
  // --- Objectifs ---
  { id: 'objectif', s: 'objectif', type: 'single', q: 'Quel est ton objectif n°1 ?', sub: 'On construit tout le programme autour.', opts: [
    O('perte_poids', 'Perdre du poids', '🔥', 'Brûler du gras, s\'affiner'),
    O('muscle', 'Prendre du muscle', '💪', 'Gagner en volume'),
    O('tonifier', 'Me tonifier / me sculpter', '✨', 'Un corps ferme et dessiné'),
    O('force', 'Devenir plus fort', '🦾', 'Soulever plus lourd'),
    O('endurance', 'Améliorer mon cardio', '🏃', 'Plus de souffle, courir plus loin'),
    O('sante', 'Être en forme et en santé', '🌿', 'Énergie, bien-être, habitudes'),
    O('souplesse', 'Gagner en souplesse', '🧘', 'Mobilité, moins de raideurs')] },
  { id: 'objectifs2', s: 'objectif', type: 'multi', optional: true, q: 'Des objectifs bonus ?', sub: 'Choisis-en autant que tu veux (ou aucun).', opts: [
    O('posture', 'Meilleure posture', '🧍'), O('energie', 'Plus d\'énergie', '⚡'), O('stress', 'Moins de stress', '🧠'), O('sommeil', 'Mieux dormir', '😴'),
    O('confiance', 'Confiance en moi', '😎'), O('discipline', 'Plus de discipline', '🎯')], grid: true },
  { id: 'zones', s: 'objectif', type: 'multi', q: 'Quelles zones veux-tu travailler en priorité ?', sub: 'Elles auront un peu plus de place dans tes séances.', grid: true, opts: [
    O('fullbody', 'Tout le corps', '🌐'), O('pecs', 'Pectoraux', '🏋️'), O('dos', 'Dos', '🧗'), O('epaules', 'Épaules', '🤷'),
    O('bras', 'Bras', '💪'), O('abdos', 'Abdos', '🍫'), O('fessiers', 'Fessiers', '🍑'), O('jambes', 'Jambes', '🦵')], exclusive: 'fullbody' },
  { id: 'poids_cible', s: 'objectif', type: 'number', optional: true, q: 'Tu as un poids cible en tête ?', sub: 'Laisse vide si tu ne sais pas : on te proposera un objectif réaliste.', unit: 'kg', min: 35, max: 200, decimal: true,
    showIf: (a) => ['perte_poids', 'muscle', 'tonifier'].includes(a.objectif) },
  { id: 'pourquoi', s: 'objectif', type: 'single', q: 'Pourquoi c\'est important pour toi, au fond ?', sub: 'Ta vraie raison, c\'est elle qui te fera tenir.', opts: [
    O('sante', 'Prendre soin de ma santé', '❤️'), O('confiance', 'Me sentir bien dans mon corps', '🪞'), O('perf', 'Être performant·e dans mon sport', '🏆'),
    O('energie', 'Avoir plus d\'énergie au quotidien', '🔋'), O('evenement', 'Un événement arrive', '📅'), O('defi', 'Me lancer un défi', '🎯')] },
  { id: 'evenement', s: 'objectif', type: 'text', optional: true, q: 'Quel événement ?', sub: 'Vacances, mariage, compétition…', ph: 'Ex. : vacances en juillet', showIf: (a) => a.pourquoi === 'evenement' },
  { id: 'semaines', s: 'objectif', type: 'slider', q: 'Sur combien de semaines veux-tu ton programme ?', sub: 'Choisis librement : 1 semaine, 5 semaines, 3 mois…', min: 1, max: 52, def: 8, presets: [1, 2, 4, 5, 8, 12, 16] },
  // --- Niveau ---
  { id: 'niveau', s: 'niveau', type: 'single', q: 'Comment évalues-tu ton niveau en sport ?', opts: [
    O('1', 'Débutant', '🌱', 'Je commence ou je reprends après longtemps'), O('2', 'Intermédiaire', '🌿', 'Je m\'entraîne un peu, je connais les bases'), O('3', 'Avancé', '🌳', 'Je m\'entraîne régulièrement depuis 1 an+')] },
  { id: 'freq', s: 'niveau', type: 'single', q: 'Ces 3 derniers mois, tu faisais du sport…', opts: [
    O('0', 'Jamais ou presque', '🛋️'), O('1', '1 fois par semaine', '🚶'), O('2', '2 à 3 fois par semaine', '🏃'), O('4', '4 fois ou plus', '🔥')] },
  { id: 'pompes', s: 'niveau', type: 'single', q: 'Combien de pompes peux-tu faire d\'affilée ?', sub: 'Des vraies pompes, sur les pieds.', grid: true, opts: [
    O('0', 'Aucune', '😅'), O('1-5', '1 à 5', '🙂'), O('6-15', '6 à 15', '💪'), O('16-30', '16 à 30', '🔥'), O('30+', 'Plus de 30', '🦾')] },
  { id: 'gainage', s: 'niveau', type: 'single', q: 'Combien de temps tiens-tu une planche (gainage) ?', grid: true, opts: [
    O('<20', 'Moins de 20 s', '⏱️'), O('20-45', '20 à 45 s', '⏱️'), O('45-90', '45 s à 1 min 30', '⏱️'), O('90+', 'Plus de 1 min 30', '🏆')] },
  { id: 'tractions', s: 'niveau', type: 'single', q: 'Et les tractions à la barre ?', grid: true, opts: [
    O('0', 'Aucune', '🙃'), O('1-3', '1 à 3', '🧗'), O('4-8', '4 à 8', '💪'), O('9+', '9 ou plus', '🦍')] },
  { id: 'cardio', s: 'niveau', type: 'single', q: 'Côté cardio, tu peux…', opts: [
    O('1', 'Je suis essoufflé·e dans les escaliers', '😮‍💨'), O('2', 'Courir environ 10 minutes', '🏃'), O('3', 'Courir 30 minutes sans m\'arrêter', '🏃‍♂️'), O('4', 'Courir 1 heure ou plus', '🏅')] },
  { id: 'souplesse', s: 'niveau', type: 'single', q: 'Jambes tendues, en te penchant en avant, tu touches…', grid: true, opts: [
    O('1', 'Mes genoux', '🦵'), O('2', 'Mes tibias', '🦶'), O('3', 'Mes orteils', '👣'), O('4', 'Le sol, paumes à plat', '🤸')] },
  // --- Organisation ---
  { id: 'jours', s: 'orga', type: 'days', q: 'Quels jours veux-tu t\'entraîner ?', sub: 'Sélectionne tes jours. Conseil : laisse au moins 1 jour de repos.' },
  { id: 'duree', s: 'orga', type: 'single', q: 'Combien de temps par séance ?', grid: true, opts: [
    O('20', '20 min', '⚡', 'Express'), O('30', '30 min', '⏱️', 'Efficace'), O('45', '45 min', '💪', 'Idéal'), O('60', '1 h', '🔥', 'Complet'), O('90', '1 h 30', '🦾', 'Intensif')] },
  { id: 'lieu', s: 'orga', type: 'single', q: 'Où vas-tu t\'entraîner ?', opts: [
    O('maison', 'À la maison', '🏠', 'Poids du corps ou petit matériel'), O('salle', 'En salle de sport', '🏋️', 'Accès à tout le matériel'),
    O('exterieur', 'En extérieur', '🌳', 'Parc, piste, street workout'), O('mixte', 'Un peu de tout', '🔄', 'Salle et maison')] },
  { id: 'materiel', s: 'orga', type: 'multi', q: 'Quel matériel as-tu sous la main ?', grid: true, showIf: (a) => a.lieu === 'maison' || a.lieu === 'exterieur', exclusive: 'aucun', opts: [
    O('aucun', 'Rien du tout', '🙌'), O('halteres', 'Haltères', '🏋️'), O('elastiques', 'Élastiques', '➰'), O('kettlebell', 'Kettlebell', '🔔'),
    O('traction', 'Barre de traction', '🧗'), O('banc', 'Banc', '🪑'), O('barre', 'Barre + disques', '🏋️‍♂️'), O('corde', 'Corde à sauter', '🪢')] },
  { id: 'moment', s: 'orga', type: 'single', q: 'À quel moment de la journée préfères-tu t\'entraîner ?', grid: true, opts: [
    O('matin', 'Le matin', '🌅'), O('midi', 'Le midi', '☀️'), O('aprem', 'L\'après-midi', '🌤️'), O('soir', 'Le soir', '🌙')] },
  { id: 'debut', s: 'orga', type: 'single', q: 'Quand veux-tu commencer ?', opts: [
    O('aujourdhui', 'Aujourd\'hui', '🚀', 'Pas de temps à perdre'), O('demain', 'Demain', '📆'), O('lundi', 'Lundi prochain', '🗓️', 'Un nouveau départ')] },
  // --- Santé ---
  { id: 'blessures', s: 'sante', type: 'multi', q: 'As-tu des douleurs ou blessures ?', sub: 'On évitera les exercices à risque pour ces zones.', grid: true, exclusive: 'aucune', opts: [
    O('aucune', 'Aucune', '✅'), O('genoux', 'Genoux', '🦵'), O('dos', 'Dos', '🔙'), O('epaules', 'Épaules', '🤷'), O('poignets', 'Poignets', '✋'), O('chevilles', 'Chevilles', '🦶')] },
  { id: 'activite', s: 'sante', type: 'single', q: 'Au quotidien (travail, études), tu es plutôt…', opts: [
    O('sedentaire', 'Assis·e la plupart du temps', '💺'), O('debout', 'Souvent debout ou à marcher', '🚶'), O('physique', 'Très actif·ve physiquement', '🏗️')] },
  { id: 'sommeil', s: 'sante', type: 'single', q: 'Combien d\'heures dors-tu par nuit ?', grid: true, opts: [
    O('<6', 'Moins de 6 h', '🥱'), O('6-7', '6 à 7 h', '😐'), O('7-8', '7 à 8 h', '😊'), O('8+', 'Plus de 8 h', '😴')] },
  { id: 'stress', s: 'sante', type: 'single', q: 'Ton niveau de stress en ce moment ?', grid: true, opts: [
    O('1', 'Zen', '😌'), O('2', 'Ça va', '🙂'), O('3', 'Un peu stressé·e', '😬'), O('4', 'Très stressé·e', '🤯')] },
  { id: 'medical', s: 'sante', type: 'single', q: 'As-tu un problème de santé particulier ?', sub: 'Cœur, tension, asthme, grossesse, opération récente…', opts: [
    O('non', 'Non, rien de particulier', '👍'), O('oui', 'Oui', '🩺', 'On te conseillera de demander l\'avis de ton médecin')] },
  // --- Préférences ---
  { id: 'activites', s: 'prefs', type: 'multi', q: 'Quelles activités aimes-tu ?', sub: 'On les intègre dans ton programme.', grid: true, opts: [
    O('muscu', 'Musculation', '🏋️'), O('hiit', 'HIIT / Circuits', '⏱️'), O('course', 'Course à pied', '🏃'), O('velo', 'Vélo', '🚴'),
    O('natation', 'Natation', '🏊'), O('yoga', 'Yoga / Stretching', '🧘'), O('boxe', 'Boxe', '🥊'), O('calisthenics', 'Street workout', '🤸'), O('marche', 'Marche', '🚶'), O('danse', 'Danse', '💃')] },
  { id: 'cardio_avis', s: 'prefs', type: 'single', q: 'Le cardio, pour toi c\'est…', opts: [
    O('adore', 'J\'adore !', '😍'), O('ok', 'Ça me va', '👌'), O('deteste', 'Je déteste', '🙅', 'On le remplacera par des circuits')] },
  { id: 'style_seance', s: 'prefs', type: 'single', q: 'Quel style de séance te motive le plus ?', opts: [
    O('classique', 'Séries + repos', '🏋️', 'Classique, on se concentre sur chaque exercice'), O('circuit', 'Circuits qui s\'enchaînent', '🌀', 'Ça va vite, ça transpire'), O('mix', 'Un mélange des deux', '🔀')] },
  { id: 'coach', s: 'prefs', type: 'single', q: 'Quel type de coach veux-tu ?', opts: [
    O('doux', 'Bienveillant', '🤗', 'Encourageant et rassurant'), O('motivant', 'Motivant', '🔥', 'Énergique, positif, qui pousse'), O('militaire', 'Militaire', '🪖', 'Zéro excuse. Tu l\'auras voulu.')] },
  // --- Nutrition ---
  { id: 'regime', s: 'nutrition', type: 'single', q: 'Tu manges…', opts: [
    O('omni', 'De tout', '🍗'), O('halal', 'Halal / sans porc', '🥩'), O('pesc', 'Pescétarien (poisson, pas de viande)', '🐟'), O('vege', 'Végétarien', '🥚'), O('vegan', 'Végan', '🌱')] },
  { id: 'allergies', s: 'nutrition', type: 'multi', q: 'Des allergies ou intolérances ?', grid: true, exclusive: 'aucune', opts: [
    O('aucune', 'Aucune', '✅'), O('gluten', 'Gluten', '🌾'), O('lactose', 'Lactose', '🥛'), O('oeuf', 'Œufs', '🥚'),
    O('noix', 'Fruits à coque / arachide', '🥜'), O('poisson', 'Poisson', '🐟'), O('crustaces', 'Crustacés', '🦐'), O('soja', 'Soja', '🫘')] },
  { id: 'repas', s: 'nutrition', type: 'single', q: 'Combien de repas par jour te conviennent ?', grid: true, opts: [
    O('2', '2 repas', '🍽️', 'Pas de petit-déj'), O('3', '3 repas', '🍳'), O('4', '3 repas + 1 goûter', '🍎'), O('5', '3 repas + 2 collations', '🥜')] },
  { id: 'cuisine', s: 'nutrition', type: 'single', q: 'Combien de temps peux-tu passer en cuisine par repas ?', grid: true, opts: [
    O('10', '10 min max', '⚡'), O('20', 'Environ 20 min', '⏱️'), O('40', '30-40 min', '👩‍🍳'), O('60', 'J\'adore cuisiner', '❤️')] },
  { id: 'grignotage', s: 'nutrition', type: 'single', q: 'Tu grignotes entre les repas ?', grid: true, opts: [
    O('jamais', 'Jamais', '😇'), O('parfois', 'Parfois', '🙂'), O('sucre', 'Souvent du sucré', '🍫'), O('sale', 'Souvent du salé', '🥨')] },
  { id: 'eau', s: 'nutrition', type: 'single', q: 'Combien d\'eau bois-tu par jour ?', grid: true, opts: [
    O('<1', 'Moins d\'1 L', '🥤'), O('1-1.5', '1 à 1,5 L', '💧'), O('1.5-2', '1,5 à 2 L', '💧💧'), O('2+', 'Plus de 2 L', '🌊')] },
  { id: 'gout_gouter', s: 'nutrition', type: 'single', q: 'Pour tes goûters, tu es plutôt…', opts: [
    O('sucre', 'Sucré', '🍓'), O('sale', 'Salé', '🥕'), O('both', 'Les deux !', '😋')] },
  { id: 'deteste', s: 'nutrition', type: 'textarea', optional: true, q: 'Des aliments que tu détestes ?', sub: 'Sépare-les par des virgules. Ils seront exclus de tes menus.', ph: 'Ex. : saumon, brocoli, avocat' },
  // --- Coach ---
  { id: 'notifs', s: 'coach', type: 'single', q: 'Veux-tu recevoir une notification de motivation chaque jour ?', opts: [
    O('oui', 'Oui, motive-moi !', '🔔', 'Un message chaque jour à l\'heure choisie'), O('non', 'Non merci', '🔕')] },
  { id: 'notif_heure', s: 'coach', type: 'time', q: 'À quelle heure ?', sub: 'Idéalement un peu avant ton entraînement.', showIf: (a) => a.notifs === 'oui' },
];

function defaultTime(a) { return { matin: '07:30', midi: '11:30', aprem: '15:30', soir: '18:00' }[a.moment] || '18:00'; }
const visibleQuestions = (a) => QUESTIONS.filter((q) => !q.showIf || q.showIf(a));

function isAnswered(q, a) {
  const v = a[q.id];
  if (q.optional) return true;
  if (q.type === 'multi' || q.type === 'days') return Array.isArray(v) && v.length > 0;
  if (q.type === 'number') { const n = Number(v); return v !== '' && v != null && !Number.isNaN(n) && n >= q.min && n <= q.max; }
  if (q.type === 'text') return typeof v === 'string' && v.trim().length > 0;
  return v != null && v !== '';
}

/* ==========================================================================
   ÉTAT GLOBAL
   ========================================================================== */
const S = {
  answers: store.get('answers', null),
  createdAt: store.get('createdAt', null),
  progress: store.get('progress', {}),
  weights: store.get('weights', []),
  tests: store.get('tests', []),
  water: store.get('water', {}),
  swaps: store.get('swaps', {}),
  notif: store.get('notif', { enabled: false, hour: '18:00' }),
  quiz: store.get('quizDraft', { i: 0, answers: {} }),
  plan: null,
  goals: null,
  recipeFilter: 'tout',
  showAllRecipes: false,
  menuDay: 0,
  timer: null,
};

function rebuildPlan() {
  if (!S.answers) { S.plan = null; S.goals = null; return; }
  S.plan = generatePlan(S.answers, S.createdAt);
  S.goals = computeGoals(S.answers, S.plan);
}
rebuildPlan();

/* ==========================================================================
   ROUTEUR
   ========================================================================== */
const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');

function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
window.addEventListener('hashchange', render);

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, arg] = h.split('/');
  return { name: name || '', arg };
}

function render() {
  let { name, arg } = route();
  if (!S.answers && !['bienvenue', 'quiz', 'generation'].includes(name)) name = S.quiz.i > 0 ? 'quiz' : 'bienvenue';
  if (S.answers && (name === '' || name === 'bienvenue')) name = 'accueil';
  const views = { bienvenue: viewWelcome, quiz: viewQuiz, generation: viewGenerating, 'plan-pret': viewReveal, accueil: viewHome, programme: viewProgram, seance: viewSession, nutrition: viewNutrition, objectifs: viewGoals, profil: viewProfile };
  const fn = views[name] || viewHome;
  app.innerHTML = fn(arg);
  const tabs = ['accueil', 'programme', 'nutrition', 'objectifs', 'profil'];
  const tabName = name === 'seance' ? 'programme' : name;
  tabbar.classList.toggle('hidden', !S.answers || !tabs.includes(tabName));
  tabbar.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tabName));
  if (name !== 'quiz' && name !== 'seance') window.scrollTo(0, 0);
  afterRender(name);
}

function afterRender(name) {
  if (name === 'quiz') {
    const inp = $('.quiz-body .input');
    if (inp && !('ontouchstart' in window)) inp.focus();
  }
  if (name === 'programme') {
    const sel = $('.wt.sel');
    if (sel) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  updateInstallUI();
}

/* ==========================================================================
   VUE : BIENVENUE
   ========================================================================== */
function viewWelcome() {
  return `
  <section class="welcome">
    <div class="welcome-bg" style="${bg(PHOTOS.hero, 1200)}"></div>
    <div class="welcome-top"><div class="logo"><span class="logo-mark">${ICON.bolt}</span>FORGE</div></div>
    <div class="welcome-content">
      <p class="eyebrow lime">Ton coach 100 % perso</p>
      <h1 class="title-xl mt-8">Forge le corps<br>que tu <span class="grad-text">veux vraiment</span>.</h1>
      <p class="muted mt-12">Réponds à une quarantaine de questions. FORGE crée ton programme sur-mesure, tes objectifs et tes menus, et te motive chaque jour.</p>
      <div class="feature-list">
        <div class="feature"><b>🎯 Sur-mesure</b>Ton niveau, ton matériel, tes jours</div>
        <div class="feature"><b>📅 1 à 52 semaines</b>Tu choisis la durée</div>
        <div class="feature"><b>🥗 Coach alimentaire</b>Plats sains et goûters</div>
        <div class="feature"><b>🔔 Motivation</b>Un rappel chaque jour</div>
      </div>
      <button class="btn btn-primary btn-block" data-action="start-quiz">${S.quiz.i > 0 ? 'Reprendre le questionnaire' : 'Créer mon programme'} →</button>
      ${installBarHTML()}
    </div>
  </section>`;
}

function installBarHTML() {
  if (Install.standalone()) return '';
  return `<button class="install-bar" data-action="install">
      <span class="ic">${ICON.install}</span>
      <span><b>Ajouter à l'écran d'accueil</b><span>Installe FORGE comme une vraie appli, en un geste</span></span>
    </button>`;
}

/* ==========================================================================
   VUE : QUESTIONNAIRE
   ========================================================================== */
function viewQuiz() {
  const a = S.quiz.answers;
  const qs = visibleQuestions(a);
  S.quiz.i = Math.min(S.quiz.i, qs.length - 1);
  const q = qs[S.quiz.i];
  const sec = SECTIONS[q.s];
  if (q.type === 'slider' && a[q.id] == null) a[q.id] = q.def;
  if (q.type === 'time' && !a[q.id]) a[q.id] = defaultTime(a);
  const pct = Math.round((S.quiz.i / qs.length) * 100);
  const last = S.quiz.i === qs.length - 1;

  let body = '';
  const v = a[q.id];
  if (q.type === 'single' || q.type === 'multi') {
    const multi = q.type === 'multi';
    body = `<div class="options ${q.grid ? 'grid2' : ''}">${q.opts.map((o) => {
      const sel = multi ? (v || []).includes(o.v) : v === o.v;
      return `<button class="opt ${sel ? 'sel' : ''}" data-action="${multi ? 'q-toggle' : 'q-pick'}" data-v="${esc(o.v)}">
        <span class="em">${o.e}</span><span class="t">${esc(o.l)}${o.d ? `<span class="d">${esc(o.d)}</span>` : ''}</span>
        <span class="check">${sel ? ICON.check : ''}</span></button>`;
    }).join('')}</div>`;
  } else if (q.type === 'text') {
    body = `<div class="field"><input class="input" data-input="q" type="text" maxlength="40" autocomplete="given-name" placeholder="${esc(q.ph || '')}" value="${esc(v || '')}"></div>`;
  } else if (q.type === 'textarea') {
    body = `<div class="field"><textarea class="input" data-input="q" maxlength="300" placeholder="${esc(q.ph || '')}">${esc(v || '')}</textarea></div>`;
  } else if (q.type === 'number') {
    body = `<div class="field input-unit"><input class="input" data-input="q" type="text" inputmode="${q.decimal ? 'decimal' : 'numeric'}" placeholder="${esc(q.ph || '')}" value="${esc(v ?? '')}"><span>${q.unit}</span></div>
      <p class="muted mt-8" style="font-size:13px">Entre ${q.min} et ${q.max} ${q.unit}.</p>`;
  } else if (q.type === 'days') {
    const sel = v || [];
    body = `<div class="days">${WEEK_ORDER.map((d) => `<button class="day-btn ${sel.includes(d) ? 'sel' : ''}" data-action="q-toggle" data-v="${d}">${DOW_LABEL[d].slice(0, 1)}<small>${DOW_LABEL[d].slice(0, 3)}</small></button>`).join('')}</div>
      <p class="muted mt-16" style="text-align:center">${sel.length ? `<b class="lime">${sel.length}</b> séance${sel.length > 1 ? 's' : ''} par semaine` : 'Touche les jours'}</p>`;
  } else if (q.type === 'slider') {
    body = `<div class="slider-wrap"><div class="slider-val" id="slider-val">${v}<small>semaine${v > 1 ? 's' : ''}</small></div>
      <input type="range" min="${q.min}" max="${q.max}" value="${v}" data-input="slider">
      <div class="chips" style="justify-content:center">${q.presets.map((p) => `<button class="chip ${p === v ? 'chip-lime' : ''}" data-action="q-preset" data-v="${p}">${p} sem.</button>`).join('')}</div>
      <p class="muted mt-16" id="slider-end" style="font-size:13px">${sliderHint(v)}</p></div>`;
  } else if (q.type === 'time') {
    body = `<div class="field"><input class="input" data-input="q" type="time" value="${esc(v)}" style="color-scheme:dark"></div>`;
  }

  return `
  <section class="quiz">
    <div class="quiz-top">
      <div class="row between">
        <button class="icon-btn" data-action="q-back" aria-label="Retour">${ICON.back}</button>
        <span class="eyebrow">${S.quiz.i + 1} / ${qs.length}</span>
        <button class="icon-btn" data-action="q-home" aria-label="Quitter">${ICON.close}</button>
      </div>
      <div class="progress"><i style="width:${Math.max(pct, 3)}%"></i></div>
    </div>
    <div class="quiz-banner" style="${bg(sec.img, 900)}"><div class="lbl"><span class="eyebrow lime">${esc(sec.sub)}</span><b>${esc(sec.label)}</b></div></div>
    <div class="quiz-body" key="${q.id}">
      <h2 class="quiz-q">${esc(q.q)}</h2>
      ${q.sub ? `<p class="quiz-sub">${esc(q.sub)}</p>` : ''}
      ${body}
      ${q.optional ? `<button class="skip" data-action="q-next">Passer cette question</button>` : ''}
    </div>
    <div class="quiz-foot">
      <button class="btn btn-primary" data-action="q-next" ${isAnswered(q, a) ? '' : 'disabled'} id="q-next">${last ? 'Générer mon programme ⚡' : 'Continuer'}</button>
    </div>
  </section>`;
}

function sliderHint(v) {
  const end = addDays(new Date(), v * 7);
  return `Fin du programme vers le ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

function quizSave() { store.set('quizDraft', S.quiz); }
function quizCurrent() { return visibleQuestions(S.quiz.answers)[S.quiz.i]; }
function refreshNextBtn() {
  const btn = $('#q-next');
  if (btn) btn.disabled = !isAnswered(quizCurrent(), S.quiz.answers);
}

function quizNext() {
  const qs = visibleQuestions(S.quiz.answers);
  const q = qs[S.quiz.i];
  if (!isAnswered(q, S.quiz.answers)) return;
  if (q.type === 'number' && S.quiz.answers[q.id] !== '' && S.quiz.answers[q.id] != null) S.quiz.answers[q.id] = Number(S.quiz.answers[q.id]);
  if (S.quiz.i >= qs.length - 1) return finishQuiz();
  S.quiz.i++;
  quizSave();
  render();
  window.scrollTo(0, 0);
}

async function finishQuiz() {
  const a = { ...S.quiz.answers };
  // on oublie les réponses aux questions devenues masquées
  QUESTIONS.forEach((q) => { if (q.showIf && !q.showIf(a)) delete a[q.id]; });
  if (!a.notif_heure) a.notif_heure = defaultTime(a);
  if (a.lieu === 'salle' || a.lieu === 'mixte') a.materiel = [];
  S.answers = a;
  S.createdAt = isoDate(new Date());
  store.set('answers', a);
  store.set('createdAt', S.createdAt);
  S.notif = { enabled: false, hour: a.notif_heure };
  store.set('notif', S.notif);
  rebuildPlan();
  // Demande d'autorisation pendant le geste utilisateur (obligatoire sur mobile)
  if (a.notifs === 'oui') Notif.enable({ silent: true });
  go('#/generation');
}

/* ==========================================================================
   VUE : GÉNÉRATION + RÉVÉLATION
   ========================================================================== */
function viewGenerating() {
  const steps = ['Analyse de ton profil', 'Calcul de tes besoins caloriques', 'Sélection des exercices adaptés', `Construction de tes ${S.plan ? S.plan.weeks.length : ''} semaines`, 'Préparation de tes menus'];
  setTimeout(() => {
    const els = document.querySelectorAll('.gen-steps div');
    els.forEach((el, i) => setTimeout(() => el.classList.add('on'), 450 * (i + 1)));
    setTimeout(() => { store.del('quizDraft'); S.quiz = { i: 0, answers: {} }; go('#/plan-pret'); }, 450 * (els.length + 1) + 300);
  }, 50);
  return `<section class="gen"><div class="gen-ring"></div><h2 class="title-lg">On forge ton plan…</h2>
    <div class="gen-steps">${steps.map((s) => `<div>${s}</div>`).join('')}</div></section>`;
}

function viewReveal() {
  const a = S.answers, g = S.goals, p = S.plan, t = nutritionTargets(a);
  return `<div class="page">
    <div class="photo-card" style="${bg(PHOTOS.dark, 1000)};min-height:280px">
      <div class="inner"><span class="chip chip-lime">Programme prêt ✓</span>
      <h1 class="title-lg mt-12">${esc(a.prenom)}, voici ton plan.</h1>
      <p class="muted mt-8">${g.archetype.emoji} Profil <b style="color:var(--text)">${g.archetype.name}</b> · ${g.archetype.line}</p></div>
    </div>
    <div class="stats mt-16">
      <div class="stat"><b>${p.weeks.length}</b><span>semaine${p.weeks.length > 1 ? 's' : ''}</span></div>
      <div class="stat"><b>${p.facts.days.length}×</b><span>par semaine</span></div>
      <div class="stat"><b>${t.kcal}</b><span>kcal / jour</span></div>
    </div>
    <div class="section"><div class="section-head"><h2>🎯 Ce que tu vas viser</h2></div>
      <div class="stack">${g.goals.slice(0, 4).map(goalCardHTML).join('')}</div></div>
    ${a.medical === 'oui' ? '<div class="banner-warn mt-16">🩺 Tu as signalé un problème de santé : demande l\'avis de ton médecin avant de commencer.</div>' : ''}
    ${notifPromptHTML()}
    <button class="btn btn-primary btn-block mt-24" data-action="goto" data-to="#/accueil">C'est parti 🚀</button>
    <div class="mt-12">${installBarHTML()}</div>
  </div>`;
}

/* ==========================================================================
   VUE : ACCUEIL
   ========================================================================== */
function sessionMeta(s) {
  const n = s.blocks.filter((b) => !b.finisher).length;
  if (s.format === 'cardio') return `${s.estMin} min · cardio`;
  return `${n} exercices · ~${s.estMin} min`;
}

function currentWeekIndex() {
  const t = todayISO();
  if (t < S.plan.start) return 0;
  if (t > S.plan.end) return S.plan.weeks.length - 1;
  const diff = Math.round((parseISO(t) - parseISO(S.plan.start)) / 86400000);
  return Math.floor(diff / 7);
}

function computeStats() {
  const t = todayISO();
  let total = 0, done = 0, streak = 0, streakBroken = false;
  const sessions = [];
  S.plan.weeks.forEach((w) => w.days.forEach((d) => { if (d.session) { total++; sessions.push(d.date); if (S.progress[d.date]?.done) done++; } }));
  for (let i = sessions.length - 1; i >= 0; i--) {
    const d = sessions[i];
    if (d > t) continue;
    if (S.progress[d]?.done) { if (!streakBroken) streak++; }
    else if (d === t) continue; // la séance du jour n'est pas encore « ratée »
    else streakBroken = true;
    if (streakBroken) break;
  }
  return { total, done, streak, pct: total ? Math.round((done / total) * 100) : 0 };
}

function coachMessage(sessionTitle, iso = todayISO()) {
  const a = S.answers;
  const pool = sessionTitle ? MOTIVATION[a.coach] || MOTIVATION.motivant : MOTIVATION.repos;
  const msg = pool[hashStr(iso) % pool.length];
  return msg.replace(/\{name\}/g, a.prenom || 'champion').replace(/\{session\}/g, sessionTitle || '');
}

function viewHome() {
  const a = S.answers, t = todayISO();
  const found = findDay(S.plan, t);
  const st = computeStats();
  const wIdx = currentWeekIndex();
  const week = S.plan.weeks[wIdx];
  const quote = QUOTES[hashStr(t) % QUOTES.length];

  let hero;
  if (t < S.plan.start) {
    const first = S.plan.weeks[0].days.find((d) => d.session);
    const days = Math.round((parseISO(S.plan.start) - parseISO(t)) / 86400000);
    hero = `<a class="photo-card" href="#/seance/${first.date}" style="${bg(first.session.img, 1000)};min-height:260px;text-decoration:none;color:inherit">
      <div class="inner"><span class="chip chip-lime">Départ dans ${days} jour${days > 1 ? 's' : ''}</span>
      <h2 class="title-lg mt-12">Ton programme commence ${fmtDate(S.plan.start, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
      <p class="muted mt-8">1ère séance : ${first.session.emoji} ${esc(first.session.title)} · ${sessionMeta(first.session)}</p></div></a>`;
  } else if (t > S.plan.end) {
    hero = `<div class="photo-card" style="${bg(PHOTOS.runSunset, 1000)};min-height:260px"><div class="inner">
      <span class="chip chip-lime">Programme terminé 🏁</span><h2 class="title-lg mt-12">Bravo ${esc(a.prenom)} !</h2>
      <p class="muted mt-8">Tu as réalisé ${st.done} séances sur ${st.total}. Refais tes tests dans Objectifs, puis lance un nouveau cycle.</p>
      <button class="btn btn-primary mt-16" data-action="restart-cycle">Nouveau programme</button></div></div>`;
  } else if (found && found.day.session) {
    const s = found.day.session, done = S.progress[t]?.done;
    hero = `<a class="photo-card" href="#/seance/${t}" style="${bg(s.img, 1000)};min-height:300px;text-decoration:none;color:inherit">
      <div class="inner"><div class="chips"><span class="chip chip-lime">Aujourd'hui</span><span class="chip">Semaine ${wIdx + 1} · ${esc(week.phase.name)}</span></div>
      <h2 class="title-lg mt-12">${s.emoji} ${esc(s.title)}</h2>
      <p class="muted mt-8">${sessionMeta(s)}</p>
      <span class="btn ${done ? 'btn-ghost' : 'btn-primary'} mt-16">${done ? 'Séance terminée ✓' : 'Commencer la séance →'}</span></div></a>`;
  } else {
    const next = nextSession(t);
    hero = `<div class="photo-card" style="${bg(PHOTOS.yogaClass, 1000)};min-height:260px"><div class="inner">
      <span class="chip">Jour de récupération</span><h2 class="title-lg mt-12">Repos mérité 😴</h2>
      <p class="muted mt-8">Marche 20-30 min, étire-toi et hydrate-toi. ${next ? `Prochaine séance ${fmtDate(next.date, { weekday: 'long' })} : <b style="color:var(--text)">${esc(next.session.title)}</b>.` : ''}</p></div></div>`;
  }

  const menu = dailyMenu(a, t, S.swaps[t]);
  const glasses = Math.round(nutritionTargets(a).water / 0.25);
  const drunk = S.water[t] || 0;

  return `<div class="page">
    <div class="topbar">
      <div><p class="hello">${cap(fmtDate(t))}</p><h1 class="title-md">Salut ${esc(a.prenom)} 👋</h1></div>
      <a href="#/profil" class="avatar" style="text-decoration:none">${esc((a.prenom || '?').charAt(0).toUpperCase())}</a>
    </div>
    ${hero}
    <div class="section"><div class="section-head"><h2>Cette semaine</h2><a class="link" href="#/programme">Tout voir</a></div>
      ${weekStripHTML(week, t)}</div>
    <div class="stats mt-16">
      <div class="stat"><b>🔥 ${st.streak}</b><span>série en cours</span></div>
      <div class="stat"><b>${st.done}<small class="muted" style="font-size:14px">/${st.total}</small></b><span>séances faites</span></div>
      <div class="stat row" style="gap:8px"><div class="ring" style="--p:${st.pct}" data-label="${st.pct}%"></div></div>
    </div>
    ${notifPromptHTML()}
    <div class="section card" style="background:linear-gradient(135deg,rgba(200,255,77,.12),rgba(77,225,255,.08));border-color:rgba(200,255,77,.25)">
      <p class="eyebrow lime">Message du coach</p>
      <p class="mt-8" style="font-size:16px;font-weight:600">${esc(coachMessage(found?.day.session?.title))}</p>
      <p class="muted mt-12" style="font-size:13px">« ${esc(quote[0])} » — ${esc(quote[1])}</p>
    </div>
    <div class="section"><div class="section-head"><h2>🥗 Au menu aujourd'hui</h2><a class="link" href="#/nutrition">Coach alimentaire</a></div>
      <div class="hscroll">${menu.items.map((m) => `<button class="snack-card" data-action="recipe" data-id="${m.recipe.id}" data-factor="${m.factor}">
        <div class="img" style="${bg(m.recipe.img, 400)}"></div><div class="t"><span class="orange" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${slotLabel(m.slot)}</span><b>${esc(m.recipe.name)}</b><span>${Math.round(m.recipe.kcal * m.factor)} kcal</span></div></button>`).join('')}</div>
    </div>
    <div class="section card"><div class="row between"><div><b style="font-family:var(--font-h);font-size:17px">💧 Hydratation</b><p class="muted" style="font-size:13px">${(drunk * 0.25).toFixed(2).replace('.', ',')} L / ${String(nutritionTargets(a).water).replace('.', ',')} L</p></div>
      <div class="row"><button class="icon-btn" data-action="water" data-d="-1">−</button><button class="icon-btn" data-action="water" data-d="1" style="background:var(--cyan);color:#001a20">+</button></div></div>
      <div class="water">${Array.from({ length: glasses }, (_, i) => `<span class="glass ${i < drunk ? 'full' : ''}"></span>`).join('')}</div></div>
    ${Install.standalone() ? '' : `<div class="section">${installBarHTML()}</div>`}
  </div>`;
}

function nextSession(after) {
  for (const w of S.plan.weeks) for (const d of w.days) if (d.date > after && d.session) return d;
  return null;
}

function weekStripHTML(week, t) {
  return `<div class="weekstrip">${week.days.map((d) => {
    const cls = [d.session ? 'train' : '', S.progress[d.date]?.done ? 'done' : '', d.date === t ? 'today' : ''].join(' ');
    const inner = `${DOW_LABEL[d.dow].slice(0, 3)}<b>${parseISO(d.date).getDate()}</b><span class="dot"></span>`;
    return d.session ? `<a class="ws-day ${cls}" href="#/seance/${d.date}" style="text-decoration:none">${inner}</a>` : `<div class="ws-day ${cls}">${inner}</div>`;
  }).join('')}</div>`;
}

/* ==========================================================================
   VUE : PROGRAMME
   ========================================================================== */
const PHASE_TXT = {
  'Démarrage': 'On installe les bons mouvements et l\'habitude. Technique avant tout.',
  'Montée en puissance': 'Un peu plus de volume : tu connais les mouvements, on accélère.',
  'Fondations': 'On pose les bases : technique propre, charges confortables.',
  'Progression': '+ de répétitions ou de temps : ton corps s\'adapte, on pousse un peu.',
  'Intensification': 'Une série de plus. La semaine la plus dure du bloc : tu es prêt·e.',
  'Récupération active': 'Volume réduit pour laisser ton corps assimiler. C\'est là que tu progresses !',
  'Semaine finale 🏁': 'Dernière ligne droite ! Donne tout et refais tes tests à la fin.',
};

function viewProgram(arg) {
  const t = todayISO();
  const wIdx = arg != null && arg !== '' ? clamp(Number(arg) - 1, 0, S.plan.weeks.length - 1) : currentWeekIndex();
  const w = S.plan.weeks[wIdx];
  const done = w.days.filter((d) => d.session && S.progress[d.date]?.done).length;
  return `<div class="page">
    <p class="eyebrow">${S.plan.weeks.length} semaine${S.plan.weeks.length > 1 ? 's' : ''} · du ${fmtDate(S.plan.start, { day: 'numeric', month: 'short' })} au ${fmtDate(S.plan.end, { day: 'numeric', month: 'short' })}</p>
    <h1 class="title-lg mt-8">Ton programme</h1>
    <div class="week-tabs mt-16">${S.plan.weeks.map((wk, i) => {
      const full = wk.days.filter((d) => d.session).every((d) => S.progress[d.date]?.done);
      return `<a class="wt ${i === wIdx ? 'sel' : ''} ${full ? 'complete' : ''}" href="#/programme/${i + 1}" style="text-decoration:none;color:inherit">S${i + 1}<small>${full ? '✓' : wk.phase.deload ? 'récup' : wk.phase.final ? 'finale' : `${wk.sessionCount} séances`}</small></a>`;
    }).join('')}</div>
    <div class="photo-card mt-16" style="${bg(wIdx % 2 ? PHOTOS.gym : PHOTOS.barbell, 1000)};min-height:170px">
      <div class="inner"><span class="chip ${w.phase.deload ? 'chip-violet' : 'chip-lime'}">Semaine ${wIdx + 1} · ${esc(w.phase.name)}</span>
      <p class="mt-8" style="font-size:14px">${esc(PHASE_TXT[w.phase.name] || '')}</p>
      <p class="muted mt-8" style="font-size:13px">${done}/${w.sessionCount} séances réalisées</p></div>
    </div>
    <div class="stack mt-16">${w.days.map((d) => dayCardHTML(d, t)).join('')}</div>
    <p class="muted mt-24" style="font-size:12.5px;text-align:center">Les exercices évoluent toutes les 2 semaines pour éviter la routine.</p>
  </div>`;
}

function dayCardHTML(d, t) {
  const label = `${cap(fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'short' }))}${d.date === t ? ' · aujourd\'hui' : ''}`;
  if (!d.session) {
    return `<div class="day-card rest ${d.date === t ? 'is-today' : ''}"><div class="thumb">😴</div><div class="meta"><span class="d">${label}</span><b>Repos</b><span class="s">Récupération, marche, étirements</span></div></div>`;
  }
  const s = d.session, done = S.progress[d.date]?.done;
  return `<a class="day-card ${d.date === t ? 'is-today' : ''}" href="#/seance/${d.date}" style="text-decoration:none;color:inherit">
    <div class="thumb" style="${bg(s.img, 300)}">${done ? `<span class="done-badge">${ICON.check.replace('<svg', '<svg width="30" height="30"')}</span>` : ''}</div>
    <div class="meta"><span class="d">${label}</span><b>${s.emoji} ${esc(s.title)}</b><span class="s">${sessionMeta(s)}</span></div>
    <span class="chev">${ICON.chev}</span></a>`;
}

/* ==========================================================================
   VUE : SÉANCE
   ========================================================================== */
const FORMAT_TXT = {
  series: () => 'Fais toutes les séries d\'un exercice avant de passer au suivant. Touche une série pour la valider : le minuteur de repos se lance tout seul.',
  circuit: (s) => `Circuit : enchaîne tous les exercices avec ~15 s de transition, puis 90 s de repos. <b>${s.rounds} tours</b>. Valide un tour sur chaque exercice.`,
  hiit: (s) => `HIIT : effort à fond pendant le temps indiqué, puis récup. <b>${s.rounds} tours</b>, 1 min de pause entre les tours.`,
  flow: () => 'Enchaîne les postures en respirant lentement par le nez. Tu dois sentir un étirement, jamais une douleur.',
  cardio: () => 'Écoute ton souffle : à allure facile, tu dois pouvoir parler. Sur les phases rapides, tu ne peux dire que quelques mots.',
};

function presText(b, s) {
  if (s.format === 'hiit') return `${b.value} s d'effort · ${b.rest} s de récup`;
  const v = b.unit === 'sec' ? `${b.value} s` : `${b.value} reps`;
  if (s.format === 'circuit') return `${v}${b.sided ? ' / côté' : ''} par tour`;
  return `${b.sets} × ${v}${b.sided ? ' / côté' : ''} · repos ${b.rest >= 120 ? `${Math.round(b.rest / 60 * 10) / 10} min`.replace('.', ',') : `${b.rest} s`}`;
}

function viewSession(iso) {
  const f = findDay(S.plan, iso);
  if (!f || !f.day.session) return `<div class="page"><p class="empty">Séance introuvable.</p><a class="btn btn-ghost" href="#/programme">Retour</a></div>`;
  const s = f.day.session, prog = S.progress[iso] || {}, sets = prog.sets || {};
  const done = !!prog.done;
  const rounds = s.format === 'hiit' || s.format === 'circuit' ? s.rounds : null;
  const blocks = s.blocks.map((b, i) => {
    if (b.cardio) {
      return `<div class="cardio-block"><span class="eyebrow" style="color:var(--cyan)">Bloc cardio</span><b class="mt-8">${esc(b.name)}</b><p style="font-size:14.5px">${esc(b.detail)}</p></div>`;
    }
    const ex = EX_BY_ID[b.exId];
    const n = rounds || b.sets;
    const doneN = sets[i] || 0;
    return `<div class="ex-card" data-ex="${i}">
      <button class="ex-head" data-action="toggle-ex" data-i="${i}">
        <div class="ex-img" style="${bg(ex.img, 300)}"></div>
        <div style="flex:1;min-width:0"><b>${b.finisher ? '🏁 Finisher · ' : ''}${esc(ex.name)}</b><div class="p">${presText(b, s)}</div>
        ${b.loadTip ? '<div class="muted" style="font-size:12px;margin-top:2px">↑ Charge un peu plus lourde qu\'au bloc précédent</div>' : ''}</div>
        <span class="chev">${ICON.chev}</span>
      </button>
      <div class="ex-body"><ul>${ex.tips.map((tp) => `<li>${esc(tp)}</li>`).join('')}</ul>
        <div class="sets">${Array.from({ length: n }, (_, k) => `<button class="set-btn ${k < doneN ? 'done' : ''}" data-action="set" data-i="${i}" data-k="${k}" data-rest="${s.format === 'series' || b.finisher ? b.rest : 0}">${rounds ? `Tour ${k + 1}` : `Série ${k + 1}`}</button>`).join('')}</div>
      </div></div>`;
  }).join('');

  return `<div class="page">
    <div class="session-hero" style="${bg(s.img, 1200)}">
      <div class="row between"><button class="icon-btn" data-action="back" style="background:rgba(10,11,15,.55);backdrop-filter:blur(8px)">${ICON.back}</button>
        ${done ? '<span class="chip chip-lime">Terminée ✓</span>' : ''}</div>
      <div><p class="eyebrow lime">${cap(fmtDate(iso))} · Semaine ${f.week.index + 1}</p>
      <h1 class="title-lg mt-8">${s.emoji} ${esc(s.title)}</h1>
      <div class="chips mt-12"><span class="chip">⏱️ ~${s.estMin} min</span><span class="chip">${esc(f.week.phase.name)}</span>${rounds ? `<span class="chip">🔁 ${rounds} tours</span>` : ''}</div></div>
    </div>
    <p class="format-note mt-16">${FORMAT_TXT[s.format](s)}</p>
    <div class="section card"><b style="font-family:var(--font-h);font-size:17px">🔥 Échauffement · 5 min</b><ul class="list-plain mt-8">${s.warmup.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>
    <div class="section"><div class="section-head"><h2>Au programme</h2><span class="muted" style="font-size:13px">Touche un exercice</span></div>
      <div class="stack">${blocks}</div></div>
    <div class="section card"><b style="font-family:var(--font-h);font-size:17px">🧘 Retour au calme · 5 min</b><ul class="list-plain mt-8">${s.cooldown.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>
    <div class="mt-24">${done
      ? `<button class="btn btn-ghost btn-block" data-action="undo-session" data-date="${iso}">Marquer comme non faite</button>`
      : `<button class="btn btn-primary btn-block" data-action="finish-session" data-date="${iso}">Terminer la séance 🏆</button>`}</div>
  </div>`;
}

/* ---------- minuteur de repos ---------- */
function startTimer(sec) {
  stopTimer();
  if (!sec) return;
  const end = Date.now() + sec * 1000;
  const el = document.createElement('div');
  el.className = 'timer'; el.id = 'timer';
  el.innerHTML = `<div><div class="lbl">Repos</div><b id="timer-v">${sec}s</b></div><button class="btn btn-sm btn-ghost" data-action="stop-timer">Passer</button>`;
  document.body.appendChild(el);
  S.timer = setInterval(() => {
    const left = Math.max(0, Math.round((end - Date.now()) / 1000));
    const v = $('#timer-v');
    if (v) v.textContent = left >= 60 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : `${left}s`;
    if (left <= 0) { stopTimer(); beep(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); toast('C\'est reparti ! 💪'); }
  }, 250);
}
function stopTimer() { clearInterval(S.timer); S.timer = null; const el = $('#timer'); if (el) el.remove(); }
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); o.stop(ctx.currentTime + 0.25);
  } catch { /* audio indisponible */ }
}

/* ==========================================================================
   VUE : NUTRITION
   ========================================================================== */
const slotLabel = (s) => ({ petitdej: 'Petit-déjeuner', dejeuner: 'Déjeuner', diner: 'Dîner', gouter: 'Goûter', gouter2: 'Collation' }[s] || s);

function nutritionTips(a, t) {
  const tips = [];
  const goal = a.objectif;
  if (goal === 'perte_poids' || goal === 'tonifier') {
    tips.push(['🍽️', 'L\'assiette idéale', '½ légumes, ¼ protéines, ¼ féculents complets. Simple et efficace.']);
    tips.push(['🥤', 'Ne bois pas tes calories', 'Sodas, jus et alcool : remplace-les par de l\'eau pétillante citronnée.']);
  }
  if (goal === 'muscle' || goal === 'force') {
    tips.push(['🥩', 'Protéines réparties', `Vise ~${Math.round(t.p / 4)} g de protéines à chacun de tes 3-4 repas.`]);
    tips.push(['🍚', 'Les glucides sont tes amis', 'Mets-en autour de l\'entraînement : ils remplissent tes réserves pour la séance suivante.']);
  }
  if (goal === 'endurance') tips.push(['🍝', 'Carburant', 'Les jours de sortie longue, un féculent à chaque repas. Banane ou fruits secs pendant l\'effort si plus d\'1 h.']);
  tips.push(['⏰', 'Avant la séance', 'Un fruit ou une tartine 1 h avant. Évite un gros repas dans les 2 h qui précèdent.']);
  tips.push(['🔄', 'Après la séance', 'Dans les 2 h : protéines + glucides (ex. : shake post-training ou un vrai repas).']);
  if (a.grignotage === 'sucre' || a.grignotage === 'sale') tips.push(['🍫', 'Anti-grignotage', 'Planifie ton goûter : quand il est prévu, l\'envie de grignoter n\'importe quoi baisse énormément.']);
  if (a.eau === '<1' || a.eau === '1-1.5') tips.push(['💧', 'Hydratation', 'Garde une gourde toujours visible et bois un grand verre à chaque repas.']);
  if (a.sommeil === '<6' || a.sommeil === '6-7') tips.push(['😴', 'Le sommeil, c\'est aussi la nutrition', 'Moins de 7 h de sommeil = plus de fringales. Couche-toi 30 min plus tôt.']);
  return tips;
}

function viewNutrition() {
  const a = S.answers;
  const t = nutritionTargets(a);
  const day = addDays(parseISO(todayISO()), S.menuDay);
  const iso = isoDate(day);
  const menu = dailyMenu(a, iso, S.swaps[iso]);
  const sum = menu.items.reduce((acc, m) => ({ kcal: acc.kcal + m.recipe.kcal * m.factor, p: acc.p + m.recipe.p * m.factor }), { kcal: 0, p: 0 });
  const snacks = recipesFor(a, 'gouter');
  const types = [['tout', 'Tout'], ['petitdej', 'Petit-déj'], ['dejeuner', 'Déjeuner'], ['diner', 'Dîner'], ['gouter', 'Goûters']];
  const all = RECIPES.filter((r) => dietAllows(r, { ...a, cuisine: 60 }) && (S.recipeFilter === 'tout' || r.type === S.recipeFilter));
  const goalTxt = { perte_poids: 'Léger déficit pour perdre du gras sans perdre ton énergie.', muscle: 'Léger surplus pour construire du muscle proprement.', force: 'Assez d\'énergie pour soulever lourd.', tonifier: 'Petit déficit + beaucoup de protéines pour te sculpter.', endurance: 'Le bon carburant pour tenir la distance.' }[a.objectif] || 'Une alimentation équilibrée pour avoir la pêche.';

  return `<div class="page">
    <div class="photo-card" style="${bg(PHOTOS.foodTable, 1000)};min-height:220px"><div class="inner">
      <span class="chip chip-orange">Coach alimentaire</span><h1 class="title-lg mt-12">Bien manger, simplement.</h1>
      <p class="muted mt-8">${esc(goalTxt)}</p></div></div>
    ${t.minor ? '<div class="banner-warn mt-16">Tu as moins de 18 ans : pas de régime restrictif. Mange à ta faim des aliments de qualité, ton corps grandit encore !</div>' : ''}
    <div class="macro-grid mt-16">
      <div class="macro"><b>${t.kcal}</b><span>kcal</span><div class="bar" style="background:var(--lime)"></div></div>
      <div class="macro"><b>${t.p}g</b><span>protéines</span><div class="bar" style="background:var(--orange)"></div></div>
      <div class="macro"><b>${t.c}g</b><span>glucides</span><div class="bar" style="background:var(--cyan)"></div></div>
      <div class="macro"><b>${t.f}g</b><span>lipides</span><div class="bar" style="background:var(--violet)"></div></div>
    </div>
    <div class="section"><div class="section-head"><h2>Menu du jour</h2><span class="muted" style="font-size:13px">~${Math.round(sum.kcal)} kcal · ${Math.round(sum.p)} g prot.</span></div>
      <div class="filter-chips">${['Aujourd\'hui', 'Demain', 'Après-demain'].map((l, i) => `<button class="fchip ${S.menuDay === i ? 'sel' : ''}" data-action="menu-day" data-d="${i}">${l}</button>`).join('')}</div>
      <div class="stack">${menu.items.map((m) => `<div class="meal-card">
        <button class="thumb" data-action="recipe" data-id="${m.recipe.id}" data-factor="${m.factor}" style="${bg(m.recipe.img, 300)}" aria-label="Voir la recette"></button>
        <button class="meta" data-action="recipe" data-id="${m.recipe.id}" data-factor="${m.factor}" style="text-align:left"><span class="slot">${slotLabel(m.slot)}</span><b>${esc(m.recipe.name)}</b>
          <span class="s">${Math.round(m.recipe.kcal * m.factor)} kcal · ${Math.round(m.recipe.p * m.factor)} g prot. · ${m.recipe.time} min${m.factor !== 1 ? ` · portion ×${String(m.factor).replace('.', ',')}` : ''}</span></button>
        <button class="swap" data-action="swap" data-slot="${m.slot}" data-date="${iso}" aria-label="Autre idée">${ICON.shuffle}</button></div>`).join('')}</div>
      <button class="btn btn-ghost btn-block mt-12" data-action="shopping" data-date="${iso}">🛒 Liste de courses du jour</button>
    </div>
    <div class="section"><div class="section-head"><h2>🍓 Goûters sains</h2><span class="muted" style="font-size:13px">${snacks.length} idées</span></div>
      <div class="hscroll">${snacks.map((r) => recipeCardHTML(r)).join('')}</div></div>
    <div class="section"><div class="section-head"><h2>📖 Toutes les recettes</h2></div>
      <div class="filter-chips">${types.map(([k, l]) => `<button class="fchip ${S.recipeFilter === k ? 'sel' : ''}" data-action="rfilter" data-k="${k}">${l}</button>`).join('')}</div>
      <div class="recipe-grid">${all.slice(0, S.showAllRecipes ? all.length : 6).map((r) => recipeCardHTML(r)).join('') || '<p class="empty">Aucune recette pour ce filtre.</p>'}</div>
      ${all.length > 6 && !S.showAllRecipes ? `<button class="btn btn-ghost btn-block mt-12" data-action="more-recipes">Voir les ${all.length} recettes</button>` : ''}</div>
    <div class="section"><div class="section-head"><h2>💡 Conseils du coach</h2></div>
      <div class="stack">${nutritionTips(a, t).map(([e, ti, p]) => `<div class="tip"><span class="em">${e}</span><div><b>${esc(ti)}</b><p>${esc(p)}</p></div></div>`).join('')}</div></div>
    <p class="muted mt-24" style="font-size:12px;text-align:center">Estimations indicatives (formule de Mifflin-St Jeor). Elles ne remplacent pas l'avis d'un·e diététicien·ne.</p>
  </div>`;
}

function recipeCardHTML(r) {
  return `<button class="snack-card" data-action="recipe" data-id="${r.id}" data-factor="1"><div class="img" style="${bg(r.img, 400)}"></div>
    <div class="t"><b>${esc(r.name)}</b><span>${r.kcal} kcal · ${r.time} min · ${r.p} g prot.</span></div></button>`;
}

function openRecipe(id, factor = 1) {
  const r = REC_BY_ID[id];
  const f = Number(factor) || 1;
  const tags = [];
  if (r.diet === 'vegan') tags.push('🌱 Végan'); else if (r.diet === 'vege') tags.push('🥚 Végétarien');
  if (!r.contains.includes('gluten')) tags.push('Sans gluten');
  if (!r.contains.includes('lactose')) tags.push('Sans lactose');
  openSheet(`<div class="sheet-img" style="${bg(r.img, 1000)}"><button class="icon-btn sheet-close" data-action="close-sheet">${ICON.close}</button></div>
    <div class="sheet-content">
      <span class="eyebrow orange">${slotLabel(r.type)} · ${r.time} min</span>
      <h2 class="title-lg mt-8">${esc(r.name)}</h2>
      <div class="macro-grid mt-16">
        <div class="macro"><b>${Math.round(r.kcal * f)}</b><span>kcal</span></div><div class="macro"><b>${Math.round(r.p * f)}g</b><span>prot.</span></div>
        <div class="macro"><b>${Math.round(r.c * f)}g</b><span>gluc.</span></div><div class="macro"><b>${Math.round(r.f * f)}g</b><span>lip.</span></div></div>
      ${f !== 1 ? `<p class="format-note mt-12">Portion adaptée à tes besoins : multiplie les quantités par <b>${String(f).replace('.', ',')}</b>.</p>` : ''}
      <div class="chips mt-12">${tags.map((x) => `<span class="chip">${x}</span>`).join('')}</div>
      <h3 class="title-md mt-24">Ingrédients</h3><ul class="ing mt-8">${r.ingredients.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      <h3 class="title-md mt-24">Préparation</h3><ol class="steps mt-12">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    </div>`);
}

/* ==========================================================================
   VUE : OBJECTIFS
   ========================================================================== */
function goalCardHTML(g) {
  return `<div class="goal-card"><div class="ic">${g.icon}</div><div style="flex:1;min-width:0"><span class="eyebrow">${esc(g.title)}</span>
    <div class="ft"><span>${esc(g.from)}</span><span class="arrow">→</span><span class="to">${esc(g.to)}</span></div><p>${esc(g.detail)}</p></div></div>`;
}

function weightChart(points, target) {
  if (points.length < 2) return '<p class="muted" style="font-size:13px;margin-top:10px">Ajoute au moins 2 pesées pour voir ta courbe.</p>';
  const W = 320, H = 150, P = 20;
  const vals = points.map((p) => p.kg).concat(target ? [target] : []);
  const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1;
  const x = (i) => P + (i * (W - 2 * P)) / (points.length - 1);
  const y = (v) => H - P - ((v - min) * (H - 2 * P)) / (max - min);
  const line = points.map((p, i) => `${x(i)},${y(p.kg)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Courbe de poids">
    ${target ? `<line x1="${P}" x2="${W - P}" y1="${y(target)}" y2="${y(target)}" stroke="#c8ff4d" stroke-dasharray="4 4" opacity=".6"/><text x="${W - P}" y="${y(target) - 6}" fill="#c8ff4d" font-size="10" text-anchor="end">objectif ${target} kg</text>` : ''}
    <polyline points="${line}" fill="none" stroke="#4de1ff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.kg)}" r="3.5" fill="#4de1ff"/>`).join('')}
    <text x="${x(points.length - 1)}" y="${y(points[points.length - 1].kg) - 9}" fill="#f4f5f7" font-size="11" font-weight="700" text-anchor="end">${points[points.length - 1].kg} kg</text>
  </svg>`;
}

function viewGoals() {
  const a = S.answers, g = S.goals;
  const wIdx = currentWeekIndex() + 1;
  const weights = [{ date: S.createdAt, kg: Number(a.poids) }, ...S.weights].sort((x, y) => x.date.localeCompare(y.date));
  const lastTest = S.tests[S.tests.length - 1];
  return `<div class="page">
    <h1 class="title-lg">Tes objectifs</h1>
    <div class="archetype mt-16">
      <div class="big">${g.archetype.emoji}</div>
      <p class="eyebrow mt-8">Ton profil</p><h2 class="title-lg">${g.archetype.name}</h2>
      <p class="muted mt-8">${esc(g.archetype.line)}</p>
      <div class="chips mt-16"><span class="chip">IMC ${String(g.bmi).replace('.', ',')}</span><span class="chip">${S.plan.weeks.length} semaines</span><span class="chip">Niveau ${['', 'débutant', 'intermédiaire', 'avancé'][Number(a.niveau)]}</span></div>
      ${a.pourquoi === 'evenement' && a.evenement ? `<p class="mt-12">🎯 Pour : <b>${esc(a.evenement)}</b></p>` : ''}
    </div>
    <div class="section"><div class="section-head"><h2>🎯 Ce que tu vises</h2></div><div class="stack">${g.goals.map(goalCardHTML).join('')}</div></div>
    <div class="section card"><div class="row between"><b style="font-family:var(--font-h);font-size:17px">⚖️ Suivi du poids</b><span class="muted" style="font-size:13px">${weights.length} pesée${weights.length > 1 ? 's' : ''}</span></div>
      ${weightChart(weights, Number(a.poids_cible) || null)}
      <div class="log-form"><input class="input" id="w-input" inputmode="decimal" placeholder="Poids du jour (kg)"><button class="btn btn-primary btn-sm" style="height:48px" data-action="log-weight">Ajouter</button></div></div>
    <div class="section card"><b style="font-family:var(--font-h);font-size:17px">🧪 Mes tests</b>
      <p class="muted" style="font-size:13px">Refais-les toutes les 4 semaines. ${lastTest ? `Dernier : ${lastTest.pompes} pompes, planche ${lastTest.planche} s (${fmtDate(lastTest.date, { day: 'numeric', month: 'short' })}).` : ''}</p>
      <div class="log-form"><input class="input" id="t-pompes" inputmode="numeric" placeholder="Pompes"><input class="input" id="t-planche" inputmode="numeric" placeholder="Planche (s)"><button class="btn btn-primary btn-sm" style="height:48px" data-action="log-test">OK</button></div>
      ${S.tests.length ? `<div class="kv mt-16">${S.tests.slice(-5).reverse().map((x) => `<dt>${fmtDate(x.date, { day: 'numeric', month: 'short' })}</dt><dd>${x.pompes} pompes · ${x.planche} s</dd>`).join('')}</div>` : ''}</div>
    <div class="section"><div class="section-head"><h2>🗺️ Tes étapes</h2></div>
      <div class="timeline">${g.milestones.map((m) => `<div class="tl-item ${wIdx > m.week || (m.week === S.plan.weeks.length && todayISO() > S.plan.end) ? 'done' : ''}"><b>Semaine ${m.week}</b><p>${esc(m.text)}</p></div>`).join('')}</div></div>
  </div>`;
}

/* ==========================================================================
   VUE : PROFIL / RÉGLAGES
   ========================================================================== */
function viewProfile() {
  const a = S.answers;
  const label = (id) => { const q = QUESTIONS.find((x) => x.id === id); const o = q?.opts?.find((x) => x.v === String(a[id])); return o ? o.l : a[id]; };
  const perm = Notif.permission();
  return `<div class="page">
    <div class="row"><div class="avatar" style="width:64px;height:64px;font-size:28px">${esc((a.prenom || '?').charAt(0).toUpperCase())}</div>
      <div><h1 class="title-lg">${esc(a.prenom)}</h1><p class="muted">${S.goals.archetype.emoji} Profil ${S.goals.archetype.name}</p></div></div>

    <div class="section card"><b style="font-family:var(--font-h);font-size:17px">🔔 Notifications de motivation</b>
      <div class="setting"><div class="t"><b>Rappel quotidien</b><span>${perm === 'unsupported' ? (Install.isIOS() && !Install.standalone() ? 'Installe d\'abord l\'appli sur l\'écran d\'accueil (iPhone)' : 'Non pris en charge par ce navigateur') : perm === 'denied' ? 'Bloquées : autorise-les dans les réglages du navigateur' : 'Un message de ton coach chaque jour'}</span></div>
        <button class="switch ${S.notif.enabled && perm === 'granted' ? 'on' : ''}" data-action="notif-toggle" aria-label="Activer les notifications"></button></div>
      <div class="setting"><div class="t"><b>Heure</b><span>Le message arrive à cette heure-là</span></div><input type="time" class="time-input" data-input="notif-hour" value="${esc(S.notif.hour || a.notif_heure || '18:00')}"></div>
      <div class="setting"><div class="t"><b>Style du coach</b><span>${esc(label('coach'))}</span></div>
        <select class="time-input" data-input="coach">${['doux', 'motivant', 'militaire'].map((c) => `<option value="${c}" ${a.coach === c ? 'selected' : ''}>${cap(c)}</option>`).join('')}</select></div>
      <div class="row mt-12" style="flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-action="notif-test">Tester une notification</button>
        <button class="btn btn-ghost btn-sm" data-action="ics">📅 Rappels dans mon agenda</button></div>
      <p class="muted mt-12" style="font-size:12px">Astuce : « Rappels dans mon agenda » ajoute toutes tes séances à ton calendrier avec une alarme. C'est la méthode la plus fiable, même quand l'appli est fermée.</p>
    </div>

    <div class="section">${Install.standalone() ? '<div class="card">✅ FORGE est installée sur ton écran d\'accueil.</div>' : installBarHTML()}</div>

    <div class="section card"><b style="font-family:var(--font-h);font-size:17px">📋 Mon profil</b>
      <dl class="kv mt-12">
        <dt>Âge</dt><dd>${a.age} ans</dd><dt>Taille</dt><dd>${a.taille} cm</dd><dt>Poids de départ</dt><dd>${a.poids} kg</dd>
        <dt>Objectif</dt><dd>${esc(label('objectif'))}</dd><dt>Niveau</dt><dd>${esc(label('niveau'))}</dd>
        <dt>Jours</dt><dd>${S.plan.facts.days.map((d) => DOW_LABEL[d].slice(0, 3)).join(', ')}</dd>
        <dt>Durée</dt><dd>${esc(label('duree'))}</dd><dt>Lieu</dt><dd>${esc(label('lieu'))}</dd>
        <dt>Alimentation</dt><dd>${esc(label('regime'))}</dd>
      </dl></div>

    <div class="section card"><b style="font-family:var(--font-h);font-size:17px">⚙️ Programme</b>
      <div class="setting"><div class="t"><b>Durée du programme</b><span>Ta progression est conservée</span></div>
        <select class="time-input" data-input="weeks">${[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 52].concat([Number(a.semaines)]).filter((v, i, arr) => arr.indexOf(v) === i).sort((x, y) => x - y).map((w) => `<option value="${w}" ${Number(a.semaines) === w ? 'selected' : ''}>${w} sem.</option>`).join('')}</select></div>
      <button class="btn btn-ghost btn-block mt-12" data-action="redo-quiz">Refaire le questionnaire</button>
      <button class="btn btn-ghost btn-block mt-12" data-action="reset" style="color:var(--danger)">Tout réinitialiser</button>
    </div>
    <p class="muted mt-24" style="font-size:12px;text-align:center">FORGE ne remplace pas un avis médical. En cas de douleur inhabituelle, arrête l'exercice.<br>Photos : Unsplash.</p>
  </div>`;
}

function notifPromptHTML() {
  if (!S.answers || S.answers.notifs !== 'oui') return '';
  const perm = Notif.permission();
  if (perm === 'granted' && S.notif.enabled) return '';
  let txt = 'Active les notifications pour recevoir ton message de motivation chaque jour.';
  let btn = '<button class="btn btn-primary btn-sm" data-action="notif-enable">Activer</button>';
  if (perm === 'unsupported' && Install.isIOS() && !Install.standalone()) {
    txt = 'Sur iPhone, les notifications marchent une fois FORGE ajoutée à l\'écran d\'accueil.';
    btn = '<button class="btn btn-primary btn-sm" data-action="install">Installer</button>';
  } else if (perm === 'unsupported') {
    txt = 'Ton navigateur ne gère pas les notifications : ajoute plutôt tes séances à ton agenda.';
    btn = '<button class="btn btn-primary btn-sm" data-action="ics">Agenda</button>';
  } else if (perm === 'denied') {
    txt = 'Notifications bloquées. Autorise-les dans les réglages du site, ou utilise l\'agenda.';
    btn = '<button class="btn btn-primary btn-sm" data-action="ics">Agenda</button>';
  }
  return `<div class="card mt-16 row" style="gap:12px;border-color:rgba(200,255,77,.3)"><span style="color:var(--lime)">${ICON.bell}</span><p style="flex:1;font-size:13.5px">${txt}</p>${btn}</div>`;
}

/* ==========================================================================
   FEUILLES (modales), TOAST, CONFETTIS
   ========================================================================== */
function openSheet(html) {
  closeSheet();
  const el = document.createElement('div');
  el.className = 'sheet-backdrop'; el.id = 'sheet';
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  el.addEventListener('click', (e) => { if (e.target === el) closeSheet(); });
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
}
function closeSheet() { const el = $('#sheet'); if (el) el.remove(); document.body.style.overflow = ''; }

let toastTO;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTO); toastTO = setTimeout(() => el.classList.remove('show'), 2600);
}

function confetti() {
  const colors = ['#c8ff4d', '#4de1ff', '#ff7a45', '#8b8cff', '#ff5c8a'];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
    c.style.animationDelay = Math.random() * 0.3 + 's';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}

/* ==========================================================================
   INSTALLATION (écran d'accueil)
   ========================================================================== */
const Install = {
  deferred: null,
  standalone: () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
  isIOS: () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  async prompt() {
    if (Install.standalone()) return toast('FORGE est déjà sur ton écran d\'accueil ✅');
    if (Install.deferred) {
      Install.deferred.prompt();
      const { outcome } = await Install.deferred.userChoice;
      Install.deferred = null;
      if (outcome === 'accepted') toast('Installation en cours… 🎉');
      updateInstallUI();
      return;
    }
    if (Install.isIOS()) {
      const safari = /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);
      return openSheet(`<div class="sheet-handle"></div><div class="sheet-content">
        <h2 class="title-lg">Ajouter FORGE à ton iPhone</h2>
        <p class="muted mt-8">Apple n'autorise pas l'installation en un seul bouton : il faut 3 petits gestes.</p>
        ${safari ? '' : '<p class="banner-warn mt-12">⚠️ Ouvre d\'abord cette page dans <b>Safari</b> (ou utilise le bouton Partager de ton navigateur).</p>'}
        <div class="ios-steps">
          <div class="ios-step"><span class="n">1</span><span>Touche le bouton <b>Partager</b> ${ICON.share} en bas de l'écran (ou ••• puis Partager)</span></div>
          <div class="ios-step"><span class="n">2</span><span>Fais défiler et choisis <b>Sur l'écran d'accueil</b> ${ICON.plusSq}</span></div>
          <div class="ios-step"><span class="n">3</span><span>Touche <b>Ajouter</b> en haut à droite. C'est fait ! 🎉</span></div>
        </div>
        <p class="muted" style="font-size:13px">Ensuite, ouvre FORGE depuis son icône pour activer les notifications.</p>
        <button class="btn btn-primary btn-block mt-16" data-action="close-sheet">J'ai compris</button></div>`);
    }
    openSheet(`<div class="sheet-handle"></div><div class="sheet-content">
      <h2 class="title-lg">Installer FORGE</h2>
      <p class="muted mt-8">Ton navigateur n'a pas encore proposé l'installation automatique. Tu peux le faire à la main :</p>
      <div class="ios-steps">
        <div class="ios-step"><span class="n">1</span><span>Ouvre le menu du navigateur <b>⋮</b> (en haut à droite)</span></div>
        <div class="ios-step"><span class="n">2</span><span>Choisis <b>Installer l'application</b> ou <b>Ajouter à l'écran d'accueil</b></span></div>
        <div class="ios-step"><span class="n">3</span><span>Confirme. FORGE apparaît avec ses copines les applis 📱</span></div>
      </div>
      <p class="muted" style="font-size:13px">Astuce : sur Android, utilise Chrome, Edge ou Samsung Internet.</p>
      <button class="btn btn-primary btn-block mt-16" data-action="close-sheet">OK</button></div>`);
  },
};
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); Install.deferred = e; updateInstallUI(); });
window.addEventListener('appinstalled', () => { Install.deferred = null; toast('FORGE est installée ! 🎉'); updateInstallUI(); });
function updateInstallUI() {
  document.querySelectorAll('.install-bar').forEach((b) => b.classList.toggle('hidden', Install.standalone()));
}

/* ==========================================================================
   NOTIFICATIONS
   - Notification + Service Worker : message immédiat / au retour dans l'appli
   - Periodic Background Sync (Chrome Android, appli installée) : envoi en arrière-plan
   - Minuteur local quand l'appli est ouverte
   - Export .ics : alarmes dans l'agenda (fiable partout)
   ========================================================================== */
const DATA_CACHE = 'forge-data';
const SETTINGS_URL = () => new URL('./__forge_settings', document.baseURI).href;
const LASTSENT_URL = () => new URL('./__forge_lastsent', document.baseURI).href;

const Notif = {
  localTO: null,
  permission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // default | granted | denied
  },
  async enable({ silent = false } = {}) {
    if (this.permission() === 'unsupported') {
      if (!silent) {
        if (Install.isIOS() && !Install.standalone()) { toast('Installe d\'abord FORGE sur ton écran d\'accueil'); Install.prompt(); }
        else toast('Notifications non prises en charge ici : utilise l\'agenda 📅');
      }
      return false;
    }
    let perm = Notification.permission;
    if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch { perm = 'denied'; } }
    if (perm !== 'granted') {
      if (!silent) { toast('Notifications refusées. Tu peux les autoriser dans les réglages.'); render(); }
      return false;
    }
    S.notif.enabled = true;
    S.notif.hour = S.notif.hour || S.answers.notif_heure || '18:00';
    store.set('notif', S.notif);
    await this.sync();
    if (!silent) {
      toast('Notifications activées 🔔');
      this.show('FORGE est prêt 💪', `Tu recevras ton message chaque jour à ${S.notif.hour.replace(':', 'h')}.`);
    }
    if (location.hash.startsWith('#/accueil') || location.hash.startsWith('#/profil') || location.hash.startsWith('#/plan-pret')) render();
    return true;
  },
  disable() { S.notif.enabled = false; store.set('notif', S.notif); this.sync(); clearTimeout(this.localTO); },
  messageFor(iso) {
    const f = findDay(S.plan, iso);
    const s = f?.day.session;
    return { title: s ? `${s.emoji} ${s.title}` : '😴 Jour de récup', body: coachMessage(s?.title, iso) };
  },
  async show(title, body) {
    try {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'forge-daily', renotify: true, data: { url: './#/accueil' }, vibrate: [100, 50, 100] };
      if (reg) await reg.showNotification(title, opts);
      else new Notification(title, opts);
    } catch (e) { console.warn('Notification impossible', e); }
  },
  /** Stocke les messages des 60 prochains jours pour le service worker. */
  async sync() {
    if (!('caches' in window) || !S.plan) return;
    const messages = {};
    const start = parseISO(todayISO());
    for (let i = 0; i < 60; i++) { const iso = isoDate(addDays(start, i)); messages[iso] = this.messageFor(iso); }
    const payload = { enabled: S.notif.enabled && this.permission() === 'granted', hour: S.notif.hour, messages };
    try {
      const c = await caches.open(DATA_CACHE);
      await c.put(SETTINGS_URL(), new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } }));
    } catch { /* cache indisponible */ }
    await this.registerBackground();
    this.scheduleLocal();
  },
  async registerBackground() {
    if (!S.notif.enabled || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      if ('periodicSync' in reg) {
        const st = await navigator.permissions.query({ name: 'periodic-background-sync' }).catch(() => ({ state: 'denied' }));
        if (st.state === 'granted') await reg.periodicSync.register('forge-daily', { minInterval: 4 * 60 * 60 * 1000 });
      }
      // API expérimentale « Notification Triggers » : planifie les 7 prochains jours
      if ('showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
        const [h, m] = S.notif.hour.split(':').map(Number);
        for (let i = 0; i < 7; i++) {
          const d = addDays(new Date(), i); d.setHours(h, m, 0, 0);
          if (d.getTime() <= Date.now()) continue;
          const msg = this.messageFor(isoDate(d));
          await reg.showNotification(msg.title, { body: msg.body, tag: `forge-${isoDate(d)}`, icon: 'icons/icon-192.png', showTrigger: new TimestampTrigger(d.getTime()), data: { url: './#/accueil' } });
        }
      }
    } catch (e) { console.warn('Planification en arrière-plan indisponible', e); }
  },
  /** Envoie le message du jour s'il n'est pas encore parti et que l'heure est passée. */
  async check() {
    if (!S.answers || !S.notif.enabled || this.permission() !== 'granted') return;
    const now = new Date();
    const [h, m] = (S.notif.hour || '18:00').split(':').map(Number);
    if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;
    const today = isoDate(now);
    let last = store.get('lastSent', null);
    try { const c = await caches.open(DATA_CACHE); const r = await c.match(LASTSENT_URL()); if (r) last = (await r.text()) || last; } catch { /* ignore */ }
    if (last === today) return;
    const msg = this.messageFor(today);
    await this.show(msg.title, msg.body);
    store.set('lastSent', today);
    try { const c = await caches.open(DATA_CACHE); await c.put(LASTSENT_URL(), new Response(today)); } catch { /* ignore */ }
  },
  scheduleLocal() {
    clearTimeout(this.localTO);
    if (!S.notif.enabled) return;
    const [h, m] = (S.notif.hour || '18:00').split(':').map(Number);
    const target = new Date(); target.setHours(h, m, 0, 0);
    const ms = target - Date.now();
    if (ms > 0 && ms < 24 * 3600 * 1000) this.localTO = setTimeout(() => this.check(), ms + 1000);
  },
};

function downloadICS() {
  const ics = buildICS(S.answers, S.plan, (title) => coachMessage(title));
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'forge-seances.ics';
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Ouvre le fichier pour ajouter tes séances à ton agenda 📅');
}

/* ==========================================================================
   ACTIONS (délégation d'événements)
   ========================================================================== */
const actions = {
  'start-quiz': () => go('#/quiz'),
  install: () => Install.prompt(),
  goto: (el) => go(el.dataset.to),
  back: () => (history.length > 1 ? history.back() : go('#/programme')),
  'close-sheet': () => closeSheet(),

  'q-pick': (el) => {
    const q = quizCurrent();
    S.quiz.answers[q.id] = el.dataset.v;
    quizSave();
    document.querySelectorAll('.opt').forEach((o) => { const on = o === el; o.classList.toggle('sel', on); o.querySelector('.check').innerHTML = on ? ICON.check : ''; });
    refreshNextBtn();
    setTimeout(quizNext, 260);
  },
  'q-toggle': (el) => {
    const q = quizCurrent();
    let arr = (S.quiz.answers[q.id] || []).slice();
    const v = el.dataset.v;
    if (arr.includes(v)) arr = arr.filter((x) => x !== v);
    else if (q.exclusive && v === q.exclusive) arr = [v];
    else { arr = arr.filter((x) => x !== q.exclusive); arr.push(v); }
    S.quiz.answers[q.id] = arr;
    quizSave();
    const y = window.scrollY; render(); window.scrollTo(0, y);
  },
  'q-preset': (el) => { S.quiz.answers.semaines = Number(el.dataset.v); quizSave(); render(); },
  'q-next': () => quizNext(),
  'q-back': () => { if (S.quiz.i === 0) return go('#/bienvenue'); S.quiz.i--; quizSave(); render(); },
  'q-home': () => { quizSave(); go(S.answers ? '#/accueil' : '#/bienvenue'); },

  'toggle-ex': (el) => el.closest('.ex-card').classList.toggle('open'),
  set: (el) => {
    const iso = route().arg, i = el.dataset.i, k = Number(el.dataset.k);
    const p = S.progress[iso] || (S.progress[iso] = { sets: {} });
    p.sets = p.sets || {};
    const cur = p.sets[i] || 0;
    p.sets[i] = k < cur ? k : k + 1;
    store.set('progress', S.progress);
    el.parentElement.querySelectorAll('.set-btn').forEach((b, j) => b.classList.toggle('done', j < p.sets[i]));
    if (p.sets[i] > cur) startTimer(Number(el.dataset.rest));
    // passe automatiquement à l'exercice suivant quand toutes les séries sont faites
    const total = el.parentElement.children.length;
    if (p.sets[i] === total) {
      const card = el.closest('.ex-card');
      card.classList.remove('open');
      const next = card.parentElement.querySelector(`.ex-card[data-ex="${Number(i) + 1}"]`) || card.nextElementSibling;
      if (next && next.classList.contains('ex-card')) { next.classList.add('open'); next.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
  },
  'stop-timer': () => stopTimer(),
  'finish-session': (el) => {
    const iso = el.dataset.date;
    S.progress[iso] = { ...(S.progress[iso] || {}), done: true, at: Date.now() };
    store.set('progress', S.progress);
    stopTimer(); confetti();
    const st = computeStats();
    toast(st.streak > 1 ? `Séance validée ! Série de ${st.streak} 🔥` : 'Séance validée ! Bravo 🏆');
    setTimeout(() => go('#/accueil'), 900);
  },
  'undo-session': (el) => { const iso = el.dataset.date; if (S.progress[iso]) S.progress[iso].done = false; store.set('progress', S.progress); render(); },

  water: (el) => {
    const t = todayISO();
    const max = Math.round(nutritionTargets(S.answers).water / 0.25) + 4;
    S.water[t] = clamp((S.water[t] || 0) + Number(el.dataset.d), 0, max);
    store.set('water', S.water);
    const y = window.scrollY; render(); window.scrollTo(0, y);
    if (Number(el.dataset.d) > 0 && S.water[t] === Math.round(nutritionTargets(S.answers).water / 0.25)) { toast('Objectif hydratation atteint 💧'); confetti(); }
  },
  recipe: (el) => openRecipe(el.dataset.id, el.dataset.factor),
  swap: (el) => {
    const iso = el.dataset.date, slot = el.dataset.slot;
    S.swaps[iso] = S.swaps[iso] || {};
    S.swaps[iso][slot] = (S.swaps[iso][slot] || 0) + 1;
    store.set('swaps', S.swaps);
    const y = window.scrollY; render(); window.scrollTo(0, y);
  },
  'menu-day': (el) => { S.menuDay = Number(el.dataset.d); const y = window.scrollY; render(); window.scrollTo(0, y); },
  'more-recipes': () => { S.showAllRecipes = true; const y = window.scrollY; render(); window.scrollTo(0, y); },
  rfilter: (el) => { S.recipeFilter = el.dataset.k; S.showAllRecipes = false; const y = window.scrollY; render(); window.scrollTo(0, y); },
  shopping: (el) => {
    const menu = dailyMenu(S.answers, el.dataset.date, S.swaps[el.dataset.date]);
    openSheet(`<div class="sheet-handle"></div><div class="sheet-content"><h2 class="title-lg">🛒 Liste de courses</h2>
      <p class="muted mt-8">${cap(fmtDate(el.dataset.date))}</p>
      ${menu.items.map((m) => `<h3 class="title-md mt-24">${esc(m.recipe.name)}${m.factor !== 1 ? ` <span class="muted" style="font-size:13px">(×${String(m.factor).replace('.', ',')})</span>` : ''}</h3><ul class="ing mt-8">${m.recipe.ingredients.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`).join('')}
      <button class="btn btn-primary btn-block mt-24" data-action="close-sheet">Fermer</button></div>`);
  },

  'log-weight': () => {
    const v = parseFloat(($('#w-input').value || '').replace(',', '.'));
    if (!(v > 30 && v < 300)) return toast('Entre un poids valide');
    const t = todayISO();
    S.weights = S.weights.filter((x) => x.date !== t).concat({ date: t, kg: Math.round(v * 10) / 10 });
    store.set('weights', S.weights); toast('Pesée enregistrée ⚖️'); render();
  },
  'log-test': () => {
    const p = parseInt($('#t-pompes').value, 10), pl = parseInt($('#t-planche').value, 10);
    if (Number.isNaN(p) || Number.isNaN(pl)) return toast('Remplis les deux champs');
    S.tests.push({ date: todayISO(), pompes: p, planche: pl });
    store.set('tests', S.tests); toast('Test enregistré 🧪'); confetti(); render();
  },

  'notif-enable': () => Notif.enable(),
  'notif-toggle': async () => {
    if (S.notif.enabled && Notif.permission() === 'granted') { Notif.disable(); toast('Notifications désactivées'); render(); }
    else await Notif.enable();
  },
  'notif-test': async () => {
    if (Notif.permission() !== 'granted') { const ok = await Notif.enable(); if (!ok) return; }
    const msg = Notif.messageFor(todayISO());
    Notif.show(msg.title, msg.body);
  },
  ics: () => downloadICS(),
  'redo-quiz': () => {
    if (!confirm('Refaire le questionnaire ? Ton programme sera recréé (ton historique est conservé).')) return;
    S.quiz = { i: 0, answers: { ...S.answers } }; quizSave();
    S.answers = null; store.del('answers'); rebuildPlan(); go('#/quiz');
  },
  'restart-cycle': () => {
    S.quiz = { i: 0, answers: { ...S.answers, debut: 'aujourdhui' } }; quizSave();
    S.answers = null; store.del('answers'); rebuildPlan(); go('#/quiz');
  },
  reset: () => {
    if (!confirm('Tout effacer (profil, programme, progression) ?')) return;
    try { Object.keys(localStorage).filter((k) => k.startsWith('forge.')).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
    location.hash = '#/bienvenue'; location.reload();
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el, e); }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  const kind = el.dataset.input;
  if (!kind) return;
  if (kind === 'q') {
    const q = quizCurrent();
    let v = el.value;
    if (q.type === 'number') v = v.replace(',', '.').replace(/[^\d.]/g, '');
    S.quiz.answers[q.id] = v;
    quizSave(); refreshNextBtn();
  } else if (kind === 'slider') {
    const v = Number(el.value);
    S.quiz.answers.semaines = v; quizSave();
    $('#slider-val').innerHTML = `${v}<small>semaine${v > 1 ? 's' : ''}</small>`;
    $('#slider-end').textContent = sliderHint(v);
    document.querySelectorAll('[data-action="q-preset"]').forEach((c) => c.classList.toggle('chip-lime', Number(c.dataset.v) === v));
  }
});

document.addEventListener('change', (e) => {
  const el = e.target, kind = el.dataset.input;
  if (kind === 'notif-hour') {
    S.notif.hour = el.value; S.answers.notif_heure = el.value;
    store.set('notif', S.notif); store.set('answers', S.answers);
    Notif.sync(); toast(`Rappel programmé à ${el.value.replace(':', 'h')}`);
  } else if (kind === 'coach') {
    S.answers.coach = el.value; store.set('answers', S.answers); Notif.sync(); toast('Style du coach mis à jour'); render();
  } else if (kind === 'weeks') {
    S.answers.semaines = Number(el.value); store.set('answers', S.answers); rebuildPlan(); Notif.sync(); toast(`Programme sur ${el.value} semaines ✅`); render();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && route().name === 'quiz' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); quizNext(); }
  if (e.key === 'Escape') closeSheet();
});

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') Notif.check(); });

/* ==========================================================================
   DÉMARRAGE
   ========================================================================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(() => {
      if (S.answers) { Notif.sync(); Notif.check(); }
    }).catch((e) => console.warn('Service worker non enregistré', e));
  });
}
render();
