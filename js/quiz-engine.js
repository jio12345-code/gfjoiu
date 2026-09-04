/**
 * QuizCraft Pro - Test Arena & Quiz Runtime Engine
 */

import { soundFx } from './audio-fx.js';
import { storage } from './storage.js';

export class QuizEngine {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('player-view');
    this.quiz = null;
    this.questions = [];
    this.currentIndex = 0;
    this.userAnswers = {}; // { [qid]: [optId, ...] | 'text' }
    this.flaggedQuestions = new Set();
    this.timerInterval = null;
    this.secondsRemaining = 0;
    this.startTime = 0;
    this.isExamSubmitted = false;
    this.keyboardListener = null;
  }

  start(quiz) {
    this.quiz = JSON.parse(JSON.stringify(quiz));
    this.currentIndex = 0;
    this.userAnswers = {};
    this.flaggedQuestions.clear();
    this.isExamSubmitted = false;
    this.startTime = Date.now();

    // Prepare questions (Shuffle if configured)
    this.questions = [...this.quiz.questions];
    if (this.quiz.shuffleQuestions) {
      this.questions.sort(() => Math.random() - 0.5);
    }

    // Shuffle options inside questions if configured
    if (this.quiz.shuffleOptions) {
      this.questions.forEach(q => {
        if (q.type !== 'boolean' && q.options && q.options.length > 0) {
          q.options = [...q.options].sort(() => Math.random() - 0.5);
        }
      });
    }

    // Init timer
    if (this.quiz.timeLimit && this.quiz.timeLimit > 0) {
      this.secondsRemaining = this.quiz.timeLimit * 60;
      this.startTimer();
    } else {
      this.secondsRemaining = null;
    }

    this.render();
    this.bindKeyboardShortcuts();
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.secondsRemaining <= 0) {
        clearInterval(this.timerInterval);
        soundFx.playIncorrect();
        this.app.showToast('Time is up! Submitting exam automatically.', 'warning');
        this.finishQuiz();
        return;
      }

      this.secondsRemaining--;
      this.updateTimerDisplay();

      // Audio tick warning in last 10 seconds
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
          <button class="btn btn-ghost btn-sm" id="btn-player-exit" title="Exit Quiz">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Exit
          </button>
          <span class="hud-title" title="${this.escapeHtml(this.quiz.title)}">${this.escapeHtml(this.quiz.title)}</span>
        </div>

        <div class="hud-right">
          ${this.secondsRemaining !== null ? `
            <div class="timer-badge" id="arena-timer-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              --:--
            </div>
          ` : ''}

          <button class="btn ${isFlagged ? 'btn-danger' : 'btn-secondary'} btn-sm" id="btn-toggle-flag" title="Flag/Bookmark Question">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFlagged ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            ${isFlagged ? 'Flagged' : 'Flag'}
          </button>
        </div>
      </div>

      <!-- Progress Line -->
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
      </div>

      <!-- Question Card -->
      <div class="player-question-card">
        <div class="question-meta-row">
          <span class="badge badge-primary">Question ${this.currentIndex + 1} of ${totalQ}</span>
          <span class="badge badge-neutral">${q.points || 10} Points</span>
        </div>

        <div class="question-prompt">
          ${this.formatPromptText(q.title)}
        </div>

        <!-- Code Snippet (If Present) -->
        ${q.codeSnippet ? `
          <div class="code-viewer-container">
            <div class="code-viewer-header">
              <span class="code-lang-tag">${q.codeLang || 'CODE'}</span>
              <button class="btn btn-ghost btn-sm btn-icon-only btn-copy-code" title="Copy Code">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
            <pre class="code-viewer-body"><code>${this.escapeHtml(q.codeSnippet)}</code></pre>
          </div>
        ` : ''}

        <!-- Image Attachment (If Present) -->
        ${q.mediaImage ? `
          <div class="player-image-wrapper" title="Click to view full image">
            <img src="${q.mediaImage}" alt="Question Image" class="zoomable-img">
          </div>
        ` : ''}

        <!-- Audio Attachment (If Present) -->
        ${q.mediaAudio ? `
          <div class="player-audio-card">
            <div class="audio-icon-pulse">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            </div>
            <audio controls src="${q.mediaAudio}" style="width:100%;"></audio>
          </div>
        ` : ''}

        <!-- Answer Options -->
        ${q.type === 'blank' ? `
          <div class="player-blank-wrapper">
            <input type="text" class="form-input player-blank-input" id="player-blank-field" value="${this.escapeHtml(currentAnswer || '')}" placeholder="Type your answer here and press Enter...">
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

              // Instant feedback styling in practice mode
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

        <!-- Instant Feedback Explanation Box (Practice Mode) -->
        ${(this.quiz.instantFeedback && currentAnswer !== undefined && q.explanation) ? `
          <div class="instant-feedback-card ${this.isQuestionCorrect(q) ? 'correct' : 'wrong'}">
            <strong>💡 Explanation:</strong>
            <p style="margin-top:0.4rem;color:var(--text-main);">${this.escapeHtml(q.explanation)}</p>
          </div>
        ` : ''}
      </div>

      <!-- Arena Navigation Controls -->
      <div class="player-nav-bar">
        <button class="btn btn-secondary" id="btn-player-prev" ${this.currentIndex === 0 ? 'disabled' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          Previous
        </button>

        <div style="display:flex;gap:0.75rem;">
          <button class="btn btn-ghost" id="btn-player-clear">Clear Selection</button>
          
          ${this.currentIndex === totalQ - 1 ? `
            <button class="btn btn-success" id="btn-player-submit">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Submit Exam
            </button>
          ` : `
            <button class="btn btn-primary" id="btn-player-next">
              Next
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          `}
        </div>
      </div>

      <!-- Question Drawer Jump Grid -->
      <div class="question-grid-drawer">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <h4 style="font-size:0.95rem;">Question Navigator</h4>
          <span style="font-size:0.8rem;color:var(--text-muted);">
            Answered: ${Object.keys(this.userAnswers).length}/${totalQ}
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

    // Exit Button
    document.getElementById('btn-player-exit')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to exit the quiz? Your current progress will be lost.')) {
        clearInterval(this.timerInterval);
        this.app.switchView('dashboard');
      }
    });

    // Flag Bookmark Toggle
    document.getElementById('btn-toggle-flag')?.addEventListener('click', () => {
      if (this.flaggedQuestions.has(q.id)) {
        this.flaggedQuestions.delete(q.id);
      } else {
        this.flaggedQuestions.add(q.id);
      }
      this.render();
    });

    // Option Selection
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

    // Fill in Blank Input
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

    // Prev Button
    document.getElementById('btn-player-prev')?.addEventListener('click', () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.render();
      }
    });

    // Next Button
    document.getElementById('btn-player-next')?.addEventListener('click', () => {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
        this.render();
      }
    });

    // Clear Button
    document.getElementById('btn-player-clear')?.addEventListener('click', () => {
      delete this.userAnswers[q.id];
      this.render();
    });

    // Submit Exam Button
    document.getElementById('btn-player-submit')?.addEventListener('click', () => {
      const unanswered = this.questions.filter(item => this.userAnswers[item.id] === undefined || this.userAnswers[item.id] === '');
      if (unanswered.length > 0) {
        if (!confirm(`You still have ${unanswered.length} unanswered question(s). Are you sure you want to finish and submit?`)) {
          return;
        }
      }
      this.finishQuiz();
    });

    // Jump Grid Pills
    this.container.querySelectorAll('.grid-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const jumpIdx = parseInt(btn.dataset.jump, 10);
        this.currentIndex = jumpIdx;
        this.render();
      });
    });

    // Copy Code Button
    this.container.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', () => {
        if (q.codeSnippet) {
          navigator.clipboard.writeText(q.codeSnippet);
          this.app.showToast('Code copied to clipboard!', 'info');
        }
      });
    });

    // Lightbox Image Zoom
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
      // Ignore if typing inside text input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (this.isExamSubmitted) return;

      const q = this.questions[this.currentIndex];
      if (!q) return;

      // Letter keys A, B, C, D, E, F or Numbers 1, 2, 3, 4, 5, 6
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
      // Single or Boolean
      const correctOpt = q.options.find(o => o.isCorrect);
      return correctOpt ? correctOpt.id === userAns : false;
    }
  }

  async finishQuiz() {
    clearInterval(this.timerInterval);
    this.isExamSubmitted = true;
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
      const isCorrect = this.isQuestionCorrect(q);
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

    const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = scorePercent >= (this.quiz.passPercentage || 70);
    const timeSpentSec = Math.round((Date.now() - this.startTime) / 1000);

    // Calculate Grade
    let grade = 'F';
    if (scorePercent >= 95) grade = 'A+';
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
      earnedPoints,
      totalPoints,
      correctCount,
      wrongCount,
      totalQuestions,
      isPassed,
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
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
