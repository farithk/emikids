const { bucket } = require("../config/firebase"); // import the bucket
const { tmpdir } = require("os");
const path = require("path");

const { generateImage, editImage, generateText } = require("../services/imageService");

async function generateImageController(req, res) {
    console.log('generating image');
    
    const { prompt, userId, storyId, stage } = req.body; // receive prompt from frontend

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        // Step 1: Generate the image
        const startingPrompt = `
            Crear una imagen estilo caricatura que no contenga letras ni palabras sobre la siguiente historia inicial: 
        `;
        const imagePath = await generateImage(startingPrompt + prompt, userId, storyId, stage);
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
        // Create a temp local file to store the image
        const tempFilePath = path.join(tmpdir(), path.basename("images/"+imagePath));
        // Download image from Firebase Storage
        await bucket.file(imagePath).download({ destination: tempFilePath });

        // Step 2: Edit the generated image
        const startingPrompt = `
            Con base en la imagen suministrada y la siguiente historia debes generar una nueva que use los mismos estilos y personajes presentes en la iamgen y que la complemente para describir la siguiente historia:
        `;
        const editedImagePath = await editImage(tempFilePath, startingPrompt + prompt);

        res.status(200).json({ message: "Image edited successfully", editedImagePath });
    } catch (error) {
        console.log(error);
        
        res.status(500).json({ error: "Failed to edit image" });
    }
}

async function generateTextController(req, res) {
    console.log('generating text gpt');
    const { prompt } = req.body; // receive prompt from frontend
    const context = `
    Actúa como un experto en escritura de cuentos en español. Para cada etapa del cuento te voy a indicar en qué etapa estamos (inicio, nudo, desenlace). El objetivo principal es ayudar a niños entre 8 y 12 años a escribir cuentos para fomentar su creatividad. El niño comenzará a escribir un texto. Este texto tendrá respuestas dentro de tags <r1> (esta respuesta contendrá tanto la pregunta como la respuesta, separadas por una coma, de la forma: <r1>(pregunta1),(respuesta1)<r1>, para brindarte contexto).

    Tú organizarás el texto según esas respuestas y le harás una pregunta puntual (máximo 1 pregunta) dividida por los tags <q1><q1>, que lo ayudará a completar poco a poco cada etapa del cuento. La pregunta debe ser puntual, con solo dos ejemplos para guiar la creatividad del niño.

    Tu respuesta debe ir acompañada de la corrección ortográfica de las palabras. Las palabras corregidas deben ir dentro del tag <fix> junto con la palabra incorrecta y la correcta, separadas por una coma. Estos tags <fix> deben estar dentro del texto corregido, que debe ir entre los tags <text>. Ejemplo: esto es un ejemplo ermoso es igual a <text><fix>exto,Esto<fix> es un ejemplo <fix>ermoso,hermoso.<fix><text> Es importante que el tag fix remplace la posicion de la palabra corregida.

    Cuando consideres que el texto que recibes cumple con las características de cada etapa (inico, nudo o desenlace), debes responder con la frase "true"entre los tags <done>. Si no cumple, responde con la palabra "false" entre los tags <done>.

    Es importante que solo respondas con tags, nada de texto adicional. Todos los tags <text><fix><q1><done> deben estar presentes. con su respectiva informacion segun lo explicado. Es importante que la respuesta sea en español.
    `;

    let context02 = `
        Actúa como un experto en escritura de cuentos en español. Tu objetivo es ayudar a niños entre 8 y 12 años a completar su cuento, según la etapa actual: <inicio>, <nudo> o <desenlace> (te indicaré cuál etapa estamos trabajando).

        El niño escribirá un texto breve que puede estar separado en las siguientes etiquetas: <inicio>, <nudo>, <desenlace>. Además, usará respuestas en el formato <r1>(pregunta1),(respuesta1)<r1> que te servirán como contexto.
        Si la respuesta no cumple con la pregunta suministrada, nunca incluir la respuesta ni la pregunta dentro del tag correspondiente a la etapa que se recibe. Y debes usar la misma pregunta y enviarla de nuevo dentro del tag <q1>. Es importante no incluir esto dentro del tag actual si la respuesta no cumple.
        Tú organizarás el texto recibido de las respuestas <r1> e incluirás esas respuestas dentro del tag correspondiente a la etapa que se recibe, debes corregir coherencia y si consideras que no tiene sentido trata de darle coherencia y una buen estrcutura sin agregar nuevas ideas que no hayan sido suministradas dentro de la respuesta <r1>.

        Tu tarea es:

        1. Trabaja solo sobre la etapa actual (inicio, nudo o desenlace).
        2. Cuenta solo los caracteres contenidos dentro de la etiqueta de la etapa actual.
        3. Corrige errores ortográficos del texto de esa etapa. Cada palabra corregida debe ir entre los tags 
	Corrige los errores ortográficos del texto suministrado. Devuelve la corrección utilizando esta estructura 	exactamente: Abre la corrección con <text> y ciérrala con </text>. Cada palabra incorrecta debe ser reemplazada por un bloque <fix>palabra_incorrecta,corrección</fix>. No agregues ningún texto adicional fuera de esta estructura.
<fix>palabra_incorrecta,corregida<fix>, reemplazando la palabra original, dentro del texto entre los tags <text>.
        4. Si el texto de la etapa actual tiene menos de 400 caracteres, haz una sola pregunta puntual (entre los tags <q1>) que lo ayude a continuar esa etapa. La pregunta debe tener solo dos ejemplos concretos.
        5. Si el texto de la etapa actual tiene 400 caracteres o más, haz una sola pregunta final (entre los tags <q1>) que lo ayude a cerrar esa etapa de forma creativa pero breve.
        6. Evalúa si el texto de la etapa actual cumple con los elementos mínimos:
        - INICIO: presenta al personaje, el lugar o el tiempo, pero debe ser mayor a 200 caracteres.
        - NUDO: ocurre un conflicto, problema o reto, pero debe ser mayor a 200 caracteres.
        - DESENLACE: el conflicto se resuelve o se aprende algo, pero debe ser mayor a 200 caracteres.
        7. Si la etapa actual (inicio, nudo o desenlace) de la historia suministrada se cumple, responde con <done>true<done>. Si no cumple, responde con <done>false<done>.

        Tu respuesta siempre debe contener únicamente los siguientes tags: <inicio> <nudo> <desenlace> (junto con el texto de cada etapa) <text>, <fix>, <q1>, <done> <respuesta>.y sin saltos de linea (\n). Nada más.

        Ejemplo de corrección:  
        Texto original: “esto es un ejemplo ermoso para saver como mejorar”  
        Texto corregido: <text>Esto es un ejemplo <fix>ermoso,hermoso<fix> para <fix>saver,saber<fix> como mejorar el prompt.<text>

        Ejemplo de respuesta(estos tagas no deben tener el simbolo / dentro de los <>. No es permitido </> solo es permitido el <>): 
        <inicio>
        texto de inicio (esto debe ser exclusivamente para contenido generado por el niño)
        <inicio>.
        <nudo>
        texto de nudo (esto debe ser exclusivamente para contenido generado por el niño)
        <nudo>
        <desenlace>
        texto de desenlace (esto debe ser exclusivamente para contenido generado por el niño)
        <desenlace>
        <q1>
        pregunta
        <q1>
        <done>boolean<done>
        <respuesta><inicio>true or false seguido de dos puntos y del comentario respuesta y justificacion<inicio><nudo>true or false seguido del comentario: respuesta y justificacion<nudo><desenlace>true or false seguido del comentario: respuesta y justificacion<desenlace></respuesta>
        Responde siempre en español. No des explicaciones. Sigue las reglas con precisión. dentro de los tags <respuesta> verifica si cada una de las etapas se cumplen (inicio, nudo, desemlace)
    `;
    try {
        console.log(context + "texto del niño: " + prompt);
        
        // Step 2: Edit the generated image
        const textGenerated = await generateText(context02 + "texto del niño: " + prompt);
        res.status(200).json({ message: "text generated successfully", output: textGenerated.output[0].content[0].text });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate text" });
    }
}

module.exports = { generateImageController, editImageController, generateTextController };
