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

    const DPR = window.devicePixelRatio || 1;
    const PX  = size * DPR;
    canvas.width  = PX;
    canvas.height = PX;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';

    const R  = (size / 2) * 0.78 * DPR;
    const CX = PX / 2;
    const CY = PX / 2;
    const N  = size > 60 ? 420 : 220;

    // colour palette per state
    const palette = {
      idle:      { core: [255,170,60],  accent: [255,220,120], glow: '120,60,0'   },
      loading:   { core: [120,80,255],  accent: [180,140,255], glow: '80,40,200'  },
      listening: { core: [0,200,220],   accent: [100,240,255], glow: '0,160,200'  },
    };
    const getP = () => loading ? palette.loading : listening ? palette.listening : palette.idle;

    // sphere points — fixed positions, only rotation changes
    const pts: {phi:number; theta:number; size:number; bright:number}[] = [];
    for (let i = 0; i < N; i++) {
      pts.push({
        phi:    Math.acos(2 * Math.random() - 1),
        theta:  Math.random() * 2 * Math.PI,
        size:   Math.random() * 1.5 + 0.4,
        bright: Math.random(),
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, PX, PX);
      const p   = getP();
      const rot = tRef.current * (loading ? 0.012 : listening ? 0.018 : 0.005);

      // soft bg glow
      const bg = ctx.createRadialGradient(CX, CY, R * 0.1, CX, CY, R * 1.4);
      bg.addColorStop(0,   `rgba(${p.glow},0.22)`);
      bg.addColorStop(0.7, `rgba(${p.glow},0.06)`);
      bg.addColorStop(1,   'transparent');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, PX, PX);

      // project + sort
      const proj = pts.map(pt => {
        const x0 = R * Math.sin(pt.phi) * Math.cos(pt.theta);
        const y0 = R * Math.sin(pt.phi) * Math.sin(pt.theta);
        const z0 = R * Math.cos(pt.phi);
        const x1 = x0 * Math.cos(rot) + z0 * Math.sin(rot);
        const z1 = -x0 * Math.sin(rot) + z0 * Math.cos(rot);
        const depth = (z1 + R) / (2 * R); // 0=back 1=front
        return { sx: CX + x1, sy: CY + y0, depth, size: pt.size * DPR, bright: pt.bright };
      });
      proj.sort((a, b) => a.depth - b.depth);

      proj.forEach(pt => {
        const a   = 0.18 + pt.depth * 0.82;
        const r   = pt.size * (0.5 + pt.depth * 0.9);
        const [cr, cg, cb]   = p.core;
        const [ar, ag, ab]   = p.accent;
        const isAccent        = pt.bright > 0.68;

        // glow halo on front particles
        if (pt.depth > 0.6 && pt.bright > 0.45) {
          const gp = ctx.createRadialGradient(pt.sx, pt.sy, 0, pt.sx, pt.sy, r * 4);
          gp.addColorStop(0, `rgba(${cr},${cg},${cb},${a * 0.3})`);
          gp.addColorStop(1, 'transparent');
          ctx.fillStyle = gp;
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, r * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = a;
        if (isAccent) {
          ctx.fillStyle = `rgb(${ar},${ag},${ab})`;
        } else {
          const mix = pt.depth;
          ctx.fillStyle = `rgb(${Math.round(cr * mix)},${Math.round(cg * mix)},${Math.round(cb * mix)})`;
        }
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, Math.max(r, 0.5), 0, Math.PI * 2);
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
