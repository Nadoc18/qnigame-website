/**
 * Qnigame Client SDK for PixiJS & HTML5 External Games
 * Enables token verification, live points sync, and JSON game progress saving.
 */

(function (global) {
  'use strict';

  class QnigameSDK {
    constructor() {
      this.token = this.extractQueryParam('token');
      this.gameId = this.extractQueryParam('gameId') || 'pixijs-game';
      this.userId = this.extractQueryParam('userId') || null;
      this.verified = false;
      this.userData = null;
      this.progressData = null;
      this.listeners = {};

      this.initPostMessageListener();
    }

    extractQueryParam(name) {
      if (typeof window === 'undefined') return null;
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }

    initPostMessageListener() {
      if (typeof window === 'undefined') return;

      window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        switch (data.type) {
          case 'QNIGAME_TOKEN_VERIFIED':
            if (data.success) {
              this.verified = true;
              this.userData = data.user || null;
              this.progressData = data.gameProgress || null;
              this.emit('authConfirmed', { user: this.userData, progress: this.progressData });
            } else {
              this.emit('authFailed', { error: data.error || 'Token verification failed' });
            }
            break;

          case 'QNIGAME_SCORE_UPDATED':
            this.emit('scoreUpdated', data);
            break;

          case 'QNIGAME_PROGRESS_SAVED':
            this.emit('progressSaved', data);
            break;

          case 'QNIGAME_PROGRESS_LOADED':
            this.emit('progressLoaded', data);
            break;
        }
      });
    }

    /**
     * Request token verification from host site or API
     */
    verifyToken() {
      return new Promise((resolve, reject) => {
        if (!this.token) {
          const err = 'No session token found in query params (?token=...)';
          console.warn('[QnigameSDK]', err);
          return reject(err);
        }

        // 1. Send postMessage to parent iframe window
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'QNIGAME_VERIFY_TOKEN',
            token: this.token,
            gameId: this.gameId
          }, '*');
        }

        // 2. Also attempt REST API verification as fallback
        fetch('/api/game/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: this.token, gameId: this.gameId })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.valid) {
            this.verified = true;
            this.userData = { id: data.userId, username: data.username };
            this.emit('authConfirmed', { user: this.userData });
            resolve(data);
          } else {
            reject(data.error || 'Token invalid');
          }
        })
        .catch(err => {
          // If REST endpoint offline, postMessage verification will resolve via event
          console.log('[QnigameSDK] PostMessage auth pending...');
        });

        this.once('authConfirmed', (info) => resolve(info));
        this.once('authFailed', (err) => reject(err));
      });
    }

    /**
     * Report game score & earned points to Qnigame user account
     */
    updateScore(score, pointsEarned) {
      const payload = {
        type: 'QNIGAME_UPDATE_SCORE',
        token: this.token,
        gameId: this.gameId,
        score: score,
        pointsEarned: pointsEarned || Math.max(10, Math.floor(score / 5))
      };

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }

      fetch('/api/game/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.warn('[QnigameSDK] API update score:', e));
    }

    /**
     * Save custom JSON game progress state to user account for specific gameId
     */
    saveProgress(progressObj, overrideGameId) {
      const targetGameId = overrideGameId || this.gameId;
      const payload = {
        type: 'QNIGAME_SAVE_PROGRESS',
        token: this.token,
        gameId: targetGameId,
        progressData: progressObj,
        savedAt: new Date().toISOString()
      };

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }

      fetch('/api/game/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(e => console.warn('[QnigameSDK] API save progress:', e));
    }

    /**
     * Load custom JSON game progress state from user account for specific gameId
     */
    loadProgress(overrideGameId) {
      const targetGameId = overrideGameId || this.gameId;
      return new Promise((resolve) => {
        const payload = {
          type: 'QNIGAME_LOAD_PROGRESS',
          token: this.token,
          gameId: targetGameId
        };

        if (window.parent && window.parent !== window) {
          window.parent.postMessage(payload, '*');
        }

        const handler = (data) => {
          if (data && data.gameId === targetGameId) {
            resolve(data.gameProgress || null);
          }
        };

        this.once('progressLoaded', handler);

        // Fallback REST fetch
        fetch(`/api/game/load-progress?token=${encodeURIComponent(this.token || '')}&gameId=${encodeURIComponent(targetGameId)}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              resolve(data.gameProgress || null);
            }
          })
          .catch(() => {});
      });
    }

    on(event, fn) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(fn);
    }

    once(event, fn) {
      const wrapper = (...args) => {
        fn(...args);
        this.off(event, wrapper);
      };
      this.on(event, wrapper);
    }

    off(event, fn) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(l => l !== fn);
    }

    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(fn => fn(data));
      }
    }
  }

  global.QnigameSDK = new QnigameSDK();
})(typeof window !== 'undefined' ? window : this);
