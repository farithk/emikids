const { bucket } = require("../config/firebase"); // import the bucket
const { tmpdir } = require("os");
const path = require("path");

const { generateImage, editImage, generateText } = require("../services/imageService");

async function generateImageController(req, res) {
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
    const { imagePath, prompt, userId, storyId, stage } = req.body; // receive image path and prompt from frontend

    if (!imagePath || !prompt || !userId || !storyId || !stage) {
        return res.status(400).json({ error: "Image path and prompt are required" });
    }

    try {
        // Create a temp local file to store the image
        const tempFilePath = path.join(tmpdir(), path.basename("images/"+imagePath));
        // Download image from Firebase Storage
        await bucket.file("images/"+imagePath).download({ destination: tempFilePath });

        // Step 2: Edit the generated image
        const startingPrompt = `
            Con base en la imagen suministrada y la siguiente historia debes generar una nueva que use los mismos estilos y personajes presentes en la iamgen y que la complemente para describir la siguiente historia:
        `;
        const editedImagePath = await editImage(tempFilePath, startingPrompt + prompt, userId, storyId, stage );

        res.status(200).json({ message: "Image edited successfully", editedImagePath });
    } catch (error) {
        res.status(500).json({ error: "Failed to edit image" });
    }
}

async function generateTextController(req, res) {
    const { prompt } = req.body; // receive prompt from frontend

    let context02 = `
        Actúa como un experto en escritura de cuentos en español. Tu objetivo es ayudar a niños entre 8 y 12 años a completar su cuento, según la etapa actual: <inicio>, <nudo> o <desenlace> (te indicaré iniciando el texto en cuál etapa estamos trabajando).

        El niño escribirá un texto breve que está separado en las siguientes etiquetas: <inicio>, <nudo>, <desenlace>. Además, usará respuestas en el formato <r>(pregunta),(respuesta)<r> que te servirán como contexto.

        Si la respuesta no cumple con la pregunta suministrada, nunca incluir la respuesta ni la pregunta dentro del tag correspondiente a la etapa que se recibe. Y debes usar la misma pregunta y enviarla de nuevo dentro del tag <q>. Es importante no incluir esto dentro del tag del estado actual si la respuesta no cumple.

        Tu tarea es:
        1. Trabaja solo sobre la etapa actual (inicio, nudo o desenlace).
        2. Siempre conserva y reutiliza el contenido exacto que hayas recibido en las otras etapas no activas. No reemplaces ni modifiques su contenido. Solo puedes modificar la etapa activa. Ejemplo: si estamos trabajando en <nudo>, el contenido original de <inicio> debe mantenerse exactamente igual y no modificarse ni eliminarse.
       
        3. Tú organizarás el texto recibido de las respuesta <r> e incluirás esa respuesta dentro del tag correspondiente a la etapa que se recibe, debes corregir coherencia y una buena estructura sin agregar nuevas ideas que no hayan sido suministradas dentro de la respuesta <r>.
            Corrige solo los errores ortográficos de cada una de las palabras de texto recibido en la respuesta dentro de <r> para la etapa indicada (<inicio>, <nudo> o <desenlace>).

            Devuelve la corrección usando la siguiente estructura exacta:
            Abre el tag del estado correspondiente
            Abre la corrección con <text>.
            Debes agregar el contenido anterior del estado en el que estamos trabajando.
            Solo las palabras que estén mal escritas deben corregirse con un bloque <fix>palabra_incorrecta,corrección<fix>. No incluyas palabras que ya estén correctas. Si una palabra no tiene errores ortográficos, no la marques con <fix> ni la modifiques.

            Es obligatorio que TODA palabra incorrecta, incluso aquellas que solo requieren tilde, esté dentro del bloque <fix>.

            El bloque <fix> debe reemplazar exactamente la palabra incorrecta en su lugar original dentro del texto corregido.

            Luego cierra la corrección con <text> (sin símbolo de cierre / dentro de los tags, es decir: usa <text> al principio y <text> al final).
            Cierra el tag del estado correspondiente

            No agregues explicaciones, ni incluyas sugerencias, ni texto adicional fuera de esta estructura (solo puedes coregir la coherencia si notas que no tiene sentido con lo que se ha escrito anteriormente en la etapa que se esta evaluando). Solo devuelve el texto corregido con los <fix>, dentro del tag de la etapa actual.
                
            Ejemplo: 
            Respuesta que recibes: Etapa inicio. habia una ves una niña Yamada Lupita
            Corrección: <inicio><text><fix>habia,Había<fix> una <fix>ves,vez<fix> una niña <fix>Yamada,llamada<fix><text><inicio>

        4. Si el texto de la etapa actual tiene menos de 400 caracteres, haz una sola pregunta puntual (entre los tags <q>) que lo ayude a continuar esa etapa. La pregunta debe tener solo dos ejemplos concretos.
        5. Si el texto de la etapa actual tiene 400 caracteres o más, haz una sola pregunta final (entre los tags <q>) que lo ayude a cerrar esa etapa de forma creativa pero breve.
        6. Evalúa si el texto de la etapa actual cumple con los elementos mínimos:
        - INICIO: presenta al personaje, el lugar o el tiempo, pero debe ser mayor a 200 caracteres.
        - NUDO: ocurre un conflicto, problema o reto, pero debe ser mayor a 200 caracteres.
        - DESENLACE: el conflicto se resuelve o se aprende algo, pero debe ser mayor a 200 caracteres.
        7. Si la etapa actual (inicio, nudo o desenlace) de la historia suministrada se cumple, responde con <done>true<done>. Si no cumple, responde con <done>false<done>.

        Ejemplo de respuesta(estos tags no deben tener el simbolo / dentro de los <>. No es permitido </> solo es permitido el <>): 

        Ejemplo 1: Trabajando la etapa <inicio>
        <inicio>Luis era un <fix>niñio,niño<fix> que vivía en una montaña donde siempre hacía <fix>frio,frío<fix>. Todos los días miraba el cielo y soñaba con volar entre las nubes. Su casa estaba hecha de madera y rodeada de pinos verdes. Le gustaba dibujar dragones en la nieve.<inicio>
        <nudo><nudo>
        <desenlace><desenlace>
        <text>Luis era un <fix>niñio,niño<fix> que vivía en una montaña donde siempre hacía <fix>frio,frío<fix>. Todos los días miraba el cielo y soñaba con volar entre las nubes. Su casa estaba hecha de madera y rodeada de pinos verdes. Le gustaba dibujar dragones en la nieve.<text>
        <q>¿Qué objeto especial tenía Luis en su casa? Por ejemplo: una brújula mágica o una linterna que habla.<q>
        <done>true<done>
        <respuesta><inicio>true: presenta al personaje, el lugar y un elemento de su vida diaria con más de 200 caracteres.<inicio><nudo>false: no contiene contenido aún.<nudo><desenlace>false: no contiene contenido aún.<desenlace><respuesta>

        Ejemplo 2: Trabajando la etapa <nudo>
        <inicio>Luis era un niño que vivía en una montaña donde siempre hacía frío. Todos los días miraba el cielo y soñaba con volar entre las nubes.<inicio>
        <nudo>Una tarde, mientras exploraba el bosque, Luis encontró una puerta metálica escondida entre los árboles. Al abrirla, apareció un <fix>extratereste,extraterrestre<fix> que necesitaba ayuda para volver a su planeta. Luis no sabía si debía confiar en él.<nudo>
        <desenlace><desenlace>
        <text>Una tarde, mientras exploraba el bosque, Luis encontró una puerta metálica escondida entre los árboles. Al abrirla, apareció un <fix>extratereste,extraterrestre<fix> que necesitaba ayuda para volver a su planeta. Luis no sabía si debía confiar en él.<text>
        <q>¿Qué decisión tomó Luis? Por ejemplo: ayudarlo a construir una nave o buscar ayuda de un adulto.<q>
        <done>true<done>
        <respuesta><inicio>true: contenido previo válido y sin cambios.<inicio><nudo>true: presenta un conflicto claro y tiene más de 200 caracteres.<nudo><desenlace>false: etapa vacía.<desenlace><respuesta>

        Ejemplo 3: Trabajando la etapa <desenlace>
        <inicio>Luis era un niño que vivía en una montaña donde siempre hacía frío. Todos los días miraba el cielo y soñaba con volar entre las nubes.<inicio>
        <nudo>Una tarde, mientras exploraba el bosque, Luis encontró una puerta metálica escondida entre los árboles. Al abrirla, apareció un extraterrestre que necesitaba ayuda para volver a su planeta. Luis no sabía si debía confiar en él.<nudo>
        <desenlace>Luis decidió ayudar al extraterrestre. Juntos construyeron una nave con piezas de chatarra que encontraron en el bosque. Cuando la nave despegó, el <fix>extraterestre,extraterrestre<fix> le regaló a Luis una estrella que siempre brillaría en su ventana como recuerdo de su amistad.<desenlace>
        <text>Luis decidió ayudar al extraterrestre. Juntos construyeron una nave con piezas de chatarra que encontraron en el bosque. Cuando la nave despegó, el <fix>extraterestre,extraterrestre<fix> le regaló a Luis una estrella que siempre brillaría en su ventana como recuerdo de su amistad.<text>
        <q>¿Qué aprendió Luis de esta experiencia? Por ejemplo: confiar en lo desconocido o valorar la amistad.<q>
        <done>true<done>
        <respuesta><inicio>true: etapa previa válida.<inicio><nudo>true: conflicto claro y completo.<nudo><desenlace>true: resuelve el conflicto y aporta una enseñanza.<desenlace><respuesta>

        Responde siempre en español. No des explicaciones. Sigue las reglas con precisión. dentro de los tags <respuesta> verifica si cada una de las etapas se cumplen (inicio, nudo, desemlace)

    `;
    try {
        // Step 2: Edit the generated image
        const textGenerated = await generateText(context02 + "texto del niño: " + prompt);
        res.status(200).json({ message: "text generated successfully", output: textGenerated.output[0].content[0].text });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate text" });
    }
}

module.exports = { generateImageController, editImageController, generateTextController };
