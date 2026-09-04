/**
 * QuizCraft Pro - Studio / Quiz Editor Controller
 */

import { storage } from './storage.js';
import { BulkQuizParser } from './bulk-parser.js';

export class QuizEditor {
  constructor(app) {
    this.app = app;
    this.currentQuiz = null;
    this.container = document.getElementById('studio-view');
  }

  createNewQuiz() {
    this.currentQuiz = {
      id: 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: 'Untitled Quiz Challenge',
      description: 'Create questions, add images or audio, and challenge your peers.',
      category: 'General',
      timeLimit: 15,
      passPercentage: 75,
      shuffleQuestions: false,
      shuffleOptions: true,
      instantFeedback: false,
      questions: [
        this.createEmptyQuestion(1)
      ]
    };
    this.render();
  }

  loadQuiz(quiz) {
    // Deep clone to avoid mutating store until saved
    this.currentQuiz = JSON.parse(JSON.stringify(quiz));
    if (!this.currentQuiz.questions || this.currentQuiz.questions.length === 0) {
      this.currentQuiz.questions = [this.createEmptyQuestion(1)];
    }
    this.render();
  }

  createEmptyQuestion(index) {
    return {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: `Question ${index}`,
      type: 'single', // 'single' | 'multiple' | 'boolean' | 'blank'
      points: 10,
      codeSnippet: '',
      codeLang: 'javascript',
      mediaImage: '',
      mediaAudio: '',
      options: [
        { id: 'opt_1', text: 'Option A', isCorrect: true },
        { id: 'opt_2', text: 'Option B', isCorrect: false },
        { id: 'opt_3', text: 'Option C', isCorrect: false },
        { id: 'opt_4', text: 'Option D', isCorrect: false }
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
            <button class="btn btn-ghost btn-sm" id="btn-studio-back" title="Back to Library">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
            <h2>Quiz Studio</h2>
          </div>
          <p>Design questions, attach code, images, audio, and configure grading settings.</p>
        </div>
        <div class="studio-actions">
          <button class="btn btn-secondary" id="btn-studio-bulk">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Bulk / AI Text Importer
          </button>
          <button class="btn btn-secondary" id="btn-studio-share" title="Share Quiz URL">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share Link
          </button>
          <button class="btn btn-primary" id="btn-studio-save">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Quiz
          </button>
          <button class="btn btn-success" id="btn-studio-play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Play Now
          </button>
        </div>
      </div>

      <div class="studio-layout">
        <!-- Sidebar Settings -->
        <div class="quiz-settings-panel">
          <div class="card settings-card">
            <h3>Quiz Settings</h3>

            <div class="form-group">
              <label class="form-label">Quiz Title</label>
              <input type="text" class="form-input" id="meta-quiz-title" value="${this.escapeHtml(this.currentQuiz.title)}" placeholder="e.g. JavaScript Masterclass">
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" id="meta-quiz-desc" placeholder="Brief explanation of the quiz topic...">${this.escapeHtml(this.currentQuiz.description || '')}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Category / Subject</label>
              <select class="form-select" id="meta-quiz-cat">
                <option value="Programming" ${this.currentQuiz.category === 'Programming' ? 'selected' : ''}>💻 Programming & Tech</option>
                <option value="Audio & Science" ${this.currentQuiz.category === 'Audio & Science' ? 'selected' : ''}>🎧 Audio & Science</option>
                <option value="General" ${this.currentQuiz.category === 'General' ? 'selected' : ''}>🌍 General Knowledge</option>
                <option value="Mathematics" ${this.currentQuiz.category === 'Mathematics' ? 'selected' : ''}>📐 Mathematics</option>
                <option value="Language" ${this.currentQuiz.category === 'Language' ? 'selected' : ''}>🗣️ Language & Reading</option>
                <option value="Custom" ${this.currentQuiz.category === 'Custom' ? 'selected' : ''}>✨ Custom</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Time Limit (Minutes, 0 = No limit)</label>
              <input type="number" min="0" max="180" class="form-input" id="meta-quiz-time" value="${this.currentQuiz.timeLimit || 0}">
            </div>

            <div class="form-group">
              <label class="form-label">Passing Percentage (%)</label>
              <input type="number" min="1" max="100" class="form-input" id="meta-quiz-pass" value="${this.currentQuiz.passPercentage || 70}">
            </div>

            <div class="toggle-group">
              <div class="toggle-label">
                <span class="toggle-title">Shuffle Questions</span>
                <span class="toggle-desc">Randomize question order for test-takers</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="meta-quiz-shuffle-q" ${this.currentQuiz.shuffleQuestions ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>

            <div class="toggle-group">
              <div class="toggle-label">
                <span class="toggle-title">Shuffle Options</span>
                <span class="toggle-desc">Randomize choice order per question</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="meta-quiz-shuffle-opt" ${this.currentQuiz.shuffleOptions ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>

            <div class="toggle-group">
              <div class="toggle-label">
                <span class="toggle-title">Instant Practice Feedback</span>
                <span class="toggle-desc">Show answer & explanation immediately</span>
              </div>
              <label class="switch">
                <input type="checkbox" id="meta-quiz-instant" ${this.currentQuiz.instantFeedback ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
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
              Add New Question
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
            <span class="badge badge-primary">Q${idx + 1}</span>
            <div class="type-select-wrapper">
              <select class="form-select q-type-select" data-qid="${q.id}" style="padding:0.25rem 0.6rem;font-size:0.8rem;">
                <option value="single" ${q.type === 'single' ? 'selected' : ''}>Single Choice</option>
                <option value="multiple" ${q.type === 'multiple' ? 'selected' : ''}>Multiple Answers (Checkboxes)</option>
                <option value="boolean" ${q.type === 'boolean' ? 'selected' : ''}>True / False</option>
                <option value="blank" ${q.type === 'blank' ? 'selected' : ''}>Fill in Blank</option>
              </select>
            </div>
          </div>

          <div class="question-card-controls">
            <input type="number" min="1" max="100" class="form-input q-points-input" data-qid="${q.id}" value="${q.points || 10}" title="Points" style="width:70px;padding:0.25rem 0.5rem;font-size:0.8rem;">
            <span style="font-size:0.75rem;color:var(--text-muted);">pts</span>
            
            <button class="btn btn-ghost btn-sm btn-icon-only q-move-up" data-qid="${q.id}" title="Move Up" ${idx === 0 ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon-only q-move-down" data-qid="${q.id}" title="Move Down" ${idx === this.currentQuiz.questions.length - 1 ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm btn-icon-only q-duplicate" data-qid="${q.id}" title="Duplicate Question">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon-only q-delete" data-qid="${q.id}" title="Delete Question">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <!-- Question Prompt Input -->
        <div class="form-group">
          <textarea class="form-textarea q-title-input" data-qid="${q.id}" placeholder="Type question prompt here..." rows="2">${this.escapeHtml(q.title)}</textarea>
        </div>

        <!-- Media Attachment Bar -->
        <div class="media-attachment-box">
          <div class="media-upload-triggers">
            <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Attach Image
              <input type="file" accept="image/*" class="media-file-input q-img-file" data-qid="${q.id}">
            </label>

            <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              Attach Audio
              <input type="file" accept="audio/*" class="media-file-input q-aud-file" data-qid="${q.id}">
            </label>

            <button class="btn btn-ghost btn-sm q-toggle-code" data-qid="${q.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              ${q.codeSnippet ? 'Edit Code Block' : '+ Add Code Snippet'}
            </button>
          </div>

          <!-- Media Previews -->
          ${q.mediaImage ? `
            <div class="media-preview-container">
              <div class="image-preview-wrapper">
                <img src="${q.mediaImage}" alt="Attached Image">
                <div class="media-preview-actions">
                  <button class="btn btn-danger btn-sm btn-icon-only q-remove-img" data-qid="${q.id}" title="Remove image">
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
                <button class="btn btn-danger btn-sm btn-icon-only q-remove-aud" data-qid="${q.id}" title="Remove audio">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Code Snippet Box (If active) -->
        <div class="code-snippet-box" id="code-box-${q.id}" style="${q.codeSnippet ? 'display:block;' : 'display:none;'}">
          <div class="code-snippet-header">
            <span class="code-lang-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Syntax Language:
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
          <textarea class="code-editor-textarea q-code-input" data-qid="${q.id}" placeholder="// Paste or type code snippet here...">${this.escapeHtml(q.codeSnippet || '')}</textarea>
        </div>

        <!-- Options / Answers Section -->
        ${q.type === 'blank' ? `
          <div class="form-group" style="margin-top:1rem;">
            <label class="form-label">
              Correct Answer Keywords (Use "|" for alternate acceptable answers)
              <span class="badge badge-neutral">Case Insensitive</span>
            </label>
            <input type="text" class="form-input q-blank-input" data-qid="${q.id}" value="${this.escapeHtml(q.blankAnswer || '')}" placeholder="e.g. const | const keyword | immutable">
          </div>
        ` : `
          <div class="options-builder" data-qid="${q.id}">
            ${q.options.map((opt, oIdx) => `
              <div class="option-row ${opt.isCorrect ? 'is-correct' : ''}" data-optid="${opt.id}">
                <button type="button" class="option-select-btn ${q.type === 'multiple' ? 'checkbox' : ''} q-toggle-correct" data-qid="${q.id}" data-optid="${opt.id}" title="${opt.isCorrect ? 'Correct Answer' : 'Mark as Correct'}">
                  ${opt.isCorrect ? '✓' : ''}
                </button>
                <input type="text" class="option-input q-opt-text" data-qid="${q.id}" data-optid="${opt.id}" value="${this.escapeHtml(opt.text)}" placeholder="Option ${String.fromCharCode(65 + oIdx)}">
                <div class="option-actions">
                  ${q.options.length > 2 && q.type !== 'boolean' ? `
                    <button type="button" class="btn btn-ghost btn-sm btn-icon-only q-del-opt" data-qid="${q.id}" data-optid="${opt.id}" title="Remove option">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}

            ${q.type !== 'boolean' ? `
              <button type="button" class="btn btn-ghost btn-sm q-add-opt" data-qid="${q.id}" style="align-self:flex-start;margin-top:0.25rem;">
                + Add Option
              </button>
            ` : ''}
          </div>
        `}

        <!-- Explanation & Hint -->
        <div class="explanation-box">
          <label class="form-label" style="font-size:0.8rem;color:var(--text-muted);">
            💡 Post-Quiz Explanation & Solution Note (Optional)
          </label>
          <textarea class="form-textarea q-expl-input" data-qid="${q.id}" rows="2" placeholder="Explain why the correct answer is right...">${this.escapeHtml(q.explanation || '')}</textarea>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Back to Dashboard
    document.getElementById('btn-studio-back')?.addEventListener('click', () => {
      this.app.switchView('dashboard');
    });

    // Save Quiz
    document.getElementById('btn-studio-save')?.addEventListener('click', () => {
      this.saveCurrentQuiz();
    });

    // Play Now
    document.getElementById('btn-studio-play')?.addEventListener('click', async () => {
      await this.saveCurrentQuiz(false);
      this.app.startQuiz(this.currentQuiz);
    });

    // Share Quiz Link
    document.getElementById('btn-studio-share')?.addEventListener('click', () => {
      this.collectFormData();
      this.app.openShareModal(this.currentQuiz);
    });

    // Bulk Importer Modal
    document.getElementById('btn-studio-bulk')?.addEventListener('click', () => {
      this.openBulkModal();
    });

    // Add Question
    document.getElementById('btn-add-question')?.addEventListener('click', () => {
      this.collectFormData();
      this.currentQuiz.questions.push(this.createEmptyQuestion(this.currentQuiz.questions.length + 1));
      this.render();
      // Scroll to bottom
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    // Delegate Question Actions inside container
    const qListRoot = document.getElementById('questions-list-root');
    if (!qListRoot) return;

    // Type Change
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
            { id: 'opt_true', text: 'True', isCorrect: true },
            { id: 'opt_false', text: 'False', isCorrect: false }
          ];
        } else if (newType === 'blank') {
          q.options = [];
          if (!q.blankAnswer) q.blankAnswer = '';
        } else if (q.options.length < 2) {
          q.options = [
            { id: 'opt_1', text: 'Option A', isCorrect: true },
            { id: 'opt_2', text: 'Option B', isCorrect: false }
          ];
        }
        this.render();
      });
    });

    // Toggle Correct Answer
    qListRoot.querySelectorAll('.q-toggle-correct').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qid = btn.dataset.qid;
        const optid = btn.dataset.optid;
        const q = this.currentQuiz.questions.find(x => x.id === qid);
        if (!q) return;

        this.collectFormData();
        if (q.type === 'multiple') {
          // Toggle multiple checkbox
          const opt = q.options.find(o => o.id === optid);
          if (opt) opt.isCorrect = !opt.isCorrect;
        } else {
          // Single radio toggle
          q.options.forEach(o => {
            o.isCorrect = (o.id === optid);
          });
        }
        this.render();
      });
    });

    // Add Option
    qListRoot.querySelectorAll('.q-add-opt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qid = btn.dataset.qid;
        const q = this.currentQuiz.questions.find(x => x.id === qid);
        if (!q) return;
        this.collectFormData();
        q.options.push({
          id: 'opt_' + Math.random().toString(36).substr(2, 6),
          text: `Option ${String.fromCharCode(65 + q.options.length)}`,
          isCorrect: false
        });
        this.render();
      });
    });

    // Delete Option
    qListRoot.querySelectorAll('.q-del-opt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qid = btn.dataset.qid;
        const optid = btn.dataset.optid;
        const q = this.currentQuiz.questions.find(x => x.id === qid);
        if (!q || q.options.length <= 2) return;
        this.collectFormData();
        q.options = q.options.filter(o => o.id !== optid);
        // Ensure at least one correct
        if (!q.options.some(o => o.isCorrect)) {
          q.options[0].isCorrect = true;
        }
        this.render();
      });
    });

    // Move Up / Move Down
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

    // Duplicate Question
    qListRoot.querySelectorAll('.q-duplicate').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.qid;
        const idx = this.currentQuiz.questions.findIndex(x => x.id === qid);
        if (idx >= 0) {
          this.collectFormData();
          const clone = JSON.parse(JSON.stringify(this.currentQuiz.questions[idx]));
          clone.id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
          clone.title += ' (Copy)';
          this.currentQuiz.questions.splice(idx + 1, 0, clone);
          this.render();
        }
      });
    });

    // Delete Question
    qListRoot.querySelectorAll('.q-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.currentQuiz.questions.length <= 1) {
          this.app.showToast('Quiz must have at least one question!', 'warning');
          return;
        }
        const qid = btn.dataset.qid;
        this.collectFormData();
        this.currentQuiz.questions = this.currentQuiz.questions.filter(x => x.id !== qid);
        this.render();
      });
    });

    // Toggle Code Snippet Area
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

    // File Upload Handlers (Image)
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
          this.app.showToast('Image attached successfully!', 'success');
        };
        reader.readAsDataURL(file);
      });
    });

    // File Upload Handlers (Audio)
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
          this.app.showToast('Audio attached successfully!', 'success');
        };
        reader.readAsDataURL(file);
      });
    });

    // Remove Image
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

    // Remove Audio
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

    // Collect Metadata
    this.currentQuiz.title = document.getElementById('meta-quiz-title')?.value.trim() || 'Untitled Quiz';
    this.currentQuiz.description = document.getElementById('meta-quiz-desc')?.value.trim() || '';
    this.currentQuiz.category = document.getElementById('meta-quiz-cat')?.value || 'General';
    this.currentQuiz.timeLimit = parseInt(document.getElementById('meta-quiz-time')?.value, 10) || 0;
    this.currentQuiz.passPercentage = parseInt(document.getElementById('meta-quiz-pass')?.value, 10) || 70;
    this.currentQuiz.shuffleQuestions = document.getElementById('meta-quiz-shuffle-q')?.checked || false;
    this.currentQuiz.shuffleOptions = document.getElementById('meta-quiz-shuffle-opt')?.checked || false;
    this.currentQuiz.instantFeedback = document.getElementById('meta-quiz-instant')?.checked || false;

    // Collect Questions Data
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
        this.app.showToast('Quiz saved successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      this.app.showToast('Failed to save quiz', 'error');
    }
  }

  openBulkModal() {
    const modalRoot = document.getElementById('modal-bulk-importer');
    if (!modalRoot) return;

    modalRoot.classList.add('active');

    const sampleText = `1. What is the output of typeof null in JavaScript?
a) number
b) string
*c) object
d) undefined
Explanation: typeof null returns "object" due to a historical legacy bug in JS.

2. Which of the following are valid HTML5 tags?
* [x] <article>
* [x] <nav>
* [x] <section>
- [ ] <applet>

3. CSS Flexbox is designed primarily for 1-dimensional layouts.
*a) True
b) False

4. Q: Name the standard port number for HTTPS:
Ans: 443`;

    document.getElementById('bulk-import-textarea').value = sampleText;

    const parseBtn = document.getElementById('btn-bulk-execute');
    parseBtn.onclick = () => {
      const raw = document.getElementById('bulk-import-textarea').value;
      const parsedQuestions = BulkQuizParser.parse(raw);
      if (parsedQuestions.length === 0) {
        this.app.showToast('Could not parse any valid questions. Check formatting.', 'warning');
        return;
      }

      this.collectFormData();
      // Append or replace
      this.currentQuiz.questions = parsedQuestions;
      this.render();
      modalRoot.classList.remove('active');
      this.app.showToast(`Imported ${parsedQuestions.length} questions successfully!`, 'success');
    };
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
