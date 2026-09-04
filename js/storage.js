/**
 * QuizCraft Pro - IndexedDB & LocalStorage Storage Engine
 * Handles quizzes, past attempts, and heavy media assets (images, audio).
 */

const DB_NAME = 'QuizCraftDB';
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
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to LocalStorage');
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

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        resolve(null);
      };
    });
  }

  async ready() {
    return this.initPromise;
  }

  // --- Quizzes Operations ---

  async getAllQuizzes() {
    await this.ready();
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction(STORE_QUIZZES, 'readonly');
        const store = tx.objectStore(STORE_QUIZZES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } else {
      const data = localStorage.getItem('quizcraft_quizzes');
      return data ? JSON.parse(data) : [];
    }
  }

  async getQuizById(id) {
    await this.ready();
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction(STORE_QUIZZES, 'readonly');
        const store = tx.objectStore(STORE_QUIZZES);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } else {
      const quizzes = await this.getAllQuizzes();
      return quizzes.find(q => q.id === id) || null;
    }
  }

  async saveQuiz(quiz) {
    await this.ready();
    quiz.updatedAt = Date.now();
    if (!quiz.createdAt) quiz.createdAt = Date.now();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE_QUIZZES, 'readwrite');
        const store = tx.objectStore(STORE_QUIZZES);
        const req = store.put(quiz);
        req.onsuccess = () => resolve(quiz);
        req.onerror = (e) => reject(e.target.error);
      });
    } else {
      const quizzes = await this.getAllQuizzes();
      const idx = quizzes.findIndex(q => q.id === quiz.id);
      if (idx >= 0) {
        quizzes[idx] = quiz;
      } else {
        quizzes.push(quiz);
      }
      try {
        localStorage.setItem('quizcraft_quizzes', JSON.stringify(quizzes));
        return quiz;
      } catch (err) {
        console.error('LocalStorage quota exceeded:', err);
        throw err;
      }
    }
  }

  async deleteQuiz(id) {
    await this.ready();
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction(STORE_QUIZZES, 'readwrite');
        const store = tx.objectStore(STORE_QUIZZES);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } else {
      let quizzes = await this.getAllQuizzes();
      quizzes = quizzes.filter(q => q.id !== id);
      localStorage.setItem('quizcraft_quizzes', JSON.stringify(quizzes));
      return true;
    }
  }

  // --- History & Attempts Operations ---

  async saveAttempt(attempt) {
    await this.ready();
    attempt.id = attempt.id || 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    attempt.date = attempt.date || Date.now();

    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction(STORE_HISTORY, 'readwrite');
        const store = tx.objectStore(STORE_HISTORY);
        const req = store.put(attempt);
        req.onsuccess = () => resolve(attempt);
        req.onerror = () => resolve(attempt);
      });
    } else {
      const list = JSON.parse(localStorage.getItem('quizcraft_history') || '[]');
      list.unshift(attempt);
      if (list.length > 50) list.pop();
      localStorage.setItem('quizcraft_history', JSON.stringify(list));
      return attempt;
    }
  }

  async getAttempts(quizId = null) {
    await this.ready();
    if (this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction(STORE_HISTORY, 'readonly');
        const store = tx.objectStore(STORE_HISTORY);
        const req = store.getAll();
        req.onsuccess = () => {
          let list = req.result || [];
          if (quizId) list = list.filter(a => a.quizId === quizId);
          list.sort((a, b) => b.date - a.date);
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    } else {
      let list = JSON.parse(localStorage.getItem('quizcraft_history') || '[]');
      if (quizId) list = list.filter(a => a.quizId === quizId);
      list.sort((a, b) => b.date - a.date);
      return list;
    }
  }
}

export const storage = new StorageEngine();
