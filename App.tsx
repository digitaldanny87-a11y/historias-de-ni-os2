import React, { useState } from 'react';
import SetupForm from './components/SetupForm';
import BookViewer from './components/BookViewer';
import VoiceAgent from './components/VoiceAgent';
import { generateBook } from './services/geminiService';
import { GeneratedBook, UserPreferences } from './types';

const App: React.FC = () => {
  const [book, setBook] = useState<GeneratedBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateBook = async (prefs: UserPreferences) => {
    setLoading(true);
    setError(null);
    try {
      const newBook = await generateBook(prefs);
      setBook(newBook);
    } catch (err) {
      setError("Hubo un problema creando el libro. Por favor, verifica tu conexión e inténtalo de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setBook(null);
    setError(null);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8 bg-gradient-to-br from-sky-200 via-purple-200 to-pink-200 relative overflow-hidden font-fredoka selection:bg-yellow-300 selection:text-yellow-900">

      {/* 1. Colorful Pattern Overlay */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-pattern"></div>

      {/* 2. Vibrant Animated Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      </div>

      {/* 3. Floating Emojis Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <span className="absolute top-20 left-[5%] text-7xl opacity-40 animate-float-slow hover:opacity-100 transition-opacity duration-500">🎨</span>
        <span className="absolute top-40 right-[10%] text-6xl opacity-40 animate-float-slower delay-1000 hover:opacity-100 transition-opacity duration-500">🚀</span>
        <span className="absolute bottom-20 left-[15%] text-8xl opacity-30 animate-float-slow delay-2000 hover:opacity-100 transition-opacity duration-500">🦕</span>
        <span className="absolute bottom-1/2 right-[5%] text-5xl opacity-40 animate-float-slower delay-3000 hover:opacity-100 transition-opacity duration-500">🌟</span>
        <span className="absolute top-[15%] left-[50%] text-6xl opacity-20 animate-float-slow delay-1500 hover:opacity-100 transition-opacity duration-500">🏰</span>
        <span className="absolute bottom-[10%] left-[50%] text-5xl opacity-30 animate-float-slower delay-500 hover:opacity-100 transition-opacity duration-500">🍭</span>
      </div>

      <header className="mb-8 text-center no-print flex flex-col md:flex-row justify-center items-center gap-8 relative z-10 w-full px-4">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <img
            src="https://bvhbrbidsdytynfarlth.supabase.co/storage/v1/object/public/imagenes/edubook-ai.jpg"
            alt="Niños explorando y aprendiendo"
            className="relative h-32 md:h-48 w-auto rounded-[1.8rem] shadow-xl border-4 border-white transform hover:scale-105 transition-transform duration-300 object-cover bg-white"
          />
        </div>

      </header>

      <main className="container mx-auto relative z-10">
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border-l-8 border-red-500 text-red-700 rounded-r-xl shadow-lg flex justify-between items-center animate-bounce-short">
            <p className="font-bold">⚠️ {error}</p>
            <button onClick={() => setError(null)} className="font-black hover:bg-red-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
          </div>
        )}

        {!book ? (
          <SetupForm onSubmit={handleCreateBook} isLoading={loading} />
        ) : (
          <BookViewer book={book} onReset={resetApp} />
        )}
      </main>

      {/* Voice Agent Section - Luka */}
      <section className="container mx-auto mt-8 mb-8 no-print relative z-10">
        <VoiceAgent />
      </section>

      {/* Video Section */}
      <section className="container mx-auto mt-8 mb-8 no-print relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg p-6 md:p-8 rounded-[2.5rem] shadow-2xl border-4 border-white/50 transform rotate-1 hover:rotate-0 transition-transform duration-500">
            <div className="absolute -top-6 -left-6 bg-yellow-400 text-yellow-900 p-4 rounded-full shadow-lg transform -rotate-12 text-3xl z-20 font-black border-4 border-white">
              📺
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-center text-blue-900 mb-6 flex items-center justify-center gap-3 drop-shadow-sm">
              Deja volar tu imaginación
            </h2>
            <div className="relative rounded-2xl overflow-hidden shadow-inner bg-black aspect-video border-8 border-blue-100">
              <video
                controls
                className="w-full h-full object-cover"
              >
                <source src="/nina-leyendo.mp4" type="video/mp4" />
                Tu navegador no soporta el elemento de video.
              </video>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 text-center text-blue-800/60 text-sm no-print font-bold relative z-10">
        <p>✨ Potenciado por Google Gemini API ✨</p>
      </footer>

      <style>{`
        .font-fredoka { font-family: 'Fredoka', sans-serif; }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float-slow {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float 8s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .bg-pattern {
           background-image: radial-gradient(#6366f1 2px, transparent 2px), radial-gradient(#ec4899 2px, transparent 2px);
           background-size: 50px 50px;
           background-position: 0 0, 25px 25px;
        }
      `}</style>
    </div>
  );
};

export default App;