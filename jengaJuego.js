// ===== TORRE DEL DESEO — jengaJuego.js =====
// Juego independiente, contenido propio (no reutiliza Acciones/Deseos
// ni el Dado del Deseo). Contenido parametrizable desde Firestore
// (colección jengaCatalog en Firestore, parametrizable desde la
// consola de Firebase), con niveles de dificultad Básico/Medio/Hard: Medio y Hard
// requieren suscripción, igual criterio que Verdad o Reto.
// Reutiliza: db, currentUser, currentUserData, showTab(), showToast(),
// notifyGroupMembers(). No usa Cloud Functions — misma postura de
// seguridad que el resto de Ignite (validación en cliente).

function jgEsc(s) {
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}

function jgInjectStyles() {
  if (document.getElementById('jg-styles')) return;
  const style = document.createElement('style');
  style.id = 'jg-styles';
  style.textContent = `
    @keyframes jg-shake { 0%,100% { transform: translateX(0) rotate(0deg); } 25% { transform: translateX(-2px) rotate(-0.4deg); } 75% { transform: translateX(2px) rotate(0.4deg); } }
    @keyframes jg-pull-h { to { transform: translateX(120px); opacity: 0; } }
    @keyframes jg-pull-v { to { transform: translateY(-40px); opacity: 0; } }
    @keyframes jg-pop { from { transform: scale(.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .jg-tower { display: flex; flex-direction: column-reverse; align-items: center; gap: 3px; padding: 20px 0; }
    .jg-tower.jg-wobbly { animation: jg-shake 2.4s ease-in-out infinite; }
    .jg-layer { display: flex; gap: 3px; }
    .jg-layer.jg-vert { flex-direction: row; }
    .jg-block {
      width: 26px; height: 64px; border-radius: 4px;
      background: linear-gradient(135deg, var(--fire), var(--rose));
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,.3);
      transition: transform .15s, box-shadow .15s;
    }
    .jg-layer.jg-horiz .jg-block { width: 64px; height: 26px; }
    .jg-block:active { transform: scale(.94); }
    .jg-block.jg-pulled { background: var(--bg3); box-shadow: none; opacity: .25; cursor: default; }
    .jg-block.jg-disabled { opacity: .4; cursor: not-allowed; }
    .jg-block.jg-pulling-h { animation: jg-pull-h .4s forwards; }
    .jg-block.jg-pulling-v { animation: jg-pull-v .4s forwards; }
    .jg-reveal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; }
    .jg-reveal-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px; max-width: 320px; text-align: center; animation: jg-pop .25s ease; }
    .jg-level-card { border: 2px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 10px; cursor: pointer; }
    .jg-level-card.jg-locked { opacity: .6; }
  `;
  document.head.appendChild(style);
}

// ===== SEED — solo se usa una vez, si el catálogo en Firestore está
// vacío, para poblarlo la primera vez. Después de eso, el contenido
// real vive en Firestore (jengaCatalog) y es parametrizable
// desde ahí (por ahora, editable manualmente en la consola de
// Firebase — sin mantenedor visual todavía).
const JENGA_SEED = {
  basico: [
    { text: 'Besa su cuello 10 segundos', icon: '💋' },
    { text: 'Susúrrale algo al oído', icon: '👂' },
    { text: 'Baila 30 segundos juntos', icon: '💃' },
    { text: 'Mírense a los ojos 1 min', icon: '👀' },
    { text: 'Abrázalo por la espalda', icon: '🫂' },
    { text: 'Elogia una parte de su cuerpo', icon: '✨' },
    { text: 'Recorre su brazo con un dedo', icon: '✋' },
    { text: 'Cuéntale qué te atrajo de él/ella', icon: '💭' },
    { text: 'Haz un cumplido sensual', icon: '🌹' },
    { text: 'Acércate y no digas nada', icon: '🤫' },
    { text: 'Regálale un masaje de hombros', icon: '💆' },
    { text: 'Comparte tu recuerdo favorito juntos', icon: '📸' },
    { text: 'Haz que se sonroje', icon: '😳' },
    { text: 'Dile algo que te encienda', icon: '😏' },
    { text: 'Bésense sin usar las manos', icon: '💏' },
    { text: 'Cuéntale una fantasía', icon: '🔥' },
    { text: 'Masajea sus manos', icon: '🤲' },
    { text: 'Dile tu deseo para esta noche', icon: '🌙' },
  ],
  medio: [
    { text: 'Quítale una prenda (a tu ritmo)', icon: '👕' },
    { text: 'Muerde suavemente su labio', icon: '👄' },
    { text: 'Bésalo donde él/ella elija', icon: '💫' },
    { text: 'Dile qué quieres que pase después', icon: '🎯' },
    { text: 'Susúrrale tu fantasía más atrevida', icon: '🔥' },
    { text: 'Deja que te desnude un poco', icon: '😏' },
    { text: 'Recorre su cuerpo con los labios 10 seg', icon: '💋' },
    { text: 'Pídele que te desabroche algo, despacio', icon: '🖐️' },
    { text: 'Dile qué parte tuya le gusta más tocar', icon: '💭' },
    { text: 'Siéntate en su regazo un minuto', icon: '🪑' },
    { text: 'Deja que elija dónde besarte', icon: '💏' },
    { text: 'Cuéntale tu posición favorita', icon: '🌙' },
    { text: 'Acaríciale por debajo de la ropa', icon: '✋' },
    { text: 'Haz que adivine qué llevas puesto debajo', icon: '🎲' },
  ],
  hard: [
    { text: 'Haz un striptease de 30 segundos', icon: '💃' },
    { text: 'Cuéntale qué quieres que te haga', icon: '🌶️' },
    { text: 'Deja que decida qué prenda se queda puesta', icon: '👗' },
    { text: 'Quítate una prenda y no la recuperes hasta el final', icon: '🔥' },
    { text: 'Deja que marque el ritmo los próximos 5 minutos', icon: '⏱️' },
    { text: 'Represéntale tu fantasía favorita con gestos', icon: '🎭' },
    { text: 'Susúrrale exactamente qué quieres ahora mismo', icon: '🌡️' },
    { text: 'Deja que elija tu "castigo" si pierdes la próxima ronda', icon: '😈' },
    { text: 'Hazle una promesa atrevida para más tarde esta noche', icon: '🌙' },
    { text: 'Deja que sea quien decida cuándo parar esta ronda', icon: '🔓' },
  ],
};

// Nota: el catálogo en Firestore solo lo puede escribir un superadmin
// (ver firestore.rules). No hay siembra automática desde el cliente —
// mientras no lo pobles manualmente en la consola de Firebase, el
// juego usa este contenido local como respaldo, para que funcione
// igual desde el día uno.
async function jgGetCatalog(level) {
  const snap = await db.collection('jengaCatalog')
    .where('level', '==', level).where('active', '==', true).get();
  if (!snap.empty) return snap.docs.map(d => d.data());
  return JENGA_SEED[level] || [];
}

function jgHasAccess(level) {
  if (level === 'basico') return true;
  const tier = currentUserData?.subscriptionTier || 'basico';
  return tier === 'premium' || tier === 'premium_plus';
}

// ===== ENTRADA =====
async function renderJenga() {
  jgInjectStyles();
  const gid = currentUserData?.groupId;
  const content = document.getElementById('content');
  if (!gid) { content.innerHTML = '<div class="empty-state">Sin grupo activo</div>'; return; }

  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const stateRef = db.collection('groups').doc(gid).collection('jengaState').doc('current');
  const stateSnap = await stateRef.get();

  if (!stateSnap.exists) {
    jgRenderLevelPicker(gid, stateRef);
    return;
  }

  jgRenderTorre(stateSnap.data(), stateRef);
}

// ===== SELECTOR DE NIVEL =====
function jgRenderLevelPicker(gid, stateRef) {
  const content = document.getElementById('content');
  const levels = [
    { key: 'basico', label: 'Básico', desc: 'Cariñoso y juguetón' },
    { key: 'medio', label: 'Medio', desc: 'Sube la temperatura' },
    { key: 'hard', label: 'Hard', desc: 'Sin filtros' },
  ];

  content.innerHTML = `
    <div class="card" style="text-align:center;margin-bottom:14px;">
      <div class="form-label">🏗️ Torre del Deseo</div>
      <p style="color:var(--text2);font-size:13px;margin-top:6px;">Elige el nivel de la torre</p>
    </div>
    ${levels.map(l => {
      const locked = !jgHasAccess(l.key);
      return `
        <div class="jg-level-card ${locked ? 'jg-locked' : ''}" onclick="${locked ? `showToast('Disponible en Premium')` : `jgIniciarTorre('${gid}', '${l.key}')`}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-family:var(--font-display);font-size:18px;">${l.label} ${locked ? '🔒' : ''}</div>
              <div style="color:var(--text2);font-size:12px;">${l.desc}</div>
            </div>
            ${locked ? '<span style="font-size:11px;color:var(--rose);">Premium</span>' : '<span style="color:var(--rose);">→</span>'}
          </div>
        </div>
      `;
    }).join('')}
    <button class="btn btn-outline btn-full" style="margin-top:8px;" onclick="showTab('inicio')">Volver</button>
  `;
}

async function jgIniciarTorre(gid, level) {
  const stateRef = db.collection('groups').doc(gid).collection('jengaState').doc('current');
  await jgCrearTorreNueva(gid, stateRef, level);
  const stateSnap = await stateRef.get();
  jgRenderTorre(stateSnap.data(), stateRef);
}

// ===== GENERAR TORRE =====
async function jgCrearTorreNueva(gid, stateRef, level) {
  const pool = await jgGetCatalog(level);
  if (!pool.length) { showToast('No hay contenido cargado para este nivel'); return; }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const blocks = shuffled.slice(0, Math.min(18, shuffled.length)).map((item, i) => ({
    id: i, text: item.text, icon: item.icon, pulled: false,
  }));

  const groupSnap = await db.collection('groups').doc(gid).get();
  const group = groupSnap.data();
  const members = group.members || [];
  const startTurn = members[Math.floor(Math.random() * members.length)] || currentUser.uid;

  await stateRef.set({
    blocks, level,
    turnUid: startTurn,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// ===== RENDER DE LA TORRE =====
function jgRenderTorre(state, stateRef) {
  const content = document.getElementById('content');
  const blocks = state.blocks;
  const pulledCount = blocks.filter(b => b.pulled).length;
  const remaining = blocks.length - pulledCount;
  const isMyTurn = state.turnUid === currentUser.uid;
  const wobbly = remaining <= Math.ceil(blocks.length * 0.4) && remaining > 0;
  const levelLabel = { basico: 'Básico', medio: 'Medio', hard: 'Hard' }[state.level] || '';

  const layers = [];
  for (let i = 0; i < blocks.length; i += 3) layers.push(blocks.slice(i, i + 3));

  const layersHtml = layers.map((layer, li) => `
    <div class="jg-layer ${li % 2 === 0 ? 'jg-horiz' : 'jg-vert'}">
      ${layer.map(b => `
        <div class="jg-block ${b.pulled ? 'jg-pulled' : (!isMyTurn ? 'jg-disabled' : '')}" id="jg-block-${b.id}"
          ${!b.pulled && isMyTurn ? `onclick="jgPullBlock(${b.id})"` : ''}>
          ${b.pulled ? '' : '🪵'}
        </div>
      `).join('')}
    </div>
  `).join('');

  content.innerHTML = `
    <div class="card" style="text-align:center;margin-bottom:14px;">
      <div class="form-label">🏗️ Torre del Deseo <span style="color:var(--rose);font-size:11px;">· ${levelLabel}</span></div>
      <p style="color:var(--text2);font-size:13px;margin-top:6px;">
        ${remaining > 0
          ? (isMyTurn ? 'Es tu turno — saca un bloque' : 'Turno de tu pareja')
          : '¡Torre completa!'}
      </p>
      <p style="color:var(--text3);font-size:11px;margin-top:2px;">${remaining} de ${blocks.length} bloques quedan</p>
    </div>
    <div class="jg-tower ${wobbly ? 'jg-wobbly' : ''}">
      ${layersHtml}
    </div>
    ${remaining === 0 ? `
      <button class="btn btn-primary btn-full" style="margin-top:18px;" onclick="jgReiniciar()">🔄 Elegir nivel y armar torre nueva</button>
    ` : `
      <button class="btn btn-outline btn-full" style="margin-top:14px;" onclick="jgMostrarOpcionesNivel()">🎬 Modo Director — cambiar nivel</button>
    `}
    <button class="btn btn-outline btn-full" style="margin-top:8px;" onclick="showTab('inicio')">Volver</button>
  `;

  window._jgState = state;
  window._jgStateRef = stateRef;
}

// ===== SACAR BLOQUE =====
async function jgPullBlock(blockId) {
  const state = window._jgState;
  const block = state.blocks.find(b => b.id === blockId);
  if (!block || block.pulled) return;
  if (state.turnUid !== currentUser.uid) { showToast('No es tu turno'); return; }

  const el = document.getElementById(`jg-block-${blockId}`);
  const layerIsHoriz = el?.parentElement?.classList.contains('jg-horiz');
  if (el) el.classList.add(layerIsHoriz ? 'jg-pulling-h' : 'jg-pulling-v');

  await new Promise(r => setTimeout(r, 420));

  const overlay = document.createElement('div');
  overlay.className = 'jg-reveal-overlay';
  overlay.innerHTML = `
    <div class="jg-reveal-card">
      <div style="font-size:44px;margin-bottom:12px;">${jgEsc(block.icon)}</div>
      <div style="font-family:var(--font-display);font-size:20px;margin-bottom:18px;">${jgEsc(block.text)}</div>
      <button class="btn btn-primary btn-full" onclick="jgConfirmarBloque(${blockId})">Listo</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function jgConfirmarBloque(blockId) {
  const state = window._jgState;
  const stateRef = window._jgStateRef;
  const gid = currentUserData.groupId;

  const groupSnap = await db.collection('groups').doc(gid).get();
  const members = (groupSnap.data().members || []).filter(m => m !== currentUser.uid);
  const nextTurn = members[0] || currentUser.uid;

  const updatedBlocks = state.blocks.map(b => b.id === blockId ? { ...b, pulled: true } : b);

  try {
    await stateRef.update({ blocks: updatedBlocks, turnUid: nextTurn });
    await notifyGroupMembers(gid, '🏗️ Te toca sacar un bloque de la Torre del Deseo');
  } catch (e) { console.error(e); }

  document.querySelector('.jg-reveal-overlay')?.remove();
  renderJenga();
}

// ===== MODO DIRECTOR — cambiar nivel a mitad de juego =====
// Mismo patrón visual que subirNivel()/mostrarOpcionesNivel() de
// Verdad o Reto. Solo reemplaza los bloques que AÚN NO se han sacado
// — lo ya jugado queda intacto, tal como se jugó.
function jgMostrarOpcionesNivel() {
  const state = window._jgState;
  const niveles = [
    { id: 'basico', icon: '🟢', label: 'Básico', desc: 'Cariñoso y juguetón' },
    { id: 'medio', icon: '🌶️', label: 'Medio', desc: 'Sube la temperatura' },
    { id: 'hard', icon: '🔥', label: 'Hard', desc: 'Sin filtros' },
  ];
  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div style="font-size:15px;font-weight:600;margin-bottom:6px;text-align:center">🎬 Modo Director</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:16px;text-align:center">Cambia el nivel de los bloques que faltan por sacar</div>
      ${niveles.map(n => {
        const locked = !jgHasAccess(n.id);
        return `
        <button class="btn btn-full" style="margin-bottom:8px;padding:14px;border-radius:12px;
          background:${state.level === n.id ? 'var(--rose-glow)' : 'var(--bg3)'};
          border:1px solid ${state.level === n.id ? 'var(--rose)' : 'var(--border)'};
          display:flex;align-items:center;gap:12px;text-align:left;${locked ? 'opacity:.6;' : ''}"
          onclick="${locked ? `showToast('Disponible en Premium')` : `jgCambiarNivel('${n.id}')`}">
          <span style="font-size:28px">${n.icon}</span>
          <div><div style="font-size:14px;font-weight:600;color:var(--text)">${n.label} ${locked ? '🔒' : ''}</div>
          <div style="font-size:11px;color:var(--text3)">${n.desc}</div></div>
          ${state.level === n.id ? '<span style="margin-left:auto;color:var(--rose)">✓</span>' : ''}
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

async function jgCambiarNivel(nivel) {
  closeModalDirect();
  const state = window._jgState;
  const stateRef = window._jgStateRef;
  if (nivel === state.level) return;

  const pool = await jgGetCatalog(nivel);
  if (!pool.length) { showToast('No hay contenido cargado para ese nivel'); return; }

  const pendingCount = state.blocks.filter(b => !b.pulled).length;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  // Si hay menos ítems que bloques pendientes, se repiten para completar.
  const refill = Array.from({ length: pendingCount }, (_, i) => shuffled[i % shuffled.length]);

  let ri = 0;
  const updatedBlocks = state.blocks.map(b => {
    if (b.pulled) return b;
    const item = refill[ri++];
    return { ...b, text: item.text, icon: item.icon };
  });

  try {
    await stateRef.update({ blocks: updatedBlocks, level: nivel });
    const labels = { basico: '🟢 Básico', medio: '🌶️ Medio', hard: '🔥 Hard' };
    showToast('⬆️ Nivel: ' + labels[nivel]);
  } catch (e) { console.error(e); }

  renderJenga();
}

async function jgReiniciar() {
  const gid = currentUserData.groupId;
  const stateRef = db.collection('groups').doc(gid).collection('jengaState').doc('current');
  await stateRef.delete();
  renderJenga();
}
