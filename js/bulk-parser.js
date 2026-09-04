/**
 * QuizCraft Pro - Bulk Text & Markdown Quiz Parser
 * Converts plain text, markdown, or AI-generated quiz prompts into structured quiz objects.
 */

export class BulkQuizParser {
  /**
   * Parse raw text/markdown into an array of question objects
   * @param {string} rawText 
   * @returns {Array<Object>}
   */
  static parse(rawText) {
    if (!rawText || !rawText.trim()) return [];

    // Split by question delimiters (e.g., number prefixes like "1.", "Question 1:", "Q1:", or "---")
    const blocks = this.splitIntoQuestionBlocks(rawText.trim());
    const questions = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      if (!block) continue;

      const q = this.parseSingleQuestion(block, i + 1);
      if (q) {
        questions.push(q);
      }
    }

    return questions;
  }

  static splitIntoQuestionBlocks(text) {
    // If separated by markdown divider --- or ===
    if (text.includes('\n---\n') || text.includes('\n===\n')) {
      return text.split(/\n(?:---|===)\n/);
    }

    // Split by numbering at line starts: "1.", "1)", "Q1:", "Question 1", "Soal 1:"
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

    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
    }

    return blocks;
  }

  static parseSingleQuestion(block, index) {
    const lines = block.split('\n').map(l => l.trimEnd());
    if (lines.length === 0) return null;

    let title = '';
    let codeSnippet = '';
    let codeLang = 'javascript';
    let explanation = '';
    let type = 'single'; // 'single' | 'multiple' | 'boolean' | 'blank'
    let points = 10;
    const options = [];
    let blankAnswers = [];

    let inCodeBlock = false;
    let codeLines = [];
    let readingExplanation = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Handle Code Block
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

      // Handle Explanation
      if (line.match(/^(?:Explanation|Penjelasan|Pembahasan|Catatan)[\:\-]\s*/i)) {
        readingExplanation = true;
        explanation = line.replace(/^(?:Explanation|Penjelasan|Pembahasan|Catatan)[\:\-]\s*/i, '').trim();
        continue;
      }

      if (readingExplanation) {
        explanation += '\n' + line;
        continue;
      }

      // Handle Answer tag: "Answer: A" or "Kunci: B, C" or "Jawaban: const"
      const ansMatch = line.match(/^(?:Answer|Kunci(?:\s*Jawaban)?|Jawaban|Ans)[\:\-]\s*(.+)$/i);
      if (ansMatch) {
        const rawAns = ansMatch[1].trim();
        // If it's single or multiple choice letter(s)
        const letters = rawAns.match(/[A-Za-z0-9]/g);
        if (letters && letters.length > 0 && (letters.length <= 4 || letters.every(l => l.length === 1))) {
          // Will mark options later
          rawAns.split(/[,;\s]+/).forEach(token => {
            const cleanToken = token.trim().toUpperCase();
            if (cleanToken.length === 1) {
              const optIdx = cleanToken.charCodeAt(0) - 65; // A -> 0, B -> 1
              if (options[optIdx]) {
                options[optIdx].isCorrect = true;
              }
            }
          });
        } else {
          blankAnswers.push(rawAns);
        }
        continue;
      }

      // First non-option, non-metadata line is the question prompt
      if (!title && !line.match(/^(?:[A-Fa-f0-9][\.\)\:]|[\-\*\+]\s*\[[ xX]\]|[\-\*\+]\s*\(?[A-Fa-f0-9]\)?)/)) {
        // Strip question prefix "1. ", "Q: ", etc.
        title = line.replace(/^(?:(?:\d+[\.\)])|(?:Q(?:uestion)?\s*\d*[\:\.\)]?)|(?:Soal\s*\d*[\:\.\)]?))\s*/i, '').trim();
        continue;
      } else if (!title && line) {
        title = line;
        continue;
      }

      // Handle Option Lines:
      // "A) ...", "a. ...", "* [x] ...", "- [ ] ...", "1. ...", "*A) ..." (asterisk indicates correct)
      const optionMatch = line.match(/^(\*)?\s*(?:([A-Za-z0-9])[\.\)\:]|[\-\*\+]\s*\[([ xX])\]|[\-\*\+]\s*\(?([A-Za-z0-9])?\)?)\s*(.+)$/i);
      if (optionMatch) {
        const isAsterisk = !!optionMatch[1];
        const letter = optionMatch[2] || optionMatch[4];
        const checkboxState = optionMatch[3];
        const optText = optionMatch[5].trim();

        const isCorrect = isAsterisk || 
                          (checkboxState && (checkboxState === 'x' || checkboxState === 'X')) ||
                          optText.includes('(Correct)') ||
                          optText.includes('(Kunci)');

        const cleanOptText = optText
          .replace(/\s*\((?:Correct|Benar|Kunci)\)\s*/i, '')
          .trim();

        options.push({
          id: 'opt_' + Math.random().toString(36).substr(2, 6),
          text: cleanOptText,
          isCorrect: isCorrect
        });
        continue;
      }

      // If it's additional prompt text before options
      if (options.length === 0 && !readingExplanation) {
        title += '\n' + line;
      }
    }

    if (!title && options.length === 0) return null;

    // Detect Question Type
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

    // Default at least 1 option marked if none marked and it's choice
    if ((type === 'single' || type === 'multiple') && options.length > 0 && correctCount === 0) {
      options[0].isCorrect = true;
    }

    return {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: title || `Question ${index}`,
      type: type,
      points: points,
      codeSnippet: codeSnippet || '',
      codeLang: codeLang || 'javascript',
      mediaImage: '',
      mediaAudio: '',
      options: options.length > 0 ? options : [
        { id: 'opt_1', text: 'Option 1', isCorrect: true },
        { id: 'opt_2', text: 'Option 2', isCorrect: false }
      ],
      blankAnswer: blankAnswers.join('|'),
      explanation: explanation.trim()
    };
  }
}
