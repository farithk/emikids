const express = require("express");
const { generateImageController, editImageController } = require("../controllers/imageController");

const router = express.Router();

// Route to generate an image
router.post("/generate-image", generateImageController);

// Route to edit an existing image
router.post("/edit-image", editImageController);

module.exports = router;
