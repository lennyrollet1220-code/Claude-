/* ==========================================================================
   FORGE — Moteur : génération du programme, objectifs et nutrition
   Tout est déterministe : mêmes réponses => même programme.
   ========================================================================== */

const DOW = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const DOW_LABEL = { lun: 'Lundi', mar: 'Mardi', mer: 'Mercredi', jeu: 'Jeudi', ven: 'Vendredi', sam: 'Samedi', dim: 'Dimanche' };
const WEEK_ORDER = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
const ALL_EQUIP = ['halteres', 'barre', 'banc', 'elastiques', 'traction', 'kettlebell', 'corde', 'machines'];

/* ---------- utilitaires ---------- */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/* ---------- lecture du profil ---------- */
function profileFacts(a) {
  const injuries = (a.blessures || []).filter((x) => x !== 'aucune');
  let equip;
  if (a.lieu === 'salle' || a.lieu === 'mixte') equip = ALL_EQUIP.slice();
  else equip = (a.materiel || []).filter((x) => x !== 'aucun');

  const lvl = Number(a.niveau) || 1;
  const pushLvl = { '0': 1, '1-5': 1, '6-15': 2, '16-30': 3, '30+': 3 }[a.pompes] || lvl;
  let pullLvl = lvl;
  if (a.tractions === '0') pullLvl = Math.min(lvl, 2);
  else if (a.tractions === '1-3') pullLvl = 2;
  else if (a.tractions === '4-8' || a.tractions === '9+') pullLvl = 3;

  let days = (a.jours || []).slice().sort((x, y) => WEEK_ORDER.indexOf(x) - WEEK_ORDER.indexOf(y));
  if (!days.length) days = ['lun', 'mer', 'ven'];

  return {
    injuries, equip, lvl, days,
    catLvl: { push: Math.min(pushLvl, lvl + 1), pull: pullLvl, legs: lvl, glute: lvl, core: lvl, cardio: lvl, mobility: 3 },
    goal: a.objectif || 'sante',
    duree: Number(a.duree) || 45,
    weeks: clamp(Number(a.semaines) || 4, 1, 52),
    zones: (a.zones || []).filter((z) => z !== 'fullbody'),
    likes: a.activites || [],
    hatesCardio: a.cardio_avis === 'deteste',
    circuitStyle: a.style_seance === 'circuit',
  };
}

function exerciseAvailable(ex, f, maxLvl) {
  if (ex.lvl > maxLvl) return false;
  if (ex.avoid.some((i) => f.injuries.includes(i))) return false;
  if (!ex.equip.length) return true;
  if (Array.isArray(ex.equip[0])) return ex.equip.some((alt) => alt.every((e) => f.equip.includes(e)));
  return ex.equip.every((e) => f.equip.includes(e));
}

const isSided = (ex) => ex.tips.some((t) => /par (jambe|côté)/.test(t));

/* ---------- modèles de séances ---------- */
const SESSION_TYPES = {
  FB_A:     { title: 'Full body A', emoji: '⚡', img: PHOTOS.heroAlt, slots: ['legs', 'push', 'pull', 'glute', 'core', 'push', 'pull', 'core'] },
  FB_B:     { title: 'Full body B', emoji: '💥', img: PHOTOS.deadlift, slots: ['glute', 'pull', 'push', 'legs', 'core', 'pull', 'legs', 'core'] },
  FB_C:     { title: 'Full body C', emoji: '🔥', img: PHOTOS.kettlebell, slots: ['legs', 'push:epaules', 'pull', 'glute', 'core', 'push', 'pull:bras', 'core'] },
  HAUT:     { title: 'Haut du corps', emoji: '💪', img: PHOTOS.bench, slots: ['push:pecs', 'pull:dos', 'push:epaules', 'pull:dos', 'push:bras', 'pull:bras', 'core', 'push'] },
  BAS:      { title: 'Bas du corps', emoji: '🦵', img: PHOTOS.squat, slots: ['legs', 'glute', 'legs', 'glute', 'core', 'legs', 'glute', 'core'] },
  PUSH:     { title: 'Push — pecs, épaules, triceps', emoji: '🫸', img: PHOTOS.pushupDb, slots: ['push:pecs', 'push:epaules', 'push:pecs', 'push:bras', 'core', 'push:epaules', 'push', 'core'] },
  PULL:     { title: 'Pull — dos & biceps', emoji: '🧗', img: PHOTOS.backBW, slots: ['pull:dos', 'pull:dos', 'pull:bras', 'pull:epaules', 'core', 'pull', 'pull:bras', 'core'] },
  JAMBES:   { title: 'Jambes & fessiers', emoji: '🍑', img: PHOTOS.heroAlt, slots: ['legs', 'glute', 'legs', 'glute', 'legs', 'core', 'glute', 'core'] },
  CIRCUIT:  { title: 'Circuit tonification', emoji: '🌀', img: PHOTOS.group, circuit: true, slots: ['legs', 'push', 'glute', 'pull', 'core', 'cardio', 'legs', 'core'] },
  HIIT:     { title: 'HIIT brûle-graisse', emoji: '🔥', img: PHOTOS.ropes, hiit: true, slots: ['cardio', 'legs', 'cardio', 'push', 'cardio', 'core', 'glute', 'cardio'] },
  CARDIO:   { title: 'Cardio', emoji: '🏃', img: PHOTOS.run, cardio: 'interval' },
  CARDIO_L: { title: 'Sortie longue', emoji: '🌄', img: PHOTOS.runSunset, cardio: 'long' },
  MOBILITE: { title: 'Mobilité & souplesse', emoji: '🧘', img: PHOTOS.yoga, mobility: true, slots: ['mobility', 'mobility', 'mobility', 'mobility', 'mobility', 'core', 'mobility', 'mobility'] },
};

const LAYOUTS = {
  perte_poids: [['CIRCUIT'], ['CIRCUIT', 'HIIT'], ['FB_A', 'HIIT', 'FB_B'], ['FB_A', 'HIIT', 'FB_B', 'CARDIO'], ['FB_A', 'HIIT', 'FB_B', 'CARDIO', 'CIRCUIT'], ['HAUT', 'HIIT', 'BAS', 'CARDIO', 'CIRCUIT', 'MOBILITE'], ['HAUT', 'HIIT', 'BAS', 'CARDIO', 'CIRCUIT', 'CARDIO_L', 'MOBILITE']],
  muscle:      [['FB_A'], ['FB_A', 'FB_B'], ['FB_A', 'FB_B', 'FB_C'], ['HAUT', 'BAS', 'HAUT', 'BAS'], ['PUSH', 'PULL', 'JAMBES', 'HAUT', 'BAS'], ['PUSH', 'PULL', 'JAMBES', 'PUSH', 'PULL', 'JAMBES'], ['PUSH', 'PULL', 'JAMBES', 'PUSH', 'PULL', 'JAMBES', 'MOBILITE']],
  force:       [['FB_A'], ['FB_A', 'FB_B'], ['FB_A', 'FB_B', 'FB_C'], ['HAUT', 'BAS', 'HAUT', 'BAS'], ['HAUT', 'BAS', 'MOBILITE', 'HAUT', 'BAS'], ['PUSH', 'PULL', 'JAMBES', 'PUSH', 'PULL', 'JAMBES'], ['PUSH', 'PULL', 'JAMBES', 'PUSH', 'PULL', 'JAMBES', 'MOBILITE']],
  tonifier:    [['CIRCUIT'], ['CIRCUIT', 'FB_B'], ['FB_A', 'CIRCUIT', 'FB_B'], ['HAUT', 'BAS', 'CIRCUIT', 'HIIT'], ['HAUT', 'BAS', 'HIIT', 'FB_A', 'MOBILITE'], ['HAUT', 'BAS', 'HIIT', 'HAUT', 'BAS', 'MOBILITE'], ['HAUT', 'BAS', 'HIIT', 'HAUT', 'BAS', 'CARDIO', 'MOBILITE']],
  endurance:   [['CARDIO'], ['CARDIO', 'FB_A'], ['CARDIO', 'FB_A', 'CARDIO_L'], ['CARDIO', 'FB_A', 'HIIT', 'CARDIO_L'], ['CARDIO', 'FB_A', 'HIIT', 'FB_B', 'CARDIO_L'], ['CARDIO', 'FB_A', 'HIIT', 'FB_B', 'MOBILITE', 'CARDIO_L'], ['CARDIO', 'FB_A', 'HIIT', 'FB_B', 'MOBILITE', 'CARDIO', 'CARDIO_L']],
  sante:       [['FB_A'], ['FB_A', 'CARDIO'], ['FB_A', 'CARDIO', 'MOBILITE'], ['FB_A', 'CARDIO', 'FB_B', 'MOBILITE'], ['FB_A', 'CARDIO', 'FB_B', 'MOBILITE', 'CARDIO_L'], ['FB_A', 'CARDIO', 'FB_B', 'MOBILITE', 'CIRCUIT', 'CARDIO_L'], ['FB_A', 'CARDIO', 'FB_B', 'MOBILITE', 'CIRCUIT', 'CARDIO_L', 'MOBILITE']],
  souplesse:   [['MOBILITE'], ['MOBILITE', 'FB_A'], ['MOBILITE', 'FB_A', 'MOBILITE'], ['MOBILITE', 'FB_A', 'MOBILITE', 'CARDIO'], ['MOBILITE', 'FB_A', 'MOBILITE', 'FB_B', 'MOBILITE'], ['MOBILITE', 'FB_A', 'MOBILITE', 'FB_B', 'MOBILITE', 'CARDIO'], ['MOBILITE', 'FB_A', 'MOBILITE', 'FB_B', 'MOBILITE', 'CARDIO', 'MOBILITE']],
};

const PRESC = {
  muscle:      { sets: 3, reps: [8, 12], rest: 90 },
  force:       { sets: 4, reps: [5, 6], rest: 150 },
  perte_poids: { sets: 3, reps: [12, 15], rest: 45 },
  tonifier:    { sets: 3, reps: [12, 15], rest: 45 },
  endurance:   { sets: 3, reps: [15, 20], rest: 30 },
  sante:       { sets: 2, reps: [10, 12], rest: 60 },
  souplesse:   { sets: 2, reps: [10, 12], rest: 60 },
};

const EX_COUNT = { 20: 4, 30: 5, 45: 6, 60: 7, 90: 8 };

/* ---------- semaine → phase ---------- */
function weekPhase(w, total) {
  if (total <= 2) return { name: w === 0 ? 'Démarrage' : 'Montée en puissance', deload: false, step: w };
  if (w === total - 1) return { name: 'Semaine finale 🏁', deload: false, step: 1, final: true };
  const inBlock = w % 4;
  const lastBlockWeek = inBlock === 3 && w < total - 1;
  if (lastBlockWeek) return { name: 'Récupération active', deload: true, step: 0 };
  return { name: ['Fondations', 'Progression', 'Intensification'][inBlock], deload: false, step: inBlock };
}

/* ---------- choix d'exercices ---------- */
function pickExercise(slot, f, used, rand, block) {
  const [cat, zone] = slot.split(':');
  const maxLvl = clamp((f.catLvl[cat] || f.lvl) + Math.floor(block / 2), 1, 3);
  let pool = EXERCISES.filter((e) => e.cat === cat && !used.has(e.id) && exerciseAvailable(e, f, maxLvl));
  if (!pool.length) pool = EXERCISES.filter((e) => e.cat === cat && !used.has(e.id) && exerciseAvailable(e, f, 3));
  if (!pool.length) return null;
  const scored = pool.map((e) => {
    let s = rand() * 3;
    if (zone && e.zones.includes(zone)) s += 6;
    if (f.zones.some((z) => e.zones.includes(z))) s += 2.5;
    s += 2 - Math.abs(maxLvl - e.lvl) * 2.5;
    if (e.fallback) s -= 6; // seulement si rien d'autre ne convient
    if (e.equip.length) s += 1.2; // favorise le matériel dispo
    return { e, s };
  }).sort((x, y) => y.s - x.s);
  return scored[0].e;
}

/** Ajoute un slot ciblé sur une zone prioritaire de l'utilisateur. */
function focusSlot(zone) {
  return { pecs: 'push:pecs', epaules: 'push:epaules', bras: 'pull:bras', dos: 'pull:dos', abdos: 'core', fessiers: 'glute', jambes: 'legs' }[zone];
}

function prescribe(ex, f, phase, block, mode) {
  const p = PRESC[f.goal] || PRESC.sante;
  let sets = p.sets + (f.lvl === 3 && (f.goal === 'muscle' || f.goal === 'force') ? 1 : 0) - (f.lvl === 1 && p.sets > 3 ? 1 : 0);
  if (phase.step === 2) sets += 1;
  if (phase.deload) sets = Math.max(2, sets - 1);
  sets = clamp(sets, 2, 5);

  if (ex.unit === 'sec') {
    let base = { 1: 20, 2: 30, 3: 40 }[f.lvl];
    if (ex.id === 'planche') base = Math.max(base, f.plankBase || 0);
    if (ex.cat === 'mobility') base = 30;
    let sec = base + block * 10 + (phase.deload ? 0 : phase.step * 5);
    sec = clamp(sec, 15, ex.cat === 'mobility' ? 60 : 120);
    return { sets, value: sec, unit: 'sec', rest: Math.min(p.rest, 60) };
  }
  const bodyweight = !ex.equip.length;
  let [lo, hi] = p.reps;
  if (bodyweight && (f.goal === 'force' || f.goal === 'muscle')) { lo += 2; hi += 3; }
  const bump = phase.deload ? 0 : phase.step + (bodyweight ? block * 2 : 0);
  lo = clamp(lo + bump, 4, 25); hi = clamp(hi + bump, lo, 30);
  if (ex.cat === 'mobility') { lo = 6; hi = 8; }
  return { sets, value: lo === hi ? `${lo}` : `${lo}-${hi}`, unit: 'reps', rest: p.rest, sided: isSided(ex), loadTip: !bodyweight && block > 0 && !phase.deload };
}

/* ---------- séances cardio ---------- */
function cardioModality(f, a) {
  const bad = f.injuries.includes('genoux') || f.injuries.includes('chevilles');
  if (f.likes.includes('natation')) return 'natation';
  if (f.likes.includes('course') && !bad) return 'course';
  if (f.likes.includes('velo') || (bad && f.equip.includes('machines'))) return 'velo';
  if (f.likes.includes('boxe')) return 'boxe';
  if (f.equip.includes('corde') && !bad) return 'corde';
  if (bad || Number(a.cardio) <= 1) return 'marche';
  return 'course';
}

function buildCardio(kind, f, a, w, phase, block) {
  const mod = cardioModality(f, a);
  const cardioLvl = Number(a.cardio) || 1;
  const dur = f.duree;
  const prog = phase.deload ? 0 : w;
  const items = [];
  const M = {
    course: { name: 'Course à pied', img: PHOTOS.run },
    velo: { name: 'Vélo / vélo d\'appartement', img: PHOTOS.gymWhite },
    natation: { name: 'Natation', img: PHOTOS.runSunset },
    marche: { name: 'Marche rapide', img: PHOTOS.stairs },
    boxe: { name: 'Boxe (shadow / sac)', img: PHOTOS.motivation },
    corde: { name: 'Corde à sauter', img: PHOTOS.outdoor },
  }[mod];

  if (kind === 'long') {
    const minutes = clamp(Math.round(dur * 0.7 + prog * 3), 20, dur + 30);
    items.push({ cardio: true, name: `${M.name} — endurance`, img: M.img,
      detail: `${minutes} min à allure facile (tu dois pouvoir parler). Zone 2 : c'est là que ton cœur se muscle.` });
  } else if (mod === 'course' && cardioLvl <= 2) {
    const reps = clamp(6 + prog, 6, 12);
    const run = clamp(1 + Math.floor(prog / 2), 1, 5);
    items.push({ cardio: true, name: 'Course — alternance', img: M.img,
      detail: `${reps} × (${run} min de course légère / 1 min 30 de marche). Objectif : courir 20-30 min sans t'arrêter d'ici la fin du programme.` });
  } else if (mod === 'marche') {
    const minutes = clamp(20 + prog * 3, 20, dur);
    items.push({ cardio: true, name: 'Marche rapide', img: M.img,
      detail: `${minutes} min de marche rapide, dont ${Math.min(5 + prog, 10)} × 1 min très rapide (ou en côte).` });
  } else if (mod === 'boxe') {
    const rounds = clamp(5 + Math.floor(prog / 2), 5, 10);
    items.push({ cardio: true, name: 'Rounds de boxe', img: M.img,
      detail: `${rounds} rounds de 2 min (shadow boxing ou sac), 45 s de repos. Enchaînements direct-crochet-uppercut, garde haute !` });
  } else if (mod === 'corde') {
    const rounds = clamp(8 + prog, 8, 15);
    items.push({ cardio: true, name: 'Corde à sauter', img: M.img,
      detail: `${rounds} × (45 s de corde / 30 s de repos). Petits sauts sur l'avant du pied.` });
  } else {
    const reps = clamp(6 + Math.floor(prog / 2), 6, 10);
    const work = mod === 'natation' ? '1 longueur rapide / 1 longueur souple' : '1 min rapide / 1 min 30 lent';
    items.push({ cardio: true, name: `${M.name} — fractionné`, img: M.img,
      detail: `10 min d'échauffement, puis ${reps} × (${work}), 5 min retour au calme.` });
  }
  return { items, modality: mod };
}

/* ---------- échauffement / retour au calme ---------- */
function warmup(f, type) {
  const knees = f.injuries.includes('genoux') || f.injuries.includes('chevilles');
  const list = ['Rotations des épaules, poignets et hanches — 1 min',
    knees ? 'Marche sur place dynamique — 2 min' : 'Jumping jacks légers — 1 min',
    'Squats lents + ouverture de hanche — 10 reps',
    'Chat-vache + rotations thoraciques — 1 min'];
  if (type === 'HAUT' || type === 'PUSH' || type === 'PULL') list.push('1 série légère du 1er exercice — 12 reps');
  return list;
}
const COOLDOWN = ['Étirement ischios — 30 s', 'Étirement fléchisseurs de hanche — 30 s/côté', 'Étirement pectoraux — 30 s/côté', 'Posture de l\'enfant + respiration lente — 1 min'];

/* ---------- construction d'une séance ---------- */
function buildSession(typeKey, f, a, w, phase, dayIdx, seedBase) {
  const T = SESSION_TYPES[typeKey];
  const block = Math.floor(w / 4);
  // variété : les exercices changent toutes les 2 semaines
  const rand = rng(seedBase + hashStr(typeKey) + Math.floor(w / 2) * 7919 + (typeKey.startsWith('FB') ? 0 : dayIdx * 31));
  const session = { type: typeKey, title: T.title, emoji: T.emoji, img: T.img, blocks: [], warmup: warmup(f, typeKey), cooldown: COOLDOWN };

  if (T.cardio) {
    const c = buildCardio(T.cardio, f, a, w, phase, block);
    session.blocks = c.items;
    if (c.modality === 'natation' || c.modality === 'velo') session.img = c.items[0].img;
    session.format = 'cardio';
    session.title = T.cardio === 'long' ? 'Sortie longue' : `Cardio · ${c.items[0].name.split(' —')[0]}`;
    // petit finisher gainage
    const core = pickExercise('core', f, new Set(), rand, block);
    if (core && f.duree >= 30) {
      session.blocks.push({ exId: core.id, ...prescribe(core, f, phase, block), sets: 2, finisher: true });
    }
    session.estMin = f.duree;
    return session;
  }

  const count = EX_COUNT[f.duree] || 6;
  let slots = T.slots.slice(0, count);
  // insertion d'une zone prioritaire dans les séances de renfo
  if (!T.hiit && !T.mobility && f.zones.length) {
    const fz = focusSlot(f.zones[(w + dayIdx) % f.zones.length]);
    // remplace le dernier créneau « bonus » pour garder l'équilibre de la séance
    if (fz) slots[slots.length >= 5 ? slots.length - 1 : Math.min(slots.length - 1, 3)] = fz;
  }
  const used = new Set();
  for (const slot of slots) {
    // repli si aucun exercice compatible (blessure, matériel) pour ce créneau
    const ex = pickExercise(slot, f, used, rand, block)
      || (T.mobility ? null : pickExercise('core', f, used, rand, block))
      || (T.mobility ? null : pickExercise('glute', f, used, rand, block));
    if (!ex) continue;
    used.add(ex.id);
    if (T.hiit) {
      const work = { 1: 30, 2: 40, 3: 45 }[f.lvl] + (phase.deload ? -10 : Math.min(phase.step * 5, 10));
      session.blocks.push({ exId: ex.id, sets: 1, value: work, unit: 'sec', rest: { 1: 30, 2: 20, 3: 15 }[f.lvl] });
    } else {
      session.blocks.push({ exId: ex.id, ...prescribe(ex, f, phase, block) });
    }
  }

  if (T.hiit) {
    session.format = 'hiit';
    session.rounds = clamp(Math.round((f.duree - 10) / (session.blocks.length * 1.1)), 2, 5) - (phase.deload ? 1 : 0);
    session.roundRest = 60;
    session.estMin = f.duree;
  } else if (T.circuit || (f.circuitStyle && !T.mobility)) {
    session.format = 'circuit';
    session.rounds = session.blocks[0] ? session.blocks[0].sets : 3;
    session.roundRest = 90;
    session.blocks.forEach((b) => { b.rest = 15; });
    session.estMin = f.duree;
  } else {
    session.format = 'series';
    const work = session.blocks.reduce((s, b) => s + b.sets * ((b.unit === 'sec' ? b.value : 40) + b.rest), 0);
    session.estMin = Math.round(work / 60 + 10);
  }
  if (T.mobility) session.format = 'flow';
  return session;
}

/* ---------- programme complet ---------- */
function programStart(a, createdAt) {
  const base = createdAt ? parseISO(createdAt) : new Date();
  base.setHours(0, 0, 0, 0);
  if (a.debut === 'demain') return addDays(base, 1);
  if (a.debut === 'lundi') {
    const dow = base.getDay();
    const delta = dow === 1 ? 7 : (8 - dow) % 7;
    return addDays(base, delta);
  }
  return base;
}

function generatePlan(a, createdAt) {
  const f = profileFacts(a);
  f.plankBase = { '<20': 15, '20-45': 25, '45-90': 45, '90+': 60 }[a.gainage] || 20;
  const goal = LAYOUTS[f.goal] ? f.goal : 'sante';
  let layout = LAYOUTS[goal][clamp(f.days.length, 1, 7) - 1].slice();
  if (f.hatesCardio && goal !== 'endurance') layout = layout.map((t) => (t === 'CARDIO' ? 'CIRCUIT' : t === 'CARDIO_L' ? 'MOBILITE' : t));

  // la sortie longue de préférence le week-end
  const longIdx = layout.indexOf('CARDIO_L');
  const weekendIdx = f.days.findIndex((d) => d === 'sam' || d === 'dim');
  if (longIdx >= 0 && weekendIdx >= 0 && longIdx !== weekendIdx) {
    [layout[longIdx], layout[weekendIdx]] = [layout[weekendIdx], layout[longIdx]];
  }

  const start = programStart(a, createdAt);
  const seedBase = hashStr(JSON.stringify([a.prenom, a.objectif, a.niveau, a.lieu, a.materiel, a.blessures, a.duree]));
  const weeks = [];
  let dayCursor = start;
  // On aligne chaque « semaine » sur 7 jours glissants depuis la date de début.
  for (let w = 0; w < f.weeks; w++) {
    const phase = weekPhase(w, f.weeks);
    const days = [];
    let sessionCount = 0;
    for (let i = 0; i < 7; i++) {
      const date = addDays(dayCursor, i);
      const dow = DOW[date.getDay()];
      const idx = f.days.indexOf(dow);
      let session = null;
      if (idx >= 0) {
        session = buildSession(layout[idx % layout.length], f, a, w, phase, idx, seedBase);
        sessionCount++;
      }
      days.push({ date: isoDate(date), dow, session });
    }
    weeks.push({ index: w, phase, days, sessionCount });
    dayCursor = addDays(dayCursor, 7);
  }
  return { start: isoDate(start), end: isoDate(addDays(start, f.weeks * 7 - 1)), weeks, facts: f };
}

function findDay(plan, iso) {
  for (const w of plan.weeks) for (const d of w.days) if (d.date === iso) return { week: w, day: d };
  return null;
}

/* ---------- nutrition ---------- */
function nutritionTargets(a) {
  const w = Number(a.poids) || 70, h = Number(a.taille) || 170, age = Number(a.age) || 30;
  const sexK = a.sexe === 'homme' ? 5 : a.sexe === 'femme' ? -161 : -78;
  const bmr = 10 * w + 6.25 * h - 5 * age + sexK;
  const nDays = (a.jours || []).length || 3;
  const base = { sedentaire: 1.3, debout: 1.45, physique: 1.6 }[a.activite] || 1.35;
  const factor = Math.min(1.95, base + 0.03 * nDays * ((Number(a.duree) || 45) / 45));
  const tdee = bmr * factor;
  const minor = age < 18;
  let adj = { perte_poids: -0.18, muscle: 0.1, force: 0.05, tonifier: -0.08, endurance: 0, sante: 0, souplesse: 0 }[a.objectif] || 0;
  if (minor && adj < -0.1) adj = -0.1;
  let kcal = tdee * (1 + adj);
  const floor = a.sexe === 'homme' ? 1600 : 1400;
  kcal = Math.max(kcal, floor, bmr * 1.05);
  kcal = Math.round(kcal / 10) * 10;
  const protPerKg = { muscle: 1.8, force: 1.8, perte_poids: 1.8, tonifier: 1.6, endurance: 1.4 }[a.objectif] || 1.3;
  const p = Math.round(w * protPerKg);
  const fat = Math.round(Math.max(w * 0.9, (kcal * 0.25) / 9));
  const c = Math.max(80, Math.round((kcal - p * 4 - fat * 9) / 4));
  const water = Math.round((w * 0.035 + 0.5) * 10) / 10;
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, p, c, f: fat, water, minor, adj };
}

function dietAllows(recipe, a) {
  const rank = { vegan: 0, vege: 1, pesc: 2, omni: 3 };
  const userRank = { vegan: 0, vege: 1, pesc: 2, omni: 3, halal: 3 }[a.regime || 'omni'];
  if (rank[recipe.diet] > userRank) return false;
  const allergies = (a.allergies || []).filter((x) => x !== 'aucune');
  if (recipe.contains.some((c) => allergies.includes(c))) return false;
  const hated = (a.deteste || '').toLowerCase().split(/[,;\n]+/).map((s) => s.trim()).filter((s) => s.length > 2);
  const text = (recipe.name + ' ' + recipe.ingredients.join(' ')).toLowerCase();
  if (hated.some((h) => text.includes(h))) return false;
  const maxTime = { 10: 12, 20: 22, 40: 45, 60: 999 }[a.cuisine] || 999;
  if (recipe.time > maxTime && recipe.type !== 'gouter') return false;
  return true;
}

function recipesFor(a, type) {
  let list = RECIPES.filter((r) => r.type === type && dietAllows(r, a));
  if (!list.length) list = RECIPES.filter((r) => r.type === type && dietAllows(r, { ...a, cuisine: 60, deteste: '' }));
  // dernier recours : un goûter complet fait office de petit-déjeuner
  if (!list.length && type === 'petitdej') list = RECIPES.filter((r) => r.type === 'gouter' && dietAllows(r, { ...a, cuisine: 60, deteste: '' }));
  return list;
}

/** Menu du jour (déterministe par date). swaps = { slot: offset } pour « autre idée ». */
function dailyMenu(a, iso, swaps = {}) {
  const t = nutritionTargets(a);
  const meals = Number(a.repas) || 3;
  const slots = [];
  if (meals >= 3 || meals === 2) slots.push(meals === 2 ? null : 'petitdej');
  slots.push('dejeuner');
  if (meals >= 4) slots.push('gouter');
  slots.push('diner');
  if (meals >= 5) slots.push('gouter2');
  const clean = slots.filter(Boolean);
  const seed = hashStr(iso + (a.prenom || ''));
  const items = clean.map((slot, i) => {
    const type = slot === 'gouter2' ? 'gouter' : slot;
    let pool = recipesFor(a, type);
    if (type === 'gouter' && a.gout_gouter && a.gout_gouter !== 'both') {
      const salty = ['houmous-crudites', 'toast-oeuf-dur'];
      const filtered = pool.filter((r) => (a.gout_gouter === 'sale') === salty.includes(r.id));
      if (filtered.length) pool = filtered;
    }
    const off = (swaps[slot] || 0) + (slot === 'gouter2' ? 3 : 0);
    const r = pool.length ? pool[(seed + i * 97 + off) % pool.length] : null;
    return { slot, recipe: r };
  }).filter((x) => x.recipe);
  const total = items.reduce((s, x) => s + x.recipe.kcal, 0) || 1;
  const factor = clamp(t.kcal / total, 0.75, 1.7);
  items.forEach((x) => { x.factor = x.recipe.type === 'gouter' ? 1 : Math.round(factor * 10) / 10; });
  // les goûters ne sont pas multipliés : on répartit l'écart sur les repas
  const snackKcal = items.filter((x) => x.recipe.type === 'gouter').reduce((s, x) => s + x.recipe.kcal, 0);
  const mealKcal = items.filter((x) => x.recipe.type !== 'gouter').reduce((s, x) => s + x.recipe.kcal, 0) || 1;
  const mf = clamp((t.kcal - snackKcal) / mealKcal, 0.7, 1.8);
  items.forEach((x) => { if (x.recipe.type !== 'gouter') x.factor = Math.round(mf * 10) / 10; });
  return { items, targets: t };
}

/* ---------- objectifs ---------- */
const ARCHETYPES = {
  perte_poids: { name: 'Brûleur', emoji: '🔥', line: 'Objectif : perdre du gras en gardant ton muscle, sans te priver.' },
  muscle: { name: 'Bâtisseur', emoji: '🏗️', line: 'Objectif : construire du muscle, semaine après semaine.' },
  force: { name: 'Titan', emoji: '🦾', line: 'Objectif : devenir plus fort sur les mouvements de base.' },
  tonifier: { name: 'Sculpteur', emoji: '✨', line: 'Objectif : un corps plus ferme, dessiné et tonique.' },
  endurance: { name: 'Marathonien', emoji: '🏃', line: 'Objectif : plus de souffle, plus loin, plus longtemps.' },
  sante: { name: 'Équilibré', emoji: '🌿', line: 'Objectif : plus d\'énergie, une meilleure santé et de bonnes habitudes.' },
  souplesse: { name: 'Félin', emoji: '🐆', line: 'Objectif : un corps mobile, souple et sans raideurs.' },
};

function computeGoals(a, plan) {
  const weeks = plan.weeks.length;
  const w = Number(a.poids) || 70;
  const hM = (Number(a.taille) || 170) / 100;
  const bmi = w / (hM * hM);
  const goals = [];

  // Poids
  let target = Number(a.poids_cible) || null;
  let rate = 0;
  if (a.objectif === 'perte_poids' || a.objectif === 'tonifier') {
    rate = -Math.min(0.75, w * (a.objectif === 'perte_poids' ? 0.006 : 0.003));
    if (!target) target = Math.round(Math.max(18.5 * hM * hM, Math.min(w - 2, 24.5 * hM * hM)) * 10) / 10;
  } else if (a.objectif === 'muscle') {
    rate = w * 0.0025;
    if (!target) target = Math.round((w + rate * Math.max(weeks, 8)) * 10) / 10;
  }
  if (rate !== 0 && target) {
    const raw = w + rate * weeks;
    const projected = Math.round((rate < 0 ? Math.max(raw, target) : Math.min(raw, target)) * 10) / 10;
    const weeksToTarget = Math.ceil(Math.abs(target - w) / Math.abs(rate));
    goals.push({ id: 'poids', icon: '⚖️', title: 'Poids', from: `${w} kg`, to: `${projected} kg`,
      detail: projected === target ? `Objectif ${String(target).replace('.', ',')} kg atteignable dans le temps du programme.` : `Objectif final ${target} kg : environ ${weeksToTarget} semaines au rythme sain de ${Math.abs(rate).toFixed(2).replace('.', ',')} kg/sem.` });
  }

  // Pompes
  const pCur = { '0': 0, '1-5': 3, '6-15': 10, '16-30': 22, '30+': 35 }[a.pompes] ?? 5;
  const pTo = pCur === 0 ? (weeks >= 3 ? 5 : 2) : Math.round(Math.min(pCur * 2.5 + 5, pCur + Math.max(3, weeks * 1.5)));
  goals.push({ id: 'pompes', icon: '🫸', title: 'Pompes d\'affilée', from: `${pCur}`, to: `${pTo}`, detail: pCur === 0 ? 'Commence sur les genoux, tu passeras aux classiques.' : 'Test à refaire à la fin de chaque bloc.' });

  // Gainage
  const gCur = { '<20': 15, '20-45': 30, '45-90': 60, '90+': 100 }[a.gainage] ?? 20;
  const gTo = Math.round(Math.min(gCur + 8 * weeks, Math.max(gCur * 3, 60), 240) / 5) * 5;
  goals.push({ id: 'gainage', icon: '🧱', title: 'Planche', from: `${gCur} s`, to: `${gTo} s`, detail: 'Un gainage solide protège ton dos dans tous les exercices.' });

  // Tractions
  if (plan.facts.equip.includes('traction')) {
    const tCur = { '0': 0, '1-3': 2, '4-8': 6, '9+': 10 }[a.tractions] ?? 0;
    const tTo = tCur === 0 ? (weeks >= 4 ? 1 : 0) : tCur + Math.max(1, Math.round(weeks / 2));
    if (tTo > 0) goals.push({ id: 'tractions', icon: '🧗', title: 'Tractions', from: `${tCur}`, to: `${tTo}`, detail: tCur === 0 ? 'Ta toute première traction : grâce aux négatives !' : 'Ajoute une rep toutes les 2 semaines.' });
  }

  // Cardio
  const cardioLvl = Number(a.cardio) || 1;
  const cardioGoal = { 1: '15 min de course (ou marche rapide) sans pause', 2: '30 min de course continue', 3: '5 km en moins de 30 min', 4: '10 km à allure confortable' }[cardioLvl];
  goals.push({ id: 'cardio', icon: '🫀', title: 'Cardio', from: { 1: 'Essoufflé vite', 2: '~10 min', 3: '~30 min', 4: '1 h+' }[cardioLvl], to: cardioGoal, detail: 'Ton cœur s\'adapte en 3-4 semaines : tu vas le sentir.' });

  // Habitudes
  const total = plan.weeks.reduce((s, x) => s + x.sessionCount, 0);
  goals.push({ id: 'seances', icon: '📅', title: 'Séances réalisées', from: '0', to: `${Math.ceil(total * 0.9)} / ${total}`, detail: 'Vise 90 % : la régularité bat l\'intensité.' });
  goals.push({ id: 'pas', icon: '👟', title: 'Pas par jour', from: a.activite === 'sedentaire' ? '~4 000' : '~7 000', to: a.activite === 'sedentaire' ? '8 000' : '10 000', detail: 'Le meilleur brûle-graisse caché : la marche.' });
  const t = nutritionTargets(a);
  goals.push({ id: 'eau', icon: '💧', title: 'Eau', from: { '<1': '< 1 L', '1-1.5': '1-1,5 L', '1.5-2': '1,5-2 L', '2+': '2 L+' }[a.eau] || '?', to: `${t.water} L / jour`, detail: '+0,5 L les jours d\'entraînement.' });
  goals.push({ id: 'sommeil', icon: '😴', title: 'Sommeil', from: { '<6': '< 6 h', '6-7': '6-7 h', '7-8': '7-8 h', '8+': '8 h+' }[a.sommeil] || '?', to: '7 h 30 +', detail: 'Le muscle se construit pendant que tu dors.' });

  // Jalons
  const milestones = [];
  milestones.push({ week: 1, text: 'Créer l\'habitude : faire 100 % des séances de la semaine 1.' });
  if (weeks >= 3) milestones.push({ week: Math.max(2, Math.round(weeks / 3)), text: 'Premières sensations : plus d\'énergie, meilleur sommeil, technique propre.' });
  if (weeks >= 4) milestones.push({ week: Math.round(weeks * 2 / 3), text: 'Progrès visibles : charges ou répétitions en hausse, vêtements qui tombent mieux.' });
  milestones.push({ week: weeks, text: 'Test final : refais tes tests (pompes, planche, cardio) et compare !' });

  return { archetype: ARCHETYPES[a.objectif] || ARCHETYPES.sante, bmi: Math.round(bmi * 10) / 10, goals, milestones };
}

/* ---------- export calendrier (.ics) ---------- */
function buildICS(a, plan, message) {
  const [hh, mm] = (a.notif_heure || '18:00').split(':');
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const esc = (s) => s.replace(/[,;\\]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FORGE//Coach perso//FR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:FORGE — Mes séances'];
  plan.weeks.forEach((w) => w.days.forEach((d) => {
    if (!d.session) return;
    const ds = d.date.replace(/-/g, '');
    const startH = `${ds}T${pad(hh)}${pad(mm)}00`;
    const endDate = new Date(parseISO(d.date)); endDate.setHours(Number(hh), Number(mm) + (d.session.estMin || 45));
    const end = `${isoDate(endDate).replace(/-/g, '')}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
    lines.push('BEGIN:VEVENT', `UID:forge-${d.date}@coach`, `DTSTAMP:${stamp}`, `DTSTART:${startH}`, `DTEND:${end}`,
      `SUMMARY:${esc(`${d.session.emoji} ${d.session.title}`)}`,
      `DESCRIPTION:${esc(`${message(d.session.title)}\nSemaine ${w.index + 1} · ${w.phase.name}`)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(message(d.session.title))}`, 'TRIGGER:-PT0M', 'END:VALARM', 'END:VEVENT');
  }));
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
