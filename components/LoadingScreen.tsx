import React, { useState, useEffect, useRef } from 'react';
import { PrdStructure } from '../types';

interface LoadingScreenProps {
  prd: PrdStructure | null;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ prd }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameId = useRef<number>();
  const particles = useRef<any[]>([]);

  const messages = [
    `Analyzing the vision for ${prd?.projectName || 'your project'}...`,
    "Synthesizing strategic roadmap...",
    "Designing cinematic 3D environment...",
    "Forging interactive infographics...",
    "Finalizing code matrix..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    const createParticle = () => ({
      x: 200 + (Math.random() - 0.5) * 40,
      y: 300,
      size: Math.random() * 15 + 5,
      speedY: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 1,
      life: 1.0,
      decay: Math.random() * 0.02 + 0.01
    });

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, 400, 400);

      // Color transitions from Orange to Blue based on progress
      const progress = messageIndex / (messages.length - 1);
      const r = Math.floor(249 - (249 - 0) * progress);
      const g = Math.floor(115 + (255 - 115) * progress);
      const b = Math.floor(22 + (255 - 22) * progress);
      const baseColor = `rgb(${r}, ${g}, ${b})`;

      // Pulse Scale
      const scale = 1 + Math.sin(frame * 0.05) * 0.1;

      if (Math.random() > 0.1) particles.current.push(createParticle());

      ctx.globalCompositeOperation = 'screen';
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.y -= p.speedY;
        p.x += p.speedX;
        p.life -= p.decay;
        p.size *= 0.96;

        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = baseColor.replace('rgb', 'rgba').replace(')', `, ${p.life * 0.6})`);
        ctx.fill();
      }

      // Ground Glow
      const grad = ctx.createRadialGradient(200, 300, 0, 200, 300, 100);
      grad.addColorStop(0, baseColor.replace('rgb', 'rgba').replace(')', ', 0.2)'));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 400);

      frameId.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, [messageIndex]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-black relative overflow-hidden p-6">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.05),transparent_70%)] animate-pulse-slow"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <canvas 
          ref={canvasRef} 
          className="w-64 h-64 md:w-80 md:h-80 drop-shadow-[0_0_50px_rgba(249,115,22,0.2)]"
        />
        
        <div className="mt-8 flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="h-6 overflow-hidden flex flex-col justify-center">
            <p key={messageIndex} className="text-gray-400 text-sm md:text-base font-medium tracking-tight animate-fade-in-up">
              {messages[messageIndex]}
            </p>
          </div>
          
          <div className="w-48 h-1 bg-void-800 rounded-full overflow-hidden relative">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-campfire-600 to-cyan-500 transition-all duration-1000" 
              style={{ width: `${((messageIndex + 1) / messages.length) * 100}%` }}
            />
          </div>
          
          <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-campfire-500/50 font-black">
            Tribe Forge Active
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};