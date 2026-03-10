'use client';
import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './ChatInterface';

interface Props {
  message: Message;
  onLike: (liked: boolean) => void;
  onSpeak: () => void;
  onCopy: () => void;
  onPin: () => void;
}

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  think: { label: '🧠 Think',  color: '#a78bfa' },
  deep:  { label: '🔬 Deep',   color: '#34d399' },
  auto:  { label: '🤖 Auto',   color: '#60a5fa' },
  flash: { label: '⚡ Flash',  color: '#facc15' },
};

export default function MessageBubble({ message: msg, onLike, onSpeak, onCopy, onPin }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const isUser = msg.role === 'user';

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove  = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 70) setSwipeX(dx * 0.2);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    setSwipeX(0);
    if (dx > 65) onLike(true);
    else if (dx < -65) handleCopy();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    onCopy();
  };

  const modeInfo = MODE_LABELS[msg.mode || 'flash'];

  return (
    <div
      className={`relative w-full fade-in ${isUser ? 'flex justify-end' : ''}`}
      style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s' : 'none' }}
    >
      {isUser ? (
        /* ── USER MESSAGE ── */
        <div
          className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-br-md cursor-pointer"
          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={() => setShowActions(s => !s)}
        >
          <p className="text-sm text-blue-100 leading-relaxed select-text whitespace-pre-wrap">{msg.content}</p>
          <div className="flex items-center justify-between mt-1 gap-2">
            <span className="text-[10px] text-blue-400/40">
              {new Date(msg.ts).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {showActions && (
              <div className="flex gap-1 fade-in-fast">
                <button onClick={e => { e.stopPropagation(); handleCopy(); setShowActions(false); }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                  {copied ? '✅' : '📋'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── JARVIS MESSAGE ── */
        <div
          className="w-full cursor-pointer"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={() => setShowActions(s => !s)}
          onContextMenu={e => { e.preventDefault(); setShowActions(true); }}
        >
          {/* Mode label row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: modeInfo?.color || '#60a5fa' }}>
              {modeInfo?.label || '⚡ JARVIS'}
            </span>
            {msg.pinned  && <span className="text-[10px] text-amber-400">📌</span>}
            {msg.liked === true  && <span className="text-[10px] text-green-400">👍</span>}
            {msg.liked === false && <span className="text-[10px] text-red-400">👎</span>}
          </div>

          {/* Image */}
          {msg.type === 'image' && msg.imageUrl && (
            <div className="mb-3">
              <img src={msg.imageUrl} alt={msg.content}
                className="rounded-2xl max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
                onClick={e => { e.stopPropagation(); window.open(msg.imageUrl, '_blank'); }}
                loading="lazy" />
            </div>
          )}

          {/* Main text */}
          <div className="prose prose-sm prose-invert max-w-none leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              p: ({ children }) => (
                <p className="text-[14px] leading-[1.7] mb-2.5 text-gray-200 last:mb-0">{children}</p>
              ),
              code({ node, inline, className, children, ...props }: any) {
                const lang = /language-(\w+)/.exec(className || '')?.[1];
                const codeStr = String(children).replace(/\n$/, '');
                return inline ? (
                  <code className="px-1.5 py-0.5 rounded-md text-blue-300 text-xs font-mono"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    {children}
                  </code>
                ) : (
                  <div className="relative my-3 rounded-xl overflow-hidden"
                    style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between px-4 py-2"
                      style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-[11px] text-gray-500 font-mono">{lang || 'code'}</span>
                      <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(codeStr); }}
                        className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-0.5 rounded-md hover:bg-white/5">
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-xs">
                      <code className="text-green-300 font-mono leading-relaxed">{children}</code>
                    </pre>
                  </div>
                );
              },
              table: ({ children }) => (
                <div className="overflow-x-auto my-3 rounded-xl"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <table className="text-xs border-collapse w-full">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300"
                  style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2 text-xs text-gray-400"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {children}
                </td>
              ),
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener"
                  className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors"
                  onClick={e => e.stopPropagation()}>
                  {children}
                </a>
              ),
              ul: ({ children }) => <ul className="my-1.5 space-y-1 pl-4">{children}</ul>,
              ol: ({ children }) => <ol className="my-1.5 space-y-1 pl-4 list-decimal">{children}</ol>,
              li: ({ children }) => (
                <li className="text-[14px] text-gray-200 leading-relaxed list-disc marker:text-blue-500/60">{children}</li>
              ),
              h1: ({ children }) => <h1 className="text-base font-bold text-white mt-4 mb-2 leading-tight">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-3 mb-1.5 leading-tight">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-100 mt-2 mb-1">{children}</h3>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-gray-300 italic">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="my-2 pl-3 py-0.5 text-gray-400 italic text-sm"
                  style={{ borderLeft: '2px solid rgba(59,130,246,0.5)' }}>
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="my-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />,
            }}>
              {msg.content || '▋'}
            </ReactMarkdown>
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-gray-700 mt-1 block">
            {new Date(msg.ts).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>

          {/* Action buttons — on tap/click */}
          {showActions && (
            <div className="flex gap-1.5 mt-2.5 flex-wrap fade-in-fast">
              {[
                { icon: copied ? '✅' : '📋', action: () => handleCopy(), label: 'Copy' },
                { icon: '🔊', action: onSpeak, label: 'Speak' },
                { icon: '👍', action: () => onLike(true),  label: 'Like',    active: msg.liked === true,  activeColor: 'rgba(34,197,94,0.15)', activeBorder: 'rgba(34,197,94,0.4)' },
                { icon: '👎', action: () => onLike(false), label: 'Dislike', active: msg.liked === false, activeColor: 'rgba(239,68,68,0.15)',  activeBorder: 'rgba(239,68,68,0.4)' },
                { icon: msg.pinned ? '📍' : '📌', action: onPin, label: msg.pinned ? 'Unpin' : 'Pin', active: !!msg.pinned, activeColor: 'rgba(245,158,11,0.15)', activeBorder: 'rgba(245,158,11,0.4)' },
              ].map(({ icon, action, label, active, activeColor, activeBorder }) => (
                <button key={label}
                  onClick={e => { e.stopPropagation(); action(); if (label !== 'Copy') setShowActions(false); }}
                  className="text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: active ? activeColor : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? activeBorder : 'rgba(255,255,255,0.08)'}`,
                    color: active ? 'white' : '#9ca3af',
                  }}>
                  {icon}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Separator after JARVIS message */}
      {!isUser && (
        <div className="mt-4 mb-1" style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />
      )}
    </div>
  );
}
