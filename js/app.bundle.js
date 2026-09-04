/**
 * QuizRanzzPro v4.0 — Unified Universal Engine
 * Canvas Backgrounds · User Profiles · Category Filter · Grid/List Toggle
 * Zero-CORS, Zero-Dependency, 100% Offline & Vercel Ready.
 */

(function() {
  'use strict';

  /* ==========================================================================
     0. Canvas Particle Background Engine
     ========================================================================== */
  class CanvasBackground {
    constructor() {
      this.canvas = document.getElementById('bg-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.lines = [];
      this.raf = null;
      this.isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      this.resize();
      this.spawn();
      this.loop();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas) return;
      this.W = this.canvas.width  = window.innerWidth;
      this.H = this.canvas.height = window.innerHeight;
    }

    spawn() {
      const count = Math.min(60, Math.floor(this.W / 28));
      this.particles = Array.from({ length: count }, () => this.mkParticle());
    }

    mkParticle() {
      return {
        x:  Math.random() * this.W,
        y:  Math.random() * this.H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r:  Math.random() * 2 + 0.6,
        a:  Math.random() * 0.5 + 0.15
      };
    }

    updateTheme() {
      this.isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    }

    loop() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.W, this.H);

      this.isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const baseColor = this.isDark ? '96,165,250' : '37,99,235';

      // Draw grid lines
      this.ctx.strokeStyle = this.isDark ? 'rgba(59,130,246,0.05)' : 'rgba(37,99,235,0.04)';
      this.ctx.lineWidth = 1;
      const grid = 64;
      for (let x = 0; x < this.W; x += grid) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.H);
        this.ctx.stroke();
      }
      for (let y = 0; y < this.H; y += grid) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.W, y);
        this.ctx.stroke();
      }

      // Move & draw particles + connecting lines
      const maxDist = 140;
      this.particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > this.W) p.vx *= -1;
        if (p.y < 0 || p.y > this.H) p.vy *= -1;

        // Draw dot
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${baseColor},${p.a})`;
        this.ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < this.particles.length; j++) {
          const q = this.particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.18;
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${baseColor},${alpha})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(q.x, q.y);
            this.ctx.stroke();
          }
        }
      });

      this.raf = requestAnimationFrame(() => this.loop());
    }

    destroy() {
      if (this.raf) cancelAnimationFrame(this.raf);
    }
  }

  /* ==========================================================================
     1. Sound Effects Synthesizer (Web Audio API)
     ========================================================================== */
  class SoundEffects {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    initContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playCorrect() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.45);
      });
    }

    playIncorrect() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }

    playWarningAlarm() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [800, 500, 800, 500].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.11);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.12);
      });
    }

    playClick() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    }

    playTick() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    }

    playFanfare() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      const notes = [
        { f: 523.25, t: 0.0, d: 0.15 },
        { f: 659.25, t: 0.15, d: 0.15 },
        { f: 783.99, t: 0.3, d: 0.15 },
        { f: 1046.50, t: 0.45, d: 0.5 }
      ];

      const start = this.ctx.currentTime;
      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, start + n.t);

        gain.gain.setValueAtTime(0.01, start + n.t);
        gain.gain.exponentialRampToValueAtTime(0.18, start + n.t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + n.t + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start + n.t);
        osc.stop(start + n.t + n.d + 0.05);
      });
    }
  }

  const soundFx = new SoundEffects();

  /* ==========================================================================
     2. Storage Engine (IndexedDB + LocalStorage Fallback)
     ========================================================================== */
  const DB_NAME = 'QuizRanzzProDB';
  const DB_VERSION = 1;
  const STORE_QUIZZES = 'quizzes';
  const STORE_HISTORY = 'history';

  class StorageEngine {
    constructor() {
      this.db = null;
      this.initPromise = this.initDB();
    }

    async initDB() {
      return new Promise((resolve) => {
        try {
          if (!window.indexedDB) {
            resolve(null);
            return;
          }

          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_QUIZZES)) {
              db.createObjectStore(STORE_QUIZZES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_HISTORY)) {
              db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
            }
          };

          request.onsuccess = (event) => {
            this.db = event.target.result;
            resolve(this.db);
          };

          request.onerror = () => {
            resolve(null);
          };
        } catch (e) {
          resolve(null);
        }
      });
    }

    async ready() {
      return this.initPromise;
    }

    async getAllQuizzes() {
      await this.ready();
      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction(STORE_QUIZZES, 'readonly');
            const store = tx.objectStore(STORE_QUIZZES);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve(this.getLocalQuizzes());
          } catch (e) {
            resolve(this.getLocalQuizzes());
          }
        });
      } else {
        return this.getLocalQuizzes();
      }
    }

    getLocalQuizzes() {
      try {
        const data = localStorage.getItem('quizranzz_quizzes');
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    }

    async getQuizById(id) {
      await this.ready();
      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction(STORE_QUIZZES, 'readonly');
            const store = tx.objectStore(STORE_QUIZZES);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(this.getLocalQuizzes().find(q => q.id === id) || null);
          } catch (e) {
            resolve(this.getLocalQuizzes().find(q => q.id === id) || null);
          }
        });
      } else {
        const quizzes = this.getLocalQuizzes();
        return quizzes.find(q => q.id === id) || null;
      }
    }

    async saveQuiz(quiz) {
      await this.ready();
      quiz.updatedAt = Date.now();
      if (!quiz.createdAt) quiz.createdAt = Date.now();

      try {
        const quizzes = this.getLocalQuizzes();
        const idx = quizzes.findIndex(q => q.id === quiz.id);
        if (idx >= 0) quizzes[idx] = quiz;
        else quizzes.push(quiz);
        localStorage.setItem('quizranzz_quizzes', JSON.stringify(quizzes));
      } catch (e) {}

      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction(STORE_QUIZZES, 'readwrite');
            const store = tx.objectStore(STORE_QUIZZES);
            const req = store.put(quiz);
            req.onsuccess = () => resolve(quiz);
            req.onerror = () => resolve(quiz);
          } catch (e) {
            resolve(quiz);
          }
        });
      }
      return quiz;
    }

    async deleteQuiz(id) {
      await this.ready();
      try {
        let quizzes = this.getLocalQuizzes();
        quizzes = quizzes.filter(q => q.id !== id);
        localStorage.setItem('quizranzz_quizzes', JSON.stringify(quizzes));
      } catch (e) {}

      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction(STORE_QUIZZES, 'readwrite');
            const store = tx.objectStore(STORE_QUIZZES);
            const req = store.delete(id);
            req.onsuccess = () => resolve(true);
            req.onerror = () => resolve(true);
          } catch (e) {
            resolve(true);
          }
        });
      }
      return true;
    }

    async saveAttempt(attempt) {
      await this.ready();
      attempt.id = attempt.id || 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      attempt.date = attempt.date || Date.now();

      try {
        const list = JSON.parse(localStorage.getItem('quizranzz_history') || '[]');
        list.unshift(attempt);
        if (list.length > 60) list.pop();
        localStorage.setItem('quizranzz_history', JSON.stringify(list));
      } catch (e) {}

      if (this.db) {
        return new Promise((resolve) => {
          try {
            const tx = this.db.transaction(STORE_HISTORY, 'readwrite');
            const store = tx.objectStore(STORE_HISTORY);
            const req = store.put(attempt);
            req.onsuccess = () => resolve(attempt);
            req.onerror = () => resolve(attempt);
          } catch (e) {
            resolve(attempt);
          }
        });
      }
      return attempt;
    }

    async getAttempts(quizId = null) {
      await this.ready();
      let list = [];
      try {
        list = JSON.parse(localStorage.getItem('quizranzz_history') || '[]');
      } catch (e) {
        list = [];
      }
      if (quizId) list = list.filter(a => a.quizId === quizId);
      list.sort((a, b) => b.date - a.date);
      return list;
    }

    async clearAttempts() {
      await this.ready();
      try {
        localStorage.removeItem('quizranzz_history');
      } catch (e) { /* silent */ }
    }
  }

  const storage = new StorageEngine();

  /* ==========================================================================
     3. Helper & Indonesian Sample Quizzes
     ========================================================================== */
  function createSineWavDataUrl(frequency = 440, durationSec = 1.2) {
    try {
      const sampleRate = 22050;
      const numSamples = Math.floor(sampleRate * durationSec);
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      }
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, numSamples * 2, true);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let envelope = 1.0;
        if (i < 500) envelope = i / 500;
        if (i > numSamples - 1000) envelope = (numSamples - i) / 1000;
        
        const sample = Math.sin(2 * Math.PI * frequency * t) * 0.7 * envelope;
        view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      }

      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return 'data:audio/wav;base64,' + btoa(binary);
    } catch (e) {
      return '';
    }
  }

  const cssBoxModelSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="100%" height="100%" fill="%230F172A"/><rect x="40" y="30" width="520" height="280" rx="8" fill="%23F59E0B" fill-opacity="0.2" stroke="%23F59E0B" stroke-width="2"/><text x="50" y="55" fill="%23F59E0B" font-family="sans-serif" font-weight="bold" font-size="14">Margin (Luar)</text><rect x="90" y="70" width="420" height="200" rx="8" fill="%238B5CF6" fill-opacity="0.2" stroke="%238B5CF6" stroke-width="2"/><text x="100" y="95" fill="%238B5CF6" font-family="sans-serif" font-weight="bold" font-size="14">Border (Garis Tepi)</text><rect x="140" y="110" width="320" height="120" rx="8" fill="%2310B981" fill-opacity="0.2" stroke="%2310B981" stroke-width="2"/><text x="150" y="135" fill="%2310B981" font-family="sans-serif" font-weight="bold" font-size="14">Padding (Bantalan)</text><rect x="200" y="145" width="200" height="50" rx="6" fill="%236366F1" stroke="%23818CF8" stroke-width="2"/><text x="300" y="176" fill="%23FFFFFF" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">Content (Konten Utama)</text></svg>';

  const SAMPLE_QUIZZES = [
    {
      id: 'sample_webdev_pro_id',
      title: 'Tantangan Full-Stack Web Development & JavaScript Pro',
      description: 'Uji pemahaman mendalam tentang Event Loop JavaScript, Closure, CSS Box Model, dan Asynchronous Programming.',
      category: 'Pemrograman',
      timeLimit: 10,
      passPercentage: 75,
      shuffleQuestions: false,
      shuffleOptions: true,
      instantFeedback: false,
      antiCheatEnabled: true,
      maxViolations: 3,
      lockFullscreen: false,
      blockCopyPaste: true,
      questions: [
        {
          id: 'q_js_1',
          title: 'Perhatikan kode JavaScript di bawah ini. Urutan output apakah yang akan tercetak pada console browser?',
          type: 'single',
          points: 10,
          codeSnippet: `console.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => console.log('3'));\nconsole.log('4');`,
          codeLang: 'javascript',
          mediaImage: '',
          mediaAudio: '',
          options: [
            { id: 'opt_1', text: '1, 4, 3, 2', isCorrect: true },
            { id: 'opt_2', text: '1, 2, 3, 4', isCorrect: false },
            { id: 'opt_3', text: '1, 4, 2, 3', isCorrect: false },
            { id: 'opt_4', text: '1, 3, 4, 2', isCorrect: false }
          ],
          blankAnswer: '',
          explanation: 'Kode sinkron berjalan lebih dulu (1, 4). Microtask (antrean Promise.then) dieksekusi sebelum Macrotask (setTimeout), menghasilkan urutan: 1, 4, 3, 2.'
        },
        {
          id: 'q_js_2',
          title: 'Lihat diagram CSS Box Model berikut. Properti CSS manakah yang mengatur jarak langsung di antara Garis Tepi (Border) dan Konten (Content)?',
          type: 'single',
          points: 10,
          codeSnippet: '',
          codeLang: 'css',
          mediaImage: cssBoxModelSvg,
          mediaAudio: '',
          options: [
            { id: 'opt_1', text: 'Padding', isCorrect: true },
            { id: 'opt_2', text: 'Margin', isCorrect: false },
            { id: 'opt_3', text: 'Outline', isCorrect: false },
            { id: 'opt_4', text: 'Gap', isCorrect: false }
          ],
          blankAnswer: '',
          explanation: 'Padding berada di dalam border dan memberikan jarak bantalan di sekitar konten elemen.'
        },
        {
          id: 'q_js_3',
          title: 'Manakah pernyataan berikut yang BENAR mengenai Closure dalam JavaScript? (Pilih semua yang berlaku)',
          type: 'multiple',
          points: 15,
          codeSnippet: `function createCounter() {\n  let count = 0;\n  return () => ++count;\n}`,
          codeLang: 'javascript',
          mediaImage: '',
          mediaAudio: '',
          options: [
            { id: 'opt_1', text: 'Closure memberikan fungsi dalam akses ke variabel pada scope fungsi luar pembungkusnya.', isCorrect: true },
            { id: 'opt_2', text: 'Closure langsung terhapus dari memori begitu fungsi luar selesai dijalankan.', isCorrect: false },
            { id: 'opt_3', text: 'Fungsi yang di-return tetap mempertahankan referensi ke variabel `count` dalam memori leksikal.', isCorrect: true },
            { id: 'opt_4', text: 'Closure dapat dimanfaatkan untuk membuat variabel privat (enkapsulasi data).', isCorrect: true }
          ],
          blankAnswer: '',
          explanation: 'Closure mempertahankan referensi ke variabel luar bahkan setelah eksekusi fungsi luar selesai, memungkinkan enkapsulasi data privat.'
        },
        {
          id: 'q_js_4',
          title: 'Ketik kata kunci (keyword) resmi di JavaScript modern untuk mendeklarasikan variabel ber-scope blok yang nilainya tidak dapat di-reassign:',
          type: 'blank',
          points: 10,
          codeSnippet: '',
          codeLang: 'javascript',
          mediaImage: '',
          mediaAudio: '',
          options: [],
          blankAnswer: 'const | const keyword',
          explanation: 'Keyword `const` mendeklarasikan variabel tetap (konstan) yang mengikat nilai pada level blok.'
        },
        {
          id: 'q_js_5',
          title: 'Pada protokol HTTP/2 dan HTTP/3, fitur Multiplexing memungkinkan pengiriman banyak request dan response secara paralel melalui satu koneksi tanpa terblokir antrean (Head-of-Line Blocking).',
          type: 'boolean',
          points: 10,
          codeSnippet: '',
          codeLang: 'bash',
          mediaImage: '',
          mediaAudio: '',
          options: [
            { id: 'opt_1', text: 'Benar (True)', isCorrect: true },
            { id: 'opt_2', text: 'Salah (False)', isCorrect: false }
          ],
          blankAnswer: '',
          explanation: 'Benar. Multiplexing adalah salah satu keunggulan terbesar HTTP/2 dan HTTP/3 untuk efisiensi jaringan modern.'
        }
      ]
    },
    {
      id: 'sample_audio_challenge_id',
      title: 'Tantangan Tes Pendengaran & Frekuensi Suara Akustik',
      description: 'Dengarkan nada audio yang diputar dan tentukan frekuensi gelombang sinus serta prinsip akustiknya.',
      category: 'Audio & Sains',
      timeLimit: 5,
      passPercentage: 70,
      shuffleQuestions: false,
      shuffleOptions: true,
      instantFeedback: true,
      antiCheatEnabled: false,
      maxViolations: 3,
      lockFullscreen: false,
      blockCopyPaste: false,
      questions: [
        {
          id: 'q_aud_1',
          title: 'Putar sampel audio berikut. Berapakah frekuensi standar nada konser (Concert Pitch A4) dari bunyi gelombang ini?',
          type: 'single',
          points: 15,
          codeSnippet: '',
          codeLang: '',
          mediaImage: '',
          mediaAudio: createSineWavDataUrl(440, 1.5),
          options: [
            { id: 'opt_1', text: '440 Hz (Standar Nada A4)', isCorrect: true },
            { id: 'opt_2', text: '220 Hz (Nada Rendah A3)', isCorrect: false },
            { id: 'opt_3', text: '880 Hz (Nada Tinggi A5)', isCorrect: false },
            { id: 'opt_4', text: '1000 Hz Nada Uji', isCorrect: false }
          ],
          blankAnswer: '',
          explanation: 'Frekuensi standar konser internasional (ISO 16) menetapkan nada A4 berada tepat pada 440 Hz.'
        },
        {
          id: 'q_aud_2',
          title: 'Dengarkan nada yang lebih tinggi ini. Satu oktaf tepat di atas 440 Hz berada pada frekuensi berapa?',
          type: 'single',
          points: 15,
          codeSnippet: '',
          codeLang: '',
          mediaImage: '',
          mediaAudio: createSineWavDataUrl(880, 1.5),
          options: [
            { id: 'opt_1', text: '880 Hz (A5)', isCorrect: true },
            { id: 'opt_2', text: '660 Hz', isCorrect: false },
            { id: 'opt_3', text: '1320 Hz', isCorrect: false },
            { id: 'opt_4', text: '550 Hz', isCorrect: false }
          ],
          blankAnswer: '',
          explanation: 'Setiap kenaikan 1 oktaf dalam musik melipatgandakan nilai frekuensi (440 Hz x 2 = 880 Hz).'
        },
        {
          id: 'q_aud_3',
          title: 'Rentang frekuensi pendengaran normal telinga manusia sehat berada pada kisaran 20 Hz hingga 20.000 Hz (20 kHz).',
          type: 'boolean',
          points: 10,
          codeSnippet: '',
          codeLang: '',
          mediaImage: '',
          mediaAudio: createSineWavDataUrl(523.25, 1.0),
          options: [
            { id: 'opt_1', text: 'Benar (True)', isCorrect: true },
            { id: 'opt_2', text: 'Salah (False)', isCorrect: false }
          ],
          blankAnswer: '',
          explanation: 'Benar. Rentang pendengaran manusia berkisar antara 20 Hz (audiosonik) hingga 20 kHz.'
        }
      ]
    }
  ];

  /* ==========================================================================
     4. Bulk Parser (Indonesian & Markdown Support)
     ========================================================================== */
  class BulkQuizParser {
    static parse(rawText) {
      if (!rawText || !rawText.trim()) return [];
      const blocks = this.splitIntoQuestionBlocks(rawText.trim());
      const questions = [];

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i].trim();
        if (!block) continue;
        const q = this.parseSingleQuestion(block, i + 1);
        if (q) questions.push(q);
      }
      return questions;
    }

    static splitIntoQuestionBlocks(text) {
      if (text.includes('\n---\n') || text.includes('\n===\n')) {
        return text.split(/\n(?:---|===)\n/);
      }

      const lines = text.split('\n');
      const blocks = [];
      let currentBlock = [];
      const startRegex = /^(?:(?:\d+[\.\)])|(?:Q(?:uestion)?\s*\d+[\:\.\)]?)|(?:Soal\s*\d+[\:\.\)]?))\s+/i;

      for (const line of lines) {
        if (startRegex.test(line.trim()) && currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'));
          currentBlock = [line];
        } else {
          currentBlock.push(line);
        }
      }
      if (currentBlock.length > 0) blocks.push(currentBlock.join('\n'));
      return blocks;
    }

    static parseSingleQuestion(block, index) {
      const lines = block.split('\n').map(l => l.trimEnd());
      if (lines.length === 0) return null;

      let title = '';
      let codeSnippet = '';
      let codeLang = 'javascript';
      let explanation = '';
      let type = 'single';
      let points = 10;
      const options = [];
      let blankAnswers = [];

      let inCodeBlock = false;
      let codeLines = [];
      let readingExplanation = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            const matchLang = line.replace('```', '').trim();
            if (matchLang) codeLang = matchLang;
            codeLines = [];
          } else {
            inCodeBlock = false;
            codeSnippet = codeLines.join('\n');
          }
          continue;
        }

        if (inCodeBlock) {
          codeLines.push(lines[i]);
          continue;
        }

        if (line.match(/^(?:Explanation|Penjelasan|Pembahasan|Catatan)[\:\-]\s*/i)) {
          readingExplanation = true;
          explanation = line.replace(/^(?:Explanation|Penjelasan|Pembahasan|Catatan)[\:\-]\s*/i, '').trim();
          continue;
        }

        if (readingExplanation) {
          explanation += '\n' + line;
          continue;
        }

        const ansMatch = line.match(/^(?:Answer|Kunci(?:\s*Jawaban)?|Jawaban|Ans)[\:\-]\s*(.+)$/i);
        if (ansMatch) {
          const rawAns = ansMatch[1].trim();
          const letters = rawAns.match(/[A-Za-z0-9]/g);
          if (letters && letters.length > 0 && (letters.length <= 4 || letters.every(l => l.length === 1))) {
            rawAns.split(/[,;\s]+/).forEach(token => {
              const cleanToken = token.trim().toUpperCase();
              if (cleanToken.length === 1) {
                const optIdx = cleanToken.charCodeAt(0) - 65;
                if (options[optIdx]) options[optIdx].isCorrect = true;
              }
            });
          } else {
            blankAnswers.push(rawAns);
          }
          continue;
        }

        if (!title && !line.match(/^(?:[A-Fa-f0-9][\.\)\:]|[\-\*\+]\s*\[[ xX]\]|[\-\*\+]\s*\(?[A-Fa-f0-9]\)?)/)) {
          title = line.replace(/^(?:(?:\d+[\.\)])|(?:Q(?:uestion)?\s*\d*[\:\.\)]?)|(?:Soal\s*\d*[\:\.\)]?))\s*/i, '').trim();
          continue;
        } else if (!title && line) {
          title = line;
          continue;
        }

        const optionMatch = line.match(/^(\*)?\s*(?:([A-Za-z0-9])[\.\)\:]|[\-\*\+]\s*\[([ xX])\]|[\-\*\+]\s*\(?([A-Za-z0-9])?\)?)\s*(.+)$/i);
        if (optionMatch) {
          const isAsterisk = !!optionMatch[1];
          const checkboxState = optionMatch[3];
          const optText = optionMatch[5].trim();

          const isCorrect = isAsterisk || 
                            (checkboxState && (checkboxState === 'x' || checkboxState === 'X')) ||
                            optText.includes('(Correct)') ||
                            optText.includes('(Kunci)') ||
                            optText.includes('(Benar)');

          const cleanOptText = optText.replace(/\s*\((?:Correct|Benar|Kunci)\)\s*/i, '').trim();

          options.push({
            id: 'opt_' + Math.random().toString(36).substr(2, 6),
            text: cleanOptText,
            isCorrect: isCorrect
          });
          continue;
        }

        if (options.length === 0 && !readingExplanation) {
          title += '\n' + line;
        }
      }

      if (!title && options.length === 0) return null;

      const correctCount = options.filter(o => o.isCorrect).length;
      if (options.length === 0 && blankAnswers.length > 0) {
        type = 'blank';
      } else if (options.length === 2 && options.some(o => /^(true|benar)$/i.test(o.text)) && options.some(o => /^(false|salah)$/i.test(o.text))) {
        type = 'boolean';
      } else if (correctCount > 1) {
        type = 'multiple';
      } else {
        type = 'single';
      }

      if ((type === 'single' || type === 'multiple') && options.length > 0 && correctCount === 0) {
        options[0].isCorrect = true;
      }

      return {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: title || `Pertanyaan ${index}`,
        type: type,
        points: points,
        codeSnippet: codeSnippet || '',
        codeLang: codeLang || 'javascript',
        mediaImage: '',
        mediaAudio: '',
        options: options.length > 0 ? options : [
          { id: 'opt_1', text: 'Pilihan A', isCorrect: true },
          { id: 'opt_2', text: 'Pilihan B', isCorrect: false }
        ],
        blankAnswer: blankAnswers.join('|'),
        explanation: explanation.trim()
      };
    }
  }

  /* ==========================================================================
     5. Indonesian Canvas Certificate Generator
     ========================================================================== */
  class CertificateGenerator {
    static render(canvas, data) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = 1600;
      const H = 1100;
      canvas.width = W;
      canvas.height = H;

      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#090D18');
      bgGrad.addColorStop(0.5, '#121A2E');
      bgGrad.addColorStop(1, '#070A13');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      const radialGlow = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 750);
      radialGlow.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
      radialGlow.addColorStop(0.7, 'rgba(236, 72, 153, 0.04)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, W, H);

      ctx.lineWidth = 14;
      const borderGrad = ctx.createLinearGradient(0, 0, W, H);
      borderGrad.addColorStop(0, '#F59E0B');
      borderGrad.addColorStop(0.3, '#6366F1');
      borderGrad.addColorStop(0.7, '#EC4899');
      borderGrad.addColorStop(1, '#F59E0B');
      ctx.strokeStyle = borderGrad;
      ctx.strokeRect(40, 40, W - 80, H - 80);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.strokeRect(60, 60, W - 120, H - 120);

      this.drawCorner(ctx, 60, 60, 1, 1);
      this.drawCorner(ctx, W - 60, 60, -1, 1);
      this.drawCorner(ctx, 60, H - 60, 1, -1);
      this.drawCorner(ctx, W - 60, H - 60, -1, -1);

      ctx.textAlign = 'center';
      ctx.font = '800 24px "Inter", sans-serif';
      ctx.fillStyle = '#818CF8';
      ctx.fillText('QUIZRANZZPRO • SERTIFIKASI EVALUASI RESMI', W / 2, 140);

      ctx.font = '900 54px "Inter", sans-serif';
      const titleGrad = ctx.createLinearGradient(W/2 - 320, 0, W/2 + 320, 0);
      titleGrad.addColorStop(0, '#FFFFFF');
      titleGrad.addColorStop(0.5, '#E0E7FF');
      titleGrad.addColorStop(1, '#CBD5E1');
      ctx.fillStyle = titleGrad;
      ctx.fillText('SERTIFIKAT KELULUSAN & PRESTASI', W / 2, 230);

      ctx.font = '500 22px "Inter", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Sertifikat ini secara bangga diberikan kepada:', W / 2, 310);

      ctx.font = '900 58px "Inter", sans-serif';
      const nameGrad = ctx.createLinearGradient(W/2 - 260, 0, W/2 + 260, 0);
      nameGrad.addColorStop(0, '#38BDF8');
      nameGrad.addColorStop(0.5, '#818CF8');
      nameGrad.addColorStop(1, '#F472B6');
      ctx.fillStyle = nameGrad;
      ctx.fillText(data.studentName || 'Peserta Berprestasi', W / 2, 400);

      ctx.beginPath();
      ctx.moveTo(W / 2 - 280, 425);
      ctx.lineTo(W / 2 + 280, 425);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#6366F1';
      ctx.stroke();

      ctx.font = '400 22px "Inter", sans-serif';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText('Atas dedikasi dan keberhasilan menyelesaikan ujian kompetensi:', W / 2, 480);

      ctx.font = '800 36px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`"${data.quizTitle || 'Ujian Penilaian'}"`, W / 2, 545);

      this.drawScoreBadge(ctx, W / 2, 690, data.scorePercent || 100, data.grade || 'A+');

      ctx.textAlign = 'left';
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`Tanggal Terbit: ${data.date || new Date().toLocaleDateString('id-ID')}`, 120, 940);
      ctx.font = '600 15px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748B';
      ctx.fillText(`No. Sertifikat: ${data.certId || 'QR-' + Math.random().toString(36).substr(2, 9).toUpperCase()}`, 120, 970);

      ctx.textAlign = 'right';
      ctx.font = '800 20px "Inter", sans-serif';
      ctx.fillStyle = '#10B981';
      ctx.fillText('✓ TERVERIFIKASI & AMAN', W - 120, 940);
      ctx.font = '500 16px "Inter", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('QuizRanzzPro Assessment Engine', W - 120, 970);
    }

    static drawCorner(ctx, x, y, dx, dy) {
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + dx * 10, y + dy * 45);
      ctx.lineTo(x + dx * 10, y + dy * 10);
      ctx.lineTo(x + dx * 45, y + dy * 10);
      ctx.stroke();
      ctx.restore();
    }

    static drawScoreBadge(ctx, x, y, percent, grade) {
      ctx.save();
      const grad = ctx.createLinearGradient(x - 70, y - 70, x + 70, y + 70);
      grad.addColorStop(0, '#F59E0B');
      grad.addColorStop(0.5, '#FBBF24');
      grad.addColorStop(1, '#D97706');

      ctx.beginPath();
      ctx.arc(x, y, 75, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = grad;
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.arc(x, y, 64, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FBBF24';
      ctx.font = '900 36px "Inter", sans-serif';
      ctx.fillText(`${percent}%`, x, y + 2);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 18px "Inter", sans-serif';
      ctx.fillText(`PREDIKAT ${grade}`, x, y + 32);

      ctx.font = '700 13px "Inter", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('NILAI AKHIR', x, y - 36);

      ctx.restore();
    }

    static downloadPNG(canvas, filename = 'Sertifikat_QuizRanzzPro.png') {
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }
  }

  /* ==========================================================================
     6. Serverless Share Engine
     ========================================================================== */
  class QuizShareEngine {
    static encodeToURL(quiz) {
      try {
        const portableQuiz = {
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          timeLimit: quiz.timeLimit,
          passPercentage: quiz.passPercentage,
          shuffleQuestions: quiz.shuffleQuestions,
          shuffleOptions: quiz.shuffleOptions,
          instantFeedback: quiz.instantFeedback,
          antiCheatEnabled: quiz.antiCheatEnabled,
          maxViolations: quiz.maxViolations,
          lockFullscreen: quiz.lockFullscreen,
          blockCopyPaste: quiz.blockCopyPaste,
          questions: (quiz.questions || []).map(q => ({
            title: q.title,
            type: q.type,
            points: q.points,
            codeSnippet: q.codeSnippet || '',
            codeLang: q.codeLang || 'javascript',
            mediaImage: q.mediaImage || '',
            mediaAudio: q.mediaAudio || '',
            options: q.options || [],
            blankAnswer: q.blankAnswer || '',
            explanation: q.explanation || ''
          }))
        };

        const jsonStr = JSON.stringify(portableQuiz);
        const encoded = encodeURIComponent(jsonStr);
        const base64 = btoa(unescape(encoded));
        
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#quiz=${base64}`;
      } catch (err) {
        return null;
      }
    }

    static decodeFromURL(hash) {
      try {
        if (!hash || !hash.includes('quiz=')) return null;
        const rawBase64 = hash.split('quiz=')[1];
        if (!rawBase64) return null;

        const jsonStr = decodeURIComponent(escape(atob(rawBase64)));
        const quiz = JSON.parse(jsonStr);

        quiz.id = 'shared_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        quiz.createdAt = Date.now();
        quiz.updatedAt = Date.now();
        return quiz;
      } catch (err) {
        return null;
      }
    }
  }

  /* ==========================================================================
     7. Quiz Studio (Creator Controller)
     ========================================================================== */
  class QuizEditor {
    constructor(app) {
      this.app = app;
      this.currentQuiz = null;
    }

    get container() {
      return document.getElementById('studio-view');
    }

    createNewQuiz() {
      this.currentQuiz = {
        id: 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: 'Kuis Kustom Baru',
        description: 'Tuliskan pertanyaan, lampirkan gambar, audio, atau kode pemrograman untuk kuis ini.',
        category: 'Umum',
        timeLimit: 15,
        passPercentage: 75,
        shuffleQuestions: false,
        shuffleOptions: true,
        instantFeedback: false,
        antiCheatEnabled: true,
        maxViolations: 3,
        lockFullscreen: false,
        blockCopyPaste: true,
        questions: [
          this.createEmptyQuestion(1)
        ]
      };
      this.render();
    }

    loadQuiz(quiz) {
      this.currentQuiz = JSON.parse(JSON.stringify(quiz));
      if (!this.currentQuiz.questions || this.currentQuiz.questions.length === 0) {
        this.currentQuiz.questions = [this.createEmptyQuestion(1)];
      }
      this.render();
    }

    createEmptyQuestion(index) {
      return {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: `Pertanyaan Soal ${index}`,
        type: 'single',
        points: 10,
        codeSnippet: '',
        codeLang: 'javascript',
        mediaImage: '',
        mediaAudio: '',
        options: [
          { id: 'opt_1', text: 'Pilihan A', isCorrect: true },
          { id: 'opt_2', text: 'Pilihan B', isCorrect: false },
          { id: 'opt_3', text: 'Pilihan C', isCorrect: false },
          { id: 'opt_4', text: 'Pilihan D', isCorrect: false }
        ],
        blankAnswer: '',
        explanation: ''
      };
    }

    render() {
      if (!this.container || !this.currentQuiz) return;

      this.container.innerHTML = `
        <div class="studio-header">
          <div class="studio-title-area">
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <button class="btn btn-ghost btn-sm" id="btn-studio-back" title="Kembali ke Koleksi">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Kembali
              </button>
              <h2>Quiz Studio</h2>
            </div>
            <p>Rancang soal kuis, sisipkan gambar, audio, blok kode, dan atur proteksi ujian.</p>
          </div>
          <div class="studio-actions">
            <button class="btn btn-secondary" id="btn-studio-bulk">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Generator Teks / AI
            </button>
            <button class="btn btn-secondary" id="btn-studio-share" title="Bagikan Link Kuis">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Bagikan Link
            </button>
            <button class="btn btn-primary" id="btn-studio-save">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Simpan Kuis
            </button>
            <button class="btn btn-success" id="btn-studio-play">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Mulai Ujian
            </button>
          </div>
        </div>

        <div class="studio-layout">
          <!-- Sidebar Settings -->
          <div class="quiz-settings-panel">
            <div class="card settings-card">
              <h3>Pengaturan Kuis</h3>

              <div class="form-group">
                <label class="form-label">Judul Kuis</label>
                <input type="text" class="form-input" id="meta-quiz-title" value="${this.escapeHtml(this.currentQuiz.title)}" placeholder="Contoh: Kuis Pemrograman JavaScript Pro">
              </div>

              <div class="form-group">
                <label class="form-label">Deskripsi / Penjelasan Singkat</label>
                <textarea class="form-textarea" id="meta-quiz-desc" placeholder="Tuliskan petunjuk kuis atau topik materi...">${this.escapeHtml(this.currentQuiz.description || '')}</textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Kategori / Mata Pelajaran</label>
                <select class="form-select" id="meta-quiz-cat">
                  <option value="Pemrograman" ${this.currentQuiz.category === 'Pemrograman' ? 'selected' : ''}>💻 Pemrograman & IT</option>
                  <option value="Audio & Sains" ${this.currentQuiz.category === 'Audio & Sains' ? 'selected' : ''}>🎧 Audio & Sains</option>
                  <option value="Umum" ${this.currentQuiz.category === 'Umum' ? 'selected' : ''}>🌍 Pengetahuan Umum</option>
                  <option value="Matematika" ${this.currentQuiz.category === 'Matematika' ? 'selected' : ''}>📐 Matematika & Logika</option>
                  <option value="Bahasa" ${this.currentQuiz.category === 'Bahasa' ? 'selected' : ''}>🗣️ Bahasa & Sastra</option>
                  <option value="Kustom" ${this.currentQuiz.category === 'Kustom' ? 'selected' : ''}>✨ Kustom</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Batas Waktu (Menit, 0 = Tanpa Batas)</label>
                <input type="number" min="0" max="180" class="form-input" id="meta-quiz-time" value="${this.currentQuiz.timeLimit || 0}">
              </div>

              <div class="form-group">
                <label class="form-label">Batas Nilai Kelulusan (%)</label>
                <input type="number" min="1" max="100" class="form-input" id="meta-quiz-pass" value="${this.currentQuiz.passPercentage || 70}">
              </div>

              <div class="settings-section-title">🛡️ Proteksi Anti-Curang (Proctoring)</div>

              <div class="toggle-group">
                <div class="toggle-label">
                  <span class="toggle-title">🔒 Deteksi Pindah Tab & Buka Web Lain</span>
                  <span class="toggle-desc">Peringatkan & blokir jika peserta keluar web</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="meta-quiz-anticheat" ${this.currentQuiz.antiCheatEnabled ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-group" id="group-max-violations" style="${this.currentQuiz.antiCheatEnabled ? 'display:flex;' : 'display:none;'}">
                <label class="form-label">Toleransi Pindah Tab (Sebelum Diskualifikasi)</label>
                <select class="form-select" id="meta-quiz-violations">
                  <option value="1" ${this.currentQuiz.maxViolations === 1 ? 'selected' : ''}>1x (Langsung Diskualifikasi)</option>
                  <option value="2" ${this.currentQuiz.maxViolations === 2 ? 'selected' : ''}>2x Peringatan</option>
                  <option value="3" ${this.currentQuiz.maxViolations === 3 ? 'selected' : ''}>3x Peringatan (Rekomendasi)</option>
                  <option value="5" ${this.currentQuiz.maxViolations === 5 ? 'selected' : ''}>5x Peringatan</option>
                </select>
              </div>

              <div class="toggle-group">
                <div class="toggle-label">
                  <span class="toggle-title">🚫 Blokir Copy-Paste & Klik Kanan</span>
                  <span class="toggle-desc">Mencegah mencontek teks soal atau inspect element</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="meta-quiz-block-copy" ${this.currentQuiz.blockCopyPaste ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="settings-section-title">Opsi Ujian Lainnya</div>

              <div class="toggle-group">
                <div class="toggle-label">
                  <span class="toggle-title">🔀 Acak Urutan Soal</span>
                  <span class="toggle-desc">Urutan soal berbeda untuk tiap peserta</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="meta-quiz-shuffle-q" ${this.currentQuiz.shuffleQuestions ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="toggle-group">
                <div class="toggle-label">
                  <span class="toggle-title">🔀 Acak Pilihan Opsi</span>
                  <span class="toggle-desc">Posisi pilihan A, B, C, D diacak</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="meta-quiz-shuffle-opt" ${this.currentQuiz.shuffleOptions ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="toggle-group">
                <div class="toggle-label">
                  <span class="toggle-title">💡 Mode Latihan (Feedback Instan)</span>
                  <span class="toggle-desc">Tampilkan benar/salah & pembahasan per soal</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="meta-quiz-instant" ${this.currentQuiz.instantFeedback ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="settings-section-title">🔐 Kode Akses (Opsional)</div>

              <div class="toggle-group">
                <div class="toggle-label">
                  <span class="toggle-title">🔒 Proteksi Kode Akses</span>
                  <span class="toggle-desc">Peserta harus memasukkan kode untuk memulai</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="meta-quiz-access-enabled" ${this.currentQuiz.accessCodeEnabled ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-group" id="group-access-code" style="${this.currentQuiz.accessCodeEnabled ? 'display:flex;' : 'display:none;'}">
                <label class="form-label">Kode Akses (4–12 Karakter, Huruf & Angka)</label>
                <input type="text" class="form-input form-input-mono" id="meta-quiz-access-code"
                  value="${this.escapeHtml(this.currentQuiz.accessCode || '')}"
                  placeholder="Contoh: KELAS12A"
                  maxlength="12"
                  style="font-size:1.2rem;letter-spacing:0.15em;text-transform:uppercase;">
              </div>
            </div>
          </div>

          <!-- Questions List Builder -->
          <div class="questions-builder-area">
            <div class="questions-container" id="questions-list-root">
              ${this.currentQuiz.questions.map((q, idx) => this.renderQuestionCard(q, idx)).join('')}
            </div>

            <div class="add-question-bar" style="margin-top: 1.5rem;">
              <button class="btn btn-primary" id="btn-add-question">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Tambah Soal Baru
              </button>
            </div>
          </div>
        </div>
      `;

      this.attachEventListeners();
    }

    renderQuestionCard(q, idx) {
      return `
        <div class="question-card" data-qid="${q.id}">
          <div class="question-card-header">
            <div class="question-number-badge">
              <span class="badge badge-primary">Soal ${idx + 1}</span>
              <div class="type-select-wrapper">
                <select class="form-select q-type-select" data-qid="${q.id}" style="padding:0.3rem 0.65rem;font-size:0.85rem;">
                  <option value="single" ${q.type === 'single' ? 'selected' : ''}>Pilihan Ganda (Tunggal)</option>
                  <option value="multiple" ${q.type === 'multiple' ? 'selected' : ''}>Pilihan Ganda (Banyak Jawaban / Checkbox)</option>
                  <option value="boolean" ${q.type === 'boolean' ? 'selected' : ''}>Benar / Salah (True / False)</option>
                  <option value="blank" ${q.type === 'blank' ? 'selected' : ''}>Isian Singkat (Text Match)</option>
                </select>
              </div>
            </div>

            <div class="question-card-controls">
              <input type="number" min="1" max="100" class="form-input q-points-input" data-qid="${q.id}" value="${q.points || 10}" title="Bobot Poin" style="width:70px;padding:0.25rem 0.5rem;font-size:0.85rem;">
              <span style="font-size:0.75rem;color:var(--text-muted);">poin</span>
              
              <button class="btn btn-ghost btn-sm btn-icon-only q-move-up" data-qid="${q.id}" title="Pindah ke Atas" ${idx === 0 ? 'disabled' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon-only q-move-down" data-qid="${q.id}" title="Pindah ke Bawah" ${idx === this.currentQuiz.questions.length - 1 ? 'disabled' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon-only q-duplicate" data-qid="${q.id}" title="Duplikat Soal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon-only q-delete" data-qid="${q.id}" title="Hapus Soal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <textarea class="form-textarea q-title-input" data-qid="${q.id}" placeholder="Tuliskan teks pertanyaan soal di sini..." rows="2">${this.escapeHtml(q.title)}</textarea>
          </div>

          <div class="media-attachment-box">
            <div class="media-upload-triggers">
              <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                + Lampirkan Gambar
                <input type="file" accept="image/*" class="media-file-input q-img-file" data-qid="${q.id}">
              </label>

              <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                + Lampirkan Audio
                <input type="file" accept="audio/*" class="media-file-input q-aud-file" data-qid="${q.id}">
              </label>

              <button class="btn btn-ghost btn-sm q-toggle-code" data-qid="${q.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                ${q.codeSnippet ? 'Edit Blok Kode' : '+ Sisipkan Kode Pemrograman'}
              </button>
            </div>

            ${q.mediaImage ? `
              <div class="media-preview-container">
                <div class="image-preview-wrapper">
                  <img src="${q.mediaImage}" alt="Lampiran Gambar">
                  <div class="media-preview-actions">
                    <button class="btn btn-danger btn-sm btn-icon-only q-remove-img" data-qid="${q.id}" title="Hapus gambar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ` : ''}

            ${q.mediaAudio ? `
              <div class="media-preview-container">
                <div class="audio-preview-wrapper">
                  <audio controls src="${q.mediaAudio}"></audio>
                  <button class="btn btn-danger btn-sm btn-icon-only q-remove-aud" data-qid="${q.id}" title="Hapus audio">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="code-snippet-box" id="code-box-${q.id}" style="${q.codeSnippet ? 'display:block;' : 'display:none;'}">
            <div class="code-snippet-header">
              <span class="code-lang-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                Bahasa Sintaks:
              </span>
              <select class="form-select q-code-lang" data-qid="${q.id}" style="width:auto;padding:0.15rem 0.5rem;font-size:0.75rem;">
                <option value="javascript" ${q.codeLang === 'javascript' ? 'selected' : ''}>JavaScript / TypeScript</option>
                <option value="python" ${q.codeLang === 'python' ? 'selected' : ''}>Python</option>
                <option value="html" ${q.codeLang === 'html' ? 'selected' : ''}>HTML / XML</option>
                <option value="css" ${q.codeLang === 'css' ? 'selected' : ''}>CSS</option>
                <option value="sql" ${q.codeLang === 'sql' ? 'selected' : ''}>SQL</option>
                <option value="cpp" ${q.codeLang === 'cpp' ? 'selected' : ''}>C / C++</option>
                <option value="java" ${q.codeLang === 'java' ? 'selected' : ''}>Java</option>
                <option value="bash" ${q.codeLang === 'bash' ? 'selected' : ''}>Bash / Shell</option>
              </select>
            </div>
            <textarea class="code-editor-textarea q-code-input" data-qid="${q.id}" placeholder="// Tuliskan atau paste kode di sini...">${this.escapeHtml(q.codeSnippet || '')}</textarea>
          </div>

          ${q.type === 'blank' ? `
            <div class="form-group" style="margin-top:1rem;">
              <label class="form-label">
                Kata Kunci Jawaban Benar (Gunakan "|" untuk alternatif jawaban)
                <span class="badge badge-neutral">Abaikan Huruf Besar/Kecil</span>
              </label>
              <input type="text" class="form-input q-blank-input" data-qid="${q.id}" value="${this.escapeHtml(q.blankAnswer || '')}" placeholder="Contoh: const | const keyword | konstanta">
            </div>
          ` : `
            <div class="options-builder" data-qid="${q.id}">
              ${q.options.map((opt, oIdx) => `
                <div class="option-row ${opt.isCorrect ? 'is-correct' : ''}" data-optid="${opt.id}">
                  <button type="button" class="option-select-btn ${q.type === 'multiple' ? 'checkbox' : ''} q-toggle-correct" data-qid="${q.id}" data-optid="${opt.id}" title="${opt.isCorrect ? 'Kunci Jawaban Benar' : 'Tandai Sebagai Jawaban Benar'}">
                    ${opt.isCorrect ? '✓' : ''}
                  </button>
                  <input type="text" class="option-input q-opt-text" data-qid="${q.id}" data-optid="${opt.id}" value="${this.escapeHtml(opt.text)}" placeholder="Pilihan ${String.fromCharCode(65 + oIdx)}">
                  <div class="option-actions">
                    ${q.options.length > 2 && q.type !== 'boolean' ? `
                      <button type="button" class="btn btn-ghost btn-sm btn-icon-only q-del-opt" data-qid="${q.id}" data-optid="${opt.id}" title="Hapus opsi">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}

              ${q.type !== 'boolean' ? `
                <button type="button" class="btn btn-ghost btn-sm q-add-opt" data-qid="${q.id}" style="align-self:flex-start;margin-top:0.25rem;">
                  + Tambah Pilihan Opsi
                </button>
              ` : ''}
            </div>
          `}

          <div class="explanation-box">
            <label class="form-label" style="font-size:0.85rem;color:var(--text-muted);">
              💡 Pembahasan & Penjelasan Solusi (Opsional)
            </label>
            <textarea class="form-textarea q-expl-input" data-qid="${q.id}" rows="2" placeholder="Jelaskan alasan mengapa jawaban tersebut benar...">${this.escapeHtml(q.explanation || '')}</textarea>
          </div>
        </div>
      `;
    }

    attachEventListeners() {
      document.getElementById('btn-studio-back')?.addEventListener('click', () => {
        this.app.switchView('dashboard');
      });

      document.getElementById('btn-studio-save')?.addEventListener('click', () => {
        this.saveCurrentQuiz();
      });

      document.getElementById('btn-studio-play')?.addEventListener('click', async () => {
        await this.saveCurrentQuiz(false);
        this.app.startQuiz(this.currentQuiz);
      });

      document.getElementById('btn-studio-share')?.addEventListener('click', () => {
        this.collectFormData();
        this.app.openShareModal(this.currentQuiz);
      });

      document.getElementById('btn-studio-bulk')?.addEventListener('click', () => {
        this.openBulkModal();
      });

      // Anti-cheat toggle visibility
      document.getElementById('meta-quiz-anticheat')?.addEventListener('change', (e) => {
        const group = document.getElementById('group-max-violations');
        if (group) group.style.display = e.target.checked ? 'flex' : 'none';
      });

      // Access code toggle visibility
      document.getElementById('meta-quiz-access-enabled')?.addEventListener('change', (e) => {
        const group = document.getElementById('group-access-code');
        if (group) group.style.display = e.target.checked ? 'flex' : 'none';
      });

      document.getElementById('btn-add-question')?.addEventListener('click', () => {
        this.collectFormData();
        this.currentQuiz.questions.push(this.createEmptyQuestion(this.currentQuiz.questions.length + 1));
        this.render();
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      });

      const qListRoot = document.getElementById('questions-list-root');
      if (!qListRoot) return;

      qListRoot.querySelectorAll('.q-type-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const qid = e.target.dataset.qid;
          const newType = e.target.value;
          const q = this.currentQuiz.questions.find(x => x.id === qid);
          if (!q) return;
          this.collectFormData();
          q.type = newType;
          if (newType === 'boolean') {
            q.options = [
              { id: 'opt_true', text: 'Benar (True)', isCorrect: true },
              { id: 'opt_false', text: 'Salah (False)', isCorrect: false }
            ];
          } else if (newType === 'blank') {
            q.options = [];
            if (!q.blankAnswer) q.blankAnswer = '';
          } else if (q.options.length < 2) {
            q.options = [
              { id: 'opt_1', text: 'Pilihan A', isCorrect: true },
              { id: 'opt_2', text: 'Pilihan B', isCorrect: false }
            ];
          }
          this.render();
        });
      });

      qListRoot.querySelectorAll('.q-toggle-correct').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.dataset.qid;
          const optid = btn.dataset.optid;
          const q = this.currentQuiz.questions.find(x => x.id === qid);
          if (!q) return;

          this.collectFormData();
          if (q.type === 'multiple') {
            const opt = q.options.find(o => o.id === optid);
            if (opt) opt.isCorrect = !opt.isCorrect;
          } else {
            q.options.forEach(o => {
              o.isCorrect = (o.id === optid);
            });
          }
          this.render();
        });
      });

      qListRoot.querySelectorAll('.q-add-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.dataset.qid;
          const q = this.currentQuiz.questions.find(x => x.id === qid);
          if (!q) return;
          this.collectFormData();
          q.options.push({
            id: 'opt_' + Math.random().toString(36).substr(2, 6),
            text: `Pilihan ${String.fromCharCode(65 + q.options.length)}`,
            isCorrect: false
          });
          this.render();
        });
      });

      qListRoot.querySelectorAll('.q-del-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.dataset.qid;
          const optid = btn.dataset.optid;
          const q = this.currentQuiz.questions.find(x => x.id === qid);
          if (!q || q.options.length <= 2) return;
          this.collectFormData();
          q.options = q.options.filter(o => o.id !== optid);
          if (!q.options.some(o => o.isCorrect)) {
            q.options[0].isCorrect = true;
          }
          this.render();
        });
      });

      qListRoot.querySelectorAll('.q-move-up').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.dataset.qid;
          const idx = this.currentQuiz.questions.findIndex(x => x.id === qid);
          if (idx > 0) {
            this.collectFormData();
            const temp = this.currentQuiz.questions[idx];
            this.currentQuiz.questions[idx] = this.currentQuiz.questions[idx - 1];
            this.currentQuiz.questions[idx - 1] = temp;
            this.render();
          }
        });
      });

      qListRoot.querySelectorAll('.q-move-down').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.dataset.qid;
          const idx = this.currentQuiz.questions.findIndex(x => x.id === qid);
          if (idx >= 0 && idx < this.currentQuiz.questions.length - 1) {
            this.collectFormData();
            const temp = this.currentQuiz.questions[idx];
            this.currentQuiz.questions[idx] = this.currentQuiz.questions[idx + 1];
            this.currentQuiz.questions[idx + 1] = temp;
            this.render();
          }
        });
      });

      qListRoot.querySelectorAll('.q-duplicate').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.dataset.qid;
          const idx = this.currentQuiz.questions.findIndex(x => x.id === qid);
          if (idx >= 0) {
            this.collectFormData();
            const clone = JSON.parse(JSON.stringify(this.currentQuiz.questions[idx]));
            clone.id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            clone.title += ' (Duplikat)';
            this.currentQuiz.questions.splice(idx + 1, 0, clone);
            this.render();
          }
        });
      });

      qListRoot.querySelectorAll('.q-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.currentQuiz.questions.length <= 1) {
            this.app.showToast('Kuis harus memiliki minimal satu soal!', 'warning');
            return;
          }
          const qid = btn.dataset.qid;
          this.collectFormData();
          this.currentQuiz.questions = this.currentQuiz.questions.filter(x => x.id !== qid);
          this.render();
        });
      });

      qListRoot.querySelectorAll('.q-toggle-code').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.dataset.qid;
          const box = document.getElementById(`code-box-${qid}`);
          if (box) {
            const isHidden = box.style.display === 'none';
            box.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
              box.querySelector('textarea')?.focus();
            }
          }
        });
      });

      qListRoot.querySelectorAll('.q-img-file').forEach(input => {
        input.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const qid = input.dataset.qid;
          const q = this.currentQuiz.questions.find(x => x.id === qid);
          if (!q) return;

          const reader = new FileReader();
          reader.onload = (evt) => {
            this.collectFormData();
            q.mediaImage = evt.target.result;
            this.render();
            this.app.showToast('Gambar berhasil dilampirkan!', 'success');
          };
          reader.readAsDataURL(file);
        });
      });

      qListRoot.querySelectorAll('.q-aud-file').forEach(input => {
        input.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const qid = input.dataset.qid;
          const q = this.currentQuiz.questions.find(x => x.id === qid);
          if (!q) return;

          const reader = new FileReader();
          reader.onload = (evt) => {
            this.collectFormData();
            q.mediaAudio = evt.target.result;
            this.render();
            this.app.showToast('Audio berhasil dilampirkan!', 'success');
          };
          reader.readAsDataURL(file);
        });
      });

      qListRoot.querySelectorAll('.q-remove-img').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.dataset.qid;
          const q = this.currentQuiz.questions.find(x => x.id === qid);
          if (q) {
            this.collectFormData();
            q.mediaImage = '';
            this.render();
          }
        });
      });

      qListRoot.querySelectorAll('.q-remove-aud').forEach(btn => {
        btn.addEventListener('click', () => {
          const qid = btn.dataset.qid;
          const q = this.currentQuiz.questions.find(x => x.id === qid);
          if (q) {
            this.collectFormData();
            q.mediaAudio = '';
            this.render();
          }
        });
      });
    }

    collectFormData() {
      if (!this.currentQuiz) return;

      this.currentQuiz.title = document.getElementById('meta-quiz-title')?.value.trim() || 'Kuis Tanpa Judul';
      this.currentQuiz.description = document.getElementById('meta-quiz-desc')?.value.trim() || '';
      this.currentQuiz.category = document.getElementById('meta-quiz-cat')?.value || 'Umum';
      this.currentQuiz.timeLimit = parseInt(document.getElementById('meta-quiz-time')?.value, 10) || 0;
      this.currentQuiz.passPercentage = parseInt(document.getElementById('meta-quiz-pass')?.value, 10) || 70;
      this.currentQuiz.antiCheatEnabled = document.getElementById('meta-quiz-anticheat')?.checked || false;
      this.currentQuiz.maxViolations = parseInt(document.getElementById('meta-quiz-violations')?.value, 10) || 3;
      this.currentQuiz.blockCopyPaste = document.getElementById('meta-quiz-block-copy')?.checked || false;
      this.currentQuiz.shuffleQuestions = document.getElementById('meta-quiz-shuffle-q')?.checked || false;
      this.currentQuiz.shuffleOptions = document.getElementById('meta-quiz-shuffle-opt')?.checked || false;
      this.currentQuiz.instantFeedback = document.getElementById('meta-quiz-instant')?.checked || false;
      this.currentQuiz.accessCodeEnabled = document.getElementById('meta-quiz-access-enabled')?.checked || false;
      const rawCode = (document.getElementById('meta-quiz-access-code')?.value || '').trim().toUpperCase();
      this.currentQuiz.accessCode = rawCode;

      const qCards = document.querySelectorAll('.question-card');
      qCards.forEach(card => {
        const qid = card.dataset.qid;
        const q = this.currentQuiz.questions.find(x => x.id === qid);
        if (!q) return;

        q.title = card.querySelector('.q-title-input')?.value.trim() || '';
        q.points = parseInt(card.querySelector('.q-points-input')?.value, 10) || 10;
        q.codeSnippet = card.querySelector('.q-code-input')?.value || '';
        q.codeLang = card.querySelector('.q-code-lang')?.value || 'javascript';
        q.explanation = card.querySelector('.q-expl-input')?.value.trim() || '';

        if (q.type === 'blank') {
          q.blankAnswer = card.querySelector('.q-blank-input')?.value.trim() || '';
        } else {
          card.querySelectorAll('.option-row').forEach(row => {
            const optid = row.dataset.optid;
            const opt = q.options.find(o => o.id === optid);
            if (opt) {
              opt.text = row.querySelector('.q-opt-text')?.value.trim() || '';
            }
          });
        }
      });
    }

    async saveCurrentQuiz(showFeedback = true) {
      this.collectFormData();
      try {
        await storage.saveQuiz(this.currentQuiz);
        if (showFeedback) {
          this.app.showToast('Kuis berhasil disimpan!', 'success');
        }
      } catch (err) {
        this.app.showToast('Gagal menyimpan kuis', 'error');
      }
    }

    openBulkModal() {
      const modalRoot = document.getElementById('modal-bulk-importer');
      if (!modalRoot) return;

      modalRoot.classList.add('active');

      const sampleText = `1. Apakah tipe data yang dihasilkan dari operasi typeof null di JavaScript?
a) number
b) string
*c) object
d) undefined
Penjelasan: typeof null mengembalikan "object" karena bug warisan sejak awal rilis JS.

2. Manakah di antara tag berikut yang merupakan tag semantik resmi HTML5?
* [x] <article>
* [x] <nav>
* [x] <section>
- [ ] <applet>

3. CSS Flexbox dirancang khusus untuk tata letak satu dimensi (1D Layout).
*a) Benar
b) Salah

4. Soal: Sebutkan port standar untuk koneksi web aman HTTPS:
Jawaban: 443`;

      document.getElementById('bulk-import-textarea').value = sampleText;

      const parseBtn = document.getElementById('btn-bulk-execute');
      parseBtn.onclick = () => {
        const raw = document.getElementById('bulk-import-textarea').value;
        const parsedQuestions = BulkQuizParser.parse(raw);
        if (parsedQuestions.length === 0) {
          this.app.showToast('Gagal memproses soal. Periksa format teks Anda.', 'warning');
          return;
        }

        this.collectFormData();
        this.currentQuiz.questions = parsedQuestions;
        this.render();
        modalRoot.classList.remove('active');
        this.app.showToast(`Berhasil mengimpor ${parsedQuestions.length} soal kuis!`, 'success');
      };
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  /* ==========================================================================
     8. Quiz Arena Engine (with Anti-Cheat & Tab Switch Guard)
     ========================================================================== */
  class QuizEngine {
    constructor(app) {
      this.app = app;
      this.quiz = null;
      this.questions = [];
      this.currentIndex = 0;
      this.userAnswers = {};
      this.flaggedQuestions = new Set();
      this.timerInterval = null;
      this.secondsRemaining = 0;
      this.startTime = 0;
      this.isExamSubmitted = false;
      this.keyboardListener = null;

      // Anti-Cheat State
      this.violationCount = 0;
      this.antiCheatBound = false;
      this.visibilityHandler = null;
      this.blurHandler = null;
      this.contextMenuHandler = null;
      this.copyHandler = null;
    }

    get container() {
      return document.getElementById('player-view');
    }

    start(quiz) {
      this.quiz = JSON.parse(JSON.stringify(quiz));
      this.currentIndex = 0;
      this.userAnswers = {};
      this.flaggedQuestions.clear();
      this.isExamSubmitted = false;
      this.startTime = Date.now();
      this.violationCount = 0;

      this.questions = [...this.quiz.questions];
      if (this.quiz.shuffleQuestions) {
        this.questions.sort(() => Math.random() - 0.5);
      }

      if (this.quiz.shuffleOptions) {
        this.questions.forEach(q => {
          if (q.type !== 'boolean' && q.options && q.options.length > 0) {
            q.options = [...q.options].sort(() => Math.random() - 0.5);
          }
        });
      }

      if (this.quiz.timeLimit && this.quiz.timeLimit > 0) {
        this.secondsRemaining = this.quiz.timeLimit * 60;
        this.startTimer();
      } else {
        this.secondsRemaining = null;
      }

      this.render();
      this.bindKeyboardShortcuts();
      this.setupAntiCheat();
    }

    setupAntiCheat() {
      this.removeAntiCheat();

      if (!this.quiz.antiCheatEnabled && !this.quiz.blockCopyPaste) return;

      // Tab Switch & Window Blur Detection
      if (this.quiz.antiCheatEnabled) {
        this.visibilityHandler = () => {
          if (this.isExamSubmitted) return;
          if (document.hidden) {
            this.handleViolation('Terdeteksi berpindah tab atau keluar dari halaman browser!');
          }
        };

        this.blurHandler = () => {
          if (this.isExamSubmitted) return;
          this.handleViolation('Terdeteksi membuka aplikasi lain atau keluar dari layar kuis!');
        };

        document.addEventListener('visibilitychange', this.visibilityHandler);
        window.addEventListener('blur', this.blurHandler);
      }

      // Block Copy-Paste & Right Click
      if (this.quiz.blockCopyPaste) {
        this.contextMenuHandler = (e) => {
          if (!this.isExamSubmitted) {
            e.preventDefault();
            this.app.showToast('Klik kanan dinonaktifkan demi keamanan ujian!', 'warning');
          }
        };

        this.copyHandler = (e) => {
          if (!this.isExamSubmitted) {
            e.preventDefault();
            this.app.showToast('Menyalin (Copy) teks dinonaktifkan!', 'warning');
          }
        };

        document.addEventListener('contextmenu', this.contextMenuHandler);
        document.addEventListener('copy', this.copyHandler);
        document.addEventListener('cut', this.copyHandler);
        document.addEventListener('paste', this.copyHandler);
      }

      this.antiCheatBound = true;
    }

    removeAntiCheat() {
      if (this.visibilityHandler) document.removeEventListener('visibilitychange', this.visibilityHandler);
      if (this.blurHandler) window.removeEventListener('blur', this.blurHandler);
      if (this.contextMenuHandler) document.removeEventListener('contextmenu', this.contextMenuHandler);
      if (this.copyHandler) {
        document.removeEventListener('copy', this.copyHandler);
        document.removeEventListener('cut', this.copyHandler);
        document.removeEventListener('paste', this.copyHandler);
      }
      this.antiCheatBound = false;
      this.visibilityHandler = null;
      this.blurHandler = null;
      this.contextMenuHandler = null;
      this.copyHandler = null;
    }

    handleViolation(reason) {
      if (this.isExamSubmitted) return;
      this.violationCount++;
      soundFx.playWarningAlarm();

      const max = this.quiz.maxViolations || 3;
      const isOver = this.violationCount >= max;

      this.showAntiCheatAlert(reason, isOver);

      if (isOver) {
        setTimeout(() => {
          this.finishQuiz(true); // true = disqualified
        }, 3000);
      } else {
        this.render();
      }
    }

    showAntiCheatAlert(reason, isDisqualified) {
      let overlay = document.getElementById('anticheat-warning-modal');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'anticheat-warning-modal';
        overlay.className = 'anticheat-alert-modal';
        document.body.appendChild(overlay);
      }

      const max = this.quiz.maxViolations || 3;

      overlay.innerHTML = `
        <div class="anticheat-card">
          <div style="font-size:3.5rem;margin-bottom:0.5rem;">⚠️</div>
          <h2 style="color:var(--accent-rose);margin-bottom:0.5rem;">
            ${isDisqualified ? '⛔ UJIAN DIBLOKIR / DISKUALIFIKASI!' : 'PERINGATAN ANTI-CURANG!'}
          </h2>
          <p style="font-size:1.05rem;color:var(--text-main);margin-bottom:1rem;font-weight:600;">
            ${reason}
          </p>
          <div style="background:var(--bg-surface-elevated);padding:1rem;border-radius:12px;margin-bottom:1.5rem;">
            <div style="font-size:1.2rem;font-weight:800;color:var(--accent-rose);">
              Pelanggaran: ${this.violationCount} dari ${max} Toleransi
            </div>
            <p style="font-size:0.85rem;margin-top:0.25rem;">
              ${isDisqualified ? 'Anda melebihi batas toleransi. Ujian otomatis ditutup dan dinilai nol!' : 'Dilarang membuka tab lain, melihat catatan, atau meminimalkan browser selama ujian berlangsung!'}
            </p>
          </div>
          ${!isDisqualified ? `
            <button class="btn btn-primary btn-lg" id="btn-anticheat-resume" style="width:100%;">
              Saya Paham & Kembali Mengerjakan
            </button>
          ` : `
            <div style="color:var(--accent-rose);font-weight:800;font-size:1.1rem;">Menutup ujian otomatis...</div>
          `}
        </div>
      `;

      overlay.style.display = 'flex';

      document.getElementById('btn-anticheat-resume')?.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    }

    startTimer() {
      clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.secondsRemaining <= 0) {
          clearInterval(this.timerInterval);
          soundFx.playIncorrect();
          this.app.showToast('Waktu habis! Lembar jawaban dikirim otomatis.', 'warning');
          this.finishQuiz();
          return;
        }

        this.secondsRemaining--;
        this.updateTimerDisplay();

        if (this.secondsRemaining <= 10 && this.secondsRemaining > 0) {
          soundFx.playTick();
        }
      }, 1000);
    }

    updateTimerDisplay() {
      const timerEl = document.getElementById('arena-timer-badge');
      if (!timerEl || this.secondsRemaining === null) return;

      const mins = Math.floor(this.secondsRemaining / 60);
      const secs = this.secondsRemaining % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      timerEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${formatted}
      `;

      if (this.secondsRemaining <= 30) {
        timerEl.className = 'timer-badge danger';
      } else if (this.secondsRemaining <= 60) {
        timerEl.className = 'timer-badge warning';
      } else {
        timerEl.className = 'timer-badge';
      }
    }

    render() {
      if (!this.container || !this.quiz || this.questions.length === 0) return;

      const q = this.questions[this.currentIndex];
      const totalQ = this.questions.length;
      const progressPercent = ((this.currentIndex + 1) / totalQ) * 100;
      const isFlagged = this.flaggedQuestions.has(q.id);
      const currentAnswer = this.userAnswers[q.id];

      this.container.innerHTML = `
        <div class="player-hud">
          <div class="hud-left">
            <button class="btn btn-ghost btn-sm" id="btn-player-exit" title="Keluar Ujian">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Keluar
            </button>
            <span class="hud-title" title="${this.escapeHtml(this.quiz.title)}">${this.escapeHtml(this.quiz.title)}</span>
          </div>

          <div class="hud-right">
            ${this.quiz.antiCheatEnabled ? `
              <div class="violation-badge ${this.violationCount === 0 ? 'clean' : ''}" title="Status Pengawasan Ujian">
                🛡️ ${this.violationCount === 0 ? 'Aman' : `Pelanggaran: ${this.violationCount}/${this.quiz.maxViolations || 3}`}
              </div>
            ` : ''}

            ${this.secondsRemaining !== null ? `
              <div class="timer-badge" id="arena-timer-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                --:--
              </div>
            ` : ''}

            <button class="btn ${isFlagged ? 'btn-danger' : 'btn-secondary'} btn-sm" id="btn-toggle-flag" title="Tandai Ragu-Ragu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFlagged ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              ${isFlagged ? 'Ragu' : 'Tandai'}
            </button>
          </div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <div class="player-question-card">
          <div class="question-meta-row">
            <span class="badge badge-primary">Nomor Soal ${this.currentIndex + 1} dari ${totalQ}</span>
            <span class="badge badge-neutral">${q.points || 10} Poin</span>
          </div>

          <div class="question-prompt">
            ${this.formatPromptText(q.title)}
          </div>

          ${q.codeSnippet ? `
            <div class="code-viewer-container">
              <div class="code-viewer-header">
                <span class="code-lang-tag">${q.codeLang || 'KODE'}</span>
                <button class="btn btn-ghost btn-sm btn-icon-only btn-copy-code" title="Salin Kode">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
              <pre class="code-viewer-body"><code>${this.escapeHtml(q.codeSnippet)}</code></pre>
            </div>
          ` : ''}

          ${q.mediaImage ? `
            <div class="player-image-wrapper" title="Klik untuk memperbesar gambar">
              <img src="${q.mediaImage}" alt="Lampiran Soal" class="zoomable-img">
            </div>
          ` : ''}

          ${q.mediaAudio ? `
            <div class="player-audio-card">
              <div class="audio-icon-pulse">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              </div>
              <audio controls src="${q.mediaAudio}" style="width:100%;"></audio>
            </div>
          ` : ''}

          ${q.type === 'blank' ? `
            <div class="player-blank-wrapper">
              <input type="text" class="form-input player-blank-input" id="player-blank-field" value="${this.escapeHtml(currentAnswer || '')}" placeholder="Ketik jawaban Anda di sini lalu tekan Enter...">
            </div>
          ` : `
            <div class="player-options-grid">
              ${q.options.map((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                let isSelected = false;
                if (Array.isArray(currentAnswer)) {
                  isSelected = currentAnswer.includes(opt.id);
                } else {
                  isSelected = (currentAnswer === opt.id);
                }

                let revealClass = '';
                if (this.quiz.instantFeedback && currentAnswer !== undefined) {
                  if (opt.isCorrect) revealClass = 'correct-reveal';
                  else if (isSelected && !opt.isCorrect) revealClass = 'wrong-reveal';
                }

                return `
                  <div class="player-option-item ${isSelected ? 'selected' : ''} ${revealClass}" data-optid="${opt.id}">
                    <span class="key-badge">${letter}</span>
                    <div class="option-text-content">${this.escapeHtml(opt.text)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          `}

          ${(this.quiz.instantFeedback && currentAnswer !== undefined && q.explanation) ? `
            <div class="instant-feedback-card ${this.isQuestionCorrect(q) ? 'correct' : 'wrong'}">
              <strong>💡 Pembahasan Soal:</strong>
              <p style="margin-top:0.4rem;color:var(--text-main);">${this.escapeHtml(q.explanation)}</p>
            </div>
          ` : ''}
        </div>

        <div class="player-nav-bar">
          <button class="btn btn-secondary" id="btn-player-prev" ${this.currentIndex === 0 ? 'disabled' : ''}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            Sebelumnya
          </button>

          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <button class="btn btn-ghost" id="btn-player-clear">Hapus Pilihan</button>
            
            ${this.currentIndex === totalQ - 1 ? `
              <button class="btn btn-success" id="btn-player-submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Kirim Lembar Ujian
              </button>
            ` : `
              <button class="btn btn-primary" id="btn-player-next">
                Selanjutnya
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            `}
          </div>
        </div>

        <div class="question-grid-drawer">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <h4 style="font-size:0.95rem;">Navigasi Nomor Soal</h4>
            <span style="font-size:0.8rem;color:var(--text-muted);">
              Terjawab: ${Object.keys(this.userAnswers).length} dari ${totalQ} Soal
            </span>
          </div>
          <div class="grid-pills-container">
            ${this.questions.map((item, idx) => {
              const hasAns = this.userAnswers[item.id] !== undefined && this.userAnswers[item.id] !== '';
              const isCurr = idx === this.currentIndex;
              const isFlg = this.flaggedQuestions.has(item.id);
              return `
                <button class="grid-pill-btn ${isCurr ? 'current' : ''} ${hasAns ? 'answered' : ''} ${isFlg ? 'flagged' : ''}" data-jump="${idx}">
                  ${idx + 1}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;

      this.updateTimerDisplay();
      this.attachEventListeners();
    }

    attachEventListeners() {
      const q = this.questions[this.currentIndex];

      document.getElementById('btn-player-exit')?.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin keluar dari ujian? Seluruh progres saat ini akan hilang.')) {
          clearInterval(this.timerInterval);
          this.removeAntiCheat();
          this.app.switchView('dashboard');
        }
      });

      document.getElementById('btn-toggle-flag')?.addEventListener('click', () => {
        if (this.flaggedQuestions.has(q.id)) {
          this.flaggedQuestions.delete(q.id);
        } else {
          this.flaggedQuestions.add(q.id);
        }
        this.render();
      });

      this.container.querySelectorAll('.player-option-item').forEach(item => {
        item.addEventListener('click', () => {
          const optid = item.dataset.optid;
          soundFx.playClick();

          if (q.type === 'multiple') {
            let selected = Array.isArray(this.userAnswers[q.id]) ? [...this.userAnswers[q.id]] : [];
            if (selected.includes(optid)) {
              selected = selected.filter(id => id !== optid);
            } else {
              selected.push(optid);
            }
            this.userAnswers[q.id] = selected;
          } else {
            this.userAnswers[q.id] = optid;
            if (this.quiz.instantFeedback) {
              const opt = q.options.find(o => o.id === optid);
              if (opt && opt.isCorrect) soundFx.playCorrect();
              else soundFx.playIncorrect();
            }
          }
          this.render();
        });
      });

      const blankInput = document.getElementById('player-blank-field');
      if (blankInput) {
        blankInput.addEventListener('input', (e) => {
          this.userAnswers[q.id] = e.target.value.trim();
        });
        blankInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            if (this.currentIndex < this.questions.length - 1) {
              this.currentIndex++;
              this.render();
            } else {
              this.finishQuiz();
            }
          }
        });
      }

      document.getElementById('btn-player-prev')?.addEventListener('click', () => {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          this.render();
        }
      });

      document.getElementById('btn-player-next')?.addEventListener('click', () => {
        if (this.currentIndex < this.questions.length - 1) {
          this.currentIndex++;
          this.render();
        }
      });

      document.getElementById('btn-player-clear')?.addEventListener('click', () => {
        delete this.userAnswers[q.id];
        this.render();
      });

      document.getElementById('btn-player-submit')?.addEventListener('click', () => {
        const unanswered = this.questions.filter(item => this.userAnswers[item.id] === undefined || this.userAnswers[item.id] === '');
        if (unanswered.length > 0) {
          if (!confirm(`Masih ada ${unanswered.length} nomor soal yang belum dijawab. Yakin ingin menyelesaikan dan mengirim ujian?`)) {
            return;
          }
        }
        this.finishQuiz();
      });

      this.container.querySelectorAll('.grid-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const jumpIdx = parseInt(btn.dataset.jump, 10);
          this.currentIndex = jumpIdx;
          this.render();
        });
      });

      this.container.querySelectorAll('.btn-copy-code').forEach(btn => {
        btn.addEventListener('click', () => {
          if (q.codeSnippet) {
            navigator.clipboard.writeText(q.codeSnippet);
            this.app.showToast('Kode berhasil disalin ke clipboard!', 'info');
          }
        });
      });

      this.container.querySelectorAll('.zoomable-img').forEach(img => {
        img.addEventListener('click', () => {
          this.app.openLightbox(img.src);
        });
      });
    }

    bindKeyboardShortcuts() {
      if (this.keyboardListener) {
        window.removeEventListener('keydown', this.keyboardListener);
      }

      this.keyboardListener = (e) => {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        if (this.isExamSubmitted) return;

        const q = this.questions[this.currentIndex];
        if (!q) return;

        let optIdx = -1;
        const keyUpper = e.key.toUpperCase();
        if (['A', 'B', 'C', 'D', 'E', 'F'].includes(keyUpper)) {
          optIdx = keyUpper.charCodeAt(0) - 65;
        } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
          optIdx = parseInt(e.key, 10) - 1;
        }

        if (optIdx >= 0 && q.options && q.options[optIdx]) {
          const opt = q.options[optIdx];
          soundFx.playClick();
          if (q.type === 'multiple') {
            let selected = Array.isArray(this.userAnswers[q.id]) ? [...this.userAnswers[q.id]] : [];
            if (selected.includes(opt.id)) {
              selected = selected.filter(id => id !== opt.id);
            } else {
              selected.push(opt.id);
            }
            this.userAnswers[q.id] = selected;
          } else {
            this.userAnswers[q.id] = opt.id;
            if (this.quiz.instantFeedback) {
              if (opt.isCorrect) soundFx.playCorrect();
              else soundFx.playIncorrect();
            }
          }
          this.render();
        } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
          if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            this.render();
          }
        } else if (e.key === 'ArrowLeft') {
          if (this.currentIndex > 0) {
            this.currentIndex--;
            this.render();
          }
        }
      };

      window.addEventListener('keydown', this.keyboardListener);
    }

    isQuestionCorrect(q) {
      const userAns = this.userAnswers[q.id];
      if (userAns === undefined || userAns === '') return false;

      if (q.type === 'blank') {
        const acceptable = (q.blankAnswer || '').split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
        const userText = String(userAns).trim().toLowerCase();
        return acceptable.length > 0 ? acceptable.includes(userText) : false;
      } else if (q.type === 'multiple') {
        const correctOptIds = q.options.filter(o => o.isCorrect).map(o => o.id);
        const userOptIds = Array.isArray(userAns) ? userAns : [];
        if (correctOptIds.length !== userOptIds.length) return false;
        return correctOptIds.every(id => userOptIds.includes(id));
      } else {
        const correctOpt = q.options.find(o => o.isCorrect);
        return correctOpt ? correctOpt.id === userAns : false;
      }
    }

    async finishQuiz(isDisqualified = false) {
      clearInterval(this.timerInterval);
      this.isExamSubmitted = true;
      this.removeAntiCheat();

      const modalAlert = document.getElementById('anticheat-warning-modal');
      if (modalAlert) modalAlert.style.display = 'none';

      if (this.keyboardListener) {
        window.removeEventListener('keydown', this.keyboardListener);
        this.keyboardListener = null;
      }

      const totalQuestions = this.questions.length;
      let earnedPoints = 0;
      let totalPoints = 0;
      let correctCount = 0;
      let wrongCount = 0;

      const reviewData = this.questions.map(q => {
        const qPts = q.points || 10;
        totalPoints += qPts;
        const isCorrect = isDisqualified ? false : this.isQuestionCorrect(q);
        if (isCorrect) {
          earnedPoints += qPts;
          correctCount++;
        } else {
          wrongCount++;
        }

        return {
          question: q,
          userAnswer: this.userAnswers[q.id],
          isCorrect: isCorrect,
          pointsEarned: isCorrect ? qPts : 0
        };
      });

      let scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      if (isDisqualified) scorePercent = 0;

      const isPassed = !isDisqualified && scorePercent >= (this.quiz.passPercentage || 70);
      const timeSpentSec = Math.round((Date.now() - this.startTime) / 1000);

      let grade = 'E';
      if (isDisqualified) grade = 'DISKUALIFIKASI';
      else if (scorePercent >= 95) grade = 'A+';
      else if (scorePercent >= 85) grade = 'A';
      else if (scorePercent >= 75) grade = 'B';
      else if (scorePercent >= 65) grade = 'C';
      else if (scorePercent >= 50) grade = 'D';

      if (isPassed) {
        soundFx.playFanfare();
      } else {
        soundFx.playIncorrect();
      }

      const attempt = {
        quizId: this.quiz.id,
        quizTitle: this.quiz.title,
        scorePercent,
        earnedPoints: isDisqualified ? 0 : earnedPoints,
        totalPoints,
        correctCount: isDisqualified ? 0 : correctCount,
        wrongCount,
        totalQuestions,
        isPassed,
        isDisqualified,
        violationCount: this.violationCount,
        grade,
        timeSpentSec,
        reviewData
      };

      await storage.saveAttempt(attempt);
      this.app.showResults(attempt, this.quiz);
    }

    formatPromptText(text) {
      if (!text) return '';
      return this.escapeHtml(text).replace(/\n/g, '<br>');
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  /* ==========================================================================
     9. Main App Controller (Indonesian Localization)
     ========================================================================== */
  class App {
    constructor() {
      this.currentView = 'dashboard';
      this.editor = new QuizEditor(this);
      this.engine = new QuizEngine(this);
      this.lastResult = null;
      this.lastQuiz = null;
    }

    async init() {
      // Start canvas background
      this.bgCanvas = new CanvasBackground();

      this.initTheme();
      this.initUserProfile();
      this.bindGlobalEvents();

      const existing = await storage.getAllQuizzes();
      if (existing.length === 0) {
        for (const sample of SAMPLE_QUIZZES) {
          await storage.saveQuiz(sample);
        }
      }

      if (window.location.hash && window.location.hash.includes('quiz=')) {
        const sharedQuiz = QuizShareEngine.decodeFromURL(window.location.hash);
        if (sharedQuiz) {
          await storage.saveQuiz(sharedQuiz);
          this.showToast(`Berhasil mengimpor kuis: "${sharedQuiz.title}"!`, 'success');
          window.history.replaceState(null, null, window.location.pathname);
          this.startQuiz(sharedQuiz);
          return;
        }
      }

      await this.renderDashboard();
    }

    initUserProfile() {
      const savedName = localStorage.getItem('quizranzz_username') || '';
      const nameInput = document.getElementById('player-name-input');
      if (nameInput && savedName) nameInput.value = savedName;
      this._refreshUserAvatar(savedName);
    }

    _refreshUserAvatar(name) {
      const avatarBtn = document.getElementById('user-avatar-btn');
      const initials  = document.getElementById('user-avatar-initials');
      const entryWidget = document.getElementById('player-entry-widget');
      if (!avatarBtn) return;

      if (name && name.trim()) {
        const parts = name.trim().split(/\s+/);
        const abbr = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.trim().substring(0, 2).toUpperCase();
        if (initials) initials.textContent = abbr;
        avatarBtn.style.display = 'flex';
        avatarBtn.title = `Halo, ${name.trim()}! Klik untuk ubah nama.`;

        // Update greeting
        const greetEl = document.getElementById('welcome-greeting');
        if (greetEl) {
          const h = new Date().getHours();
          const timeGreet = h < 12 ? '☀️ Selamat Pagi' : h < 17 ? '🌤️ Selamat Siang' : h < 21 ? '🌆 Selamat Sore' : '🌙 Selamat Malam';
          greetEl.textContent = `${timeGreet}, ${name.trim()}!`;
        }
      } else {
        avatarBtn.style.display = 'none';
        const greetEl = document.getElementById('welcome-greeting');
        if (greetEl) {
          const h = new Date().getHours();
          const timeGreet = h < 12 ? '☀️ Selamat Pagi' : h < 17 ? '🌤️ Selamat Siang' : h < 21 ? '🌆 Selamat Sore' : '🌙 Selamat Malam';
          greetEl.textContent = `${timeGreet}! 👋`;
        }
      }
    }

    initTheme() {
      const savedTheme = localStorage.getItem('quizranzz_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      this.updateThemeButton(savedTheme);
    }

    toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('quizranzz_theme', next);
      this.updateThemeButton(next);
    }

    updateThemeButton(theme) {
      const btn = document.getElementById('btn-theme-toggle');
      if (!btn) return;
      if (theme === 'dark') {
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
        btn.title = 'Ganti ke Mode Terang';
      } else {
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        btn.title = 'Ganti ke Mode Gelap';
      }
    }

    switchView(viewName) {
      this.currentView = viewName;

      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewName);
      });

      document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
      });

      const target = document.getElementById(`${viewName}-view`);
      if (target) {
        target.classList.add('active');
      }

      if (viewName === 'dashboard') {
        this.renderDashboard();
      } else if (viewName === 'history') {
        this.renderHistory();
      }
    }

    async renderDashboard() {
      const listEl     = document.getElementById('quiz-grid-root');
      const heroStatsEl = document.getElementById('dashboard-hero-stats');
      if (!listEl) return;

      const quizzes  = await storage.getAllQuizzes();
      const attempts = await storage.getAttempts();

      // Category color map
      const catColors = {
        'Pemrograman': 'linear-gradient(90deg,#3B82F6,#06B6D4)',
        'Matematika':  'linear-gradient(90deg,#8B5CF6,#EC4899)',
        'Bahasa':      'linear-gradient(90deg,#F59E0B,#EF4444)',
        'Umum':        'linear-gradient(90deg,#10B981,#3B82F6)',
        'Audio & Sains': 'linear-gradient(90deg,#F43F5E,#8B5CF6)',
      };
      const getStripe = (cat) => catColors[cat] || 'linear-gradient(90deg,#3B82F6,#8B5CF6)';

      if (heroStatsEl) {
        const passed = attempts.filter(a => a.isPassed).length;
        heroStatsEl.innerHTML = `
          <div class="stat-pill">
            <span class="stat-num">${quizzes.length}</span>
            <span class="stat-lbl">Kuis Dibuat</span>
          </div>
          <div class="stat-pill">
            <span class="stat-num">${attempts.length}</span>
            <span class="stat-lbl">Ujian Selesai</span>
          </div>
          <div class="stat-pill">
            <span class="stat-num" style="color:var(--accent-emerald)">${passed}</span>
            <span class="stat-lbl">Kelulusan</span>
          </div>
        `;
      }

      this._allQuizzes = quizzes;
      this._renderQuizGrid(quizzes, getStripe);
      this._getStripe = getStripe;

      // Bind category filter
      document.querySelectorAll('.cat-pill').forEach(pill => {
        pill.onclick = () => {
          document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          const cat = pill.dataset.cat;
          const filtered = cat === 'all' ? quizzes : quizzes.filter(q => (q.category || 'Umum') === cat);
          this._renderQuizGrid(filtered, getStripe);
        };
      });

      // Grid / List toggle
      document.getElementById('btn-view-grid')?.addEventListener('click', () => {
        listEl.classList.remove('list-view');
        document.getElementById('btn-view-grid')?.classList.add('active');
        document.getElementById('btn-view-list')?.classList.remove('active');
      });
      document.getElementById('btn-view-list')?.addEventListener('click', () => {
        listEl.classList.add('list-view');
        document.getElementById('btn-view-list')?.classList.add('active');
        document.getElementById('btn-view-grid')?.classList.remove('active');
      });

      // Hero buttons
      document.getElementById('btn-hero-create')?.addEventListener('click', () => this.openStudioNew());
      document.getElementById('btn-hero-import')?.addEventListener('click', () => document.getElementById('file-import-json')?.click());
    }

    _renderQuizGrid(quizzes, getStripe) {
      const listEl = document.getElementById('quiz-grid-root');
      if (!listEl) return;

      if (quizzes.length === 0) {
        listEl.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:3.5rem 1rem;">
            <div style="font-size:3rem;margin-bottom:0.75rem;">📭</div>
            <h3 style="margin-bottom:0.4rem;">Tidak Ada Kuis Ditemukan</h3>
            <p style="margin-bottom:1.5rem;">Buat kuis pertama atau ubah filter kategori.</p>
            <button class="btn btn-primary" id="btn-empty-create">+ Buat Kuis Baru</button>
          </div>
        `;
        document.getElementById('btn-empty-create')?.addEventListener('click', () => this.openStudioNew());
        return;
      }

      listEl.innerHTML = quizzes.map(q => {
        const qCount   = q.questions ? q.questions.length : 0;
        const totalPts = (q.questions || []).reduce((s, i) => s + (i.points || 10), 0);
        const timeStr  = q.timeLimit && q.timeLimit > 0 ? `${q.timeLimit} Mnt` : '∞';
        const stripe   = getStripe ? getStripe(q.category) : 'linear-gradient(90deg,#3B82F6,#8B5CF6)';

        return `
          <div class="quiz-card" data-qid="${q.id}" data-cat="${this.escapeHtml(q.category || 'Umum')}">
            <div class="quiz-card-stripe" style="background:${stripe};"></div>
            <div class="card-body-list">
              <div class="quiz-card-header">
                <span class="badge badge-primary">${this.escapeHtml(q.category || 'Umum')}</span>
                <span class="badge badge-neutral">${qCount} Soal</span>
                ${q.antiCheatEnabled ? '<span class="badge badge-danger">🛡️ Anti-Curang</span>' : ''}
                ${q.accessCodeEnabled && q.accessCode ? '<span class="badge badge-warning">🔐 Berkode</span>' : ''}
              </div>
              <h3 class="quiz-card-title">${this.escapeHtml(q.title)}</h3>
              <p class="quiz-card-desc">${this.escapeHtml(q.description || 'Tidak ada deskripsi untuk kuis ini.')}</p>
              <div class="quiz-card-meta">
                <span class="card-meta-item">⏱️ ${timeStr}</span>
                <span class="card-meta-item">🏆 ${totalPts} poin</span>
                <span class="card-meta-item">🎯 Lulus ≥${q.passPercentage || 70}%</span>
              </div>
            </div>
            <div class="quiz-card-actions">
              <div class="card-actions-left">
                <button class="btn btn-ghost btn-sm btn-icon-only card-btn-edit" data-qid="${q.id}" title="Edit di Studio">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                </button>
                <button class="btn btn-ghost btn-sm btn-icon-only card-btn-share" data-qid="${q.id}" title="Bagikan Link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <button class="btn btn-ghost btn-sm btn-icon-only card-btn-print" data-qid="${q.id}" title="Cetak Soal">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                </button>
                <button class="btn btn-danger btn-sm btn-icon-only card-btn-delete" data-qid="${q.id}" title="Hapus Kuis">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
              <button class="btn btn-primary btn-sm card-btn-play" data-qid="${q.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Mulai
              </button>
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.card-btn-play').forEach(btn => {
        btn.addEventListener('click', async () => {
          const quiz = await storage.getQuizById(btn.dataset.qid);
          if (quiz) this.startQuiz(quiz);
        });
      });
      listEl.querySelectorAll('.card-btn-edit').forEach(btn => {
        btn.addEventListener('click', async () => {
          const quiz = await storage.getQuizById(btn.dataset.qid);
          if (quiz) this.openStudioEdit(quiz);
        });
      });
      listEl.querySelectorAll('.card-btn-share').forEach(btn => {
        btn.addEventListener('click', async () => {
          const quiz = await storage.getQuizById(btn.dataset.qid);
          if (quiz) this.openShareModal(quiz);
        });
      });
      listEl.querySelectorAll('.card-btn-print').forEach(btn => {
        btn.addEventListener('click', async () => {
          const quiz = await storage.getQuizById(btn.dataset.qid);
          if (quiz) this.triggerPrintExam(quiz);
        });
      });
      listEl.querySelectorAll('.card-btn-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Apakah Anda yakin ingin menghapus kuis ini? Tindakan ini tidak dapat dibatalkan.')) {
            await storage.deleteQuiz(btn.dataset.qid);
            this.showToast('Kuis berhasil dihapus.', 'info');
            this.renderDashboard();
          }
        });
      });
    }

    async renderHistory() {
      const root = document.getElementById('history-table-root');
      if (!root) return;

      const attempts = await storage.getAttempts();
      if (attempts.length === 0) {
        root.innerHTML = `
          <div style="text-align:center;padding:3rem 1rem;">
            <h3>Belum Ada Riwayat Ujian</h3>
            <p style="margin-top:0.5rem;">Kerjakan kuis dari koleksi untuk melihat catatan skor, waktu, dan riwayat evaluasi di sini.</p>
          </div>
        `;
        return;
      }

      root.innerHTML = `
        <div class="card" style="padding:0;overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;text-align:left;font-size:0.9rem;">
            <thead>
              <tr style="background:var(--bg-surface-elevated);border-bottom:1px solid var(--border-subtle);">
                <th style="padding:1rem;">Tanggal & Waktu</th>
                <th style="padding:1rem;">Judul Kuis</th>
                <th style="padding:1rem;">Skor Akhir</th>
                <th style="padding:1rem;">Predikat</th>
                <th style="padding:1rem;">Durasi</th>
                <th style="padding:1rem;">Pengawasan</th>
                <th style="padding:1rem;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${attempts.map(att => `
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:1rem;color:var(--text-muted);">${new Date(att.date).toLocaleDateString('id-ID')} ${new Date(att.date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</td>
                  <td style="padding:1rem;font-weight:700;">${this.escapeHtml(att.quizTitle)}</td>
                  <td style="padding:1rem;font-family:var(--font-mono);font-weight:800;">${att.scorePercent}% (${att.earnedPoints}/${att.totalPoints} poin)</td>
                  <td style="padding:1rem;"><span class="badge ${att.isPassed ? 'badge-success' : 'badge-danger'}">${att.grade}</span></td>
                  <td style="padding:1rem;color:var(--text-muted);">${Math.floor(att.timeSpentSec / 60)}m ${att.timeSpentSec % 60}s</td>
                  <td style="padding:1rem;">${att.violationCount > 0 ? `<span class="badge badge-warning">⚠️ ${att.violationCount}x Pindah Tab</span>` : '<span class="badge badge-success">✓ 100% Bersih</span>'}</td>
                  <td style="padding:1rem;"><span class="badge ${att.isPassed ? 'badge-success' : 'badge-danger'}">${att.isDisqualified ? 'DISKUALIFIKASI' : (att.isPassed ? 'LULUS' : 'TIDAK LULUS')}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    openStudioNew() {
      this.switchView('studio');
      this.editor.createNewQuiz();
    }

    openStudioEdit(quiz) {
      this.switchView('studio');
      this.editor.loadQuiz(quiz);
    }

    startQuiz(quiz, participantName) {
      // Preserve participant name if passed (from access gate)
      if (participantName) {
        localStorage.setItem('quizranzz_username', participantName);
        this._refreshUserAvatar(participantName);
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) nameInput.value = participantName;
      }
      // Check if quiz requires an access code
      if (quiz.accessCodeEnabled && quiz.accessCode) {
        this._pendingQuiz = quiz;
        this._showAccessGate(quiz);
        return;
      }
      this.switchView('player');
      this.engine.start(quiz);
    }

    _showAccessGate(quiz) {
      const modal = document.getElementById('modal-access-gate');
      if (!modal) {
        const code = prompt(`Kuis "${quiz.title}" dilindungi kode akses. Masukkan kode:`);
        if (code && code.trim().toUpperCase() === quiz.accessCode.toUpperCase()) {
          this.switchView('player');
          this.engine.start(quiz);
        } else {
          this.showToast('Kode akses salah!', 'error');
        }
        return;
      }

      // Set quiz title in gate
      const titleDisplay = document.getElementById('gate-quiz-title-display');
      if (titleDisplay) titleDisplay.textContent = `"${quiz.title}" — Masukkan nama dan kode untuk mulai.`;

      modal.classList.add('active');

      const nameInput = document.getElementById('gate-name-input');
      const codeInput = document.getElementById('gate-code-input');
      const errMsg    = document.getElementById('gate-error-msg');

      // Pre-fill name if already saved
      const savedName = localStorage.getItem('quizranzz_username') || '';
      if (nameInput) nameInput.value = savedName;
      if (codeInput) { codeInput.value = ''; codeInput.focus(); }
      if (errMsg)    errMsg.style.display = 'none';

      const tryEnter = () => {
        const entered = (codeInput?.value || '').trim().toUpperCase();
        const name    = (nameInput?.value || '').trim();

        if (!name) {
          this.showToast('Harap isi nama peserta terlebih dahulu.', 'warning');
          nameInput?.focus();
          return;
        }

        if (entered === quiz.accessCode.toUpperCase()) {
          // Save participant name
          localStorage.setItem('quizranzz_username', name);
          this._refreshUserAvatar(name);
          const navName = document.getElementById('player-name-input');
          if (navName) navName.value = name;

          modal.classList.remove('active');
          this.switchView('player');
          this.engine.start(quiz);
        } else {
          if (errMsg) errMsg.style.display = 'flex';
          if (codeInput) { codeInput.value = ''; codeInput.focus(); }
        }
      };

      document.getElementById('btn-gate-submit').onclick = tryEnter;

      if (codeInput) codeInput.onkeydown = (e) => { if (e.key === 'Enter') tryEnter(); };
      if (nameInput) nameInput.onkeydown = (e) => { if (e.key === 'Enter') codeInput?.focus(); };
    }

    showResults(attempt, quiz) {
      this.lastResult = attempt;
      this.lastQuiz = quiz;
      this.switchView('results');

      const resultsRoot = document.getElementById('results-view');
      if (!resultsRoot) return;

      const circumference = 2 * Math.PI * 45;
      const offset = circumference - (attempt.scorePercent / 100) * circumference;

      resultsRoot.innerHTML = `
        <div class="results-container">
          <div class="results-hero-card">
            <span class="badge ${attempt.isPassed ? 'badge-success' : 'badge-danger'}" style="font-size:0.95rem;padding:0.4rem 1.2rem;">
              ${attempt.isDisqualified ? '⛔ DIDISKUALIFIKASI KARENA KELUAR DARI WEB / PINDAH TAB' : (attempt.isPassed ? '🎉 SELAMAT! ANDA DINYATAKAN LULUS' : '⚠️ TETAP SEMANGAT! BELUM MENCAPAI BATAS KELULUSAN')}
            </span>

            <div class="score-circle-wrapper">
              <svg class="score-circle-svg" viewBox="0 0 100 100">
                <circle class="score-circle-bg" cx="50" cy="50" r="45"></circle>
                <circle class="score-circle-bar" cx="50" cy="50" r="45" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
              </svg>
              <div class="score-text-overlay">
                <span class="score-percent">${attempt.scorePercent}%</span>
                <span class="score-label">PREDIKAT ${attempt.grade}</span>
              </div>
            </div>

            <h2 style="margin-bottom:0.4rem;">${this.escapeHtml(attempt.quizTitle)}</h2>
            <p>Anda memperoleh ${attempt.earnedPoints} dari total ${attempt.totalPoints} poin maksimal yang tersedia.</p>

            <div class="results-stats-row">
              <div class="result-stat-box">
                <div class="result-stat-value" style="color:var(--accent-emerald);">✓ ${attempt.correctCount}</div>
                <div class="result-stat-label">Jawaban Benar</div>
              </div>
              <div class="result-stat-box">
                <div class="result-stat-value" style="color:var(--accent-rose);">✗ ${attempt.wrongCount}</div>
                <div class="result-stat-label">Jawaban Salah</div>
              </div>
              <div class="result-stat-box">
                <div class="result-stat-value">⏱️ ${Math.floor(attempt.timeSpentSec / 60)}m ${attempt.timeSpentSec % 60}s</div>
                <div class="result-stat-label">Waktu Pengerjaan</div>
              </div>
              <div class="result-stat-box">
                <div class="result-stat-value" style="${attempt.violationCount > 0 ? 'color:var(--accent-rose);' : 'color:var(--accent-emerald);'}">
                  ${attempt.violationCount > 0 ? `⚠️ ${attempt.violationCount}x` : '✓ Bersih'}
                </div>
                <div class="result-stat-label">Pindah Tab / Curang</div>
              </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:center;gap:1rem;flex-wrap:wrap;margin-top:1.5rem;">
              ${attempt.isPassed ? `
                <button class="btn btn-primary btn-lg" id="btn-results-cert">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                  Klaim Sertifikat Resmi
                </button>
              ` : ''}
              <button class="btn btn-secondary btn-lg" id="btn-results-retake">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                Ulangi Ujian
              </button>
              <button class="btn btn-ghost" id="btn-results-home">
                Kembali ke Koleksi
              </button>
            </div>
          </div>

          <h3 style="margin-bottom:1.25rem;">Evaluasi & Pembahasan Jawaban Lengkap</h3>
          <div class="review-list">
            ${attempt.reviewData.map((item, idx) => {
              const q = item.question;
              return `
                <div class="review-item ${item.isCorrect ? 'is-correct' : 'is-wrong'}">
                  <div class="review-header">
                    <span class="badge ${item.isCorrect ? 'badge-success' : 'badge-danger'}">
                      ${item.isCorrect ? '✓ Jawaban Tepat' : '✗ Jawaban Salah'} (${item.pointsEarned}/${q.points || 10} poin)
                    </span>
                    <span style="font-size:0.8rem;color:var(--text-muted);">Nomor Soal ${idx + 1}</span>
                  </div>
                  <div style="font-weight:700;font-size:1.1rem;color:var(--text-main);margin-bottom:0.75rem;">
                    ${this.escapeHtml(q.title)}
                  </div>

                  ${q.codeSnippet ? `
                    <pre class="code-viewer-body" style="background:#05080F;border-radius:8px;padding:0.85rem;margin-bottom:0.75rem;"><code>${this.escapeHtml(q.codeSnippet)}</code></pre>
                  ` : ''}

                  <div style="font-size:0.95rem;display:flex;flex-direction:column;gap:0.45rem;">
                    <div>
                      <strong style="color:var(--text-muted);">Jawaban Anda: </strong>
                      <span>${this.formatAnswerLabel(q, item.userAnswer)}</span>
                    </div>
                    ${!item.isCorrect ? `
                      <div>
                        <strong style="color:var(--accent-emerald);">Kunci Jawaban Benar: </strong>
                        <span style="color:var(--accent-emerald);font-weight:700;">${this.formatCorrectAnswerLabel(q)}</span>
                      </div>
                    ` : ''}
                  </div>

                  ${q.explanation ? `
                    <div class="review-explanation">
                      <strong>💡 Pembahasan & Keterangan:</strong>
                      <p style="margin-top:0.35rem;">${this.escapeHtml(q.explanation)}</p>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      document.getElementById('btn-results-cert')?.addEventListener('click', () => {
        this.openCertificateModal(attempt);
      });

      document.getElementById('btn-results-retake')?.addEventListener('click', () => {
        this.startQuiz(quiz);
      });

      document.getElementById('btn-results-home')?.addEventListener('click', () => {
        this.switchView('dashboard');
      });
    }

    formatAnswerLabel(q, ans) {
      if (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
        return '<em style="color:var(--text-muted);">(Tidak Menjawab)</em>';
      }
      if (q.type === 'blank') {
        return `<code>${this.escapeHtml(String(ans))}</code>`;
      }
      if (Array.isArray(ans)) {
        return ans.map(id => {
          const opt = q.options.find(o => o.id === id);
          return opt ? this.escapeHtml(opt.text) : id;
        }).join(', ');
      }
      const opt = q.options.find(o => o.id === ans);
      return opt ? this.escapeHtml(opt.text) : this.escapeHtml(String(ans));
    }

    formatCorrectAnswerLabel(q) {
      if (q.type === 'blank') {
        return `<code>${this.escapeHtml(q.blankAnswer || '')}</code>`;
      }
      const correctOptions = q.options.filter(o => o.isCorrect);
      return correctOptions.map(o => this.escapeHtml(o.text)).join(', ');
    }

    openCertificateModal(attempt) {
      const modal = document.getElementById('modal-certificate');
      if (!modal) return;

      modal.classList.add('active');

      const canvas = document.getElementById('cert-canvas');
      const nameInput = document.getElementById('cert-name-input');
      nameInput.value = localStorage.getItem('quizranzz_username') || 'Programmer Hebat';

      const renderCert = () => {
        CertificateGenerator.render(canvas, {
          studentName: nameInput.value.trim() || 'Peserta Berprestasi',
          quizTitle: attempt.quizTitle,
          scorePercent: attempt.scorePercent,
          grade: attempt.grade,
          date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
          certId: 'QR-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        });
      };

      renderCert();

      nameInput.oninput = () => {
        localStorage.setItem('quizranzz_username', nameInput.value.trim());
        renderCert();
      };

      document.getElementById('btn-cert-download').onclick = () => {
        CertificateGenerator.downloadPNG(canvas, `${attempt.quizTitle.replace(/\s+/g, '_')}_Sertifikat_QuizRanzzPro.png`);
        this.showToast('Sertifikat berhasil diunduh!', 'success');
      };
    }

    openShareModal(quiz) {
      const modal = document.getElementById('modal-share');
      if (!modal) return;

      modal.classList.add('active');
      const url = QuizShareEngine.encodeToURL(quiz);
      const input = document.getElementById('share-url-input');
      if (input) input.value = url || 'URL tidak tersedia (kuis mungkin terlalu besar untuk di-encode)';

      // Access code section
      const accessSection = document.getElementById('share-access-code-section');
      const accessValue = document.getElementById('share-access-code-value');
      if (quiz.accessCodeEnabled && quiz.accessCode) {
        if (accessSection) accessSection.style.display = 'block';
        if (accessValue)   accessValue.textContent = quiz.accessCode;
      } else {
        if (accessSection) accessSection.style.display = 'none';
      }

      const waText = encodeURIComponent(`🎯 *${quiz.title}*\n${quiz.description || ''}\n\nKerjakan kuisnya di sini:\n${url}${quiz.accessCodeEnabled && quiz.accessCode ? `\n\n🔐 Kode Akses: *${quiz.accessCode}*` : ''}`);
      const tgText = encodeURIComponent(`🎯 ${quiz.title} — ${quiz.description || ''}\n\n${url}`);

      document.getElementById('btn-share-whatsapp').onclick = () => {
        window.open(`https://wa.me/?text=${waText}`, '_blank', 'noopener');
      };

      document.getElementById('btn-share-telegram').onclick = () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${tgText}`, '_blank', 'noopener');
      };

      document.getElementById('btn-copy-share-url').onclick = () => {
        if (url) {
          navigator.clipboard.writeText(url).then(() => {
            this.showToast('Link kuis berhasil disalin ke clipboard!', 'success');
          }).catch(() => {
            this.showToast('Gagal menyalin, coba salin manual.', 'warning');
          });
        }
      };
    }

    openLightbox(src) {
      let box = document.getElementById('lightbox-overlay');
      if (!box) {
        box = document.createElement('div');
        box.id = 'lightbox-overlay';
        box.className = 'lightbox-modal';
        box.innerHTML = `<img class="lightbox-img" src="" alt="Tampilan Penuh">`;
        box.onclick = () => box.remove();
        document.body.appendChild(box);
      }
      box.querySelector('img').src = src;
      box.style.display = 'flex';
    }

    triggerPrintExam(quiz) {
      const printArea = document.getElementById('print-area-container');
      if (!printArea) return;

      printArea.innerHTML = `
        <div style="padding:2rem;font-family:sans-serif;color:#000;">
          <h1 style="margin-bottom:0.5rem;">${this.escapeHtml(quiz.title)}</h1>
          <p style="margin-bottom:1rem;color:#555;">${this.escapeHtml(quiz.description || '')}</p>
          <div style="margin-bottom:1.5rem;font-size:0.9rem;border-bottom:2px solid #000;padding-bottom:0.5rem;display:flex;justify-content:space-between;">
            <span>Nama Peserta: __________________________</span>
            <span>Tanggal: ________________</span>
            <span>Skor: ______ / ${quiz.questions.length}</span>
          </div>

          <div style="display:flex;flex-direction:column;gap:1.5rem;">
            ${quiz.questions.map((q, idx) => `
              <div style="break-inside:avoid;page-break-inside:avoid;">
                <div style="font-weight:bold;margin-bottom:0.5rem;">
                  ${idx + 1}. ${this.escapeHtml(q.title)} (${q.points || 10} poin)
                </div>
                ${q.codeSnippet ? `
                  <pre style="background:#eee;padding:0.75rem;border-radius:4px;font-family:monospace;margin-bottom:0.5rem;"><code>${this.escapeHtml(q.codeSnippet)}</code></pre>
                ` : ''}
                ${q.type === 'blank' ? `
                  <div style="margin-top:0.5rem;border-bottom:1px solid #333;width:300px;height:24px;"></div>
                ` : `
                  <div style="display:flex;flex-direction:column;gap:0.35rem;margin-left:1rem;">
                    ${q.options.map((opt, oIdx) => `
                      <div>[ &nbsp; ] ${String.fromCharCode(65 + oIdx)}. ${this.escapeHtml(opt.text)}</div>
                    `).join('')}
                  </div>
                `}
              </div>
            `).join('')}
          </div>
        </div>
      `;

      window.print();
    }

    async exportAllQuizzesJSON() {
      const quizzes = await storage.getAllQuizzes();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quizzes, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute('href', dataStr);
      dlAnchor.setAttribute('download', `QuizRanzzPro_Data_${new Date().toISOString().slice(0,10)}.json`);
      dlAnchor.click();
      this.showToast('Data kuis berhasil diekspor ke JSON!', 'success');
    }

    importQuizzesJSON(file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          for (const q of list) {
            if (q.title && q.questions) {
              q.id = 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
              await storage.saveQuiz(q);
            }
          }
          this.showToast(`Berhasil mengimpor ${list.length} kuis!`, 'success');
          this.renderDashboard();
        } catch (err) {
          this.showToast('Gagal memproses file JSON kuis', 'error');
        }
      };
      reader.readAsText(file);
    }

    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `<span>${this.escapeHtml(message)}</span>`;

      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3200);
    }

    bindGlobalEvents() {
      // Theme toggle
      document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
        this.toggleTheme();
      });

      // Nav tabs
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const view = tab.dataset.view;
          if (view === 'studio') this.openStudioNew();
          else this.switchView(view);
        });
      });

      // Brand logo
      document.getElementById('brand-logo-btn')?.addEventListener('click', () => this.switchView('dashboard'));
      document.getElementById('brand-logo-btn')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') this.switchView('dashboard');
      });

      // Create button
      document.getElementById('btn-nav-create')?.addEventListener('click', () => this.openStudioNew());

      // Export/Import JSON
      document.getElementById('btn-export-json')?.addEventListener('click', () => this.exportAllQuizzesJSON());
      document.getElementById('btn-import-json-trigger')?.addEventListener('click', () => {
        document.getElementById('file-import-json')?.click();
      });
      document.getElementById('file-import-json')?.addEventListener('change', (e) => {
        if (e.target.files[0]) {
          this.importQuizzesJSON(e.target.files[0]);
          e.target.value = '';
        }
      });

      // ---- Player Name Input (navbar) ----------------------------
      const playerNameInput = document.getElementById('player-name-input');
      if (playerNameInput) {
        playerNameInput.addEventListener('change', (e) => {
          const name = e.target.value.trim();
          if (name) {
            localStorage.setItem('quizranzz_username', name);
            this._refreshUserAvatar(name);
            this.showToast(`Nama disimpan: ${name}`, 'success');
          }
        });
        playerNameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const name = e.target.value.trim();
            if (name) {
              localStorage.setItem('quizranzz_username', name);
              this._refreshUserAvatar(name);
              e.target.blur();
              this.showToast(`Halo, ${name}! 👋`, 'success');
            }
          }
        });
      }

      // User avatar click — focus name input to edit
      document.getElementById('user-avatar-btn')?.addEventListener('click', () => {
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) {
          nameInput.select();
          nameInput.focus();
        }
      });
      document.getElementById('user-avatar-btn')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          document.getElementById('player-name-input')?.focus();
        }
      });

      // ---- Access Code Navbar Lookup -----------------------------
      const doAccessCodeLookup = async () => {
        const codeInput = document.getElementById('access-code-input');
        const nameInput = document.getElementById('player-name-input');
        const code = (codeInput?.value || '').trim().toUpperCase();
        const name = (nameInput?.value || '').trim();

        if (!code) {
          this.showToast('Masukkan kode akses kuis terlebih dahulu.', 'warning');
          codeInput?.focus();
          return;
        }

        const quizzes = await storage.getAllQuizzes();
        const match = quizzes.find(q => q.accessCodeEnabled && q.accessCode && q.accessCode.toUpperCase() === code);

        if (match) {
          // Save name if provided
          if (name) {
            localStorage.setItem('quizranzz_username', name);
            this._refreshUserAvatar(name);
          }
          if (codeInput) codeInput.value = '';
          this.showToast(`Kuis "${match.title}" ditemukan! Memulai...`, 'success');
          // Start directly (code already verified from navbar)
          this.switchView('player');
          this.engine.start(match);
        } else {
          this.showToast('Kode akses tidak ditemukan. Periksa kembali.', 'error');
        }
      };

      document.getElementById('btn-enter-code')?.addEventListener('click', doAccessCodeLookup);

      document.getElementById('access-code-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doAccessCodeLookup();
      });

      document.getElementById('access-code-input')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });

      // ---- Dashboard Search --------------------------------------
      document.getElementById('dashboard-search-input')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.quiz-card').forEach(card => {
          const t = card.querySelector('.quiz-card-title')?.textContent.toLowerCase() || '';
          const d = card.querySelector('.quiz-card-desc')?.textContent.toLowerCase() || '';
          const c = (card.dataset.cat || '').toLowerCase();
          card.style.display = (t.includes(q) || d.includes(q) || c.includes(q)) ? '' : 'none';
        });
      });

      // ---- Clear History -----------------------------------------
      document.getElementById('btn-clear-history')?.addEventListener('click', async () => {
        if (confirm('Hapus semua riwayat ujian? Tindakan ini tidak dapat dibatalkan.')) {
          await storage.clearAttempts();
          this.showToast('Semua riwayat ujian telah dihapus.', 'info');
          this.renderHistory();
        }
      });

      // ---- Modal Close -------------------------------------------
      document.querySelectorAll('.btn-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        });
      });

      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('active');
        });
      });
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  function bootstrap() {
    const app = new App();
    window.__QUIZRANZZ_APP__ = app;
    app.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
