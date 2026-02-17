import React, { useState } from 'react';
import { PrdStructure } from '../types';
import { Code, Layers, Palette, Terminal, Eye, FileJson, History, Mic, Github, TrendingUp, CheckCircle2, BarChart3, Wand2 } from 'lucide-react';
import { GitHubExportModal } from './GitHubExportModal';

interface PrdPreviewProps {
  prd: PrdStructure;
  codeSnippet: string;
  history: {prd: PrdStructure, code: string}[];
  onIterate: () => void;
}

export const PrdPreview: React.FC<PrdPreviewProps> = ({ prd, codeSnippet, history, onIterate }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'details' | 'history' | 'roadmap' | 'market'>('preview');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  const tabs = [
    { id: 'preview', icon: Eye, label: 'Live' },
    { id: 'details', icon: FileJson, label: 'Details' },
    { id: 'market', icon: BarChart3, label: 'Market' },
    { id: 'roadmap', icon: TrendingUp, label: 'Road' },
    { id: 'history', icon: History, label: 'Logs' },
    { id: 'code', icon: Code, label: 'Code' },
  ] as const;

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-void-800 md:rounded-2xl md:border md:border-campfire-900/30 md:shadow-2xl overflow-hidden relative">
      
      <GitHubExportModal 
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        prd={prd}
        code={codeSnippet}
      />

      {/* Header */}
      <div className="p-3 md:p-4 border-b border-void-700 bg-void-900/50 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 z-10 gap-3">
        <div className="min-w-0 w-full sm:w-auto ml-10 md:ml-0">
           <h2 className="text-lg md:text-xl font-bold text-white tracking-tight truncate pr-4">{prd.projectName || "Project Alpha"}</h2>
           <div className="flex items-center gap-2">
             <span className="text-campfire-400 font-mono text-[9px] md:text-[10px] uppercase tracking-wider">Build v{history.length}.0</span>
           </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button 
                onClick={() => setIsGitHubModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] md:text-xs font-bold transition-all border border-white/10 shrink-0"
            >
                <Github size={14} className="md:w-4 md:h-4" />
                <span>Export</span>
            </button>

            <div className="h-6 w-[1px] bg-void-700 mx-1 shrink-0"></div>

            <div className="flex gap-1">
                {tabs.map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`p-1.5 md:p-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${activeTab === tab.id ? 'bg-campfire-600 text-white' : 'bg-void-700 text-gray-400 hover:text-white'}`}
                        title={tab.label}
                    >
                        <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
                        <span className="text-[10px] font-bold md:hidden lg:inline">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-white">
        {activeTab === 'preview' && (
             <iframe srcDoc={codeSnippet} title="App Preview" className="w-full h-full border-0" sandbox="allow-scripts allow-modals" />
        )}

        {activeTab === 'code' && (
            <div className="w-full h-full bg-[#1e1e1e] overflow-auto p-4 custom-scrollbar">
                <pre className="font-mono text-[10px] md:text-xs text-gray-300 whitespace-pre-wrap">{codeSnippet}</pre>
            </div>
        )}

        {activeTab === 'market' && (
            <div className="w-full h-full bg-void-900 overflow-y-auto custom-scrollbar p-6 md:p-8 text-gray-300">
                <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <BarChart3 className="text-campfire-500" /> Market Analysis
                </h3>
                <div className="max-w-2xl bg-void-800 p-5 md:p-6 rounded-2xl border border-void-700">
                    <p className="text-sm md:text-lg leading-relaxed">{prd.marketAnalysis || "Analyzing..."}</p>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mt-10 md:mt-12 mb-6 flex items-center gap-2">
                    <Wand2 className="text-campfire-500" /> UI/UX Vision (3D)
                </h3>
                <div className="max-w-2xl bg-void-800 p-5 md:p-6 rounded-2xl border border-void-700">
                    <p className="text-sm md:text-lg leading-relaxed">{prd.uiUxDirection || "Cinematic 3D vision."}</p>
                </div>
            </div>
        )}

        {activeTab === 'roadmap' && (
            <div className="w-full h-full bg-void-900 overflow-y-auto custom-scrollbar p-6 md:p-8 text-gray-300">
                <h3 className="text-lg md:text-xl font-bold text-white mb-8 flex items-center gap-2">
                    <TrendingUp className="text-campfire-500" /> Strategic Roadmap
                </h3>
                <div className="max-w-xl space-y-8 md:space-y-12 pb-10">
                    {(prd.roadmap || ['MVP Launch', 'Scale', 'Expansion']).map((milestone, i) => (
                        <div key={i} className="flex gap-4 md:gap-6 relative">
                            {i < (prd.roadmap?.length || 3) - 1 && (
                                <div className="absolute left-5 md:left-6 top-10 bottom-[-40px] md:bottom-[-48px] w-0.5 bg-gradient-to-b from-campfire-500 to-void-700"></div>
                            )}
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-void-700 transition-all ${i === 0 ? 'bg-campfire-600/20 border-campfire-500' : 'bg-void-800'}`}>
                                {i === 0 ? <CheckCircle2 size={18} className="text-campfire-500" /> : <span className="text-gray-600 font-bold text-sm">{i+1}</span>}
                            </div>
                            <div className="pt-1 md:pt-2">
                                <h4 className={`text-base md:text-lg font-bold ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                                    {i === 0 ? 'Phase 1: Forge' : `Phase ${i+1}`}
                                </h4>
                                <p className="text-xs md:text-sm text-gray-500 mt-1">{milestone}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'history' && (
            <div className="w-full h-full bg-void-900 overflow-y-auto custom-scrollbar p-6 text-gray-300">
                <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <History className="text-campfire-500" /> Build Logs
                </h3>
                <div className="space-y-6 max-w-2xl pb-10">
                    {history.map((item, idx) => (
                        <div key={idx} className="relative pl-6 md:pl-8 border-l border-void-700 pb-2">
                            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-campfire-500"></div>
                            <h4 className="text-white text-sm md:text-base font-mono font-bold">V{idx + 1}.0</h4>
                            <p className="text-xs md:text-sm text-gray-400 mb-2 italic">"{item.prd.changeLog || 'Initial build'}"</p>
                            <div className="text-[10px] md:text-xs bg-void-800 p-2 md:p-3 rounded border border-void-700">
                                <span className="text-campfire-400 font-semibold">Core:</span>
                                <ul className="list-disc list-inside mt-1 text-gray-500 truncate">
                                    {item.prd.features.slice(0, 2).map((f, i) => <li key={i} className="truncate">{f}</li>)}
                                </ul>
                            </div>
                        </div>
                    )).reverse()} 
                </div>
            </div>
        )}

        {activeTab === 'details' && (
             <div className="w-full h-full bg-void-900 overflow-y-auto custom-scrollbar p-6 md:p-8 text-gray-300">
                <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-10">
                    <section>
                        <h3 className="flex items-center gap-2 text-campfire-400 font-mono text-[10px] md:text-sm uppercase tracking-wider mb-2 md:mb-3"><Layers size={14} /> Summary</h3>
                        <p className="text-sm md:text-lg leading-relaxed">{prd.summary}</p>
                    </section>
                    <section>
                        <h3 className="flex items-center gap-2 text-campfire-400 font-mono text-[10px] md:text-sm uppercase tracking-wider mb-2 md:mb-3"><Terminal size={14} /> Features</h3>
                        <ul className="grid grid-cols-1 gap-2 md:gap-3">
                            {prd.features.map((f, i) => (
                                <li key={i} className="bg-void-800 border border-void-700 p-2 md:p-3 rounded-lg text-xs md:text-sm flex items-start gap-2">
                                    <span className="text-campfire-500 mt-0.5 md:mt-1">•</span> {f}
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section>
                        <h3 className="flex items-center gap-2 text-campfire-400 font-mono text-[10px] md:text-sm uppercase tracking-wider mb-2 md:mb-3"><Palette size={14} /> Palette</h3>
                        <div className="flex flex-wrap gap-2 md:gap-4">
                            {prd.colorPalette.map((color, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-xl border border-white/10" style={{ backgroundColor: color }}></div>
                                    <p className="text-[8px] md:text-xs font-mono text-center opacity-60">{color}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    <div className="pt-4 md:pt-8 flex justify-center">
                        <button onClick={onIterate} className="bg-void-800 hover:bg-void-700 text-white px-5 md:px-6 py-2 md:py-3 rounded-full border border-void-600 transition-all text-xs md:text-sm font-medium">Continue Discussion</button>
                    </div>
                </div>
             </div>
        )}
      </div>

      {/* Floating Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-void-900/95 backdrop-blur-md text-white text-[9px] md:text-xs px-4 md:px-6 py-2 md:py-3 rounded-full border border-void-700 shadow-2xl flex items-center gap-2 md:gap-3 z-50 pointer-events-none animate-bounce-slow whitespace-nowrap">
         <div className="p-1 bg-campfire-500 rounded-full animate-pulse shrink-0"><Mic size={10} className="text-white" /></div>
         <span>Say <span className="text-campfire-400 font-bold uppercase tracking-wider">"TRIBE UP"</span> to iterate.</span>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
};