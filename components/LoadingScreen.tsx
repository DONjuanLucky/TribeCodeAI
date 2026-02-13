import React, { useState, useEffect } from 'react';
import { PrdStructure } from '../types';

interface LoadingScreenProps {
  prd: PrdStructure | null;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ prd }) => {
  const [step, setStep] = useState(0);

  const steps = [
    "Reviewing your idea...",
    `Sketching the ${prd?.projectName || "app"} layout...`,
    "Picking the perfect colors...",
    "Writing the code...",
    "Putting it all together..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2500); 
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    // Used h-full w-full to fill parent completely and justify-center to fix vertical alignment
    <div className="h-full w-full flex flex-col items-center justify-center bg-void-950 relative overflow-hidden p-6">
      
      {/* CSS Campfire Animation */}
      <div className="relative mb-12 transform scale-150">
        {/* Logs */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-orange-900 rounded-full rotate-12 z-10 opacity-80"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-orange-900 rounded-full -rotate-12 z-10 opacity-80"></div>
        
        {/* Flames */}
        <div className="fire-container relative bottom-2">
            <div className="flame flame-1"></div>
            <div className="flame flame-2"></div>
            <div className="flame flame-3"></div>
        </div>
      </div>

      <div className="z-10 flex flex-col items-center space-y-6 max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-white tracking-tight animate-fade-in">
           Building your Tribe...
        </h2>
        
        <p className="text-xl text-campfire-400 font-medium animate-pulse transition-all duration-500">
           {steps[step]}
        </p>

        {/* Simple Progress Bar */}
        <div className="w-64 h-2 bg-void-800 rounded-full overflow-hidden mt-8">
            <div className="h-full bg-gradient-to-r from-campfire-600 to-campfire-400 w-1/3 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
        }
        
        .fire-container {
            width: 60px;
            height: 60px;
            position: relative;
            transform-origin: center bottom;
            animation: flicker 3ms ease-in infinite alternate;
        }

        .flame {
            bottom: 0;
            position: absolute;
            border-bottom-right-radius: 50%;
            border-bottom-left-radius: 50%;
            border-top-left-radius: 50%;
            transform: rotate(-45deg) scale(1.5, 1.5);
            filter: blur(1px);
        }

        .flame-1 {
            background: #f97316; /* campfire-500 */
            width: 60px;
            height: 60px;
            left: 0px;
            animation: flame1 2s ease-in infinite;
            opacity: 0.9;
        }

        .flame-2 {
            background: #fb923c; /* campfire-400 */
            width: 40px;
            height: 40px;
            left: 10px;
            bottom: 5px;
            animation: flame2 3s ease-in infinite;
            opacity: 0.8;
        }

        .flame-3 {
            background: #fed7aa; /* campfire-200 */
            width: 20px;
            height: 20px;
            left: 20px;
            bottom: 10px;
            animation: flame3 2s ease-in infinite;
            opacity: 0.7;
        }

        @keyframes flicker {
            0% { transform: rotate(-1deg); }
            20% { transform: rotate(1deg); }
            40% { transform: rotate(-1deg); }
            60% { transform: rotate(1deg) scaleY(1.04); }
            80% { transform: rotate(-2deg) scaleY(0.92); }
            100% { transform: rotate(1deg); }
        }
        
        @keyframes flame1 {
             0% { transform: rotate(-45deg) scale(1.5, 1.5); }
             50% { transform: rotate(-45deg) scale(1.5, 1.6); }
             100% { transform: rotate(-45deg) scale(1.5, 1.5); }
        }
        
        @keyframes flame2 {
             0% { transform: rotate(-45deg) scale(1, 1); }
             50% { transform: rotate(-45deg) scale(1.1, 1.1) translate(0, -5px); }
             100% { transform: rotate(-45deg) scale(1, 1); }
        }

        @keyframes flame3 {
             0% { transform: rotate(-45deg) scale(1, 1); opacity: 0.5; }
             50% { transform: rotate(-45deg) scale(1, 1.2) translate(0, -8px); opacity: 0.8; }
             100% { transform: rotate(-45deg) scale(1, 1); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};