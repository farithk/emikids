const fs = require("fs");
const { OpenAI } = require("openai");
const { toFile } = require("openai/uploads");
const openai = require("../config/openai");

// Initialize OpenAI client
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateImage(prompt) {
    try {
        // Step 1: Generate image based on prompt
        const result = await openai.images.generate({
            model: "gpt-image-1",
            prompt,
            size: '1024x1024',
            quality: 'medium',
        });

        const image_base64 = result.data[0].b64_json;
        const image_bytes = Buffer.from(image_base64, "base64");
        const imagePath = "./otter.png";

        fs.writeFileSync(imagePath, image_bytes);
        console.log("Image saved as otter.png");

        return imagePath; // return the path of the saved image
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
}

async function editImage(imagePath, prompt) {
    try {
        // Step 2: Upload the image to OpenAI and modify it
        const images = await Promise.all(
            [imagePath].map(async (file) =>
                await toFile(fs.createReadStream(file), null, {
                    type: "image/png",
                })
            )
        );

        const rsp = await client.images.edit({
            model: "gpt-image-1",
            image: images,
            prompt,
            size: '1024x1024',
            quality: 'medium'
        });

        const image_base64 = rsp.data[0].b64_json;
        const image_bytes = Buffer.from(image_base64, "base64");
        const editedImagePath = "./basket.png";

        fs.writeFileSync(editedImagePath, image_bytes);
        console.log("Edited image saved as basket.png");

        return editedImagePath; // return the path of the edited image
    } catch (error) {
        console.error("Error editing image:", error);
        throw error;
    }
}

module.exports = { generateImage, editImage };
