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

export default function MessageBubble({ message: msg, onLike, onSpeak, onCopy, onPin }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const isUser = msg.role === 'user';

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 60) setSwipeX(dx * 0.25);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    setSwipeX(0);
    if (dx > 60) onLike(true);
    else if (dx < -60) onCopy();
  };

  return (
    <div
      className={`relative w-full fade-in ${isUser ? 'flex justify-end' : ''}`}
      style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s' : 'none' }}
    >
      {isUser ? (
        /* USER — right side, no bubble, subtle blue text */
        <div
          className="max-w-[80%] text-right px-1 py-1"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={() => setShowActions(s => !s)}
        >
          <p className="text-sm text-blue-300 leading-relaxed select-text">{msg.content}</p>
          <span className="text-[10px] text-gray-600 mt-0.5 block">
            {new Date(msg.ts).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ) : (
        /* JARVIS — full width, no bubble, directly on background */
        <div
          className="w-full px-1 py-1"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={() => setShowActions(s => !s)}
          onContextMenu={e => { e.preventDefault(); setShowActions(true); }}
        >
          {/* Mode label */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">
              {msg.mode === 'think' ? '🧠 Think' : msg.mode === 'deep' ? '🔬 Deep' : msg.mode === 'auto' ? '🤖 Auto' : '⚡ Jarvis'}
            </span>
            {msg.pinned && <span className="text-[10px] text-amber-400">📌</span>}
            {msg.liked === true && <span className="text-[10px] text-green-400">👍</span>}
            {msg.liked === false && <span className="text-[10px] text-red-400">👎</span>}
          </div>

          {/* Image */}
          {msg.type === 'image' && msg.imageUrl && (
            <img src={msg.imageUrl} alt={msg.content}
              className="rounded-xl max-w-full mb-2 cursor-pointer"
              style={{ maxHeight: '280px', objectFit: 'cover' }}
              onClick={() => window.open(msg.imageUrl, '_blank')} loading="lazy" />
          )}

          {/* Text directly on background */}
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              p: ({ children }) => <p className="text-sm leading-relaxed mb-2 text-gray-200">{children}</p>,
              code({ node, inline, className, children, ...props }: any) {
                const lang = /language-(\w+)/.exec(className || '')?.[1];
                return inline ? (
                  <code className="bg-gray-800 px-1 py-0.5 rounded text-blue-300 text-xs font-mono">{children}</code>
                ) : (
                  <div className="relative my-2">
                    {lang && <div className="text-gray-500 text-[10px] px-3 pt-2 bg-gray-900/80 rounded-t-lg">{lang}</div>}
                    <pre className={`bg-gray-900/80 p-3 overflow-x-auto text-xs ${lang ? 'rounded-b-lg' : 'rounded-lg'}`}>
                      <code className="text-green-300 font-mono">{children}</code>
                    </pre>
                    <button onClick={() => navigator.clipboard.writeText(String(children))}
                      className="absolute top-1 right-2 text-[10px] text-gray-500 hover:text-white">Copy</button>
                  </div>
                );
              },
              table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
              th: ({ children }) => <th className="border border-gray-700 px-2 py-1 bg-gray-800/80 text-left text-xs">{children}</th>,
              td: ({ children }) => <td className="border border-gray-700 px-2 py-1 text-xs text-gray-300">{children}</td>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener" className="text-blue-400 underline" onClick={e => e.stopPropagation()}>{children}</a>,
              li: ({ children }) => <li className="text-sm text-gray-200 mb-0.5">{children}</li>,
              h1: ({ children }) => <h1 className="text-base font-bold text-white mt-3 mb-1">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold text-white mt-2 mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-100 mt-2 mb-1">{children}</h3>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-500/60 pl-3 my-2 text-gray-400 italic">{children}</blockquote>,
            }}>
              {msg.content || '▋'}
            </ReactMarkdown>
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-gray-600 mt-0.5 block">
            {new Date(msg.ts).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {[
                ['📋', onCopy, 'Copy'],
                ['🔊', onSpeak, 'Speak'],
                ['👍', () => onLike(true), 'Like'],
                ['👎', () => onLike(false), 'Dislike'],
                ['📌', onPin, msg.pinned ? 'Unpin' : 'Pin'],
              ].map(([icon, action, label]) => (
                <button key={String(label)}
                  onClick={(e) => { e.stopPropagation(); (action as Function)(); setShowActions(false); }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    (label === 'Like' && msg.liked === true) ? 'border-green-500/60 text-green-400 bg-green-500/10' :
                    (label === 'Dislike' && msg.liked === false) ? 'border-red-500/60 text-red-400 bg-red-500/10' :
                    msg.pinned && (label === 'Pin' || label === 'Unpin') ? 'border-amber-500/60 text-amber-400 bg-amber-500/10' :
                    'border-gray-700/60 text-gray-400 hover:border-gray-500 bg-transparent'
                  }`}>
                  {icon as string}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Thin separator after each JARVIS message */}
      {!isUser && <div className="mt-3 mb-2 border-b border-gray-800/50" />}
    </div>
  );
}
