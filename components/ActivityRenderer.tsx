import React, { useState } from 'react';
import { BookPage, ActivityType } from '../types';

interface ActivityRendererProps {
  page: BookPage;
}

const ActivityRenderer: React.FC<ActivityRendererProps> = ({ page }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Text to Speech Function
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES'; // Spanish
      utterance.rate = 0.9; // Slightly slower for kids
      utterance.pitch = 1.1; // Slightly higher pitch
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Tu navegador no soporta lectura en voz alta.");
    }
  };

  const renderContent = () => {
    switch (page.type) {
      case ActivityType.STORY:
        return (
          <div className="flex flex-col h-full gap-6">
            {/* Image Section */}
            <div className="flex-1 w-full relative min-h-[250px] md:min-h-[350px]">
                <div className="absolute inset-0 bg-gray-100 rounded-3xl shadow-inner border-4 border-white flex items-center justify-center overflow-hidden transform rotate-1 hover:rotate-0 transition-all duration-500">
                    {page.imageBase64 ? (
                        <img 
                            src={`data:image/jpeg;base64,${page.imageBase64}`} 
                            alt={page.imageDescription || "Ilustración del cuento"} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-center p-4 text-gray-400">
                            <span className="text-6xl mb-2 block">🖼️</span>
                            <span className="text-xs uppercase font-bold tracking-widest">Creando ilustración...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Section */}
            <div className="flex-shrink-0 bg-white/50 backdrop-blur-sm p-4 rounded-2xl">
                <div className="prose prose-lg md:prose-xl text-gray-800 mx-auto leading-relaxed font-medium text-justify md:text-left">
                <button 
                    onClick={() => speakText(page.content)}
                    className={`float-right ml-4 mb-2 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-lg border-4 transition-all hover:scale-110 ${isSpeaking ? 'bg-red-100 border-red-400 animate-pulse' : 'bg-yellow-100 border-yellow-400'}`}
                    title={isSpeaking ? "Detener lectura" : "Leer en voz alta"}
                >
                    {isSpeaking ? '🤫' : '🗣️'}
                </button>
                <p className="whitespace-pre-line">{page.content}</p>
                </div>
            </div>
          </div>
        );

      case ActivityType.QUIZ:
        return (
          <div className="space-y-8 max-w-2xl mx-auto h-full flex flex-col justify-center">
            <div className="bg-indigo-50 p-8 rounded-[2rem] border-l-8 border-indigo-400 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl transform rotate-12">❓</div>
               <p className="text-2xl md:text-3xl font-bold text-indigo-900 leading-snug relative z-10">{page.content}</p>
            </div>
            
            <div className="grid gap-4 w-full">
              {page.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                     if (!showAnswer) {
                        setSelectedOption(idx);
                     }
                  }}
                  className={`w-full text-left p-5 rounded-2xl border-b-4 transition-all transform flex justify-between items-center group relative overflow-hidden ${
                    showAnswer
                      ? option.isCorrect
                        ? 'bg-green-100 border-green-500 text-green-900 scale-105 shadow-lg'
                        : selectedOption === idx
                        ? 'bg-red-100 border-red-500 text-red-900 opacity-80'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                      : selectedOption === idx
                      ? 'bg-indigo-100 border-indigo-500 shadow-md translate-y-1 border-b-2'
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:-translate-y-1 hover:shadow-md'
                  }`}
                >
                  <span className="font-bold text-xl relative z-10 flex items-center gap-4">
                     <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border-2 shadow-sm ${showAnswer && option.isCorrect ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                        {String.fromCharCode(65 + idx)}
                     </span>
                     {option.text}
                  </span>
                  
                  {showAnswer && option.isCorrect && <span className="text-3xl animate-bounce">🌟</span>}
                  {showAnswer && !option.isCorrect && selectedOption === idx && <span className="text-3xl">🙈</span>}
                </button>
              ))}
            </div>

            {selectedOption !== null && !showAnswer && (
              <div className="text-center mt-6">
                 <button
                   onClick={() => setShowAnswer(true)}
                   className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-10 py-4 rounded-full font-black text-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all animate-pulse"
                 >
                   ✨ Comprobar ✨
                 </button>
              </div>
            )}
            
            {showAnswer && (
               <div className={`text-center p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 border-4 ${page.options?.[selectedOption!]?.isCorrect ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
                 <p className="text-2xl font-black">
                    {page.options?.[selectedOption!]?.isCorrect ? "¡EXCELENTE! 🎉" : "¡Casi! Inténtalo de nuevo. 💪"}
                 </p>
               </div>
            )}
          </div>
        );

      // Keep default for fallback, though not used in new prompt
      default:
        return <p className="text-xl">{page.content}</p>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {renderContent()}
      
      {page.hint && (
        <div className="mt-4 mx-auto max-w-lg cursor-pointer group perspective w-full">
           <div className="relative transform transition-transform duration-500 preserve-3d group-hover:rotate-x-12">
              <div className="bg-yellow-50 p-3 rounded-xl text-yellow-800 flex items-center gap-3 border border-yellow-200 shadow-sm hover:bg-yellow-100 transition-colors">
                <span className="text-2xl">🤔</span>
                <div className="flex-1">
                   <p className="font-bold text-[10px] text-yellow-600 uppercase tracking-wider">Pregunta Mágica</p>
                   <p className="font-medium text-sm md:text-base leading-tight">{page.hint}</p>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ActivityRenderer;