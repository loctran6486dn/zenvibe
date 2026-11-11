/**
 * timer.js
 * Quản lý hẹn giờ ngủ (Sleep Timer) và đồng hồ tập trung Pomodoro
 * Sử dụng mốc thời gian thực Date.now() + timeupdate của background audio shield
 * để đảm bảo đếm ngược chính xác 100% cả khi màn hình iPhone bị khóa / tắt.
 */

class ZenTimer {
  constructor(engine) {
    this.engine = engine;
    this.timerId = null;
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.targetEndTime = 0;
    this.fadeOutTime = 0;
    this.isRunning = false;
    this.mode = 'sleep'; // 'sleep' hoặc 'pomodoro'
    this.hasTriggeredFadeOut = false;
    this.onTickCallbacks = [];
    this.onCompleteCallbacks = [];

    // Đồng bộ với timeupdate của bgShieldAudio để đồng hồ đếm chuẩn xác ngay cả khi iOS đóng băng setInterval
    if (typeof document !== 'undefined') {
      window.addEventListener('load', () => {
        const shield = document.getElementById('bgShieldAudio');
        if (shield) {
          shield.addEventListener('timeupdate', () => {
            if (this.isRunning) {
              this._checkTimestamp();
            }
          });
        }
      });
    }
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
    this.targetEndTime = Date.now() + this.totalSeconds * 1000;
    this.fadeOutTime = this.targetEndTime - 15000; // Bắt đầu giảm âm 15s trước khi hết
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
    this.targetEndTime = Date.now() + this.totalSeconds * 1000;
    this.fadeOutTime = this.targetEndTime;
    this.isRunning = true;
    this.hasTriggeredFadeOut = false;
    this._runLoop();
  }

  // Kiểm tra thời gian dựa trên mốc timestamp thực tế
  _checkTimestamp() {
    if (!this.isRunning) return;

    const now = Date.now();
    const msLeft = this.targetEndTime - now;
    this.remainingSeconds = Math.max(0, Math.ceil(msLeft / 1000));

    // Nếu là Sleep Timer và đã đến mốc 15s cuối: Kích hoạt hạ dần âm lượng
    if (this.mode === 'sleep' && now >= this.fadeOutTime && !this.hasTriggeredFadeOut) {
      this.hasTriggeredFadeOut = true;
      console.log('ZenTimer: Bắt đầu 15s fade-out êm dịu trước khi ngủ.');
      this.engine.fadeOutMaster(15, () => {
        console.log('ZenTimer: Đã hoàn tất tắt âm thanh.');
      });
    }

    if (now >= this.targetEndTime) {
      this._handleComplete();
    } else {
      this._notifyTick();
    }
  }

  _runLoop() {
    this._notifyTick();
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    this.timerId = setInterval(() => {
      this._checkTimestamp();
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
      if (!ctx) return;
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
      this.targetEndTime = Date.now() + this.remainingSeconds * 1000;
      this.fadeOutTime = this.targetEndTime - 15000;
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
    this.targetEndTime = 0;
    this.fadeOutTime = 0;
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
