import React, { useState } from 'react';
import { UserPreferences, AVAILABLE_TOPICS } from '../types';
import ChatAssistant from './ChatAssistant';

interface SetupFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

const SetupForm: React.FC<SetupFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UserPreferences>({
    childName: '',
    age: 6,
    topics: [],
    difficulty: 'Medio',
    learningGoal: '',
    setting: '',
    visualStyle: '',
    coverIdea: ''
  });

  const MAX_TOPICS = 5;

  // Visual options for Style
  const VISUAL_STYLES = [
    { id: 'Dibujos animados coloridos', label: 'Cartoon', icon: '🌈', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'Acuarela suave', label: 'Acuarela', icon: '🎨', color: 'bg-pink-100 border-pink-300' },
    { id: 'Pixel Art 8-bit', label: 'Pixel Art', icon: '👾', color: 'bg-green-100 border-green-300' },
    { id: 'Realista educativo', label: 'Realista', icon: '📸', color: 'bg-blue-100 border-blue-300' },
    { id: 'Cómic de superhéroes', label: 'Cómic', icon: '💥', color: 'bg-red-100 border-red-300' },
    { id: 'Doodles y garabatos', label: 'Doodles', icon: '✏️', color: 'bg-purple-100 border-purple-300' },
  ];

  // Visual options for Difficulty
  const DIFFICULTY_LEVELS = [
    { id: 'Fácil', label: 'Fácil', icon: '🐣', desc: 'Frases cortas y simples' },
    { id: 'Medio', label: 'Medio', icon: '🦊', desc: 'Historias más detalladas' },
    { id: 'Difícil', label: 'Difícil', icon: '🦁', desc: 'Retos complejos' },
  ];

  const toggleTopic = (topic: string) => {
    setFormData(prev => {
      if (prev.topics.includes(topic)) {
        return { ...prev, topics: prev.topics.filter(t => t !== topic) };
      }
      if (prev.topics.length < MAX_TOPICS) {
        return { ...prev, topics: [...prev.topics, topic] };
      }
      return prev;
    });
  };

  const addTopicFromAI = (topic: string) => {
    setFormData(prev => {
      if (!prev.topics.includes(topic) && prev.topics.length < MAX_TOPICS) {
        return { ...prev, topics: [...prev.topics, topic] };
      }
      return prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.topics.length === 0) return;
    onSubmit({
      ...formData,
      childName: formData.childName || 'Explorador',
      visualStyle: formData.visualStyle || 'Dibujos animados coloridos'
    });
  };

  const handleChange = (field: keyof UserPreferences, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="bg-white/90 backdrop-blur-xl p-6 md:p-10 rounded-[3rem] shadow-2xl border-4 border-white/50 relative overflow-hidden">
        
        {/* Decorative background shapes inside form */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="text-center mb-10 relative z-10">
          <h1 className="text-5xl font-black text-blue-900 mb-2 drop-shadow-sm">
            ✨ Crea tu Aventura ✨
          </h1>
          <p className="text-xl text-blue-600 font-bold">¡Rellena los datos mágicos!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          
          {/* SECCIÓN 1: ¿QUIÉN ERES? */}
          <div className="bg-blue-50/80 p-8 rounded-3xl border-2 border-blue-100 shadow-inner">
            <h2 className="text-3xl font-black text-blue-800 flex items-center gap-3 mb-6">
              <span className="bg-white p-2 rounded-full shadow-md text-2xl">👤</span> 
              Sobre el Explorador
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-blue-900 font-bold mb-3 text-lg">¿Cómo te llamas?</label>
                <input
                  type="text"
                  value={formData.childName}
                  onChange={(e) => handleChange('childName', e.target.value)}
                  placeholder="Escribe tu nombre..."
                  className="w-full p-4 rounded-2xl border-4 border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-2xl font-bold text-center text-blue-800 placeholder-blue-300 bg-white shadow-sm"
                />
              </div>

              <div>
                <label className="block text-blue-900 font-bold mb-3 text-lg">
                  ¿Cuántos años tienes? <span className="bg-blue-600 text-white px-3 py-1 rounded-lg ml-2 shadow-sm transform -rotate-2 inline-block">{formData.age}</span>
                </label>
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-blue-100">
                  <span className="text-2xl">👶</span>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    value={formData.age}
                    onChange={(e) => handleChange('age', parseInt(e.target.value))}
                    className="w-full h-6 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                  />
                  <span className="text-2xl">🧑‍🎓</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DIFICULTAD Y ESTILO (VISUAL) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dificultad */}
            <div className="bg-orange-50/80 p-6 rounded-3xl border-2 border-orange-100 shadow-inner">
               <h3 className="text-2xl font-black text-orange-800 mb-4 flex items-center gap-2">
                 <span>🏆</span> Nivel de Reto
               </h3>
               <div className="grid grid-cols-3 gap-3">
                 {DIFFICULTY_LEVELS.map((level) => (
                   <button
                     key={level.id}
                     type="button"
                     onClick={() => handleChange('difficulty', level.id)}
                     className={`p-3 rounded-2xl border-b-4 transition-all flex flex-col items-center justify-center gap-1 ${
                       formData.difficulty === level.id
                         ? 'bg-orange-400 border-orange-600 text-white transform scale-105 shadow-lg'
                         : 'bg-white border-orange-200 text-gray-500 hover:bg-orange-100 hover:scale-105'
                     }`}
                   >
                     <span className="text-3xl filter drop-shadow-sm">{level.icon}</span>
                     <span className="font-bold text-sm">{level.label}</span>
                   </button>
                 ))}
               </div>
            </div>

            {/* Estilo Visual */}
            <div className="bg-pink-50/80 p-6 rounded-3xl border-2 border-pink-100 shadow-inner">
               <h3 className="text-2xl font-black text-pink-800 mb-4 flex items-center gap-2">
                 <span>🎨</span> Estilo de los Dibujos
               </h3>
               <div className="grid grid-cols-3 gap-3">
                 {VISUAL_STYLES.map((style) => (
                   <button
                     key={style.id}
                     type="button"
                     onClick={() => handleChange('visualStyle', style.id)}
                     className={`p-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 h-24 ${
                       formData.visualStyle === style.id
                         ? `${style.color} ring-2 ring-offset-2 ring-pink-300 transform scale-105 shadow-md`
                         : 'bg-white border-gray-100 hover:bg-white hover:shadow-md text-gray-400 grayscale hover:grayscale-0'
                     }`}
                   >
                     <span className="text-3xl">{style.icon}</span>
                     <span className="text-[10px] font-bold uppercase leading-tight">{style.label}</span>
                   </button>
                 ))}
               </div>
            </div>
          </div>

          {/* SECCIÓN 3: DETALLES DE LA HISTORIA */}
          <div className="bg-purple-50/80 p-8 rounded-3xl border-2 border-purple-100 shadow-inner space-y-6">
            <h2 className="text-3xl font-black text-purple-800 flex items-center gap-3">
              <span>🏰</span> Tu Historia
            </h2>

            <div>
              <label className="block text-purple-900 font-bold mb-2">🌍 ¿Dónde ocurre la aventura?</label>
              <input
                type="text"
                value={formData.setting || ''}
                onChange={(e) => handleChange('setting', e.target.value)}
                placeholder="Ej. En un castillo de nubes, En el fondo del mar..."
                className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none bg-white text-lg"
              />
            </div>

            <div>
               <label className="block text-purple-900 font-bold mb-2">🛡️ Misión Especial (Objetivo)</label>
               <input
                  type="text"
                  value={formData.learningGoal || ''}
                  onChange={(e) => handleChange('learningGoal', e.target.value)}
                  placeholder="Ej. Aprender a compartir, Las tablas de multiplicar..."
                  className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none bg-white text-lg"
               />
            </div>
            
             <div>
               <label className="block text-purple-900 font-bold mb-2">📕 Idea para la Portada</label>
               <input
                  type="text"
                  value={formData.coverIdea || ''}
                  onChange={(e) => handleChange('coverIdea', e.target.value)}
                  placeholder="Ej. Un dragón comiendo helado..."
                  className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none bg-white text-lg"
               />
            </div>
          </div>

          {/* SECCIÓN 4: TEMAS */}
          <div className="bg-white p-8 rounded-3xl border-4 border-indigo-100 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🚀</div>
            <label className="block text-indigo-900 font-black mb-6 text-2xl text-center">
              ¿Qué te gusta? <span className="text-base font-normal text-indigo-500 block mt-1">(Elige hasta {MAX_TOPICS})</span>
            </label>
            
            <div className="flex flex-wrap justify-center gap-3 mb-8 min-h-[60px]">
               {formData.topics.map((topic) => (
                 <span key={topic} className="animate-bounce-short bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transform hover:scale-110 transition-transform cursor-pointer border-b-4 border-indigo-800" onClick={() => toggleTopic(topic)}>
                   {topic} <span className="opacity-50 text-xs">❌</span>
                 </span>
               ))}
               {formData.topics.length === 0 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-400 w-full text-center">
                     ¡Selecciona temas abajo o pídeselos al asistente mágico! 👇
                  </div>
               )}
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {AVAILABLE_TOPICS.map((topic) => {
                const isSelected = formData.topics.includes(topic);
                if (isSelected) return null;
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    disabled={formData.topics.length >= MAX_TOPICS}
                    className={`px-5 py-2 rounded-full text-lg font-bold border-2 transition-all hover:-translate-y-1 ${
                       formData.topics.length >= MAX_TOPICS
                       ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                       : 'border-indigo-100 text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm'
                    }`}
                  >
                    + {topic}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || formData.topics.length === 0}
            className={`w-full py-6 rounded-3xl text-3xl font-black text-white shadow-[0_10px_0_0_rgba(0,0,0,0.1)] transition-all transform active:translate-y-2 active:shadow-none relative overflow-hidden group ${
              isLoading || formData.topics.length === 0
                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3 animate-pulse">
                🔮 Creando magia...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-4">
                 🚀 ¡DESPEGAR! 🚀
              </span>
            )}
          </button>
        </form>
      </div>
      
      {/* Floating Chat Assistant */}
      <ChatAssistant onAddTopic={addTopicFromAI} selectedTopics={formData.topics} />
      
      <style>{`
         @keyframes bounce-short {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
         }
         .animate-bounce-short {
            animation: bounce-short 0.5s ease-in-out;
         }
      `}</style>
    </div>
  );
};

export default SetupForm;