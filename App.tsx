import React, { useState, useEffect, useRef } from 'react';
import { Campfire } from './components/Campfire';
import { ChatInterface } from './components/ChatInterface';
import { PrdPreview } from './components/PrdPreview';
import { LoadingScreen } from './components/LoadingScreen';
import { Message, AppState, PrdStructure } from './types';
import { generateCodeSnippet } from './services/geminiService';
import { LiveClient } from './services/liveClient';
import { Sparkles, ArrowRight, Power, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Audio Volumes for Visualizer
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);

  const [generatedPrd, setGeneratedPrd] = useState<PrdStructure | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  
  // History / Changelog tracking
  const [history, setHistory] = useState<{prd: PrdStructure, code: string}[]>([]);

  // Use a Ref for the client so it persists
  const liveClientRef = useRef<LiveClient | null>(null);

  useEffect(() => {
    // Initialize LiveClient with API Key from Env
    const apiKey = process.env.API_KEY || '';
    if (apiKey) {
      liveClientRef.current = new LiveClient(apiKey);
      
      // Hook up callbacks
      liveClientRef.current.onVolumeUpdate = (uVol, aVol) => {
        setUserVolume(uVol);
        setAiVolume(aVol);
      };

      liveClientRef.current.onTranscriptUpdate = (text, isUser) => {
         setMessages(prev => {
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
    } else {
      if (!liveClientRef.current) return;
      try {
        await liveClientRef.current.connect();
        setIsConnected(true);
        setAppState(AppState.CONVERSATION);
        
        setMessages([{
            id: 'system-1',
            role: 'model',
            content: "Tribe connection established.",
            timestamp: Date.now()
        }]);

        // Note: The LiveClient now handles the initial system instruction and greeting 
        // in its handleOpen method to ensure robust connection first.

      } catch (e) {
        console.error("Connection failed", e);
        alert("Could not connect to Tribe Network. Check permissions.");
      }
    }
  };

  const handleLockIn = async (prd: PrdStructure) => {
    console.log("Lock-in Triggered", prd);
    
    // 1. Immediate UI Feedback
    setGeneratedPrd(prd);
    setAppState(AppState.BUILDING);
    
    // 2. Heavy lifting (Code Gen)
    // We do this while the loading screen is showing
    try {
        const code = await generateCodeSnippet(prd);
        setGeneratedCode(code);
        
        // 3. Add to History
        setHistory(prev => [...prev, { prd, code }]);

        // 4. Move to Preview only after code is ready
        setAppState(AppState.PREVIEW);

        // 5. Notify AI to present it
        if (liveClientRef.current && isConnected) {
            liveClientRef.current.sendText("System: The app is now visible on screen. Present it to the user and ask for feedback.");
        }
    } catch (e) {
        console.error("Build failed", e);
        setAppState(AppState.CONVERSATION); // Revert on failure
    }
  };

  const isPreviewMode = appState === AppState.BUILDING || appState === AppState.PREVIEW;

  return (
    <div className="h-[100dvh] w-full flex flex-col font-sans selection:bg-campfire-500 selection:text-white bg-black text-gray-100 overflow-hidden">
      
      {/* Header */}
      <header className="flex-none px-6 py-4 flex items-center justify-between border-b border-void-800 bg-void-900/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-campfire-600 to-campfire-400 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)]">
            <Sparkles className="text-white w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">TribeCode AI</h1>
        </div>
        
        {/* Progress Stepper (Desktop) */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
            <span className={appState === AppState.CONVERSATION ? "text-campfire-400" : ""}>01 Vision</span>
            <ArrowRight size={14} />
            <span className={appState === AppState.BUILDING ? "text-campfire-400 animate-pulse" : ""}>02 Structure</span>
            <ArrowRight size={14} />
            <span className={appState === AppState.PREVIEW ? "text-campfire-400" : ""}>03 Execution</span>
        </div>

        <div className="flex items-center gap-3">
             {isConnected && (
                 <div className="flex items-center gap-2 animate-pulse bg-red-900/20 px-2 py-1 rounded-full border border-red-900/50">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <span className="text-[10px] font-mono text-red-400 font-bold tracking-wider">LIVE</span>
                 </div>
             )}
            <button 
                onClick={toggleConnection}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isConnected ? 'bg-void-800 hover:bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-campfire-600 hover:bg-campfire-500 text-white shadow-lg shadow-campfire-600/20'}`}
            >
                <Power size={16} />
                <span className="hidden md:inline">{isConnected ? "Disconnect" : "Connect Tribe"}</span>
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Panel: Conversation & Campfire */}
        <div className={`
            flex flex-col transition-all duration-500
            ${isPreviewMode ? 'hidden md:flex md:w-[400px] md:border-r md:border-void-700' : 'flex-1 w-full'}
        `}>
            
            {/* Visualizer Area */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] bg-gradient-to-b from-void-900 to-void-800 relative overflow-hidden">
               
               {/* Background Glow */}
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-campfire-600/10 rounded-full blur-[100px] transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}></div>

               <Campfire 
                  userVolume={userVolume}
                  aiVolume={aiVolume}
                  isActive={isConnected}
                  onClick={toggleConnection}
                  disabled={appState === AppState.BUILDING}
               />
               
               {/* PROMINENT INSTRUCTION */}
               {isConnected && appState === AppState.CONVERSATION && (
                   <div className="absolute bottom-10 animate-fade-in-up">
                       <div className="bg-void-900/80 backdrop-blur-md border border-campfire-500/30 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                           <Zap size={16} className="text-campfire-400 fill-campfire-400" />
                           <span className="text-gray-300 text-sm font-medium">
                               Ready to build? Say <span className="text-campfire-400 font-bold text-lg">"Tribe Up"</span>
                           </span>
                       </div>
                   </div>
               )}

               {/* Idle Tip */}
               {appState === AppState.IDLE && !isConnected && (
                   <div className="absolute bottom-10 text-center opacity-0 animate-[fadeIn_1s_ease-in_forwards_1s]">
                       <p className="text-gray-500 text-sm mb-4">Tap the campfire to summon the tribe.</p>
                   </div>
               )}
            </div>

            {/* Chat Area (Transcript) */}
            <div className="h-[40%] md:h-[40%] bg-void-900 border-t border-void-800 flex flex-col relative z-10">
                <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-void-900 to-transparent z-10 pointer-events-none"></div>
                <ChatInterface messages={messages} />
                
                {/* Connection Status Footer */}
                <div className="p-3 bg-void-950 border-t border-void-800 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                    <span>Model: gemini-2.5-flash-native</span>
                    <span>{isConnected ? "Listening for Trigger" : "Standby"}</span>
                </div>
            </div>
        </div>

        {/* Right Panel: Preview / Loading */}
        {isPreviewMode && (
            <div className="flex-1 flex flex-col bg-void-950 overflow-hidden animate-[slideInRight_0.5s_ease-out] relative h-full">
                {appState === AppState.BUILDING ? (
                    <LoadingScreen prd={generatedPrd} />
                ) : (
                    generatedPrd && (
                        <PrdPreview 
                            prd={generatedPrd} 
                            codeSnippet={generatedCode}
                            history={history}
                            onIterate={() => {
                                setAppState(AppState.CONVERSATION);
                            }}
                        />
                    )
                )}

                {/* Floating Mobile Campfire Control for Preview Mode */}
                <div className="md:hidden absolute bottom-6 right-6 z-50">
                     <div className="bg-void-900/90 backdrop-blur-md rounded-full border border-campfire-500/30 shadow-2xl p-2 flex items-center justify-center">
                        <Campfire 
                           variant="mini"
                           userVolume={userVolume}
                           aiVolume={aiVolume}
                           isActive={isConnected}
                           onClick={toggleConnection}
                        />
                     </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;