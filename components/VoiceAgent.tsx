import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// --- Audio Helpers (Encoding/Decoding) ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Convert Float32 (-1.0 to 1.0) to Int16
    let s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceAgent: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTalking, setIsTalking] = useState(false); // Visual indicator for agent
  const [error, setError] = useState<string | null>(null);

  // Refs for audio handling to avoid re-renders
  const sessionRef = useRef<any>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCall();
    };
  }, []);

  const startCall = async () => {
    setError(null);
    try {
      const apiKey = (import.meta as any).env.VITE_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });

      // 1. Setup Audio Contexts
      // Input: 16kHz required by Gemini
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output: 24kHz required by Gemini
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      // 2. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-latest',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              // 'Puck' is often a good male voice. Others: 'Charon', 'Fenrir', 'Zephyr'.
              prebuiltVoiceConfig: { voiceName: 'Puck' }
            },
          },
          systemInstruction: `
            Tu nombre es Luka. Eres un asistente profesional, amable y paciente experto en educación infantil. 
            Eres un hombre.
            Habla SIEMPRE en Español.
            Tu acento debe ser Latino Neutro (evita modismos específicos de un solo país).
            Tu objetivo es ayudar a padres y niños a crear historias creativas.
            Sé conciso y carismático.
          `,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            console.log("Conexión con Luka establecida");

            // Setup Audio Processing ONLY after connection is open
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);

            sourceRef.current = source;
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (isMuted) return; // Don't send data if muted

              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);

              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

            if (base64Audio) {
              setIsTalking(true);
              const ctx = outputContextRef.current;
              if (!ctx) return;

              // Sync playback time
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);

              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsTalking(false);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log("Interrupción detectada");
              sourcesRef.current.forEach(source => source.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: () => {
            console.log("Conexión cerrada");
            stopCall();
          },
          onerror: (err) => {
            console.error("Error en Live API", err);
            setError("Error de conexión. Intenta de nuevo.");
            stopCall();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Error starting call:", err);
      setError("No se pudo acceder al micrófono o conectar.");
      stopCall();
    }
  };

  const stopCall = async () => {
    setIsConnected(false);
    setIsTalking(false);

    // Close Session
    if (sessionRef.current) {
      // sessionRef is a Promise, wait for it then close
      const session = await sessionRef.current;
      session.close();
      sessionRef.current = null;
    }

    // Stop Microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Disconnect Audio Nodes
    if (sourceRef.current) sourceRef.current.disconnect();
    if (processorRef.current) processorRef.current.disconnect();

    // Close Contexts
    if (inputContextRef.current) inputContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();

    // Clear buffer sources
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border-4 border-slate-100 overflow-hidden relative max-w-sm mx-auto my-8">
      {/* Header Professional */}
      <div className="bg-slate-800 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden bg-slate-600 flex items-center justify-center ${isTalking ? 'ring-4 ring-green-400 transition-all' : ''}`}>
              {/* Avatar SVG */}
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-slate-200" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM5 22v-2a7 7 0 0 1 14 0v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {isConnected && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
            )}
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Luka</h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Agente Educativo</p>
          </div>
        </div>
        {isConnected && (
          <div className="flex gap-1 items-end h-6">
            {/* Fake visualizer bars */}
            <div className={`w-1 bg-green-400 rounded-full ${isTalking ? 'animate-pulse h-6' : 'h-2'}`}></div>
            <div className={`w-1 bg-green-400 rounded-full ${isTalking ? 'animate-pulse h-4 delay-75' : 'h-2'}`}></div>
            <div className={`w-1 bg-green-400 rounded-full ${isTalking ? 'animate-pulse h-5 delay-150' : 'h-2'}`}></div>
          </div>
        )}
      </div>

      {/* Body / Status */}
      <div className="p-8 text-center bg-slate-50 min-h-[200px] flex flex-col items-center justify-center">
        {error ? (
          <div className="text-red-500 font-medium bg-red-50 px-4 py-2 rounded-lg text-sm">{error}</div>
        ) : !isConnected ? (
          <p className="text-slate-500 font-medium">
            Hola, soy Luka. <br />¿Necesitas ayuda con tu cuento?
          </p>
        ) : (
          <p className="text-slate-600 font-medium animate-pulse">
            {isTalking ? "Luka está hablando..." : isMuted ? "Micrófono silenciado" : "Te estoy escuchando..."}
          </p>
        )}

        {!isConnected && (
          <div className="mt-4 text-4xl text-slate-300">🎙️</div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-6 border-t border-slate-100 flex items-center justify-center gap-6">
        {!isConnected ? (
          <button
            onClick={startCall}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
            title="Iniciar Llamada"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`rounded-full w-14 h-14 flex items-center justify-center border-2 transition-all ${isMuted ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              title={isMuted ? "Activar Micrófono" : "Silenciar"}
            >
              {isMuted ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              )}
            </button>

            <button
              onClick={stopCall}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
              title="Colgar"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-135">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceAgent;