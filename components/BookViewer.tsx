import React, { useState, useRef } from 'react';
import { GeneratedBook } from '../types';
import ActivityRenderer from './ActivityRenderer';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BookViewerProps {
  book: GeneratedBook;
  onReset: () => void;
}

const BookViewer: React.FC<BookViewerProps> = ({ book, onReset }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Reference container to capture
  const bookContainerRef = useRef<HTMLDivElement>(null);

  const totalPages = book.pages.length + 1; // +1 for cover

  const handleNext = () => {
     if (currentPage < totalPages - 1) {
        setCurrentPage(p => p + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
     } else {
        setShowCelebration(true);
     }
  };

  const handlePrev = () => {
     setCurrentPage(p => Math.max(0, p - 1));
     window.scrollTo({ top: 0, behavior: 'smooth' });
     setShowCelebration(false);
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    
    // Allow React to render all pages (by setting isExporting true in render logic)
    // We wait a small delay to ensure DOM is updated
    setTimeout(async () => {
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Select all page elements that we want to capture
        // We look for elements with the class 'book-page-export'
        const pagesToCapture = document.querySelectorAll('.book-page-export');

        for (let i = 0; i < pagesToCapture.length; i++) {
          const element = pagesToCapture[i] as HTMLElement;
          
          // Capture the element
          const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true, // Allow cross-origin images
            logging: false,
            backgroundColor: null // Preserve transparency if any
          });

          const imgData = canvas.toDataURL('image/png');
          const imgProps = pdf.getImageProperties(imgData);
          
          // Calculate height to fit width (maintain aspect ratio)
          const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          // If not the first page, add a new page
          if (i > 0) pdf.addPage();
          
          // Add image to PDF
          // Centering vertically if it's shorter than A4, or starting at top
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        }

        pdf.save(`EduBook-${book.cover.title.replace(/\s+/g, '-')}.pdf`);
      } catch (error) {
        console.error("Error creating PDF:", error);
        alert("Hubo un error generando el PDF. Por favor intenta de nuevo.");
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };
  
  // Progress Calculation
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <div className="max-w-4xl mx-auto w-full relative" ref={bookContainerRef}>
      
      {/* Top Navigation & Progress */}
      <div className={`no-print mb-8 sticky top-4 z-50 ${isExporting ? 'opacity-0' : 'opacity-100'}`}>
         <div className="bg-white/90 backdrop-blur-md p-4 rounded-full shadow-lg border border-gray-100 flex items-center gap-4 justify-between">
            <button
               onClick={onReset}
               className="bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-500 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors"
               title="Salir"
               disabled={isExporting}
            >
               ✕
            </button>
            
            {/* Progress Bar */}
            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300 relative">
               <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
               ></div>
               <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-500 uppercase tracking-widest mix-blend-multiply">
                  Nivel {currentPage + 1} / {totalPages}
               </div>
            </div>

            <button
               onClick={handleDownloadPDF}
               disabled={isExporting}
               className={`${isExporting ? 'bg-gray-300 cursor-wait' : 'bg-green-100 hover:bg-green-200 text-green-700'} px-4 h-10 rounded-full flex items-center justify-center transition-colors gap-2 font-bold text-sm min-w-[140px]`}
               title="Descargar PDF con Imágenes"
            >
               {isExporting ? (
                 <>
                   <span className="animate-spin">⏳</span> Generando...
                 </>
               ) : (
                 <>
                   <span>📥</span> <span className="hidden sm:inline">Guardar PDF</span>
                 </>
               )}
            </button>
         </div>
      </div>

      {/* Book Container */}
      {/* If Exporting, we show ALL pages stacked vertically so html2canvas can find them. 
          If viewing, we show only current page. */}
      <div className="relative">
        
        {/* COVER PAGE */}
        <div 
          className={`book-page book-page-export mb-8 p-8 md:p-12 rounded-[3rem] shadow-2xl text-center relative overflow-hidden flex flex-col justify-between border-8 border-white
            ${(isExporting || currentPage === 0) ? 'block' : 'hidden'}`}
          style={{ 
            backgroundColor: book.cover.colorTheme || '#4f46e5',
            color: '#fff',
            minHeight: '800px'
          }}
        >
           {/* Decorative elements */}
           <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

           <div className="relative z-10 flex-1 flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-[2rem] p-8 border-2 border-white/20 shadow-inner w-full">
              <span className="bg-white/20 px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-6 uppercase border border-white/30">EduBook AI Original</span>
              
              <h1 className="text-5xl md:text-7xl font-black mb-4 drop-shadow-lg leading-tight text-white" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                {book.cover.title}
              </h1>
              
              <div className="w-24 h-2 bg-white/50 rounded-full mb-6"></div>

              <p className="text-2xl md:text-3xl font-medium italic mb-10 text-white/90">
                {book.cover.subtitle}
              </p>

              {/* Cover Art - Generated Image or Placeholder */}
              <div className="w-full max-w-sm aspect-square bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-2 mb-8 text-gray-400 group relative overflow-hidden border-8 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  {book.coverImageBase64 ? (
                    <img 
                      src={`data:image/jpeg;base64,${book.coverImageBase64}`} 
                      alt="Portada generada por IA" 
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <>
                      <div className="text-8xl mb-4 grayscale opacity-80 group-hover:scale-110 transition-transform">🎨</div>
                      <p className="text-xs uppercase font-bold text-gray-400 mb-2">Ilustración sugerida:</p>
                      <p className="text-sm text-center font-medium text-gray-600 px-4">
                        "{book.cover.visualDescription}"
                      </p>
                    </>
                  )}
              </div>
           </div>
           
           {!isExporting && (
             <div className="relative z-10 mt-8 no-print">
                <p className="font-bold text-white/60 text-sm">¡Abre el libro para comenzar la aventura!</p>
                <div className="animate-bounce mt-2 text-3xl">⬇️</div>
             </div>
           )}
        </div>

        {/* CONTENT PAGES */}
        {book.pages.map((page, index) => {
          const isVisible = isExporting || (currentPage === index + 1);
          
          return (
            <div
              key={index}
              className={`book-page book-page-export bg-white p-6 md:p-12 rounded-[2.5rem] shadow-xl min-h-[800px] border-4 relative overflow-hidden transition-all duration-300 mb-8 
                ${isVisible ? 'block' : 'hidden'}`}
              style={{ borderColor: page.colorTheme || '#e5e7eb' }}
            >
              {/* Corner Fold Effect */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gray-200 to-white shadow-lg rounded-bl-3xl z-20 pointer-events-none opacity-50"></div>

              {/* Page Number */}
              <div className="absolute top-6 left-6 w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner bg-gray-100 text-gray-400 border border-gray-200">
                 {index + 1}
              </div>

              {/* Header */}
              <div className="flex flex-col items-center mb-8 pt-6">
                 <span 
                   className="text-xs font-black text-white px-4 py-1 rounded-full uppercase tracking-widest shadow-md mb-3 transform -rotate-2"
                   style={{ backgroundColor: page.colorTheme || '#9ca3af' }}
                 >
                   {page.type}
                 </span>
                 <h2 className="text-3xl md:text-4xl font-black text-gray-800 text-center leading-tight">{page.title}</h2>
              </div>

              {/* Visual Description Helper (Hidden in print) */}
              {page.visualElements && (
                 <div className={`mb-8 mx-auto w-full bg-blue-50 border-2 border-blue-200 rounded-xl p-4 opacity-90 ${isExporting ? '' : 'no-print'}`}>
                    <p className="text-xs font-bold text-blue-500 uppercase mb-2 tracking-widest text-center">🧠 Elementos Visuales Clave</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                       {Object.entries(page.visualElements).map(([key, value]) => (
                          <div key={key} className="bg-white p-2 rounded-lg shadow-sm border border-blue-100">
                             <span className="block text-[10px] text-gray-400 uppercase">{key}</span>
                             <span className="text-sm font-bold text-gray-700 leading-tight">{value}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              {/* Content */}
              <ActivityRenderer page={page} />

            </div>
          );
        })}
        
        {/* Celebration Screen (End of book) */}
        {!isExporting && showCelebration && (
           <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-purple-500 rounded-[3rem] flex flex-col items-center justify-center text-white p-8 shadow-2xl z-20 text-center animate-in zoom-in duration-300">
              <div className="text-9xl mb-6 animate-bounce">🏆</div>
              <h2 className="text-5xl font-black mb-4 text-yellow-300 drop-shadow-md">¡Felicidades!</h2>
              <p className="text-2xl mb-8 font-medium">Has completado tu aventura mágica.</p>
              <div className="flex gap-4">
                 <button onClick={handlePrev} className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full font-bold transition-all">
                    Volver atrás
                 </button>
                 <button onClick={onReset} className="bg-white text-purple-600 px-8 py-3 rounded-full font-black shadow-lg hover:scale-105 transition-all">
                    Crear Nueva Aventura 🚀
                 </button>
              </div>
           </div>
        )}
      </div>

      {/* Big Navigation Buttons (Bottom) - Hidden on Export */}
      <div className={`no-print flex justify-between items-center mt-8 px-4 pb-12 ${isExporting ? 'hidden' : 'flex'}`}>
         <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-gray-100 flex items-center justify-center text-2xl text-gray-400 hover:text-blue-500 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-110"
         >
            ⬅️
         </button>
         
         <div className="text-gray-400 font-bold text-sm uppercase tracking-widest">
            {currentPage === 0 ? 'Portada' : currentPage > book.pages.length ? 'Final' : 'Leyendo...'}
         </div>

         <button
            onClick={handleNext}
            disabled={showCelebration}
            className={`h-16 px-8 rounded-full shadow-xl flex items-center justify-center text-xl font-black text-white transition-all transform hover:scale-105 ${
               currentPage === book.pages.length 
               ? 'bg-green-500 hover:bg-green-600' // Finish button style
               : 'bg-blue-600 hover:bg-blue-700'
            }`}
         >
            {currentPage === book.pages.length ? '¡Terminar! 🏆' : 'Siguiente ➡️'}
         </button>
      </div>
    </div>
  );
};

export default BookViewer;