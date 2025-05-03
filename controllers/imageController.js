const { generateImage, editImage } = require("../services/imageService");

async function generateImageController(req, res) {
    console.log('generating image');
    
    const { prompt } = req.body; // receive prompt from frontend

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        // Step 1: Generate the image
        const imagePath = await generateImage(prompt);
        res.status(200).json({ message: "Image generated successfully", imagePath });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate image" });
    }
}

async function editImageController(req, res) {
    console.log('generating image 2');
    const { imagePath, prompt } = req.body; // receive image path and prompt from frontend

    if (!imagePath || !prompt) {
        return res.status(400).json({ error: "Image path and prompt are required" });
    }

    try {
        // Step 2: Edit the generated image
        const editedImagePath = await editImage(imagePath, prompt);
        res.status(200).json({ message: "Image edited successfully", editedImagePath });
    } catch (error) {
        res.status(500).json({ error: "Failed to edit image" });
    }
}

module.exports = { generateImageController, editImageController };
