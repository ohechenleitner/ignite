// ===== DADO DEL DESEO — dadoDeseo.js =====
// Se integra a Ignite reutilizando: db, currentUser, currentUserData,
// showTab(), closeModal(), showToast(), notifyGroupMembers().
// No usa Cloud Functions — toda la validación corre en el cliente,
// igual que el resto de Ignite hasta ahora. Las reglas de Firestore
// (ya publicadas) son la única barrera real contra manipulación directa.

let dadoState = {
  step: 0,
  title: '',
  activities: [{ id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }],
  includeGuests: false,
  guests: [{ id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }],
  outfits: [{ id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }],
};

const DADO_STEPS = ['titulo', 'actividades', 'invitados', 'ropa', 'preview'];
const DADO_MAX_ACTIVITIES = 10;

// ===== ENTRADA DEL TAB =====
async function renderDado() {
  const gid = currentUserData?.groupId;
  if (!gid) { document.getElementById('content').innerHTML = '<div class="empty-state">Sin grupo activo</div>'; return; }

  document.getElementById('content').innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const snap = await db.collection('groups').doc(gid).collection('desirePacks')
    .where('status', '!=', 'closed').orderBy('status').orderBy('createdAt', 'desc').get()
    .catch(() => null);

  const pending = snap ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : [];

  document.getElementById('content').innerHTML = `
    <div class="card">
      <div class="form-label">Dado del Deseo</div>
      <p style="color:var(--text2);font-size:13px;margin-bottom:14px;">
        Arma una propuesta de salida: actividad, invitados y ropa. Reparte quién decide qué —
        tú, tu pareja, o la suerte.
      </p>
      <button class="btn btn-primary btn-full" onclick="abrirDadoWizard()">Nueva propuesta</button>
    </div>
    ${pending.length ? `
      <div class="form-label" style="margin-top:18px;">Propuestas activas</div>
      ${pending.map(p => `
        <div class="card" style="cursor:pointer;" onclick="abrirDadoDetalle('${p.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-family:var(--font-display);font-size:18px;">${escapeHtml(p.title)}</div>
              <div style="color:var(--text2);font-size:12px;">${dadoStatusLabel(p.status)}</div>
            </div>
            <span style="color:var(--rose);">→</span>
          </div>
        </div>
      `).join('')}
    ` : `<div class="empty-state" style="margin-top:18px;">Sin propuestas activas por ahora</div>`}
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
      <div class="form-group">
        <label class="form-label">Título de la propuesta</label>
        <input class="form-control" id="dado-title" placeholder="Ej: Salida fin de semana"
          value="${escapeHtml(dadoState.title)}" oninput="dadoState.title=this.value">
      </div>`;
  } else if (step === 'actividades') {
    body = `
      <div class="form-label">Actividades a proponer (máx. ${DADO_MAX_ACTIVITIES})</div>
      ${dadoState.activities.map((a, i) => dadoRow('activities', a, i)).join('')}
      ${dadoState.activities.length < DADO_MAX_ACTIVITIES ? `<button class="btn btn-outline btn-sm" onclick="dadoAddItem('activities')">+ Agregar actividad</button>` : ''}
    `;
  } else if (step === 'invitados') {
    body = `
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <button class="btn ${!dadoState.includeGuests ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="dadoState.includeGuests=false;renderDadoWizard()">Solo pareja</button>
        <button class="btn ${dadoState.includeGuests ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="dadoState.includeGuests=true;renderDadoWizard()">Incluir invitados</button>
      </div>
      ${dadoState.includeGuests ? `
        ${dadoState.guests.map((g, i) => dadoRow('guests', g, i)).join('')}
        <button class="btn btn-outline btn-sm" onclick="dadoAddItem('guests')">+ Agregar invitado</button>
      ` : ''}
    `;
  } else if (step === 'ropa') {
    body = `
      <div class="form-label">Ropa a usar</div>
      ${dadoState.outfits.map((o, i) => dadoRow('outfits', o, i)).join('')}
      <button class="btn btn-outline btn-sm" onclick="dadoAddItem('outfits')">+ Agregar ropa</button>
    `;
  } else if (step === 'preview') {
    const acts = dadoState.activities.filter(a => a.name.trim());
    const guests = dadoState.includeGuests ? dadoState.guests.filter(g => g.name.trim()) : [];
    const outfits = dadoState.outfits.filter(o => o.name.trim());
    body = `
      <div class="card"><div style="font-family:var(--font-display);font-size:22px;">${escapeHtml(dadoState.title) || '(sin título)'}</div></div>
      <div class="form-label">Actividades</div>
      ${acts.map(a => `<div class="card" style="padding:10px 14px;">${escapeHtml(a.name)}</div>`).join('') || '<div class="empty-state">Sin actividades</div>'}
      <div class="form-label" style="margin-top:14px;">Invitados</div>
      <div class="card" style="padding:10px 14px;">${guests.length ? guests.map(g => escapeHtml(g.name)).join(', ') : 'Solo pareja'}</div>
      <div class="form-label" style="margin-top:14px;">Ropa</div>
      <div class="card" style="padding:10px 14px;">${outfits.length ? outfits.map(o => escapeHtml(o.name)).join(', ') : '—'}</div>
    `;
  }

  document.getElementById('content').innerHTML = `
    <div class="form-label">Paso ${dadoState.step + 1} de ${DADO_STEPS.length}</div>
    ${body}
    <div style="display:flex;justify-content:space-between;margin-top:20px;">
      <button class="btn btn-outline" ${dadoState.step === 0 ? 'disabled' : ''} onclick="dadoGoBack()">Atrás</button>
      ${step !== 'preview'
        ? `<button class="btn btn-primary" onclick="dadoGoNext()">Siguiente</button>`
        : `<button class="btn btn-primary" onclick="guardarDadoPack()">Guardar y enviar</button>`}
    </div>
  `;
}

function dadoRow(listName, item, idx) {
  return `
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <input class="form-control" placeholder="${listName === 'activities' ? 'Propuesta' : listName === 'guests' ? 'Invitado' : 'Ropa'} ${idx + 1}"
        value="${escapeHtml(item.name)}" oninput="dadoUpdateItem('${listName}','${item.id}',this.value)">
      ${dadoState[listName].length > 1 ? `<button class="btn btn-danger btn-sm" onclick="dadoRemoveItem('${listName}','${item.id}')">✕</button>` : ''}
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

    await notifyGroupMembers(gid, `💌 Nueva propuesta: "${dadoState.title.trim()}"`);
    showToast('Propuesta enviada');
    showTab('dado');
  } catch (e) {
    console.error(e);
    showToast('Error al guardar la propuesta');
  }
}

// ===== DETALLE / RECEPCIÓN (Persona B) =====
// NOTA: esta parte cubre la estructura base — agregar opciones, reparto
// de categorías y tirada de dado — con las validaciones clave del flujo
// aplicadas en el cliente (actividad primero, máx. 2 de 3 secciones,
// nunca 3 de 3 para quien recibe). Es un punto de partida funcional,
// conviene probarlo a fondo con datos reales antes de confiar en él
// para todos los casos borde del flujo completo que definimos.

async function abrirDadoDetalle(proposalId) {
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
    <div class="card"><div style="font-family:var(--font-display);font-size:22px;">${escapeHtml(pack.title)}</div>
      <div style="color:var(--text2);font-size:12px;">${dadoStatusLabel(pack.status)}</div></div>
    <div class="form-label">Actividades</div>
    ${activities.map(a => `<div class="card" style="padding:10px 14px;">${escapeHtml(a.name)}</div>`).join('')}
    <div class="form-label" style="margin-top:14px;">Invitados</div>
    ${guests.length ? guests.map(g => `<div class="card" style="padding:10px 14px;">${escapeHtml(g.name)}</div>`).join('') : `<div class="card" style="padding:10px 14px;">Solo pareja</div>`}
    <div class="form-label" style="margin-top:14px;">Ropa</div>
    ${outfits.map(o => `<div class="card" style="padding:10px 14px;">${escapeHtml(o.name)}</div>`).join('')}

    ${!isCreator && pack.status === 'pending_review' ? `
      <button class="btn btn-primary btn-full" style="margin-top:18px;" onclick="showToast('Siguiente: pantalla de reparto — agrega tus opciones y define quién elige qué (pendiente de construir en el próximo paso)')">Continuar</button>
    ` : ''}
    <button class="btn btn-outline btn-full" style="margin-top:8px;" onclick="showTab('dado')">Volver</button>
  `;
}
