/**
 * QuizCraft Pro - Built-in High Quality Sample Quizzes
 * Includes rich code snippets, media attachments, and multiple question types.
 */

// Generate a clean sine wave base64 WAV sound for offline audio quiz samples
function createSineWavDataUrl(frequency = 440, durationSec = 1.2) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
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
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write PCM samples with smooth fade-in and fade-out
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
}

// Clean vector SVG diagram as DataURL for image samples
const cssBoxModelSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="100%" height="100%" fill="%230F172A"/><rect x="40" y="30" width="520" height="280" rx="8" fill="%23F59E0B" fill-opacity="0.2" stroke="%23F59E0B" stroke-width="2"/><text x="50" y="55" fill="%23F59E0B" font-family="sans-serif" font-weight="bold" font-size="14">Margin</text><rect x="90" y="70" width="420" height="200" rx="8" fill="%238B5CF6" fill-opacity="0.2" stroke="%238B5CF6" stroke-width="2"/><text x="100" y="95" fill="%238B5CF6" font-family="sans-serif" font-weight="bold" font-size="14">Border</text><rect x="140" y="110" width="320" height="120" rx="8" fill="%2310B981" fill-opacity="0.2" stroke="%2310B981" stroke-width="2"/><text x="150" y="135" fill="%2310B981" font-family="sans-serif" font-weight="bold" font-size="14">Padding</text><rect x="200" y="145" width="200" height="50" rx="6" fill="%236366F1" stroke="%23818CF8" stroke-width="2"/><text x="300" y="176" fill="%23FFFFFF" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">Content (Width x Height)</text></svg>';

export const SAMPLE_QUIZZES = [
  {
    id: 'sample_webdev_pro',
    title: 'Full-Stack Web Dev & JavaScript Pro Assessment',
    description: 'Test your deep understanding of JavaScript internals, Event Loop, DOM, CSS Box Model, and modern web architectures.',
    category: 'Programming',
    timeLimit: 10, // 10 minutes
    passPercentage: 75,
    shuffleQuestions: false,
    shuffleOptions: true,
    instantFeedback: false,
    questions: [
      {
        id: 'q_js_1',
        title: 'What is logged to the browser console when executing the following JavaScript snippet?',
        type: 'single',
        points: 10,
        codeSnippet: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
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
        explanation: 'Synchronous code runs first (1, 4). Microtasks (Promise.then callbacks) run before Macrotasks (setTimeout), producing output 1, 4, 3, 2.'
      },
      {
        id: 'q_js_2',
        title: 'Refer to the CSS Box Model diagram below. Which property controls the spacing directly between the Border and the Content?',
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
        explanation: 'Padding sits inside the border and creates space around the element content.'
      },
      {
        id: 'q_js_3',
        title: 'Which of the following statements about JavaScript closures are TRUE? (Select all that apply)',
        type: 'multiple',
        points: 15,
        codeSnippet: `function makeCounter() {
  let count = 0;
  return () => ++count;
}`,
        codeLang: 'javascript',
        mediaImage: '',
        mediaAudio: '',
        options: [
          { id: 'opt_1', text: 'A closure gives an inner function access to its outer enclosing scope variables.', isCorrect: true },
          { id: 'opt_2', text: 'Closures are destroyed immediately when the outer function returns.', isCorrect: false },
          { id: 'opt_3', text: 'The returned function retains a reference to `count` in lexical memory.', isCorrect: true },
          { id: 'opt_4', text: 'Closures can be used to simulate private state and data encapsulation.', isCorrect: true }
        ],
        blankAnswer: '',
        explanation: 'Closures retain access to outer scope variables even after outer execution finishes, enabling data privacy.'
      },
      {
        id: 'q_js_4',
        title: 'Type the exact keyword used in modern JavaScript to declare a block-scoped, immutable variable binding:',
        type: 'blank',
        points: 10,
        codeSnippet: '',
        codeLang: 'javascript',
        mediaImage: '',
        mediaAudio: '',
        options: [],
        blankAnswer: 'const',
        explanation: 'The `const` keyword declares block-scoped variables that cannot be reassigned.'
      },
      {
        id: 'q_js_5',
        title: 'In HTTP/2 and HTTP/3, multiplexing allows multiple requests and responses to be sent simultaneously over a single TCP/QUIC connection without Head-of-Line blocking.',
        type: 'boolean',
        points: 10,
        codeSnippet: '',
        codeLang: 'bash',
        mediaImage: '',
        mediaAudio: '',
        options: [
          { id: 'opt_1', text: 'True', isCorrect: true },
          { id: 'opt_2', text: 'False', isCorrect: false }
        ],
        blankAnswer: '',
        explanation: 'True. Multiplexing is one of the biggest performance advancements in modern HTTP protocols.'
      }
    ]
  },
  {
    id: 'sample_audio_challenge',
    title: 'Acoustics & Frequency Ear Training Challenge',
    description: 'Listen to the synthesized audio tones and identify their pitch, frequency, and acoustic properties.',
    category: 'Audio & Science',
    timeLimit: 5,
    passPercentage: 70,
    shuffleQuestions: false,
    shuffleOptions: true,
    instantFeedback: true,
    questions: [
      {
        id: 'q_aud_1',
        title: 'Play the audio sample below. What is the standard concert pitch frequency of this pure sine tone (Concert Pitch A4)?',
        type: 'single',
        points: 15,
        codeSnippet: '',
        codeLang: '',
        mediaImage: '',
        mediaAudio: createSineWavDataUrl(440, 1.5),
        options: [
          { id: 'opt_1', text: '440 Hz (Standard Concert A4)', isCorrect: true },
          { id: 'opt_2', text: '220 Hz (Low A3)', isCorrect: false },
          { id: 'opt_3', text: '880 Hz (High A5)', isCorrect: false },
          { id: 'opt_4', text: '1000 Hz Test Tone', isCorrect: false }
        ],
        blankAnswer: '',
        explanation: 'Concert Pitch A (A4) is universally standardized at 440 Hz according to ISO 16.'
      },
      {
        id: 'q_aud_2',
        title: 'Listen to this higher pitched tone. Exactly one octave above A4 (440 Hz) lies what frequency?',
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
        explanation: 'Each ascending musical octave doubles the frequency. Therefore, one octave above 440 Hz is 880 Hz.'
      },
      {
        id: 'q_aud_3',
        title: 'Humans with healthy hearing can typically perceive frequencies ranging from 20 Hz up to approximately 20,000 Hz (20 kHz).',
        type: 'boolean',
        points: 10,
        codeSnippet: '',
        codeLang: '',
        mediaImage: '',
        mediaAudio: createSineWavDataUrl(523.25, 1.0),
        options: [
          { id: 'opt_1', text: 'True', isCorrect: true },
          { id: 'opt_2', text: 'False', isCorrect: false }
        ],
        blankAnswer: '',
        explanation: 'True. The nominal human hearing range is 20 Hz to 20 kHz.'
      }
    ]
  }
];
