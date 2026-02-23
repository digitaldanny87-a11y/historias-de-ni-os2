import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { GeneratedBook, UserPreferences, ActivityType } from "../types";

// Initialize AI client safely.
const apiKey = (import.meta as any).env.VITE_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const bookSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    cover: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Un título creativo y pegadizo para el libro." },
        subtitle: { type: Type.STRING, description: "Un subtítulo motivador o descriptivo." },
        visualDescription: { type: Type.STRING, description: "Una descripción detallada (prompt de imagen) para la portada basada en el estilo pedido." },
        colorTheme: { type: Type.STRING, description: "Color hexadecimal principal para la portada." }
      },
      required: ["title", "subtitle", "visualDescription", "colorTheme"]
    },
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: [
              ActivityType.STORY,
              ActivityType.QUIZ
            ],
            description: "Debe ser 'STORY' para las páginas del cuento y 'QUIZ' solo para la última página."
          },
          title: { type: Type.STRING, description: "Título de la sección o capítulo." },
          content: { type: Type.STRING, description: "El párrafo de la historia para esta página (aprox 40-60 palabras)." },
          hint: { type: Type.STRING, description: "Una pregunta reflexiva pequeña sobre lo que acaba de leer." },
          imageDescription: { type: Type.STRING, description: "Descripción detallada de la ilustración que representa ESTE párrafo específico." },
          visualElements: {
            type: Type.OBJECT,
            description: "Elementos visuales clave.",
            properties: {
              personaje: { type: Type.STRING },
              escenario: { type: Type.STRING },
              objeto: { type: Type.STRING },
              emocion: { type: Type.STRING },
              accion: { type: Type.STRING }
            },
            nullable: true
          },
          options: {
            type: Type.ARRAY,
            description: "Opciones para la página final de QUIZ.",
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN }
              },
              required: ["text", "isCorrect"]
            }
          },
          colorTheme: { type: Type.STRING, description: "Un color sugerido (en hex) para el borde de la página." }
        },
        required: ["type", "title", "content", "imageDescription"]
      }
    }
  },
  required: ["cover", "pages"]
};

// Función auxiliar para generar imagen
// Función auxiliar para generar imagen usando Pollinations AI
async function generateImage(prompt: string, style: string): Promise<string | undefined> {
  try {
    const encodedPrompt = encodeURIComponent(`${prompt}, ${style} style, high quality, vibrant colors, for children's book`);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    // Fetch image and convert to Base64 to maintain consistency with existing structure
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

    return base64;
  } catch (error) {
    console.error("Error generating image:", error);
    return undefined;
  }
}

export const generateBook = async (prefs: UserPreferences): Promise<GeneratedBook> => {
  if (!apiKey || apiKey.length < 10) {
    throw new Error("API Key no configurada o inválida. Por favor configura VITE_API_KEY en tu archivo .env.local");
  }

  const modelId = 'gemini-1.5-flash';

  const prompt = `
    Actúa como experto en literatura infantil e ilustrador.
    Crea un CUENTO ILUSTRADO continuo sobre el tema: "${prefs.topics.join(', ')}".
    
    OBJETIVO EDUCATIVO PRINCIPAL: "${prefs.learningGoal || "Valores positivos"}".
    El cuento debe enseñar este objetivo a través de la narrativa.

    PERFIL DEL NIÑO:
    - Nombre: ${prefs.childName}
    - Edad: ${prefs.age} años
    - Estilo Visual: ${prefs.visualStyle || "Cartoon"}

    ESTRUCTURA DEL LIBRO (Máximo 6 páginas en total):
    - Páginas 1 a 5: DEBEN ser tipo "STORY". Desarrolla la historia paso a paso. Cada página debe tener un párrafo de texto y una descripción de imagen ("imageDescription") que ilustre lo que pasa en ese párrafo.
    - Página 6: DEBE ser tipo "QUIZ". Pregunta sobre el objetivo educativo para reforzar lo aprendido.

    REGLAS:
    1. La historia debe tener continuidad (inicio, nudo, desenlace).
    2. Usa el nombre "${prefs.childName}" como protagonista.
    3. Cada página "STORY" necesita una "imageDescription" única y coherente con el estilo ${prefs.visualStyle}.
    4. Vocabulario adecuado para ${prefs.age} años.

    Responde ESTRICTAMENTE en JSON siguiendo el esquema.
  `;

  try {
    // 1. Generar Texto y Estructura
    const textResponse = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: bookSchema,
        temperature: 0.7
      }
    });

    if (!textResponse.text) {
      throw new Error("No se pudo generar el contenido del libro.");
    }

    const bookData = JSON.parse(textResponse.text) as GeneratedBook;

    // 2. Generar Imágenes en Paralelo (Portada + Páginas)
    const imagePromises: Promise<void>[] = [];

    // Promesa Portada
    if (bookData.cover.visualDescription) {
      imagePromises.push(
        generateImage(bookData.cover.visualDescription, prefs.visualStyle || 'Cartoon')
          .then(img => { if (img) bookData.coverImageBase64 = img; })
      );
    }

    // Promesas Páginas Interiores (Solo para tipo STORY)
    bookData.pages.forEach((page) => {
      if (page.type === ActivityType.STORY && page.imageDescription) {
        // Añadimos un pequeño delay aleatorio o secuencial si fuera necesario para rate limits,
        // pero gemini-2.5-flash-image suele manejar bien concurrencia moderada.
        imagePromises.push(
          generateImage(page.imageDescription, prefs.visualStyle || 'Cartoon')
            .then(img => { if (img) page.imageBase64 = img; })
        );
      }
    });

    // Esperar a que todas las imágenes se generen
    await Promise.all(imagePromises);

    return bookData;

  } catch (error) {
    console.error("Error generating book:", error);
    throw error;
  }
};

export const createTopicChatSession = (): Chat => {
  if (!apiKey || apiKey.length < 10) {
    throw new Error("API Key missing for Chat");
  }
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: [],
    config: {
      temperature: 0.7,
      systemInstruction: { role: 'system', parts: [{ text: `Eres un asistente experto en libros infantiles.` }] }
    }
  });
};