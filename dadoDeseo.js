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

const DADO_STEPS = ['titulo', 'actividades', 'invitados', 'ropa', 'asociacion', 'imagenes', 'resumen', 'preview'];
const DD_DEFAULT_NARRATIVE = 'Invitados posibles: {invitados}.\nVestuario posible: {ropa}.';
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
                <div class="${ddCls('status')}" style="${ddTheme() === 'ignite' ? 'color:var(--text2);font-size:12px;' : ''}">${dadoStatusLabel(p.status, p.createdBy === currentUser.uid)}</div>
              </div>
              <span style="color:${ddTheme() === 'comic' ? '#ffd700' : 'var(--rose)'};font-size:18px;">→</span>
            </div>
          </div>
        `).join('')}
      ` : `<div class="${ddCls('empty')}" style="margin-top:18px;">Sin propuestas activas por ahora</div>`}
    </div>
  `;
}

function dadoStatusLabel(status, isCreator) {
  if (status === 'pending_review') return isCreator ? 'Esperando que tu pareja la revise' : 'Tienes una propuesta pendiente de revisar';
  if (status === 'closed') return 'Cerrada — mira el resultado';
  return 'Hay categorías por resolver'; // b_turn y cualquier estado viejo/desconocido
}

function escapeHtml(s) {
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}

function ddJoinNatural(names) {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

// Para invitados/ropa: son opciones alternativas (uno u otro), no un
// conjunto simultáneo — por eso se unen con "o", no con "y".
function ddJoinOptions(names) {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} o ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} o ${names[names.length - 1]}`;
}

function ddResolveTemplate(template, activityName, guestNames, outfitNames) {
  const guestsText = guestNames.length ? ddJoinOptions(guestNames) : '';
  const outfitsText = outfitNames.length ? ddJoinOptions(outfitNames) : '';
  let text = (template || DD_DEFAULT_NARRATIVE)
    .replace(/\{actividad\}/g, activityName || '')
    .replace(/\{invitados\}/g, guestsText)
    .replace(/\{ropa\}/g, outfitsText);

  // Quita líneas/oraciones que quedaron vacías (una etiqueta sin
  // reemplazo, ej. "Invitados posibles: .") en vez de dejar un hueco raro.
  text = text
    .split('\n')
    .filter(line => !/^[^:]*:\s*\.?\s*$/.test(line.trim()))
    .join('\n')
    .replace(/[^.!?\n]*:\s*\./g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,])/g, '$1')
    .trim();
  return text;
}

// ===== WIZARD DE CREACIÓN (Persona A) =====
function abrirDadoWizard() {
  dadoInjectStyles();
  dadoState = {
    step: 0, title: '',
    activities: [mkItem(), mkItem(), mkItem()],
    includeGuests: false,
    guests: [mkAssocItem(), mkAssocItem()],
    outfits: [mkAssocItem(), mkAssocItem(), mkAssocItem()],
  };
  renderDadoWizard();
}

function mkItem() { return { id: crypto.randomUUID(), name: '', narrativeTemplate: DD_DEFAULT_NARRATIVE }; }
function mkAssocItem() { return { id: crypto.randomUUID(), name: '', compatibleActivityIds: [] }; }

// ===== EDICIÓN (Persona A, solo mientras status === 'pending_review') =====
async function abrirDadoEdit(proposalId) {
  dadoInjectStyles();
  const gid = currentUserData.groupId;
  const packRef = db.collection('groups').doc(gid).collection('desirePacks').doc(proposalId);
  const [packSnap, actSnap, guestSnap, outfitSnap] = await Promise.all([
    packRef.get(),
    packRef.collection('activities').get(),
    packRef.collection('guests').get(),
    packRef.collection('outfits').get(),
  ]);
  const pack = packSnap.data();
  if (pack.status !== 'pending_review') { showToast('Ya no se puede editar — tu pareja ya empezó a jugar'); return; }

  const activities = actSnap.docs.map(d => ({ id: d.id, name: d.data().name, imageUrl: d.data().imageUrl || null, narrativeTemplate: d.data().narrativeTemplate || DD_DEFAULT_NARRATIVE }));
  const guests = guestSnap.docs.map(d => ({ id: d.id, name: d.data().name, compatibleActivityIds: d.data().compatibleActivities || [] }));
  const outfits = outfitSnap.docs.map(d => ({ id: d.id, name: d.data().name, compatibleActivityIds: d.data().compatibleActivities || [] }));

  dadoState = {
    step: 0, title: pack.title,
    activities: activities.length ? activities : [mkItem()],
    includeGuests: guests.length > 0,
    guests: guests.length ? guests : [mkAssocItem(), mkAssocItem()],
    outfits: outfits.length ? outfits : [mkAssocItem(), mkAssocItem(), mkAssocItem()],
    editingProposalId: proposalId, editingPackRef: packRef,
    originalIds: { activities: activities.map(a => a.id), guests: guests.map(g => g.id), outfits: outfits.map(o => o.id) },
  };
  renderDadoWizard();
}

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
  } else if (step === 'asociacion') {
    const acts = dadoState.activities.filter(a => a.name.trim());
    const outfits = dadoState.outfits.filter(o => o.name.trim());
    const guests = dadoState.includeGuests ? dadoState.guests.filter(g => g.name.trim()) : [];
    if (!acts.length) {
      body = `<div class="${ddCls('empty')}">Agrega actividades primero para poder asociarlas</div>`;
    } else {
      body = `
        <div class="${ddCls('label')}">¿En qué actividades aplica cada prenda?</div>
        <p style="font-size:12px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.5)' : 'var(--text2)'};margin-bottom:10px;">
          Si no marcas ninguna, se considera válida para todas.
        </p>
        ${outfits.map(o => dadoAssocBlock('outfits', o, acts)).join('') || `<div class="${ddCls('empty')}">Sin ropa cargada</div>`}
        ${guests.length ? `
          <div class="${ddCls('label')}" style="margin-top:18px;">¿Con qué actividades va cada invitado?</div>
          ${guests.map(g => dadoAssocBlock('guests', g, acts)).join('')}
        ` : ''}
      `;
    }
  } else if (step === 'imagenes') {
    const acts = dadoState.activities.filter(a => a.name.trim());
    body = `
      <div class="${ddCls('label')}">Imagen por actividad (opcional)</div>
      <p style="font-size:12px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.5)' : 'var(--text2)'};margin-bottom:4px;">
        Sin filtro automático de contenido todavía — usa buen criterio con lo que suban.
      </p>
      ${acts.map(a => dadoImageBlock(a)).join('') || `<div class="${ddCls('empty')}">Sin actividades</div>`}
    `;
  } else if (step === 'resumen') {
    const acts = dadoState.activities.filter(a => a.name.trim());
    body = `
      <div class="${ddCls('label')}">Cómo se va a leer cada actividad</div>
      <p style="font-size:12px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.5)' : 'var(--text2)'};margin-bottom:10px;">
        Puedes editar el texto libremente. Usa las etiquetas de abajo — se reemplazan solas por lo que ya asociaste.
      </p>
      ${acts.map(a => dadoNarrativeBlock(a)).join('') || `<div class="${ddCls('empty')}">Sin actividades</div>`}
    `;
  } else if (step === 'preview') {
    const acts = dadoState.activities.filter(a => a.name.trim());
    const guests = dadoState.includeGuests ? dadoState.guests.filter(g => g.name.trim()) : [];
    const outfits = dadoState.outfits.filter(o => o.name.trim());
    body = `
      <div class="${ddCls('cardFlat')}"><div class="${ddCls('heading')}" style="${ddHeadingStyle(18)}">${escapeHtml(dadoState.title) || '(sin título)'}</div></div>
      <div class="${ddCls('label')}">Así se va a leer cada actividad</div>
      ${acts.map(a => {
        const compGuests = guests.filter(g => !g.compatibleActivityIds?.length || g.compatibleActivityIds.includes(a.id)).map(g => g.name);
        const compOutfits = outfits.filter(o => !o.compatibleActivityIds?.length || o.compatibleActivityIds.includes(a.id)).map(o => o.name);
        return `<div class="${ddCls('cardFlat')}" style="padding:12px 14px;font-size:13px;line-height:1.5;white-space:pre-line;">${escapeHtml(ddResolveTemplate(a.narrativeTemplate, a.name, compGuests, compOutfits))}</div>`;
      }).join('') || `<div class="${ddCls('empty')}">Sin actividades</div>`}
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

function dadoAssocBlock(listName, item, activities) {
  return `
    <div class="${ddCls('cardFlat')}" style="margin-bottom:10px;">
      <div style="font-weight:600;margin-bottom:8px;color:${ddTheme() === 'comic' ? '#fff' : 'var(--text)'};">${escapeHtml(item.name)}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${activities.map(a => `
          <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.8)' : 'var(--text2)'};">
            <input type="checkbox" ${item.compatibleActivityIds.includes(a.id) ? 'checked' : ''}
              onchange="dadoToggleAssoc('${listName}','${item.id}','${a.id}')">
            ${escapeHtml(a.name)}
          </label>
        `).join('')}
      </div>
    </div>`;
}

function dadoToggleAssoc(listName, itemId, activityId) {
  const item = dadoState[listName].find(x => x.id === itemId);
  if (!item) return;
  const idx = item.compatibleActivityIds.indexOf(activityId);
  if (idx >= 0) item.compatibleActivityIds.splice(idx, 1);
  else item.compatibleActivityIds.push(activityId);
}

function dadoImageBlock(item) {
  const preview = item._localPreviewUrl || item.imageUrl;
  return `
    <div class="${ddCls('cardFlat')}" style="margin-bottom:10px;display:flex;gap:12px;align-items:center;">
      <div style="width:56px;height:56px;flex-shrink:0;border-radius:6px;overflow:hidden;background:${ddTheme() === 'comic' ? '#000' : 'var(--bg3)'};display:flex;align-items:center;justify-content:center;">
        ${preview ? `<img src="${preview}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:20px;opacity:.3;">🖼️</span>`}
      </div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;margin-bottom:6px;color:${ddTheme() === 'comic' ? '#fff' : 'var(--text)'};">${escapeHtml(item.name)}</div>
        <label class="${ddCls('btnOutline')}" style="font-size:11px;padding:6px 10px;display:inline-block;cursor:pointer;">
          ${preview ? 'Cambiar' : 'Subir imagen'}
          <input type="file" accept="image/*" style="display:none;" onchange="dadoPickImage('${item.id}', this)">
        </label>
      </div>
    </div>`;
}

function dadoPickImage(activityId, input) {
  const file = input.files[0];
  if (!file) return;
  const item = dadoState.activities.find(a => a.id === activityId);
  if (!item) return;
  item._imageFile = file;
  item._localPreviewUrl = URL.createObjectURL(file);
  renderDadoWizard();
}

// ===== RESUMEN NARRATIVO POR ACTIVIDAD =====
function ddCompatibleNamesFor(activityId) {
  const guestNames = dadoState.includeGuests
    ? dadoState.guests.filter(g => g.name.trim() && (!g.compatibleActivityIds?.length || g.compatibleActivityIds.includes(activityId))).map(g => g.name.trim())
    : [];
  const outfitNames = dadoState.outfits
    .filter(o => o.name.trim() && (!o.compatibleActivityIds?.length || o.compatibleActivityIds.includes(activityId)))
    .map(o => o.name.trim());
  return { guestNames, outfitNames };
}

function dadoNarrativeBlock(item) {
  const { guestNames, outfitNames } = ddCompatibleNamesFor(item.id);
  const preview = ddResolveTemplate(item.narrativeTemplate, item.name, guestNames, outfitNames);
  const tagBg = ddTheme() === 'comic' ? 'rgba(255,215,0,.15)' : 'var(--bg4)';
  const tagColor = ddTheme() === 'comic' ? '#ffd700' : 'var(--rose)';
  return `
    <div class="${ddCls('cardFlat')}" style="margin-bottom:14px;">
      <div style="font-weight:600;margin-bottom:8px;color:${ddTheme() === 'comic' ? '#fff' : 'var(--text)'};">${escapeHtml(item.name)}</div>
      <textarea id="dd-narr-${item.id}" class="${ddCls('input')}" rows="3" style="resize:vertical;font-size:13px;"
        oninput="dadoUpdateNarrative('${item.id}', this.value)">${escapeHtml(item.narrativeTemplate || DD_DEFAULT_NARRATIVE)}</textarea>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
        <span onclick="dadoInsertTag('${item.id}','{invitados}')" style="cursor:pointer;font-size:11px;background:${tagBg};color:${tagColor};padding:4px 10px;border-radius:12px;">+ {invitados}</span>
        <span onclick="dadoInsertTag('${item.id}','{ropa}')" style="cursor:pointer;font-size:11px;background:${tagBg};color:${tagColor};padding:4px 10px;border-radius:12px;">+ {ropa}</span>
        <span onclick="dadoInsertTag('${item.id}','{actividad}')" style="cursor:pointer;font-size:11px;background:${tagBg};color:${tagColor};padding:4px 10px;border-radius:12px;">+ {actividad}</span>
      </div>
      <p style="font-size:11px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.4)' : 'var(--text3)'};margin-top:6px;">
        Toca una etiqueta para insertarla donde tengas el cursor. Se reemplaza sola por lo que asociaste a esta actividad.
      </p>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid ${ddTheme() === 'comic' ? 'rgba(255,255,255,.1)' : 'var(--border)'};">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.4)' : 'var(--text3)'};margin-bottom:4px;">Así se ve</div>
        <div id="dd-narr-preview-${item.id}" style="font-size:13px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.85)' : 'var(--text2)'};line-height:1.5;white-space:pre-line;">${escapeHtml(preview)}</div>
      </div>
    </div>`;
}

function dadoUpdateNarrative(activityId, value) {
  const item = dadoState.activities.find(a => a.id === activityId);
  if (item) item.narrativeTemplate = value;
  const { guestNames, outfitNames } = ddCompatibleNamesFor(activityId);
  const previewEl = document.getElementById(`dd-narr-preview-${activityId}`);
  if (previewEl && item) previewEl.textContent = ddResolveTemplate(value, item.name, guestNames, outfitNames);
}

function dadoInsertTag(activityId, tag) {
  const ta = document.getElementById(`dd-narr-${activityId}`);
  if (!ta) return;
  const start = ta.selectionStart ?? ta.value.length;
  const end = ta.selectionEnd ?? ta.value.length;
  const newValue = ta.value.slice(0, start) + tag + ta.value.slice(end);
  ta.value = newValue;
  ta.focus();
  ta.selectionStart = ta.selectionEnd = start + tag.length;
  dadoUpdateNarrative(activityId, newValue);
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
  dadoState[listName].push(listName === 'activities' ? mkItem() : mkAssocItem());
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
  if (dadoState.editingProposalId) return editarDadoPack();

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

    // Pre-generar refs de actividades primero, para poder traducir los
    // IDs locales (usados en compatibleActivityIds) a los IDs reales
    // de Firestore antes de guardar Ropa/Invitados.
    const activityIdMap = {}; // local id -> firestore id
    const activityRefs = activities.map(a => {
      const ref = packRef.collection('activities').doc();
      activityIdMap[a.id] = ref.id;
      return { ref, data: a };
    });

    const batch = db.batch();
    activityRefs.forEach(({ ref, data }) => {
      batch.set(ref, { name: data.name.trim(), addedBy: uid, source: 'custom', narrativeTemplate: data.narrativeTemplate || DD_DEFAULT_NARRATIVE });
    });
    guests.forEach(g => {
      const ref = packRef.collection('guests').doc();
      const compatible = (g.compatibleActivityIds || []).map(localId => activityIdMap[localId]).filter(Boolean);
      batch.set(ref, { name: g.name.trim(), addedBy: uid, compatibleActivities: compatible });
    });
    outfits.forEach(o => {
      const ref = packRef.collection('outfits').doc();
      const compatible = (o.compatibleActivityIds || []).map(localId => activityIdMap[localId]).filter(Boolean);
      batch.set(ref, { name: o.name.trim(), addedBy: uid, compatibleActivities: compatible });
    });
    await batch.commit();

    await dadoUploadPendingImages(activityRefs, packRef.id);

    await notifyGroupMembers(gid, `🎲 Nueva propuesta: "${dadoState.title.trim()}"`);
    showToast('Propuesta enviada');
    showTab('dado');
  } catch (e) {
    console.error(e);
    showToast('Error al guardar la propuesta');
  }
}

async function dadoUploadPendingImages(activityRefs, packId) {
  const gid = currentUserData.groupId;
  const uploads = activityRefs
    .filter(({ data }) => data._imageFile)
    .map(async ({ ref, data }) => {
      try {
        const path = `groups/${gid}/desirePacks/${packId}/activities/${ref.id}.jpg`;
        const task = await storage.ref(path).put(data._imageFile);
        const url = await task.ref.getDownloadURL();
        await ref.update({ imageUrl: url });
      } catch (e) {
        console.error('Error subiendo imagen:', e);
      }
    });
  await Promise.all(uploads);
}

async function editarDadoPack() {
  const uid = currentUser.uid;
  const packRef = dadoState.editingPackRef;
  const activities = dadoState.activities.filter(a => a.name.trim());
  const guests = dadoState.includeGuests ? dadoState.guests.filter(g => g.name.trim()) : [];
  const outfits = dadoState.outfits.filter(o => o.name.trim());

  if (!activities.length) { showToast('Agrega al menos una actividad'); return; }

  const isNewId = (id, section) => !dadoState.originalIds[section].includes(id);

  try {
    const batch = db.batch();
    const activityIdMap = {}; // local/original id -> id real (igual para existentes)

    // Actividades: actualizar existentes, crear nuevas, borrar eliminadas
    activities.forEach(a => {
      if (isNewId(a.id, 'activities')) {
        const ref = packRef.collection('activities').doc();
        activityIdMap[a.id] = ref.id;
        batch.set(ref, { name: a.name.trim(), addedBy: uid, source: 'custom', narrativeTemplate: a.narrativeTemplate || DD_DEFAULT_NARRATIVE });
      } else {
        activityIdMap[a.id] = a.id;
        batch.update(packRef.collection('activities').doc(a.id), { name: a.name.trim(), narrativeTemplate: a.narrativeTemplate || DD_DEFAULT_NARRATIVE });
      }
    });
    const keptActivityIds = activities.map(a => a.id);
    dadoState.originalIds.activities.filter(id => !keptActivityIds.includes(id)).forEach(id => {
      batch.delete(packRef.collection('activities').doc(id));
    });

    function syncSection(section, items, keptOriginal) {
      items.forEach(it => {
        const compatible = (it.compatibleActivityIds || []).map(id => activityIdMap[id] || id).filter(Boolean);
        if (isNewId(it.id, section)) {
          const ref = packRef.collection(section).doc();
          batch.set(ref, { name: it.name.trim(), addedBy: uid, compatibleActivities: compatible });
        } else {
          batch.update(packRef.collection(section).doc(it.id), { name: it.name.trim(), compatibleActivities: compatible });
        }
      });
      const keptIds = items.map(i => i.id);
      dadoState.originalIds[section].filter(id => !keptIds.includes(id)).forEach(id => {
        batch.delete(packRef.collection(section).doc(id));
      });
    }
    syncSection('guests', guests);
    syncSection('outfits', outfits);

    batch.update(packRef, { title: dadoState.title.trim() });
    await batch.commit();

    const activityRefsForImages = activities.map(a => ({ ref: packRef.collection('activities').doc(activityIdMap[a.id]), data: a }));
    await dadoUploadPendingImages(activityRefsForImages, packRef.id);

    showToast('Propuesta actualizada');
    abrirDadoDetalle(dadoState.editingProposalId);
  } catch (e) {
    console.error(e);
    showToast('Error al actualizar la propuesta');
  }
}

// ===== DETALLE / RECEPCIÓN (Persona B) =====
// NOTA: cubre la estructura base — agregar opciones, reparto de
// categorías y tirada de dado quedan con las validaciones clave
// aplicadas en el cliente (actividad primero, máx. 2 de 3 secciones,
// nunca 3 de 3 para quien recibe). Punto de partida funcional,
// conviene probarlo a fondo antes de confiar en todos los casos borde.

let dadoPreso = null;

async function ddGetCoupleImageUrl() {
  const gid = currentUserData.groupId;
  try {
    return await storage.ref(`groups/${gid}/dadoConfig/pareja.jpg`).getDownloadURL();
  } catch (e) {
    try {
      return await storage.ref('defaults/pareja.jpg').getDownloadURL();
    } catch (e2) {
      return null;
    }
  }
}

async function abrirDadoDetalle(proposalId) {
  dadoInjectStyles();
  const gid = currentUserData.groupId;
  const packRef = db.collection('groups').doc(gid).collection('desirePacks').doc(proposalId);
  const packSnap = await packRef.get();
  const pack = packSnap.data();

  // Ya se vivió la presentación completa una vez (quedó en b_turn o
  // closed) — ir directo a resolver o al resultado, sin repetir el show.
  // Cualquier estado que no sea "recién enviada" salta directo a resolver
  // (cubre b_turn, closed, y también a_turn de propuestas de prueba viejas).
  if (pack.status !== 'pending_review') {
    renderDadoResolve(proposalId);
    return;
  }
  const isCreator = pack.createdBy === currentUser.uid;

  const [actSnap, guestSnap, outfitSnap] = await Promise.all([
    packRef.collection('activities').get(),
    packRef.collection('guests').get(),
    packRef.collection('outfits').get(),
  ]);
  const activities = actSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const guests = guestSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const outfits = outfitSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const coupleImageUrl = await ddGetCoupleImageUrl();

  // Slides: 1 portada + 1 pareja + 1 por actividad + 1 de reglas al final.
  const slides = [
    { type: 'cover', title: pack.title },
    { type: 'pareja', imageUrl: coupleImageUrl },
    ...activities.map(a => ({
      type: 'activity',
      name: a.name,
      imageUrl: a.imageUrl,
      narrativeTemplate: a.narrativeTemplate || DD_DEFAULT_NARRATIVE,
      compatibleGuests: guests.filter(g => !g.compatibleActivities?.length || g.compatibleActivities.includes(a.id)),
      compatibleOutfits: outfits.filter(o => !o.compatibleActivities?.length || o.compatibleActivities.includes(a.id)),
    })),
    { type: 'reglas', guests, outfits, isCreator, status: pack.status },
  ];

  dadoPreso = { proposalId, pack, isCreator, activities, guests, outfits, slides, index: 0 };
  renderDadoPresoSlide();
}

function ddSlideTapZones(onPrev, onNext) {
  return `
    <div style="position:absolute;top:0;left:0;width:35%;height:100%;z-index:2;" onclick="${onPrev}"></div>
    <div style="position:absolute;top:0;right:0;width:65%;height:100%;z-index:2;" onclick="${onNext}"></div>
  `;
}

function renderDadoPresoSlide() {
  const p = dadoPreso;
  const slide = p.slides[p.index];
  const isLast = p.index === p.slides.length - 1;
  const bg = ddTheme() === 'comic' ? '#050a1b' : 'var(--bg)';

  const dots = `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;position:relative;z-index:4;">
      <button onclick="showTab('dado')" style="background:rgba(0,0,0,.4);border:none;color:#fff;width:26px;height:26px;border-radius:50%;flex-shrink:0;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>
      <div style="display:flex;gap:4px;flex:1;">
        ${p.slides.map((s, i) => `<div style="flex:1;height:3px;border-radius:2px;background:${i <= p.index ? (ddTheme() === 'comic' ? '#ffd700' : 'var(--rose)') : 'rgba(255,255,255,.2)'};"></div>`).join('')}
      </div>
    </div>`;

  let inner = '';
  if (slide.type === 'cover') {
    const introColor = ddTheme() === 'comic' ? 'rgba(255,255,255,.75)' : 'var(--text2)';
    inner = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:24px;">
        ${ddCls('tag') ? `<span class="${ddCls('tag')}">Propuesta</span>` : ''}
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(30)}margin-top:14px;">${escapeHtml(slide.title)}</div>
        <p style="color:${introColor};font-size:14px;line-height:1.6;margin-top:14px;max-width:290px;">
          Esta propuesta no es una sola — son varias, esperando ser descubiertas. Avanza, desliza, y deja que cada una encienda algo distinto en ustedes.
        </p>
      </div>`;
  } else if (slide.type === 'pareja') {
    inner = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:24px;">
        ${slide.imageUrl
          ? `<img src="${slide.imageUrl}" style="width:100%;max-width:280px;max-height:260px;object-fit:cover;border-radius:10px;margin-bottom:14px;">`
          : `<div style="font-size:56px;margin-bottom:14px;">💞</div>`}
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(22)}">Ustedes dos</div>
        <p style="color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.7)' : 'var(--text2)'};font-size:14px;margin-top:8px;line-height:1.5;max-width:280px;">
          Algo se está encendiendo esta noche. Lo que viene es solo de ustedes — con la suerte como cómplice.
        </p>
      </div>`;
  } else if (slide.type === 'activity') {
    const narrativeColor = ddTheme() === 'comic' ? 'rgba(255,255,255,.8)' : 'var(--text2)';
    inner = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:24px;">
        ${slide.imageUrl
          ? `<img src="${slide.imageUrl}" style="width:100%;max-width:280px;border-radius:10px;margin-bottom:14px;object-fit:cover;max-height:260px;">`
          : `<div style="font-size:56px;margin-bottom:14px;">🎲</div>`}
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(22)}margin-bottom:8px;">${escapeHtml(slide.name)}</div>
        <p style="font-size:14px;line-height:1.6;color:${narrativeColor};max-width:320px;white-space:pre-line;">
          ${escapeHtml(ddResolveTemplate(slide.narrativeTemplate, slide.name, slide.compatibleGuests.map(g => g.name), slide.compatibleOutfits.map(o => o.name)))}
        </p>
      </div>`;
  } else if (slide.type === 'reglas') {
    const stepColor = ddTheme() === 'comic' ? 'rgba(255,255,255,.85)' : 'var(--text)';
    const stepSub = ddTheme() === 'comic' ? 'rgba(255,255,255,.55)' : 'var(--text2)';
    const stepBg = ddTheme() === 'comic' ? 'rgba(255,255,255,.05)' : 'var(--bg3)';
    const ruleStep = (icon, title, sub) => `
      <div style="display:flex;align-items:center;gap:12px;background:${stepBg};border-radius:10px;padding:10px 12px;margin-bottom:8px;">
        <div style="font-size:24px;flex-shrink:0;width:32px;text-align:center;">${icon}</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:${stepColor};">${title}</div>
          <div style="font-size:11px;color:${stepSub};margin-top:2px;">${sub}</div>
        </div>
      </div>`;
    inner = `
      <div style="height:100%;overflow-y:auto;padding:22px;">
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(18)}margin-bottom:14px;text-align:center;">Así funciona</div>
        ${ruleStep('✏️', 'Agrega si quieres', 'Puedes sumar opciones en 2 de las 3 categorías')}
        ${ruleStep('🔒', 'Donde agregas, no eliges', 'Esa categoría la resuelve la Suerte o tu pareja')}
        ${ruleStep('1️⃣', 'La actividad va primero', 'Ropa e Invitado dependen de qué actividad salga')}
        ${ruleStep('🎲', 'La suerte decide el resto', 'Un dado resuelve lo que no elijan ustedes')}
        <div class="${ddCls('cardFlat')}" style="margin-top:14px;text-align:center;">
          ${dadoStatusLabel(slide.status, slide.isCreator)}
        </div>
      </div>`;
  }

  const actions = `
    ${p.isCreator && p.pack.status === 'pending_review' ? `<button class="${ddCls('btnOutline')} ${ddCls('btnFull')}" style="margin-top:10px;" onclick="abrirDadoEdit('${p.proposalId}')">✏️ Editar propuesta</button>` : ''}
    ${!p.isCreator && p.pack.status === 'pending_review' ? `<button class="${ddCls('btnPrimary')} ${ddCls('btnFull')}" style="margin-top:10px;" onclick="renderDadoReview('${p.proposalId}')">Continuar</button>` : ''}
    ${p.pack.status === 'b_turn' ? `<button class="${ddCls('btnPrimary')} ${ddCls('btnFull')}" style="margin-top:10px;" onclick="renderDadoResolve('${p.proposalId}')">Seguir resolviendo</button>` : ''}
    ${p.pack.status === 'closed' ? `<button class="${ddCls('btnPrimary')} ${ddCls('btnFull')}" style="margin-top:10px;" onclick="renderDadoResolve('${p.proposalId}')">Ver resultado</button>` : ''}
    <button class="${ddCls('btnOutline')} ${ddCls('btnFull')}" style="margin-top:8px;" onclick="showTab('dado')">Volver</button>
  `;

  document.getElementById('content').innerHTML = `
    <div class="${ddCls('wrap')}">
      <div style="position:relative;min-height:420px;border-radius:12px;overflow:visible;background:${bg};${ddTheme() === 'comic' ? 'border:3px solid #000;box-shadow:5px 5px 0px #ffd700;' : 'border:1px solid var(--border);'}">
        ${dots}
        ${ddSlideTapZones('dadoPresoPrev()', 'dadoPresoNext()')}
        <div style="height:calc(100% - 30px);">${inner}</div>
      </div>
      ${isLast ? actions : `
        <div style="text-align:center;margin-top:10px;font-size:12px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.4)' : 'var(--text3)'};">toca para avanzar →</div>
      `}
    </div>
  `;
}

function dadoPresoNext() {
  if (dadoPreso.index < dadoPreso.slides.length - 1) dadoPreso.index++;
  renderDadoPresoSlide();
}
function dadoPresoPrev() {
  if (dadoPreso.index > 0) dadoPreso.index--;
  renderDadoPresoSlide();
}

async function dadoUploadCoupleImage(input) {
  const file = input.files[0];
  if (!file) return;
  const gid = currentUserData.groupId;
  try {
    showToast('Subiendo imagen...');
    await storage.ref(`groups/${gid}/dadoConfig/pareja.jpg`).put(file);
    showToast('Imagen de pareja actualizada');
  } catch (e) {
    console.error(e);
    showToast('Error al subir la imagen');
  }
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
  const selfCount = ['activity', 'guest', 'outfit'].filter(c => next[c] === 'b').length;
  if (selfCount > 1) {
    showToast('Solo puedes elegir para ti una categoría — el resto va a tu pareja o a la Suerte');
    return;
  }
  dadoReview.assignment = next;
  renderDadoReviewScreen();
}

function ddReviewIsValid() {
  const a = dadoReview.assignment;
  if (!a.activity || !a.guest || !a.outfit) return false;
  const selfCount = ['activity', 'guest', 'outfit'].filter(c => a[c] === 'b').length;
  if (selfCount > 1) return false;
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

// ===== RESOLUCIÓN / EL DADO =====
// Regla dura: Actividad se resuelve SIEMPRE primero (manual o por
// suerte) — Ropa/Invitado no se pueden tocar ni mostrar como
// disponibles hasta que activityResult exista, porque se filtran por
// compatibilidad con la actividad ya fija.

let dadoResolveCtx = null;

async function renderDadoResolve(proposalId) {
  const gid = currentUserData.groupId;
  const packRef = db.collection('groups').doc(gid).collection('desirePacks').doc(proposalId);
  const [packSnap, resSnap, actSnap, guestSnap, outfitSnap] = await Promise.all([
    packRef.get(),
    packRef.collection('resolution').doc('state').get(),
    packRef.collection('activities').get(),
    packRef.collection('guests').get(),
    packRef.collection('outfits').get(),
  ]);

  dadoResolveCtx = {
    proposalId, packRef,
    pack: packSnap.data(),
    resolution: resSnap.data(),
    activities: actSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    guests: guestSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    outfits: outfitSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  };

  if (dadoResolveCtx.pack.status === 'closed') { renderDadoReveal(dadoResolveCtx); return; }
  renderDadoResolveScreen();
}

function ddMyRole() {
  return currentUser.uid === dadoResolveCtx.pack.createdBy ? 'a' : 'b';
}

function ddCategoryLabel(cat) { return { activity: 'Actividad', guest: 'Invitado', outfit: 'Ropa' }[cat]; }

function ddResolvedName(cat, id) {
  if (!id) return null;
  const list = cat === 'activity' ? dadoResolveCtx.activities : cat === 'guest' ? dadoResolveCtx.guests : dadoResolveCtx.outfits;
  const item = list.find(i => i.id === id);
  return item ? item.name : '(eliminado)';
}

function ddResolvedImage(cat, id) {
  if (!id || cat !== 'activity') return null;
  const item = dadoResolveCtx.activities.find(i => i.id === id);
  return item ? item.imageUrl : null;
}

function ddCanActOnCategory(cat) {
  const res = dadoResolveCtx.resolution;
  const assignedTo = res[`${cat}AssignedTo`];
  const already = res[`${cat}Result`];
  if (already) return false;
  if (cat !== 'activity' && !res.activityResult) return false; // regla dura: actividad primero
  if (assignedTo === 'luck') return ddMyRole() === 'b'; // solo quien recibe la propuesta tira el dado — nadie puede acusar de trampa
  return assignedTo === ddMyRole();
}

function renderDadoResolveScreen() {
  const ctx = dadoResolveCtx;
  const res = ctx.resolution;
  const cats = ['activity', 'guest', 'outfit'];

  const rows = cats.map(cat => {
    const assignedTo = res[`${cat}AssignedTo`];
    const result = res[`${cat}Result`];
    const resolvedName = ddResolvedName(cat, result);
    const canAct = ddCanActOnCategory(cat);
    const blockedByActivity = cat !== 'activity' && !res.activityResult;

    let actionHtml = '';
    if (resolvedName) {
      actionHtml = `<div style="color:${ddTheme() === 'comic' ? '#ffd700' : 'var(--rose)'};font-weight:600;">${escapeHtml(resolvedName)} ✓</div>`;
    } else if (blockedByActivity) {
      actionHtml = `<div style="font-size:12px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.4)' : 'var(--text3)'};">Se resuelve después de la Actividad</div>`;
    } else if (!canAct) {
      actionHtml = `<div style="font-size:12px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.4)' : 'var(--text3)'};">${assignedTo === 'luck' ? 'Le toca tirar el dado a quien recibió la propuesta' : `Le toca a ${assignedTo === ddMyRole() ? 'ti' : 'tu pareja'}`}</div>`;
    } else if (assignedTo === 'luck') {
      actionHtml = `<button class="${ddCls('btnDanger')}" onclick="ddRollDice('${cat}')">🎲 Lanzar el dado</button>`;
    } else {
      const list = cat === 'activity' ? ctx.activities : cat === 'guest' ? ctx.guests : ctx.outfits;
      const compatible = cat === 'activity' ? list : list.filter(i => !i.compatibleActivities?.length || i.compatibleActivities.includes(res.activityResult));
      actionHtml = `
        <select class="${ddCls('input')}" id="dd-select-${cat}">
          <option value="">Elegir...</option>
          ${compatible.map(i => `<option value="${i.id}">${escapeHtml(i.name)}</option>`).join('')}
        </select>
        <button class="${ddCls('btnPrimary')}" style="margin-top:6px;" onclick="ddConfirmManual('${cat}')">Confirmar</button>
      `;
    }

    return `
      <div class="${ddCls('cardFlat')}" style="margin-bottom:12px;" id="dd-row-${cat}">
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(14)}margin-bottom:8px;">${ddCategoryLabel(cat)}</div>
        ${actionHtml}
      </div>
    `;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="${ddCls('wrap')}">
      <div class="${ddCls('cardFlat')}" style="margin-bottom:14px;">
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(18)}">${escapeHtml(ctx.pack.title)}</div>
      </div>
      ${rows}
      <button class="${ddCls('btnOutline')} ${ddCls('btnFull')}" onclick="showTab('dado')">Volver más tarde</button>
    </div>
  `;
}

async function ddConfirmManual(cat) {
  const select = document.getElementById(`dd-select-${cat}`);
  const chosenId = select.value;
  if (!chosenId) { showToast('Elige una opción'); return; }
  await ddResolveCategory(cat, chosenId);
}

async function ddRollDice(cat) {
  const ctx = dadoResolveCtx;
  const res = ctx.resolution;
  const list = cat === 'activity' ? ctx.activities : cat === 'guest' ? ctx.guests : ctx.outfits;
  const compatible = cat === 'activity' ? list : list.filter(i => !i.compatibleActivities?.length || i.compatibleActivities.includes(res.activityResult));

  if (!compatible.length) { showToast('No hay opciones disponibles para sortear'); return; }

  // Animación breve de "tirada" antes de mostrar el resultado
  const row = document.getElementById(`dd-row-${cat}`);
  const original = row.innerHTML;
  let i = 0;
  const spin = setInterval(() => {
    const pick = compatible[Math.floor(Math.random() * compatible.length)];
    const heading = row.querySelector(`.${ddCls('heading').split(' ')[0]}`);
    row.innerHTML = `<div class="${ddCls('heading')}" style="${ddHeadingStyle(14)}margin-bottom:8px;">${ddCategoryLabel(cat)}</div>
      <div style="font-size:18px;opacity:.6;">🎲 ${escapeHtml(pick.name)}</div>`;
    i++;
  }, 90);

  await new Promise(r => setTimeout(r, 900));
  clearInterval(spin);

  const finalPick = compatible[Math.floor(Math.random() * compatible.length)];
  await ddResolveCategory(cat, finalPick.id);
}

async function ddResolveCategory(cat, chosenId) {
  const ctx = dadoResolveCtx;
  try {
    await ctx.packRef.collection('resolution').doc('state').update({ [`${cat}Result`]: chosenId });
    ctx.resolution[`${cat}Result`] = chosenId;

    // Recalcular si ya están las 3
    const done = ['activity', 'guest', 'outfit'].every(c => ctx.resolution[`${c}Result`]);
    if (!done && cat === 'activity') {
      // Resolver la Actividad desbloquea todo lo demás — avisar al otro.
      await notifyGroupMembers(currentUserData.groupId, `🎲 Ya se resolvió la actividad de "${ctx.pack.title}" — sigue el resto`);
    }
    if (done) {
      await ctx.packRef.update({ status: 'closed' });
      await guardarDadoHistorial(ctx);
      await notifyGroupMembers(currentUserData.groupId, `🎉 "${ctx.pack.title}" está lista — mira el resultado`);
      renderDadoReveal(ctx);
      return;
    }

    renderDadoResolveScreen();
  } catch (e) {
    console.error(e);
    showToast('Error al resolver');
  }
}

async function guardarDadoHistorial(ctx) {
  const gid = currentUserData.groupId;
  await db.collection('groups').doc(gid).collection('desireHistory').add({
    proposalId: ctx.proposalId,
    title: ctx.pack.title,
    finalActivity: ddResolvedName('activity', ctx.resolution.activityResult),
    finalGuest: ddResolvedName('guest', ctx.resolution.guestResult),
    finalOutfit: ddResolvedName('outfit', ctx.resolution.outfitResult),
    closedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }).catch(e => console.error('Error guardando histórico:', e));
}

// ===== REVEAL =====
let dadoRevealPreso = null;

async function renderDadoReveal(ctx) {
  const res = ctx.resolution;
  const coupleImageUrl = await ddGetCoupleImageUrl();

  dadoRevealPreso = {
    index: 0,
    slides: [
      { type: 'reveal-activity', name: ddResolvedName('activity', res.activityResult), imageUrl: ddResolvedImage('activity', res.activityResult) },
      { type: 'reveal-guest', name: ddResolvedName('guest', res.guestResult) },
      { type: 'reveal-outfit', name: ddResolvedName('outfit', res.outfitResult) },
      { type: 'reveal-closing', imageUrl: coupleImageUrl, title: ctx.pack.title },
    ],
  };
  renderDadoRevealSlide();
}

function renderDadoRevealSlide() {
  const p = dadoRevealPreso;
  const slide = p.slides[p.index];
  const isLast = p.index === p.slides.length - 1;
  const bg = ddTheme() === 'comic' ? '#050a1b' : 'var(--bg)';
  const sub = ddTheme() === 'comic' ? 'rgba(255,255,255,.6)' : 'var(--text2)';

  const dots = `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;position:relative;z-index:4;">
      <button onclick="showTab('dado')" style="background:rgba(0,0,0,.4);border:none;color:#fff;width:26px;height:26px;border-radius:50%;flex-shrink:0;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>
      <div style="display:flex;gap:4px;flex:1;">
        ${p.slides.map((s, i) => `<div style="flex:1;height:3px;border-radius:2px;background:${i <= p.index ? (ddTheme() === 'comic' ? '#ffd700' : 'var(--rose)') : 'rgba(255,255,255,.2)'};"></div>`).join('')}
      </div>
    </div>`;

  let inner = '';
  if (slide.type === 'reveal-activity') {
    inner = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:24px;">
        <div class="${ddCls('label')}" style="margin-bottom:10px;">La actividad elegida es</div>
        ${slide.imageUrl ? `<img src="${slide.imageUrl}" style="width:100%;max-width:280px;max-height:260px;object-fit:cover;border-radius:10px;margin-bottom:14px;">` : `<div style="font-size:56px;margin-bottom:14px;">🎲</div>`}
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(26)}">${escapeHtml(slide.name)}</div>
      </div>`;
  } else if (slide.type === 'reveal-guest') {
    inner = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:24px;">
        <div style="font-size:56px;margin-bottom:14px;">👥</div>
        <div class="${ddCls('label')}" style="margin-bottom:8px;">Invitado</div>
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(22)}">${escapeHtml(slide.name || 'Solo pareja')}</div>
      </div>`;
  } else if (slide.type === 'reveal-outfit') {
    inner = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:24px;">
        <div style="font-size:56px;margin-bottom:14px;">👗</div>
        <div class="${ddCls('label')}" style="margin-bottom:8px;">Ropa</div>
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(22)}">${escapeHtml(slide.name || '—')}</div>
      </div>`;
  } else if (slide.type === 'reveal-closing') {
    inner = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:24px;">
        ${slide.imageUrl
          ? `<img src="${slide.imageUrl}" style="width:100%;max-width:280px;max-height:260px;object-fit:cover;border-radius:10px;margin-bottom:14px;">`
          : `<div style="font-size:56px;margin-bottom:14px;">💞</div>`}
        <div class="${ddCls('heading')}" style="${ddHeadingStyle(22)}">Que lo disfruten</div>
        <p style="color:${sub};font-size:13px;margin-top:6px;">${escapeHtml(slide.title)}</p>
      </div>`;
  }

  document.getElementById('content').innerHTML = `
    <div class="${ddCls('wrap')}">
      <div style="position:relative;min-height:420px;border-radius:12px;overflow:visible;background:${bg};${ddTheme() === 'comic' ? 'border:3px solid #000;box-shadow:5px 5px 0px #ffd700;' : 'border:1px solid var(--border);'}">
        ${dots}
        ${ddSlideTapZones('dadoRevealPrev()', 'dadoRevealNext()')}
        <div style="height:calc(100% - 30px);">${inner}</div>
      </div>
      ${isLast
        ? `<button class="${ddCls('btnPrimary')} ${ddCls('btnFull')}" style="margin-top:14px;" onclick="showTab('dado')">Volver</button>`
        : `<div style="text-align:center;margin-top:10px;font-size:12px;color:${ddTheme() === 'comic' ? 'rgba(255,255,255,.4)' : 'var(--text3)'};">toca para avanzar →</div>`}
    </div>
  `;
}

function dadoRevealNext() {
  if (dadoRevealPreso.index < dadoRevealPreso.slides.length - 1) dadoRevealPreso.index++;
  renderDadoRevealSlide();
}
function dadoRevealPrev() {
  if (dadoRevealPreso.index > 0) dadoRevealPreso.index--;
  renderDadoRevealSlide();
}
