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
        visualDescription: { type: Type.STRING, description: "A DETAILED DESCRIPTION IN ENGLISH (max 15 words) for the cover art. Example: 'A friendly blue dragon reading a magical book in a forest'." },
        characterAppearance: { type: Type.STRING, description: "A brief description in ENGLISH of the protagonist's appearance to maintain consistency (e.g., 'wearing a red hoodie and blue cap')." },
        colorTheme: { type: Type.STRING, description: "Color hexadecimal principal para la portada." }
      },
      required: ["title", "subtitle", "visualDescription", "characterAppearance", "colorTheme"]
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
          imageDescription: { type: Type.STRING, description: "A DETAILED DESCRIPTION IN ENGLISH (max 15 words) for the illustration of THIS paragraph. Example: 'The boy finds a hidden treasure map in the attic'." },
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

async function generateImage(prompt: string, style: string): Promise<string | undefined> {
  try {
    // Prompt optimizado para generación nativa con gemini-2.5-flash-image (Nano Banana)
    const enhancedPrompt = `High-quality ${style} style children's book illustration. Scene: ${prompt}. Pure art, no text, no labels, vibrant and appealing.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }]
    });

    // Extraemos la imagen de la respuesta (inlineData) en el SDK @google/genai
    const imagePart = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    console.error("No image data found in Gemini response");
    return undefined;
  } catch (error) {
    console.error("Error generating native image with gemini-2.5-flash-image:", error);
    return undefined;
  }
}

export const generateBook = async (prefs: UserPreferences): Promise<GeneratedBook> => {
  if (!apiKey || apiKey.length < 10) {
    throw new Error("API Key no configurada o inválida. Por favor configura VITE_API_KEY en tu archivo .env.local");
  }

  const modelId = 'gemini-2.5-flash';

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
    3. MANDATORY: The fields "visualDescription" and "imageDescription" MUST be in ENGLISH, very simple, and CONSIST ONLY OF DESCRIPTIVE NOUNS AND ADJECTIVES (max 8 words). 
    4. FORBIDDEN: NEVER include proper names like "${prefs.childName}" or "Dany" in image descriptions. Use generic terms like "a child", "the hero", "a small boy", etc.
    5. Cada página "STORY" necesita una "imageDescription" única y coherente con el estilo ${prefs.visualStyle}.
    6. Vocabulario adecuado para ${prefs.age} años.

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

    // Generamos una semilla única para TODO el libro para mantener consistencia visual
    const charDesc = bookData.cover.characterAppearance || "";

    // 2. Generar Imágenes Secuencialmente (Para evitar bloqueos/rate-limits)
    if (bookData.cover.visualDescription) {
      try {
        const fullPrompt = `${bookData.cover.visualDescription} ${charDesc}`.trim();
        const img = await generateImage(fullPrompt, prefs.visualStyle || 'Cartoon');
        if (img) bookData.coverImageBase64 = img;
      } catch (e) { console.error("Error en portada:", e); }
    }

    for (const page of bookData.pages) {
      if (page.type === ActivityType.STORY && page.imageDescription) {
        try {
          await new Promise(r => setTimeout(r, 500)); // Delay para estabilidad
          const fullPrompt = `${page.imageDescription} ${charDesc}`.trim();
          const img = await generateImage(fullPrompt, prefs.visualStyle || 'Cartoon');
          if (img) page.imageBase64 = img;
        } catch (e) { console.error("Error en página:", e); }
      }
    }

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
      systemInstruction: `Eres un asistente experto en libros infantiles.`
    }
  });
};