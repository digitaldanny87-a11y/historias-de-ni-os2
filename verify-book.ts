import { generateBook } from "./services/geminiService";
import { UserPreferences } from "./types";

// Mock environment for Vite
(globalThis as any).import = {
    meta: {
        env: {
            VITE_API_KEY: "AIzaSyAWumVg44rqCVAyrhb_vI049pc4iqXtl9Y"
        }
    }
};

const mockPrefs: UserPreferences = {
    childName: "Test",
    age: 5,
    topics: ["Dinosaurios"],
    learningGoal: "Amistad",
    difficulty: 'Medio',
    setting: '',
    visualStyle: "Cartoon",
    coverIdea: ''
};

async function testGenerate() {
    console.log("Iniciando prueba de generación de libro...");
    try {
        const book = await generateBook(mockPrefs);
        console.log("¡Libro generado exitosamente!");
        console.log("Título:", book.cover.title);
        console.log("Número de páginas:", book.pages.length);
    } catch (error) {
        console.error("Error en la prueba:", error);
    }
}

testGenerate();
