import React, { useState } from 'react';
import { PrdStructure } from '../types';
import { Code, Layers, Palette, Terminal, Eye, FileJson, History, Mic } from 'lucide-react';

interface PrdPreviewProps {
  prd: PrdStructure;
  codeSnippet: string;
  history: {prd: PrdStructure, code: string}[];
  onIterate: () => void;
}

export const PrdPreview: React.FC<PrdPreviewProps> = ({ prd, codeSnippet, history, onIterate }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'details' | 'history'>('preview');

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-void-800 md:rounded-2xl md:border md:border-campfire-900/30 md:shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <div className="p-4 border-b border-void-700 bg-void-900/50 backdrop-blur-md flex justify-between items-center shrink-0 z-10">
        <div className="min-w-0">
           <h2 className="text-xl font-bold text-white tracking-tight truncate">{prd.projectName || "Project Alpha"}</h2>
           {activeTab === 'details' && <p className="text-campfire-400 font-mono text-xs mt-1 truncate hidden md:block">{prd.tagline}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
            <button 
                onClick={() => setActiveTab('details')}
                className={`p-2 rounded-lg transition-colors ${activeTab === 'details' ? 'bg-campfire-600 text-white' : 'bg-void-700 text-gray-400 hover:text-white'}`}
                title="Project Details"
            >
                <FileJson size={18} />
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`p-2 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-campfire-600 text-white' : 'bg-void-700 text-gray-400 hover:text-white'}`}
                title="Changelog"
            >
                <History size={18} />
            </button>
            <button 
                onClick={() => setActiveTab('preview')}
                className={`p-2 rounded-lg transition-colors ${activeTab === 'preview' ? 'bg-campfire-600 text-white' : 'bg-void-700 text-gray-400 hover:text-white'}`}
                title="Live Preview"
            >
                <Eye size={18} />
            </button>
            <button 
                onClick={() => setActiveTab('code')}
                className={`p-2 rounded-lg transition-colors ${activeTab === 'code' ? 'bg-campfire-600 text-white' : 'bg-void-700 text-gray-400 hover:text-white'}`}
                title="View Code"
            >
                <Code size={18} />
            </button>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 relative overflow-hidden bg-white">
        
        {/* 1. Live Preview (Iframe) */}
        {activeTab === 'preview' && (
             <iframe 
                srcDoc={codeSnippet}
                title="App Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts"
             />
        )}

        {/* 2. Code View */}
        {activeTab === 'code' && (
            <div className="w-full h-full bg-[#1e1e1e] overflow-auto p-4">
                <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap">
                    {codeSnippet}
                </pre>
            </div>
        )}

        {/* 3. History / Changelog View */}
        {activeTab === 'history' && (
            <div className="w-full h-full bg-void-900 overflow-auto p-6 text-gray-300">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <History className="text-campfire-500" /> Build Changelog
                </h3>
                <div className="space-y-6 max-w-2xl">
                    {history.map((item, idx) => (
                        <div key={idx} className="relative pl-8 border-l border-void-700 pb-2">
                            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-campfire-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-white font-mono font-bold">Version {idx + 1}.0</h4>
                            </div>
                            <p className="text-sm text-gray-400 mb-2 italic">"{item.prd.changeLog || 'Initial build'}"</p>
                            <div className="text-xs bg-void-800 p-3 rounded border border-void-700">
                                <span className="text-campfire-400 font-semibold">Features added:</span>
                                <ul className="list-disc list-inside mt-1 text-gray-500">
                                    {item.prd.features.slice(0, 3).map((f, i) => (
                                        <li key={i}>{f}</li>
                                    ))}
                                    {item.prd.features.length > 3 && <li>...and more</li>}
                                </ul>
                            </div>
                        </div>
                    )).reverse()} 
                </div>
            </div>
        )}

        {/* 4. Details View */}
        {activeTab === 'details' && (
             <div className="w-full h-full bg-void-900 overflow-auto p-6 md:p-8 text-gray-300">
                <div className="max-w-3xl mx-auto space-y-8">
                    
                    <section>
                        <h3 className="flex items-center gap-2 text-campfire-400 font-mono text-sm uppercase tracking-wider mb-3">
                            <Layers size={16} /> Summary
                        </h3>
                        <p className="text-lg leading-relaxed">{prd.summary}</p>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 text-campfire-400 font-mono text-sm uppercase tracking-wider mb-3">
                            <Terminal size={16} /> Features
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {prd.features.map((f, i) => (
                                <li key={i} className="bg-void-800 border border-void-700 p-3 rounded-lg text-sm flex items-start gap-2">
                                    <span className="text-campfire-500 mt-1">•</span> {f}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 text-campfire-400 font-mono text-sm uppercase tracking-wider mb-3">
                            <Palette size={16} /> Design System
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {prd.colorPalette.map((color, i) => (
                                <div key={i} className="space-y-2">
                                    <div 
                                        className="w-20 h-20 rounded-xl shadow-lg border border-white/10" 
                                        style={{ backgroundColor: color }}
                                    ></div>
                                    <p className="text-xs font-mono text-center opacity-60">{color}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="pt-8 flex justify-center">
                        <button 
                            onClick={onIterate}
                            className="bg-void-800 hover:bg-void-700 text-white px-6 py-3 rounded-full border border-void-600 transition-all text-sm font-medium"
                        >
                            Back to Conversation
                        </button>
                    </div>
                </div>
             </div>
        )}
      </div>

      {/* ITERATION INSTRUCTION BAR */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-void-900/90 backdrop-blur-md text-white text-xs px-6 py-3 rounded-full border border-void-700 shadow-2xl flex items-center gap-3 z-50 pointer-events-none animate-bounce-slow">
         <div className="p-1.5 bg-campfire-500 rounded-full animate-pulse">
            <Mic size={12} className="text-white" />
         </div>
         <span>
            Suggest changes, then say <span className="text-campfire-400 font-bold uppercase tracking-wider">"TRIBE UP"</span> to iterate.
         </span>
      </div>
      <style>{`
        @keyframes bounce-slow {
            0%, 100% { transform: translate(-50%, 0); }
            50% { transform: translate(-50%, -5px); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};