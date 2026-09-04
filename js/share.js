/**
 * QuizCraft Pro - Serverless URL Sharing Engine
 * Encodes & decodes complete quizzes into lightweight URL hashes.
 */

export class QuizShareEngine {
  /**
   * Encode quiz into a shareable URL string
   * @param {Object} quiz 
   * @returns {string} full shareable URL
   */
  static encodeToURL(quiz) {
    try {
      // Create a clean portable copy without huge local-only metadata
      const portableQuiz = {
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        timeLimit: quiz.timeLimit,
        passPercentage: quiz.passPercentage,
        shuffleQuestions: quiz.shuffleQuestions,
        shuffleOptions: quiz.shuffleOptions,
        instantFeedback: quiz.instantFeedback,
        questions: quiz.questions.map(q => ({
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
      console.error('Error generating share URL:', err);
      return null;
    }
  }

  /**
   * Decode URL hash back into a quiz object
   * @param {string} hash 
   * @returns {Object|null}
   */
  static decodeFromURL(hash) {
    try {
      if (!hash || !hash.includes('quiz=')) return null;

      const rawBase64 = hash.split('quiz=')[1];
      if (!rawBase64) return null;

      const jsonStr = decodeURIComponent(escape(atob(rawBase64)));
      const quiz = JSON.parse(jsonStr);

      // Ensure valid ID and created time
      quiz.id = 'shared_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      quiz.createdAt = Date.now();
      quiz.updatedAt = Date.now();

      return quiz;
    } catch (err) {
      console.error('Error decoding share URL hash:', err);
      return null;
    }
  }
}
