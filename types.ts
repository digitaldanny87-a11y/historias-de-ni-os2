export enum ActivityType {
  STORY = 'STORY',
  QUIZ = 'QUIZ',
  DRAWING = 'DRAWING',
  VOCABULARY = 'VOCABULARY',
  MATH = 'MATH'
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface VisualElements {
  personaje: string;
  escenario: string;
  objeto: string;
  emocion: string;
  accion: string;
}

export interface BookPage {
  type: ActivityType;
  title: string;
  content: string; // Used for story text, math problems, or instructions
  options?: QuizOption[]; // Only for QUIZ
  hint?: string; // Optional hint
  colorTheme?: string; // Hex code or tailwind class suggestion
  imageDescription?: string; // Description of the illustration for this page
  imageBase64?: string; // The generated image for this specific page
  visualElements?: VisualElements; // Specific pedagogical visual keys
}

export interface BookCover {
  title: string;
  subtitle: string;
  visualDescription: string; // Describes what the cover illustration looks like
  colorTheme: string;
}

export interface GeneratedBook {
  cover: BookCover;
  coverImageBase64?: string; // Base64 string of the generated image
  pages: BookPage[];
}

export interface UserPreferences {
  childName: string;
  age: number;
  topics: string[];
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  learningGoal?: string; // e.g., "Aprender a compartir", "Multiplicación"
  setting?: string; // e.g., "En un bosque mágico", "En una nave espacial"
  visualStyle?: string; // e.g., "Dibujos animados", "Acuarela", "Realista"
  coverIdea?: string; // e.g., "Un dragón leyendo un libro"
}

export const AVAILABLE_TOPICS = [
  "Animales",
  "Espacio",
  "Dinosaurios",
  "Matemáticas",
  "Ciencia",
  "Superhéroes",
  "Naturaleza",
  "Música",
  "Historia",
  "Fantasía"
];