// ===== TORRE DEL DESEO — jengaJuego.js =====
// Juego independiente, contenido propio. Multijugador local (2+
// personas pasando el mismo dispositivo) con el MISMO sistema de
// participantes + interacciones ponderadas por % que usa Verdad o
// Reto (juegoState.participantes / juegoState.interacciones) — no
// bloqueado por cuenta de Firebase, es para jugar todos juntos.
// Contenido parametrizable desde Firestore (jengaCatalog), con
// niveles Básico/Medio/Hard (Medio y Hard requieren suscripción,
// igual criterio que Verdad o Reto).
// Reutiliza: db, currentUser, currentUserData, showTab(), showToast(),
// closeModalDirect(), closeModal(). No usa Cloud Functions.

function jgEsc(s) {
  const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}

function jgInjectStyles() {
  if (document.getElementById('jg-styles')) return;
  const style = document.createElement('style');
  style.id = 'jg-styles';
  style.textContent = `
    @keyframes jg-shake { 0%,100% { transform: translateX(0) rotate(0deg); } 25% { transform: translateX(-2px) rotate(-0.4deg); } 75% { transform: translateX(2px) rotate(0.4deg); } }
    @keyframes jg-pull-h { to { transform: translateX(130px) rotate(-6deg); opacity: 0; } }
    @keyframes jg-pull-v { to { transform: translateY(-50px) rotate(6deg); opacity: 0; } }
    @keyframes jg-pop { from { transform: scale(.8) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    @keyframes jg-build-in { from { transform: translateY(-16px) scale(.7); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
    @keyframes jg-glow { 0%,100% { box-shadow: inset 0 1px 0 rgba(255,255,255,.15), inset 0 -2px 4px rgba(0,0,0,.3), 0 3px 8px rgba(232,96,138,.25); } 50% { box-shadow: inset 0 1px 0 rgba(255,255,255,.2), inset 0 -2px 4px rgba(0,0,0,.3), 0 3px 14px rgba(232,96,138,.5); } }

    .jg-tower-wrap { position: relative; padding: 24px 0 10px; }
    .jg-tower-floor { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 130px; height: 14px; border-radius: 50%; background: radial-gradient(ellipse, rgba(0,0,0,.45) 0%, transparent 72%); }
    .jg-tower { position: relative; display: flex; flex-direction: column-reverse; align-items: center; gap: 3px; }
    .jg-tower.jg-wobbly { animation: jg-shake 2.2s ease-in-out infinite; }
    .jg-layer { display: flex; gap: 3px; }
    .jg-layer.jg-vert { flex-direction: row; }

    .jg-block {
      width: 26px; height: 64px; border-radius: 5px;
      background:
        linear-gradient(90deg, rgba(255,255,255,.10) 0%, transparent 18%, transparent 82%, rgba(0,0,0,.18) 100%),
        repeating-linear-gradient(0deg, rgba(0,0,0,.07) 0px, rgba(0,0,0,.07) 1px, transparent 1px, transparent 4px),
        linear-gradient(135deg, var(--fire), var(--rose));
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; cursor: pointer;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.15), inset 0 -2px 4px rgba(0,0,0,.3), 0 3px 6px rgba(0,0,0,.35);
      transition: transform .15s, box-shadow .15s;
      animation: jg-build-in .35s ease backwards;
    }
    .jg-layer.jg-horiz .jg-block {
      width: 64px; height: 26px;
      background:
        linear-gradient(180deg, rgba(255,255,255,.10) 0%, transparent 18%, transparent 82%, rgba(0,0,0,.18) 100%),
        repeating-linear-gradient(90deg, rgba(0,0,0,.07) 0px, rgba(0,0,0,.07) 1px, transparent 1px, transparent 4px),
        linear-gradient(135deg, var(--fire), var(--rose));
    }
    .jg-block:active { transform: scale(.94); }
    .jg-block.jg-next-hint { animation: jg-build-in .35s ease backwards, jg-glow 1.8s ease-in-out infinite; }
    .jg-block.jg-pulled { background: var(--bg3); box-shadow: none; opacity: .2; cursor: default; animation: none; }
    .jg-block.jg-pulling-h { animation: jg-pull-h .42s ease-in forwards; }
    .jg-block.jg-pulling-v { animation: jg-pull-v .42s ease-in forwards; }

    .jg-reveal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.72); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; }
    .jg-reveal-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 18px; padding: 30px 24px; max-width: 320px; text-align: center; animation: jg-pop .3s cubic-bezier(.34,1.4,.64,1); }
    .jg-level-card { border: 2px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 10px; cursor: pointer; }
    .jg-level-card.jg-locked { opacity: .6; }
  `;
  document.head.appendChild(style);
}

// ===== SEED — respaldo local si el catálogo en Firestore está vacío =====
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

async function jgGetCatalog(level) {
  const snap = await db.collection('jengaCatalog')
    .where('levels', 'array-contains', level).where('active', '==', true).get();
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
    await stateRef.set({ participantes: [], interacciones: {} });
  }
  const state = (await stateRef.get()).data();

  window._jgStateRef = stateRef;
  window._jgState = state;

  if ((state.participantes || []).length < 2) {
    jgRenderSetup(state, stateRef);
    return;
  }
  if (!state.blocks || !state.blocks.length) {
    jgRenderLevelPicker(gid, stateRef, state);
    return;
  }
  jgRenderTorre(state, stateRef);
}

// ===== SETUP: PARTICIPANTES + INTERACCIONES (mismo patrón que Verdad o Reto) =====
function jgRenderSetup(state, stateRef) {
  const content = document.getElementById('content');
  const participantes = state.participantes || [];
  const interacciones = state.interacciones || {};

  let html = `<div class="card" style="text-align:center;margin-bottom:14px;">
    <div class="form-label">🏗️ Torre del Deseo</div>
    <p style="color:var(--text2);font-size:13px;margin-top:6px;">Arma el grupo antes de jugar</p>
  </div>
  <div class="card" style="margin-bottom:14px;">
    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:12px;">👥 Participantes (${participantes.length})</div>`;

  if (participantes.length > 0) {
    participantes.forEach((p, i) => {
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:18px;">${p.genero === 'mujer' ? '👩' : p.genero === 'no_binario' ? '🧑' : '👨'}</span>
        <span style="flex:1;font-size:13px;">${jgEsc(p.nombre)}</span>
        <button onclick="jgQuitarParticipante(${i})" style="background:none;border:none;color:var(--rose);font-size:16px;cursor:pointer;">🗑️</button>
      </div>`;
    });
  } else {
    html += `<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px;">Agrega al menos 2 participantes</div>`;
  }

  html += `<button class="btn btn-outline btn-full btn-sm" style="margin-top:12px;" onclick="jgAgregarParticipante()">+ Agregar participante</button></div>`;

  if (participantes.length >= 2) {
    const totalInteracciones = Object.values(interacciones).reduce((s, obj) => s + Object.keys(obj).length, 0);
    html += `<div class="card" style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:600;">🔗 Interacciones</div>
        <button class="btn btn-sm btn-outline" onclick="jgConfigurarInteracciones()">Configurar</button>
      </div>`;

    if (totalInteracciones > 0) {
      participantes.forEach(p => {
        const interObj = interacciones[p.id] || {};
        const con = Object.entries(interObj).map(([id, pct]) => {
          const nombre = participantes.find(x => x.id === id)?.nombre;
          return nombre ? `${nombre} (${pct}%)` : null;
        }).filter(Boolean);
        if (con.length > 0) {
          html += `<div style="font-size:12px;color:var(--text2);margin-bottom:4px;">
            <strong style="color:var(--text);">${jgEsc(p.nombre)}</strong> → ${con.join(', ')}
          </div>`;
        }
      });
    } else {
      html += `<div style="font-size:12px;color:var(--rose);">⚠️ Debes configurar las interacciones</div>`;
    }
    html += `</div>`;

    if (totalInteracciones > 0) {
      html += `<button class="btn btn-primary btn-full" style="padding:16px;font-size:15px;font-weight:600;" onclick="renderJenga()">🏗️ Continuar a elegir nivel</button>`;
    }
  }

  html += `<button class="btn btn-outline btn-full" style="margin-top:8px;" onclick="showTab('inicio')">Volver</button>`;
  content.innerHTML = html;
}

function jgAgregarParticipante() {
  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div style="font-size:16px;font-weight:500;margin-bottom:16px;">Agregar participante</div>
      <div class="form-group">
        <label class="form-label">Nombre</label>
        <input type="text" class="form-control" id="jg-p-nombre" placeholder="Nombre">
      </div>
      <div class="form-group">
        <label class="form-label">Edad</label>
        <input type="number" class="form-control" id="jg-p-edad" placeholder="Ej: 30" min="18" max="99">
      </div>
      <div class="form-group">
        <label class="form-label">Género</label>
        <select class="form-control" id="jg-p-genero">
          <option value="hombre">Hombre</option>
          <option value="mujer">Mujer</option>
          <option value="no_binario">No binario</option>
        </select>
      </div>
      <button class="btn btn-primary btn-full" onclick="jgConfirmarParticipante()">Agregar</button>
      <button class="btn btn-outline btn-full" style="margin-top:8px;" onclick="closeModalDirect()">Cancelar</button>
    </div>
  </div>`;
}

async function jgConfirmarParticipante() {
  const nombre = document.getElementById('jg-p-nombre')?.value?.trim();
  const edad = parseInt(document.getElementById('jg-p-edad')?.value || '0');
  const genero = document.getElementById('jg-p-genero')?.value;
  if (!nombre) { showToast('Ingresa un nombre'); return; }
  if (edad < 18) { showToast('El participante debe ser mayor de 18 años'); return; }

  const state = window._jgState;
  const id = 'jp_' + Date.now();
  state.participantes = [...(state.participantes || []), { id, nombre, edad, genero }];

  try {
    await window._jgStateRef.update({ participantes: state.participantes });
  } catch (e) { console.error(e); }

  closeModalDirect();
  renderJenga();
}

async function jgQuitarParticipante(idx) {
  const state = window._jgState;
  const p = state.participantes[idx];
  const interacciones = { ...(state.interacciones || {}) };
  delete interacciones[p.id];
  Object.keys(interacciones).forEach(k => {
    if (interacciones[k][p.id] !== undefined) {
      delete interacciones[k][p.id];
      const restantes = Object.keys(interacciones[k]);
      if (restantes.length > 0) {
        const pctIgual = Math.floor(100 / restantes.length);
        restantes.forEach(id => { interacciones[k][id] = pctIgual; });
        interacciones[k][restantes[0]] += 100 - (pctIgual * restantes.length);
      }
    }
  });
  state.participantes = state.participantes.filter((_, i) => i !== idx);
  state.interacciones = interacciones;

  try {
    await window._jgStateRef.update({ participantes: state.participantes, interacciones });
  } catch (e) { console.error(e); }

  renderJenga();
}

// ===== INTERACCIONES CON PORCENTAJE (mismo mecanismo que Verdad o Reto) =====
function jgConfigurarInteracciones() {
  const state = window._jgState;
  const ps = state.participantes;
  let html = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal" style="max-height:85vh;overflow-y:auto;">
      <div class="modal-handle"></div>
      <div style="font-size:15px;font-weight:600;margin-bottom:6px;">🔗 Interacciones</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:16px;line-height:1.5;">
        Activa con quién interactúa cada persona y define qué % de las veces le toca a cada quien.
      </div>`;

  ps.forEach(p => {
    const actuales = (state.interacciones || {})[p.id] || {};
    html += `<div style="margin-bottom:16px;background:var(--bg3);border-radius:14px;padding:14px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text);">
        ${p.genero === 'mujer' ? '👩' : '👨'} ${jgEsc(p.nombre)} interactúa con:
      </div>`;
    ps.filter(o => o.id !== p.id).forEach(otro => {
      const activo = otro.id in actuales;
      const pct = actuales[otro.id] || 0;
      html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <input type="checkbox" ${activo ? 'checked' : ''}
          onchange="jgToggleInteraccionPct('${p.id}','${otro.id}',this.checked)"
          style="width:18px;height:18px;accent-color:var(--rose);flex-shrink:0;">
        <span style="font-size:13px;flex:1;">${otro.genero === 'mujer' ? '👩' : '👨'} ${jgEsc(otro.nombre)}</span>
        <div id="jg-pct-wrap-${p.id}-${otro.id}" style="display:${activo ? 'flex' : 'none'};align-items:center;gap:6px;">
          <input type="range" min="0" max="100" value="${pct}"
            id="jg-pct-slider-${p.id}-${otro.id}"
            oninput="jgAjustarPorcentaje('${p.id}','${otro.id}',parseInt(this.value))"
            style="width:80px;accent-color:var(--rose);">
          <span id="jg-pct-val-${p.id}-${otro.id}" style="font-size:12px;font-weight:600;color:var(--rose);min-width:32px;text-align:right;">${pct}%</span>
        </div>
      </div>`;
    });
    html += `</div>`;
  });

  html += `<button class="btn btn-primary btn-full" onclick="jgGuardarInteraccionesPct()">✓ Guardar interacciones</button>
    </div>
  </div>`;
  document.getElementById('modal-container').innerHTML = html;
}

function jgToggleInteraccionPct(idA, idB, activo) {
  const state = window._jgState;
  if (!state.interacciones) state.interacciones = {};
  if (!state.interacciones[idA]) state.interacciones[idA] = {};
  const inter = state.interacciones[idA];
  const wrap = document.getElementById(`jg-pct-wrap-${idA}-${idB}`);

  if (activo) {
    const activos = Object.keys(inter);
    const totalActivos = activos.length + 1;
    const pctIgual = Math.floor(100 / totalActivos);
    inter[idB] = pctIgual;
    activos.forEach(id => { inter[id] = pctIgual; });
    const resto = 100 - (pctIgual * totalActivos);
    if (resto !== 0 && activos.length > 0) inter[activos[0]] += resto;
    else if (resto !== 0) inter[idB] += resto;
    if (wrap) wrap.style.display = 'flex';
  } else {
    delete inter[idB];
    if (wrap) wrap.style.display = 'none';
    const restantes = Object.keys(inter);
    if (restantes.length > 0) {
      const pctIgual = Math.floor(100 / restantes.length);
      restantes.forEach(id => { inter[id] = pctIgual; });
      inter[restantes[0]] += 100 - (pctIgual * restantes.length);
    }
  }
  jgRefrescarSlidersPct(idA);
}

function jgAjustarPorcentaje(idA, idBCambiado, nuevoValor) {
  const state = window._jgState;
  const inter = state.interacciones[idA];
  if (!inter) return;
  const ids = Object.keys(inter);
  if (ids.length === 1) { inter[idBCambiado] = 100; jgRefrescarSlidersPct(idA); return; }

  nuevoValor = Math.max(0, Math.min(100, nuevoValor));
  inter[idBCambiado] = nuevoValor;
  const restante = 100 - nuevoValor;
  const otrosIds = ids.filter(id => id !== idBCambiado);
  const sumaOtros = otrosIds.reduce((s, id) => s + (inter[id] || 0), 0);

  if (sumaOtros === 0) {
    const pctIgual = Math.floor(restante / otrosIds.length);
    otrosIds.forEach((id, i) => { inter[id] = i === 0 ? restante - pctIgual * (otrosIds.length - 1) : pctIgual; });
  } else {
    let acumulado = 0;
    otrosIds.forEach((id, i) => {
      if (i === otrosIds.length - 1) { inter[id] = restante - acumulado; }
      else {
        const proporcion = (inter[id] || 0) / sumaOtros;
        const val = Math.round(restante * proporcion);
        inter[id] = val;
        acumulado += val;
      }
    });
  }
  jgRefrescarSlidersPct(idA);
}

function jgRefrescarSlidersPct(idA) {
  const state = window._jgState;
  const inter = state.interacciones[idA] || {};
  Object.entries(inter).forEach(([idB, pct]) => {
    const slider = document.getElementById(`jg-pct-slider-${idA}-${idB}`);
    const val = document.getElementById(`jg-pct-val-${idA}-${idB}`);
    if (slider) slider.value = pct;
    if (val) val.textContent = pct + '%';
  });
}

async function jgGuardarInteraccionesPct() {
  const state = window._jgState;
  try {
    await window._jgStateRef.update({ interacciones: state.interacciones });
  } catch (e) { console.error(e); }
  closeModalDirect();
  showToast('Interacciones guardadas');
  renderJenga();
}

// ===== SELECTOR DE NIVEL =====
function jgRenderLevelPicker(gid, stateRef, state) {
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
      <p style="color:var(--text3);font-size:11px;margin-top:4px;">${state.participantes.map(p => p.nombre).join(', ')}</p>
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
    <button class="btn btn-outline btn-full" style="margin-top:8px;" onclick="jgRenderSetup(window._jgState, window._jgStateRef)">⚙️ Editar participantes</button>
    <button class="btn btn-outline btn-full" style="margin-top:8px;" onclick="showTab('inicio')">Volver</button>
  `;
}

async function jgIniciarTorre(gid, level) {
  const stateRef = window._jgStateRef;
  await jgCrearTorreNueva(gid, stateRef, level);
  window._jgJustBuilt = true;
  const stateSnap = await stateRef.get();
  const state = stateSnap.data();
  window._jgState = state;
  jgRenderTorre(state, stateRef);
}

// ===== GENERAR TORRE =====
async function jgCrearTorreNueva(gid, stateRef, level) {
  const pool = await jgGetCatalog(level);
  if (!pool.length) { showToast('No hay contenido cargado para este nivel'); return; }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const blocks = shuffled.slice(0, Math.min(18, shuffled.length)).map((item, i) => ({
    id: i, text: item.text, icon: item.icon, pulled: false,
  }));

  await stateRef.update({
    blocks, level, turnoIdx: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

// ===== TEXTO CON PLACEHOLDERS (mismo mecanismo que resolverTexto de Verdad o Reto) =====
// Los bloques pueden usar ${jugador} y ${otro} opcionalmente en su texto.
function jgResolverTexto(texto, jugador, otro) {
  return (texto || '')
    .replace(/\$\{jugador\}/g, jugador?.nombre || 'tú')
    .replace(/\$\{otro\}/g, otro?.nombre || 'tu pareja');
}

function jgGetOtroParticipante(jugador) {
  const state = window._jgState;
  const misInteracciones = (state.interacciones || {})[jugador.id] || {};
  const candidatos = Object.entries(misInteracciones)
    .map(([id, pct]) => ({ persona: state.participantes.find(x => x.id === id), pct }))
    .filter(c => c.persona);

  if (candidatos.length === 0) return null;
  if (candidatos.length === 1) return candidatos[0].persona;

  const totalPeso = candidatos.reduce((s, c) => s + c.pct, 0);
  let rand = Math.random() * (totalPeso || 1);
  for (const c of candidatos) {
    rand -= c.pct;
    if (rand <= 0) return c.persona;
  }
  return candidatos[candidatos.length - 1].persona;
}

// ===== RENDER DE LA TORRE =====
function jgRenderTorre(state, stateRef) {
  const content = document.getElementById('content');
  const blocks = state.blocks;
  const pulledCount = blocks.filter(b => b.pulled).length;
  const remaining = blocks.length - pulledCount;
  const wobbly = remaining <= Math.ceil(blocks.length * 0.4) && remaining > 0;
  const levelLabel = { basico: 'Básico', medio: 'Medio', hard: 'Hard' }[state.level] || '';
  const turnoIdx = state.turnoIdx || 0;
  const jugadorActual = state.participantes[turnoIdx % state.participantes.length];
  const justBuilt = window._jgJustBuilt;
  window._jgJustBuilt = false;

  const layers = [];
  for (let i = 0; i < blocks.length; i += 3) layers.push(blocks.slice(i, i + 3));

  const layersHtml = layers.map((layer, li) => `
    <div class="jg-layer ${li % 2 === 0 ? 'jg-horiz' : 'jg-vert'}">
      ${layer.map((b, bi) => {
        const delay = justBuilt ? ((layers.length - li) * 0.05 + bi * 0.02) : 0;
        return `
        <div class="jg-block ${b.pulled ? 'jg-pulled' : ''}" id="jg-block-${b.id}"
          style="animation-delay:${delay}s;"
          ${!b.pulled ? `onclick="jgPullBlock(${b.id})"` : ''}>
          ${b.pulled ? '' : '🪵'}
        </div>`;
      }).join('')}
    </div>
  `).join('');

  content.innerHTML = `
    <div class="card" style="text-align:center;margin-bottom:14px;">
      <div class="form-label">🏗️ Torre del Deseo <span style="color:var(--rose);font-size:11px;">· ${levelLabel}</span></div>
      <p style="color:var(--text2);font-size:14px;margin-top:6px;font-weight:600;">
        ${remaining > 0 ? `Turno de ${jgEsc(jugadorActual?.nombre || '')}` : '¡Torre completa!'}
      </p>
      <p style="color:var(--text3);font-size:11px;margin-top:2px;">${remaining} de ${blocks.length} bloques quedan</p>
    </div>
    <div class="jg-tower-wrap">
      <div class="jg-tower-floor"></div>
      <div class="jg-tower ${wobbly ? 'jg-wobbly' : ''}">
        ${layersHtml}
      </div>
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

  const el = document.getElementById(`jg-block-${blockId}`);
  const layerIsHoriz = el?.parentElement?.classList.contains('jg-horiz');
  if (el) el.classList.add(layerIsHoriz ? 'jg-pulling-h' : 'jg-pulling-v');

  await new Promise(r => setTimeout(r, 440));

  const turnoIdx = state.turnoIdx || 0;
  const jugador = state.participantes[turnoIdx % state.participantes.length];
  const otro = jgGetOtroParticipante(jugador);
  const textoFinal = jgResolverTexto(block.text, jugador, otro);

  const overlay = document.createElement('div');
  overlay.className = 'jg-reveal-overlay';
  overlay.innerHTML = `
    <div class="jg-reveal-card">
      <div style="font-size:12px;color:var(--rose);font-weight:600;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">
        ${jgEsc(jugador.nombre)}${otro ? ' + ' + jgEsc(otro.nombre) : ''}
      </div>
      <div style="font-size:44px;margin-bottom:12px;">${jgEsc(block.icon)}</div>
      <div style="font-family:var(--font-display);font-size:20px;margin-bottom:18px;">${jgEsc(textoFinal)}</div>
      <button class="btn btn-primary btn-full" onclick="jgConfirmarBloque(${blockId})">Listo</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function jgConfirmarBloque(blockId) {
  const state = window._jgState;
  const stateRef = window._jgStateRef;

  const updatedBlocks = state.blocks.map(b => b.id === blockId ? { ...b, pulled: true } : b);
  const nextTurnoIdx = ((state.turnoIdx || 0) + 1) % state.participantes.length;

  try {
    await stateRef.update({ blocks: updatedBlocks, turnoIdx: nextTurnoIdx });
  } catch (e) { console.error(e); }

  document.querySelector('.jg-reveal-overlay')?.remove();
  renderJenga();
}

// ===== MODO DIRECTOR — cambiar nivel a mitad de juego =====
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
      <div style="font-size:15px;font-weight:600;margin-bottom:6px;text-align:center;">🎬 Modo Director</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:16px;text-align:center;">Cambia el nivel de los bloques que faltan por sacar</div>
      ${niveles.map(n => {
        const locked = !jgHasAccess(n.id);
        return `
        <button class="btn btn-full" style="margin-bottom:8px;padding:14px;border-radius:12px;
          background:${state.level === n.id ? 'var(--rose-glow)' : 'var(--bg3)'};
          border:1px solid ${state.level === n.id ? 'var(--rose)' : 'var(--border)'};
          display:flex;align-items:center;gap:12px;text-align:left;${locked ? 'opacity:.6;' : ''}"
          onclick="${locked ? `showToast('Disponible en Premium')` : `jgCambiarNivel('${n.id}')`}">
          <span style="font-size:28px;">${n.icon}</span>
          <div><div style="font-size:14px;font-weight:600;color:var(--text);">${n.label} ${locked ? '🔒' : ''}</div>
          <div style="font-size:11px;color:var(--text3);">${n.desc}</div></div>
          ${state.level === n.id ? '<span style="margin-left:auto;color:var(--rose);">✓</span>' : ''}
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
  const stateRef = window._jgStateRef;
  try {
    await stateRef.update({
      blocks: firebase.firestore.FieldValue.delete(),
      level: firebase.firestore.FieldValue.delete(),
      turnoIdx: firebase.firestore.FieldValue.delete(),
    });
  } catch (e) { console.error(e); }
  renderJenga();
}

// ===== MANTENEDOR DE ACCIONES (Torre del Deseo) =====
// Mismo patrón visual que el resto de tus mantenedores (Deseos,
// Acciones, Verdades, Retos). Diferencia clave: cada acción puede
// pertenecer a varias categorías a la vez (levels: array), no solo una.

const JG_NIVEL_LABEL = { basico: '🟢 Básico', medio: '🌶️ Medio', hard: '🔥 Hard' };
const JG_NIVEL_BG = { basico: 'rgba(78,203,160,0.15)', medio: 'rgba(245,166,35,0.15)', hard: 'rgba(232,96,138,0.15)' };
const JG_NIVEL_COLOR = { basico: 'var(--teal)', medio: 'var(--amber)', hard: 'var(--rose)' };

async function renderMantTorre() {
  document.getElementById('content').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const snap = await db.collection('jengaCatalog').orderBy('text').get();
    const blocks = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    let html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
      <button class="btn btn-outline btn-sm" onclick="showTab('mantenedores')">← Volver</button>
      <div style="font-size:16px;font-weight:500">🏗️ Torre del Deseo</div>
    </div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:16px">Cada acción puede pertenecer a varias categorías a la vez. Usa \${jugador} y \${otro} en el texto si quieres personalizarlo.</div>`;

    blocks.forEach(b => {
      const levels = b.levels || (b.level ? [b.level] : []);
      html += `<div class="card" style="margin-bottom:8px;padding:14px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <div style="width:42px;height:42px;border-radius:12px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
            ${jgEsc(b.icon || '🎲')}
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px">
              ${levels.map(l => `<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:${JG_NIVEL_BG[l]};color:${JG_NIVEL_COLOR[l]}">${JG_NIVEL_LABEL[l] || l}</span>`).join('')}
              ${b.active === false ? '<span style="font-size:10px;color:var(--text3)">inactivo</span>' : ''}
            </div>
            <div style="font-size:13px;color:var(--text);line-height:1.5">${jgEsc(b.text)}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
            <button onclick="jgEditarBloque('${b.id}')"
              style="width:36px;height:36px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);color:var(--teal);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">
              ✏️
            </button>
            <button onclick="jgEliminarBloque('${b.id}')"
              style="width:36px;height:36px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);color:var(--rose);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">
              🗑️
            </button>
          </div>
        </div>
      </div>`;
    });

    html += `<button class="btn btn-outline btn-full btn-sm" style="margin:8px 0 20px" onclick="jgAgregarBloque()">+ Agregar acción</button>`;

    document.getElementById('content').innerHTML = html;
  } catch (e) {
    console.error(e);
    document.getElementById('content').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error cargando</div></div>';
  }
}

function jgNivelCheckboxes(selected) {
  return ['basico', 'medio', 'hard'].map(l => `
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
      <input type="checkbox" id="jg-nivel-${l}" ${(selected || []).includes(l) ? 'checked' : ''} style="accent-color:var(--rose)">
      <span style="font-size:13px">${JG_NIVEL_LABEL[l]}</span>
    </label>`).join('');
}

function jgAgregarBloque() {
  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal" style="max-height:90vh;overflow-y:auto">
      <div class="modal-handle"></div>
      <div style="font-size:15px;font-weight:500;margin-bottom:16px">+ Nueva acción</div>
      <div class="form-group">
        <label class="form-label">Ícono (emoji)</label>
        <input class="form-control" id="jg-form-icon" value="🎲" maxlength="4">
      </div>
      <div class="form-group">
        <label class="form-label">Texto <span style="font-size:10px;color:var(--text3)">usa \${jugador} y \${otro} si quieres</span></label>
        <textarea class="form-control" id="jg-form-texto" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Categorías (puede ser más de una)</label>
        ${jgNivelCheckboxes([])}
      </div>
      <button class="btn btn-primary btn-full" onclick="jgGuardarBloqueNuevo()">Guardar</button>
    </div>
  </div>`;
}

function jgLeerNivelesForm() {
  return ['basico', 'medio', 'hard'].filter(l => document.getElementById(`jg-nivel-${l}`)?.checked);
}

async function jgGuardarBloqueNuevo() {
  const text = document.getElementById('jg-form-texto').value.trim();
  const icon = document.getElementById('jg-form-icon').value.trim() || '🎲';
  const levels = jgLeerNivelesForm();
  if (!text) { showToast('Escribe el texto de la acción'); return; }
  if (!levels.length) { showToast('Elige al menos una categoría'); return; }

  try {
    await db.collection('jengaCatalog').add({ text, icon, levels, active: true });
    closeModalDirect();
    showToast('Acción agregada');
    renderMantTorre();
  } catch (e) { console.error(e); showToast('Error al guardar'); }
}

async function jgEditarBloque(id) {
  const snap = await db.collection('jengaCatalog').doc(id).get();
  const b = snap.data();
  const levels = b.levels || (b.level ? [b.level] : []);

  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal" style="max-height:90vh;overflow-y:auto">
      <div class="modal-handle"></div>
      <div style="font-size:15px;font-weight:500;margin-bottom:16px">✏️ Editar acción</div>
      <div class="form-group">
        <label class="form-label">Ícono (emoji)</label>
        <input class="form-control" id="jg-form-icon" value="${jgEsc(b.icon || '')}" maxlength="4">
      </div>
      <div class="form-group">
        <label class="form-label">Texto <span style="font-size:10px;color:var(--text3)">usa \${jugador} y \${otro} si quieres</span></label>
        <textarea class="form-control" id="jg-form-texto" rows="3">${jgEsc(b.text)}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Categorías (puede ser más de una)</label>
        ${jgNivelCheckboxes(levels)}
      </div>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:16px">
        <input type="checkbox" id="jg-form-activo" ${b.active !== false ? 'checked' : ''} style="accent-color:var(--rose)">
        <span style="font-size:13px">Activa (visible en el juego)</span>
      </label>
      <button class="btn btn-primary btn-full" onclick="jgGuardarBloqueEditado('${id}')">Guardar cambios</button>
    </div>
  </div>`;
}

async function jgGuardarBloqueEditado(id) {
  const text = document.getElementById('jg-form-texto').value.trim();
  const icon = document.getElementById('jg-form-icon').value.trim() || '🎲';
  const levels = jgLeerNivelesForm();
  const active = document.getElementById('jg-form-activo').checked;
  if (!text) { showToast('Escribe el texto de la acción'); return; }
  if (!levels.length) { showToast('Elige al menos una categoría'); return; }

  try {
    await db.collection('jengaCatalog').doc(id).update({ text, icon, levels, active, level: firebase.firestore.FieldValue.delete() });
    closeModalDirect();
    showToast('Acción actualizada');
    renderMantTorre();
  } catch (e) { console.error(e); showToast('Error al guardar'); }
}

async function jgEliminarBloque(id) {
  if (!confirm('¿Eliminar esta acción del catálogo?')) return;
  try {
    await db.collection('jengaCatalog').doc(id).delete();
    showToast('Acción eliminada');
    renderMantTorre();
  } catch (e) { console.error(e); showToast('Error al eliminar'); }
}
