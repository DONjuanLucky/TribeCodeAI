import React, { useEffect, useRef } from 'react';

interface CampfireProps {
  userVolume: number; // 0.0 to 1.0
  aiVolume: number;   // 0.0 to 1.0
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'mini';
  tribeStatus?: 'idle' | 'listening' | 'thinking' | 'building';
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  life: number;
  decay: number;
  color: string;
  isSpark: boolean;
  angle: number;
  stretch: number;
}

export const Campfire: React.FC<CampfireProps> = ({ userVolume, aiVolume, isActive, onClick, disabled, variant = 'default', tribeStatus }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationId = useRef<number>();

  const sUserVol = useRef(0);
  const sAiVol = useRef(0);
  const frameCounter = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = variant === 'mini' ? 150 : 600;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size * 0.72;

    const createParticle = (isBlue: boolean, intensity: number, isSpark = false): Particle => {
      const spread = (size * 0.08) * (1 + intensity * 0.5);
      const x = centerX + (Math.random() - 0.5) * spread;
      const y = centerY;
      
      const speedBase = isBlue ? 2.2 : 1.5; 
      
      return {
        x,
        y,
        size: isSpark 
          ? (Math.random() * 2 + 0.5) 
          : (Math.random() * (size * 0.03)) + (intensity * (size * 0.025)),
        speedY: (Math.random() * speedBase) + 0.4 + (intensity * 4),
        speedX: (Math.random() - 0.5) * (0.8 + intensity * 1.5),
        life: 1.0,
        decay: isSpark ? (0.004 + Math.random() * 0.006) : (0.01 + Math.random() * 0.02),
        color: isBlue 
           ? `hsla(${185 + Math.random() * 30}, 100%, 70%,` 
           : `hsla(${15 + Math.random() * 20}, 100%, 55%,`, 
        isSpark,
        angle: Math.random() * Math.PI * 2,
        stretch: isSpark ? 1 : (1.5 + Math.random() * 2) // Makes flames look wispy
      };
    };

    const drawDetailedLogs = (intensity: number) => {
      ctx.save();
      ctx.translate(centerX, centerY + (size * 0.04));
      
      const logWidth = size * 0.26;
      const logHeight = size * 0.07;
      const glow = Math.min(1, intensity * 2.5);

      const drawSingleLog = (rotation: number, xOff: number, yOff: number, zIndex: number) => {
        ctx.save();
        ctx.translate(xOff, yOff);
        ctx.rotate(rotation);
        
        // Log Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-logWidth/2 + 2, -logHeight/2 + 4, logWidth, logHeight);

        // Bark (Textured Gradient)
        const barkGrad = ctx.createLinearGradient(0, -logHeight/2, 0, logHeight/2);
        barkGrad.addColorStop(0, '#2a140e');
        barkGrad.addColorStop(0.5, '#1a0905');
        barkGrad.addColorStop(1, '#0f0502');
        ctx.fillStyle = barkGrad;
        ctx.roundRect(-logWidth/2, -logHeight/2, logWidth, logHeight, 4);
        ctx.fill();
        
        // Bark Cracks/Texture
        ctx.strokeStyle = '#3d1f16';
        ctx.lineWidth = 1;
        for(let i=0; i<3; i++) {
          ctx.beginPath();
          ctx.moveTo(-logWidth/2 + 10, -logHeight/2 + (logHeight/3)*i + 4);
          ctx.lineTo(logWidth/2 - 10, -logHeight/2 + (logHeight/3)*i + 4);
          ctx.stroke();
        }

        // Inner Burning Ember Effect (the "animated images" feel)
        if (isActive || intensity > 0.1) {
          ctx.globalCompositeOperation = 'lighter';
          const pulse = (Math.sin(frameCounter.current * 0.05 + zIndex) + 1) / 2;
          const emberGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, logWidth/2);
          emberGrad.addColorStop(0, `rgba(255, 60, 0, ${0.6 * glow * (0.7 + pulse * 0.3)})`);
          emberGrad.addColorStop(0.7, 'rgba(120, 20, 0, 0)');
          ctx.fillStyle = emberGrad;
          ctx.fillRect(-logWidth/2, -logHeight/2, logWidth, logHeight);
          
          // Glowing Fissures
          ctx.strokeStyle = `rgba(255, 150, 0, ${0.4 * glow * pulse})`;
          ctx.setLineDash([2, 4]);
          ctx.strokeRect(-logWidth/2 + 5, -logHeight/2 + 2, logWidth - 10, logHeight - 4);
          ctx.setLineDash([]);
        }
        
        ctx.restore();
      };

      // Arrange logs in a more realistic cross-pile
      drawSingleLog(-0.3, -size*0.02, 0, 1);
      drawSingleLog(0.3, size*0.02, 0, 2);
      drawSingleLog(1.57, 0, -size*0.03, 3); // Vertical log in the back

      ctx.restore();
    };

    const animate = () => {
      frameCounter.current++;
      sUserVol.current += (userVolume - sUserVol.current) * 0.15;
      sAiVol.current += (aiVolume - sAiVol.current) * 0.15;
      
      const currentIntensity = isActive 
        ? (0.5 + Math.max(sUserVol.current, sAiVol.current) * 0.5)
        : 0.12; 

      const isAiTalking = sAiVol.current > 0.03;

      ctx.clearRect(0, 0, size, size);
      
      // Ground Hearth Shadow
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + size*0.08, size*0.28, size*0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fill();

      // Background Ambient Glow (The "Signifying someone is on the line" effect)
      if (isActive) {
          const breathe = (Math.sin(frameCounter.current * 0.03) + 1) / 2;
          const ambientGrad = ctx.createRadialGradient(centerX, centerY - size*0.1, 0, centerX, centerY - size*0.1, size*0.5);
          const color = isAiTalking ? '0, 255, 255' : '234, 88, 12';
          ambientGrad.addColorStop(0, `rgba(${color}, ${0.15 * currentIntensity * (0.8 + breathe * 0.2)})`);
          ambientGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = ambientGrad;
          ctx.fillRect(0, 0, size, size);
      }

      ctx.globalCompositeOperation = 'screen';

      // Spawning wispy flames
      const spawnRate = isActive ? (3 + Math.floor(currentIntensity * 8)) : 1;
      if (Math.random() < (isActive ? 1 : 0.4)) {
        for (let i = 0; i < spawnRate; i++) {
          particles.current.push(createParticle(isAiTalking, currentIntensity));
        }
      }

      // Floating Embers
      if (isActive && Math.random() > 0.85) {
        particles.current.push(createParticle(isAiTalking, currentIntensity, true));
      }

      // Update Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        
        p.y -= p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.02 + p.angle) * (p.isSpark ? 1.0 : 0.6);
        p.life -= p.decay;
        p.size *= p.isSpark ? 0.998 : 0.96;

        if (p.life <= 0 || p.size <= 0.2) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = p.life * (p.isSpark ? 1.0 : 0.7);
        
        if (p.isSpark) {
          // Embers stay round and bright
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color + '1)';
          ctx.fill();
        } else {
          // Flames are elongated ellipses
          ctx.scale(1, p.stretch);
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          const pGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          pGrad.addColorStop(0, p.color + '0.8)');
          pGrad.addColorStop(1, p.color + '0)');
          ctx.fillStyle = pGrad;
          ctx.fill();
        }
        ctx.restore();
      }

      // Final layer: Logs drawn on top of the base fire
      ctx.globalCompositeOperation = 'source-over';
      drawDetailedLogs(currentIntensity);

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
        className={`relative flex flex-col items-center justify-center transition-all duration-1000 group
        ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}
        ${!isActive && !disabled ? 'hover:scale-110' : ''}
        `}
    >
      {/* Mystical Rune Circles */}
      <div className={`absolute w-[130%] h-[130%] rounded-full border border-campfire-500/5 transition-all duration-[4000ms] ${isActive ? 'scale-100 opacity-100 rotate-180' : 'scale-75 opacity-0'}`} />
      <div className={`absolute w-[115%] h-[115%] rounded-full border border-campfire-500/10 border-dotted transition-all duration-[6000ms] ${isActive ? 'scale-100 opacity-100 -rotate-180' : 'scale-50 opacity-0'}`} />

      <canvas 
        ref={canvasRef}
        style={{
            width: variant === 'mini' ? '120px' : '500px',
            height: variant === 'mini' ? '120px' : '500px'
        }}
        className={`touch-none transition-all duration-1000 ${isActive ? 'drop-shadow-[0_0_100px_rgba(234,88,12,0.4)]' : 'drop-shadow-[0_0_30px_rgba(234,88,12,0.1)]'}`}
      />
      
      {!isActive && !disabled && (
          <div className="absolute top-[85%] text-center pointer-events-none group-hover:opacity-100 opacity-40 transition-all duration-500">
             <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.5em] text-campfire-500 font-black animate-pulse">Ignite The Forge</span>
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-campfire-500/50 to-transparent"></div>
             </div>
          </div>
      )}

      {isActive && (
        <div className="absolute -bottom-8 flex flex-col items-center gap-2 animate-fade-in">
            <div className="flex items-center gap-3">
                 <div className="flex gap-1.5 items-end h-4">
                    <div className={`w-1 bg-campfire-500/40 rounded-full transition-all duration-300 ${tribeStatus === 'listening' ? 'h-full animate-pulse' : 'h-1'}`}></div>
                    <div className={`w-1 bg-campfire-500/60 rounded-full transition-all duration-300 ${tribeStatus === 'thinking' ? 'h-full animate-pulse' : 'h-2'}`}></div>
                    <div className={`w-1 bg-campfire-500/80 rounded-full transition-all duration-300 ${tribeStatus === 'building' ? 'h-full animate-pulse' : 'h-1'}`}></div>
                 </div>
                 <span className={`text-[10px] font-mono uppercase tracking-[0.3em] font-black transition-all duration-700 ${tribeStatus === 'listening' ? 'text-campfire-400' : 'text-gray-500'}`}>
                    {tribeStatus === 'listening' ? 'Tribe Listening' : 
                     tribeStatus === 'thinking' ? 'Tribe Reflecting' : 
                     tribeStatus === 'building' ? 'Forging Matrix' : 'Synched'}
                 </span>
            </div>
        </div>
      )}
    </div>
  );
};
