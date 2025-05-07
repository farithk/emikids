const fs = require("fs");
const { OpenAI } = require("openai");
const { toFile } = require("openai/uploads");
const openai = require("../config/openai");

const path = require("path");
const { bucket } = require("../config/firebase"); 

// Initialize OpenAI client
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function uploadImageToFirebaseStorage(base64Image, filename) {
    const buffer = Buffer.from(base64Image, "base64");
    const file = bucket.file(`images/${filename}`);
  
    await file.save(buffer, {
      metadata: { contentType: "image/png" },
      public: true, // Hazla pública si quieres acceso por URL pública
    });
  
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/images/${filename}`;
    console.log(publicUrl);
    
    return publicUrl;
  }

async function generateImage(prompt, userId, storyId, stage) {
    try {
        // Step 1: Generate image based on prompt
        const result = await client.images.generate({
            model: "gpt-image-1",
            prompt,
            size: '1024x1024',
            quality: 'medium',
        });

        const image_base64 = result.data[0].b64_json;

        // const image_bytes = Buffer.from(image_base64, "base64");
        // const imagePath = "./otter.png";

        // fs.writeFileSync(imagePath, image_bytes);
        // console.log("Image saved as otter.png");

        // const imagePath = "./otter.png"; // Ruta al archivo
        // const imageBuffer = fs.readFileSync(imagePath);
        // const base64Image = imageBuffer.toString("base64");

        const response = await uploadImageToFirebaseStorage(image_base64, userId + storyId + stage);

        return response; // return the path of the saved image
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
}
async function generateText(params) {
    try {

        const response = await client.responses.create({
            model: "gpt-4.1",
            input: params
        });

       
        console.log("Text done");
        console.log(response);

        return response; // return the path of the edited image
    } catch (error) {
        console.error("Error generating text from promt:", error);
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

module.exports = { generateImage, editImage, generateText, uploadImageToFirebaseStorage };
