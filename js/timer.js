/**
 * timer.js
 * Quản lý hẹn giờ ngủ (Sleep Timer) và đồng hồ tập trung Pomodoro
 * Hỗ trợ hiệu ứng hạ âm lượng dần dần (15-second Smooth Fade-out)
 */

class ZenTimer {
  constructor(engine) {
    this.engine = engine;
    this.timerId = null;
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.isRunning = false;
    this.mode = 'sleep'; // 'sleep' hoặc 'pomodoro'
    this.hasTriggeredFadeOut = false;
    this.onTickCallbacks = [];
    this.onCompleteCallbacks = [];
  }

  // Đăng ký listener cập nhật giao diện mỗi giây
  onTick(cb) {
    this.onTickCallbacks.push(cb);
  }

  onComplete(cb) {
    this.onCompleteCallbacks.push(cb);
  }

  // Bắt đầu hẹn giờ ngủ (tính bằng phút)
  startSleepTimer(minutes) {
    this.stop();
    this.mode = 'sleep';
    this.totalSeconds = Math.round(minutes * 60);
    this.remainingSeconds = this.totalSeconds;
    this.isRunning = true;
    this.hasTriggeredFadeOut = false;
    this._runLoop();
  }

  // Bắt đầu chế độ Pomodoro
  startPomodoro(workMinutes = 25) {
    this.stop();
    this.mode = 'pomodoro';
    this.totalSeconds = Math.round(workMinutes * 60);
    this.remainingSeconds = this.totalSeconds;
    this.isRunning = true;
    this.hasTriggeredFadeOut = false;
    this._runLoop();
  }

  _runLoop() {
    this._notifyTick();

    this.timerId = setInterval(() => {
      if (!this.isRunning) return;

      this.remainingSeconds--;

      // Nếu còn dưới 15s và là Sleep Timer: Bắt đầu Fade-out dần âm thanh
      if (this.mode === 'sleep' && this.remainingSeconds <= 15 && !this.hasTriggeredFadeOut) {
        this.hasTriggeredFadeOut = true;
        this.engine.fadeOutMaster(15, () => {
          console.log('Fade out hoàn tất, âm thanh đã dừng êm dịu.');
        });
      }

      if (this.remainingSeconds <= 0) {
        this._handleComplete();
      } else {
        this._notifyTick();
      }
    }, 1000);
  }

  _handleComplete() {
    const finishedMode = this.mode;
    this.stop();

    if (finishedMode === 'pomodoro') {
      // Tiếng chuông nhẹ nhắc nhở hết phiên làm việc
      this._playChimeNotification();
    }

    this.onCompleteCallbacks.forEach(cb => {
      try { cb(finishedMode); } catch (e) {}
    });
  }

  _playChimeNotification() {
    try {
      this.engine.initContext();
      const ctx = this.engine.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    } catch (e) {}
  }

  // Tạm dừng / Tiếp tục
  togglePause() {
    if (!this.isRunning && this.remainingSeconds > 0) {
      this.isRunning = true;
      this._runLoop();
    } else {
      this.isRunning = false;
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    }
    this._notifyTick();
  }

  // Hủy hẹn giờ
  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.remainingSeconds = 0;
    this.hasTriggeredFadeOut = false;
    this._notifyTick();
  }

  _notifyTick() {
    const formatted = this.getFormattedTime();
    this.onTickCallbacks.forEach(cb => {
      try { cb({
        remaining: this.remainingSeconds,
        total: this.totalSeconds,
        formatted: formatted,
        isRunning: this.isRunning,
        mode: this.mode
      }); } catch (e) {}
    });
  }

  getFormattedTime() {
    if (this.remainingSeconds <= 0) return '00:00';
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

window.ZenTimer = ZenTimer;
