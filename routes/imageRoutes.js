const express = require("express");
const { generateImageController, editImageController, generateTextController } = require("../controllers/imageController");

const router = express.Router();

// Route to generate an image
router.post("/generate-image", generateImageController);

// Route to edit an existing image
router.post("/edit-image", editImageController);

router.post("/generate-text", generateTextController);

module.exports = router;
