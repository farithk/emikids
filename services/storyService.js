const { db } = require("../config/firebase");
const { collection, doc, addDoc, getDocs, updateDoc, arrayUnion, getDoc, setDoc } = require("firebase/firestore");

async function createUser(userId) {
  const userRef = doc(db, "users", userId);
  // Check if the user already exists
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // If user exists, return early (or throw error depending on your needs)
    return {
        status: 'User Exists',
        response: false
    };
  }
  await setDoc(userRef, { createdAt: new Date() });
  return {
    status: 'User Created',
    response: true
};
}

async function createStory(userId, title) {
  const storiesRef = collection(db, "users", userId, "stories");
  const storyDoc = await addDoc(storiesRef, {
    title,
    createdAt: new Date(),
    paragraphs: []
  });
  return storyDoc.id;
}

async function addStage(userId, storyId, stageName, stageData) {
  const storyRef = doc(db, "users", userId, "stories", storyId);
  await updateDoc(storyRef, {
    [`stages.${stageName}`]: stageData  // ← store as object, not string
  });
}

async function getStory(userId, storyId) {
  const storyRef = doc(db, "users", userId, "stories", storyId);
  const snap = await getDoc(storyRef);
  if (!snap.exists()) throw new Error("Story not found");
  return snap.data();
}

async function getAllStoriesByUser(userId) {
    const storiesRef = collection(db, "users", userId, "stories");
    const querySnapshot = await getDocs(storiesRef);
  
    const stories = [];
    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() });
    });
  
    return stories;
  }

module.exports = {
  createUser,
  createStory,
  addStage,
  getStory,
  getAllStoriesByUser
};
