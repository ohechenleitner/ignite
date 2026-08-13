// ===== DADO DEL DESEO — dadoDeseo.js =====
// Se integra a Ignite reutilizando: db, currentUser, currentUserData,
// showTab(), showToast(), notifyGroupMembers().
// Tiene DOS temas visuales seleccionables: "ignite" (estilo real de la
// app, .btn/.card/etc.) y "comic" (sub-marca propia, dorado/rojo/negro).
// La elección se guarda en localStorage y se aplica vía un helper de
// clases (ddCls) — la lógica de datos es idéntica en ambos temas.
// No usa Cloud Functions — validación en cliente, igual que el resto
// de Ignite hasta ahora; las reglas de Firestore ya publicadas son la
// barrera real contra manipulación directa.

// ===== TEMA =====
function ddTheme() { return localStorage.getItem('dadoTheme') || 'ignite'; }
function ddSetTheme(t) { localStorage.setItem('dadoTheme', t); renderDado(); }

const DD_CLASSES = {
  comic: {
    wrap: 'dd-wrap', card: 'dd-card', cardFlat: 'dd-card dd-flat',
    btnPrimary: 'dd-btn dd-btn-primary', btnOutline: 'dd-btn dd-btn-outline',
    btnDanger: 'dd-btn dd-btn-danger', btnFull: 'dd-btn-full',
    label: 'dd-label', heading: 'dd-h', input: 'dd-input',
    empty: 'dd-empty', status: 'dd-status', tag: 'dd-tag',
  },
  ignite: {
    wrap: '', card: 'card', cardFlat: 'card',
    btnPrimary: 'btn btn-primary', btnOutline: 'btn btn-outline',
    btnDanger: 'btn btn-danger', btnFull: 'btn-full',
    label: 'form-label', heading: '', input: 'form-control',
    empty: 'empty-state', status: '', tag: '',
  },
};
function ddCls(part) { return DD_CLASSES[ddTheme()][part]; }
function ddHeadingStyle(size) {
  return ddTheme() === 'ignite' ? `font-family:var(--font-display);font-size:${size}px;` : `font-size:${size + 6}px;`;
}

// ===== ESTILOS COMIC (inyectados una sola vez, solo se usan si el tema activo es "comic") =====
function dadoInjectStyles() {
  if (document.getElementById('dd-styles')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = "https://fonts.googleapis.com/css2?family=Bangers&family=Open+Sans:wght@400;600;700&display=swap";
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.id = 'dd-styles';
  style.textContent = `
    .dd-wrap { font-family: 'Open Sans', sans-serif; }
    .dd-h { font-family: 'Bangers', cursive; letter-spacing: 1px; color: #ffd700; text-shadow: 2px 2px 0px #c00; }
    .dd-tag { display:inline-block; font-family:'Bangers',cursive; background:#c00; color:#fff; padding:4px 12px; border:3px solid #000; box-shadow:3px 3px 0px #000; transform:rotate(-2deg); font-size:13px; margin-bottom:10px; }
    .dd-card { background:#0d1530; border:3px solid #000; box-shadow:5px 5px 0px #ffd700; padding:16px; margin-bottom:14px; border-radius:2px; }
    .dd-card.dd-flat { box-shadow:none; border-width:2px; }
    .dd-btn { font-family:'Bangers',cursive; letter-spacing:0.5px; border:3px solid #000; padding:10px 18px; cursor:pointer; box-shadow:4px 4px 0px #000; transition:all .1s; display:inline-flex; align-items:center; gap:6px; font-size:15px; }
    .dd-btn:active { transform:translate(2px,2px); box-shadow:2px 2px 0px #000; }
    .dd-btn-primary { background:#ffd700; color:#000; }
    .dd-btn-danger { background:#c00; color:#fff; }
    .dd-btn-outline { background:transparent; color:#fff; }
    .dd-btn:disabled { opacity:.3; cursor:not-allowed; }
    .dd-btn-full { width:100%; justify-content:center; }
    .dd-input { width:100%; background:#0d1530; border:2px solid #000; color:#fff; padding:11px 12px; font-family:'Open Sans',sans-serif; font-size:14px; outline:none; }
    .dd-input:focus { border-color:#ffd700; }
    .dd-input::placeholder { color:rgba(255,255,255,.3); }
    .dd-label { font-family:'Bangers',cursive; color:#fff; font-size:14px; letter-spacing:.5px; margin-bottom:8px; display:block; }
    .dd-dots { display:flex; gap:6px; justify-content:center; margin-bottom:16px; }
    .dd-dot { height:8px; border-radius:4px; background:rgba(255,255,255,.15); transition:all .2s; }
    .dd-dot.active { width:28px; background:#ffd700; }
    .dd-dot.done { width:8px; background:#c00; }
    .dd-empty { text-align:center; color:rgba(255,255,255,.4); padding:24px; font-family:'Open Sans',sans-serif; }
    .dd-status { color:#ffd700; font-size:12px; font-family:'Open Sans',sans-serif; }
    .dd-theme-toggle { display:flex; gap:8px; margin-bottom:14px; }
    .dd-theme-btn { flex:1; padding:8px; text-align:center; border:2px solid rgba(255,255,255,.15); border-radius:8px; font-size:12px; cursor:pointer; color:rgba(255,255,255,.6); }
    .dd-theme-btn.active { border-color:#ffd700; color:#ffd700; }
  `;
  document.head.appendChild(style);
}

let dadoState = {
  step: 0, title: '',
  activities: [], includeGuests: false, guests: [], outfits: [],
};

const DADO_STEPS = ['titulo', 'actividades', 'invitados', 'ropa', 'preview'];
const DADO_MAX_ACTIVITIES = 10;

function dadoThemeToggleHtml() {
  const t = ddTheme();
  if (t === 'comic') {
    return `
      <div class="dd-theme-toggle">
        <div class="dd-theme-btn" onclick="ddSetTheme('ignite')">Estilo Ignite</div>
        <div class="dd-theme-btn active" onclick="ddSetTheme('comic')">Estilo Cómic</div>
      </div>`;
  }
  return `
    <div style="display:flex;gap:8px;margin-bottom:14px;">
      <button class="btn btn-sm btn-primary" onclick="ddSetTheme('ignite')">Estilo Ignite</button>
      <button class="btn btn-sm btn-outline" onclick="ddSetTheme('comic')">Estilo Cómic</button>
    </div>`;
}

// ===== ENTRADA DEL TAB =====
async function renderDado() {
  dadoInjectStyles();
  const gid = currentUserData?.groupId;
  const content = document.getElementById('content');
  if (!gid) { content.innerHTML = `<div class="${ddCls('wrap')} ${ddCls('empty')}">Sin grupo activo</div>`; return; }

  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const snap = await db.collection('groups').doc(gid).collection('desirePacks')
    .orderBy('createdAt', 'desc').limit(20).get()
    .catch((e) => { console.error('Error cargando propuestas:', e); return null; });

  const pending = snap ? snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status !== 'closed') : [];

  content.innerHTML = `
    <div class="${ddCls('wrap')}">
      ${dadoThemeToggleHtml()}
      <div class="${ddCls('card')}">
        ${ddCls('tag') ? `<span class="${ddCls('tag')}">Dado del Deseo</span>` : `<div class="${ddCls('label')}">Dado del Deseo</div>`}
        <p style="color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.7)' : 'var(--text2)'};font-size:13px;margin:10px 0 14px;">
          Arma una propuesta de salida: actividad, invitados y ropa. Reparte quién decide qué —
          tú, tu pareja, o la suerte.
        </p>
        <button class="${ddCls('btnPrimary')} ${ddCls('btnFull')}" onclick="abrirDadoWizard()">🎲 Nueva propuesta</button>
      </div>
      ${pending.length ? `
        <div class="${ddCls('label')}" style="margin-top:6px;">Propuestas activas</div>
        ${pending.map(p => `
          <div class="${ddCls('cardFlat')}" style="cursor:pointer;" onclick="abrirDadoDetalle('${p.id}')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div class="${ddCls('heading')}" style="${ddHeadingStyle(14)}">${escapeHtml(p.title)}</div>
                <div class="${ddCls('status')}" style="${ddTheme() === 'ignite' ? 'color:var(--text2);font-size:12px;' : ''}">${dadoStatusLabel(p.status)}</div>
              </div>
              <span style="color:${ddTheme() === 'comic' ? '#ffd700' : 'var(--rose)'};font-size:18px;">→</span>
            </div>
          </div>
        `).join('')}
      ` : `<div class="${ddCls('empty')}" style="margin-top:18px;">Sin propuestas activas por ahora</div>`}
    </div>
  `;
}

function dadoStatusLabel(status) {
  return {
    pending_review: 'Esperando que tu pareja la revise',
    b_turn: 'Tu pareja está jugando su parte',
    a_turn: 'Te toca resolver tu parte',
    closed: 'Cerrada',
  }[status] || status;
}

function escapeHtml(s) {
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}

// ===== WIZARD DE CREACIÓN (Persona A) =====
function abrirDadoWizard() {
  dadoInjectStyles();
  dadoState = {
    step: 0, title: '',
    activities: [mkItem(), mkItem(), mkItem()],
    includeGuests: false,
    guests: [mkItem(), mkItem()],
    outfits: [mkItem(), mkItem(), mkItem()],
  };
  renderDadoWizard();
}

function mkItem() { return { id: crypto.randomUUID(), name: '' }; }

function renderDadoWizard() {
  const step = DADO_STEPS[dadoState.step];
  let body = '';

  if (step === 'titulo') {
    body = `
      <div class="${ddCls('heading')}" style="${ddHeadingStyle(20)}margin-bottom:14px;">Nueva Propuesta</div>
      <label class="${ddCls('label')}">Título de la propuesta</label>
      <input class="${ddCls('input')}" placeholder="Ej: Salida fin de semana"
        value="${escapeHtml(dadoState.title)}" oninput="dadoState.title=this.value">`;
  } else if (step === 'actividades') {
    body = `
      <div class="${ddCls('label')}">Actividades a proponer (máx. ${DADO_MAX_ACTIVITIES})</div>
      ${dadoState.activities.map((a, i) => dadoRow('activities', a, i)).join('')}
      ${dadoState.activities.length < DADO_MAX_ACTIVITIES ? `<button class="${ddCls('btnOutline')}" style="margin-top:6px;font-size:13px;padding:8px 14px;" onclick="dadoAddItem('activities')">+ Agregar actividad</button>` : ''}
    `;
  } else if (step === 'invitados') {
    body = `
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <button class="${!dadoState.includeGuests ? ddCls('btnPrimary') : ddCls('btnOutline')}" style="font-size:13px;padding:8px 14px;" onclick="dadoState.includeGuests=false;renderDadoWizard()">Solo pareja</button>
        <button class="${dadoState.includeGuests ? ddCls('btnPrimary') : ddCls('btnOutline')}" style="font-size:13px;padding:8px 14px;" onclick="dadoState.includeGuests=true;renderDadoWizard()">Incluir invitados</button>
      </div>
      ${dadoState.includeGuests ? `
        ${dadoState.guests.map((g, i) => dadoRow('guests', g, i)).join('')}
        <button class="${ddCls('btnOutline')}" style="margin-top:6px;font-size:13px;padding:8px 14px;" onclick="dadoAddItem('guests')">+ Agregar invitado</button>
      ` : ''}
    `;
  } else if (step === 'ropa') {
    body = `
      <div class="${ddCls('label')}">Ropa a usar</div>
      ${dadoState.outfits.map((o, i) => dadoRow('outfits', o, i)).join('')}
      <button class="${ddCls('btnOutline')}" style="margin-top:6px;font-size:13px;padding:8px 14px;" onclick="dadoAddItem('outfits')">+ Agregar ropa</button>
    `;
  } else if (step === 'preview') {
    const acts = dadoState.activities.filter(a => a.name.trim());
    const guests = dadoState.includeGuests ? dadoState.guests.filter(g => g.name.trim()) : [];
    const outfits = dadoState.outfits.filter(o => o.name.trim());
    body = `
      <div class="${ddCls('cardFlat')}"><div class="${ddCls('heading')}" style="${ddHeadingStyle(18)}">${escapeHtml(dadoState.title) || '(sin título)'}</div></div>
      <div class="${ddCls('label')}">Actividades</div>
      ${acts.map(a => `<div class="${ddCls('cardFlat')}" style="padding:10px 14px;">${escapeHtml(a.name)}</div>`).join('') || `<div class="${ddCls('empty')}">Sin actividades</div>`}
      <div class="${ddCls('label')}" style="margin-top:14px;">Invitados</div>
      <div class="${ddCls('cardFlat')}" style="padding:10px 14px;">${guests.length ? guests.map(g => escapeHtml(g.name)).join(', ') : 'Solo pareja'}</div>
      <div class="${ddCls('label')}" style="margin-top:14px;">Ropa</div>
      <div class="${ddCls('cardFlat')}" style="padding:10px 14px;">${outfits.length ? outfits.map(o => escapeHtml(o.name)).join(', ') : '—'}</div>
    `;
  }

  const dots = ddTheme() === 'comic'
    ? `<div class="dd-dots">${DADO_STEPS.map((s, i) => `<div class="dd-dot ${i === dadoState.step ? 'active' : i < dadoState.step ? 'done' : ''}"></div>`).join('')}</div>`
    : `<div class="${ddCls('label')}">Paso ${dadoState.step + 1} de ${DADO_STEPS.length}</div>`;

  document.getElementById('content').innerHTML = `
    <div class="${ddCls('wrap')}">
      ${dots}
      ${body}
      <div style="display:flex;justify-content:space-between;margin-top:22px;">
        <button class="${ddCls('btnOutline')}" ${dadoState.step === 0 ? 'disabled' : ''} onclick="dadoGoBack()">← Atrás</button>
        ${step !== 'preview'
          ? `<button class="${ddCls('btnPrimary')}" onclick="dadoGoNext()">Siguiente →</button>`
          : `<button class="${ddCls('btnDanger')}" onclick="guardarDadoPack()">🎲 Guardar y enviar</button>`}
      </div>
    </div>
  `;
}

function dadoRow(listName, item, idx) {
  return `
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <input class="${ddCls('input')}" placeholder="${listName === 'activities' ? 'Propuesta' : listName === 'guests' ? 'Invitado' : 'Ropa'} ${idx + 1}"
        value="${escapeHtml(item.name)}" oninput="dadoUpdateItem('${listName}','${item.id}',this.value)">
      ${dadoState[listName].length > 1 ? `<button class="${ddCls('btnDanger')}" style="padding:8px 12px;" onclick="dadoRemoveItem('${listName}','${item.id}')">✕</button>` : ''}
    </div>`;
}

function dadoUpdateItem(listName, id, value) {
  const it = dadoState[listName].find(x => x.id === id);
  if (it) it.name = value;
}
function dadoRemoveItem(listName, id) {
  dadoState[listName] = dadoState[listName].filter(x => x.id !== id);
  renderDadoWizard();
}
function dadoAddItem(listName) {
  if (listName === 'activities' && dadoState.activities.length >= DADO_MAX_ACTIVITIES) return;
  dadoState[listName].push(mkItem());
  renderDadoWizard();
}
function dadoGoNext() {
  if (dadoState.step === 0 && !dadoState.title.trim()) { showToast('Ponle un título a la propuesta'); return; }
  dadoState.step = Math.min(dadoState.step + 1, DADO_STEPS.length - 1);
  renderDadoWizard();
}
function dadoGoBack() {
  dadoState.step = Math.max(dadoState.step - 1, 0);
  renderDadoWizard();
}

async function guardarDadoPack() {
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const activities = dadoState.activities.filter(a => a.name.trim());
  const guests = dadoState.includeGuests ? dadoState.guests.filter(g => g.name.trim()) : [];
  const outfits = dadoState.outfits.filter(o => o.name.trim());

  if (!activities.length) { showToast('Agrega al menos una actividad'); return; }

  try {
    const packRef = await db.collection('groups').doc(gid).collection('desirePacks').add({
      title: dadoState.title.trim(),
      createdBy: uid,
      status: 'pending_review',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const batch = db.batch();
    activities.forEach(a => {
      const ref = packRef.collection('activities').doc();
      batch.set(ref, { name: a.name.trim(), addedBy: uid, source: 'custom' });
    });
    guests.forEach(g => {
      const ref = packRef.collection('guests').doc();
      batch.set(ref, { name: g.name.trim(), addedBy: uid, compatibleActivities: [] });
    });
    outfits.forEach(o => {
      const ref = packRef.collection('outfits').doc();
      batch.set(ref, { name: o.name.trim(), addedBy: uid, compatibleActivities: [] });
    });
    await batch.commit();

    await notifyGroupMembers(gid, `🎲 Nueva propuesta: "${dadoState.title.trim()}"`);
    showToast('Propuesta enviada');
    showTab('dado');
  } catch (e) {
    console.error(e);
    showToast('Error al guardar la propuesta');
  }
}

// ===== DETALLE / RECEPCIÓN (Persona B) =====
// NOTA: cubre la estructura base — agregar opciones, reparto de
// categorías y tirada de dado quedan con las validaciones clave
// aplicadas en el cliente (actividad primero, máx. 2 de 3 secciones,
// nunca 3 de 3 para quien recibe). Punto de partida funcional,
// conviene probarlo a fondo antes de confiar en todos los casos borde.

async function abrirDadoDetalle(proposalId) {
  dadoInjectStyles();
  const gid = currentUserData.groupId;
  const packRef = db.collection('groups').doc(gid).collection('desirePacks').doc(proposalId);
  const packSnap = await packRef.get();
  const pack = packSnap.data();
  const isCreator = pack.createdBy === currentUser.uid;

  const [actSnap, guestSnap, outfitSnap] = await Promise.all([
    packRef.collection('activities').get(),
    packRef.collection('guests').get(),
    packRef.collection('outfits').get(),
  ]);
  const activities = actSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const guests = guestSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const outfits = outfitSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  document.getElementById('content').innerHTML = `
    <div class="${ddCls('wrap')}">
      <div class="${ddCls('cardFlat')}">
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(18)}">${escapeHtml(pack.title)}</div>
        <div class="${ddCls('status')}" style="${ddTheme() === 'ignite' ? 'color:var(--text2);font-size:12px;' : ''}">${dadoStatusLabel(pack.status)}</div>
      </div>
      <div class="${ddCls('label')}">Actividades</div>
      ${activities.map(a => `<div class="${ddCls('cardFlat')}" style="padding:10px 14px;">${escapeHtml(a.name)}</div>`).join('')}
      <div class="${ddCls('label')}" style="margin-top:14px;">Invitados</div>
      ${guests.length ? guests.map(g => `<div class="${ddCls('cardFlat')}" style="padding:10px 14px;">${escapeHtml(g.name)}</div>`).join('') : `<div class="${ddCls('cardFlat')}" style="padding:10px 14px;">Solo pareja</div>`}
      <div class="${ddCls('label')}" style="margin-top:14px;">Ropa</div>
      ${outfits.map(o => `<div class="${ddCls('cardFlat')}" style="padding:10px 14px;">${escapeHtml(o.name)}</div>`).join('')}

      ${!isCreator && pack.status === 'pending_review' ? `
        <button class="${ddCls('btnPrimary')} ${ddCls('btnFull')}" style="margin-top:18px;" onclick="renderDadoReview('${proposalId}')">Continuar</button>
      ` : ''}
      <button class="${ddCls('btnOutline')} ${ddCls('btnFull')}" style="margin-top:8px;" onclick="showTab('dado')">Volver</button>
    </div>
  `;
}

// ===== REPARTO (Persona B) =====
// Reglas duras aplicadas acá:
// - Puede agregar opciones en máximo 2 de las 3 secciones.
// - Límite de cuántas puede agregar: escala por tramo según cuántas ya
//   existen en la sección (1-3→1, 4-6→2, 7-10→3). Actividades tiene
//   techo absoluto de 10 en total; Invitados y Ropa no tienen techo.
// - En la sección donde agregó, no puede asignarse esa categoría a
//   sí misma (queda para Suerte o Persona A).
// - Nunca puede asignarse las 3 categorías a sí misma, aunque no haya
//   agregado nada en ninguna sección.

let dadoReview = null;

function ddTierLimit(count) {
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  return 3;
}

async function renderDadoReview(proposalId) {
  const gid = currentUserData.groupId;
  const packRef = db.collection('groups').doc(gid).collection('desirePacks').doc(proposalId);

  const [actSnap, guestSnap, outfitSnap] = await Promise.all([
    packRef.collection('activities').get(),
    packRef.collection('guests').get(),
    packRef.collection('outfits').get(),
  ]);

  dadoReview = {
    proposalId, packRef,
    activities: actSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    guests: guestSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    outfits: outfitSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    newActivities: [], newGuests: [], newOutfits: [],
    assignment: { activity: '', guest: '', outfit: '' },
  };

  renderDadoReviewScreen();
}

function ddReviewSectionsWithAdds() {
  const r = dadoReview;
  const sections = [];
  if (r.newActivities.length) sections.push('activity');
  if (r.newGuests.length) sections.push('guest');
  if (r.newOutfits.length) sections.push('outfit');
  return sections;
}

function ddReviewAddLimit(section) {
  const r = dadoReview;
  const existing = section === 'activity' ? r.activities.length : section === 'guest' ? r.guests.length : r.outfits.length;
  const added = section === 'activity' ? r.newActivities.length : section === 'guest' ? r.newGuests.length : r.newOutfits.length;
  const tierLimit = ddTierLimit(existing);
  let cap = tierLimit;
  if (section === 'activity') {
    const totalNow = existing + added;
    cap = Math.min(tierLimit, DADO_MAX_ACTIVITIES - totalNow + added); // no exceder 10 en total
  }
  return { canAdd: added < cap, remaining: cap - added };
}

function dadoReviewAddOption(section) {
  const sectionsUsed = ddReviewSectionsWithAdds();
  const already = sectionsUsed.includes(section);
  if (!already && sectionsUsed.length >= 2) {
    showToast('Ya agregaste en 2 secciones — no puedes agregar en la tercera');
    return;
  }
  const { canAdd } = ddReviewAddLimit(section);
  if (!canAdd) {
    showToast('Llegaste al límite de opciones que puedes agregar aquí');
    return;
  }
  const list = section === 'activity' ? dadoReview.newActivities : section === 'guest' ? dadoReview.newGuests : dadoReview.newOutfits;
  list.push({ id: crypto.randomUUID(), name: '' });

  // Si esta sección queda bloqueada para ella, resetea la asignación si se la había puesto a sí misma
  if (dadoReview.assignment[section] === 'b') dadoReview.assignment[section] = '';

  renderDadoReviewScreen();
}

function dadoReviewUpdateNew(section, id, value) {
  const list = section === 'activity' ? dadoReview.newActivities : section === 'guest' ? dadoReview.newGuests : dadoReview.newOutfits;
  const it = list.find(x => x.id === id);
  if (it) it.name = value;
}

function dadoReviewRemoveNew(section, id) {
  if (section === 'activity') dadoReview.newActivities = dadoReview.newActivities.filter(x => x.id !== id);
  if (section === 'guest') dadoReview.newGuests = dadoReview.newGuests.filter(x => x.id !== id);
  if (section === 'outfit') dadoReview.newOutfits = dadoReview.newOutfits.filter(x => x.id !== id);
  renderDadoReviewScreen();
}

function dadoReviewSetAssignment(category, who) {
  const locked = ddReviewSectionsWithAdds();
  if (who === 'b' && locked.includes(category)) {
    showToast('No puedes elegir esta categoría — agregaste opciones aquí');
    return;
  }
  const next = { ...dadoReview.assignment, [category]: who };
  if (next.activity === 'b' && next.guest === 'b' && next.outfit === 'b') {
    showToast('No puedes quedarte con las 3 — al menos una va a la Suerte o a tu pareja');
    return;
  }
  dadoReview.assignment = next;
  renderDadoReviewScreen();
}

function ddReviewIsValid() {
  const a = dadoReview.assignment;
  if (!a.activity || !a.guest || !a.outfit) return false;
  if (a.activity === 'b' && a.guest === 'b' && a.outfit === 'b') return false;
  const locked = ddReviewSectionsWithAdds();
  if (locked.includes('activity') && a.activity === 'b') return false;
  if (locked.includes('guest') && a.guest === 'b') return false;
  if (locked.includes('outfit') && a.outfit === 'b') return false;
  return true;
}

function dadoReviewSectionBlock(section, label, items, newItems) {
  const locked = ddReviewSectionsWithAdds().includes(section);
  const { canAdd, remaining } = ddReviewAddLimit(section);
  const catKey = section; // 'activity' | 'guest' | 'outfit'
  const assignment = dadoReview.assignment[catKey];

  return `
    <div class="${ddCls('cardFlat')}" style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(14)}">${label}</div>
        ${locked ? `<span style="font-size:11px;color:${ddTheme() === 'comic' ? '#ffd700' : 'var(--amber)'};">agregaste aquí — no puedes elegirla</span>` : ''}
      </div>
      ${items.map(i => `<div style="padding:6px 0;color:${ddTheme() === 'comic' ? '#fff' : 'var(--text)'};font-size:13px;">• ${escapeHtml(i.name)}</div>`).join('')}
      ${newItems.map(i => `
        <div style="display:flex;gap:6px;margin:6px 0;">
          <input class="${ddCls('input')}" placeholder="Nueva opción" value="${escapeHtml(i.name)}"
            oninput="dadoReviewUpdateNew('${section}','${i.id}',this.value)">
          <button class="${ddCls('btnDanger')}" style="padding:8px 12px;" onclick="dadoReviewRemoveNew('${section}','${i.id}')">✕</button>
        </div>
      `).join('')}
      <button class="${ddCls('btnOutline')}" style="margin-top:6px;font-size:12px;padding:6px 12px;" ${canAdd ? '' : 'disabled'}
        onclick="dadoReviewAddOption('${section}')">+ Agregar (quedan ${remaining})</button>

      <div style="display:flex;gap:6px;margin-top:12px;">
        <button class="${assignment === 'b' ? ddCls('btnPrimary') : ddCls('btnOutline')}" style="flex:1;font-size:12px;padding:7px;" ${locked ? 'disabled' : ''}
          onclick="dadoReviewSetAssignment('${catKey}','b')">Yo elijo</button>
        <button class="${assignment === 'a' ? ddCls('btnPrimary') : ddCls('btnOutline')}" style="flex:1;font-size:12px;padding:7px;"
          onclick="dadoReviewSetAssignment('${catKey}','a')">Mi pareja</button>
        <button class="${assignment === 'luck' ? ddCls('btnPrimary') : ddCls('btnOutline')}" style="flex:1;font-size:12px;padding:7px;"
          onclick="dadoReviewSetAssignment('${catKey}','luck')">🎲 Suerte</button>
      </div>
    </div>
  `;
}

function renderDadoReviewScreen() {
  const r = dadoReview;
  document.getElementById('content').innerHTML = `
    <div class="${ddCls('wrap')}">
      <div class="${ddCls('label')}" style="margin-bottom:4px;">Agrega opciones (máx. 2 de 3 secciones) y decide quién elige qué</div>
      ${dadoReviewSectionBlock('activity', 'Actividad', r.activities, r.newActivities)}
      ${dadoReviewSectionBlock('guest', 'Invitado', r.guests, r.newGuests)}
      ${dadoReviewSectionBlock('outfit', 'Ropa', r.outfits, r.newOutfits)}
      <button class="${ddCls('btnDanger')} ${ddCls('btnFull')}" ${ddReviewIsValid() ? '' : 'disabled'}
        onclick="confirmarDadoReparto()">Confirmar y empezar a resolver</button>
      <button class="${ddCls('btnOutline')} ${ddCls('btnFull')}" style="margin-top:8px;" onclick="abrirDadoDetalle('${r.proposalId}')">Volver</button>
    </div>
  `;
}

async function confirmarDadoReparto() {
  if (!ddReviewIsValid()) { showToast('Completa el reparto de las 3 categorías'); return; }
  const r = dadoReview;
  const uid = currentUser.uid;

  try {
    const batch = db.batch();
    r.newActivities.filter(a => a.name.trim()).forEach(a => {
      batch.set(r.packRef.collection('activities').doc(), { name: a.name.trim(), addedBy: uid, source: 'custom' });
    });
    r.newGuests.filter(g => g.name.trim()).forEach(g => {
      batch.set(r.packRef.collection('guests').doc(), { name: g.name.trim(), addedBy: uid, compatibleActivities: [] });
    });
    r.newOutfits.filter(o => o.name.trim()).forEach(o => {
      batch.set(r.packRef.collection('outfits').doc(), { name: o.name.trim(), addedBy: uid, compatibleActivities: [] });
    });

    batch.set(r.packRef.collection('resolution').doc('state'), {
      activityAssignedTo: r.assignment.activity,
      guestAssignedTo: r.assignment.guest,
      outfitAssignedTo: r.assignment.outfit,
      activityResult: null, guestResult: null, outfitResult: null,
      lockedSections: ddReviewSectionsWithAdds(),
    });
    batch.update(r.packRef, { status: 'b_turn' });
    await batch.commit();

    showToast('Reparto confirmado — a resolver');
    renderDadoResolve(r.proposalId);
  } catch (e) {
    console.error(e);
    showToast('Error al confirmar el reparto');
  }
}

// ===== RESOLUCIÓN / DADO — PENDIENTE =====
// Stub temporal: el reparto ya quedó guardado en Firestore
// (resolution/state), listo para que la Pieza 2 (el dado) lo lea
// y resuelva Actividad primero, luego Ropa/Invitado filtrados.
function renderDadoResolve(proposalId) {
  document.getElementById('content').innerHTML = `
    <div class="${ddCls('wrap')}">
      <div class="${ddCls('empty')}">El reparto quedó guardado. La pantalla del dado se conecta en el siguiente paso.</div>
      <button class="${ddCls('btnOutline')} ${ddCls('btnFull')}" style="margin-top:12px;" onclick="showTab('dado')">Volver</button>
    </div>
  `;
}
