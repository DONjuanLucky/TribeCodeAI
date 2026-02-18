import React, { useState, useEffect, useRef } from 'react';
import { Campfire } from './components/Campfire';
import { ChatInterface } from './components/ChatInterface';
import { PrdPreview } from './components/PrdPreview';
import { LoadingScreen } from './components/LoadingScreen';
import { Message, AppState, PrdStructure } from './types';
import { generateCodeSnippet } from './services/geminiService';
import { LiveClient } from './services/liveClient';
import { Sparkles, ArrowRight, Power, Zap, MessageSquare, Code2, Headphones, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [tribeStatus, setTribeStatus] = useState<'idle' | 'listening' | 'thinking' | 'building'>('idle');
  
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);

  const [generatedPrd, setGeneratedPrd] = useState<PrdStructure | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [history, setHistory] = useState<{prd: PrdStructure, code: string}[]>([]);

  const liveClientRef = useRef<LiveClient | null>(null);

  useEffect(() => {
    const apiKey = process.env.API_KEY || '';
    if (apiKey) {
      liveClientRef.current = new LiveClient(apiKey);
      
      liveClientRef.current.onVolumeUpdate = (uVol, aVol) => {
        setUserVolume(uVol);
        setAiVolume(aVol);
      };

      liveClientRef.current.onStatusChange = (status) => {
        setTribeStatus(status);
      };

      liveClientRef.current.onTranscriptUpdate = (text, isUser) => {
         setMessages(prev => {
             if (text === "System: Initialize greeting.") return prev;
             const msg: Message = {
                 id: Date.now().toString(),
                 role: isUser ? 'user' : 'model',
                 content: text,
                 timestamp: Date.now()
             };
             return [...prev, msg];
         });
      };

      liveClientRef.current.onToolTrigger = async (prd: PrdStructure) => {
          await handleLockIn(prd);
      };
    }

    return () => {
      liveClientRef.current?.disconnect();
    };
  }, []);

  const toggleConnection = async () => {
    if (isConnected) {
      liveClientRef.current?.disconnect();
      setIsConnected(false);
      setAppState(AppState.IDLE);
      setTribeStatus('idle');
    } else {
      if (!liveClientRef.current) return;
      try {
        await liveClientRef.current.connect();
        setIsConnected(true);
        setAppState(AppState.CONVERSATION);
        setMessages([{
            id: 'system-1',
            role: 'model',
            content: "Neural link established. Tribe code-forge standing by...",
            timestamp: Date.now()
        }]);
      } catch (e) {
        console.error("Connection failed", e);
        alert("Could not connect to Tribe Network. Check permissions.");
      }
    }
  };

  const handleLockIn = async (prd: PrdStructure) => {
    setGeneratedPrd(prd);
    setAppState(AppState.BUILDING);
    setTribeStatus('building');
    try {
        const code = await generateCodeSnippet(prd);
        setGeneratedCode(code);
        const newHistoryItem = { prd, code };
        setHistory(prev => [...prev, newHistoryItem]);
        setAppState(AppState.PREVIEW);
        if (liveClientRef.current && isConnected) {
            const currentVersion = history.length + 1;
            const systemFeedback = `[SYSTEM UPDATE] Forge successful. Version ${currentVersion} for "${prd.projectName}" is LIVE. Build completion acknowledged.`;
            liveClientRef.current.sendText(systemFeedback);
        }
    } catch (e) {
        console.error("Build failed", e);
        setAppState(AppState.CONVERSATION);
        setTribeStatus('listening');
    }
  };

  const isPreviewMode = appState === AppState.BUILDING || appState === AppState.PREVIEW;

  return (
    <div className="h-[100dvh] w-full flex flex-col font-sans selection:bg-campfire-500 selection:text-white bg-black text-gray-100 overflow-hidden">
      
      <header className="flex-none px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-void-800 bg-void-900/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-campfire-600 to-campfire-400 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            <Sparkles className="text-white w-3 h-3 md:w-4 md:h-4" />
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white truncate max-w-[120px] md:max-w-none">TribeCode AI</h1>
        </div>
        
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-400">
            <span className={`flex items-center gap-2 transition-all duration-500 ${appState === AppState.CONVERSATION ? "text-campfire-400 scale-105" : "text-gray-600"}`}>
                <MessageSquare size={14} /> Blueprint
            </span>
            <ArrowRight size={14} className="opacity-10" />
            <span className={`flex items-center gap-2 transition-all duration-500 ${appState === AppState.BUILDING ? "text-campfire-400 animate-pulse scale-105" : "text-gray-600"}`}>
                <Code2 size={14} /> Forge
            </span>
            <ArrowRight size={14} className="opacity-10" />
            <span className={`flex items-center gap-2 transition-all duration-500 ${appState === AppState.PREVIEW ? "text-campfire-400 scale-105" : "text-gray-600"}`}>
                <Zap size={14} /> Launch
            </span>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
             {isConnected && (
                 <div className="flex items-center gap-2 bg-campfire-950/40 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-campfire-500/30">
                    <div className="relative">
                        <span className="w-1.5 h-1.5 bg-campfire-500 rounded-full block"></span>
                        <span className="absolute inset-0 w-1.5 h-1.5 bg-campfire-500 rounded-full animate-ping"></span>
                    </div>
                    <span className="text-[8px] md:text-[10px] font-mono text-campfire-400 font-bold tracking-widest uppercase truncate max-w-[60px] md:max-w-none">
                        {tribeStatus === 'listening' ? 'Listen' : tribeStatus === 'thinking' ? 'Think' : tribeStatus === 'building' ? 'Forge' : 'Synched'}
                    </span>
                 </div>
             )}
            <button 
                onClick={toggleConnection}
                className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${isConnected ? 'bg-void-800 text-red-500 border border-red-900/40' : 'bg-campfire-600 text-white shadow-lg shadow-campfire-600/30'}`}
                aria-label={isConnected ? "Disconnect from AI Forge" : "Initialize AI Forge"}
            >
                <Power size={14} className="md:w-4 md:h-4" />
                <span className="hidden xs:inline">{isConnected ? "Stop" : "Ignite"}</span>
                <span className="xs:hidden">{isConnected ? "Off" : "On"}</span>
            </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className={`
            flex flex-col transition-all duration-700 h-full w-full
            ${isPreviewMode ? 'hidden md:flex md:w-[380px] lg:w-[440px] md:border-r md:border-void-800 bg-void-950/80' : 'flex'}
        `}>
            <div className={`flex flex-col items-center justify-center bg-gradient-to-b from-void-900 via-black to-void-900 relative overflow-hidden transition-all duration-500 ${isConnected ? 'h-[40%] md:h-[55%]' : 'h-full'}`}>
               <div className={`absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.08),transparent_60%)] transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}></div>

               {/* SEO Content Injection */}
               {!isConnected && appState === AppState.IDLE && (
                 <div className="sr-only">
                   <h2>The Future of AI Software Architecture</h2>
                   <p>TribeCode AI empowers developers and visionaries to manifest software using a conversational, voice-first forge. Iterate through high-fidelity roadmaps and cinematic 3D prototypes instantly.</p>
                 </div>
               )}

               <div className="scale-75 md:scale-100 transition-transform">
                <Campfire 
                    userVolume={userVolume}
                    aiVolume={aiVolume}
                    isActive={isConnected}
                    onClick={toggleConnection}
                    disabled={appState === AppState.BUILDING}
                    tribeStatus={tribeStatus}
                />
               </div>
               
               {isConnected && appState === AppState.CONVERSATION && (
                   <div className="absolute bottom-4 md:bottom-16 px-4 w-full flex justify-center animate-fade-in-up">
                       <div className="bg-void-900/95 backdrop-blur-2xl border border-campfire-500/30 px-4 md:px-8 py-3 md:py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center gap-1 w-full max-w-[280px] md:max-w-md group transition-all">
                           <div className="flex items-center gap-3">
                               <div className="p-2 bg-campfire-500/20 rounded-lg shrink-0">
                                    <Headphones size={18} className="text-campfire-500" />
                               </div>
                               <div className="flex flex-col min-w-0">
                                   <span className="text-gray-400 text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black truncate">Forge Protocol</span>
                                   <span className="text-white text-xs md:text-base font-bold truncate">
                                       Say <span className="text-campfire-400 font-black">"TRIBE UP"</span>
                                   </span>
                               </div>
                           </div>
                       </div>
                   </div>
               )}

               {appState === AppState.IDLE && !isConnected && (
                   <div className="absolute bottom-10 md:bottom-20 text-center px-6 max-w-lg">
                       <h2 className="text-campfire-500 text-lg md:text-2xl font-bold mb-2">Manifest Your Vision</h2>
                       <p className="text-gray-400 text-xs md:text-sm mb-6 leading-relaxed">Ignite the campfire to start a conversation with the Forge Master. We'll blueprint your roadmap and forge your cinematic 3D prototype together.</p>
                       <p className="text-campfire-600/40 text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] animate-pulse font-black leading-relaxed">Waiting for the spark of creation</p>
                   </div>
               )}
            </div>

            <div className={`flex-1 min-h-0 bg-black/60 border-t border-void-800/60 flex flex-col relative z-10 transition-opacity duration-500 ${isConnected ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <ChatInterface messages={messages} />
                <div className="p-2 md:p-3 bg-void-950 border-t border-void-800 flex justify-between items-center text-[8px] md:text-[9px] text-gray-600 font-mono uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-2">
                        <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-800'}`}></div>
                        <span>Neural Peak Active</span>
                    </div>
                    <div className="flex gap-4">
                        <a href="#blueprint" className="hover:text-campfire-400 transition-colors">Blueprint</a>
                        <a href="#forge" className="hover:text-campfire-400 transition-colors">Forge</a>
                        <span className="hidden xs:inline">TribeCode AI v2.5.0-stable</span>
                    </div>
                </div>
            </div>
        </div>

        {isPreviewMode && (
            <div className="flex-1 flex flex-col bg-void-950 overflow-hidden animate-[slideInRight_0.5s_cubic-bezier(0.16,1,0.3,1)] relative h-full w-full">
                {appState === AppState.BUILDING ? (
                    <LoadingScreen prd={generatedPrd} />
                ) : (
                    generatedPrd && (
                        <>
                          <button 
                            onClick={() => setAppState(AppState.CONVERSATION)}
                            className="md:hidden absolute top-4 left-4 z-[60] bg-void-900/90 border border-void-700 p-2 rounded-xl text-gray-300 active:scale-95 transition-transform"
                            aria-label="Back to blueprint"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <PrdPreview 
                              prd={generatedPrd} 
                              codeSnippet={generatedCode}
                              history={history}
                              onIterate={() => {
                                  setAppState(AppState.CONVERSATION);
                              }}
                          />
                        </>
                    )
                )}
            </div>
        )}
      </main>

      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 640px) {
          .xs\:hidden { display: none; }
          .xs\:inline { display: inline; }
        }
        @media (min-width: 641px) {
          .xs\:hidden { display: block; }
          .xs\:inline { display: none; }
        }
      `}</style>
    </div>
  );
};

export default App;