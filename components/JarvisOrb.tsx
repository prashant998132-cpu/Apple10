'use client';
import { useEffect, useRef } from 'react';

interface JarvisOrbProps {
  loading?: boolean;
  listening?: boolean;
  size?: number;
}

export default function JarvisOrb({ loading = false, listening = false, size = 48 }: JarvisOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    const PX  = size * DPR;
    canvas.width  = PX;
    canvas.height = PX;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';

    const R  = (size / 2) * 0.78 * DPR;
    const CX = PX / 2, CY = PX / 2;
    // 300+ particles always — more for larger sizes
    const N  = size > 80 ? 500 : size > 50 ? 320 : 220;

    const palettes = {
      idle:      { core: [255,160,45],  accent: [255,215,100], glow: '150,70,0',   bg: '120,55,0'  },
      loading:   { core: [110,70,255],  accent: [175,135,255], glow: '80,40,200',  bg: '60,30,150' },
      listening: { core: [0,200,225],   accent: [80,245,255],  glow: '0,160,195',  bg: '0,100,140' },
    };

    // Generate Fibonacci sphere for more uniform distribution
    const pts: Array<{phi:number;theta:number;sz:number;bright:number;pulse:number}> = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y     = 1 - (i / (N - 1)) * 2;
      const r     = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      // Convert to spherical
      const phi = Math.acos(Math.max(-1, Math.min(1, y)));
      const th  = Math.atan2(r * Math.sin(theta), r * Math.cos(theta));
      pts.push({
        phi,
        theta: th,
        sz:     Math.random() * 1.3 + 0.4,
        bright: Math.random(),
        pulse:  Math.random() * Math.PI * 2, // phase offset for twinkling
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, PX, PX);
      const pal = loading ? palettes.loading : listening ? palettes.listening : palettes.idle;
      const spd = loading ? 0.016 : listening ? 0.022 : 0.0055;
      const rot = tRef.current * spd;
      const t   = tRef.current;

      // Ambient bg glow
      const bg = ctx.createRadialGradient(CX, CY, R * 0.05, CX, CY, R * 1.6);
      bg.addColorStop(0,   'rgba(' + pal.glow + ',0.22)');
      bg.addColorStop(0.5, 'rgba(' + pal.bg  + ',0.07)');
      bg.addColorStop(1,   'transparent');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, PX, PX);

      // Project all points
      const proj = pts.map(pt => {
        const x0 = R * Math.sin(pt.phi) * Math.cos(pt.theta);
        const y0 = R * Math.sin(pt.phi) * Math.sin(pt.theta);
        const z0 = R * Math.cos(pt.phi);
        // Y-axis rotation
        const x1 = x0 * Math.cos(rot) + z0 * Math.sin(rot);
        const z1 = -x0 * Math.sin(rot) + z0 * Math.cos(rot);
        const depth = (z1 + R) / (2 * R); // 0=back, 1=front
        // Twinkle: subtle brightness oscillation
        const tw = 0.85 + 0.15 * Math.sin(t * 0.08 + pt.pulse);
        return { sx: CX + x1, sy: CY + y0, depth, sz: pt.sz * DPR, bright: pt.bright * tw };
      });

      // Sort back-to-front for proper depth rendering
      proj.sort((a, b) => a.depth - b.depth);

      const [cr, cg, cb] = pal.core;
      const [ar, ag, ab] = pal.accent;

      proj.forEach(pt => {
        const a = 0.12 + pt.depth * 0.88;
        const r = pt.sz * (0.35 + pt.depth * 1.1);
        const isAccent = pt.bright > 0.60;

        // Glow halo — only for front-facing bright particles
        if (pt.depth > 0.55 && pt.bright > 0.40) {
          const glowR = r * (pt.bright > 0.75 ? 4.5 : 3.0);
          const gp = ctx.createRadialGradient(pt.sx, pt.sy, 0, pt.sx, pt.sy, glowR);
          const ga = a * (pt.bright > 0.75 ? 0.32 : 0.18);
          gp.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + ga + ')');
          gp.addColorStop(1, 'transparent');
          ctx.fillStyle = gp;
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core dot
        ctx.globalAlpha = a;
        if (isAccent) {
          // Bright accent dots — full color
          ctx.fillStyle = 'rgb(' + ar + ',' + ag + ',' + ab + ')';
        } else {
          // Depth-shaded base dots
          const depthMix = 0.3 + pt.depth * 0.7;
          ctx.fillStyle = 'rgb(' +
            Math.round(cr * depthMix) + ',' +
            Math.round(cg * depthMix) + ',' +
            Math.round(cb * depthMix) + ')';
        }
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, Math.max(r, 0.4), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      tRef.current++;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [loading, listening, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: '50%',
        flexShrink: 0,
        display: 'block',
        width: size,
        height: size,
      }}
    />
  );
}
