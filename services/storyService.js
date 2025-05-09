const { db } = require("../config/firebase");
const { collection, doc, addDoc, getDocs, updateDoc, arrayUnion, getDoc, setDoc } = require("firebase/firestore");

async function createUser(userId) {
  // Admin SDK: Usa collection().doc() directamente en la instancia db
  const userRef = db.collection("users").doc(userId);

  // Check if the user already exists
  // Admin SDK: Llama a get() en la referencia del documento
  const userSnap = await userRef.get();

  if (userSnap.exists) { // 'exists' es una propiedad en Admin SDK DocumentSnapshot
    // If user exists, return early
    return {
        status: 'User Exists',
        response: false
    };
  }

  // Admin SDK: Llama a set() en la referencia del documento
  // admin.firestore.FieldValue.serverTimestamp() es preferible a new Date() en backend
  await userRef.set({ createdAt: new Date() });
  return {
    status: 'User Created',
    response: true
  };
}

async function createStory(userId, title) {
  // Admin SDK: Navega por subcolecciones usando collection().doc().collection()
  const storiesRef = db.collection("users").doc(userId).collection("stories");

  // Admin SDK: Llama a add() en la referencia de la colección
  // admin.firestore.FieldValue.serverTimestamp() es preferible
  const storyDoc = await storiesRef.add({
    title,
    createdAt: new Date(),
  });

  return storyDoc.id;
}

async function addStages(userId, storyId, inicio, nudo, desenlace) {
  // Admin SDK: Navega hasta la referencia del documento de la historia
  const storyRef = db.collection("users").doc(userId).collection("stories").doc(storyId);

  // Admin SDK: Llama a update() en la referencia del documento
  await storyRef.update({
    // La sintaxis para campos anidados 'stages.inicio' es correcta
    "stages.inicio": inicio,
    "stages.nudo": nudo,
    "stages.desenlace": desenlace
  });
}


async function getStory(userId, storyId) {
  // Admin SDK: Navega hasta la referencia del documento de la historia
  const storyRef = db.collection("users").doc(userId).collection("stories").doc(storyId);

  // Admin SDK: Llama a get() en la referencia del documento
  const snap = await storyRef.get();

  // Admin SDK: 'exists' es una propiedad
  if (!snap.exists) {
    console.error(`Story not found: userId=${userId}, storyId=${storyId}`); // Agregué log de error
    throw new Error("Story not found");
  }
  return snap.data();
}


async function getAllStoriesByUser(userId) {
  // Admin SDK: Navega hasta la referencia de la subcolección
  const storiesRef = db.collection("users").doc(userId).collection("stories");

  // Admin SDK: Llama a get() en la referencia de la colección o query
  const querySnapshot = await storiesRef.get();

  // Admin SDK: Los documentos están en la propiedad 'docs' de QuerySnapshot
  if (querySnapshot.empty) {
      return [];
  }

  const stories = [];
  // Admin SDK: Puedes iterar sobre snapshot.docs o usar snapshot.forEach
  querySnapshot.forEach((doc) => {
    stories.push({ id: doc.id, ...doc.data() }); // doc.id y doc.data() son los métodos/propiedades correctos
  });

  return stories;
}

module.exports = {
  createUser,
  createStory,
  addStages,
  getStory,
  getAllStoriesByUser
};
