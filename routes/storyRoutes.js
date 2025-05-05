const express = require("express");
const router = express.Router();
const {
  createUser,
  createStory,
  addStage,
  getStory,
  getAllStoriesByUser
} = require("../services/storyService");

// Crea un usuario
router.post("/users", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).send({
        status: "userId is required",
        response: false
    });
    const result = await createUser(userId);
    res.send({
        ...result
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Crea una historia
router.post("/stories", async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!userId || !title) return res.status(400).send("userId and title are required");
    
    const storyId = await createStory(userId, title);
    res.send({ storyId });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Agrega un párrafo
router.post("/stage", async (req, res) => {
  try {
    const { userId, storyId, text, stageData } = req.body;
    if (!userId || !storyId || !text || !stageData) return res.status(400).send("userId, storyId, stageData and text are required");

    await addStage(userId, storyId, text, stageData);
    res.send("Párrafo agregado");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Consulta historia
router.post("/getstory", async (req, res) => {
  try {
    const { userId, storyId } = req.body;
    if (!userId || !storyId) return res.status(400).send("userId and storyId are required");
    
    const story = await getStory(userId, storyId);
    res.send(story);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.post("/getstories", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).send("userId is required");

        const stories = await getAllStoriesByUser(userId);
        res.send(stories);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
