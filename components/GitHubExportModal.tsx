import React, { useState } from 'react';
import { Github, X, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { PrdStructure } from '../types';
import { exportToGitHub } from '../services/githubService';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prd: PrdStructure;
  code: string;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({ isOpen, onClose, prd, code }) => {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repoName, setRepoName] = useState(prd.projectName.toLowerCase().replace(/\s+/g, '-'));
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!token || !owner || !repoName) {
      setErrorMessage("Please fill in all required fields.");
      setStatus('error');
      return;
    }

    setStatus('loading');
    const result = await exportToGitHub({ token, owner, repoName }, prd, code);

    if (result.success) {
      setStatus('success');
      setRepoUrl(result.url || '');
    } else {
      setStatus('error');
      setErrorMessage(result.error || "Unknown error occurred during export.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-void-900 border border-void-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-void-800 flex justify-between items-center bg-void-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Github size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Export to GitHub</h3>
              <p className="text-xs text-gray-500 font-mono">Pushing {prd.projectName} to the cloud</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {status === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
              </div>
              <h4 className="text-2xl font-bold text-white">Tribe Successfully Synced!</h4>
              <p className="text-gray-400">Your code is now live on GitHub.</p>
              <a 
                href={repoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-campfire-600 hover:bg-campfire-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-campfire-600/20"
              >
                View Repository <ExternalLink size={16} />
              </a>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-campfire-400 font-bold">Personal Access Token</label>
                <input 
                  type="password" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-3 text-sm focus:border-campfire-500 focus:ring-1 focus:ring-campfire-500 outline-none transition-all placeholder:text-gray-700"
                />
                <p className="text-[10px] text-gray-600">Requires <code className="bg-void-800 px-1 rounded">repo</code> scope. Generate one at <a href="https://github.com/settings/tokens" target="_blank" className="underline hover:text-gray-400">github.com/settings/tokens</a></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-campfire-400 font-bold">GitHub Username</label>
                  <input 
                    type="text" 
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="octocat"
                    className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-3 text-sm focus:border-campfire-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-campfire-400 font-bold">Repo Name</label>
                  <input 
                    type="text" 
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-3 text-sm focus:border-campfire-500 outline-none transition-all"
                  />
                </div>
              </div>

              {status === 'error' && (
                <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{errorMessage}</p>
                </div>
              )}

              <button 
                onClick={handleExport}
                disabled={status === 'loading'}
                className="w-full bg-campfire-600 hover:bg-campfire-500 disabled:bg-void-800 disabled:text-gray-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-campfire-600/20 flex items-center justify-center gap-2 mt-4"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Deploying to GitHub...
                  </>
                ) : (
                  <>
                    <Github size={20} />
                    Push to Repository
                  </>
                )}
              </button>
            </>
          )}
        </div>
        
        <div className="p-4 bg-void-950/80 border-t border-void-800 text-[10px] text-center text-gray-600">
           TribeCode AI never stores your tokens. They are used only for this session.
        </div>
      </div>
    </div>
  );
};
