// =========================================================
// Cloud Functions — Lógica de resolución del Dado del Deseo
// Todas las escrituras a "resolution/state" pasan por acá,
// nunca directo desde el cliente (ver firestore.rules).
// =========================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Persona B define el reparto: quién resuelve cada categoría
 * (Actividad / Invitado / Ropa) y qué secciones agregó contenido.
 *
 * Valida:
 * - Máximo 2 de 3 secciones con contenido agregado por B.
 * - Si agregó en una sección, esa sección NO puede quedar
 *   asignada a "b" en el reparto (queda bloqueada para ella).
 * - Nunca las 3 categorías asignadas a "b" al mismo tiempo,
 *   incluso si no agregó contenido en ninguna.
 */
exports.setDesirePackAssignment = functions.https.onCall(async (data, context) => {
  const { groupId, proposalId, assignment, lockedSections } = data;
  // assignment: { activity: "a"|"b"|"luck", guest: "a"|"b"|"luck", outfit: "a"|"b"|"luck" }
  // lockedSections: array, ej. ["guests", "outfits"] — secciones donde B agregó contenido

  const uid = context.auth.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Login requerido.");

  const proposalRef = db.doc(`groups/${groupId}/desirePacks/${proposalId}`);
  const proposalSnap = await proposalRef.get();
  const proposal = proposalSnap.data();

  if (!proposal) throw new functions.https.HttpsError("not-found", "Propuesta no existe.");
  if (proposal.status !== "pending_review") {
    throw new functions.https.HttpsError("failed-precondition", "La propuesta ya no acepta configuración.");
  }
  if (uid === proposal.createdBy) {
    throw new functions.https.HttpsError("permission-denied", "Solo Persona B configura el reparto.");
  }

  // Regla: máximo 2 de 3 secciones bloqueadas por contenido agregado
  if (lockedSections.length > 2) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No puedes agregar contenido en las 3 secciones — máximo 2."
    );
  }

  // Regla: sección con contenido agregado por B no puede estar asignada a "b"
  const sectionToAssignmentKey = { guests: "guest", outfits: "outfit", activities: "activity" };
  for (const section of lockedSections) {
    const key = sectionToAssignmentKey[section];
    if (assignment[key] === "b") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `No puedes elegir manualmente ${key}: agregaste contenido ahí.`
      );
    }
  }

  // Regla: como máximo 1 categoría asignada a "b" (ella misma)
  const values = Object.values(assignment); // ["a"|"b"|"luck", ...]
  const selfCount = values.filter((v) => v === "b").length;
  if (selfCount > 1) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Solo puedes elegir una categoría para ti — el resto va a tu pareja o a la Suerte."
    );
  }

  await proposalRef.collection("resolution").doc("state").set(
    {
      activityAssignedTo: assignment.activity,
      guestAssignedTo: assignment.guest,
      outfitAssignedTo: assignment.outfit,
      activityResult: null,
      guestResult: null,
      outfitResult: null,
      lockedSections,
    },
    { merge: true }
  );

  await proposalRef.update({ status: "b_turn" });

  return { ok: true };
});

/**
 * Resuelve UNA categoría (manual o dado). Aplica la regla dura:
 * Actividad siempre primero — Ropa/Invitado no se pueden resolver
 * (ni manual ni por dado) hasta que activityResult exista.
 */
exports.resolveDesirePackCategory = functions.https.onCall(async (data, context) => {
  const { groupId, proposalId, category, chosenId, method } = data;
  // category: "activity" | "guest" | "outfit"
  // method: "manual" | "luck"
  // chosenId: id elegido manualmente, o null si method="luck" (el server tira el dado)

  const uid = context.auth.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Login requerido.");

  const proposalRef = db.doc(`groups/${groupId}/desirePacks/${proposalId}`);
  const resolutionRef = proposalRef.collection("resolution").doc("state");

  return db.runTransaction(async (tx) => {
    const proposalSnap = await tx.get(proposalRef);
    const resolutionSnap = await tx.get(resolutionRef);
    const proposal = proposalSnap.data();
    const resolution = resolutionSnap.data();

    if (!proposal || !resolution) {
      throw new functions.https.HttpsError("not-found", "Propuesta o resolución no existe.");
    }

    // REGLA DURA: Ropa/Invitado bloqueados hasta que Actividad tenga resultado.
    if (category !== "activity" && !resolution.activityResult) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "La Actividad debe resolverse primero."
      );
    }

    const assignedToField = `${category}AssignedTo`;
    const resultField = `${category}Result`;
    const assignedTo = resolution[assignedToField]; // "a" | "b" | "luck"

    // Verifica que quien llama tiene permiso de resolver esta categoría
    const uidRole = uid === proposal.createdBy ? "a" : "b";
    if (assignedTo !== "luck" && assignedTo !== uidRole) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "No te corresponde resolver esta categoría."
      );
    }
    if (resolution[resultField]) {
      throw new functions.https.HttpsError("failed-precondition", "Esta categoría ya fue resuelta.");
    }

    let finalChoice = chosenId;

    if (assignedTo === "luck" || method === "luck") {
      // El servidor tira el dado — nunca confiar en un resultado
      // random calculado en el cliente.
      const optionsSnap = await tx.get(
        proposalRef.collection(
          category === "activity" ? "activities" : category === "guest" ? "guests" : "outfits"
        )
      );
      let options = optionsSnap.docs;

      // Ropa/Invitado se filtran por compatibilidad con la Actividad ya fija.
      if (category !== "activity") {
        options = options.filter((doc) =>
          (doc.data().compatibleActivities || []).includes(resolution.activityResult)
        );
      }
      if (options.length === 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "No hay opciones compatibles disponibles para el sorteo."
        );
      }
      const pick = options[Math.floor(Math.random() * options.length)];
      finalChoice = pick.id;
    } else {
      // Elección manual: validar que chosenId sea compatible si aplica.
      if (category !== "activity") {
        const optionSnap = await tx.get(
          proposalRef
            .collection(category === "guest" ? "guests" : "outfits")
            .doc(chosenId)
        );
        const compatible = (optionSnap.data()?.compatibleActivities || []).includes(
          resolution.activityResult
        );
        if (!compatible) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "Esa opción no es compatible con la actividad seleccionada."
          );
        }
      }
    }

    tx.update(resolutionRef, { [resultField]: finalChoice });

    // Si ya se resolvió todo, cerrar la propuesta y armar el histórico.
    const allResolved =
      (category === "activity" ? finalChoice : resolution.activityResult) &&
      (category === "guest" ? finalChoice : resolution.guestResult) &&
      (category === "outfit" ? finalChoice : resolution.outfitResult);

    if (allResolved) {
      tx.update(proposalRef, { status: "closed" });
    }

    return { result: finalChoice };
  });
});
