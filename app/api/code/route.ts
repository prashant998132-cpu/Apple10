// ══════════════════════════════════════════════════════════════
// JARVIS CODE RUNNER — v30
// Research: Piston now paid (Feb 2026), alternatives:
//   - Glot.io (free, no key, 40+ languages)
//   - Wandbox (free, no key, C++/Python/etc)
//   - Judge0 CE (open source, free public instance)
//   - Onecompiler API (free)
//   - Browser JS eval (always works for JS)
//
// Chain: Glot.io → Wandbox → Judge0 → Browser eval (JS only)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

// Language → Glot.io mapping
const GLOT_LANGS: Record<string, { lang: string; version: string; ext: string }> = {
  python: { lang: 'python', version: 'latest', ext: 'py' },
  py: { lang: 'python', version: 'latest', ext: 'py' },
  javascript: { lang: 'javascript', version: 'latest', ext: 'js' },
  js: { lang: 'javascript', version: 'latest', ext: 'js' },
  typescript: { lang: 'typescript', version: 'latest', ext: 'ts' },
  ts: { lang: 'typescript', version: 'latest', ext: 'ts' },
  java: { lang: 'java', version: 'latest', ext: 'java' },
  c: { lang: 'c', version: 'latest', ext: 'c' },
  cpp: { lang: 'cpp', version: 'latest', ext: 'cpp' },
  'c++': { lang: 'cpp', version: 'latest', ext: 'cpp' },
  go: { lang: 'go', version: 'latest', ext: 'go' },
  rust: { lang: 'rust', version: 'latest', ext: 'rs' },
  ruby: { lang: 'ruby', version: 'latest', ext: 'rb' },
  php: { lang: 'php', version: 'latest', ext: 'php' },
  swift: { lang: 'swift', version: 'latest', ext: 'swift' },
  kotlin: { lang: 'kotlin', version: 'latest', ext: 'kt' },
  bash: { lang: 'bash', version: 'latest', ext: 'sh' },
  sh: { lang: 'bash', version: 'latest', ext: 'sh' },
  lua: { lang: 'lua', version: 'latest', ext: 'lua' },
  r: { lang: 'r', version: 'latest', ext: 'r' },
  perl: { lang: 'perl', version: 'latest', ext: 'pl' },
};

// Judge0 language IDs (public instance)
const JUDGE0_IDS: Record<string, number> = {
  python: 71, javascript: 63, typescript: 74, java: 62,
  c: 50, cpp: 54, go: 60, rust: 73, ruby: 72, php: 68,
  swift: 83, kotlin: 78, bash: 46, lua: 64, r: 80,
};

// Provider 1: Glot.io (free, no key, 40+ languages)
async function glotRun(code: string, lang: string, stdin = ''): Promise<{ output: string; error: string } | null> {
  const def = GLOT_LANGS[lang.toLowerCase()];
  if (!def) return null;

  try {
    const r = await fetch(`https://glot.io/api/run/${def.lang}/${def.version}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [{ name: `main.${def.ext}`, content: code }],
        stdin,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return {
      output: d.stdout || '',
      error: d.stderr || d.error || '',
    };
  } catch { return null; }
}

// Provider 2: Wandbox (free, no key, great for C++/Python/Haskell)
async function wandboxRun(code: string, lang: string): Promise<{ output: string; error: string } | null> {
  const compilerMap: Record<string, string> = {
    python: 'cpython-3.12.0',
    cpp: 'gcc-head',
    c: 'gcc-head-c',
    javascript: 'nodejs-head',
    ruby: 'ruby-head',
    php: 'php-head',
    go: 'go-head',
    rust: 'rust-head',
    swift: 'swift-head',
    bash: 'bash',
    lua: 'lua-5.4.6',
  };

  const compiler = compilerMap[lang.toLowerCase()];
  if (!compiler) return null;

  try {
    const r = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, compiler, 'stdin': '' }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return {
      output: d.program_output || d.compiler_output || '',
      error: d.program_error || d.compiler_error || '',
    };
  } catch { return null; }
}

// Provider 3: Judge0 CE (free public instance)
async function judge0Run(code: string, lang: string): Promise<{ output: string; error: string } | null> {
  const langId = JUDGE0_IDS[lang.toLowerCase()];
  if (!langId) return null;

  const judge0Key = process.env.JUDGE0_API_KEY;
  const base = judge0Key
    ? 'https://judge0-ce.p.rapidapi.com'
    : 'https://ce.judge0.com';

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (judge0Key) {
      headers['X-RapidAPI-Key'] = judge0Key;
      headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    // Submit
    const submitR = await fetch(`${base}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ source_code: code, language_id: langId }),
      signal: AbortSignal.timeout(20000),
    });
    if (!submitR.ok) return null;
    const d = await submitR.json();

    return {
      output: d.stdout || '',
      error: d.stderr || d.compile_output || d.message || '',
    };
  } catch { return null; }
}

// Safe JS browser-like eval (for simple JS snippets)
function safeJSEval(code: string): { output: string; error: string } {
  try {
    const logs: string[] = [];
    const mockConsole = { log: (...a: any[]) => logs.push(a.map(String).join(' ')) };
    const fn = new Function('console', code);
    const result = fn(mockConsole);
    if (logs.length === 0 && result !== undefined) logs.push(String(result));
    return { output: logs.join('\n'), error: '' };
  } catch (e: any) {
    return { output: '', error: e.message };
  }
}

// Detect language from code if not specified
function detectLanguage(code: string): string {
  if (code.includes('def ') && code.includes(':')) return 'python';
  if (code.includes('console.log') || code.includes('const ') || code.includes('let ')) return 'javascript';
  if (code.includes('public class') || code.includes('System.out.println')) return 'java';
  if (code.includes('#include') && code.includes('cout')) return 'cpp';
  if (code.includes('func main()')) return 'go';
  if (code.includes('fn main()')) return 'rust';
  if (code.includes('<?php')) return 'php';
  return 'python'; // default
}

export async function POST(req: NextRequest) {
  try {
    const { code, language, lang, stdin = '' } = await req.json();
    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

    const langName = (language || lang || detectLanguage(code)).toLowerCase();
    const startTime = Date.now();

    // Try providers
    let result: { output: string; error: string } | null = null;
    let provider = '';

    // JS can be eval'd in Node directly too
    if ((langName === 'js' || langName === 'javascript') && code.length < 500) {
      result = safeJSEval(code);
      provider = 'Node.js eval';
    }

    if (!result || (!result.output && !result.error)) {
      result = await glotRun(code, langName, stdin);
      if (result) provider = 'Glot.io';
    }

    if (!result) {
      result = await wandboxRun(code, langName);
      if (result) provider = 'Wandbox';
    }

    if (!result) {
      result = await judge0Run(code, langName);
      if (result) provider = 'Judge0';
    }

    const elapsed = Date.now() - startTime;

    if (!result) {
      return NextResponse.json({
        output: '',
        error: `❌ ${langName} execution unavailable. Supported: Python, JS, Java, C/C++, Go, Rust, Ruby, PHP, Swift`,
        language: langName,
        provider: 'none',
      });
    }

    return NextResponse.json({
      output: result.output?.trim() || '',
      error: result.error?.trim() || '',
      language: langName,
      provider,
      elapsed,
      success: !result.error,
    });
  } catch {
    return NextResponse.json({ error: 'Code execution failed' }, { status: 500 });
  }
}
