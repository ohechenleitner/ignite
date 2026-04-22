// ===== IGNITE APP.JS =====
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
 
const firebaseConfig = {
  apiKey: "AIzaSyBDkK9v9mplyOGcKSqkue2Q3HmjwHGbRs8",
  authDomain: "ignite-app-8bdb5.firebaseapp.com",
  projectId: "ignite-app-8bdb5",
  storageBucket: "ignite-app-8bdb5.firebasestorage.app",
  messagingSenderId: "707291369583",
  appId: "1:707291369583:web:ee195d5f976b20acf8bd9a"
};
 
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
 
// ===== STATE =====
let currentUser = null;
let currentUserData = null;
let currentTab = 'home';
let fantasyFilter = 'all';
let selUsers = [];
let unsubListeners = [];
 
// ===== DEFAULT DATA =====
const DEFAULT_ACTIONS_HIM = [
  { id: 'ah1', name: 'Flores sin razón', pts: 5, icon: '🌸' },
  { id: 'ah2', name: 'Organiza salida sorpresa', pts: 8, icon: '🎉' },
  { id: 'ah3', name: 'Desayuno en cama', pts: 6, icon: '☕' },
  { id: 'ah4', name: 'Masaje en casa', pts: 6, icon: '💆' },
  { id: 'ah5', name: 'Bailar con ella en casa', pts: 8, icon: '💃' },
  { id: 'ah6', name: 'Escucharla sin teléfono', pts: 4, icon: '👂' },
  { id: 'ah7', name: 'Carta o mensaje escrito', pts: 8, icon: '💌' },
  { id: 'ah8', name: 'Día de spa para ella', pts: 12, icon: '🛁' },
  { id: 'ah9', name: 'Cena romántica organizada', pts: 8, icon: '🕯️' },
  { id: 'ah10', name: 'Salir a caminar juntos', pts: 5, icon: '🚶' },
  { id: 'ah11', name: 'Acurrucarse viendo película', pts: 3, icon: '🎬' },
  { id: 'ah12', name: 'Zumba o ejercicio en casa', pts: 8, icon: '🏃' },
];
 
const DEFAULT_ACTIONS_HER = [
  { id: 'ae1', name: 'Te busca ella primero', pts: 10, icon: '💋' },
  { id: 'ae2', name: 'Mensaje coqueto del día', pts: 5, icon: '💬' },
  { id: 'ae3', name: 'Foto sexy por privado', pts: 8, icon: '📸' },
  { id: 'ae4', name: 'Foto coqueta WhatsApp status', pts: 15, icon: '📱' },
  { id: 'ae5', name: 'Foto en Twitter privado', pts: 8, icon: '🐦' },
  { id: 'ae6', name: 'Modela lencería por iniciativa', pts: 15, icon: '✨' },
  { id: 'ae7', name: 'Toma iniciativa en intimidad', pts: 15, icon: '🔥' },
  { id: 'ae8', name: 'Acepta plan sin excusas', pts: 8, icon: '✅' },
  { id: 'ae9', name: 'Sorprende con algo', pts: 15, icon: '🎁' },
  { id: 'ae10', name: 'Zumba o ejercicio juntos', pts: 8, icon: '🏃' },
];
 
const DEFAULT_FANTASIES = [
  { id: 'f1', name: 'Ver película porno juntos', pts: 3, level: 'basic', icon: '🎬', desc: 'Una noche relajada viendo contenido adulto juntos' },
  { id: 'f2', name: 'Traje de baño escogido por él', pts: 10, level: 'basic', icon: '👙', desc: 'Ella usa el traje de baño que él elija' },
  { id: 'f3', name: 'Short sexy en Airbnb', pts: 5, level: 'basic', icon: '🩳', desc: 'Solos o acompañados en alojamiento' },
  { id: 'f4', name: 'Vestido sexy en restaurante', pts: 3, level: 'basic', icon: '👗', desc: 'Salida romántica con ella muy producida' },
  { id: 'f5', name: 'Juegos picantes en pareja', pts: 5, level: 'basic', icon: '🎲', desc: 'Juegos de adultos solo entre los dos' },
  { id: 'f6', name: 'Playa con amigo incluido', pts: 20, level: 'medium', icon: '🏖️', desc: 'Escapada a la playa en grupo' },
  { id: 'f7', name: 'Modelar trajes (grupo decide)', pts: 15, level: 'medium', icon: '👀', desc: 'Ella modela y el grupo elige cuál usará' },
  { id: 'f8', name: 'Cena sexy con tercero', pts: 8, level: 'medium', icon: '🍷', desc: 'Cena producida con alguien más presente' },
  { id: 'f9', name: 'Cabaña con jacuzzi (grupo)', pts: 15, level: 'medium', icon: '🛁', desc: 'Escapada con jacuzzi en grupo' },
  { id: 'f10', name: 'Club swinger (ella elige look)', pts: 5, level: 'medium', icon: '🌙', desc: 'Salida al club, ella decide cómo vestir' },
  { id: 'f11', name: 'Club swinger (él elige look)', pts: 15, level: 'medium', icon: '🌙', desc: 'Salida al club, él decide cómo vestir' },
  { id: 'f12', name: 'Juegos light con tercero', pts: 15, level: 'medium', icon: '🎯', desc: 'Juegos con retos suaves con tercero presente' },
  { id: 'f13', name: 'Ella seduce seguidor en Twitter', pts: 20, level: 'medium', icon: '🐦', desc: 'Chat coqueto con seguidor compartiendo fotos' },
  { id: 'f14', name: 'Juegos medios con tercero', pts: 20, level: 'high', icon: '🎭', desc: 'Retos de nivel medio con tercero' },
  { id: 'f15', name: 'Masaje tántrico voyeur', pts: 30, level: 'high', icon: '🕯️', desc: 'Ella recibe masaje, él observa' },
  { id: 'f16', name: 'Juegos full con tercero', pts: 35, level: 'high', icon: '⚡', desc: 'Retos completos sin límite con tercero' },
  { id: 'f17', name: 'Modelar lencería (tercero presente)', pts: 50, level: 'high', icon: '✨', desc: 'Sesión de lencería con tercero en escena' },
  { id: 'f18', name: 'Trío HMH', pts: 50, level: 'high', icon: '🔥', desc: 'La fantasía máxima' },
];
 
const DEFAULT_SPECIAL_DATES = [
  { name: 'Cumpleaños de ella', date: '28-01', pts: 30, icon: '🎂' },
  { name: 'Cumpleaños de él', date: '25-05', pts: 30, icon: '🎂' },
  { name: 'Aniversario', date: '06-03', pts: 25, icon: '💑' },
  { name: 'Día de la Madre', date: '2do domingo mayo', pts: 20, icon: '🌸' },
  { name: 'Día del Padre', date: '3er domingo junio', pts: 20, icon: '👔' },
  { name: 'Día del Ingeniero VE', date: '28-10', pts: 15, icon: '⚙️' },
  { name: 'Día del Ingeniero CL', date: '14-05', pts: 15, icon: '⚙️' },
  { name: 'San Valentín', date: '14-02', pts: 15, icon: '❤️' },
  { name: 'Navidad', date: '25-12', pts: 15, icon: '🎄' },
  { name: 'Año Nuevo', date: '31-12', pts: 10, icon: '🎆' },
];
 
// ===== AUTH FUNCTIONS =====
function showLogin() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}
 
function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}
 
async function loginUser() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  if (!email || !pass) { showError(errEl, 'Completa todos los campos'); return; }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (e) {
    showError(errEl, 'Email o contraseña incorrectos');
  }
}
 
async function registerUser() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const code = document.getElementById('reg-code').value.trim().toUpperCase();
  const gender = document.getElementById('reg-gender').value;
  const orient = document.getElementById('reg-orient').value;
  const errEl = document.getElementById('reg-error');
  errEl.style.display = 'none';
 
  if (!name || !email || !pass) { showError(errEl, 'Completa todos los campos'); return; }
  if (pass.length < 6) { showError(errEl, 'La contraseña debe tener mínimo 6 caracteres'); return; }
 
  // Verify invite code (skip for first user / admin)
  const usersSnap = await db.collection('users').limit(1).get();
  const isFirstUser = usersSnap.empty;
 
  if (!isFirstUser && code !== 'IGNITE-2026') {
    // Check if code matches any group invite code
    const groupSnap = await db.collection('groups').where('inviteCode', '==', code).limit(1).get();
    if (groupSnap.empty) { showError(errEl, 'Código de invitación inválido'); return; }
  }
 
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const uid = cred.user.uid;
    const colors = ['#E8608A','#4ECBA0','#9B7FE8','#F5A623','#FF7A00'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
 
    await db.collection('users').doc(uid).set({
      id: uid,
      name,
      email,
      initials,
      color,
      gender,
      orientation: orient,
      role: isFirstUser ? 'admin' : 'viewer',
      active: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
 
    // If first user, create default group
    if (isFirstUser) {
      const groupRef = db.collection('groups').doc();
      await groupRef.set({
        id: groupRef.id,
        adminId: uid,
        inviteCode: 'IGNITE-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        members: [uid],
        actions: { him: DEFAULT_ACTIONS_HIM, her: DEFAULT_ACTIONS_HER },
        fantasies: DEFAULT_FANTASIES,
        specialDates: DEFAULT_SPECIAL_DATES,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await db.collection('users').doc(uid).update({ groupId: groupRef.id });
    } else {
      // Add to group from invite code
      const groupSnap = await db.collection('groups').where('inviteCode', '==', code).limit(1).get();
      if (!groupSnap.empty) {
        const groupId = groupSnap.docs[0].id;
        await db.collection('groups').doc(groupId).update({
          members: firebase.firestore.FieldValue.arrayUnion(uid)
        });
        await db.collection('users').doc(uid).update({ groupId });
      }
    }
  } catch (e) {
    showError(errEl, 'Error al crear cuenta: ' + e.message);
  }
}
 
function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}
 
// ===== AUTH STATE =====
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    const snap = await db.collection('users').doc(user.uid).get();
    if (snap.exists) {
      currentUserData = snap.data();
      showApp();
    }
  } else {
    currentUser = null;
    currentUserData = null;
    showAuthScreen();
  }
});
 
function showApp() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  updateHeader();
  showTab('home');
}
 
function showAuthScreen() {
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
}
 
// ===== HEADER =====
function updateHeader() {
  if (!currentUserData) return;
  const av = document.getElementById('header-avatar');
  if (av) {
    av.textContent = currentUserData.initials;
    av.style.background = currentUserData.color + '22';
    av.style.color = currentUserData.color;
  }
  const adminNav = document.getElementById('nav-admin');
  if (adminNav) adminNav.style.display = currentUserData.role === 'admin' ? 'flex' : 'none';
 
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nv = document.getElementById('nav-' + currentTab);
  if (nv) nv.classList.add('active');
 
  // Check notifications
  checkNotifDot();
}
 
async function checkNotifDot() {
  if (!currentUserData?.groupId) return;
  const snap = await db.collection('groups').doc(currentUserData.groupId)
    .collection('notifications')
    .where('toUserId', '==', currentUser.uid)
    .where('read', '==', false)
    .limit(1).get();
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = snap.empty ? 'none' : 'block';
}
 
// ===== TABS =====
function showTab(tab) {
  currentTab = tab;
  updateHeader();
  const c = document.getElementById('content');
  c.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando...</div>';
  if (tab === 'home') renderHome();
  else if (tab === 'actions') renderActions();
  else if (tab === 'fantasy') renderFantasy();
  else if (tab === 'history') renderHistory();
  else if (tab === 'admin') renderAdmin();
  else if (tab === 'profile') renderProfile();
}
 
// ===== HOME =====
async function renderHome() {
  if (!currentUserData?.groupId) {
    document.getElementById('content').innerHTML = '<div class="empty"><div class="empty-icon">⏳</div><div class="empty-text">Configurando tu grupo...</div></div>';
    return;
  }
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
 
  const [groupSnap, membersSnap, pendingSnap, histSnap] = await Promise.all([
    db.collection('groups').doc(gid).get(),
    db.collection('users').where('groupId', '==', gid).where('active', '==', true).get(),
    db.collection('groups').doc(gid).collection('requests').where('status', '==', 'pending').get(),
    db.collection('groups').doc(gid).collection('history').orderBy('createdAt', 'desc').limit(5).get()
  ]);
 
  const group = groupSnap.data();
  const members = membersSnap.docs.map(d => d.data()).filter(m => m.id !== uid);
  const partner = members[0];
  const pairKey = partner ? [uid, partner.id].sort().join('_') : null;
  const myPts = pairKey ? (group.pairPoints?.[pairKey]?.[uid] || 0) : 0;
  const partnerPts = pairKey ? (group.pairPoints?.[pairKey]?.[partner.id] || 0) : 0;
 
  const pendingForMe = pendingSnap.docs.map(d => d.data()).filter(r => r.requestedBy !== uid);
  const myPending = pendingSnap.docs.map(d => d.data()).filter(r => r.requestedBy === uid);
  const history = histSnap.docs.map(d => d.data());
 
  let html = `<div class="points-hero">
    <div class="hero-label">Tus puntos${partner ? ' con ' + partner.name : ''}</div>
    <div class="hero-pts"><span class="pts-num">${myPts}</span> <span class="pts-label">pts</span></div>
    <div class="hero-sub">${partner ? `<span class="hero-partner">${partner.name}</span> tiene ${partnerPts} pts` : 'Invita a tu pareja para comenzar'}</div>
  </div>`;
 
  if (members.length > 1) {
    html += `<div class="pair-scroll">`;
    members.forEach(m => {
      const pk = [uid, m.id].sort().join('_');
      const mpts = group.pairPoints?.[pk]?.[uid] || 0;
      html += `<div class="pair-chip">
        <div class="pair-avatar" style="background:${m.color}22;color:${m.color}">${m.initials}</div>
        ${m.name} · ${mpts} pts
      </div>`;
    });
    html += `</div>`;
  }
 
  if (pendingForMe.length > 0) {
    html += `<div class="section-hd"><div class="section-title">🔔 Por aprobar (${pendingForMe.length})</div></div>`;
    pendingForMe.slice(0, 3).forEach(r => {
      html += `<div class="card glow-rose">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div>
            <div style="font-size:13px;font-weight:500">${r.fantasyName}</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px">${r.pts} pts · ${r.type === 'action' ? '⚡ Acción' : '🔥 Fantasía'}</div>
          </div>
          <span class="status pending">⏳ Pendiente</span>
        </div>
        ${r.comment ? `<div style="font-size:12px;color:var(--text2);background:var(--bg4);border-radius:8px;padding:8px;margin-bottom:10px">"${r.comment}"</div>` : ''}
        <div class="row">
          <button class="btn btn-teal btn-sm" onclick="approveReq('${r.id}')">✓ Aprobar</button>
          <button class="btn btn-danger btn-sm" onclick="showRejectModal('${r.id}')">✕ Rechazar</button>
        </div>
      </div>`;
    });
  }
 
  html += `<div class="section-hd"><div class="section-title">Acciones rápidas</div></div>
  <div class="row" style="margin-bottom:16px">
    <button class="btn btn-outline btn-full" onclick="showTab('actions')">⚡ Acción</button>
    <button class="btn btn-primary btn-full" onclick="showTab('fantasy')">🔥 Fantasía</button>
  </div>`;
 
  if (myPending.length > 0) {
    html += `<div class="section-hd"><div class="section-title">Mis envíos pendientes</div></div>`;
    myPending.slice(0, 3).forEach(r => {
      html += `<div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:13px;font-weight:500">${r.fantasyName}</div>
          <span class="status pending">⏳ Esperando</span>
        </div>
      </div>`;
    });
  }
 
  if (history.length > 0) {
    html += `<div class="section-hd"><div class="section-title">Reciente</div><div class="see-all" onclick="showTab('history')">Ver todo →</div></div>`;
    history.forEach(h => {
      html += `<div class="hist-item">
        <div class="hist-icon ${h.type}">${h.type === 'add' ? '⬆' : '⬇'}</div>
        <div style="flex:1">
          <div class="hist-name">${h.action}</div>
          <div class="hist-date">${h.fromUserName || ''} · ${h.date || ''}</div>
        </div>
        <div class="hist-pts ${h.type}">${h.type === 'add' ? '+' : '-'}${h.pts}</div>
      </div>`;
    });
  }
 
  document.getElementById('content').innerHTML = html;
}
 
// ===== ACTIONS =====
async function renderActions() {
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const groupSnap = await db.collection('groups').doc(gid).get();
  const group = groupSnap.data();
  const genderKey = currentUserData.gender === 'mujer' ? 'her' : 'him';
  const myActions = group.actions?.[genderKey] || [];
  const membersSnap = await db.collection('users').where('groupId', '==', gid).where('active', '==', true).get();
  const otherMembers = membersSnap.docs.map(d => d.data()).filter(m => m.id !== uid);
  const pendingForMe = await db.collection('groups').doc(gid).collection('requests')
    .where('status', '==', 'pending').get();
  const pending = pendingForMe.docs.map(d => d.data()).filter(r => r.requestedBy !== uid && r.type === 'action');
 
  let html = `<div class="section-hd"><div class="section-title">Nueva acción ⚡</div></div>
  <div class="card glow-teal">
    <div class="form-group">
      <label class="form-label">¿Qué hiciste?</label>
      <select class="form-control" id="act-sel" onchange="updateActPts()">
        <option value="">— Selecciona acción —</option>`;
  myActions.forEach(a => {
    html += `<option value="${a.id}" data-pts="${a.pts}">${a.icon} ${a.name} (+${a.pts} pts)</option>`;
  });
  html += `</select></div>
    <div class="form-group">
      <label class="form-label">¿Quién te da los puntos?</label>
      <div class="multi-user-grid" id="user-multiselect">`;
  otherMembers.forEach(m => {
    html += `<div class="multi-user-item" id="mu-${m.id}" onclick="toggleUserSel('${m.id}')">
      <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;background:${m.color}22;color:${m.color}">${m.initials}</div>
      <div style="flex:1;font-size:12px;font-weight:500">${m.name}</div>
      <div class="check" id="chk-${m.id}"></div>
    </div>`;
  });
  html += `</div></div>
    <div class="form-group">
      <label class="form-label">Comentario (opcional)</label>
      <textarea class="form-control" id="act-comment" rows="2" placeholder="Agrega contexto..."></textarea>
    </div>
    <div id="act-pts-preview" style="display:none;font-size:12px;color:var(--teal);margin-bottom:10px;font-weight:500">
      Esta acción suma <strong id="act-pts-val">0</strong> puntos
    </div>
    <button class="btn btn-primary btn-full" onclick="submitAction()">Enviar para aprobación 📤</button>
  </div>`;
 
  if (pending.length > 0) {
    html += `<div class="section-hd" style="margin-top:8px"><div class="section-title">Por aprobar (${pending.length})</div></div>`;
    pending.forEach(r => {
      html += `<div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div>
            <div style="font-size:13px;font-weight:500">${r.fantasyName}</div>
            <div style="font-size:11px;color:var(--text2)">+${r.pts} pts</div>
          </div>
          <span class="status pending">⏳</span>
        </div>
        ${r.comment ? `<div style="font-size:12px;color:var(--text2);background:var(--bg4);border-radius:8px;padding:8px;margin-bottom:8px">"${r.comment}"</div>` : ''}
        <div class="row">
          <button class="btn btn-teal btn-sm" onclick="approveReq('${r.id}')">✓ Aprobar</button>
          <button class="btn btn-danger btn-sm" onclick="showRejectModal('${r.id}')">✕ Rechazar</button>
        </div>
      </div>`;
    });
  }
 
  selUsers = [];
  document.getElementById('content').innerHTML = html;
}
 
function updateActPts() {
  const sel = document.getElementById('act-sel');
  const preview = document.getElementById('act-pts-preview');
  const val = document.getElementById('act-pts-val');
  if (!sel || !preview || !val) return;
  const opt = sel.selectedOptions[0];
  if (opt && opt.dataset.pts) { preview.style.display = 'block'; val.textContent = opt.dataset.pts; }
  else preview.style.display = 'none';
}
 
function toggleUserSel(uid) {
  const idx = selUsers.indexOf(uid);
  if (idx >= 0) selUsers.splice(idx, 1); else selUsers.push(uid);
  document.querySelectorAll('[id^="mu-"]').forEach(el => {
    const id = el.id.replace('mu-', '');
    const chk = document.getElementById('chk-' + id);
    if (selUsers.includes(id)) { el.classList.add('selected'); if (chk) chk.textContent = '✓'; }
    else { el.classList.remove('selected'); if (chk) chk.textContent = ''; }
  });
}
 
async function submitAction() {
  const sel = document.getElementById('act-sel');
  if (!sel || !sel.value) { showToast('Selecciona una acción'); return; }
  if (selUsers.length === 0) { showToast('Selecciona quién te da los puntos'); return; }
  const opt = sel.selectedOptions[0];
  const comment = document.getElementById('act-comment')?.value || '';
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const genderKey = currentUserData.gender === 'mujer' ? 'her' : 'him';
  const groupSnap = await db.collection('groups').doc(gid).get();
  const actionDef = groupSnap.data().actions?.[genderKey]?.find(a => a.id === sel.value);
  if (!actionDef) return;
 
  const reqRef = db.collection('groups').doc(gid).collection('requests').doc();
  await reqRef.set({
    id: reqRef.id,
    type: 'action',
    requestedBy: uid,
    requestedByName: currentUserData.name,
    toUsers: [...selUsers],
    fantasyName: actionDef.name,
    pts: actionDef.pts,
    status: 'pending',
    comment,
    date: new Date().toLocaleDateString('es'),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
 
  // Notify target users
  for (const tid of selUsers) {
    await db.collection('groups').doc(gid).collection('notifications').add({
      toUserId: tid,
      text: `${currentUserData.name} registró: ${actionDef.name} (+${actionDef.pts} pts)`,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
 
  selUsers = [];
  showToast('✓ Acción enviada para aprobación');
  showTab('actions');
}
 
// ===== APPROVE / REJECT =====
function approveReq(reqId) {
  showApproveModal(reqId);
}
 
function showApproveModal(reqId) {
  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-title">✓ Aprobar solicitud</div>
      <div class="form-group">
        <label class="form-label">Comentario (opcional)</label>
        <textarea class="form-control" id="approve-comment" rows="2" placeholder="Agrega un comentario..."></textarea>
      </div>
      <button class="btn btn-teal btn-full" onclick="confirmApprove('${reqId}')">Confirmar aprobación</button>
    </div>
  </div>`;
}
 
async function confirmApprove(reqId) {
  const comment = document.getElementById('approve-comment')?.value || '';
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const reqSnap = await db.collection('groups').doc(gid).collection('requests').doc(reqId).get();
  const req = reqSnap.data();
  if (!req) return;
 
  await db.collection('groups').doc(gid).collection('requests').doc(reqId).update({
    status: 'approved', approveComment: comment
  });
 
  if (req.type === 'action') {
    // Add points to requester for each selected user pair
    const groupSnap = await db.collection('groups').doc(gid).get();
    const group = groupSnap.data();
    const pairPoints = group.pairPoints || {};
    for (const tid of req.toUsers) {
      if (tid === uid) {
        const pk = [req.requestedBy, tid].sort().join('_');
        if (!pairPoints[pk]) pairPoints[pk] = {};
        pairPoints[pk][req.requestedBy] = (pairPoints[pk][req.requestedBy] || 0) + req.pts;
      }
    }
    await db.collection('groups').doc(gid).update({ pairPoints });
 
    await db.collection('groups').doc(gid).collection('history').add({
      fromUser: req.requestedBy,
      fromUserName: req.requestedByName,
      toUsers: req.toUsers,
      action: req.fantasyName,
      pts: req.pts,
      type: 'add',
      comment,
      date: new Date().toLocaleDateString('es'),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
 
  await db.collection('groups').doc(gid).collection('notifications').add({
    toUserId: req.requestedBy,
    text: `✓ Aprobaron: ${req.fantasyName} (+${req.pts} pts)${comment ? ' — "' + comment + '"' : ''}`,
    read: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
 
  closeModalDirect();
  showToast('✓ Solicitud aprobada');
  showTab(currentTab);
}
 
function showRejectModal(reqId) {
  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-title">✕ Rechazar solicitud</div>
      <div class="form-group">
        <label class="form-label">Motivo (requerido)</label>
        <textarea class="form-control" id="reject-reason" rows="3" placeholder="Explica por qué rechazas..."></textarea>
      </div>
      <button class="btn btn-danger btn-full" onclick="confirmReject('${reqId}')">Confirmar rechazo</button>
    </div>
  </div>`;
}
 
async function confirmReject(reqId) {
  const reason = document.getElementById('reject-reason')?.value?.trim();
  if (!reason) { showToast('El motivo es requerido'); return; }
  const gid = currentUserData.groupId;
  const reqSnap = await db.collection('groups').doc(gid).collection('requests').doc(reqId).get();
  const req = reqSnap.data();
 
  await db.collection('groups').doc(gid).collection('requests').doc(reqId).update({
    status: 'rejected', reason
  });
 
  if (req.type === 'fantasy') {
    // Refund points
    const groupSnap = await db.collection('groups').doc(gid).get();
    const group = groupSnap.data();
    const pairPoints = group.pairPoints || {};
    const partner = req.toUsers?.[0];
    if (partner) {
      const pk = [req.requestedBy, partner].sort().join('_');
      if (!pairPoints[pk]) pairPoints[pk] = {};
      pairPoints[pk][req.requestedBy] = (pairPoints[pk][req.requestedBy] || 0) + req.pts;
      await db.collection('groups').doc(gid).update({ pairPoints });
    }
  }
 
  await db.collection('groups').doc(gid).collection('notifications').add({
    toUserId: req.requestedBy,
    text: `✕ Rechazaron: ${req.fantasyName} — "${reason}"`,
    read: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
 
  closeModalDirect();
  showToast('Solicitud rechazada');
  showTab(currentTab);
}
 
// ===== FANTASY =====
async function renderFantasy() {
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const [groupSnap, membersSnap, reqsSnap] = await Promise.all([
    db.collection('groups').doc(gid).get(),
    db.collection('users').where('groupId', '==', gid).where('active', '==', true).get(),
    db.collection('groups').doc(gid).collection('requests').where('requestedBy', '==', uid).where('type', '==', 'fantasy').get()
  ]);
  const group = groupSnap.data();
  const members = membersSnap.docs.map(d => d.data()).filter(m => m.id !== uid);
  const partner = members[0];
  const pairKey = partner ? [uid, partner.id].sort().join('_') : null;
  const myPts = pairKey ? (group.pairPoints?.[pairKey]?.[uid] || 0) : 0;
  const fantasies = group.fantasies || DEFAULT_FANTASIES;
  const myReqs = reqsSnap.docs.map(d => d.data());
  const levels = { basic: { label: '🟢 Básico', color: 'var(--teal)' }, medium: { label: '🟡 Medio', color: 'var(--amber)' }, high: { label: '🔴 Alto', color: 'var(--rose)' } };
 
  let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <div style="font-size:13px;color:var(--text2)">Tienes <strong style="color:var(--rose)">${myPts} pts</strong> disponibles</div>
  </div>
  <div class="filter-scroll">
    <button class="filter-chip ${fantasyFilter === 'all' ? 'active' : ''}" onclick="setFF('all',this)">Todas</button>
    <button class="filter-chip ${fantasyFilter === 'basic' ? 'active' : ''}" onclick="setFF('basic',this)">🟢 Básico</button>
    <button class="filter-chip ${fantasyFilter === 'medium' ? 'active' : ''}" onclick="setFF('medium',this)">🟡 Medio</button>
    <button class="filter-chip ${fantasyFilter === 'high' ? 'active' : ''}" onclick="setFF('high',this)">🔴 Alto</button>
  </div>`;
 
  const filtered = fantasyFilter === 'all' ? fantasies : fantasies.filter(f => f.level === fantasyFilter);
  filtered.forEach(f => {
    const canAfford = myPts >= f.pts;
    html += `<div class="fantasy-card" onclick="showFantasyDetail('${f.id}')">
      <div class="fantasy-emoji ${f.level}">${f.icon}</div>
      <div class="fantasy-info">
        <div class="fantasy-name">${f.name}</div>
        <div class="fantasy-level" style="color:${levels[f.level].color}">${levels[f.level].label}</div>
      </div>
      <span class="pts-badge ${canAfford ? f.level : 'locked'}">${f.pts} pts</span>
    </div>`;
  });
 
  // Pending for me to approve
  const pendingSnap = await db.collection('groups').doc(gid).collection('requests')
    .where('status', '==', 'pending').where('type', '==', 'fantasy').get();
  const pendingForMe = pendingSnap.docs.map(d => d.data()).filter(r => r.requestedBy !== uid);
  if (pendingForMe.length > 0) {
    html += `<div class="section-hd" style="margin-top:16px"><div class="section-title">Solicitudes pendientes</div></div>`;
    pendingForMe.forEach(r => {
      html += `<div class="card glow-rose">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div><div style="font-size:13px;font-weight:500">${r.fantasyName}</div><div style="font-size:11px;color:var(--text2)">${r.pts} pts</div></div>
          <span class="status pending">⏳</span>
        </div>
        ${r.comment ? `<div style="font-size:12px;color:var(--text2);background:var(--bg4);border-radius:8px;padding:8px;margin-bottom:8px">"${r.comment}"</div>` : ''}
        <div class="row">
          <button class="btn btn-teal btn-sm" onclick="approveReq('${r.id}')">✓ Aprobar</button>
          <button class="btn btn-danger btn-sm" onclick="showRejectModal('${r.id}')">✕ Rechazar</button>
        </div>
      </div>`;
    });
  }
 
  if (myReqs.length > 0) {
    html += `<div class="section-hd" style="margin-top:16px"><div class="section-title">Mis solicitudes</div></div>`;
    const statusMap = { pending: 'pending', approved: 'approved', rejected: 'rejected', fulfilled: 'fulfilled' };
    const labelMap = { pending: '⏳ Pendiente', approved: '✓ Aprobada', rejected: '✕ Rechazada', fulfilled: '⭐ Cumplida' };
    myReqs.slice(0, 8).forEach(r => {
      html += `<div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${r.reason || r.approveComment ? '8px' : '0'}">
          <div style="font-size:13px;font-weight:500">${r.fantasyName}</div>
          <span class="status ${statusMap[r.status]}">${labelMap[r.status]}</span>
        </div>
        ${r.reason ? `<div style="font-size:12px;color:var(--rose);background:var(--bg4);border-radius:8px;padding:8px">Rechazado: "${r.reason}"</div>` : ''}
        ${r.approveComment ? `<div style="font-size:12px;color:var(--teal);background:var(--bg4);border-radius:8px;padding:8px">"${r.approveComment}"</div>` : ''}
        ${r.status === 'approved' && currentUserData.role === 'admin' ? `<button class="btn btn-sm btn-purple" onclick="markFulfilled('${r.id}')" style="margin-top:8px;width:100%">⭐ Marcar cumplida</button>` : ''}
      </div>`;
    });
  }
 
  document.getElementById('content').innerHTML = html;
}
 
function setFF(level, el) {
  fantasyFilter = level;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  showTab('fantasy');
}
 
async function showFantasyDetail(fid) {
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const groupSnap = await db.collection('groups').doc(gid).get();
  const group = groupSnap.data();
  const f = group.fantasies?.find(x => x.id === fid) || DEFAULT_FANTASIES.find(x => x.id === fid);
  if (!f) return;
  const membersSnap = await db.collection('users').where('groupId', '==', gid).where('active', '==', true).get();
  const members = membersSnap.docs.map(d => d.data()).filter(m => m.id !== uid);
  const partner = members[0];
  const pairKey = partner ? [uid, partner.id].sort().join('_') : null;
  const myPts = pairKey ? (group.pairPoints?.[pairKey]?.[uid] || 0) : 0;
  const canAfford = myPts >= f.pts;
  const levels = { basic: 'Básico', medium: 'Medio', high: 'Alto' };
  const levelColors = { basic: 'var(--teal)', medium: 'var(--amber)', high: 'var(--rose)' };
 
  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:56px;margin-bottom:10px">${f.icon}</div>
        <div style="font-family:var(--font-display);font-size:22px;font-weight:500;margin-bottom:4px">${f.name}</div>
        <div style="font-size:12px;color:${levelColors[f.level]};font-weight:500;margin-bottom:8px">${levels[f.level]}</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.5">${f.desc}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg4);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px">
        <div style="font-size:13px;color:var(--text2)">Costo en puntos</div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:500;color:var(--rose)">${f.pts}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg4);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px">
        <div style="font-size:13px;color:var(--text2)">Tus puntos disponibles</div>
        <div style="font-size:18px;font-weight:600;color:${canAfford ? 'var(--teal)' : 'var(--rose)'}">${myPts}</div>
      </div>
      ${canAfford ? `
      <div class="form-group">
        <label class="form-label">Nota para tu pareja</label>
        <textarea class="form-control" id="fantasy-comment" rows="2" placeholder="Agrega contexto o deseos especiales..."></textarea>
      </div>
      <button class="btn btn-primary btn-full" onclick="requestFantasy('${f.id}')">🔥 Solicitar esta fantasía</button>`
      : `<div style="text-align:center;background:var(--bg4);border-radius:var(--radius-sm);padding:16px;color:var(--text2);font-size:13px">
        Te faltan <strong style="color:var(--rose)">${f.pts - myPts} pts</strong> para solicitar esto.<br>
        <span style="font-size:12px;margin-top:4px;display:block">Sigue sumando acciones 💪</span>
      </div>
      <button class="btn btn-outline btn-full" style="margin-top:10px" onclick="closeModalDirect()">Cerrar</button>`}
    </div>
  </div>`;
}
 
async function requestFantasy(fid) {
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const comment = document.getElementById('fantasy-comment')?.value || '';
  const groupSnap = await db.collection('groups').doc(gid).get();
  const group = groupSnap.data();
  const f = group.fantasies?.find(x => x.id === fid) || DEFAULT_FANTASIES.find(x => x.id === fid);
  const membersSnap = await db.collection('users').where('groupId', '==', gid).where('active', '==', true).get();
  const members = membersSnap.docs.map(d => d.data()).filter(m => m.id !== uid);
  const partner = members[0];
  const pairKey = partner ? [uid, partner.id].sort().join('_') : null;
  const myPts = pairKey ? (group.pairPoints?.[pairKey]?.[uid] || 0) : 0;
 
  if (!f || myPts < f.pts) { showToast('Sin puntos suficientes'); return; }
 
  // Deduct points
  const pairPoints = group.pairPoints || {};
  if (pairKey) {
    if (!pairPoints[pairKey]) pairPoints[pairKey] = {};
    pairPoints[pairKey][uid] = Math.max(0, (pairPoints[pairKey][uid] || 0) - f.pts);
  }
  await db.collection('groups').doc(gid).update({ pairPoints });
 
  const reqRef = db.collection('groups').doc(gid).collection('requests').doc();
  await reqRef.set({
    id: reqRef.id,
    type: 'fantasy',
    requestedBy: uid,
    requestedByName: currentUserData.name,
    toUsers: partner ? [partner.id] : [],
    fantasyId: f.id,
    fantasyName: f.name,
    pts: f.pts,
    status: 'pending',
    comment,
    reason: '',
    approveComment: '',
    date: new Date().toLocaleDateString('es'),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
 
  if (partner) {
    await db.collection('groups').doc(gid).collection('notifications').add({
      toUserId: partner.id,
      text: `🔥 ${currentUserData.name} solicitó: ${f.name} (${f.pts} pts)`,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
 
  closeModalDirect();
  showToast('✓ Solicitud enviada');
  showTab('fantasy');
}
 
async function markFulfilled(reqId) {
  const gid = currentUserData.groupId;
  await db.collection('groups').doc(gid).collection('requests').doc(reqId).update({ status: 'fulfilled' });
  showToast('⭐ Marcada como cumplida');
  showTab('fantasy');
}
 
// ===== HISTORY =====
async function renderHistory() {
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const snap = await db.collection('groups').doc(gid).collection('history')
    .orderBy('createdAt', 'desc').limit(50).get();
  const all = snap.docs.map(d => d.data());
  const mine = all.filter(h => h.fromUser === uid || h.toUsers?.includes(uid));
 
  let html = `<div class="section-hd"><div class="section-title">Mi historial completo</div></div>`;
  if (mine.length === 0) {
    html += `<div class="empty"><div class="empty-icon">📊</div><div class="empty-text">Sin historial aún.<br>Registra tu primera acción.</div></div>`;
  } else {
    mine.forEach(h => {
      const isMe = h.fromUser === uid;
      html += `<div class="hist-item">
        <div class="hist-icon ${h.type}">${h.type === 'add' ? '⬆' : '⬇'}</div>
        <div style="flex:1">
          <div class="hist-name">${h.action}</div>
          <div class="hist-date">${isMe ? 'Tú' : h.fromUserName} · ${h.date || ''}${h.comment ? ' · "' + h.comment + '"' : ''}</div>
        </div>
        <div class="hist-pts ${h.type}">${h.type === 'add' ? '+' : '-'}${h.pts}</div>
      </div>`;
    });
  }
  document.getElementById('content').innerHTML = html;
}
 
// ===== ADMIN =====
async function renderAdmin() {
  if (currentUserData.role !== 'admin') {
    document.getElementById('content').innerHTML = '<div class="empty"><div class="empty-icon">🔒</div><div class="empty-text">Solo administradores</div></div>';
    return;
  }
  const gid = currentUserData.groupId;
  const [membersSnap, groupSnap] = await Promise.all([
    db.collection('users').where('groupId', '==', gid).get(),
    db.collection('groups').doc(gid).get()
  ]);
  const members = membersSnap.docs.map(d => d.data());
  const group = groupSnap.data();
 
  let html = `<div class="section-hd"><div class="section-title">Usuarios (${members.length})</div>
    <button class="btn btn-primary btn-sm" onclick="showInviteModal()">+ Invitar</button>
  </div>`;
 
  members.forEach(m => {
    html += `<div class="card">
      <div class="user-item" style="border:none;padding:0">
        <div class="user-avatar-lg" style="background:${m.color}22;color:${m.color}">${m.initials}</div>
        <div style="flex:1">
          <div class="user-name-text">${m.name}</div>
          <div class="user-meta">${m.email}</div>
          <div class="user-meta">${m.gender} · ${m.orientation}</div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
            <span class="role-badge ${m.role === 'admin' ? 'role-admin' : 'role-viewer'}">${m.role === 'admin' ? '👑 Admin' : '👁 Viewer'}</span>
            ${!m.active ? '<span class="role-badge role-disabled">🚫 Inactivo</span>' : ''}
          </div>
        </div>
        ${m.id !== currentUser.uid ? `
        <div style="display:flex;flex-direction:column;gap:6px">
          <select class="form-control" style="padding:5px 8px;font-size:11px" onchange="changeRole('${m.id}',this.value)">
            <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
            <option value="viewer" ${m.role === 'viewer' ? 'selected' : ''}>👁 Viewer</option>
          </select>
          <button class="btn btn-sm ${m.active ? 'btn-danger' : 'btn-teal'}" onclick="toggleMember('${m.id}',${m.active})">
            ${m.active ? '🚫 Desactivar' : '✓ Activar'}
          </button>
        </div>` : '<span style="font-size:11px;color:var(--text2)">Tú</span>'}
      </div>
    </div>`;
  });
 
  html += `<div class="section-hd" style="margin-top:8px"><div class="section-title">Ajustar puntos manualmente</div></div>
  <div class="card">
    <div class="form-group">
      <label class="form-label">Usuario</label>
      <select class="form-control" id="adj-u">`;
  members.filter(m => m.active).forEach(m => { html += `<option value="${m.id}">${m.name}</option>`; });
  html += `</select></div>
    <div class="form-group">
      <label class="form-label">Puntos (+ suma / - resta)</label>
      <input type="number" class="form-control" id="adj-p" placeholder="Ej: 30 o -10">
    </div>
    <div class="form-group">
      <label class="form-label">Motivo</label>
      <input type="text" class="form-control" id="adj-r" placeholder="Ej: Cumpleaños de ella">
    </div>
    <button class="btn btn-primary btn-full" onclick="adjustPts()">Aplicar</button>
  </div>`;
 
  html += `<div class="section-hd" style="margin-top:8px"><div class="section-title">Fechas especiales</div></div>`;
  (group.specialDates || DEFAULT_SPECIAL_DATES).forEach(d => {
    html += `<div class="special-date-card">
      <div>
        <div style="font-size:13px;font-weight:500">${d.icon} ${d.name}</div>
        <div style="font-size:11px;color:var(--text2)">${d.date} · +${d.pts} pts a todos</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="applyDate('${d.name}',${d.pts})">Aplicar</button>
    </div>`;
  });
 
  html += `<div class="section-hd" style="margin-top:16px"><div class="section-title">Agregar fantasía</div></div>
  <div class="card">
    <div class="form-group"><label class="form-label">Emoji</label><input type="text" class="form-control" id="nf-icon" placeholder="🔥" maxlength="2"></div>
    <div class="form-group"><label class="form-label">Nombre</label><input type="text" class="form-control" id="nf-name" placeholder="Nombre de la fantasía"></div>
    <div class="form-group"><label class="form-label">Descripción</label><input type="text" class="form-control" id="nf-desc" placeholder="Breve descripción"></div>
    <div class="form-group"><label class="form-label">Puntos</label><input type="number" class="form-control" id="nf-pts" placeholder="0"></div>
    <div class="form-group"><label class="form-label">Nivel</label>
      <select class="form-control" id="nf-level">
        <option value="basic">🟢 Básico</option>
        <option value="medium">🟡 Medio</option>
        <option value="high">🔴 Alto</option>
      </select>
    </div>
    <button class="btn btn-primary btn-full" onclick="addFantasy()">Agregar fantasía</button>
  </div>`;
 
  document.getElementById('content').innerHTML = html;
}
 
async function changeRole(uid, role) {
  await db.collection('users').doc(uid).update({ role });
  showToast('Rol actualizado');
}
 
async function toggleMember(uid, active) {
  await db.collection('users').doc(uid).update({ active: !active });
  showToast(active ? 'Usuario desactivado' : 'Usuario activado');
  showTab('admin');
}
 
async function adjustPts() {
  const uid = document.getElementById('adj-u')?.value;
  const pts = parseInt(document.getElementById('adj-p')?.value || '0');
  const reason = document.getElementById('adj-r')?.value || 'Ajuste manual';
  if (!uid || isNaN(pts) || pts === 0) { showToast('Completa todos los campos'); return; }
  const gid = currentUserData.groupId;
  const groupSnap = await db.collection('groups').doc(gid).get();
  const group = groupSnap.data();
  const pairPoints = group.pairPoints || {};
  const members = await db.collection('users').where('groupId', '==', gid).where('active', '==', true).get();
  members.docs.forEach(d => {
    const m = d.data();
    if (m.id !== uid) {
      const pk = [uid, m.id].sort().join('_');
      if (!pairPoints[pk]) pairPoints[pk] = {};
      pairPoints[pk][uid] = Math.max(0, (pairPoints[pk][uid] || 0) + pts);
    }
  });
  await db.collection('groups').doc(gid).update({ pairPoints });
  await db.collection('groups').doc(gid).collection('history').add({
    fromUser: currentUser.uid,
    fromUserName: currentUserData.name,
    toUsers: [uid],
    action: reason,
    pts: Math.abs(pts),
    type: pts > 0 ? 'add' : 'sub',
    date: new Date().toLocaleDateString('es'),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast(`${pts > 0 ? '+' : ''}${pts} pts aplicados`);
  showTab('admin');
}
 
async function applyDate(name, pts) {
  if (!confirm(`Aplicar +${pts} pts a todos por: ${name}?`)) return;
  const gid = currentUserData.groupId;
  const groupSnap = await db.collection('groups').doc(gid).get();
  const group = groupSnap.data();
  const pairPoints = group.pairPoints || {};
  const membersSnap = await db.collection('users').where('groupId', '==', gid).where('active', '==', true).get();
  const members = membersSnap.docs.map(d => d.data());
  members.forEach(m => {
    members.forEach(n => {
      if (m.id !== n.id) {
        const pk = [m.id, n.id].sort().join('_');
        if (!pairPoints[pk]) pairPoints[pk] = {};
        pairPoints[pk][m.id] = (pairPoints[pk][m.id] || 0) + pts;
      }
    });
  });
  await db.collection('groups').doc(gid).update({ pairPoints });
  await db.collection('groups').doc(gid).collection('history').add({
    fromUser: currentUser.uid,
    fromUserName: currentUserData.name,
    toUsers: members.map(m => m.id),
    action: name,
    pts,
    type: 'add',
    date: new Date().toLocaleDateString('es'),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast(`✓ +${pts} pts a todos`);
  showTab('admin');
}
 
async function addFantasy() {
  const icon = document.getElementById('nf-icon')?.value || '🔥';
  const name = document.getElementById('nf-name')?.value?.trim();
  const desc = document.getElementById('nf-desc')?.value?.trim() || '';
  const pts = parseInt(document.getElementById('nf-pts')?.value || '0');
  const level = document.getElementById('nf-level')?.value;
  if (!name || isNaN(pts)) { showToast('Completa nombre y puntos'); return; }
  const gid = currentUserData.groupId;
  await db.collection('groups').doc(gid).update({
    fantasies: firebase.firestore.FieldValue.arrayUnion({
      id: 'f_' + Date.now(), name, pts, level, icon, desc
    })
  });
  showToast('Fantasía agregada');
  showTab('admin');
}
 
// ===== INVITE =====
async function showInviteModal() {
  const gid = currentUserData.groupId;
  const groupSnap = await db.collection('groups').doc(gid).get();
  const code = groupSnap.data().inviteCode;
  const msg = `¡Te invito a Ignite! 🔥 La app para encender tu relación. Código: ${code}`;
  const encoded = encodeURIComponent(msg);
 
  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-title">Invitar usuario</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:10px">Comparte este código de acceso:</div>
      <div class="code-block" onclick="copyCode('${code}')">${code} 📋</div>
      <div style="font-size:11px;color:var(--text2);text-align:center;margin:6px 0 16px">Toca para copiar</div>
      <div class="section-title" style="margin-bottom:8px">Compartir por</div>
      <div class="invite-option" onclick="window.open('https://wa.me/?text=${encoded}','_blank')">
        <div class="invite-icon" style="background:#25D36615">💬</div>
        <div style="flex:1"><div class="invite-name">WhatsApp</div><div class="invite-sub">Enviar invitación</div></div>
        <span style="color:var(--text2)">→</span>
      </div>
      <div class="invite-option" onclick="window.open('https://t.me/share/url?text=${encoded}','_blank')">
        <div class="invite-icon" style="background:#229ED915">✈️</div>
        <div style="flex:1"><div class="invite-name">Telegram</div><div class="invite-sub">Enviar invitación</div></div>
        <span style="color:var(--text2)">→</span>
      </div>
      <div class="invite-option" onclick="copyCode('${msg}');showToast('Copia y pega en Instagram DM')">
        <div class="invite-icon" style="background:#E1306C15">📸</div>
        <div style="flex:1"><div class="invite-name">Instagram</div><div class="invite-sub">Copiar mensaje para DM</div></div>
        <span style="color:var(--text2)">→</span>
      </div>
    </div>
  </div>`;
}
 
function copyCode(text) {
  try { navigator.clipboard.writeText(text); showToast('Copiado al portapapeles'); } catch (e) { showToast('Copia: ' + text); }
}
 
// ===== PROFILE =====
async function renderProfile() {
  const u = currentUserData;
  const gid = u.groupId;
  let groupCode = '';
  if (gid) {
    const gs = await db.collection('groups').doc(gid).get();
    groupCode = gs.data()?.inviteCode || '';
  }
 
  const html = `<div class="profile-hero">
    <div class="profile-avatar-lg" style="background:${u.color}22;color:${u.color};border-color:${u.color}44">${u.initials}</div>
    <div class="profile-name">${u.name}</div>
    <div class="profile-email">${u.email}</div>
    <div class="profile-badges">
      <span class="role-badge ${u.role === 'admin' ? 'role-admin' : 'role-viewer'}">${u.role === 'admin' ? '👑 Admin' : '👁 Viewer'}</span>
      <span class="role-badge role-viewer">${u.gender}</span>
      <span class="role-badge role-viewer">${u.orientation}</span>
    </div>
  </div>
  <div class="divider"></div>
  ${groupCode ? `<div class="card"><div style="font-size:12px;color:var(--text2);margin-bottom:6px">Código de tu grupo</div><div class="code-block" onclick="copyCode('${groupCode}')">${groupCode} 📋</div></div>` : ''}
  <button class="btn btn-danger btn-full" onclick="signOut()" style="margin-top:16px">Cerrar sesión</button>`;
 
  document.getElementById('content').innerHTML = html;
}
 
async function signOut() {
  await auth.signOut();
  showToast('Sesión cerrada');
}
 
// ===== NOTIFICATIONS =====
async function showNotifs() {
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const snap = await db.collection('groups').doc(gid).collection('notifications')
    .where('toUserId', '==', uid).orderBy('createdAt', 'desc').limit(20).get();
  const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
 
  // Mark as read
  snap.docs.forEach(d => { if (!d.data().read) db.collection('groups').doc(gid).collection('notifications').doc(d.id).update({ read: true }); });
 
  let html = `<div class="modal-overlay" onclick="closeModal(event)"><div class="modal">
    <div class="modal-handle"></div>
    <div class="modal-title">🔔 Notificaciones</div>`;
  if (notifs.length === 0) {
    html += `<div class="empty"><div class="empty-icon">🔕</div><div class="empty-text">Sin notificaciones</div></div>`;
  } else {
    notifs.forEach(n => {
      html += `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:13px">${n.text}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:3px">${n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString('es') : ''}</div>
      </div>`;
    });
  }
  html += `</div></div>`;
  document.getElementById('modal-container').innerHTML = html;
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = 'none';
}
 
// ===== MODAL =====
function closeModal(e) { if (e.target.classList.contains('modal-overlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modal-container').innerHTML = ''; }
 
// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
