import React, { useEffect, useRef } from 'react';

interface CampfireProps {
  userVolume: number; // 0.0 to 1.0
  aiVolume: number;   // 0.0 to 1.0
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'mini';
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  life: number;
  decay: number;
  color: string;
}

export const Campfire: React.FC<CampfireProps> = ({ userVolume, aiVolume, isActive, onClick, disabled, variant = 'default' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationId = useRef<number>();

  // Smooth volume references
  const sUserVol = useRef(0);
  const sAiVol = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const size = variant === 'mini' ? 80 : 400;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size * 0.85; // Move base down a bit

    const createParticle = (isBlue: boolean, intensity: number): Particle => {
      const spread = (size * 0.15) * (1 + intensity);
      const x = centerX + (Math.random() - 0.5) * spread;
      const y = centerY;
      
      // Blue fire (AI) is faster/taller
      const speedBase = isBlue ? 2.5 : 1.5; 
      
      return {
        x,
        y,
        size: (Math.random() * (size * 0.04)) + (intensity * (size * 0.02)),
        speedY: (Math.random() * speedBase) + 1 + (intensity * 3),
        life: 1.0,
        decay: 0.01 + Math.random() * 0.02,
        color: isBlue 
           ? `hsla(${190 + Math.random() * 40}, 90%, 60%,` // Cyan/Blue
           : `hsla(${10 + Math.random() * 40}, 100%, 50%,` // Orange/Red
      };
    };

    const animate = () => {
      // Smooth out volumes
      sUserVol.current += (userVolume - sUserVol.current) * 0.1;
      sAiVol.current += (aiVolume - sAiVol.current) * 0.1;

      // Determine state
      const isAiTalking = sAiVol.current > 0.05;
      const intensity = isAiTalking ? sAiVol.current : sUserVol.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Additive blending for glow
      ctx.globalCompositeOperation = 'lighter';

      // Always spawn some embers if active, or just a few if idle
      const spawnRate = isActive ? (2 + Math.floor(intensity * 10)) : (Math.random() > 0.8 ? 1 : 0);

      for (let i = 0; i < spawnRate; i++) {
        particles.current.push(createParticle(isAiTalking, intensity));
      }

      // Update particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        
        p.y -= p.speedY;
        p.x += Math.sin(p.y * 0.05) * 0.5; // Simple wobble
        p.life -= p.decay;
        p.size *= 0.97; // Shrink

        if (p.life <= 0 || p.size <= 0.5) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.life})`;
        ctx.fill();
      }

      // Draw Base Logs (Static)
      ctx.globalCompositeOperation = 'source-over';
      if (variant !== 'default' || isActive) {
        // Only show logs if active or big version to give structure
        ctx.fillStyle = '#431407';
        ctx.save();
        ctx.translate(centerX, centerY + (size * 0.05));
        
        // Left Log
        ctx.save();
        ctx.rotate(-Math.PI / 10);
        ctx.fillRect(-size*0.15, -size*0.02, size*0.3, size*0.04);
        ctx.restore();
        
        // Right Log
        ctx.save();
        ctx.rotate(Math.PI / 10);
        ctx.fillRect(-size*0.15, -size*0.02, size*0.3, size*0.04);
        ctx.restore();
        
        ctx.restore();
      }

      animationId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
    };
  }, [variant, isActive, userVolume, aiVolume]);

  return (
    <div 
        onClick={disabled ? undefined : onClick}
        className={`relative flex flex-col items-center justify-center transition-all duration-500
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
        ${!isActive && !disabled ? 'opacity-60 hover:opacity-100 hover:scale-105' : ''}
        `}
    >
      <canvas 
        ref={canvasRef}
        style={{
            width: variant === 'mini' ? '60px' : '300px',
            height: variant === 'mini' ? '60px' : '300px'
        }}
        className="touch-none"
      />
      
      {variant !== 'mini' && !isActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
             <div className="w-16 h-16 rounded-full border-2 border-dashed border-campfire-500/30 animate-spin-slow"></div>
          </div>
      )}
    </div>
  );
};