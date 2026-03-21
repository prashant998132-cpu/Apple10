'use client';

// ══════════════════════════════════════════════════════
// JARVIS Voice Engine v2
// Hindi TTS (ElevenLabs → HuggingFace → Google TTS)
// Wake Word: "Hey JARVIS" / "JARVIS suno"
// ══════════════════════════════════════════════════════

export class JARVISVoice {
  private recognition: any = null;
  private isListening = false;
  private wakeWordActive = false;
  private onWakeWord: () => void;
  private onTranscript: (text: string) => void;
  private onError: (err: string) => void;

  constructor(opts: {
    onWakeWord: () => void;
    onTranscript: (text: string) => void;
    onError?: (err: string) => void;
  }) {
    this.onWakeWord = opts.onWakeWord;
    this.onTranscript = opts.onTranscript;
    this.onError = opts.onError || (() => {});
  }

  // ── TTS: Speak text ────────────────────────────────
  async speak(text: string, lang = 'hi-IN'): Promise<void> {
    // Clean text
    const clean = text.replace(/[*#`]/g, '').replace(/\n+/g, ' ').substring(0, 500);

    // Try ElevenLabs first
    const elKey = this.getKey('elevenlabs');
    if (elKey) {
      try {
        const res = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'xi-api-key': elKey },
          body: JSON.stringify({ text: clean, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.6, similarity_boost: 0.8 } }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          await this.playAudio(url);
          return;
        }
      } catch {}
    }

    // Browser TTS fallback (best for Hindi)
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = lang;
      utter.rate = 0.9;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      // Try to find Hindi voice
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.startsWith('hi')) ||
                         voices.find(v => v.lang.startsWith('en-IN')) ||
                         voices.find(v => v.default);
      if (hindiVoice) utter.voice = hindiVoice;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  }

  private playAudio(url: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      audio.play().catch(() => resolve());
    });
  }

  private getKey(service: string): string | null {
    try {
      const keys = JSON.parse(localStorage.getItem('jarvis_api_keys') || '{}');
      return keys[service] || null;
    } catch { return null; }
  }

  // ── STT: Start listening ───────────────────────────
  startListening(mode: 'wake' | 'command' = 'command'): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { this.onError('Speech recognition not supported'); return; }

    if (this.isListening) this.stopListening();

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'hi-IN';
    this.recognition.interimResults = false;
    this.recognition.continuous = mode === 'wake';
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: any) => {
      const results = Array.from(event.results as any[]);
      const transcripts = results.map((r: any) => r[0].transcript.toLowerCase().trim());
      const fullText = transcripts.join(' ');

      if (mode === 'wake') {
        const wakeWords = ['hey jarvis', 'jarvis', 'जार्विस', 'jai jarvis', 'hi jarvis', 'jarvis suno', 'hello jarvis'];
        if (wakeWords.some(w => fullText.includes(w))) {
          this.onWakeWord();
          this.wakeWordActive = true;
          this.stopListening();
        }
      } else {
        const original = (event.results[0][0].transcript || '').trim();
        if (original) this.onTranscript(original);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' && mode === 'wake') {
        // Restart wake word listener
        setTimeout(() => this.startListening('wake'), 500);
        return;
      }
      this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (mode === 'wake' && !this.wakeWordActive) {
        setTimeout(() => this.startListening('wake'), 1000);
      }
    };

    this.recognition.start();
    this.isListening = true;
    this.wakeWordActive = false;
  }

  stopListening(): void {
    try { this.recognition?.stop(); } catch {}
    this.isListening = false;
  }

  startWakeWordDetection(): void {
    this.startListening('wake');
  }

  stopWakeWordDetection(): void {
    this.stopListening();
  }

  get listening() { return this.isListening; }
}

// Singleton
let voiceInstance: JARVISVoice | null = null;

export function getVoiceEngine(opts?: {
  onWakeWord: () => void;
  onTranscript: (text: string) => void;
  onError?: (err: string) => void;
}): JARVISVoice {
  if (!voiceInstance && opts) {
    voiceInstance = new JARVISVoice(opts);
  }
  return voiceInstance!;
}
