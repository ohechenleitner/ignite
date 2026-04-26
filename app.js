// ===== IGNITE APP.JS v7 =====
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
const storage = firebase.storage();

// ===== STATE =====
let currentUser = null;
let currentUserData = null;
let currentTab = 'inicio';
let fantasyFilter = 'all'; // categoria: all, pareja, grupo
let fantasyLevel = 'all';  // nivel: all, basic, medium, high
let selUsers = [];
let uploadContext = null;
let pendingEvidenceBase64 = null;

// ===== GAME DATA =====
const GAME_CHALLENGES = {
  suave: {
    label: 'Suave', icon: '🌸', color: '#4ECBA0',
    presencial: [
      'Imita el acento de otro país durante 2 minutos',
      'Di 5 cosas positivas de la persona a tu derecha',
      'Muestra la última foto que tomaste con tu teléfono',
      'Haz tu mejor baile sin música durante 30 segundos',
      'Cuenta un chiste y todos deben reír o pagan prenda',
      'Describe a alguien del grupo sin decir su nombre',
      'Haz una pose de superhéroe y mantenla 15 segundos',
      'Canta el coro de la última canción que escuchaste',
      'Di un secreto sin importancia que nadie sepa de ti',
      'Imita a alguien famoso y el grupo adivina quién es'
    ],
    remoto: [
      'Muestra el objeto más raro que tengas cerca ahora mismo',
      'Haz una cara graciosa y toma una captura de pantalla',
      'Muestra tu fondo de pantalla del teléfono y explícalo',
      'Lee el último mensaje de texto que recibiste en voz alta',
      'Muestra el último meme que guardaste',
      'Describe tu cuarto sin mostrar la cámara',
      'Haz 10 flexiones en pantalla ahora mismo',
      'Muestra tu snack favorito del momento',
      'Canta 15 segundos de tu canción favorita',
      'Muestra la vista desde tu ventana más cercana'
    ]
  },
  moderado: {
    label: 'Moderado', icon: '🔥', color: '#F5A623',
    presencial: [
      'Susurra algo al oído de la persona a tu izquierda',
      'Deja que alguien revise tu galería de fotos por 10 segundos',
      'Intercambia un accesorio con alguien del grupo por el resto del juego',
      'Recita un poema improvisado para alguien del grupo',
      'Deja que el grupo te cambie el nombre de contacto en el teléfono',
      'Muestra el perfil de redes sociales que menos usas',
      'Haz un masaje de hombros de 30 segundos a quien indique el grupo',
      'Di la verdad sobre lo primero que pensaste de alguien del grupo',
      'Deja que alguien elija tu foto de perfil por una hora',
      'Baila con la persona que el grupo elija por una canción completa'
    ],
    remoto: [
      'Muestra el contacto más antiguo de tu teléfono',
      'Lee el último correo que recibiste en voz alta',
      'Muestra tu historial de búsqueda de las últimas 2 horas',
      'Haz una reverencia exagerada ante la cámara durante 30 segundos',
      'Muestra la canción que más has escuchado este mes',
      'Describe tu outfit de hoy como si fuera alta costura',
      'Muestra el emoji que más usas en WhatsApp',
      'Lee en voz alta el último comentario que escribiste en redes',
      'Haz una reseña dramática del lugar donde estás sentado',
      'Muestra y explica la última compra que hiciste en línea'
    ]
  },
  hot: {
    label: 'Hot', icon: '💋', color: '#E8608A',
    presencial: [
      'Mantén contacto visual con alguien del grupo sin reír por 1 minuto',
      'Di en voz alta algo que te intimide admitir normalmente',
      'Deja que alguien del grupo lea el último chat de WhatsApp que abriste',
      'Describe tu tipo ideal de persona con todo detalle',
      'Confiesa algo que nunca has hecho pero siempre quisiste intentar',
      'Deja que el grupo adivine quién te parece más atractivo del grupo',
      'Di sin filtro qué cambiarías de la noche hasta ahora',
      'Haz tu mejor mirada seductora a la cámara o al grupo',
      'Confiesa cuál fue tu mayor atrevimiento en los últimos 6 meses',
      'Describe sin nombres a alguien que te haya impresionado recientemente'
    ],
    remoto: [
      'Muestra y explica el objeto más personal que tengas cerca',
      'Lee en voz alta el último mensaje que hayas mandado con emojis de corazón',
      'Di en cámara algo que normalmente solo piensas pero no dices',
      'Muestra la última foto que tomaste de ti mismo',
      'Confiesa cuál es tu mayor debilidad en una persona',
      'Describe tu noche perfecta ideal con todo detalle',
      'Muestra y explica tu playlist más personal',
      'Di en cámara un cumplido genuino a cada persona del grupo',
      'Confiesa qué app usas más y de qué te da más vergüenza',
      'Describe sin filtros qué es lo primero que notas de alguien cuando lo conoces'
    ]
  }
};

// ===== FANTASÍAS DEFAULT AMPLIADAS =====
// ===== IGNITE - CATÁLOGO COMPLETO v5 =====
// Genérico para cualquier orientación sexual, género o tipo de pareja

// ===== ACCIONES GENÉRICAS =====
// Las acciones están divididas en 3 grupos:
// - him: acciones típicamente masculinas
// - her: acciones típicamente femeninas  
// - neutral: acciones para cualquier persona (se usan para todos)

const DEFAULT_ACTIONS_NEUTRAL = [
  // ===== CONEXIÓN EMOCIONAL =====
  { id:'an1',  name:'Mensaje cariñoso durante el día',           pts:3,  icon:'💬', cat:'emocional' },
  { id:'an2',  name:'Decirle algo genuinamente bonito',           pts:4,  icon:'💕', cat:'emocional' },
  { id:'an3',  name:'Escuchar activamente sin interrumpir',       pts:4,  icon:'👂', cat:'emocional' },
  { id:'an4',  name:'Recordar algo importante que mencionó',      pts:5,  icon:'🧠', cat:'emocional' },
  { id:'an5',  name:'Nota escrita a mano o carta',                pts:6,  icon:'💌', cat:'emocional' },
  { id:'an6',  name:'Llamada solo para decir que lo extrañas',    pts:4,  icon:'📞', cat:'emocional' },
  { id:'an7',  name:'Agradecer algo específico que hace por ti',  pts:4,  icon:'🙏', cat:'emocional' },
  { id:'an8',  name:'Compartir algo que te hizo pensar en él/ella', pts:3, icon:'💭', cat:'emocional' },
  { id:'an9',  name:'Pedirle su opinión sobre algo importante',   pts:4,  icon:'🤝', cat:'emocional' },
  { id:'an10', name:'Disculparse sinceramente por algo',          pts:6,  icon:'🕊️', cat:'emocional' },

  // ===== TIEMPO DE CALIDAD =====
  { id:'an11', name:'Acurrucarse juntos sin pantallas',           pts:5,  icon:'🛋️', cat:'tiempo' },
  { id:'an12', name:'Bailar juntos en casa',                      pts:6,  icon:'💃', cat:'tiempo' },
  { id:'an13', name:'Ver juntos algo que le gusta',               pts:5,  icon:'🎬', cat:'tiempo' },
  { id:'an14', name:'Salir a caminar juntos sin destino',         pts:5,  icon:'🚶', cat:'tiempo' },
  { id:'an15', name:'Noche de juegos de mesa o cartas juntos',    pts:5,  icon:'🎲', cat:'tiempo' },
  { id:'an16', name:'Cocinar juntos algo nuevo',                  pts:6,  icon:'🍳', cat:'tiempo' },
  { id:'an17', name:'Leer el mismo libro y comentarlo',           pts:6,  icon:'📚', cat:'tiempo' },
  { id:'an18', name:'Ver un amanecer o atardecer juntos',         pts:7,  icon:'🌅', cat:'tiempo' },
  { id:'an19', name:'Picnic improvisado en casa o al aire libre', pts:6,  icon:'🧺', cat:'tiempo' },
  { id:'an20', name:'Noche de música — elegir canciones juntos',  pts:5,  icon:'🎵', cat:'tiempo' },

  // ===== ACTOS DE SERVICIO =====
  { id:'an21', name:'Preparar el desayuno sin que lo pidan',      pts:5,  icon:'☕', cat:'servicio' },
  { id:'an22', name:'Resolver algo sin que te lo pidan',          pts:5,  icon:'🔧', cat:'servicio' },
  { id:'an23', name:'Hacer una tarea que no te corresponde',      pts:6,  icon:'🧹', cat:'servicio' },
  { id:'an24', name:'Traerle algo que sabe que le gusta',         pts:5,  icon:'🎁', cat:'servicio' },
  { id:'an25', name:'Organizar una salida completa sin ayuda',    pts:8,  icon:'🗓️', cat:'servicio' },

  // ===== CONTACTO FÍSICO AFECTIVO =====
  { id:'an26', name:'Masaje en espalda u hombros espontáneo',     pts:6,  icon:'💆', cat:'contacto' },
  { id:'an27', name:'Abrazo largo sin razón específica',          pts:4,  icon:'🤗', cat:'contacto' },
  { id:'an28', name:'Tomarse de la mano en público',              pts:4,  icon:'🤝', cat:'contacto' },
  { id:'an29', name:'Beso apasionado sin que lleve a nada más',   pts:5,  icon:'💋', cat:'contacto' },
  { id:'an30', name:'Dormirse abrazados',                         pts:5,  icon:'🌙', cat:'contacto' },

  // ===== CRECIMIENTO CONJUNTO =====
  { id:'an31', name:'Compartir una meta personal que tienes',     pts:5,  icon:'🎯', cat:'crecimiento' },
  { id:'an32', name:'Proponer un proyecto o sueño juntos',        pts:7,  icon:'✨', cat:'crecimiento' },
  { id:'an33', name:'Hablar sobre el futuro que imaginan',        pts:6,  icon:'🌟', cat:'crecimiento' },
  { id:'an34', name:'Meditar o hacer yoga juntos',                pts:6,  icon:'🧘', cat:'crecimiento' },
  { id:'an35', name:'Ejercitarse juntos',                         pts:5,  icon:'🏃', cat:'crecimiento' },

  // ===== SEDUCCIÓN Y PASIÓN =====
  { id:'an36', name:'Foto coqueta enviada por privado',           pts:7,  icon:'📸', cat:'pasion' },
  { id:'an37', name:'Mensaje seductor inesperado',                pts:6,  icon:'🔥', cat:'pasion' },
  { id:'an38', name:'Tomar la iniciativa en la intimidad',        pts:9,  icon:'⚡', cat:'pasion' },
  { id:'an39', name:'Proponer algo nuevo en la intimidad',        pts:10, icon:'💫', cat:'pasion' },
  { id:'an40', name:'Vestirse sexy por iniciativa propia',        pts:10, icon:'👗', cat:'pasion' },
];

const DEFAULT_ACTIONS_HIM = [
  { id:'ah1', name:'Flores o detalle sin razón',                  pts:6,  icon:'🌸' },
  { id:'ah2', name:'Planificar cena romántica completa',          pts:9,  icon:'🕯️' },
  { id:'ah3', name:'Desayuno en cama por sorpresa',              pts:7,  icon:'🍳' },
  { id:'ah4', name:'Escucharla sin el teléfono en mano',         pts:5,  icon:'👂' },
  { id:'ah5', name:'Decirle algo que admira de ella',            pts:6,  icon:'💬' },
  { id:'ah6', name:'Comprar algo que mencionó querer',           pts:8,  icon:'🎁' },
  { id:'ah7', name:'Buscarla físicamente sin que ella inicie',   pts:9,  icon:'💋' },
  { id:'ah8', name:'Escribirle un poema o carta de amor',        pts:8,  icon:'📝' },
  { id:'ah9', name:'Llevarla a un lugar que ella quería conocer', pts:10, icon:'🗺️' },
  { id:'ah10', name:'Recordar una fecha especial y celebrarla',  pts:8,  icon:'🎂' },
];

const DEFAULT_ACTIONS_HER = [
  { id:'ae1', name:'Buscarlo sin que él lo inicie',              pts:9,  icon:'💋' },
  { id:'ae2', name:'Mensaje seductor durante el día',            pts:6,  icon:'💬' },
  { id:'ae3', name:'Foto íntima enviada por privado',            pts:8,  icon:'📸' },
  { id:'ae4', name:'Ponerse algo sexy por iniciativa propia',    pts:10, icon:'✨' },
  { id:'ae5', name:'Sorprenderlo con su comida favorita',        pts:7,  icon:'🍽️' },
  { id:'ae6', name:'Decirle algo específico que admira de él',  pts:6,  icon:'💬' },
  { id:'ae7', name:'Tomar la iniciativa completamente',          pts:10, icon:'🔥' },
  { id:'ae8', name:'Proponer algo nuevo por su cuenta',          pts:10, icon:'💫' },
  { id:'ae9', name:'Carta o nota romántica escrita a mano',      pts:7,  icon:'💌' },
  { id:'ae10', name:'Planificar una sorpresa especial para él',  pts:9,  icon:'🎉' },
];



// ===== FANTASÍAS COMPLETAS =====
// BÁSICAS: se desbloquean con 3-4 acciones
// MEDIAS: se desbloquean con 6-8 acciones
// FUERTES: se desbloquean con 10+ acciones
// Todo genérico para cualquier orientación/género

const DEFAULT_FANTASIES = [

  // ===== BÁSICAS (pts: 12-25) =====
  // 3-4 acciones equivalen aprox a 12-20 pts
  {
    id: 'fb1', name: 'Noche de películas íntima', pts: 8, level: 'basic', icon: '🎬',
    desc: 'Una noche especial solos viendo lo que ambos quieran, con snacks, manta y cero interrupciones.',
    category: 'pareja',
  },
  {
    id: 'fb2', name: 'Desayuno en cama sorpresa', pts: 10, level: 'basic', icon: '☕',
    desc: 'Despertar con el desayuno servido, sin prisas ni obligaciones ese día.',
    category: 'pareja',
  },
  {
    id: 'fb3', name: 'Noche de masajes mutuos', pts: 12, level: 'basic', icon: '💆',
    desc: 'Noche dedicada a masajes relajantes y sensuales, con aceites y sin apuros.',
    category: 'pareja',
  },
  {
    id: 'fb4', name: 'Sesión de fotos íntima en casa', pts: 14, level: 'basic', icon: '📸',
    desc: 'Una sesión fotográfica personal entre los dos. Sin censura, solo para sus ojos.',
    category: 'pareja',
  },
  {
    id: 'fb5', name: 'Noche de juegos de pareja', pts: 15, level: 'basic', icon: '🎲',
    desc: 'Juegos de cartas o retos solo entre los dos, con nivel de picardía que decidan juntos.',
    category: 'pareja',
  },
  {
    id: 'fb6', name: 'Baño o ducha compartida', pts: 10, level: 'basic', icon: '🛁',
    desc: 'Una noche con baño de espuma, velas y total privacidad.',
    category: 'pareja',
  },
  {
    id: 'fb7', name: 'Cena romántica en casa', pts: 10, level: 'basic', icon: '🕯️',
    desc: 'Cena preparada con mimo, buena música, luces tenues. Sin salir de casa.',
    category: 'pareja',
  },
  {
    id: 'fb8', name: 'Día sin pantallas juntos', pts: 8, level: 'basic', icon: '🌿',
    desc: 'Un día completo desconectados del teléfono, dedicado solo el uno al otro.',
    category: 'pareja',
  },
  {
    id: 'fb9', name: 'Modelar ropa nueva o lencería', pts: 15, level: 'basic', icon: '✨',
    desc: 'Una de las dos personas modela varias prendas que la otra elija. Solo para sus ojos.',
    category: 'pareja',
  },
  {
    id: 'fb10', name: 'Noche de baile en casa', pts: 10, level: 'basic', icon: '💃',
    desc: 'Música, espacio libre y bailar juntos sin importar qué tan bien o mal lo hagan.',
    category: 'pareja',
  },
  {
    id: 'fb11', name: 'Rol de primera cita', pts: 18, level: 'basic', icon: '💑',
    desc: 'Simular que son dos desconocidos que se conocen por primera vez. Salida, galantería y todo.',
    category: 'pareja',
  },
  {
    id: 'fb12', name: 'Picnic privado en casa', pts: 8, level: 'basic', icon: '🧺',
    desc: 'Manta en el suelo, comida rica, vino y total intimidad. Sin salir.',
    category: 'pareja',
  },
  {
    id: 'fb13', name: 'Ver contenido adulto juntos', pts: 12, level: 'basic', icon: '🎬',
    desc: 'Elegir juntos y ver sin prejuicios. Un espacio seguro para explorar.',
    category: 'pareja',
  },
  {
    id: 'fb14', name: 'Noche de confesiones', pts: 14, level: 'basic', icon: '🤫',
    desc: 'Contarse cosas que nunca han dicho. Fantasías, miedos, deseos sin filtro.',
    category: 'pareja',
  },
  {
    id: 'fb15', name: 'Sorpresa creativa en casa', pts: 16, level: 'basic', icon: '🎭',
    desc: 'Preparar una sorpresa especial en casa. Puede ser decoración, experiencia o actividad.',
    category: 'pareja',
  },

  // ===== MEDIAS (pts: 30-55) =====
  // 6-8 acciones equivalen aprox a 30-50 pts
  {
    id: 'fm1', name: 'Escapada de una noche sorpresa', pts: 28, level: 'medium', icon: '🌙',
    desc: 'Una noche fuera sin revelar el destino hasta el momento. Hotel, cabaña o Airbnb.',
    category: 'pareja',
  },
  {
    id: 'fm2', name: 'Cena elegante muy producidos', pts: 24, level: 'medium', icon: '🍷',
    desc: 'Salir a un restaurante especial con full producción: ropa, perfume, actitud.',
    category: 'pareja',
  },
  {
    id: 'fm3', name: 'Sesión de fotos con fotógrafo', pts: 30, level: 'medium', icon: '🎨',
    desc: 'Sesión fotográfica profesional o semi-profesional. Sensual, artística o como quieran.',
    category: 'pareja',
  },
  {
    id: 'fm4', name: 'Fin de semana solos sin agenda', pts: 35, level: 'medium', icon: '✈️',
    desc: 'Escaparse dos o tres días sin itinerario fijo. Solo estar juntos y decidir en el momento.',
    category: 'pareja',
  },
  {
    id: 'fm5', name: 'Cabaña con jacuzzi privado', pts: 38, level: 'medium', icon: '🛁',
    desc: 'Escapada con jacuzzi privado, sin vecinos y con total libertad.',
    category: 'pareja',
  },
  {
    id: 'fm6', name: 'Playa o piscina con look elegido', pts: 26, level: 'medium', icon: '🏖️',
    desc: 'Salida a la playa o piscina donde uno elige el traje de baño o look del otro.',
    category: 'ambos',
  },
  {
    id: 'fm7', name: 'Noche de striptease privado', pts: 32, level: 'medium', icon: '💃',
    desc: 'Una actuación de baile sensual completamente privada. Música, ambiente y actitud.',
    category: 'pareja',
  },
  {
    id: 'fm8', name: 'Salida de noche muy producidos', pts: 24, level: 'medium', icon: '🌙',
    desc: 'Bar, discoteca o evento con full producción. Verse increíbles y disfrutarlo juntos.',
    category: 'ambos',
  },
  {
    id: 'fm9', name: 'Explorar algo nuevo en la intimidad', pts: 30, level: 'medium', icon: '🔥',
    desc: 'Proponer y realizar algo que ninguno ha hecho antes. Acordado y con total confianza.',
    category: 'pareja',
  },
  {
    id: 'fm10', name: 'Noche temática en casa', pts: 28, level: 'medium', icon: '🎭',
    desc: 'Elegir un tema, ambientar la casa, vestirse acorde y mantenerlo toda la noche.',
    category: 'pareja',
  },
  {
    id: 'fm11', name: 'Salida con alguien de confianza incluido', pts: 32, level: 'medium', icon: '👥',
    desc: 'Salida nocturna con un amigo o amiga de confianza. Cena, bebidas y buen ambiente.',
    category: 'grupo',
  },
  {
    id: 'fm12', name: 'Juegos de adultos con tercero presente', pts: 36, level: 'medium', icon: '🎯',
    desc: 'Verdad o reto con alguien más de confianza. Sin presión, solo diversión y picardía.',
    category: 'grupo',
  },
  {
    id: 'fm13', name: 'Modelar outfits para que otros opinen', pts: 30, level: 'medium', icon: '👀',
    desc: 'Mostrar varios looks o atuendos a alguien de confianza para que decida cuál usar.',
    category: 'grupo',
  },
  {
    id: 'fm14', name: 'Escapada de playa en grupo pequeño', pts: 35, level: 'medium', icon: '🏖️',
    desc: 'Viaje corto a la playa con personas de total confianza. Libertad y diversión.',
    category: 'grupo',
  },
  {
    id: 'fm15', name: 'Noche en club o bar de ambiente', pts: 28, level: 'medium', icon: '🌙',
    desc: 'Salida a un lugar con ambiente libre y adulto. Sin agenda ni expectativas.',
    category: 'ambos',
  },

  // ===== FUERTES (pts: 65-100+) =====
  // 10 acciones equivalen aprox a 65-100 pts
  {
    id: 'ff1', name: 'Fin de semana sin reglas conocidas', pts: 50, level: 'high', icon: '⚡',
    desc: 'Un fin de semana donde quien gana los puntos decide todo. Sin veto previo. Confianza total.',
    category: 'pareja',
  },
  {
    id: 'ff2', name: 'Sesión fotográfica artística muy íntima', pts: 52, level: 'high', icon: '🎨',
    desc: 'Sesión fotográfica sin límites de exposición. Solo para la pareja. Artística y sin censura.',
    category: 'pareja',
  },
  {
    id: 'ff3', name: 'Experiencia de fantasía confesada', pts: 55, level: 'high', icon: '💫',
    desc: 'Cumplir una fantasía que alguien confesó y nunca pensó que pasaría. Planeada con cuidado.',
    category: 'pareja',
  },
  {
    id: 'ff4', name: 'Noche de roles sin límites', pts: 56, level: 'high', icon: '🎭',
    desc: 'Adoptar roles o personajes durante toda una noche. Total libertad creativa y de expresión.',
    category: 'pareja',
  },
  {
    id: 'ff5', name: 'Entrega total de control por una noche', pts: 58, level: 'high', icon: '🎯',
    desc: 'Una persona entrega el control completo de la noche a la otra. Sin veto, con confianza.',
    category: 'pareja',
  },
  {
    id: 'ff6', name: 'Viaje sorpresa de varios días', pts: 60, level: 'high', icon: '✈️',
    desc: 'Un viaje completo organizado en secreto. Destino, hotel y actividades elegidas por uno solo.',
    category: 'pareja',
  },
  {
    id: 'ff7', name: 'Masaje profesional con observador', pts: 54, level: 'high', icon: '🕯️',
    desc: 'Uno recibe un masaje profesional sensual mientras el otro observa. Consentido y acordado.',
    category: 'grupo',
  },
  {
    id: 'ff8', name: 'Noche en club de ambiente adulto', pts: 45, level: 'high', icon: '🌙',
    desc: 'Asistir a un espacio de ambiente adulto liberal. Sin presión ni obligación de nada.',
    category: 'ambos',
  },
  {
    id: 'ff9', name: 'Juegos sin límites con tercero de confianza', pts: 58, level: 'high', icon: '🔥',
    desc: 'Retos y juegos adultos sin restricciones con alguien de absoluta confianza.',
    category: 'grupo',
  },
  {
    id: 'ff10', name: 'Lencería o look extremo ante tercero', pts: 55, level: 'high', icon: '✨',
    desc: 'Modelar ropa muy íntima o look muy atrevido ante alguien de confianza elegido por ambos.',
    category: 'grupo',
  },
  {
    id: 'ff11', name: 'Experiencia en grupo de confianza', pts: 60, level: 'high', icon: '💥',
    desc: 'Una experiencia íntima compartida con personas de absoluta confianza. Acordada por todos.',
    category: 'grupo',
  },
  {
    id: 'ff12', name: 'La fantasía máxima acordada', pts: 65, level: 'high', icon: '🌟',
    desc: 'La fantasía que ambos definieron como la máxima. Completamente personalizada para esta pareja.',
    category: 'ambos',
  },
  {
    id: 'ff13', name: 'Noche de total vulnerabilidad', pts: 48, level: 'high', icon: '💫',
    desc: 'Compartir la noche siendo completamente honestos, vulnerables y sin defensas. Intimidad real.',
    category: 'pareja',
  },
  {
    id: 'ff14', name: 'Experiencia fuera de la ciudad sin límites', pts: 62, level: 'high', icon: '🗺️',
    desc: 'Escaparse lejos, en un lugar donde nadie los conozca, sin restricciones de ningún tipo.',
    category: 'pareja',
  },
  {
    id: 'ff15', name: 'Realizar la lista de deseos íntimos', pts: 65, level: 'high', icon: '📝',
    desc: 'Cada uno escribe su lista de 5 deseos íntimos. Se intercambian y se comprometen a cumplirlos.',
    category: 'pareja',
  },,

  // ===== NUEVAS - MÁS DESEOS EN PAREJA =====
  // BÁSICAS adicionales
  { id:'fp1', name:'Noche de confesiones íntimas', pts:14, level:'basic', icon:'🤫',
    desc:'Contarse cosas que nunca han dicho. Fantasías, miedos, deseos sin filtro. Solo entre los dos.', category:'pareja' },
  { id:'fp2', name:'Masaje de pies y piernas', pts:10, level:'basic', icon:'🦶',
    desc:'Un masaje completo de pies y piernas. Relajante, íntimo y sin apuros.', category:'pareja' },
  { id:'fp3', name:'Baño de espuma juntos', pts:16, level:'basic', icon:'🛁',
    desc:'Baño con espuma, velas y buena música. Sin prisa, sin teléfonos.', category:'pareja' },
  { id:'fp4', name:'Tarde de lectura juntos', pts:8, level:'basic', icon:'📖',
    desc:'Leer juntos en la cama o sofá. Cada uno su libro pero cerca. Simple y cálido.', category:'pareja' },
  { id:'fp5', name:'Noche de películas temática', pts:12, level:'basic', icon:'🎬',
    desc:'Elegir un género juntos y ver varias películas seguidas con snacks y manta.', category:'pareja' },
  // MEDIAS adicionales
  { id:'fp6', name:'Escapada de un día sin destino', pts:26, level:'medium', icon:'🚗',
    desc:'Subirse al auto sin plan fijo. Parar donde se les antoje. Solo los dos.', category:'pareja' },
  { id:'fp7', name:'Sesión de fotos íntima en casa', pts:28, level:'medium', icon:'📷',
    desc:'Una sesión fotográfica privada. El estilo que quieran. Solo para sus ojos.', category:'pareja' },
  { id:'fp8', name:'Cena a ciegas en casa', pts:24, level:'medium', icon:'🍽️',
    desc:'Uno cocina sorpresa y el otro come con los ojos vendados. Luego se invierten.', category:'pareja' },
  { id:'fp9', name:'Noche de rol: primera cita', pts:30, level:'medium', icon:'💑',
    desc:'Simular ser dos desconocidos que se conocen por primera vez. Salida, galantería y todo.', category:'pareja' },
  { id:'fp10', name:'Spa en casa completo', pts:34, level:'medium', icon:'💆',
    desc:'Masajes, aceites, música y velas. Turnarse en ser quien da y quien recibe.', category:'pareja' },
  // ALTAS adicionales
  { id:'fp11', name:'Noche de total entrega', pts:52, level:'high', icon:'💫',
    desc:'Una noche donde uno decide todo y el otro acepta sin preguntar. Con confianza y amor.', category:'pareja' },
  { id:'fp12', name:'Viaje sorpresa de fin de semana', pts:58, level:'high', icon:'✈️',
    desc:'Un fin de semana organizado en secreto. Destino, hotel y plan elegidos por uno solo.', category:'pareja' },
  { id:'fp13', name:'Noche de juegos sin reglas', pts:48, level:'high', icon:'🎭',
    desc:'Una noche de juegos íntimos sin restricciones. Solo los dos, en total confianza.', category:'pareja' },
  { id:'fp14', name:'Cumplir una fantasía confesada', pts:55, level:'high', icon:'⭐',
    desc:'Hacer realidad algo que el otro confesó querer. Planificado con detalle y amor.', category:'pareja' },
  { id:'fp15', name:'Escapada romántica con jacuzzi', pts:60, level:'high', icon:'🌙',
    desc:'Una noche fuera con jacuzzi privado. Sin interrupciones, sin reglas, solo ustedes.', category:'pareja' },

  // ===== NUEVOS BÁSICOS - PAREJA =====
  { id:'fn1', name:'Desayuno romántico con nota sorpresa', pts:12, level:'basic', icon:'☕',
    desc:'Preparar el desayuno favorito con una nota especial escondida. Sin razón particular, solo porque sí.', category:'pareja' },
  { id:'fn2', name:'Noche de karaoke privado', pts:10, level:'basic', icon:'🎤',
    desc:'Cantar juntos sus canciones favoritas en casa. Sin vergüenza, solo diversión.', category:'pareja' },
  { id:'fn3', name:'Crear una playlist juntos', pts:9, level:'basic', icon:'🎵',
    desc:'Elegir juntos las canciones que cuentan su historia. Cada uno agrega las suyas con significado.', category:'pareja' },

  // ===== NUEVOS BÁSICOS - GRUPO =====
  { id:'fn4', name:'Noche de juegos con amigos íntimos', pts:15, level:'basic', icon:'🎲',
    desc:'Verdad o reto en grupo pequeño de confianza. Nivel de picardía que todos acuerden.', category:'grupo' },
  { id:'fn5', name:'Salida casual en grupo de confianza', pts:14, level:'basic', icon:'🍻',
    desc:'Cena o bebidas con uno o dos amigos cercanos. Ambiente relajado y sin expectativas.', category:'grupo' },

  // ===== NUEVOS MEDIOS - PAREJA =====
  { id:'fn6', name:'Recrear la primera cita', pts:28, level:'medium', icon:'🌹',
    desc:'Volver al lugar donde se conocieron o tuvieron su primera cita. Vestirse bien y vivir ese momento de nuevo.', category:'pareja' },
  { id:'fn7', name:'Noche de vino y conversación profunda', pts:24, level:'medium', icon:'🍷',
    desc:'Buena botella, preguntas íntimas preparadas, sin teléfonos. Conocerse de nuevo.', category:'pareja' },
  { id:'fn8', name:'Sesión de fotos boudoir para él', pts:32, level:'medium', icon:'📸',
    desc:'Ella produce una sesión fotográfica íntima y provocadora solo para sus ojos. Un regalo visual.', category:'pareja' },

  // ===== NUEVOS MEDIOS - GRUPO =====
  { id:'fn9', name:'Noche de piscina con tercero de confianza', pts:30, level:'medium', icon:'🏊',
    desc:'Noche de piscina privada con alguien de total confianza. Libertad, diversión y sin reglas estrictas.', category:'grupo' },
  { id:'fn10', name:'Karaoke nocturno en grupo pequeño', pts:26, level:'medium', icon:'🎤',
    desc:'Salir a karaoke o hacerlo en casa con una o dos personas de confianza. Ambiente libre y divertido.', category:'grupo' },

  // ===== NUEVOS ALTOS - PAREJA =====
  { id:'fn11', name:'Noche de juguetes íntimos por primera vez', pts:50, level:'high', icon:'💋',
    desc:'Explorar juntos el uso de juguetes íntimos. Elegir juntos, sin prisa, con total confianza.', category:'pareja' },
  { id:'fn12', name:'Noche de rol intenso acordado', pts:54, level:'high', icon:'🎭',
    desc:'Adoptar un personaje o rol durante toda la noche. Acordado antes, sin límite de imaginación.', category:'pareja' },
  { id:'fn13', name:'Experiencia sensorial con venda', pts:48, level:'high', icon:'🖤',
    desc:'Uno entrega el sentido de la vista. El otro guía la experiencia. Confianza total, sorpresas reales.', category:'pareja' },

  // ===== NUEVOS ALTOS - GRUPO =====
  { id:'fn14', name:'Noche en spa adulto o sauna mixto', pts:55, level:'high', icon:'🧖',
    desc:'Asistir a un spa o sauna de ambiente adulto libre. Sin obligaciones, solo explorar el ambiente.', category:'grupo' },
  { id:'fn15', name:'Reto íntimo colectivo acordado', pts:62, level:'high', icon:'🔥',
    desc:'Un reto íntimo definido por todos antes. Consentido, con reglas claras y en total confianza mutua.', category:'grupo' }
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

// ===== MINUTAS =====
const SESSION_LOG = [
  { date: '22/04/2026', title: 'Lanzamiento de Ignite', items: ['Configuración de Firebase Authentication y Firestore', 'Publicación en Vercel: ignite-gules-six.vercel.app', 'Registro de usuario admin (Oswaldo)', 'Configuración de reglas Firestore'] },
  { date: '24/04/2026', title: 'Primera sesión con Jensy', items: ['Jensy registrada como viewer con código IGNITE-FM6O', 'Corrección bug registro segundo usuario', 'Reglas Firestore actualizadas a modo abierto', 'Módulo de juego agregado (Suave/Moderado/Hot)', 'Nueva pestaña Pedidos', 'Sistema de evidencias con fotos', 'Ojito contraseña y doble validación', 'Olvidé mi contraseña', '15 fantasías en pareja agregadas', 'Tutorial de primer uso', 'Perfil editable', 'Minutas de sesión'] },
];

// ===== AUTH FUNCTIONS =====
// ===== SPLASH 18+ =====
function checkSplash() {
  // Poner fecha máxima en birthdate (hoy - 18 años)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const el = document.getElementById('reg-birthdate');
  if (el) el.max = maxDate.toISOString().split('T')[0];

  let confirmed = false;
  try { confirmed = localStorage.getItem('ignite_age_confirmed') === 'true'; } catch(e) {}
  if (confirmed) {
    // Ya confirmó edad - ocultar splash, dejar que onAuthStateChanged maneje el resto
    const splash = document.getElementById('splash-screen');
    if (splash) splash.style.display = 'none';
  }
  // Si no confirmó, el splash ya está visible por defecto en el HTML
}

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (splash) { splash.style.display = 'none'; splash.classList.remove('active'); }
  // No mostramos auth aquí - onAuthStateChanged lo maneja
  // Si no hay usuario, onAuthStateChanged ya mostrará el auth screen
}

function confirmAge(isAdult) {
  if (!isAdult) {
    document.getElementById('splash-screen').innerHTML = `
      <div style="text-align:center;padding:40px 24px">
        <div style="font-size:64px;margin-bottom:16px">🔒</div>
        <div style="font-family:var(--font-display);font-size:22px;font-weight:500;margin-bottom:12px">Acceso restringido</div>
        <div style="font-size:14px;color:var(--text2);line-height:1.7">
          Ignite es una aplicación exclusiva para mayores de 18 años.<br><br>
          Si crees que es un error, cierra y vuelve a abrir la aplicación.
        </div>
      </div>`;
    return;
  }
  // Guardar confirmación — con try/catch por si localStorage no está disponible (Safari privado)
  try { localStorage.setItem('ignite_age_confirmed', 'true'); } catch(e) {}
  hideSplash();
}

// ===== TÉRMINOS Y POLÍTICA =====
function showLegal(type) {
  const isTerms = type === 'terms';
  const title = isTerms ? 'Términos de Servicio' : 'Política de Privacidad';
  const body = isTerms ? getTermsContent() : getPrivacyContent();
  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal" style="max-height:85vh">
      <div class="modal-handle"></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
        <div style="font-size:16px;font-weight:600;flex:1">${title}</div>
        <button class="btn btn-outline btn-sm" onclick="closeModalDirect()">Cerrar</button>
      </div>
      <div style="font-size:12px;color:var(--text2);line-height:1.8;overflow-y:auto;max-height:60vh">
        ${body}
      </div>
    </div>
  </div>`;
}

function getTermsContent() {
  return `
    <div style="font-size:11px;color:var(--text3);margin-bottom:12px">Última actualización: Abril 2026</div>

    <strong style="color:var(--text)">1. Aceptación y elegibilidad</strong><br>
    Al registrarte en Ignite confirmas que tienes 18 años o más. El uso de esta aplicación por menores de edad está estrictamente prohibido. La responsabilidad de la veracidad de la edad declarada recae exclusivamente en el usuario.<br><br>

    <strong style="color:var(--text)">2. Naturaleza del contenido</strong><br>
    Ignite es una plataforma de gamificación para parejas adultas. El contenido puede incluir material de naturaleza íntima y sexual entre adultos que consienten. Todo el contenido es generado por los propios usuarios dentro de su grupo privado.<br><br>

    <strong style="color:var(--text)">3. Consentimiento y privacidad entre usuarios</strong><br>
    Todo contenido compartido dentro de un grupo es visible únicamente para los miembros de ese grupo. El usuario es responsable de obtener el consentimiento de las personas involucradas antes de compartir cualquier contenido que las incluya.<br><br>

    <strong style="color:var(--text)">4. Conducta prohibida</strong><br>
    Está prohibido: compartir contenido de menores de edad en cualquier contexto, compartir contenido sin consentimiento de las personas involucradas, usar la plataforma para acosar o coaccionar a otras personas, o compartir el acceso a tu cuenta con terceros no autorizados.<br><br>

    <strong style="color:var(--text)">5. Propiedad del contenido</strong><br>
    El contenido que subes (fotos, textos) es de tu propiedad. Al subirlo otorgas a Ignite una licencia limitada para mostrarlo dentro de tu grupo privado. No compartimos tu contenido con terceros.<br><br>

    <strong style="color:var(--text)">6. Limitación de responsabilidad</strong><br>
    Ignite es una herramienta de comunicación entre adultos. No nos hacemos responsables por el uso indebido de la plataforma, ni por el contenido generado por los usuarios. El uso es bajo tu propia responsabilidad.<br><br>

    <strong style="color:var(--text)">7. Modificaciones</strong><br>
    Podemos actualizar estos términos. Te notificaremos de cambios significativos. El uso continuado de la app implica aceptación de los términos vigentes.<br><br>

    <strong style="color:var(--text)">8. Contacto</strong><br>
    Para consultas legales o reporte de uso indebido: soporte@igniteapp.co
  `;
}

function getPrivacyContent() {
  return `
    <div style="font-size:11px;color:var(--text3);margin-bottom:12px">Última actualización: Abril 2026</div>

    <strong style="color:var(--text)">1. Datos que recopilamos</strong><br>
    Recopilamos: nombre, email, fecha de nacimiento, género y orientación sexual (opcional), contenido que subes voluntariamente (fotos, textos), y datos de uso de la app (puntos, acciones, historial).<br><br>

    <strong style="color:var(--text)">2. Para qué usamos tus datos</strong><br>
    Tus datos se usan exclusivamente para: operar la aplicación, personalizar tu experiencia, y mostrarte contenido relevante dentro de tu grupo. No usamos tus datos para publicidad de terceros.<br><br>

    <strong style="color:var(--text)">3. Datos sensibles</strong><br>
    La fecha de nacimiento se usa para verificar mayoría de edad y no se comparte. El género y orientación sexual son opcionales y solo sirven para personalizar las acciones que ves. No los compartimos con nadie.<br><br>

    <strong style="color:var(--text)">4. Almacenamiento</strong><br>
    Tus datos se almacenan en servidores seguros de Google Firebase (Firebase Firestore y Storage), con cifrado en tránsito y en reposo. Los servidores están ubicados en Sudamérica (southamerica-east1).<br><br>

    <strong style="color:var(--text)">5. Compartir datos</strong><br>
    No vendemos ni compartimos tus datos personales con terceros. Los únicos que pueden ver tu contenido son los miembros de tu grupo de Ignite.<br><br>

    <strong style="color:var(--text)">6. Tus derechos</strong><br>
    Tienes derecho a: acceder a tus datos, corregirlos, eliminarlos, y retirar tu consentimiento en cualquier momento. Para ejercer estos derechos escríbenos a soporte@igniteapp.co<br><br>

    <strong style="color:var(--text)">7. Eliminación de cuenta</strong><br>
    Puedes solicitar la eliminación de tu cuenta y todos tus datos en cualquier momento desde tu Perfil o escribiéndonos. Procesamos las solicitudes en un máximo de 30 días.<br><br>

    <strong style="color:var(--text)">8. Menores de edad</strong><br>
    Ignite no está dirigida a menores de 18 años. Si detectamos que un usuario es menor de edad, eliminamos su cuenta y datos inmediatamente.<br><br>

    <strong style="color:var(--text)">9. Contacto</strong><br>
    Para ejercer tus derechos o consultas de privacidad: soporte@igniteapp.co
  `;
}

function showLogin() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}
function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  regNextStep(1); // siempre empieza en paso 1
}

function regNextStep(step) {
  // Validar paso 1 antes de avanzar
  if (step === 2) {
    const name = document.getElementById('reg-name')?.value?.trim();
    const email = document.getElementById('reg-email')?.value?.trim();
    const pass = document.getElementById('reg-pass')?.value;
    const passConfirm = document.getElementById('reg-pass-confirm')?.value;
    const birthdate = document.getElementById('reg-birthdate')?.value;
    const errEl = document.getElementById('reg-error-1');
    if (errEl) errEl.style.display = 'none';
    if (!name || !email || !pass) { if (errEl) { errEl.textContent = 'Completa todos los campos'; errEl.style.display = 'block'; } return; }
    if (pass.length < 6) { if (errEl) { errEl.textContent = 'La contraseña debe tener mínimo 6 caracteres'; errEl.style.display = 'block'; } return; }
    if (passConfirm && pass !== passConfirm) { if (errEl) { errEl.textContent = 'Las contraseñas no coinciden'; errEl.style.display = 'block'; } return; }
    // Validar fecha de nacimiento
    if (!birthdate) { if (errEl) { errEl.textContent = 'Ingresa tu fecha de nacimiento'; errEl.style.display = 'block'; } return; }
    const birth = new Date(birthdate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (age < 18) {
      if (errEl) {
        errEl.innerHTML = '🔞 Debes tener 18 años o más para usar Ignite.<br><span style="font-size:11px">Esta aplicación contiene contenido para adultos.</span>';
        errEl.style.display = 'block';
      }
      return;
    }
  }
  // Mostrar paso correcto
  [1,2,3].forEach(i => {
    const el = document.getElementById('reg-step-'+i);
    const bar = document.getElementById('step-bar-'+i);
    if (el) el.style.display = i === step ? 'block' : 'none';
    if (bar) bar.style.background = i <= step ? 'var(--rose)' : 'var(--bg4)';
  });
}
function togglePassword(fieldId, btn) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.type = field.type === 'password' ? 'text' : 'password';
  btn.textContent = field.type === 'password' ? '👁️' : '🙈';
}
async function forgotPassword() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) { showToast('Ingresa tu email primero'); return; }
  try { await auth.sendPasswordResetEmail(email); showToast('✓ Email de recuperación enviado'); }
  catch (e) { showToast('Error: ' + e.message); }
}
async function loginUser() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  if (!email || !pass) { showError(errEl, 'Completa todos los campos'); return; }
  const btn = document.querySelector('#login-form .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }
  try { await auth.signInWithEmailAndPassword(email, pass); }
  catch (e) {
    showError(errEl, 'Email o contraseña incorrectos');
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
  }
}
// Genera código de 4 chars sin O, 0, I, 1 para evitar confusión
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function registerUser() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const passConfirm = document.getElementById('reg-pass-confirm')?.value || '';
  const birthdate = document.getElementById('reg-birthdate')?.value || '';
  const codeInput = document.getElementById('reg-code').value.trim().toUpperCase();
  const code = codeInput ? (codeInput.startsWith('IGNITE-') ? codeInput : 'IGNITE-' + codeInput) : '';
  const gender = document.getElementById('reg-gender').value;
  const orient = document.getElementById('reg-orient').value;
  const termsAccepted = document.getElementById('reg-terms')?.checked;
  const errEl = document.getElementById('reg-error');
  const successEl = document.getElementById('reg-success');
  errEl.style.display = 'none';
  if (successEl) successEl.style.display = 'none';
  if (!name || !email || !pass) { showError(errEl, 'Completa nombre, email y contraseña'); return; }
  if (pass.length < 6) { showError(errEl, 'La contraseña debe tener mínimo 6 caracteres'); return; }
  if (passConfirm && pass !== passConfirm) { showError(errEl, 'Las contraseñas no coinciden'); return; }
  // Validar T&C
  if (!termsAccepted) { showError(errEl, 'Debes aceptar los Términos de Servicio para continuar'); return; }
  // Validar edad de nuevo por seguridad
  if (birthdate) {
    const birth = new Date(birthdate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (age < 18) { showError(errEl, '🔞 Debes tener 18 años o más para registrarte'); return; }
  }
  const btn = document.querySelector('#register-form .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta...'; }
  try {
    let groupId = null;
    let role = 'admin';
    if (code) {
      const groupSnap = await db.collection('groups').where('inviteCode', '==', code).limit(1).get();
      if (groupSnap.empty) { showError(errEl, 'Código inválido: ' + code); if (btn) { btn.disabled = false; btn.textContent = 'Crear cuenta gratis'; } return; }
      groupId = groupSnap.docs[0].id;
      role = 'member';
    }
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const uid = cred.user.uid;
    try { await cred.user.sendEmailVerification(); } catch(e) {}
    const colors = ['#E8608A','#4ECBA0','#9B7FE8','#F5A623','#FF7A00','#378ADD'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    if (!groupId) {
      const groupRef = db.collection('groups').doc();
      groupId = groupRef.id;
      await groupRef.set({
        id: groupId, adminId: uid,
        inviteCode: 'IGNITE-' + generateCode(),
        members: [uid],
        actions: { him: DEFAULT_ACTIONS_HIM, her: DEFAULT_ACTIONS_HER, neutral: DEFAULT_ACTIONS_NEUTRAL },
        fantasies: DEFAULT_FANTASIES,
        specialDates: DEFAULT_SPECIAL_DATES,
        pairPoints: {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('groups').doc(groupId).update({ members: firebase.firestore.FieldValue.arrayUnion(uid) });
    }
    await db.collection('users').doc(uid).set({
      id: uid, name, email, initials, color, gender, orientation: orient,
      role, active: true, groupId, firstLogin: true, streak: 0,
      lastActive: new Date().toDateString(),
      birthdate: birthdate || '',
      termsAcceptedAt: new Date().toISOString(),
      termsVersion: '1.0',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    if (successEl) { successEl.textContent = '✓ ¡Cuenta creada! Entrando...'; successEl.style.display = 'block'; }
    if (btn) { btn.disabled = false; btn.textContent = 'Crear cuenta gratis'; }
  } catch (e) {
    const msg = e.code === 'auth/email-already-in-use' ? 'Este email ya está registrado' : 'Error: ' + (e.message || '');
    showError(errEl, msg);
    if (btn) { btn.disabled = false; btn.textContent = 'Crear cuenta gratis'; }
  }
}
function showError(el, msg) { el.textContent = msg; el.style.display = 'block'; }

// ===== AUTH STATE =====
// Inicializar splash al cargar
document.addEventListener('DOMContentLoaded', () => {
  checkSplash();
  // Poner fecha máxima en birthdate
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const el = document.getElementById('reg-birthdate');
  if (el) el.max = maxDate.toISOString().split('T')[0];
});

auth.onAuthStateChanged(async (user) => {
  const splash = document.getElementById('splash-screen');
  const authScreen = document.getElementById('auth-screen');
  const appScreen = document.getElementById('app-screen');

  // Siempre ocultar splash cuando ya sabemos el estado de auth
  if (splash) splash.style.display = 'none';

  if (user) {
    currentUser = user;
    // Ocultar auth, mostrar app
    if (authScreen) { authScreen.style.display = 'none'; authScreen.classList.remove('active'); }
    try {
      let snap = await db.collection('users').doc(user.uid).get();
      if (!snap.exists) { await auth.signOut(); return; }
      currentUserData = snap.data();
      if (!currentUserData.groupId) {
        await new Promise(r => setTimeout(r, 2500));
        snap = await db.collection('users').doc(user.uid).get();
        currentUserData = snap.data();
      }
      updateStreak();
      showApp();
      if (currentUserData.firstLogin) {
        await db.collection('users').doc(user.uid).update({ firstLogin: false });
        setTimeout(() => showTutorial(), 800);
      }
    } catch (e) {
      console.error(e);
      // Si Firestore falla, igual mostrar la app para no bloquear al usuario
      if (currentUserData) {
        showApp();
      } else {
        // No hay datos de usuario - volver al login
        await auth.signOut();
      }
    }
  } else {
    currentUser = null; currentUserData = null;
    if (appScreen) { appScreen.style.display = 'none'; appScreen.classList.remove('active'); }
    // Mostrar auth solo si ya confirmó edad
    let ageConfirmed = false;
    try { ageConfirmed = localStorage.getItem('ignite_age_confirmed') === 'true'; } catch(e) {}
    if (ageConfirmed) {
      if (authScreen) { authScreen.style.display = 'flex'; authScreen.classList.add('active'); }
    } else {
      // Mostrar splash
      if (splash) splash.style.display = 'flex';
    }
  }
});

async function updateStreak() {
  if (!currentUserData) return;
  const today = new Date().toDateString();
  const last = currentUserData.lastActive;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  let streak = currentUserData.streak || 0;
  if (last === today) return;
  if (last === yesterday) streak += 1;
  else streak = 1;
  try {
    await db.collection('users').doc(currentUser.uid).update({ streak, lastActive: today });
    currentUserData.streak = streak;
    currentUserData.lastActive = today;
  } catch(e) {}
}

function showApp() {
  const authScreen = document.getElementById('auth-screen');
  const appScreen = document.getElementById('app-screen');
  const splash = document.getElementById('splash-screen');
  if (splash) splash.style.display = 'none';
  if (authScreen) { authScreen.style.display = 'none'; authScreen.classList.remove('active'); }
  if (appScreen) { appScreen.style.display = 'flex'; appScreen.classList.add('active'); }
  updateHeader();
  showTab('inicio');
}

// ===== TUTORIAL TIPO VIDEOJUEGO =====
function showTutorial() {
  const steps = [
    {
      icon: '🔥', title: '¡Bienvenido a Ignite!',
      desc: 'La app para encender lo que ya existe entre tú y tu pareja. En 30 segundos entiendes todo.',
      tip: null
    },
    {
      icon: '⚡', title: 'Paso 1: Gana puntos',
      desc: 'Toca la pestaña <strong>⚡ Ganar pts</strong> y registra algo que hiciste por tu pareja. Ella lo aprueba y ganas puntos automáticamente.',
      tip: '💡 Ejemplo: preparaste el desayuno → +6 pts'
    },
    {
      icon: '🔥', title: 'Paso 2: Pide lo que quieres',
      desc: 'Con tus puntos ve a <strong>🔥 Deseos</strong> y elige algo del catálogo. Tu pareja lo aprueba o rechaza. Nada pasa sin su OK.',
      tip: '💡 Los deseos básicos cuestan solo 8-20 pts'
    },
    {
      icon: '🔔', title: 'Paso 3: Aprueba o rechaza',
      desc: 'Cuando tu pareja registre algo, te aparece en <strong>🏠 Inicio</strong>. Tú decides si fue válido. Si apruebas, los puntos se acreditan solos.',
      tip: '💡 Si rechazas, debes dar un motivo'
    },
    {
      icon: '🎮', title: 'Extra: Ignite Game',
      desc: 'En tu <strong>👤 Perfil</strong> encontrarás el juego de retos en 3 niveles. Suave, Moderado y Hot. Perfecto para una noche diferente.',
      tip: '💡 Empieza suave y el juego sube solo de nivel'
    },
    {
      icon: '👫', title: 'Invita a tu pareja',
      desc: 'Sin tu pareja no hay juego. Ve a <strong>👤 Perfil → Invitar pareja</strong> y comparte el código. Ella se registra y ya están conectados.',
      tip: null
    },
  ];
  let idx = 0;
  function render() {
    const s = steps[idx];
    const isLast = idx === steps.length - 1;
    document.getElementById('modal-container').innerHTML = `<div class="modal-overlay">
      <div class="modal">
        <div style="text-align:right;margin-bottom:8px">
          <span style="font-size:11px;color:var(--text3);cursor:pointer" onclick="closeModalDirect()">Saltar tutorial ✕</span>
        </div>
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:52px;margin-bottom:12px">${s.icon}</div>
          <div style="font-family:var(--font-display);font-size:21px;font-weight:500;margin-bottom:10px">${s.title}</div>
          <div style="font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:${s.tip?'12px':'0'}">${s.desc}</div>
          ${s.tip ? `<div style="background:var(--bg4);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--amber);margin-top:4px">${s.tip}</div>` : ''}
        </div>
        <div style="display:flex;gap:4px;justify-content:center;margin-bottom:20px">
          ${steps.map((_,i) => `<div style="width:${i===idx?'24px':'7px'};height:7px;border-radius:4px;background:${i===idx?'var(--rose)':'var(--bg4)'};transition:all 0.3s"></div>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--text3);text-align:center;margin-bottom:12px">${idx+1} de ${steps.length}</div>
        <div class="row">
          ${idx > 0 ? `<button class="btn btn-outline" onclick="tutorialNav(${idx-1})" style="flex:1">← Atrás</button>` : ''}
          <button class="btn btn-primary" onclick="tutorialNav(${idx+1})" style="flex:2">
            ${isLast ? '🔥 ¡Empezar ya!' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>`;
  }
  window.tutorialNav = (i) => {
    if (i >= steps.length) { closeModalDirect(); showTab('ganar'); return; }
    idx = i; render();
  };
  render();
}

// ===== TARJETA COMPARTIBLE AL CUMPLIR DESEO =====
function showShareCard(fantasyName) {
  const url = 'https://ignite-gules-six.vercel.app';
  const msg = `🔥 ¡Cumplimos otro deseo en Ignite! La app que enciende la relación. ¿La has probado? → ${url}`;
  const encoded = encodeURIComponent(msg);
  document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:52px;margin-bottom:10px">⭐</div>
        <div style="font-family:var(--font-display);font-size:22px;font-weight:500;margin-bottom:6px">¡Deseo cumplido!</div>
        <div style="font-size:14px;color:var(--text2)">${fantasyName}</div>
      </div>
      <div style="background:linear-gradient(135deg,#1A0A10,#0A101A);border:1px solid var(--rose);border-radius:16px;padding:20px;text-align:center;margin-bottom:16px">
        <div style="font-size:32px;margin-bottom:8px">🔥</div>
        <div style="font-family:var(--font-display);font-size:20px;font-weight:500;color:var(--rose)">Ignite</div>
        <div style="font-size:12px;color:var(--text2);margin-top:4px">Enciende lo que ya existe</div>
        <div style="font-size:11px;color:var(--text3);margin-top:8px;border-top:1px solid var(--border);padding-top:8px">Nivel 🔥 · Deseo cumplido</div>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:10px">¿Quieres contarlo? (sin revelar detalles 😉)</div>
      <div class="invite-option" onclick="window.open('https://wa.me/?text=${encoded}','_blank')">
        <div class="invite-icon" style="background:#25D36615">💬</div>
        <div style="flex:1"><div class="invite-name">WhatsApp</div></div><span>→</span>
      </div>
      <div class="invite-option" onclick="window.open('https://twitter.com/intent/tweet?text=${encoded}','_blank')">
        <div class="invite-icon" style="background:#1DA1F215">𝕏</div>
        <div style="flex:1"><div class="invite-name">Twitter / X</div></div><span>→</span>
      </div>
      <div class="invite-option" onclick="copyCode('${msg}');showToast('Copiado para Instagram o TikTok')">
        <div class="invite-icon" style="background:#E1306C15">📸</div>
        <div style="flex:1"><div class="invite-name">Instagram / TikTok</div><div class="invite-sub">Copiar mensaje</div></div><span>→</span>
      </div>
      <button class="btn btn-outline btn-full" style="margin-top:10px" onclick="closeModalDirect()">Cerrar</button>
    </div>
  </div>`;
}

// ===== HEADER =====
function updateHeader() {
  if (!currentUserData) return;
  const av = document.getElementById('header-avatar');
  if (av) { av.textContent = currentUserData.initials; av.style.background = currentUserData.color+'22'; av.style.color = currentUserData.color; }
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nv = document.getElementById('nav-'+currentTab);
  if (nv) nv.classList.add('active');
  checkPendingBadges();
}

async function checkPendingBadges() {
  if (!currentUserData?.groupId) return;
  try {
    const snap = await db.collection('groups').doc(currentUserData.groupId)
      .collection('requests').where('status','==','pending').get();
    const pending = snap.docs.map(d=>d.data());
    const uid = currentUser.uid;
    const forMe = pending.filter(r => r.requestedBy !== uid);
    const actionsPending = forMe.filter(r=>r.type==='action').length;
    const fantasiesPending = forMe.filter(r=>r.type==='fantasy').length;
    const total = forMe.length;

    const gb = document.getElementById('badge-ganar');
    const db2 = document.getElementById('badge-deseos');
    const nd = document.getElementById('notif-dot');

    // Mostrar número en badge
    if (gb) { gb.style.display = actionsPending > 0 ? 'block' : 'none'; gb.textContent = actionsPending > 0 ? actionsPending : ''; }
    if (db2) { db2.style.display = fantasiesPending > 0 ? 'block' : 'none'; db2.textContent = fantasiesPending > 0 ? fantasiesPending : ''; }
    if (nd) { nd.style.display = total > 0 ? 'block' : 'none'; nd.textContent = total > 9 ? '9+' : (total || ''); }
  } catch(e) {}
}

// ===== TABS =====
function showTab(tab) {
  currentTab = tab;
  updateHeader();
  document.getElementById('content').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  if (tab === 'inicio') renderInicio();
  else if (tab === 'ganar') renderGanar();
  else if (tab === 'deseos') renderDeseos();
  else if (tab === 'perfil') renderPerfil();
  else if (tab === 'game') renderGame();
  else if (tab === 'historial') renderHistorial();
  else if (tab === 'minutas') renderMinutas();
  else if (tab === 'config') renderConfig();
  else if (tab === 'mantenedores') renderMantenedores();
  else if (tab === 'mant-deseos') renderMantDeseos();
  else if (tab === 'mant-acciones') renderMantAcciones();
}

// ===== INICIO =====
const DAILY_QUESTIONS = [
  '¿Cuál es el recuerdo favorito que tienes de nosotros este año?',
  '¿Qué es lo que más te gusta de nuestra relación?',
  '¿Hay algo que quieras hacer juntos que aún no hemos hecho?',
  '¿Cuál fue la última vez que te sentiste completamente feliz conmigo?',
  '¿Qué es lo que más extrañas de cuando nos conocimos?',
  '¿Cuál es tu lugar favorito para estar conmigo?',
  '¿Qué pequeño detalle mío te hace sonreír sin que yo lo sepa?',
  '¿Hay algo que quieras que haga más seguido?',
  '¿Cuál es la canción que más te recuerda a nosotros?',
  '¿Qué sueño tienes que todavía no me has contado?',
  '¿Cuál fue nuestra mejor cita hasta ahora?',
  '¿Qué es lo que más valoras de mí como persona?',
  '¿Hay algo que hayas querido decirme pero no has encontrado el momento?',
  '¿Qué te gustaría que hiciéramos diferente en nuestra rutina?',
  '¿Cuál es el lugar del mundo donde más quisieras estar conmigo?',
  '¿Qué es lo que más te atrae de mí hoy?',
  '¿Hay alguna fantasía que quieras compartir conmigo?',
  '¿Cuándo fue la última vez que te sorprendí de manera positiva?',
  '¿Qué harías si tuviéramos un día solo para nosotros sin ningún plan?',
  '¿Hay algo de ti que sientes que no conozco aún?',
  '¿Qué canción te gustaría que bailáramos juntos?',
  '¿Cuál es tu momento favorito del día cuando estamos juntos?',
  '¿Hay algo que quieras probar juntos que te dé un poco de miedo?',
  '¿Qué te hace sentir más amado/a por mí?',
  '¿Si pudieras cambiar una cosa de nuestra relación, cuál sería?',
  '¿Cuál es el mejor consejo que te han dado sobre el amor?',
  '¿Qué es lo que más te hace reír de mí?',
  '¿Cuándo fue la última vez que sentiste mariposas conmigo?',
  '¿Qué cosa de nuestra relación nunca cambiarías?',
  '¿Si pudiéramos revivir un día juntos, cuál elegirías?',
];

function getDailyQuestion() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  return DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length];
}

async function renderInicio() {
  if (!currentUserData?.groupId) {
    document.getElementById('content').innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">⏳</div>
      <div class="empty-state-title">Configurando tu cuenta</div>
      <div class="empty-state-desc">Un momento...</div>
      <button class="btn btn-outline" onclick="location.reload()">Recargar</button>
    </div>`;
    return;
  }
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  try {
    const [groupSnap, membersSnap, pendingSnap, histSnap] = await Promise.all([
      db.collection('groups').doc(gid).get(),
      db.collection('users').where('groupId','==',gid).where('active','==',true).get(),
      db.collection('groups').doc(gid).collection('requests').where('status','==','pending').get(),
      db.collection('groups').doc(gid).collection('history').limit(4).get(),
    ]);
    const group = groupSnap.data();
    const members = membersSnap.docs.map(d=>d.data()).filter(m=>m.id!==uid);
    const partner = members[0];
    const pk = partner ? [uid,partner.id].sort().join('_') : null;
    const myPts = pk ? (group.pairPoints?.[pk]?.[uid]||0) : 0;
    const partnerPts = pk ? (group.pairPoints?.[pk]?.[partner.id]||0) : 0;
    const forMe = pendingSnap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.requestedBy!==uid);
    const history = histSnap.docs.map(d=>d.data());

    // Fantasías aprobadas sin cumplir
    const approvedSnap = await db.collection('groups').doc(gid).collection('requests')
      .where('requestedBy','==',uid).where('status','==','approved').where('type','==','fantasy').get();
    const approved = approvedSnap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>!r.fulfilled);

    let html = '';

    // Streak
    const streak = currentUserData.streak || 0;
    if (streak > 1) {
      html += `<div class="streak-card">
        <div class="streak-icon">🔥</div>
        <div><div class="streak-num">${streak}</div><div class="streak-label">días seguidos activo</div></div>
        <div style="margin-left:auto;font-size:11px;color:var(--text2)">¡Sigue así!</div>
      </div>`;
    }

    // Puntos hero
    html += `<div class="points-hero">
      <div class="hero-label">Tus puntos${partner?' con '+partner.name:''}</div>
      <div class="hero-pts"><span class="pts-num">${myPts}</span> <span class="pts-label">pts</span></div>
      <div class="hero-sub">${partner
        ? `<span class="hero-partner">${partner?.name||'Pareja'}</span> tiene ${partnerPts} pts`
        : `<span style="cursor:pointer;color:var(--rose)" onclick="showInviteModal()">+ Invita a tu pareja →</span>`
      }</div>
    </div>`;

    // Sin pareja → CTA claro
    if (!partner) {
      html += `<div class="card" style="text-align:center;padding:24px;border-style:dashed">
        <div style="font-size:40px;margin-bottom:10px">👫</div>
        <div style="font-size:15px;font-weight:500;margin-bottom:6px">Invita a tu pareja</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:14px;line-height:1.5">Comparte el código para que se registre y empiecen a jugar juntos</div>
        <button class="btn btn-primary btn-full" onclick="showInviteModal()">Compartir código de invitación</button>
      </div>`;
    }

    // Fantasías aprobadas
    if (approved.length > 0) {
      html += `<div class="section-hd"><div class="section-title">🎉 Listo para cumplir</div></div>`;
      approved.forEach(r => {
        html += `<div class="approved-banner">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <div style="font-size:28px">🔥</div>
            <div><div style="font-size:14px;font-weight:600;color:var(--teal)">${r.fantasyName}</div>
            <div style="font-size:11px;color:var(--text2)">Aprobada · Pendiente de cumplir</div></div>
          </div>
          ${r.approveComment?`<div style="font-size:12px;color:var(--teal);background:rgba(78,203,160,0.1);border-radius:8px;padding:8px;margin-bottom:8px">"${r.approveComment}"</div>`:''}
          <button class="btn btn-teal btn-full btn-sm" onclick="markFulfilled('${r.id}')">⭐ Marcar como cumplida</button>
        </div>`;
      });
    }

    // Por aprobar
    if (forMe.length > 0) {
      html += `<div class="section-hd"><div class="section-title">🔔 Te están esperando (${forMe.length})</div></div>`;
      forMe.slice(0,3).forEach(r => {
        html += `<div class="card glow-rose">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div>
              <div style="font-size:13px;font-weight:500">${r.fantasyName}</div>
              <div style="font-size:11px;color:var(--text2);margin-top:2px">${r.pts} pts · ${r.type==='action'?'⚡ Acción':'🔥 Deseo'} · ${r.requestedByName||''}</div>
            </div>
            <span class="status pending">⏳</span>
          </div>
          ${r.comment?`<div style="font-size:12px;color:var(--text2);background:var(--bg4);border-radius:8px;padding:8px;margin-bottom:10px">"${r.comment}"</div>`:''}
          ${r.evidenceUrl?`<img src="${r.evidenceUrl}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;cursor:pointer" onclick="viewEvidence('${r.evidenceUrl}')">`:'' }
          <div class="row" style="gap:10px;margin-top:4px">
            <button class="btn btn-teal" style="flex:1;padding:12px;font-size:14px;font-weight:600" onclick="aprobar('${r.id}')">✓ Aprobar</button>
            <button class="btn btn-danger" style="flex:1;padding:12px;font-size:14px;font-weight:600" onclick="rechazar('${r.id}')">✕ Rechazar</button>
          </div>
        </div>`;
      });
    }

    // Acciones rápidas
    html += `<div class="section-hd" style="margin-top:4px"><div class="section-title">¿Qué quieres hacer?</div></div>
    <div class="row" style="margin-bottom:8px">
      <button class="btn btn-outline btn-full" onclick="showTab('ganar')" style="flex-direction:column;height:72px;gap:4px">
        <span style="font-size:24px">⚡</span><span style="font-size:12px">Registrar acción</span>
      </button>
      <button class="btn btn-primary btn-full" onclick="showTab('deseos')" style="flex-direction:column;height:72px;gap:4px">
        <span style="font-size:24px">🔥</span><span style="font-size:12px">Pedir un deseo</span>
      </button>
    </div>
    <button class="btn btn-full" style="background:linear-gradient(135deg,#1A1225,#1A1520);border:1px solid rgba(155,127,232,0.3);color:var(--purple);margin-bottom:16px;height:52px" onclick="showTab('game')">
      🎮 Jugar Ignite Game
    </button>`;

    // Historial reciente
    if (history.length > 0) {
      html += `<div class="section-hd"><div class="section-title">Actividad reciente</div><div class="see-all" onclick="showTabHistorial('inicio')">Ver todo →</div></div>`;
      history.forEach(h => {
        html += `<div class="hist-item">
          <div class="hist-icon ${h.type}">${h.type==='add'?'⬆':'⬇'}</div>
          <div style="flex:1"><div class="hist-name">${h.action}</div><div class="hist-date">${h.fromUserName||''} · ${h.date||''}</div></div>
          <div class="hist-pts ${h.type}">${h.type==='add'?'+':'-'}${h.pts}</div>
        </div>`;
      });
    }

    document.getElementById('content').innerHTML = html;
    // Cargar respuestas del día en background
    if (currentUserData?.groupId) setTimeout(() => loadDailyAnswers(currentUserData.groupId), 300);
  } catch(e) {
    document.getElementById('content').innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error cargando</div><button class="btn btn-outline" onclick="showTab('inicio')">Reintentar</button></div>`;
  }
}

// ===== GANAR PUNTOS =====
async function renderGanar() {
  if (!currentUserData?.groupId) { document.getElementById('content').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div></div>'; return; }
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const group = groupSnap.data();
    const genderKey = currentUserData.gender === 'mujer' ? 'her' : 'him';
    const myActions = [...(group.actions?.neutral||DEFAULT_ACTIONS_NEUTRAL), ...(group.actions?.[genderKey]||[])];
    const membersSnap = await db.collection('users').where('groupId','==',gid).where('active','==',true).get();
    const others = membersSnap.docs.map(d=>d.data()).filter(m=>m.id!==uid);
    const pendingSnap = await db.collection('groups').doc(gid).collection('requests').where('status','==','pending').get();
    const forApproval = pendingSnap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.requestedBy!==uid&&r.type==='action');
    const myPending = pendingSnap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.requestedBy===uid&&r.type==='action');

    let html = `<div style="margin-bottom:16px">
      <div style="font-size:16px;font-weight:500;margin-bottom:4px">Registra lo que hiciste</div>
      <div style="font-size:13px;color:var(--text2)">Tu pareja lo aprueba y ganas los puntos.</div>
    </div>`;

    // Acciones agrupadas por categoría con buscador
    const ACTION_CATS = {
      emocional:   { label:'💕 Palabras y gestos',      color:'var(--rose)' },
      tiempo:      { label:'✨ Momentos juntos',         color:'var(--teal)' },
      servicio:    { label:'🎁 Detalles especiales',     color:'var(--amber)' },
      contacto:    { label:'🤗 Contacto y cercanía',     color:'var(--purple)' },
      crecimiento: { label:'🌱 Crecer juntos',           color:'#4ECBA0' },
      pasion:      { label:'🔥 Chispa y deseo',          color:'var(--rose)' },
      otro:        { label:'⚡ Otras acciones',           color:'var(--text2)' },
    };

    html += '<div class="section-hd"><div class="section-title">Selecciona una acción</div></div>';
    html += '<div style="position:relative;margin-bottom:12px"><input type="text" class="form-control" id="action-search" placeholder="🔍 Buscar acción..." oninput="filterActions(this.value)" style="padding-left:14px"></div>';

    // Agrupar por categoría
    const grouped = {};
    myActions.forEach(a => {
      const cat = a.cat || 'otro';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(a);
    });

    Object.entries(grouped).forEach(([cat, actions]) => {
      const catInfo = ACTION_CATS[cat] || ACTION_CATS.otro;
      const catId = 'cat-' + cat;
      html += '<div class="action-cat-header" onclick="toggleActionCat(\'' + catId + '\')" data-cat="' + cat + '">';
      html += '<span style="font-size:13px;font-weight:600;color:' + catInfo.color + '">' + catInfo.label + '</span>';
      html += '<span style="font-size:11px;color:var(--text3)">' + actions.length + ' acciones</span>';
      html += '<span id="' + catId + '-arrow" style="color:var(--text3);font-size:14px;margin-left:auto">›</span></div>';
      html += '<div id="' + catId + '" class="action-cat-panel" style="display:none"><div class="action-grid">';
      actions.forEach(a => {
        html += '<div class="action-quick-card" id="ac-' + a.id + '" onclick="selectAction(\'' + a.id + '\',\'' + a.pts + '\',\'' + a.name.replace(/'/g, "\\'") + '\')" data-name="' + a.name.toLowerCase() + '" data-cat="' + (a.cat||'otro') + '">';
        html += '<div class="action-quick-icon">' + a.icon + '</div>';
        html += '<div class="action-quick-name">' + a.name + '</div>';
        html += '<div class="action-quick-pts">+' + a.pts + ' pts</div></div>';
      });
      html += '</div></div>';
    });

    // Formulario de envío
    html += `<div id="action-form" style="display:none">
      <div class="card glow-teal">
        <div id="selected-action-info" style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border)">
        </div>
        <div class="form-group">
          <label class="form-label">¿Quién te da los puntos?</label>`;
    if (others.length === 0) {
      html += `<div style="font-size:12px;color:var(--text2);padding:10px;background:var(--bg4);border-radius:8px">Invita a tu pareja primero desde tu Perfil</div>`;
    } else {
      html += `<div style="display:flex;flex-direction:column;gap:6px" id="giver-list">`;
      others.forEach(m => {
        html += `<div class="multi-user-item" id="mu-${m.id}" onclick="toggleUserSel('${m.id}')">
          <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;background:${m.color}22;color:${m.color}">${m.initials}</div>
          <div style="flex:1"><div style="font-size:13px;font-weight:500">${m.name}</div></div>
          <div class="check" id="chk-${m.id}"></div>
        </div>`;
      });
      html += `</div>`;
    }
    html += `</div>
        <div class="form-group">
          <label class="form-label">Comentario (opcional)</label>
          <textarea class="form-control" id="act-comment" rows="2" placeholder="Cuéntale el contexto..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Evidencia (foto opcional)</label>
          <div class="upload-btn" onclick="triggerUpload('action-new')">📷 Agregar foto</div>
          <div id="evidence-preview-new"></div>
        </div>
        <div class="row">
          <button class="btn btn-outline" onclick="cancelAction()">Cancelar</button>
          <button class="btn btn-primary" style="flex:2" onclick="submitAction()">Enviar para aprobación 📤</button>
        </div>
      </div>
    </div>`;

    // Por aprobar
    if (forApproval.length > 0) {
      html += `<div class="section-hd" style="margin-top:8px"><div class="section-title">Acciones por aprobar (${forApproval.length})</div></div>`;
      forApproval.forEach(r => {
        html += `<div class="card" style="cursor:pointer" onclick="showRequestDetail('${r.id}', true)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div><div style="font-size:13px;font-weight:500">${r.fantasyName}</div>
            <div style="font-size:11px;color:var(--text2)">+${r.pts} pts · ${r.requestedByName}</div></div>
            <span class="status pending">⏳</span>
          </div>
          ${r.comment?`<div style="font-size:12px;color:var(--text2);background:var(--bg4);border-radius:8px;padding:8px;margin-bottom:8px">"${r.comment}"</div>`:''}
          ${r.evidenceUrl?`<div style="font-size:11px;color:var(--amber);margin-bottom:8px">📷 Tiene foto adjunta · Toca la tarjeta para ver</div>`:''}
          <div class="row" style="gap:10px;margin-top:4px">
            <button class="btn btn-teal" style="flex:1;padding:12px;font-size:14px;font-weight:600" onclick="event.stopPropagation();aprobar('${r.id}')">✓ Aprobar</button>
            <button class="btn btn-danger" style="flex:1;padding:12px;font-size:14px;font-weight:600" onclick="event.stopPropagation();rechazar('${r.id}')">✕ Rechazar</button>
          </div>
        </div>`;
      });
    }

    // Mis acciones enviadas (todas, con estado)
    const allMyActions = pendingSnap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.requestedBy===uid&&r.type==='action');
    
    // También traer las recientes aprobadas/rechazadas
    const recentSnap = await db.collection('groups').doc(gid).collection('requests')
      .where('requestedBy','==',uid).where('type','==','action').get();
    const allSent = recentSnap.docs.map(d=>({id:d.id,...d.data()}))
      .sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      .slice(0,10);

    if (allSent.length > 0) {
      const statusMap = {
        pending:  {label:'⏳ Pendiente',  cls:'pending',  color:'var(--amber)'},
        approved: {label:'✓ Aprobada',   cls:'approved', color:'var(--teal)'},
        rejected: {label:'✕ Rechazada',  cls:'rejected', color:'var(--rose)'},
      };
      html += `<div class="section-hd" style="margin-top:8px"><div class="section-title">Mis acciones enviadas</div></div>`;
      allSent.forEach(r => {
        const st = statusMap[r.status] || statusMap.pending;
        html += `<div class="card" style="margin-bottom:6px;cursor:pointer;transition:all 0.2s" onclick="showRequestDetail('${r.id}', false)">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.fantasyName}</div>
              <div style="font-size:11px;color:var(--text2);margin-top:2px">+${r.pts} pts · ${r.date||''}</div>
              ${r.evidenceUrl?`<div style="font-size:11px;color:var(--text3);margin-top:2px">📷 Tiene foto adjunta</div>`:''}
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
              <span class="status ${st.cls}">${st.label}</span>
              <span style="color:var(--text3);font-size:14px">›</span>
            </div>
          </div>
        </div>`;
      });
    }

    selUsers = [];
    pendingEvidenceBase64 = null;
    window._selectedActionId = null;
    document.getElementById('content').innerHTML = html;
  } catch(e) {
    document.getElementById('content').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error cargando</div></div>';
  }
}

function toggleActionCat(panelId) {
  const panel = document.getElementById(panelId);
  const arrow = document.getElementById(panelId + '-arrow');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'grid';
  if (arrow) arrow.textContent = isOpen ? '›' : '⌄';
}

function filterActions(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    // Sin búsqueda - volver a estado colapsado
    document.querySelectorAll('.action-cat-panel').forEach(p => { p.style.display = 'none'; });
    document.querySelectorAll('[id$="-arrow"]').forEach(a => { if (a.id.includes('cat-')) a.textContent = '›'; });
    return;
  }
  // Con búsqueda - expandir todo y filtrar
  document.querySelectorAll('.action-cat-panel').forEach(p => { p.style.display = 'grid'; });
  document.querySelectorAll('[id$="-arrow"]').forEach(a => { if (a.id.includes('cat-')) a.textContent = '⌄'; });
  document.querySelectorAll('.action-quick-card').forEach(card => {
    const name = card.dataset.name || '';
    card.style.display = name.includes(q) ? '' : 'none';
  });
  // Ocultar categorías vacías
  document.querySelectorAll('.action-cat-panel').forEach(panel => {
    const visible = panel.querySelectorAll('.action-quick-card:not([style*="display: none"])').length;
    const header = panel.previousElementSibling;
    if (header) header.style.display = visible > 0 ? '' : 'none';
    panel.style.display = visible > 0 ? 'grid' : 'none';
  });
}

function selectAction(id, pts, name) {
  window._selectedActionId = id;
  window._selectedActionPts = pts;
  window._selectedActionName = name;
  document.querySelectorAll('.action-quick-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('ac-'+id);
  if (card) card.classList.add('selected');
  const form = document.getElementById('action-form');
  if (form) form.style.display = 'block';
  const info = document.getElementById('selected-action-info');
  if (info) info.innerHTML = `<div style="font-size:28px">${card?.querySelector('.action-quick-icon')?.textContent||'⚡'}</div>
    <div><div style="font-size:14px;font-weight:500">${name}</div><div class="pts-mini" style="margin-top:4px">+${pts} pts</div></div>`;
  form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelAction() {
  window._selectedActionId = null;
  document.querySelectorAll('.action-quick-card').forEach(c => c.classList.remove('selected'));
  const form = document.getElementById('action-form');
  if (form) form.style.display = 'none';
}

function toggleUserSel(uid) {
  const idx = selUsers.indexOf(uid);
  if (idx >= 0) selUsers.splice(idx, 1); else selUsers.push(uid);
  document.querySelectorAll('[id^="mu-"]').forEach(el => {
    const id = el.id.replace('mu-','');
    const chk = document.getElementById('chk-'+id);
    if (selUsers.includes(id)) { el.classList.add('selected'); if (chk) chk.textContent='✓'; }
    else { el.classList.remove('selected'); if (chk) chk.textContent=''; }
  });
}

async function submitAction() {
  if (!window._selectedActionId) { showToast('Selecciona una acción'); return; }
  if (selUsers.length === 0) { showToast('Selecciona quién te da los puntos'); return; }
  const comment = document.getElementById('act-comment')?.value||'';
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const btn = document.querySelector('#action-form .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='Enviando...'; }
  try {
    let evidenceUrl = null;
    if (pendingEvidenceBase64) { showToast('Subiendo foto...'); evidenceUrl = await uploadEvidence(pendingEvidenceBase64, `evidence/${gid}/${uid}/${Date.now()}.jpg`); }
    const reqRef = db.collection('groups').doc(gid).collection('requests').doc();
    await reqRef.set({
      id: reqRef.id, type: 'action',
      requestedBy: uid, requestedByName: currentUserData.name,
      toUsers: [...selUsers],
      fantasyName: window._selectedActionName, pts: parseInt(window._selectedActionPts),
      status: 'pending', comment, evidenceUrl: evidenceUrl||null,
      date: new Date().toLocaleDateString('es'),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    for (const tid of selUsers) {
      await db.collection('groups').doc(gid).collection('notifications').add({
        toUserId: tid,
        text: `⚡ ${currentUserData.name} registró: ${window._selectedActionName} (+${window._selectedActionPts} pts)`,
        read: false, date: new Date().toLocaleDateString('es'),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    selUsers=[]; pendingEvidenceBase64=null; window._selectedActionId=null;
    showToast('✓ Acción enviada. Esperando aprobación.');
    showTab('ganar');
  } catch(e) {
    showToast('Error: '+e.message);
    if (btn) { btn.disabled=false; btn.textContent='Enviar para aprobación 📤'; }
  }
}

// ===== DESEOS =====
async function renderDeseos() {
  if (!currentUserData?.groupId) { document.getElementById('content').innerHTML='<div class="empty-state"><div class="empty-state-icon">⚠️</div></div>'; return; }
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  try {
    const [groupSnap, membersSnap, myReqsSnap, pendingSnap] = await Promise.all([
      db.collection('groups').doc(gid).get(),
      db.collection('users').where('groupId','==',gid).where('active','==',true).get(),
      db.collection('groups').doc(gid).collection('requests').where('requestedBy','==',uid).where('type','==','fantasy').get(),
      db.collection('groups').doc(gid).collection('requests').where('status','==','pending').where('type','==','fantasy').get(),
    ]);
    const group = groupSnap.data();
    const members = membersSnap.docs.map(d=>d.data()).filter(m=>m.id!==uid);
    const partner = members[0];
    const pk = partner?[uid,partner.id].sort().join('_'):null;
    const myPts = pk?(group.pairPoints?.[pk]?.[uid]||0):0;
    // SOLUCIÓN DEFINITIVA: Siempre usar DEFAULT_FANTASIES como base
    // Las fantasías custom (creadas por el usuario, sin ID fb/fm/ff) se agregan encima
    const groupFantasies = group.fantasies || [];
    const customFantasies = groupFantasies.filter(f => 
      !f.id.match(/^(fb|fm|ff)\d+$/)
    );
    // DEFAULT completo + custom del usuario
    const fantasies = [...DEFAULT_FANTASIES, ...customFantasies];
    const myReqs = myReqsSnap.docs.map(d=>({id:d.id,...d.data()}));
    const forMe = pendingSnap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.requestedBy!==uid);

    const levels = { basic:{label:'Básico',color:'var(--teal)',icon:'🟢'}, medium:{label:'Medio',color:'var(--amber)',icon:'🟡'}, high:{label:'Alto',color:'var(--rose)',icon:'🔴'} };

    let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div><div style="font-size:16px;font-weight:500">Tus deseos</div>
      <div style="font-size:13px;color:var(--text2);margin-top:2px">Tienes <strong style="color:var(--rose)">${myPts} pts</strong> disponibles</div></div>
    </div>
    ${!partner ? `<div class="card" style="text-align:center;padding:20px;border-color:rgba(232,96,138,0.3);margin-bottom:16px">
      <div style="font-size:36px;margin-bottom:8px">👫</div>
      <div style="font-size:14px;font-weight:500;margin-bottom:4px">Invita a tu pareja primero</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:12px;line-height:1.5">Sin pareja no hay quien apruebe tus deseos.<br>Invítala y empieza a jugar.</div>
      <button class="btn btn-primary" onclick="showInviteModal()">Invitar ahora →</button>
    </div>` : ''}`;

    // Por aprobar para mí
    if (forMe.length > 0) {
      html += `<div class="section-hd"><div class="section-title">🔔 Por aprobar (${forMe.length})</div></div>`;
      forMe.forEach(r => {
        html += `<div class="card glow-rose">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div><div style="font-size:13px;font-weight:500">${r.fantasyName}</div>
            <div style="font-size:11px;color:var(--text2)">${r.pts} pts · ${r.requestedByName}</div></div>
            <span class="status pending">⏳</span>
          </div>
          ${r.comment?`<div style="font-size:12px;color:var(--text2);background:var(--bg4);border-radius:8px;padding:8px;margin-bottom:8px">"${r.comment}"</div>`:''}
          <div class="row" style="gap:10px;margin-top:4px">
            <button class="btn btn-teal" style="flex:1;padding:12px;font-size:14px;font-weight:600" onclick="aprobar('${r.id}')">✓ Aprobar</button>
            <button class="btn btn-danger" style="flex:1;padding:12px;font-size:14px;font-weight:600" onclick="rechazar('${r.id}')">✕ Rechazar</button>
          </div>
        </div>`;
      });
    }

    // Mis solicitudes activas
    const activaReqs = myReqs.filter(r=>r.status==='pending'||r.status==='approved');
    if (activaReqs.length > 0) {
      html += `<div class="section-hd"><div class="section-title">Mis solicitudes</div></div>`;
      const statusMap = {pending:'pending',approved:'approved',rejected:'rejected',fulfilled:'fulfilled'};
      const labelMap = {pending:'⏳ Pendiente',approved:'✓ Aprobada',rejected:'✕ Rechazada',fulfilled:'⭐ Cumplida'};
      activaReqs.forEach(r => {
        const isPending = r.status === 'pending';
        html += `<div class="card" style="cursor:pointer" onclick="showMyRequestDetail('${r.id}')">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.fantasyName}</div>
              <div style="font-size:11px;color:var(--text2);margin-top:2px">${r.pts} pts · ${r.date}</div>
              ${r.tentativeDate?`<div style="font-size:11px;color:var(--purple);margin-top:2px">📅 ${new Date(r.tentativeDate+'T12:00:00').toLocaleDateString('es',{day:'numeric',month:'short'})}</div>`:''}
              ${r.place?`<div style="font-size:11px;color:var(--text3);margin-top:1px">📍 ${r.place}</div>`:''}
              ${(r.refPhotoUrls&&r.refPhotoUrls.length>0)?`<div style="font-size:11px;color:var(--text3);margin-top:1px">📷 ${r.refPhotoUrls.length} foto(s) adjunta(s)</div>`:''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;margin-left:8px">
              <span class="status ${statusMap[r.status]}">${labelMap[r.status]}</span>
              <span style="font-size:10px;color:var(--text3)">${isPending?'Toca para editar':'Ver detalle ›'}</span>
            </div>
          </div>
          ${r.status==='approved'&&!r.fulfilled?`<button class="btn btn-teal btn-full btn-sm" style="margin-top:8px" onclick="event.stopPropagation();markFulfilled('${r.id}')">⭐ Marcar como cumplida</button>`:''}
        </div>`;
      });
    }

    // Categorías de fantasías
    html += `<div class="section-hd" style="margin-top:8px"><div class="section-title">Catálogo de deseos</div></div>
    <div class="cat-tabs">
      <button class="cat-tab ${fantasyFilter==='all'?'active':''}" onclick="setCat('all',this)">Todos</button>
      <button class="cat-tab ${fantasyFilter==='pareja'?'active':''}" onclick="setCat('pareja',this)">💑 Pareja</button>
      <button class="cat-tab ${fantasyFilter==='grupo'?'active':''}" onclick="setCat('grupo',this)">👥 Grupo</button>
    </div>
    <div class="filter-scroll" style="margin-top:-6px">
      <button class="filter-chip ${fantasyLevel==='all'?'active':''}" onclick="setLevel('all',this)">Todos los niveles</button>
      <button class="filter-chip ${fantasyLevel==='basic'?'active':''}" onclick="setLevel('basic',this)">🟢 Básico</button>
      <button class="filter-chip ${fantasyLevel==='medium'?'active':''}" onclick="setLevel('medium',this)">🟡 Medio</button>
      <button class="filter-chip ${fantasyLevel==='high'?'active':''}" onclick="setLevel('high',this)">🔴 Alto</button>
    </div>`;

    // Filtros independientes combinados
    // category: pareja, grupo, ambos (aparece en ambos filtros)
    let filtered = fantasies;
    if (fantasyFilter==='pareja') filtered=filtered.filter(f=>f.category==='pareja'||f.category==='ambos'||!f.category);
    else if (fantasyFilter==='grupo') filtered=filtered.filter(f=>f.category==='grupo'||f.category==='ambos');
    if (fantasyLevel!=='all') filtered=filtered.filter(f=>f.level===fantasyLevel);

    // Agrupar por nivel - colapsables
    const levelOrder = ['basic','medium','high'];
    const levelGroups = {};
    filtered.forEach(f => {
      const lvl = f.level || 'basic';
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(f);
    });
    const lvlIcons = {basic:'🟢',medium:'🟡',high:'🔴'};
    const lvlLabels = {basic:'Básico',medium:'Medio',high:'Alto'};
    const lvlColors = {basic:'var(--teal)',medium:'var(--amber)',high:'var(--rose)'};

    levelOrder.forEach(lvl => {
      const group = levelGroups[lvl] || [];
      if (group.length === 0) return;
      const canAffordCount = group.filter(f => myPts >= f.pts).length;
      const panelId = 'lvl-panel-' + lvl;
      html += `<div class="action-cat-header" onclick="toggleDeseoLevel('${panelId}')">
        <span style="font-size:13px;font-weight:600;color:${lvlColors[lvl]}">${lvlIcons[lvl]} ${lvlLabels[lvl]}</span>
        <span style="font-size:11px;color:var(--text3)">${group.length} deseos · ${canAffordCount} al alcance</span>
        <span id="${panelId}-arrow" style="color:var(--text3);font-size:14px;margin-left:auto">›</span>
      </div>
      <div id="${panelId}" style="display:none">`;
      group.forEach(f => {
        const canAfford = myPts >= f.pts;
        const catIcon = f.category==='grupo'?'👥':f.category==='ambos'?'💑👥':'💑';
        html += `<div class="desire-card ${canAfford?'':'locked'}" onclick="showDeseoDetail('${f.id}')">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="fantasy-emoji ${f.level}" style="width:46px;height:46px;font-size:24px">${f.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</div>
              <div style="font-size:11px;color:${lvlColors[lvl]};margin-top:2px">${catIcon}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div class="pts-badge ${canAfford?f.level:'locked'}">${f.pts} pts</div>
              ${!canAfford?`<div style="font-size:10px;color:var(--text3);margin-top:3px">faltan ${f.pts-myPts}</div>`:''}
            </div>
          </div>
        </div>`;
      });
      html += `</div>`;
    });

    // Historial de solicitudes previas
    const rejectedReqs = myReqs.filter(r=>r.status==='rejected'||r.status==='fulfilled');
    if (rejectedReqs.length > 0) {
      html += `<div class="section-hd" style="margin-top:8px"><div class="section-title" style="cursor:pointer" onclick="toggleHistory()">Historial ▾</div></div>
      <div id="history-panel" style="display:none">`;
      const labelMap = {rejected:'✕ Rechazada',fulfilled:'⭐ Cumplida'};
      rejectedReqs.forEach(r => {
        html += `<div class="hist-item">
          <div class="hist-icon ${r.status==='fulfilled'?'add':'sub'}">${r.status==='fulfilled'?'⭐':'✕'}</div>
          <div style="flex:1"><div class="hist-name">${r.fantasyName}</div><div class="hist-date">${r.pts} pts · ${r.date}</div></div>
          <span class="status ${r.status==='fulfilled'?'fulfilled':'rejected'}" style="font-size:10px">${labelMap[r.status]}</span>
        </div>`;
      });
      html += `</div>`;
    }

    document.getElementById('content').innerHTML = html;
  } catch(e) {
    document.getElementById('content').innerHTML='<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error cargando</div></div>';
  }
}

function showTabHistorial(from) {
  historialFrom = from || 'perfil';
  showTab('historial');
}

function toggleDeseoLevel(panelId) {
  const panel = document.getElementById(panelId);
  const arrow = document.getElementById(panelId + '-arrow');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '›' : '⌄';
}

function toggleHistory() {
  const panel = document.getElementById('history-panel');
  if (panel) panel.style.display = panel.style.display==='none'?'block':'none';
}

function setCat(cat, el) {
  fantasyFilter = cat;
  document.querySelectorAll('.cat-tab').forEach(c=>c.classList.remove('active'));
  if (el) el.classList.add('active');
  showTab('deseos');
}

function setLevel(level, el) {
  fantasyLevel = level;
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  if (el) el.classList.add('active');
  showTab('deseos');
}

// Mantener setFF por compatibilidad
function setFF(val, el) { setCat(val, el); }

async function showDeseoDetail(fid) {
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  // Reset fotos de referencia
  window._refPhotos = [];
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const group = groupSnap.data();
    const f = group.fantasies?.find(x=>x.id===fid)||DEFAULT_FANTASIES.find(x=>x.id===fid);
    if (!f) return;
    const membersSnap = await db.collection('users').where('groupId','==',gid).where('active','==',true).get();
    const members = membersSnap.docs.map(d=>d.data()).filter(m=>m.id!==uid);
    const partner = members[0];
    const pk = partner?[uid,partner.id].sort().join('_'):null;
    const myPts = pk?(group.pairPoints?.[pk]?.[uid]||0):0;
    const canAfford = myPts >= f.pts;
    const levelColors = {basic:'var(--teal)',medium:'var(--amber)',high:'var(--rose)'};
    const levelLabels = {basic:'Básico',medium:'Medio',high:'Alto'};
    const catLabel = f.category==='grupo'?'👥 Con terceros':f.category==='ambos'?'💑👥 Pareja o grupo':'💑 En pareja';

    document.getElementById('modal-container').innerHTML=`<div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal">
        <div class="modal-handle"></div>
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:48px;margin-bottom:8px">${f.icon}</div>
          <div style="font-family:var(--font-display);font-size:20px;font-weight:500;margin-bottom:6px">${f.name}</div>
          <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
            <span style="font-size:11px;color:${levelColors[f.level]};background:${levelColors[f.level]}22;padding:3px 10px;border-radius:20px;font-weight:600">${levelLabels[f.level]}</span>
            <span style="font-size:11px;color:var(--text2);background:var(--bg4);padding:3px 10px;border-radius:20px">${catLabel}</span>
          </div>
          <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-top:10px">${f.desc}</div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:14px">
          <div style="flex:1;background:var(--bg4);border-radius:12px;padding:12px;text-align:center">
            <div style="font-size:10px;color:var(--text2);margin-bottom:3px">Costo</div>
            <div style="font-family:var(--font-display);font-size:24px;color:var(--rose);font-weight:500">${f.pts}</div>
            <div style="font-size:10px;color:var(--text2)">puntos</div>
          </div>
          <div style="flex:1;background:var(--bg4);border-radius:12px;padding:12px;text-align:center">
            <div style="font-size:10px;color:var(--text2);margin-bottom:3px">Tienes</div>
            <div style="font-family:var(--font-display);font-size:24px;color:${canAfford?'var(--teal)':'var(--rose)'};font-weight:500">${myPts}</div>
            <div style="font-size:10px;color:var(--text2)">puntos</div>
          </div>
        </div>

        ${canAfford?`
        <div style="font-size:13px;font-weight:600;margin-bottom:10px;color:var(--text)">📋 Detalla tu propuesta</div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:12px;line-height:1.5">Mientras más detallas, más fácil es que te aprueben 😉</div>

        <div class="form-group">
          <label class="form-label">Nota para tu pareja</label>
          <textarea class="form-control" id="fantasy-comment" rows="2" placeholder="Cuéntale por qué quieres esto..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">📅 Fecha tentativa (opcional)</label>
          <input type="date" class="form-control" id="fantasy-date" min="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">📍 Lugar o contexto (opcional)</label>
          <input type="text" class="form-control" id="fantasy-place" placeholder="Ej: Cabaña en Cajón del Maipo, Hotel en Valparaíso...">
        </div>
        <div class="form-group">
          <label class="form-label">📸 Fotos de referencia (hasta 3)</label>
          <div id="ref-photos-preview" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"></div>
          <div id="ref-photo-btn" class="upload-btn" onclick="addRefPhoto()" style="${window._refPhotos?.length>=3?'display:none':''}">
            📷 Agregar foto de referencia
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">Del lugar, outfit, ambiente... lo que ayude a visualizar</div>
        </div>
        <button class="btn btn-primary btn-full" onclick="requestFantasy('${f.id}')">🔥 Enviar propuesta</button>`:
        `<div style="background:var(--bg4);border-radius:12px;padding:16px;text-align:center;margin-bottom:10px">
          <div style="font-size:13px;color:var(--text2)">Te faltan <strong style="color:var(--rose)">${f.pts-myPts} puntos</strong></div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px">Sigue registrando acciones 💪</div>
        </div>
        <button class="btn btn-outline btn-full" onclick="closeModalDirect()">Cerrar</button>`}
      </div>
    </div>`;
  } catch(e) { showToast('Error'); }
}

// Agregar foto de referencia al modal de fantasía
function addRefPhoto() {
  window._uploadingRefPhoto = true;
  document.getElementById('file-upload').click();
}

async function requestFantasy(fid) {
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const comment = document.getElementById('fantasy-comment')?.value||'';
  const tentativeDate = document.getElementById('fantasy-date')?.value||'';
  const place = document.getElementById('fantasy-place')?.value?.trim()||'';
  const refPhotos = window._refPhotos||[];
  const btn = document.querySelector('#modal-container .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='Enviando propuesta...'; }
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const group = groupSnap.data();
    const f = group.fantasies?.find(x=>x.id===fid)||DEFAULT_FANTASIES.find(x=>x.id===fid);
    const membersSnap = await db.collection('users').where('groupId','==',gid).where('active','==',true).get();
    const members = membersSnap.docs.map(d=>d.data()).filter(m=>m.id!==uid);
    const partner = members[0];
    const pk = partner?[uid,partner.id].sort().join('_'):null;
    const pairPoints = group.pairPoints||{};
    const myPts = pk?(pairPoints[pk]?.[uid]||0):0;
    if (!f||myPts<f.pts) { showToast('Sin puntos suficientes'); if (btn){btn.disabled=false;btn.textContent='🔥 Solicitar este deseo';} return; }
    if (pk) {
      if (!pairPoints[pk]) pairPoints[pk]={};
      pairPoints[pk][uid]=Math.max(0,(pairPoints[pk][uid]||0)-f.pts);
      await db.collection('groups').doc(gid).update({pairPoints});
    }
    // Subir fotos de referencia si las hay
    let refPhotoUrls = [];
    if (refPhotos.length > 0) {
      showToast('Subiendo fotos...');
      for (let i = 0; i < refPhotos.length; i++) {
        const url = await uploadEvidence(refPhotos[i], `refphotos/${gid}/${uid}/${Date.now()}_${i}.jpg`);
        if (url) refPhotoUrls.push(url);
      }
    }
    window._refPhotos = [];

    const reqRef = db.collection('groups').doc(gid).collection('requests').doc();
    await reqRef.set({
      id:reqRef.id, type:'fantasy',
      requestedBy:uid, requestedByName:currentUserData.name,
      toUsers:partner?[partner.id]:[],
      fantasyId:f.id, fantasyName:f.name, pts:f.pts,
      status:'pending', comment,
      tentativeDate, place,
      refPhotoUrls,
      reason:'', approveComment:'', fulfilled:false,
      date:new Date().toLocaleDateString('es'),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    if (partner) {
      await db.collection('groups').doc(gid).collection('notifications').add({
        toUserId:partner.id,
        text:`🔥 ${currentUserData.name} solicitó: ${f.name} (${f.pts} pts)`,
        read:false, date:new Date().toLocaleDateString('es'),
        createdAt:firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    closeModalDirect();
    showToast('✓ Deseo solicitado. Esperando respuesta.');
    showTab('deseos');
  } catch(e) {
    showToast('Error: '+e.message);
    if (btn){btn.disabled=false;btn.textContent='🔥 Solicitar este deseo';}
  }
}

async function markFulfilled(reqId) {
  const gid = currentUserData.groupId;
  try {
    const reqSnap = await db.collection('groups').doc(gid).collection('requests').doc(reqId).get();
    const req = reqSnap.data();
    await db.collection('groups').doc(gid).collection('requests').doc(reqId).update({status:'fulfilled',fulfilled:true});
    showTab('inicio');
    // Mostrar tarjeta compartible con celebración
    setTimeout(() => showShareCard(req?.fantasyName || 'Deseo cumplido'), 500);
  } catch(e) { showToast('Error: '+e.message); }
}

// ===== APROBAR / RECHAZAR =====
function aprobar(reqId) {
  document.getElementById('modal-container').innerHTML=`<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-title">✓ Aprobar</div>
      <div class="form-group"><label class="form-label">Comentario (opcional)</label>
        <textarea class="form-control" id="approve-comment" rows="2" placeholder="Agrega algo si quieres..."></textarea>
      </div>
      <button class="btn btn-teal btn-full" onclick="confirmarAprobacion('${reqId}')">Confirmar aprobación</button>
    </div>
  </div>`;
}

async function confirmarAprobacion(reqId) {
  const comment = document.getElementById('approve-comment')?.value||'';
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const btn = document.querySelector('#modal-container .btn-teal');
  if (btn) { btn.disabled=true; btn.textContent='Aprobando...'; }
  try {
    const reqSnap = await db.collection('groups').doc(gid).collection('requests').doc(reqId).get();
    const req = reqSnap.data();
    if (!req) return;
    await db.collection('groups').doc(gid).collection('requests').doc(reqId).update({status:'approved',approveComment:comment});
    if (req.type==='action'&&req.toUsers?.includes(uid)) {
      const groupSnap = await db.collection('groups').doc(gid).get();
      const pairPoints = groupSnap.data().pairPoints||{};
      const pk = [req.requestedBy,uid].sort().join('_');
      if (!pairPoints[pk]) pairPoints[pk]={};
      pairPoints[pk][req.requestedBy]=(pairPoints[pk][req.requestedBy]||0)+req.pts;
      await db.collection('groups').doc(gid).update({pairPoints});
      await db.collection('groups').doc(gid).collection('history').add({
        fromUser:req.requestedBy, fromUserName:req.requestedByName,
        toUsers:req.toUsers, action:req.fantasyName, pts:req.pts,
        type:'add', comment, evidenceUrl:req.evidenceUrl||null,
        date:new Date().toLocaleDateString('es'),
        createdAt:firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    await db.collection('groups').doc(gid).collection('notifications').add({
      toUserId:req.requestedBy,
      text:`✓ Aprobaron: ${req.fantasyName}${req.type==='action'?' (+'+req.pts+' pts)':''}${comment?' — "'+comment+'"':''}`,
      read:false, date:new Date().toLocaleDateString('es'),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModalDirect();
    // Celebración visual
    showCelebration(req.type === 'action' ? `+${req.pts} pts ⚡` : '🔥 Deseo aprobado');
    setTimeout(() => showTab(currentTab), 1200);
  } catch(e) { showToast('Error: '+e.message); if (btn){btn.disabled=false;btn.textContent='Confirmar aprobación';} }
}

function showCelebration(msg) {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);
    background:linear-gradient(135deg,var(--teal),#20C997);
    color:white;padding:20px 32px;border-radius:20px;
    font-size:22px;font-weight:700;z-index:999;
    transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
    box-shadow:0 8px 32px rgba(78,203,160,0.4);text-align:center;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.style.transform = 'translate(-50%,-50%) scale(1)', 50);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%,-60%) scale(0.8)';
    setTimeout(() => el.remove(), 300);
  }, 1000);
}

// ===== MODAL DETALLE DE SOLICITUD =====
async function showRequestDetail(reqId, canApprove) {
  const gid = currentUserData.groupId;
  try {
    const reqSnap = await db.collection('groups').doc(gid).collection('requests').doc(reqId).get();
    const r = reqSnap.data();
    if (!r) { showToast('No se encontró la solicitud'); return; }

    const statusMap = {
      pending:  { label:'⏳ Pendiente',  color:'var(--amber)' },
      approved: { label:'✓ Aprobada',   color:'var(--teal)'  },
      rejected: { label:'✕ Rechazada',  color:'var(--rose)'  },
      fulfilled:{ label:'⭐ Cumplida',   color:'var(--purple)'},
    };
    const st = statusMap[r.status] || statusMap.pending;
    const typeLabel = r.type === 'action' ? '⚡ Acción' : '🔥 Deseo';

    document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal">
        <div class="modal-handle"></div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-size:17px;font-weight:600">${r.fantasyName}</div>
            <div style="font-size:12px;color:var(--text2);margin-top:3px">${typeLabel} · +${r.pts} pts · ${r.date||''}</div>
          </div>
          <span style="padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${st.color}22;color:${st.color}">${st.label}</span>
        </div>

        ${r.comment ? `
        <div style="background:var(--bg3);border-radius:12px;padding:12px;margin-bottom:12px">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Comentario</div>
          <div style="font-size:13px;color:var(--text2)">"${r.comment}"</div>
        </div>` : ''}

        ${r.evidenceUrl ? `
        <div style="margin-bottom:12px">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Evidencia</div>
          <img src="${r.evidenceUrl}" style="width:100%;max-height:240px;object-fit:cover;border-radius:12px;cursor:pointer" onclick="viewEvidence('${r.evidenceUrl}')">
          <div style="font-size:11px;color:var(--text3);text-align:center;margin-top:4px">Toca para ver completa</div>
        </div>` : ''}

        ${r.tentativeDate||r.place ? `
        <div style="background:var(--bg3);border-radius:12px;padding:12px;margin-bottom:12px">
          ${r.tentativeDate?`<div style="display:flex;align-items:center;gap:8px;margin-bottom:${r.place?'8px':'0'}">
            <span style="font-size:18px">📅</span>
            <div><div style="font-size:10px;color:var(--text3)">FECHA TENTATIVA</div>
            <div style="font-size:13px;font-weight:500">${new Date(r.tentativeDate+'T12:00:00').toLocaleDateString('es',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div></div>
          </div>`:''}
          ${r.place?`<div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">📍</span>
            <div><div style="font-size:10px;color:var(--text3)">LUGAR</div>
            <div style="font-size:13px;font-weight:500">${r.place}</div></div>
          </div>`:''}
        </div>` : ''}

        ${r.refPhotoUrls&&r.refPhotoUrls.length>0 ? `
        <div style="margin-bottom:12px">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Fotos de referencia</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${r.refPhotoUrls.map(url=>`<img src="${url}" style="width:calc(33% - 4px);aspect-ratio:1;object-fit:cover;border-radius:8px;cursor:pointer" onclick="viewEvidence('${url}')">`).join('')}
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:4px">Toca una foto para verla completa</div>
        </div>` : (!r.evidenceUrl ? `
        <div style="background:var(--bg3);border-radius:12px;padding:12px;margin-bottom:12px;text-align:center">
          <div style="font-size:24px;margin-bottom:4px">📷</div>
          <div style="font-size:12px;color:var(--text3)">Sin fotos adjuntas</div>
        </div>` : '')}

        ${r.approveComment ? `
        <div style="background:rgba(78,203,160,0.1);border:1px solid rgba(78,203,160,0.2);border-radius:12px;padding:12px;margin-bottom:12px">
          <div style="font-size:10px;color:var(--teal);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Comentario de aprobación</div>
          <div style="font-size:13px;color:var(--teal)">"${r.approveComment}"</div>
        </div>` : ''}

        ${r.reason ? `
        <div style="background:rgba(232,96,138,0.1);border:1px solid rgba(232,96,138,0.2);border-radius:12px;padding:12px;margin-bottom:12px">
          <div style="font-size:10px;color:var(--rose);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Motivo de rechazo</div>
          <div style="font-size:13px;color:var(--rose)">"${r.reason}"</div>
        </div>` : ''}

        <div style="font-size:11px;color:var(--text3);text-align:center;margin-bottom:${canApprove && r.status==='pending'?'14px':'0'}">
          Enviado por ${r.requestedByName||''}
        </div>

        ${canApprove && r.status === 'pending' ? `
        <div class="row" style="gap:10px">
          <button class="btn btn-teal" style="flex:1;padding:13px;font-size:14px;font-weight:600" onclick="closeModalDirect();aprobar('${r.id}')">✓ Aprobar</button>
          <button class="btn btn-danger" style="flex:1;padding:13px;font-size:14px;font-weight:600" onclick="closeModalDirect();rechazar('${r.id}')">✕ Rechazar</button>
        </div>` : `
        <button class="btn btn-outline btn-full" onclick="closeModalDirect()">Cerrar</button>`}
      </div>
    </div>`;
  } catch(e) { showToast('Error cargando detalle'); }
}

function rechazar(reqId) {
  document.getElementById('modal-container').innerHTML=`<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-title">✕ Rechazar</div>
      <div class="form-group"><label class="form-label">Motivo (requerido)</label>
        <textarea class="form-control" id="reject-reason" rows="3" placeholder="Explica por qué..."></textarea>
      </div>
      <button class="btn btn-danger btn-full" onclick="confirmarRechazo('${reqId}')">Confirmar rechazo</button>
    </div>
  </div>`;
}

async function confirmarRechazo(reqId) {
  const reason = document.getElementById('reject-reason')?.value?.trim();
  if (!reason) { showToast('El motivo es requerido'); return; }
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  try {
    const reqSnap = await db.collection('groups').doc(gid).collection('requests').doc(reqId).get();
    const req = reqSnap.data();
    await db.collection('groups').doc(gid).collection('requests').doc(reqId).update({status:'rejected',reason});
    if (req.type==='fantasy') {
      const groupSnap = await db.collection('groups').doc(gid).get();
      const pairPoints = groupSnap.data().pairPoints||{};
      const pk = [req.requestedBy,uid].sort().join('_');
      if (!pairPoints[pk]) pairPoints[pk]={};
      pairPoints[pk][req.requestedBy]=(pairPoints[pk][req.requestedBy]||0)+req.pts;
      await db.collection('groups').doc(gid).update({pairPoints});
    }
    await db.collection('groups').doc(gid).collection('notifications').add({
      toUserId:req.requestedBy,
      text:`✕ Rechazaron: ${req.fantasyName} — "${reason}"`,
      read:false, date:new Date().toLocaleDateString('es'),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModalDirect();
    showToast('Rechazado');
    showTab(currentTab);
  } catch(e) { showToast('Error: '+e.message); }
}

// ===== PERFIL =====
async function renderPerfil() {
  const u = currentUserData;
  const gid = u?.groupId;
  let groupCode = '';
  let groupSnap = null;
  try {
    if (gid) { groupSnap = await db.collection('groups').doc(gid).get(); groupCode = groupSnap?.data()?.inviteCode||''; }
  } catch(e) {}

  // Stats
  const gid2 = currentUserData.groupId;
  let totalPts = 0, totalFulfilled = 0, totalActions = 0;
  try {
    const [histSnap, fulfilledSnap, actionsSnap] = await Promise.all([
      db.collection('groups').doc(gid2).collection('history').where('fromUser','==',currentUser.uid).get(),
      db.collection('groups').doc(gid2).collection('requests').where('requestedBy','==',currentUser.uid).where('status','==','fulfilled').get(),
      db.collection('groups').doc(gid2).collection('requests').where('requestedBy','==',currentUser.uid).where('type','==','action').where('status','==','approved').get(),
    ]);
    histSnap.docs.forEach(d => { totalPts += (d.data().pts||0); });
    totalFulfilled = fulfilledSnap.size;
    totalActions = actionsSnap.size;
  } catch(e) {}

  const isAdmin = u?.role === 'admin';

  document.getElementById('content').innerHTML = `
  <div class="profile-hero">
    <div class="profile-avatar-lg" style="background:${u.color}22;color:${u.color};border-color:${u.color}44">${u.initials}</div>
    <div class="profile-name">${u.name}</div>
    <div class="profile-email">${u.email}</div>
    <div class="profile-badges">
      <span class="role-badge ${isAdmin?'role-admin':'role-viewer'}">${isAdmin?'👑 Admin':'👁 Viewer'}</span>
      <span class="role-badge role-viewer">${u.gender}</span>
      ${u.streak>1?`<span class="role-badge" style="background:rgba(245,166,35,0.15);color:var(--amber)">🔥 ${u.streak} días</span>`:''}
    </div>
  </div>

  <div class="stat-grid">
    <div class="stat-card"><div class="stat-num">${totalPts}</div><div class="stat-label">Puntos ganados</div></div>
    <div class="stat-card"><div class="stat-num">${totalActions}</div><div class="stat-label">Acciones completadas</div></div>
    <div class="stat-card"><div class="stat-num">${totalFulfilled}</div><div class="stat-label">Deseos cumplidos</div></div>
    <div class="stat-card"><div class="stat-num">${u.streak||0}</div><div class="stat-label">Racha de días</div></div>
  </div>

  <div class="card">
    <div class="menu-item" onclick="showEditPerfil()">
      <div class="menu-item-icon" style="background:var(--rose-glow)">✏️</div>
      <div class="menu-item-text">Editar perfil</div>
      <div class="menu-item-arrow">›</div>
    </div>
    <div class="menu-item" onclick="showInviteModal()">
      <div class="menu-item-icon" style="background:var(--teal-glow)">👫</div>
      <div class="menu-item-text">Invitar al grupo</div>
      <div class="menu-item-arrow">›</div>
    </div>
    <div class="menu-item" onclick="showTab('game')">
      <div class="menu-item-icon" style="background:var(--purple-glow)">🎮</div>
      <div class="menu-item-text">Ignite Game</div>
      <div class="menu-item-arrow">›</div>
    </div>
    <div class="menu-item" onclick="showTabHistorial('perfil')">
      <div class="menu-item-icon" style="background:var(--bg3)">📊</div>
      <div class="menu-item-text">Historial completo</div>
      <div class="menu-item-arrow">›</div>
    </div>
    <div class="menu-item" onclick="toggleMantPanel()">
      <div class="menu-item-icon" style="background:var(--amber-glow)">🗂️</div>
      <div class="menu-item-text">Mantenedores</div>
      <div class="menu-item-arrow" id="mant-arrow">›</div>
    </div>
    <div id="mant-panel" style="display:none;padding:0 0 8px 0">
      <div onclick="showTab('mant-deseos')" style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg3);border-radius:12px;cursor:pointer;margin-bottom:6px">
        <span style="font-size:20px">🔥</span>
        <div style="flex:1"><div style="font-size:13px;font-weight:500">Deseos</div><div style="font-size:11px;color:var(--text2)">Ver, agregar y editar</div></div>
        <span style="color:var(--text3)">›</span>
      </div>
      <div onclick="showTab('mant-acciones')" style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg3);border-radius:12px;cursor:pointer">
        <span style="font-size:20px">⚡</span>
        <div style="flex:1"><div style="font-size:13px;font-weight:500">Acciones</div><div style="font-size:11px;color:var(--text2)">Ver, agregar y editar</div></div>
        <span style="color:var(--text3)">›</span>
      </div>
    </div>
    <div class="menu-item" onclick="showTab('config')">
      <div class="menu-item-icon" style="background:var(--bg3)">⚙️</div>
      <div class="menu-item-text">Configuración</div>
      <div class="menu-item-arrow">›</div>
    </div>

    <div class="menu-item" onclick="showTutorial()">
      <div class="menu-item-icon" style="background:var(--bg3)">🎓</div>
      <div class="menu-item-text">Ver tutorial</div>
      <div class="menu-item-arrow">›</div>
    </div>
    <div class="menu-item" onclick="showLegal('terms')">
      <div class="menu-item-icon" style="background:var(--bg3)">📄</div>
      <div class="menu-item-text">Términos de Servicio</div>
      <div class="menu-item-arrow">›</div>
    </div>
    <div class="menu-item" onclick="showLegal('privacy')">
      <div class="menu-item-icon" style="background:var(--bg3)">🔒</div>
      <div class="menu-item-text">Política de Privacidad</div>
      <div class="menu-item-arrow">›</div>
    </div>
  </div>

  <button class="btn btn-danger btn-full" onclick="cerrarSesion()" style="margin-top:8px">Cerrar sesión</button>
  <div style="text-align:center;font-size:11px;color:var(--text3);margin-top:16px">Ignite v5.0 · ignite-gules-six.vercel.app</div>`;
}

function showEditPerfil() {
  const u = currentUserData;
  const colors = ['#E8608A','#4ECBA0','#9B7FE8','#F5A623','#FF7A00','#378ADD','#E84393','#20C997'];
  window.selectedColor = u.color;
  document.getElementById('modal-container').innerHTML=`<div class="modal-overlay" onclick="closeModal(event)">
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-title">Editar perfil</div>
      <div class="form-group"><label class="form-label">Nombre</label>
        <input type="text" class="form-control" id="edit-name" value="${u.name}">
      </div>
      <div class="form-group"><label class="form-label">Color de avatar</label>
        <div class="color-grid">
          ${colors.map(c=>`<div class="color-dot ${c===u.color?'active':''}" style="background:${c}" onclick="selectColor('${c}',this)" id="cdot-${c.replace('#','')}"></div>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-full" style="margin-top:8px" onclick="guardarPerfil()">Guardar cambios</button>
    </div>
  </div>`;
}

function selectColor(color, el) {
  window.selectedColor = color;
  document.querySelectorAll('.color-dot').forEach(d=>d.classList.remove('active'));
  el.classList.add('active');
}

async function guardarPerfil() {
  const name = document.getElementById('edit-name')?.value?.trim();
  if (!name) { showToast('El nombre no puede estar vacío'); return; }
  const color = window.selectedColor||currentUserData.color;
  const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  try {
    await db.collection('users').doc(currentUser.uid).update({name,color,initials});
    currentUserData.name=name; currentUserData.color=color; currentUserData.initials=initials;
    updateHeader();
    closeModalDirect();
    showToast('✓ Perfil actualizado');
    showTab('perfil');
  } catch(e) { showToast('Error: '+e.message); }
}

async function cerrarSesion() {
  try { await auth.signOut(); } catch(e) {}
}

// ===== INVITE =====
async function showInviteModal() {
  const gid = currentUserData.groupId;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const code = groupSnap.data().inviteCode;
    const url = 'https://ignite-gules-six.vercel.app';
    const msgShort = `🔥 Ignite - La app para encender tu relación. Regístrate con mi código: ${code} 👉 ${url}`;
    const msgFull = `¡Te invito a Ignite! 🔥\n\nLa app para encender tu relación y salir de la rutina.\n\nDescárgala en: ${url}\nCódigo de acceso: ${code}`;
    const encodedFull = encodeURIComponent(msgFull);
    const encodedShort = encodeURIComponent(msgShort);
    const encodedUrl = encodeURIComponent(url);
    document.getElementById('modal-container').innerHTML=`<div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal">
        <div class="modal-handle"></div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <button class="btn btn-outline btn-sm" onclick="closeModalDirect()">← Volver</button>
          <div class="modal-title" style="margin-bottom:0">Invitar al grupo 🔥</div>
        </div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">¿A quién estás invitando?</label>
          <select class="form-control" id="invite-type">
            <option value="pareja">💑 Mi pareja</option>
            <option value="tercero">🧑 Tercero/a</option>
          </select>
        </div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:8px">Código de acceso para quien invites:</div>
        <div class="code-block" onclick="copyCode('${code}')">${code} 📋</div>
        <div style="font-size:11px;color:var(--text2);text-align:center;margin:6px 0 14px">Toca para copiar</div>
        <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Compartir por</div>
        <div class="invite-option" onclick="window.open('https://wa.me/?text=${encodedFull}','_blank')">
          <div class="invite-icon" style="background:#25D36615">💬</div>
          <div style="flex:1"><div class="invite-name">WhatsApp</div><div class="invite-sub">Enviar invitación con código</div></div>
          <span style="color:var(--text3)">→</span>
        </div>
        <div class="invite-option" onclick="window.open('https://t.me/share/url?url=${encodedUrl}&text=${encodedFull}','_blank')">
          <div class="invite-icon" style="background:#229ED915">✈️</div>
          <div style="flex:1"><div class="invite-name">Telegram</div><div class="invite-sub">Enviar por Telegram</div></div>
          <span style="color:var(--text3)">→</span>
        </div>
        <div class="invite-option" onclick="window.open('https://twitter.com/intent/tweet?text=${encodedShort}','_blank')">
          <div class="invite-icon" style="background:#1DA1F215">𝕏</div>
          <div style="flex:1"><div class="invite-name">Twitter / X</div><div class="invite-sub">Publicar en tu perfil</div></div>
          <span style="color:var(--text3)">→</span>
        </div>
        <div class="invite-option" onclick="window.open('https://www.tiktok.com/','_blank');copyCode('${msgShort}');showToast('Mensaje copiado. Pégalo en tu bio o video de TikTok')">
          <div class="invite-icon" style="background:#00000030;color:white">♪</div>
          <div style="flex:1"><div class="invite-name">TikTok</div><div class="invite-sub">Copiar para bio o video</div></div>
          <span style="color:var(--text3)">→</span>
        </div>
        <div class="invite-option" onclick="copyCode('${msgShort}');showToast('Copiado. Pégalo en Instagram DM o stories')">
          <div class="invite-icon" style="background:#E1306C15">📸</div>
          <div style="flex:1"><div class="invite-name">Instagram</div><div class="invite-sub">Copiar para DM o stories</div></div>
          <span style="color:var(--text3)">→</span>
        </div>
        <div class="invite-option" onclick="copyCode('${url}');showToast('URL copiada')">
          <div class="invite-icon" style="background:var(--bg4)">🔗</div>
          <div style="flex:1"><div class="invite-name">Copiar enlace</div><div class="invite-sub">Pégalo donde quieras</div></div>
          <span style="color:var(--text3)">→</span>
        </div>
      </div>
    </div>`;
  } catch(e) { showToast('Error'); }
}

function copyCode(text) {
  try { navigator.clipboard.writeText(text); showToast('✓ Copiado'); } catch(e) { showToast('Copia: '+text); }
}

// ===== GAME =====
let gameState = { category:'suave', mode:'presencial', currentChallenge:null, usedChallenges:{suave:[],moderado:[],hot:[]}, sessionId:null };

function renderGame() {
  const cats = GAME_CHALLENGES;
  let html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
    <button class="btn btn-outline btn-sm" onclick="showTab('perfil')">← Volver</button>
    <div><div style="font-size:16px;font-weight:500">Ignite Game 🎮</div>
    <div style="font-size:12px;color:var(--text2)">Para mayores de 21 años</div></div>
  </div>
  <div class="row" style="margin-bottom:16px">
    <button class="btn btn-full ${gameState.mode==='presencial'?'btn-primary':'btn-outline'}" onclick="setGameMode('presencial')">🏠 Presencial</button>
    <button class="btn btn-full ${gameState.mode==='remoto'?'btn-primary':'btn-outline'}" onclick="setGameMode('remoto')">📱 Remoto</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">`;
  Object.entries(cats).forEach(([key,cat])=>{
    const isActive = gameState.category===key;
    html+=`<div class="card" onclick="setGameCategory('${key}')" style="cursor:pointer;${isActive?'border-color:'+cat.color+';box-shadow:0 0 16px '+cat.color+'22':''}; display:flex;align-items:center;gap:12px;padding:14px">
      <div style="font-size:26px">${cat.icon}</div>
      <div style="flex:1"><div style="font-size:14px;font-weight:500;color:${cat.color}">${cat.label}</div>
      <div style="font-size:11px;color:var(--text2)">${key==='suave'?'Para calentar':key==='moderado'?'Subiendo la temperatura':'Sin filtros'}</div></div>
      ${isActive?`<div style="color:${cat.color}">✓</div>`:''}
    </div>`;
  });
  html+=`</div>
  <button class="btn btn-primary btn-full" style="font-size:16px;padding:16px;margin-bottom:16px" onclick="getChallenge()">🎲 Obtener reto</button>`;
  if (gameState.currentChallenge) {
    const cat=cats[gameState.category];
    html+=`<div class="card" style="text-align:center;padding:24px;border-color:${cat.color};box-shadow:0 0 24px ${cat.color}22">
      <div style="font-size:36px;margin-bottom:10px">${cat.icon}</div>
      <div style="font-size:11px;color:${cat.color};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:600">${cat.label} · ${gameState.mode==='presencial'?'🏠':'📱'} ${gameState.mode}</div>
      <div style="font-size:16px;font-weight:500;line-height:1.6">${gameState.currentChallenge}</div>
      <button class="btn btn-outline btn-full" style="margin-top:16px" onclick="getChallenge()">🔄 Siguiente reto</button>
    </div>`;
  }
  html+=`<div class="section-hd" style="margin-top:16px"><div class="section-title">Historial de partidas</div></div>
  <div id="game-hist"><div class="loading"><div class="spinner"></div></div></div>`;
  document.getElementById('content').innerHTML=html;
  loadGameHistory();
}

function setGameMode(mode){gameState.mode=mode;gameState.currentChallenge=null;showTab('game');}
function setGameCategory(cat){gameState.category=cat;gameState.currentChallenge=null;showTab('game');}

function getChallenge(){
  const cat=gameState.category, mode=gameState.mode;
  const challenges=GAME_CHALLENGES[cat][mode];
  const used=gameState.usedChallenges[cat]||[];
  let avail=challenges.reduce((acc,_,i)=>{if(!used.includes(i))acc.push(i);return acc;},[]);
  if(avail.length===0){gameState.usedChallenges[cat]=[];avail=challenges.map((_,i)=>i);}
  const pick=avail[Math.floor(Math.random()*avail.length)];
  gameState.currentChallenge=challenges[pick];
  gameState.usedChallenges[cat].push(pick);
  const order=['suave','moderado','hot'];
  const idx=order.indexOf(cat);
  const total=Object.values(gameState.usedChallenges).flat().length;
  if(total>0&&total%5===0&&idx<order.length-1){gameState.category=order[idx+1];showToast(`🔥 Subiendo a: ${GAME_CHALLENGES[gameState.category].label}`);}
  saveGameSession();
  showTab('game');
}

async function saveGameSession(){
  if(!currentUserData?.groupId)return;
  try{
    const gid=currentUserData.groupId;
    if(!gameState.sessionId){const ref=db.collection('groups').doc(gid).collection('gameSessions').doc();gameState.sessionId=ref.id;}
    await db.collection('groups').doc(gid).collection('gameSessions').doc(gameState.sessionId).set({
      id:gameState.sessionId,startedBy:currentUserData.name,
      category:gameState.category,mode:gameState.mode,
      totalChallenges:Object.values(gameState.usedChallenges).flat().length,
      date:new Date().toLocaleDateString('es'),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
  }catch(e){}
}

async function loadGameHistory(){
  if(!currentUserData?.groupId)return;
  const container=document.getElementById('game-hist');
  if(!container)return;
  try{
    const snap=await db.collection('groups').doc(currentUserData.groupId).collection('gameSessions').limit(8).get();
    if(snap.empty){container.innerHTML='<div class="empty-state" style="padding:16px"><div class="empty-state-desc">Sin partidas aún. ¡Juega la primera!</div></div>';return;}
    container.innerHTML=snap.docs.map(d=>{
      const s=d.data(),cat=GAME_CHALLENGES[s.category];
      return `<div class="hist-item">
        <div class="hist-icon add">${cat?.icon||'🎮'}</div>
        <div style="flex:1"><div class="hist-name">${s.startedBy} · ${cat?.label||s.category}</div>
        <div class="hist-date">${s.mode==='presencial'?'🏠':'📱'} ${s.mode} · ${s.totalChallenges} retos · ${s.date}</div></div>
      </div>`;
    }).join('');
  }catch(e){container.innerHTML='<div class="empty-state" style="padding:16px"></div>';}
}

// ===== HISTORIAL =====
// Historial recibe 'from' para saber a dónde volver
let historialFrom = 'perfil';

async function renderHistorial(from){
  if (from) historialFrom = from;
  if(!currentUserData?.groupId){document.getElementById('content').innerHTML='<div class="empty-state"><div class="empty-state-icon">📊</div></div>';return;}
  const gid=currentUserData.groupId, uid=currentUser.uid;
  document.getElementById('content').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  try{
    // Traer historial aprobado + todas las solicitudes
    const [histSnap, reqsSnap] = await Promise.all([
      db.collection('groups').doc(gid).collection('history').limit(80).get(),
      db.collection('groups').doc(gid).collection('requests')
        .where('requestedBy','==',uid).get(),
    ]);

    // También solicitudes donde soy aprobador
    const reqsForMeSnap = await db.collection('groups').doc(gid).collection('requests')
      .where('toUsers','array-contains',uid).get();

    const history = histSnap.docs.map(d=>d.data())
      .filter(h=>h.fromUser===uid||h.toUsers?.includes(uid))
      .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));

    const myReqs = reqsSnap.docs.map(d=>({id:d.id,...d.data()}))
      .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));

    const forMeReqs = reqsForMeSnap.docs.map(d=>({id:d.id,...d.data()}))
      .filter(r=>r.requestedBy!==uid && (r.status==='pending'))
      .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));

    const statusColors = {
      pending:  {bg:'rgba(245,166,35,0.12)', color:'var(--amber)',   label:'⏳ Pendiente'},
      approved: {bg:'rgba(78,203,160,0.12)',  color:'var(--teal)',    label:'✓ Aprobada'},
      rejected: {bg:'rgba(232,96,138,0.12)', color:'var(--rose)',    label:'✕ Rechazada'},
      fulfilled:{bg:'rgba(155,127,232,0.12)',color:'var(--purple)', label:'⭐ Cumplida'},
      cancelled:{bg:'rgba(90,88,117,0.12)',  color:'var(--text3)',   label:'— Retirada'},
    };

    let html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
      <button class="btn btn-outline btn-sm" onclick="showTab('${historialFrom}')">← Volver</button>
      <div style="font-size:16px;font-weight:500">Historial completo</div>
    </div>`;

    // POR APROBAR (de otros hacia mí)
    if (forMeReqs.length > 0) {
      html += `<div class="section-hd"><div class="section-title" style="color:var(--amber)">🔔 Por aprobar (${forMeReqs.length})</div></div>`;
      forMeReqs.forEach(r => {
        const typeIcon = r.type==='action' ? '⚡' : '🔥';
        html += `<div class="card" style="cursor:pointer;border-color:rgba(245,166,35,0.25)" onclick="showRequestDetail('${r.id}',true)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:22px">${typeIcon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.fantasyName}</div>
              <div style="font-size:11px;color:var(--text2);margin-top:2px">${r.requestedByName} · +${r.pts} pts · ${r.date||''}</div>
            </div>
            <span style="font-size:11px;padding:4px 10px;border-radius:20px;background:rgba(245,166,35,0.12);color:var(--amber);font-weight:600;white-space:nowrap">⏳ Aprobar</span>
          </div>
        </div>`;
      });
    }

    // MIS SOLICITUDES (acciones y deseos)
    if (myReqs.length > 0) {
      html += `<div class="section-hd" style="margin-top:8px"><div class="section-title">Mis solicitudes</div></div>`;

      // Separar por tipo
      const myActions = myReqs.filter(r=>r.type==='action');
      const myDeseos = myReqs.filter(r=>r.type==='fantasy');

      if (myActions.length > 0) {
        html += `<div style="font-size:11px;font-weight:600;color:var(--teal);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;margin-top:4px">⚡ Acciones enviadas</div>`;
        myActions.forEach(r => {
          const st = statusColors[r.status] || statusColors.pending;
          html += `<div class="card" style="cursor:pointer;margin-bottom:6px;border-left:3px solid ${st.color}" onclick="showRequestDetail('${r.id}',false)">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.fantasyName}</div>
                <div style="font-size:11px;color:var(--text2);margin-top:2px">+${r.pts} pts · ${r.date||''}</div>
                ${r.comment?`<div style="font-size:11px;color:var(--text3);margin-top:1px">"${r.comment}"</div>`:''}
                ${r.reason?`<div style="font-size:11px;color:var(--rose);margin-top:2px">Motivo: "${r.reason}"</div>`:''}
              </div>
              <span style="font-size:10px;padding:3px 8px;border-radius:20px;background:${st.bg};color:${st.color};font-weight:600;margin-left:8px;flex-shrink:0">${st.label}</span>
            </div>
          </div>`;
        });
      }

      if (myDeseos.length > 0) {
        html += `<div style="font-size:11px;font-weight:600;color:var(--rose);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;margin-top:10px">🔥 Deseos solicitados</div>`;
        myDeseos.forEach(r => {
          const st = statusColors[r.status] || statusColors.pending;
          html += `<div class="card" style="cursor:pointer;margin-bottom:6px;border-left:3px solid ${st.color}" onclick="showMyRequestDetail('${r.id}')">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.fantasyName}</div>
                <div style="font-size:11px;color:var(--text2);margin-top:2px">${r.pts} pts · ${r.date||''}</div>
                ${r.tentativeDate?`<div style="font-size:11px;color:var(--purple);margin-top:1px">📅 ${new Date(r.tentativeDate+'T12:00:00').toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'})}</div>`:''}
                ${r.place?`<div style="font-size:11px;color:var(--text3);margin-top:1px">📍 ${r.place}</div>`:''}
                ${(r.refPhotoUrls&&r.refPhotoUrls.length>0)?`<div style="font-size:11px;color:var(--text3);margin-top:1px">📷 ${r.refPhotoUrls.length} foto(s)</div>`:''}
              </div>
              <span style="font-size:10px;padding:3px 8px;border-radius:20px;background:${st.bg};color:${st.color};font-weight:600;margin-left:8px;flex-shrink:0">${st.label}</span>
            </div>
          </div>`;
        });
      }
    }

    // HISTORIAL APROBADO (puntos ganados/gastados)
    if (history.length > 0) {
      html += `<div class="section-hd" style="margin-top:8px"><div class="section-title">Puntos ganados y usados</div></div>`;
      history.forEach(h => {
        const isMe = h.fromUser===uid;
        html += `<div class="hist-item">
          <div class="hist-icon ${h.type}">${h.type==='add'?'⬆':'⬇'}</div>
          <div style="flex:1;min-width:0">
            <div class="hist-name">${h.action}</div>
            <div class="hist-date">${isMe?'Tú':(h.fromUserName||'')} · ${h.date||''}${h.comment?' · "'+h.comment+'"':''}</div>
            ${h.evidenceUrl?`<img src="${h.evidenceUrl}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;margin-top:4px;cursor:pointer" onclick="viewEvidence('${h.evidenceUrl}')">`:''}</div>
          <div class="hist-pts ${h.type}">${h.type==='add'?'+':'-'}${h.pts}</div>
        </div>`;
      });
    }

    if (!forMeReqs.length && !myReqs.length && !history.length) {
      html += `<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-desc">Sin actividad aún. ¡Empieza registrando una acción!</div></div>`;
    }

    document.getElementById('content').innerHTML = html;
  } catch(e) {
    console.error(e);
    document.getElementById('content').innerHTML='<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error cargando</div></div>';
  }
}

// ===== CONFIG (solo admin) =====
async function renderConfig(){
  // Todos los miembros pueden configurar
  const gid=currentUserData.groupId;
  try{
    const [membersSnap,groupSnap]=await Promise.all([
      db.collection('users').where('groupId','==',gid).get(),
      db.collection('groups').doc(gid).get()
    ]);
    const members=membersSnap.docs.map(d=>d.data());
    const group=groupSnap.data();
    let html=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
      <button class="btn btn-outline btn-sm" onclick="showTab('perfil')">← Volver</button>
      <div style="font-size:16px;font-weight:500">Configuración</div>
    </div>`;

    html+=`<div class="section-hd"><div class="section-title">Usuarios del grupo</div><button class="btn btn-primary btn-sm" onclick="showInviteModal()">+ Invitar</button></div>`;
    members.forEach(m=>{
      html+=`<div class="card">
        <div class="user-item" style="border:none;padding:0">
          <div class="user-avatar-lg" style="background:${m.color}22;color:${m.color}">${m.initials}</div>
          <div style="flex:1"><div class="user-name-text">${m.name}</div>
          <div class="user-meta">${m.email} · ${m.gender}</div>
          <div style="margin-top:4px;display:flex;gap:4px">
            <span class="role-badge ${m.role==='admin'?'role-admin':'role-viewer'}">${m.role==='admin'?'👑 Admin':'👁 Viewer'}</span>
            ${!m.active?'<span class="role-badge role-disabled">🚫</span>':''}
          </div></div>
          ${m.id!==currentUser.uid?`<div style="display:flex;flex-direction:column;gap:4px">
            <select class="form-control" style="padding:4px 8px;font-size:11px" onchange="changeRole('${m.id}',this.value)">
              <option value="admin" ${m.role==='admin'?'selected':''}>👑 Admin</option>
              <option value="viewer" ${m.role==='viewer'?'selected':''}>👁 Viewer</option>
            </select>
            <button class="btn btn-sm ${m.active?'btn-danger':'btn-teal'}" onclick="toggleMember('${m.id}',${m.active})">${m.active?'🚫':'✓'}</button>
          </div>`:'<span style="font-size:11px;color:var(--text2)">Tú</span>'}
        </div>
      </div>`;
    });

    html+=`<div class="section-hd" style="margin-top:8px"><div class="section-title">Ajustar puntos</div></div>
    <div class="card">
      <div class="form-group"><label class="form-label">Usuario</label><select class="form-control" id="adj-u">`;
    members.filter(m=>m.active).forEach(m=>{html+=`<option value="${m.id}">${m.name}</option>`;});
    html+=`</select></div>
      <div class="form-group"><label class="form-label">Puntos (+ suma / - resta)</label><input type="number" class="form-control" id="adj-p" placeholder="Ej: 20 o -10"></div>
      <div class="form-group"><label class="form-label">Motivo</label><input type="text" class="form-control" id="adj-r" placeholder="Ej: Cumpleaños"></div>
      <button class="btn btn-primary btn-full" onclick="adjustPts()">Aplicar</button>
    </div>`;

    html+=`<div class="section-hd" style="margin-top:8px"><div class="section-title">Fechas especiales</div></div>`;
    (group.specialDates||DEFAULT_SPECIAL_DATES).forEach(d=>{
      html+=`<div class="special-date-card">
        <div><div style="font-size:13px;font-weight:500">${d.icon} ${d.name}</div><div style="font-size:11px;color:var(--text2)">${d.date} · +${d.pts} pts</div></div>
        <button class="btn btn-sm btn-primary" onclick="applyDate('${d.name}',${d.pts})">Aplicar</button>
      </div>`;
    });

    html+=`<div class="section-hd" style="margin-top:16px"><div class="section-title">Catálogo</div></div>
    <div class="card" style="margin-bottom:8px">
      <div style="font-size:13px;font-weight:500;margin-bottom:4px">Actualizar catálogo oficial</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:12px;line-height:1.5">Sincroniza los deseos y acciones con la versión más reciente. Tus deseos y acciones personalizados se conservan.</div>
      <button class="btn btn-primary btn-full" onclick="resetCatalog()">🔄 Actualizar catálogo oficial</button>
    </div>
    <div class="section-hd" style="margin-top:8px"><div class="section-title">Interno</div></div>
    <button class="btn btn-outline btn-full" style="margin-bottom:8px" onclick="showTab('minutas')">📝 Minutas de desarrollo</button>`;

    document.getElementById('content').innerHTML=html;
  }catch(e){document.getElementById('content').innerHTML='<div class="empty-state"><div class="empty-state-icon">⚠️</div></div>';}
}

async function changeRole(uid,role){try{await db.collection('users').doc(uid).update({role});showToast('Rol actualizado');}catch(e){showToast('Error');}}
async function toggleMember(uid,active){try{await db.collection('users').doc(uid).update({active:!active});showToast(active?'Desactivado':'Activado');showTab('config');}catch(e){showToast('Error');}}

async function adjustPts(){
  const uid=document.getElementById('adj-u')?.value;
  const pts=parseInt(document.getElementById('adj-p')?.value||'0');
  const reason=document.getElementById('adj-r')?.value||'Ajuste manual';
  if(!uid||isNaN(pts)||pts===0){showToast('Completa todos los campos');return;}
  const gid=currentUserData.groupId;
  try{
    const groupSnap=await db.collection('groups').doc(gid).get();
    const pairPoints=groupSnap.data().pairPoints||{};
    const membersSnap=await db.collection('users').where('groupId','==',gid).where('active','==',true).get();
    membersSnap.docs.forEach(d=>{
      const m=d.data();
      if(m.id!==uid){const pk=[uid,m.id].sort().join('_');if(!pairPoints[pk])pairPoints[pk]={};pairPoints[pk][uid]=Math.max(0,(pairPoints[pk][uid]||0)+pts);}
    });
    await db.collection('groups').doc(gid).update({pairPoints});
    await db.collection('groups').doc(gid).collection('history').add({
      fromUser:currentUser.uid,fromUserName:currentUserData.name,toUsers:[uid],
      action:reason,pts:Math.abs(pts),type:pts>0?'add':'sub',
      date:new Date().toLocaleDateString('es'),createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast(`${pts>0?'+':''}${pts} pts aplicados`);showTab('config');
  }catch(e){showToast('Error: '+e.message);}
}

async function applyDate(name,pts){
  if(!confirm(`Aplicar +${pts} pts a todos por: ${name}?`))return;
  const gid=currentUserData.groupId;
  try{
    const groupSnap=await db.collection('groups').doc(gid).get();
    const pairPoints=groupSnap.data().pairPoints||{};
    const membersSnap=await db.collection('users').where('groupId','==',gid).where('active','==',true).get();
    const members=membersSnap.docs.map(d=>d.data());
    members.forEach(m=>{members.forEach(n=>{if(m.id!==n.id){const pk=[m.id,n.id].sort().join('_');if(!pairPoints[pk])pairPoints[pk]={};pairPoints[pk][m.id]=(pairPoints[pk][m.id]||0)+pts;}});});
    await db.collection('groups').doc(gid).update({pairPoints});
    showToast(`✓ +${pts} pts a todos`);showTab('config');
  }catch(e){showToast('Error');}
}

async function addFantasy(){
  const icon=document.getElementById('nf-icon')?.value||'🔥';
  const name=document.getElementById('nf-name')?.value?.trim();
  const desc=document.getElementById('nf-desc')?.value?.trim()||'';
  const pts=parseInt(document.getElementById('nf-pts')?.value||'0');
  const level=document.getElementById('nf-level')?.value;
  const isPareja=document.getElementById('nf-cat-pareja')?.checked;
  const isGrupo=document.getElementById('nf-cat-grupo')?.checked;
  const category = isPareja && isGrupo ? 'ambos' : isGrupo ? 'grupo' : 'pareja';
  if(!name||isNaN(pts)){showToast('Completa nombre y puntos');return;}
  const gid=currentUserData.groupId;
  try{
    await db.collection('groups').doc(gid).update({fantasies:firebase.firestore.FieldValue.arrayUnion({id:'f_'+Date.now(),name,pts,level,icon,desc,category})});
    showToast('✓ Deseo agregado');showTab('config');
  }catch(e){showToast('Error');}
}

// ===== MINUTAS =====

function renderMinutas(){
  let html=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
    <button class="btn btn-outline btn-sm" onclick="showTab('perfil')">← Volver</button>
    <div><div style="font-size:16px;font-weight:500">Novedades de Ignite</div></div>
  </div>`;
  SESSION_LOG.slice().reverse().forEach(s=>{
    html+=`<div class="card" style="margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="font-size:11px;color:var(--rose);font-weight:600;background:var(--rose-glow);padding:4px 10px;border-radius:20px">${s.date}</div>
        <div style="font-size:13px;font-weight:500">${s.title}</div>
      </div>
      ${s.items.map(i=>`<div style="font-size:12px;color:var(--text2);display:flex;gap:6px;margin-bottom:3px"><span style="color:var(--teal)">✓</span>${i}</div>`).join('')}
    </div>`;
  });
  html+=`<div class="card" style="border-style:dashed;text-align:center;padding:20px">
    <div style="font-size:20px;margin-bottom:6px">🚀</div>
    <div style="font-size:12px;color:var(--text2)">Próximamente: Notificaciones push · Estadísticas de pareja · Modo oscuro/claro</div>
  </div>`;
  document.getElementById('content').innerHTML=html;
}

// ===== FILE UPLOAD =====
function triggerUpload(context){uploadContext=context;document.getElementById('file-upload').click();}
function handleFileUpload(event){
  const file=event.target.files[0];
  if(!file)return;
  if(file.size>15*1024*1024){showToast('Foto demasiado grande (máx 15MB)');return;}
  showToast('Procesando foto...');
  compressImage(file, 1200, 0.75).then(base64 => {
    if (window._uploadingRefPhoto) {
      // Es una foto de referencia para el modal de fantasía
      window._uploadingRefPhoto = false;
      if (!window._refPhotos) window._refPhotos = [];
      if (window._refPhotos.length >= 3) { showToast('Máximo 3 fotos de referencia'); return; }
      window._refPhotos.push(base64);
      updateRefPhotosPreview();
    } else {
      // Es evidencia de acción
      pendingEvidenceBase64 = base64;
      const preview=document.getElementById('evidence-preview-new');
      if(preview)preview.innerHTML=`<img src="${base64}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-top:8px">
        <button class="btn btn-danger btn-sm" style="margin-top:4px" onclick="clearEvidence()">✕ Quitar foto</button>`;
    }
  }).catch(() => showToast('Error procesando la foto'));
  event.target.value='';
}

function updateRefPhotosPreview() {
  const preview = document.getElementById('ref-photos-preview');
  const btn = document.getElementById('ref-photo-btn');
  if (!preview) return;
  preview.innerHTML = (window._refPhotos||[]).map((b64, i) => 
    `<div style="position:relative">
      <img src="${b64}" style="width:80px;height:80px;object-fit:cover;border-radius:8px">
      <button onclick="removeRefPhoto(${i})" style="position:absolute;top:-6px;right:-6px;background:var(--rose);border:none;border-radius:50%;width:20px;height:20px;color:white;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
    </div>`
  ).join('');
  if (btn) btn.style.display = (window._refPhotos||[]).length >= 3 ? 'none' : 'flex';
}

function removeRefPhoto(idx) {
  if (window._refPhotos) window._refPhotos.splice(idx, 1);
  updateRefPhotosPreview();
}

// Comprime imagen a máximo maxWidth px y calidad quality (0-1)
// Resultado: base64 JPEG de ~0.5-1.5 MB
function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function clearEvidence(){pendingEvidenceBase64=null;const p=document.getElementById('evidence-preview-new');if(p)p.innerHTML='';}
async function uploadEvidence(base64,path){
  try{const ref=storage.ref(path);await ref.putString(base64,'data_url');return await ref.getDownloadURL();}
  catch(e){console.error(e);return null;}
}
function viewEvidence(url){
  document.getElementById('modal-container').innerHTML=`<div class="modal-overlay" onclick="closeModalDirect()">
    <div style="padding:20px;max-width:420px;width:100%;display:flex;align-items:center;justify-content:center;min-height:60vh">
      <img src="${url}" style="width:100%;border-radius:12px;max-height:75vh;object-fit:contain">
    </div>
  </div>`;
}

// ===== NOTIFICATIONS =====
async function showNotifs(){
  if(!currentUserData?.groupId)return;
  const gid=currentUserData.groupId,uid=currentUser.uid;
  try{
    const snap=await db.collection('groups').doc(gid).collection('notifications')
      .where('toUserId','==',uid).limit(20).get();
    snap.docs.forEach(d=>{if(!d.data().read)db.collection('groups').doc(gid).collection('notifications').doc(d.id).update({read:true}).catch(()=>{});});
    const notifs=snap.docs.map(d=>({id:d.id,...d.data()}));
    let html=`<div class="modal-overlay" onclick="closeModal(event)"><div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-title">🔔 Notificaciones</div>`;
    if(notifs.length===0){html+=`<div class="empty-state"><div class="empty-state-icon">🔕</div><div class="empty-state-desc">Sin notificaciones</div></div>`;}
    else{notifs.forEach(n=>{html+=`<div style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:13px">${n.text}</div>
      <div style="font-size:11px;color:var(--text2);margin-top:3px">${n.date||''}</div>
    </div>`;});}
    html+=`</div></div>`;
    document.getElementById('modal-container').innerHTML=html;
    const dot=document.getElementById('notif-dot');if(dot)dot.style.display='none';
  }catch(e){showToast('Error cargando notificaciones');}
}

// ===== MODAL & TOAST =====
function closeModal(e){if(e.target.classList.contains('modal-overlay'))closeModalDirect();}
function closeModalDirect(){document.getElementById('modal-container').innerHTML='';}
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

// ===== MANTENEDORES =====
// Integrado en perfil - se despliegan opciones inline
function toggleMantPanel() {
  const panel = document.getElementById('mant-panel');
  const arrow = document.getElementById('mant-arrow');
  if (!panel) return;
  const open = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  if (arrow) arrow.textContent = open ? '⌄' : '›';
}
function toggleMantenedores() { toggleMantPanel(); }

function renderMantenedores() {
  document.getElementById('content').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
      <button class="btn btn-outline btn-sm" onclick="showTab('perfil')">← Volver</button>
      <div style="font-size:16px;font-weight:500">🗂️ Mantenedores</div>
    </div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:16px">Gestiona el catálogo de tu grupo.</div>
    <div class="card" onclick="showTab('mant-deseos')" style="cursor:pointer;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:14px;padding:4px 0">
        <div style="width:48px;height:48px;border-radius:14px;background:var(--rose-glow);display:flex;align-items:center;justify-content:center;font-size:24px">🔥</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:500">Mantenedor de Deseos</div>
          <div style="font-size:12px;color:var(--text2);margin-top:2px">Ver, agregar y eliminar deseos del catálogo</div>
        </div>
        <div style="color:var(--text3);font-size:20px">›</div>
      </div>
    </div>
    <div class="card" onclick="showTab('mant-acciones')" style="cursor:pointer">
      <div style="display:flex;align-items:center;gap:14px;padding:4px 0">
        <div style="width:48px;height:48px;border-radius:14px;background:var(--teal-glow);display:flex;align-items:center;justify-content:center;font-size:24px">⚡</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:500">Mantenedor de Acciones</div>
          <div style="font-size:12px;color:var(--text2);margin-top:2px">Ver, agregar y eliminar acciones del grupo</div>
        </div>
        <div style="color:var(--text3);font-size:20px">›</div>
      </div>
    </div>`;
}

// ===== MANTENEDOR DESEOS =====
async function renderMantDeseos() {
  const gid = currentUserData.groupId;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const groupFantasies = groupSnap.data().fantasies || DEFAULT_FANTASIES;
    // Usar DEFAULT como base + custom del usuario encima
    const customF = groupFantasies.filter(f => !f.id.match(/^(fb|fm|ff)\d+$/));
    const fantasies = [...DEFAULT_FANTASIES, ...customF];
    const levels = {basic:'🟢 Básico', medium:'🟡 Medio', high:'🔴 Alto'};
    const cats = {pareja:'💑 Pareja', grupo:'👥 Grupo', ambos:'💑👥 Ambos'};

    let html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
      <button class="btn btn-outline btn-sm" onclick="showTab('mantenedores')">← Volver</button>
      <div style="font-size:16px;font-weight:500">🔥 Deseos (${fantasies.length})</div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:600;margin-bottom:12px">➕ Agregar nuevo deseo</div>
      <div class="form-group"><label class="form-label">Emoji</label>
        <input type="text" class="form-control" id="nf-icon" placeholder="🔥" maxlength="2"></div>
      <div class="form-group"><label class="form-label">Nombre</label>
        <input type="text" class="form-control" id="nf-name" placeholder="Nombre del deseo"></div>
      <div class="form-group"><label class="form-label">Descripción</label>
        <textarea class="form-control" id="nf-desc" rows="2" placeholder="Descripción breve"></textarea></div>
      <div class="form-group"><label class="form-label">Puntos requeridos</label>
        <input type="number" class="form-control" id="nf-pts" placeholder="Ej: 15"></div>
      <div class="form-group"><label class="form-label">Nivel</label>
        <select class="form-control" id="nf-level">
          <option value="basic">🟢 Básico (8-20 pts)</option>
          <option value="medium">🟡 Medio (25-40 pts)</option>
          <option value="high">🔴 Alto (45-65 pts)</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">¿Para quién aplica?</label>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
            <input type="checkbox" id="nf-cat-pareja" checked style="width:16px;height:16px;accent-color:var(--rose)"> 💑 En pareja
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
            <input type="checkbox" id="nf-cat-grupo" style="width:16px;height:16px;accent-color:var(--rose)"> 👥 Con terceros / grupo
          </label>
        </div>
      </div>
      <button class="btn btn-primary btn-full" onclick="addFantasyMant()">+ Agregar deseo</button>
    </div>
    <div class="section-hd"><div class="section-title">Catálogo actual (${fantasies.length})</div></div>`;

    fantasies.forEach(f => {
      html += `<div class="card" style="margin-bottom:8px" id="fc-${f.id}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <div style="font-size:26px">${f.icon||'🔥'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</div>
            <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">
              <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--bg4);color:var(--text2)">${levels[f.level]||f.level}</span>
              <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--bg4);color:var(--text2)">${cats[f.category]||'💑 Pareja'}</span>
              <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--rose-glow);color:var(--rose)">${f.pts} pts</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <button class="btn btn-outline btn-sm" onclick="editFantasyMant('${f.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteFantasyMant('${f.id}')">🗑</button>
          </div>
        </div>
        ${f.desc?`<div style="font-size:12px;color:var(--text2)">${f.desc}</div>`:''}
      </div>`;
    });

    document.getElementById('content').innerHTML = html;
  } catch(e) {
    document.getElementById('content').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error cargando deseos</div></div>';
  }
}

function editFantasyMant(fid) {
  // Buscar la fantasía actual
  const card = document.getElementById('fc-'+fid);
  if (!card) return;
  // Hacer scroll al formulario y precargar datos
  const groupPromise = db.collection('groups').doc(currentUserData.groupId).get();
  groupPromise.then(groupSnap => {
    const f = (groupSnap.data().fantasies||DEFAULT_FANTASIES).find(x=>x.id===fid);
    if (!f) return;
    document.getElementById('nf-icon').value = f.icon||'';
    document.getElementById('nf-name').value = f.name||'';
    document.getElementById('nf-desc').value = f.desc||'';
    document.getElementById('nf-pts').value = f.pts||'';
    document.getElementById('nf-level').value = f.level||'basic';
    document.getElementById('nf-cat-pareja').checked = f.category==='pareja'||f.category==='ambos'||!f.category;
    document.getElementById('nf-cat-grupo').checked = f.category==='grupo'||f.category==='ambos';
    // Cambiar botón a "Guardar cambios"
    const btn = document.querySelector('#nf-icon')?.closest('.card')?.querySelector('.btn-primary');
    if (btn) {
      btn.textContent = '💾 Guardar cambios';
      btn.onclick = () => saveFantasyEdit(fid);
    }
    window.scrollTo({top:0, behavior:'smooth'});
    showToast('Editando: '+f.name);
  });
}

async function saveFantasyEdit(fid) {
  const icon = document.getElementById('nf-icon')?.value||'🔥';
  const name = document.getElementById('nf-name')?.value?.trim();
  const desc = document.getElementById('nf-desc')?.value?.trim()||'';
  const pts = parseInt(document.getElementById('nf-pts')?.value||'0');
  const level = document.getElementById('nf-level')?.value;
  const isPareja = document.getElementById('nf-cat-pareja')?.checked;
  const isGrupo = document.getElementById('nf-cat-grupo')?.checked;
  const category = isPareja && isGrupo ? 'ambos' : isGrupo ? 'grupo' : 'pareja';
  if (!name||isNaN(pts)||pts===0) { showToast('Completa nombre y puntos'); return; }
  const gid = currentUserData.groupId;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const fantasies = (groupSnap.data().fantasies||[]).map(f =>
      f.id===fid ? {...f, icon, name, desc, pts, level, category} : f
    );
    await db.collection('groups').doc(gid).update({ fantasies });
    showToast('✓ Deseo actualizado');
    showTab('mant-deseos');
  } catch(e) { showToast('Error: '+e.message); }
}

async function addFantasyMant() {
  const icon = document.getElementById('nf-icon')?.value||'🔥';
  const name = document.getElementById('nf-name')?.value?.trim();
  const desc = document.getElementById('nf-desc')?.value?.trim()||'';
  const pts = parseInt(document.getElementById('nf-pts')?.value||'0');
  const level = document.getElementById('nf-level')?.value;
  const isPareja = document.getElementById('nf-cat-pareja')?.checked;
  const isGrupo = document.getElementById('nf-cat-grupo')?.checked;
  const category = isPareja && isGrupo ? 'ambos' : isGrupo ? 'grupo' : 'pareja';
  if (!name||isNaN(pts)||pts===0) { showToast('Completa nombre y puntos'); return; }
  const gid = currentUserData.groupId;
  try {
    await db.collection('groups').doc(gid).update({
      fantasies: firebase.firestore.FieldValue.arrayUnion({id:'f_'+Date.now(), name, pts, level, icon, desc, category})
    });
    // Notificar a otros miembros
    await notifyGroupMembers(gid, `📋 ${currentUserData.name} agregó un nuevo deseo al catálogo: "${name}"`);
    showToast('✓ Deseo agregado');
    showTab('mant-deseos');
  } catch(e) { showToast('Error: '+e.message); }
}

async function deleteFantasyMant(fid) {
  if (!confirm('¿Eliminar este deseo del catálogo?')) return;
  const gid = currentUserData.groupId;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const fantasies = (groupSnap.data().fantasies||[]).filter(f=>f.id!==fid);
    await db.collection('groups').doc(gid).update({ fantasies });
    showToast('✓ Deseo eliminado');
    showTab('mant-deseos');
  } catch(e) { showToast('Error: '+e.message); }
}

// ===== MANTENEDOR ACCIONES =====
async function renderMantAcciones() {
  const gid = currentUserData.groupId;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const group = groupSnap.data();
    const actHim = group.actions?.him || DEFAULT_ACTIONS_HIM;
    const actHer = group.actions?.her || DEFAULT_ACTIONS_HER;
    const actNeutral = group.actions?.neutral || (typeof DEFAULT_ACTIONS_NEUTRAL !== 'undefined' ? DEFAULT_ACTIONS_NEUTRAL : []);

    let html = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
      <button class="btn btn-outline btn-sm" onclick="showTab('mantenedores')">← Volver</button>
      <div style="font-size:16px;font-weight:500">⚡ Acciones</div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:600;margin-bottom:12px">➕ Agregar nueva acción</div>
      <div class="form-group"><label class="form-label">Emoji</label>
        <input type="text" class="form-control" id="na-icon" placeholder="⚡" maxlength="2"></div>
      <div class="form-group"><label class="form-label">Nombre</label>
        <input type="text" class="form-control" id="na-name" placeholder="Nombre de la acción"></div>
      <div class="form-group"><label class="form-label">Puntos que otorga</label>
        <input type="number" class="form-control" id="na-pts" placeholder="Ej: 5"></div>
      <div class="form-group"><label class="form-label">¿Para quién es esta acción?</label>
        <select class="form-control" id="na-type">
          <option value="neutral">🌐 Para todos (cualquier género)</option>
          <option value="him">👨 Para él</option>
          <option value="her">👩 Para ella</option>
        </select>
      </div>
      <button class="btn btn-primary btn-full" onclick="addActionMant()">+ Agregar acción</button>
    </div>`;

    const sections = [
      {label:'🌐 Para todos', actions: actNeutral, type:'neutral'},
      {label:'👨 Para él', actions: actHim, type:'him'},
      {label:'👩 Para ella', actions: actHer, type:'her'},
    ];

    sections.forEach(sec => {
      html += `<div class="section-hd"><div class="section-title">${sec.label} (${sec.actions.length})</div></div>`;
      sec.actions.forEach(a => {
        html += `<div class="card" style="margin-bottom:6px" id="ac-${a.id}-${sec.type}">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:22px">${a.icon||'⚡'}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:500">${a.name}</div>
              <div style="font-size:11px;color:var(--teal);margin-top:2px">+${a.pts} pts</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <button class="btn btn-outline btn-sm" onclick="editActionMant('${a.id}','${sec.type}','${a.name}','${a.pts}','${a.icon||'⚡'}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="deleteActionMant('${a.id}','${sec.type}')">🗑</button>
            </div>
          </div>
        </div>`;
      });
    });

    document.getElementById('content').innerHTML = html;
  } catch(e) {
    document.getElementById('content').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error cargando acciones</div></div>';
  }
}

function editActionMant(aid, type, name, pts, icon) {
  // Precargar formulario con datos de la acción
  document.getElementById('na-icon').value = icon||'⚡';
  document.getElementById('na-name').value = name||'';
  document.getElementById('na-pts').value = pts||'';
  document.getElementById('na-type').value = type||'neutral';
  // Cambiar botón
  const btn = document.querySelector('#na-icon')?.closest('.card')?.querySelector('.btn-primary');
  if (btn) {
    btn.textContent = '💾 Guardar cambios';
    btn.onclick = () => saveActionEdit(aid, type);
  }
  window.scrollTo({top:0, behavior:'smooth'});
  showToast('Editando: '+name);
}

async function saveActionEdit(aid, type) {
  const icon = document.getElementById('na-icon')?.value||'⚡';
  const name = document.getElementById('na-name')?.value?.trim();
  const pts = parseInt(document.getElementById('na-pts')?.value||'0');
  const newType = document.getElementById('na-type')?.value||type;
  if (!name||isNaN(pts)||pts===0) { showToast('Completa nombre y puntos'); return; }
  const gid = currentUserData.groupId;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const actions = groupSnap.data().actions || {};
    // Si cambió el tipo, mover de una lista a otra
    if (newType !== type && actions[type]) {
      actions[type] = actions[type].filter(a=>a.id!==aid);
    }
    if (!actions[newType]) actions[newType] = [];
    const existing = actions[newType].find(a=>a.id===aid);
    if (existing) {
      actions[newType] = actions[newType].map(a=>a.id===aid?{...a,icon,name,pts}:a);
    } else {
      actions[newType].push({id:aid, icon, name, pts});
    }
    await db.collection('groups').doc(gid).update({ actions });
    showToast('✓ Acción actualizada');
    showTab('mant-acciones');
  } catch(e) { showToast('Error: '+e.message); }
}

// ===== PREGUNTA DEL DÍA =====
async function submitDailyAnswer() {
  const answer = document.getElementById('daily-answer')?.value?.trim();
  if (!answer) { showToast('Escribe tu respuesta primero'); return; }
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const today = new Date().toISOString().split('T')[0];
  const question = getDailyQuestion();
  const btn = document.querySelector('#daily-answer-section .btn-purple');
  if (btn) { btn.disabled=true; btn.textContent='Enviando...'; }
  try {
    await db.collection('groups').doc(gid).collection('dailyAnswers').doc(`${today}_${uid}`).set({
      uid, name: currentUserData.name, date: today,
      question, answer,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Notificar a pareja
    await notifyGroupMembers(gid, `💬 ${currentUserData.name} respondió la pregunta del día`);
    showToast('✓ Respuesta enviada');
    // Mostrar confirmación en lugar del formulario
    const section = document.getElementById('daily-answer-section');
    if (section) section.innerHTML = `<div style="background:rgba(155,127,232,0.1);border-radius:10px;padding:10px;font-size:13px;color:var(--purple)">
      ✓ Respuesta enviada. Tu pareja la verá cuando también responda.
    </div>`;
  } catch(e) { showToast('Error: '+e.message); if (btn) { btn.disabled=false; btn.textContent='Enviar respuesta 💬'; } }
}

async function loadDailyAnswers(gid) {
  const today = new Date().toISOString().split('T')[0];
  const uid = currentUser.uid;
  try {
    // Verificar si ya respondí hoy
    const myAnswer = await db.collection('groups').doc(gid).collection('dailyAnswers').doc(`${today}_${uid}`).get();
    if (myAnswer.exists) {
      const section = document.getElementById('daily-answer-section');
      if (section) {
        // Ver si la pareja también respondió
        const allAnswers = await db.collection('groups').doc(gid).collection('dailyAnswers')
          .where('date','==',today).get();
        if (allAnswers.size >= 2) {
          // Ambos respondieron - mostrar las respuestas
          const answers = allAnswers.docs.map(d=>d.data());
          section.innerHTML = answers.map(a => `
            <div style="background:rgba(155,127,232,0.08);border-radius:10px;padding:10px;margin-bottom:6px">
              <div style="font-size:11px;color:var(--purple);font-weight:600;margin-bottom:4px">${a.name}</div>
              <div style="font-size:13px;color:var(--text2)">"${a.answer}"</div>
            </div>`).join('');
        } else {
          section.innerHTML = `<div style="background:rgba(155,127,232,0.08);border-radius:10px;padding:10px;font-size:13px;color:var(--text2)">
            ✓ Ya respondiste hoy. Esperando que tu pareja también responda para ver ambas respuestas. 👀
          </div>`;
        }
      }
    }
  } catch(e) {}
}

// ===== DETALLE DE MI PROPIA SOLICITUD =====
async function showMyRequestDetail(reqId) {
  const gid = currentUserData.groupId;
  try {
    const reqSnap = await db.collection('groups').doc(gid).collection('requests').doc(reqId).get();
    const r = reqSnap.data();
    if (!r) return;

    const statusMap = {
      pending:  {label:'⏳ Pendiente',  color:'var(--amber)'},
      approved: {label:'✓ Aprobada',   color:'var(--teal)'},
      rejected: {label:'✕ Rechazada',  color:'var(--rose)'},
      fulfilled:{label:'⭐ Cumplida',   color:'var(--purple)'},
    };
    const st = statusMap[r.status] || statusMap.pending;
    const isPending = r.status === 'pending';

    document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal">
        <div class="modal-handle"></div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="flex:1;min-width:0">
            <div style="font-size:17px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.fantasyName}</div>
            <div style="font-size:12px;color:var(--text2);margin-top:3px">🔥 Deseo · ${r.pts} pts · ${r.date||''}</div>
          </div>
          <span style="padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${st.color}22;color:${st.color};margin-left:8px;flex-shrink:0">${st.label}</span>
        </div>

        ${r.comment?`<div style="background:var(--bg3);border-radius:12px;padding:12px;margin-bottom:10px">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Tu nota</div>
          <div style="font-size:13px;color:var(--text2)">"${r.comment}"</div>
        </div>`:''}

        ${r.tentativeDate||r.place?`<div style="background:var(--bg3);border-radius:12px;padding:12px;margin-bottom:10px">
          ${r.tentativeDate?`<div style="display:flex;align-items:center;gap:8px;margin-bottom:${r.place?'8px':'0'}">
            <span>📅</span>
            <div><div style="font-size:10px;color:var(--text3)">FECHA TENTATIVA</div>
            <div style="font-size:13px;font-weight:500">${new Date(r.tentativeDate+'T12:00:00').toLocaleDateString('es',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div></div>
          </div>`:''}
          ${r.place?`<div style="display:flex;align-items:center;gap:8px">
            <span>📍</span>
            <div><div style="font-size:10px;color:var(--text3)">LUGAR</div>
            <div style="font-size:13px;font-weight:500">${r.place}</div></div>
          </div>`:''}
        </div>`:''}

        ${r.refPhotoUrls&&r.refPhotoUrls.length>0?`<div style="margin-bottom:10px">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Fotos de referencia</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${r.refPhotoUrls.map(url=>`<img src="${url}" style="width:calc(33% - 4px);aspect-ratio:1;object-fit:cover;border-radius:8px;cursor:pointer" onclick="viewEvidence('${url}')">`).join('')}
          </div>
        </div>`:''}

        ${r.approveComment?`<div style="background:rgba(78,203,160,0.1);border:1px solid rgba(78,203,160,0.2);border-radius:12px;padding:12px;margin-bottom:10px">
          <div style="font-size:10px;color:var(--teal);text-transform:uppercase;margin-bottom:4px">Comentario al aprobar</div>
          <div style="font-size:13px;color:var(--teal)">"${r.approveComment}"</div>
        </div>`:''}

        ${r.reason?`<div style="background:rgba(232,96,138,0.1);border:1px solid rgba(232,96,138,0.2);border-radius:12px;padding:12px;margin-bottom:10px">
          <div style="font-size:10px;color:var(--rose);text-transform:uppercase;margin-bottom:4px">Motivo del rechazo</div>
          <div style="font-size:13px;color:var(--rose)">"${r.reason}"</div>
          <div style="font-size:12px;color:var(--text3);margin-top:6px">💡 Puedes volver a solicitarlo mejorando la propuesta</div>
        </div>`:''}

        ${isPending?`
        <div style="font-size:12px;color:var(--text2);margin-bottom:12px;background:rgba(245,166,35,0.08);border-radius:10px;padding:10px">
          ⏳ Esperando que tu pareja la revise. Puedes editarla o retirarla.
        </div>
        <div class="row" style="gap:8px">
          <button class="btn btn-outline" style="flex:1" onclick="closeModalDirect();editMyRequest('${r.id}')">✏️ Editar</button>
          <button class="btn btn-danger" style="flex:1" onclick="cancelMyRequest('${r.id}',${r.pts})">✕ Retirar</button>
        </div>`:''}

        ${r.status==='approved'&&!r.fulfilled?`
        <button class="btn btn-teal btn-full" style="margin-top:8px" onclick="closeModalDirect();markFulfilled('${r.id}')">⭐ Marcar como cumplida</button>`:''}

        ${r.status==='rejected'?`
        <button class="btn btn-primary btn-full" style="margin-top:8px" onclick="closeModalDirect();showTab('deseos')">🔥 Volver al catálogo</button>`:''}

        <button class="btn btn-outline btn-full" style="margin-top:8px" onclick="closeModalDirect()">Cerrar</button>
      </div>
    </div>`;
  } catch(e) { showToast('Error cargando detalle'); }
}

// Cancelar/retirar una solicitud pendiente y devolver puntos
async function cancelMyRequest(reqId, pts) {
  if (!confirm('¿Retirar esta solicitud? Se te devolverán los puntos.')) return;
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  try {
    const reqSnap = await db.collection('groups').doc(gid).collection('requests').doc(reqId).get();
    const req = reqSnap.data();
    if (req.status !== 'pending') { showToast('Esta solicitud ya fue procesada'); return; }

    // Devolver puntos
    const groupSnap = await db.collection('groups').doc(gid).get();
    const pairPoints = groupSnap.data().pairPoints || {};
    const membersSnap = await db.collection('users').where('groupId','==',gid).where('active','==',true).get();
    const others = membersSnap.docs.map(d=>d.data()).filter(m=>m.id!==uid);
    if (others[0]) {
      const pk = [uid, others[0].id].sort().join('_');
      if (!pairPoints[pk]) pairPoints[pk] = {};
      pairPoints[pk][uid] = (pairPoints[pk][uid]||0) + pts;
      await db.collection('groups').doc(gid).update({ pairPoints });
    }

    await db.collection('groups').doc(gid).collection('requests').doc(reqId).update({
      status: 'cancelled', cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    closeModalDirect();
    showToast('✓ Solicitud retirada. Puntos devueltos.');
    showTab('deseos');
  } catch(e) { showToast('Error: '+e.message); }
}

// Editar solicitud pendiente - abre modal de edición
async function editMyRequest(reqId) {
  const gid = currentUserData.groupId;
  try {
    const reqSnap = await db.collection('groups').doc(gid).collection('requests').doc(reqId).get();
    const r = reqSnap.data();
    if (!r || r.status !== 'pending') { showToast('No se puede editar esta solicitud'); return; }
    window._refPhotos = r.refPhotoUrls ? [...r.refPhotoUrls.map(url=>url)] : [];
    window._editingReqId = reqId;

    document.getElementById('modal-container').innerHTML = `<div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal">
        <div class="modal-handle"></div>
        <div style="font-family:var(--font-display);font-size:20px;font-weight:500;margin-bottom:4px">✏️ Editar propuesta</div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:16px">${r.fantasyName}</div>

        <div class="form-group">
          <label class="form-label">Nota para tu pareja</label>
          <textarea class="form-control" id="edit-comment" rows="2">${r.comment||''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">📅 Fecha tentativa</label>
          <input type="date" class="form-control" id="edit-date" value="${r.tentativeDate||''}" min="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">📍 Lugar o contexto</label>
          <input type="text" class="form-control" id="edit-place" value="${r.place||''}" placeholder="Ej: Cabaña en Cajón del Maipo...">
        </div>
        <div class="form-group">
          <label class="form-label">📸 Fotos de referencia</label>
          <div id="ref-photos-preview" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            ${(r.refPhotoUrls||[]).map((url,i)=>`<div style="position:relative">
              <img src="${url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px">
              <button onclick="removeRefPhoto(${i})" style="position:absolute;top:-6px;right:-6px;background:var(--rose);border:none;border-radius:50%;width:20px;height:20px;color:white;font-size:11px;cursor:pointer">✕</button>
            </div>`).join('')}
          </div>
          <div id="ref-photo-btn" class="upload-btn" onclick="addRefPhoto()" style="${(r.refPhotoUrls||[]).length>=3?'display:none':''}">
            📷 Agregar foto
          </div>
        </div>

        <button class="btn btn-primary btn-full" onclick="saveMyRequestEdit('${reqId}')">💾 Guardar cambios</button>
        <button class="btn btn-outline btn-full" style="margin-top:8px" onclick="closeModalDirect()">Cancelar</button>
      </div>
    </div>`;
  } catch(e) { showToast('Error'); }
}

async function saveMyRequestEdit(reqId) {
  const comment = document.getElementById('edit-comment')?.value||'';
  const tentativeDate = document.getElementById('edit-date')?.value||'';
  const place = document.getElementById('edit-place')?.value?.trim()||'';
  const gid = currentUserData.groupId;
  const uid = currentUser.uid;
  const btn = document.querySelector('#modal-container .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='Guardando...'; }

  try {
    // Subir nuevas fotos (las que sean base64)
    const newPhotos = [];
    for (const photo of (window._refPhotos||[])) {
      if (photo.startsWith('data:')) {
        const url = await uploadEvidence(photo, `refphotos/${gid}/${uid}/${Date.now()}.jpg`);
        if (url) newPhotos.push(url);
      } else {
        newPhotos.push(photo); // Ya es URL de Firebase
      }
    }

    await db.collection('groups').doc(gid).collection('requests').doc(reqId).update({
      comment, tentativeDate, place, refPhotoUrls: newPhotos
    });

    window._refPhotos = [];
    closeModalDirect();
    showToast('✓ Propuesta actualizada');
    showTab('deseos');
  } catch(e) {
    showToast('Error: '+e.message);
    if (btn) { btn.disabled=false; btn.textContent='💾 Guardar cambios'; }
  }
}

async function notifyGroupMembers(gid, text) {
  try {
    const uid = currentUser.uid;
    const membersSnap = await db.collection('users').where('groupId','==',gid).where('active','==',true).get();
    const others = membersSnap.docs.map(d=>d.data()).filter(m=>m.id!==uid);
    for (const m of others) {
      await db.collection('groups').doc(gid).collection('notifications').add({
        toUserId: m.id, text, read: false,
        date: new Date().toLocaleDateString('es'),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch(e) {}
}

async function addActionMant() {
  const icon = document.getElementById('na-icon')?.value||'⚡';
  const name = document.getElementById('na-name')?.value?.trim();
  const pts = parseInt(document.getElementById('na-pts')?.value||'0');
  const type = document.getElementById('na-type')?.value||'neutral';
  if (!name||isNaN(pts)||pts===0) { showToast('Completa nombre y puntos'); return; }
  const gid = currentUserData.groupId;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const actions = groupSnap.data().actions || {};
    if (!actions[type]) actions[type] = [];
    actions[type].push({id:'a_'+Date.now(), name, pts, icon});
    await db.collection('groups').doc(gid).update({ actions });
    showToast('✓ Acción agregada');
    showTab('mant-acciones');
  } catch(e) { showToast('Error: '+e.message); }
}

async function deleteActionMant(aid, type) {
  if (!confirm('¿Eliminar esta acción?')) return;
  const gid = currentUserData.groupId;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const actions = groupSnap.data().actions || {};
    if (actions[type]) actions[type] = actions[type].filter(a=>a.id!==aid);
    await db.collection('groups').doc(gid).update({ actions });
    showToast('✓ Acción eliminada');
    showTab('mant-acciones');
  } catch(e) { showToast('Error: '+e.message); }
}

// ===== RESTABLECER CATÁLOGO =====
async function resetCatalog() {
  if (!confirm('¿Actualizar el catálogo?\nSe agregarán los deseos y acciones oficiales más recientes.\nNada se eliminará — solo se actualiza lo existente.')) return;
  const gid = currentUserData.groupId;
  try {
    const groupSnap = await db.collection('groups').doc(gid).get();
    const group = groupSnap.data();

    // IDs que pertenecen al DEFAULT (todos los prefijos usados)
    const isDefault = (id) => /^(fb|fm|ff|fp|fn|an|ah|ae)\d+$/.test(id);

    // Conservar solo los custom (no del DEFAULT)
    const existingFantasies = group.fantasies || [];
    const customFantasies = existingFantasies.filter(f => f && f.id && !isDefault(f.id));

    const existingActions = group.actions || {};
    const filterCustomActions = (arr) => (arr || []).filter(a => a && a.id && !isDefault(a.id));

    // Sanitizar DEFAULT_FANTASIES — eliminar cualquier campo undefined
    const cleanFantasies = DEFAULT_FANTASIES.map(f => ({
      id: f.id || '',
      name: f.name || '',
      pts: f.pts || 0,
      level: f.level || 'basic',
      icon: f.icon || '🔥',
      desc: f.desc || '',
      category: f.category || 'pareja',
    }));

    const cleanActions = (arr) => arr.map(a => ({
      id: a.id || '',
      name: a.name || '',
      pts: a.pts || 0,
      icon: a.icon || '⚡',
      cat: a.cat || 'otro',
    }));

    await db.collection('groups').doc(gid).update({
      fantasies: [...cleanFantasies, ...customFantasies],
      actions: {
        neutral: [...cleanActions(DEFAULT_ACTIONS_NEUTRAL), ...filterCustomActions(existingActions.neutral)],
        him: [...cleanActions(DEFAULT_ACTIONS_HIM), ...filterCustomActions(existingActions.him)],
        her: [...cleanActions(DEFAULT_ACTIONS_HER), ...filterCustomActions(existingActions.her)],
      }
    });

    await notifyGroupMembers(gid, '🔄 Catálogo actualizado a la versión más reciente');
    showToast('✅ Catálogo actualizado correctamente');
    showTab('config');
  } catch(e) { showToast('Error: ' + e.message); }
}
