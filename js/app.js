/**
 * QuizCraft Pro - Main Application Controller & Router
 */

import { storage } from './storage.js';
import { SAMPLE_QUIZZES } from './samples.js';
import { QuizEditor } from './quiz-editor.js';
import { QuizEngine } from './quiz-engine.js';
import { QuizShareEngine } from './share.js';
import { CertificateGenerator } from './certificate.js';
import { soundFx } from './audio-fx.js';

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.editor = new QuizEditor(this);
    this.engine = new QuizEngine(this);
    this.lastResult = null;
    this.lastQuiz = null;
  }

  async init() {
    this.initTheme();
    this.bindGlobalEvents();

    // Check if initial storage is empty; if so, populate sample quizzes
    const existing = await storage.getAllQuizzes();
    if (existing.length === 0) {
      for (const sample of SAMPLE_QUIZZES) {
        await storage.saveQuiz(sample);
      }
    }

    // Check for incoming shared quiz in URL hash (e.g. #quiz=...)
    if (window.location.hash && window.location.hash.includes('quiz=')) {
      const sharedQuiz = QuizShareEngine.decodeFromURL(window.location.hash);
      if (sharedQuiz) {
        await storage.saveQuiz(sharedQuiz);
        this.showToast(`Imported shared quiz: "${sharedQuiz.title}"!`, 'success');
        window.history.replaceState(null, null, window.location.pathname);
        this.startQuiz(sharedQuiz);
        return;
      }
    }

    // Default view: Render Library Dashboard
    await this.renderDashboard();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('quizcraft_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('quizcraft_theme', next);
    this.updateThemeButton(next);
  }

  updateThemeButton(theme) {
    const btn = document.getElementById('btn-theme-toggle');
    if (!btn) return;
    if (theme === 'dark') {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      btn.title = 'Switch to Light Mode';
    } else {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      btn.title = 'Switch to Dark Mode';
    }
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Toggle active nav tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    // Toggle view sections
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
    const listEl = document.getElementById('quiz-grid-root');
    const heroStatsEl = document.getElementById('dashboard-hero-stats');
    if (!listEl) return;

    const quizzes = await storage.getAllQuizzes();
    const attempts = await storage.getAttempts();

    // Render Stats
    if (heroStatsEl) {
      heroStatsEl.innerHTML = `
        <div class="stat-pill">
          <span class="stat-num">${quizzes.length}</span>
          <span class="stat-lbl">Quizzes</span>
        </div>
        <div class="stat-pill">
          <span class="stat-num">${attempts.length}</span>
          <span class="stat-lbl">Attempts</span>
        </div>
      `;
    }

    if (quizzes.length === 0) {
      listEl.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;">
          <h3 style="margin-bottom:0.5rem;">No Quizzes Created Yet</h3>
          <p style="margin-bottom:1.5rem;">Start by creating your first quiz or load a sample preset.</p>
          <button class="btn btn-primary" id="btn-empty-create">Create a Quiz</button>
        </div>
      `;
      document.getElementById('btn-empty-create')?.addEventListener('click', () => {
        this.openStudioNew();
      });
      return;
    }

    listEl.innerHTML = quizzes.map(q => {
      const qCount = q.questions ? q.questions.length : 0;
      const totalPts = (q.questions || []).reduce((sum, item) => sum + (item.points || 10), 0);
      const timeStr = q.timeLimit && q.timeLimit > 0 ? `${q.timeLimit} mins` : 'No limit';

      return `
        <div class="quiz-card" data-qid="${q.id}">
          <div>
            <div class="quiz-card-header">
              <span class="badge badge-primary">${this.escapeHtml(q.category || 'General')}</span>
              <span class="badge badge-neutral">${qCount} Questions</span>
            </div>
            <h3 class="quiz-card-title" style="margin-top:0.75rem;">${this.escapeHtml(q.title)}</h3>
            <p class="quiz-card-desc" style="margin-top:0.4rem;">${this.escapeHtml(q.description || 'No description provided.')}</p>
          </div>

          <div>
            <div class="quiz-card-meta">
              <span>⏱️ ${timeStr}</span>
              <span>🏆 ${totalPts} pts</span>
              <span>🎯 Pass: ${q.passPercentage || 70}%</span>
            </div>

            <div class="quiz-card-actions">
              <div style="display:flex;gap:0.35rem;">
                <button class="btn btn-ghost btn-sm btn-icon-only card-btn-edit" data-qid="${q.id}" title="Edit in Studio">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-ghost btn-sm btn-icon-only card-btn-share" data-qid="${q.id}" title="Share Link">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <button class="btn btn-ghost btn-sm btn-icon-only card-btn-print" data-qid="${q.id}" title="Print Exam Sheet">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                </button>
                <button class="btn btn-danger btn-sm btn-icon-only card-btn-delete" data-qid="${q.id}" title="Delete Quiz">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>

              <button class="btn btn-primary btn-sm card-btn-play" data-qid="${q.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
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
        if (confirm('Are you sure you want to delete this quiz?')) {
          await storage.deleteQuiz(btn.dataset.qid);
          this.showToast('Quiz deleted', 'info');
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
          <h3>No Quiz Attempts Recorded Yet</h3>
          <p style="margin-top:0.5rem;">Take a quiz from the library to see your grades, scores, and analytics history here.</p>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      <div class="card" style="padding:0;overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;text-align:left;font-size:0.9rem;">
          <thead>
            <tr style="background:var(--bg-surface-elevated);border-bottom:1px solid var(--border-subtle);">
              <th style="padding:1rem;">Date</th>
              <th style="padding:1rem;">Quiz Title</th>
              <th style="padding:1rem;">Score</th>
              <th style="padding:1rem;">Grade</th>
              <th style="padding:1rem;">Time Spent</th>
              <th style="padding:1rem;">Result</th>
            </tr>
          </thead>
          <tbody>
            ${attempts.map(att => `
              <tr style="border-bottom:1px solid var(--border-subtle);">
                <td style="padding:1rem;color:var(--text-muted);">${new Date(att.date).toLocaleDateString()} ${new Date(att.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                <td style="padding:1rem;font-weight:600;">${this.escapeHtml(att.quizTitle)}</td>
                <td style="padding:1rem;font-family:var(--font-mono);font-weight:700;">${att.scorePercent}% (${att.earnedPoints}/${att.totalPoints} pts)</td>
                <td style="padding:1rem;"><span class="badge ${att.isPassed ? 'badge-success' : 'badge-danger'}">${att.grade}</span></td>
                <td style="padding:1rem;color:var(--text-muted);">${Math.floor(att.timeSpentSec / 60)}m ${att.timeSpentSec % 60}s</td>
                <td style="padding:1rem;"><span class="badge ${att.isPassed ? 'badge-success' : 'badge-danger'}">${att.isPassed ? 'PASSED' : 'FAILED'}</span></td>
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

  startQuiz(quiz) {
    this.switchView('player');
    this.engine.start(quiz);
  }

  showResults(attempt, quiz) {
    this.lastResult = attempt;
    this.lastQuiz = quiz;
    this.switchView('results');

    const resultsRoot = document.getElementById('results-view');
    if (!resultsRoot) return;

    const circumference = 2 * Math.PI * 45; // radius = 45
    const offset = circumference - (attempt.scorePercent / 100) * circumference;

    resultsRoot.innerHTML = `
      <div class="results-container">
        <div class="results-hero-card">
          <span class="badge ${attempt.isPassed ? 'badge-success' : 'badge-danger'}" style="font-size:0.9rem;padding:0.4rem 1rem;">
            ${attempt.isPassed ? '🎉 CONGRATULATIONS! PASSED' : '⚠️ KEEP PRACTICING! FAILED'}
          </span>

          <div class="score-circle-wrapper">
            <svg class="score-circle-svg" viewBox="0 0 100 100">
              <circle class="score-circle-bg" cx="50" cy="50" r="45"></circle>
              <circle class="score-circle-bar" cx="50" cy="50" r="45" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
            </svg>
            <div class="score-text-overlay">
              <span class="score-percent">${attempt.scorePercent}%</span>
              <span class="score-label">GRADE ${attempt.grade}</span>
            </div>
          </div>

          <h2 style="margin-bottom:0.4rem;">${this.escapeHtml(attempt.quizTitle)}</h2>
          <p>You scored ${attempt.earnedPoints} out of ${attempt.totalPoints} total possible points.</p>

          <div class="results-stats-row">
            <div class="result-stat-box">
              <div class="result-stat-value" style="color:var(--accent-emerald);">✓ ${attempt.correctCount}</div>
              <div class="result-stat-label">Correct</div>
            </div>
            <div class="result-stat-box">
              <div class="result-stat-value" style="color:var(--accent-rose);">✗ ${attempt.wrongCount}</div>
              <div class="result-stat-label">Incorrect</div>
            </div>
            <div class="result-stat-box">
              <div class="result-stat-value">⏱️ ${Math.floor(attempt.timeSpentSec / 60)}m ${attempt.timeSpentSec % 60}s</div>
              <div class="result-stat-label">Time Spent</div>
            </div>
            <div class="result-stat-box">
              <div class="result-stat-value">🎯 ${quiz.passPercentage || 70}%</div>
              <div class="result-stat-label">Pass Threshold</div>
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:center;gap:1rem;flex-wrap:wrap;margin-top:1.5rem;">
            ${attempt.isPassed ? `
              <button class="btn btn-primary btn-lg" id="btn-results-cert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                Claim Certificate
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-lg" id="btn-results-retake">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              Retake Quiz
            </button>
            <button class="btn btn-ghost" id="btn-results-home">
              Back to Dashboard
            </button>
          </div>
        </div>

        <!-- Answers Review Section -->
        <h3 style="margin-bottom:1.25rem;">Detailed Answers Breakdown</h3>
        <div class="review-list">
          ${attempt.reviewData.map((item, idx) => {
            const q = item.question;
            return `
              <div class="review-item ${item.isCorrect ? 'is-correct' : 'is-wrong'}">
                <div class="review-header">
                  <span class="badge ${item.isCorrect ? 'badge-success' : 'badge-danger'}">
                    ${item.isCorrect ? '✓ Correct' : '✗ Incorrect'} (${item.pointsEarned}/${q.points || 10} pts)
                  </span>
                  <span style="font-size:0.8rem;color:var(--text-muted);">Question ${idx + 1}</span>
                </div>
                <div style="font-weight:600;font-size:1.05rem;color:var(--text-main);margin-bottom:0.75rem;">
                  ${this.escapeHtml(q.title)}
                </div>

                ${q.codeSnippet ? `
                  <pre class="code-viewer-body" style="background:#000000;border-radius:6px;padding:0.75rem;margin-bottom:0.75rem;"><code>${this.escapeHtml(q.codeSnippet)}</code></pre>
                ` : ''}

                <div style="font-size:0.875rem;display:flex;flex-direction:column;gap:0.4rem;">
                  <div>
                    <strong style="color:var(--text-muted);">Your Answer: </strong>
                    <span>${this.formatAnswerLabel(q, item.userAnswer)}</span>
                  </div>
                  ${!item.isCorrect ? `
                    <div>
                      <strong style="color:var(--accent-emerald);">Correct Answer: </strong>
                      <span style="color:var(--accent-emerald);font-weight:600;">${this.formatCorrectAnswerLabel(q)}</span>
                    </div>
                  ` : ''}
                </div>

                ${q.explanation ? `
                  <div class="review-explanation">
                    <strong>💡 Solution Explanation:</strong>
                    <p style="margin-top:0.25rem;">${this.escapeHtml(q.explanation)}</p>
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
      return '<em style="color:var(--text-muted);">(No Answer Provided)</em>';
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
    nameInput.value = localStorage.getItem('quizcraft_username') || 'Student Developer';

    const renderCert = () => {
      CertificateGenerator.render(canvas, {
        studentName: nameInput.value.trim() || 'Distinguished Developer',
        quizTitle: attempt.quizTitle,
        scorePercent: attempt.scorePercent,
        grade: attempt.grade,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        certId: 'QC-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      });
    };

    renderCert();

    nameInput.oninput = () => {
      localStorage.setItem('quizcraft_username', nameInput.value.trim());
      renderCert();
    };

    document.getElementById('btn-cert-download').onclick = () => {
      CertificateGenerator.downloadPNG(canvas, `${attempt.quizTitle.replace(/\s+/g, '_')}_Certificate.png`);
      this.showToast('Certificate downloaded!', 'success');
    };
  }

  openShareModal(quiz) {
    const modal = document.getElementById('modal-share');
    if (!modal) return;

    modal.classList.add('active');
    const url = QuizShareEngine.encodeToURL(quiz);
    const input = document.getElementById('share-url-input');
    input.value = url;

    document.getElementById('btn-copy-share-url').onclick = () => {
      navigator.clipboard.writeText(url);
      this.showToast('Shareable link copied to clipboard!', 'success');
    };
  }

  openLightbox(src) {
    let box = document.getElementById('lightbox-overlay');
    if (!box) {
      box = document.createElement('div');
      box.id = 'lightbox-overlay';
      box.className = 'lightbox-modal';
      box.innerHTML = `<img class="lightbox-img" src="" alt="Full view">`;
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
          <span>Name: __________________________</span>
          <span>Date: ________________</span>
          <span>Score: ______ / ${quiz.questions.length}</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          ${quiz.questions.map((q, idx) => `
            <div style="break-inside:avoid;page-break-inside:avoid;">
              <div style="font-weight:bold;margin-bottom:0.5rem;">
                ${idx + 1}. ${this.escapeHtml(q.title)} (${q.points || 10} pts)
              </div>
              ${q.codeSnippet ? `
                <pre style="background:#eee;padding:0.75rem;border-radius:4px;font-family:monospace;margin-bottom:0.5rem;"><code>${this.escapeHtml(q.codeSnippet)}</code></pre>
              ` : ''}
              ${q.type === 'blank' ? `
                <div style="margin-top:0.5rem;border-bottom:1px solid #333;width:300px;height:24px;"></div>
              ` : `
                <div style="display:flex;flex-direction:column;gap:0.3rem;margin-left:1rem;">
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
    dlAnchor.setAttribute('download', `QuizCraft_Export_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchor.click();
    this.showToast('Quizzes exported to JSON!', 'success');
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
        this.showToast(`Imported ${list.length} quiz(zes) successfully!`, 'success');
        this.renderDashboard();
      } catch (err) {
        console.error(err);
        this.showToast('Failed to parse JSON file', 'error');
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
    // Theme Toggle
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Nav Tabs Switching
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        if (view === 'studio') {
          this.openStudioNew();
        } else {
          this.switchView(view);
        }
      });
    });

    // Brand Logo Click -> Go Dashboard
    document.getElementById('brand-logo-btn')?.addEventListener('click', () => {
      this.switchView('dashboard');
    });

    // Create New Quiz Button in Header
    document.getElementById('btn-nav-create')?.addEventListener('click', () => {
      this.openStudioNew();
    });

    // Export & Import JSON in Header
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      this.exportAllQuizzesJSON();
    });

    document.getElementById('btn-import-json-trigger')?.addEventListener('click', () => {
      document.getElementById('file-import-json')?.click();
    });

    document.getElementById('file-import-json')?.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.importQuizzesJSON(e.target.files[0]);
        e.target.value = '';
      }
    });

    // Search & Filter in Dashboard
    const searchInput = document.getElementById('dashboard-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.quiz-card').forEach(card => {
          const title = card.querySelector('.quiz-card-title')?.textContent.toLowerCase() || '';
          const desc = card.querySelector('.quiz-card-desc')?.textContent.toLowerCase() || '';
          card.style.display = (title.includes(query) || desc.includes(query)) ? 'flex' : 'none';
        });
      });
    }

    // Modal Close buttons
    document.querySelectorAll('.btn-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    // Close modal on overlay background click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
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

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
