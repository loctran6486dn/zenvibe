/**
 * audio-engine.js
 * Bộ máy xử lý âm thanh đa luồng Web Audio API cho ZenVibe
 * Hỗ trợ tạo âm thanh theo thời gian thực (Procedural Audio Synthesis)
 * độc lập volume từng kênh, master volume, fade-out mượt mà, zero-lag offline.
 */

class ZenAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.channels = new Map(); // id -> { isPlaying, volume, gainNode, stopFn, soundItem }
    this.audioBuffers = new Map(); // id -> AudioBuffer (decoded Web Audio API in RAM)
    this.bufferSources = new Map(); // id -> AudioBufferSourceNode
    this.loadingPromises = new Map(); // id -> Promise<AudioBuffer>
    this.audioElements = new Map(); // id -> HTMLAudioElement (secondary fallback)
    this.bgKeeper = null; // iOS background lock screen audio keeper
    this.noiseBuffers = {}; // cache noise buffers
  }

  // Khởi tạo AudioContext sau tương tác của người dùng
  initContext() {
    // 1. Khai báo session là Playback (Media Player) để iOS không ngắt khi khóa màn hình hay bật gạt rung
    if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
      try {
        navigator.audioSession.type = 'playback';
      } catch (e) {}
    }

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      // Master Gain Node
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      // Chuẩn bị buffer nhiễu nền
      this._generateNoiseBuffers();

      // Tự động tải trước toàn bộ âm thanh ngầm vào RAM
      this.preloadAllSamples();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Khởi động background audio keeper
    this._startBgKeeper();
  }

  // Khởi động silent audio keeper để iOS duy trì playback khi khóa màn hình
  _startBgKeeper() {
    if (typeof document === 'undefined') return;
    if (!this.bgKeeper) {
      this.bgKeeper = document.createElement('audio');
      this.bgKeeper.setAttribute('x-webkit-airplay', 'deny');
      this.bgKeeper.setAttribute('playsinline', '');
      this.bgKeeper.setAttribute('webkit-playsinline', '');
      this.bgKeeper.preload = 'auto';
      this.bgKeeper.loop = true;
      this.bgKeeper.style.display = 'none';
      // 180-byte ultra-lightweight silent WAV data URI
      this.bgKeeper.src = 'data:audio/wav;base64,UklGRnwAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YVgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      document.body.appendChild(this.bgKeeper);
    }

    if (this.bgKeeper.paused) {
      this.bgKeeper.play().catch(e => {
        console.warn('bgKeeper play error:', e);
      });
    }
  }

  // Tạm dừng silent audio keeper khi không còn âm thanh nào phát
  _stopBgKeeper() {
    if (this.bgKeeper && !this.bgKeeper.paused) {
      try {
        this.bgKeeper.pause();
      } catch (e) {}
    }
  }

  // Tải và giải mã file âm thanh trực tiếp vào Web Audio Buffer
  async loadAudioBuffer(soundId, url, fallbackUrl = null) {
    if (this.audioBuffers.has(soundId)) {
      return this.audioBuffers.get(soundId);
    }
    if (this.loadingPromises.has(soundId)) {
      return this.loadingPromises.get(soundId);
    }

    const loadPromise = (async () => {
      try {
        let resp = await fetch(url);
        if (!resp.ok && fallbackUrl) {
          resp = await fetch(fallbackUrl);
        }
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();

        this.initContext();

        const audioBuffer = await new Promise((resolve, reject) => {
          this.audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
        });

        this.audioBuffers.set(soundId, audioBuffer);
        return audioBuffer;
      } catch (err) {
        console.warn(`ZenVibe: Không thể giải mã buffer cho ${soundId}:`, err);
        return null;
      } finally {
        this.loadingPromises.delete(soundId);
      }
    })();

    this.loadingPromises.set(soundId, loadPromise);
    return loadPromise;
  }

  // Tải trước toàn bộ âm thanh ngầm vào bộ nhớ máy để click là phát tức thì
  preloadAllSamples() {
    if (typeof SOUND_ITEMS === 'undefined') return;
    SOUND_ITEMS.forEach(sound => {
      if (sound.type === 'audio_sample' && sound.audioSrc && !this.audioBuffers.has(sound.id)) {
        this.loadAudioBuffer(sound.id, sound.audioSrc, sound.audioSrcFallback);
      }
    });
  }

  // Tạo các bộ đệm nhiễu chuẩn (White, Pink, Brown)
  _generateNoiseBuffers() {
    if (!this.audioCtx) return;
    const sampleRate = this.audioCtx.sampleRate;
    const bufferSize = sampleRate * 5; // 5s loop buffer

    // 1. White Noise
    const whiteBuffer = this.audioCtx.createBuffer(2, bufferSize, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const output = whiteBuffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    }
    this.noiseBuffers.white = whiteBuffer;

    // 2. Pink Noise (Paul Kellet's filtered method)
    const pinkBuffer = this.audioCtx.createBuffer(2, bufferSize, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const output = pinkBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    this.noiseBuffers.pink = pinkBuffer;

    // 3. Brown Noise (Brownian motion / integrated white noise)
    const brownBuffer = this.audioCtx.createBuffer(2, bufferSize, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const output = brownBuffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        output[i] = lastOut * 3.5;
      }
    }
    this.noiseBuffers.brown = brownBuffer;
  }

  // Lấy hoặc tạo channel cho một soundId
  getChannel(soundId, defaultVol = 50) {
    if (!this.channels.has(soundId)) {
      this.channels.set(soundId, {
        isPlaying: false,
        volume: defaultVol,
        gainNode: null,
        stopFn: null,
        soundItem: SOUND_ITEMS.find(s => s.id === soundId)
      });
    }
    return this.channels.get(soundId);
  }

  // Bật/tắt một âm thanh
  toggleSound(soundId, targetState = null) {
    this.initContext();
    const channel = this.getChannel(soundId);
    const shouldPlay = targetState !== null ? targetState : !channel.isPlaying;

    if (shouldPlay && !channel.isPlaying) {
      this.startSound(soundId);
    } else if (!shouldPlay && channel.isPlaying) {
      this.stopSound(soundId);
    }
    return channel.isPlaying;
  }

  // Bắt đầu phát âm thanh
  startSound(soundId) {
    this.initContext();
    this._startBgKeeper();
    const channel = this.getChannel(soundId);
    if (channel.isPlaying) return;

    channel.isPlaying = true;

    // Track Gain Node (độc lập volume từng kênh - hoạt động 100% trên iPhone/iPad/Android)
    const trackGain = this.audioCtx.createGain();
    const targetGain = channel.volume / 100;
    trackGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
    trackGain.gain.exponentialRampToValueAtTime(Math.max(0.001, targetGain), this.audioCtx.currentTime + 0.2);
    trackGain.connect(this.masterGain);
    channel.gainNode = trackGain;

    const soundItem = channel.soundItem;

    // 1. Nếu là âm thanh sử dụng bản thu âm tự nhiên (audio_sample)
    if (soundItem && soundItem.type === 'audio_sample' && soundItem.audioSrc) {
      const playWithBuffer = (buffer) => {
        if (!channel.isPlaying) return; // Đã bị tắt trong lúc tải

        if (this.bufferSources.has(soundId)) {
          try { this.bufferSources.get(soundId).stop(); } catch (e) {}
        }

        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true; // HARDWARE SAMPLE-ACCURATE GAPLESS LOOP 100% VĨNH VIỄN
        source.connect(trackGain);
        source.start(0);
        this.bufferSources.set(soundId, source);

        channel.stopFn = () => {
          try {
            source.stop(this.audioCtx.currentTime + 0.2);
          } catch (e) {}
          this.bufferSources.delete(soundId);
        };
      };

      if (this.audioBuffers.has(soundId)) {
        playWithBuffer(this.audioBuffers.get(soundId));
      } else {
        this.loadAudioBuffer(soundId, soundItem.audioSrc, soundItem.audioSrcFallback).then(buffer => {
          if (buffer) {
            playWithBuffer(buffer);
          } else {
            this._startAudioElementFallback(soundId, channel, trackGain);
          }
        });
      }
      return;
    }

    // 2. Ngược lại, tạo theo Web Audio API tổng hợp
    const synthType = channel.soundItem ? channel.soundItem.synthType : soundId;
    channel.stopFn = this._createSynthesizer(synthType, trackGain);
  }

  // Phương án dự phòng qua HTMLAudioElement nếu decode buffer thất bại
  _startAudioElementFallback(soundId, channel, trackGain) {
    const soundItem = channel.soundItem;
    if (!soundItem) return;

    let audio = this.audioElements.get(soundId);
    if (!audio) {
      audio = document.createElement('audio');
      audio.style.display = 'none';
      audio.preload = 'auto';
      audio.loop = true;
      audio.playsInline = true;
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audio.src = soundItem.audioSrc;
      document.body.appendChild(audio);

      // Bắt buộc lặp lại bằng code phòng trường hợp thuộc tính loop bị lỗi trên iOS Safari
      audio.addEventListener('ended', () => {
        if (channel.isPlaying) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      });
      audio.addEventListener('timeupdate', () => {
        if (channel.isPlaying && audio.duration && audio.currentTime >= audio.duration - 0.25) {
          audio.currentTime = 0;
        }
      });
      this.audioElements.set(soundId, audio);
    }

    const eff = (channel.volume / 100) * (this.isMuted ? 0 : this.masterVolume);
    try { audio.volume = Math.max(0, Math.min(1, eff)); } catch (e) {}

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(e => {
        console.warn('Fallback play exception:', e);
        const synthType = soundItem.synthType || soundId;
        channel.stopFn = this._createSynthesizer(synthType, trackGain);
      });
    }
  }

  // Dừng phát một âm thanh
  stopSound(soundId, fadeDuration = 0.3) {
    const channel = this.channels.get(soundId);
    if (!channel || !channel.isPlaying) return;

    channel.isPlaying = false;

    // Tạm dừng background keeper nếu không còn track nào phát
    if (this.getActiveCount() === 0) {
      this._stopBgKeeper();
    }

    // Dừng AudioBufferSourceNode
    if (this.bufferSources.has(soundId)) {
      const source = this.bufferSources.get(soundId);
      try {
        source.stop(this.audioCtx.currentTime + fadeDuration);
      } catch (e) {}
      this.bufferSources.delete(soundId);
    }

    // Dừng Audio Element fallback nếu có
    if (this.audioElements.has(soundId)) {
      const audio = this.audioElements.get(soundId);
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {}
      }
    }

    // Giảm dần Gain và dọn dẹp
    if (channel.gainNode && this.audioCtx) {
      const currentGain = channel.gainNode.gain.value;
      channel.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
      channel.gainNode.gain.setValueAtTime(currentGain, this.audioCtx.currentTime);
      channel.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + fadeDuration);

      setTimeout(() => {
        if (channel.stopFn) {
          try { channel.stopFn(); } catch (e) {}
          channel.stopFn = null;
        }
        if (channel.gainNode) {
          try { channel.gainNode.disconnect(); } catch (e) {}
          channel.gainNode = null;
        }
      }, fadeDuration * 1000 + 50);
    } else {
      if (channel.stopFn) {
        try { channel.stopFn(); } catch (e) {}
        channel.stopFn = null;
      }
    }
  }

  // Cập nhật âm lượng riêng cho từng track (hoạt động 100% trên iPhone/iPad/Android)
  setChannelVolume(soundId, volume) {
    const channel = this.getChannel(soundId);
    channel.volume = Math.max(0, Math.min(100, volume));

    if (channel.gainNode && this.audioCtx) {
      const targetGain = channel.volume / 100;
      channel.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
      channel.gainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
    }

    // Đồng bộ sang fallback audio element nếu có
    if (this.audioElements.has(soundId)) {
      const audio = this.audioElements.get(soundId);
      if (audio && channel.isPlaying) {
        const eff = (channel.volume / 100) * (this.isMuted ? 0 : this.masterVolume);
        try { audio.volume = Math.max(0, Math.min(1, eff)); } catch (e) {}
      }
    }
  }

  // Điều chỉnh Master Volume
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.audioCtx && !this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.audioCtx.currentTime, 0.05);
    }

    // Đồng bộ sang các fallback audio elements
    for (const [id, audio] of this.audioElements.entries()) {
      const ch = this.channels.get(id);
      if (ch && ch.isPlaying) {
        const eff = (ch.volume / 100) * (this.isMuted ? 0 : this.masterVolume);
        try { audio.volume = Math.max(0, Math.min(1, eff)); } catch (e) {}
      }
    }
  }

  // Tắt/bật toàn bộ tiếng (Mute/Unmute)
  toggleMute() {
    this.initContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.audioCtx) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.masterGain.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.05);
    }

    // Đồng bộ sang các fallback audio elements
    for (const [id, audio] of this.audioElements.entries()) {
      const ch = this.channels.get(id);
      if (ch && ch.isPlaying) {
        const eff = (ch.volume / 100) * (this.isMuted ? 0 : this.masterVolume);
        try { audio.volume = Math.max(0, Math.min(1, eff)); } catch (e) {}
      }
    }
    return this.isMuted;
  }

  // Tắt tất cả các âm thanh đang phát
  stopAll(fadeDuration = 0.3) {
    this._stopBgKeeper();
    for (const [id, channel] of this.channels.entries()) {
      if (channel.isPlaying) {
        this.stopSound(id, fadeDuration);
      }
    }
    for (const [id, audio] of this.audioElements.entries()) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
    }
  }

  // Số lượng track đang phát
  getActiveCount() {
    let count = 0;
    for (const channel of this.channels.values()) {
      if (channel.isPlaying) count++;
    }
    return count;
  }

  // Fade out toàn bộ âm thanh (cho sleep timer)
  fadeOutMaster(durationSeconds, onComplete) {
    // Fade out các audio elements nếu có
    for (const [id, audio] of this.audioElements.entries()) {
      const ch = this.channels.get(id);
      if (ch && ch.isPlaying) {
        const startVol = audio.volume;
        const steps = 15;
        const stepTime = (durationSeconds * 1000) / steps;
        let curStep = 0;
        const fadeInt = setInterval(() => {
          curStep++;
          try { audio.volume = Math.max(0, startVol * (1 - curStep / steps)); } catch (e) {}
          if (curStep >= steps) {
            clearInterval(fadeInt);
          }
        }, stepTime);
      }
    }

    if (!this.masterGain || !this.audioCtx) {
      if (onComplete) onComplete();
      return;
    }

    const startVal = this.masterGain.gain.value;
    this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
    this.masterGain.gain.setValueAtTime(startVal, this.audioCtx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + durationSeconds);

    setTimeout(() => {
      this.stopAll(0.1);
      // Khôi phục lại master gain sau khi dừng
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.audioCtx.currentTime);
      if (onComplete) onComplete();
    }, durationSeconds * 1000 + 100);
  }

  // ==========================================
  // PROCEDURAL AUDIO SYNTHESIZERS (Chất lượng cao)
  // ==========================================

  _createNoiseSource(buffer) {
    const src = this.audioCtx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  _createSynthesizer(type, outNode) {
    const ctx = this.audioCtx;
    const cleanups = [];

    switch (type) {
      // 1. Tiếng mưa rào êm dịu (Gentle Rain)
      case 'rain': {
        const pinkSrc = this._createNoiseSource(this.noiseBuffers.pink);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, ctx.currentTime);

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(200, ctx.currentTime);

        pinkSrc.connect(filter);
        filter.connect(highpass);
        highpass.connect(outNode);
        pinkSrc.start();
        cleanups.push(() => { pinkSrc.stop(); pinkSrc.disconnect(); });

        // Tạo thêm hạt mưa rơi ngẫu nhiên (droplet pops)
        const dropInterval = setInterval(() => {
          if (!this.audioCtx || ctx.state === 'closed') return;
          const osc = ctx.createOscillator();
          const dropGain = ctx.createGain();
          const freq = 1200 + Math.random() * 1800;
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + 0.04);

          dropGain.gain.setValueAtTime(0.015 + Math.random() * 0.02, ctx.currentTime);
          dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

          osc.connect(dropGain);
          dropGain.connect(outNode);
          osc.start();
          osc.stop(ctx.currentTime + 0.05);
        }, 80);
        cleanups.push(() => clearInterval(dropInterval));
        break;
      }

      // 2. Mưa trên mái hiên / Mái tôn (Rain on Roof)
      case 'rain_roof': {
        const brownSrc = this._createNoiseSource(this.noiseBuffers.brown);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        const lowGain = ctx.createGain();
        lowGain.gain.setValueAtTime(0.7, ctx.currentTime);

        brownSrc.connect(filter);
        filter.connect(lowGain);
        lowGain.connect(outNode);
        brownSrc.start();
        cleanups.push(() => { brownSrc.stop(); brownSrc.disconnect(); });

        // Tiếng lộp độp đặc trưng gõ mái hiên
        const roofInterval = setInterval(() => {
          if (!this.audioCtx || ctx.state === 'closed') return;
          const numClicks = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < numClicks; i++) {
            const clickOsc = ctx.createOscillator();
            const clickGain = ctx.createGain();
            const clickFilter = ctx.createBiquadFilter();

            clickFilter.type = 'bandpass';
            clickFilter.frequency.setValueAtTime(350 + Math.random() * 600, ctx.currentTime);
            clickFilter.Q.setValueAtTime(4, ctx.currentTime);

            clickOsc.type = 'triangle';
            clickOsc.frequency.setValueAtTime(150 + Math.random() * 100, ctx.currentTime);

            const vol = 0.04 + Math.random() * 0.05;
            clickGain.gain.setValueAtTime(vol, ctx.currentTime);
            clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);

            clickOsc.connect(clickFilter);
            clickFilter.connect(clickGain);
            clickGain.connect(outNode);

            clickOsc.start(ctx.currentTime + i * 0.02);
            clickOsc.stop(ctx.currentTime + i * 0.02 + 0.08);
          }
        }, 110);
        cleanups.push(() => clearInterval(roofInterval));
        break;
      }

      // 3. Suối chảy róc rách (Babbling Stream - Mô hình bọt nước Minnaert vật lý)
      case 'stream':
      case 'stream_synth': {
        // Lớp 1: Tiếng nước chảy nền ấm áp (Warm tumbling water bed)
        const pinkSrc = this._createNoiseSource(this.noiseBuffers.pink);
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(550, ctx.currentTime);

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(120, ctx.currentTime);

        const waterBedGain = ctx.createGain();
        waterBedGain.gain.setValueAtTime(0.4, ctx.currentTime);

        // LFO dập dềnh nhẹ nhàng theo dòng chảy tự nhiên (0.2 Hz)
        const flowLfo = ctx.createOscillator();
        flowLfo.frequency.setValueAtTime(0.2, ctx.currentTime);
        const flowGain = ctx.createGain();
        flowGain.gain.setValueAtTime(0.08, ctx.currentTime);
        flowLfo.connect(flowGain);
        flowGain.connect(waterBedGain.gain);

        pinkSrc.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(waterBedGain);
        waterBedGain.connect(outNode);

        pinkSrc.start();
        flowLfo.start();
        cleanups.push(() => {
          pinkSrc.stop();
          flowLfo.stop();
          pinkSrc.disconnect();
          flowLfo.disconnect();
        });

        // Lớp 2: Tiếng bọt nước va đập róc rách ngẫu nhiên (Minnaert Bubble Plops)
        let isAlive = true;
        const triggerBubble = () => {
          if (!isAlive || !this.audioCtx || ctx.state === 'closed') return;
          const numBubbles = Math.floor(Math.random() * 3) + 1;

          for (let i = 0; i < numBubbles; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t0 = ctx.currentTime + i * 0.02;
            const dur = 0.02 + Math.random() * 0.035;

            // Tần số dao động của bọt nước suối (600Hz - 1600Hz)
            const baseFreq = 650 + Math.random() * 950;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, t0);
            // Hiện tượng bọt nước nén / biến thiên pitch khi vỡ
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, t0 + dur * 0.8);

            gain.gain.setValueAtTime(0.001, t0);
            gain.gain.linearRampToValueAtTime(0.025 + Math.random() * 0.03, t0 + dur * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

            osc.connect(gain);
            gain.connect(outNode);

            osc.start(t0);
            osc.stop(t0 + dur + 0.01);
          }

          const nextInterval = 35 + Math.random() * 70;
          timeoutId = setTimeout(triggerBubble, nextInterval);
        };

        let timeoutId = setTimeout(triggerBubble, 40);
        cleanups.push(() => {
          isAlive = false;
          clearTimeout(timeoutId);
        });
        break;
      }

      // 4. Sóng biển vỗ bờ (Ocean Waves)
      case 'ocean': {
        const brownSrc = this._createNoiseSource(this.noiseBuffers.brown);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        // LFO chu kỳ sóng 9 giây (dâng trào rồi rút êm dịu)
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(1 / 9.5, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(350, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const waveGain = ctx.createGain();
        const lfoAmp = ctx.createOscillator();
        lfoAmp.frequency.setValueAtTime(1 / 9.5, ctx.currentTime);
        const lfoAmpGain = ctx.createGain();
        lfoAmpGain.gain.setValueAtTime(0.4, ctx.currentTime);
        lfoAmp.connect(lfoAmpGain);
        waveGain.gain.setValueAtTime(0.5, ctx.currentTime);
        lfoAmpGain.connect(waveGain.gain);

        brownSrc.connect(filter);
        filter.connect(waveGain);
        waveGain.connect(outNode);

        brownSrc.start();
        lfo.start();
        lfoAmp.start();

        cleanups.push(() => {
          brownSrc.stop(); lfo.stop(); lfoAmp.stop();
          brownSrc.disconnect(); lfo.disconnect(); lfoAmp.disconnect();
        });
        break;
      }

      // 5. Gió thổi lá xào xạc (Wind in Leaves) - Yêu cầu trọng tâm của User
      case 'wind_leaves': {
        // Luồng 1: Tiếng gió gầm gào êm dịu
        const pinkSrc = this._createNoiseSource(this.noiseBuffers.pink);
        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(600, ctx.currentTime);
        windFilter.Q.setValueAtTime(1.8, ctx.currentTime);

        const windLfo = ctx.createOscillator();
        windLfo.frequency.setValueAtTime(0.2, ctx.currentTime);
        const windLfoGain = ctx.createGain();
        windLfoGain.gain.setValueAtTime(300, ctx.currentTime);
        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);

        pinkSrc.connect(windFilter);
        windFilter.connect(outNode);
        pinkSrc.start();
        windLfo.start();
        cleanups.push(() => { pinkSrc.stop(); windLfo.stop(); });

        // Luồng 2: Tiếng lá khô bay cọ xát xào xạc (Rustling dry leaves)
        const whiteSrc = this._createNoiseSource(this.noiseBuffers.white);
        const leafFilter = ctx.createBiquadFilter();
        leafFilter.type = 'highpass';
        leafFilter.frequency.setValueAtTime(3200, ctx.currentTime);

        const leafGain = ctx.createGain();
        leafGain.gain.setValueAtTime(0.12, ctx.currentTime);

        // LFO tạo từng đợt lá xào xạc theo luồng gió
        const rustleLfo = ctx.createOscillator();
        rustleLfo.frequency.setValueAtTime(0.35, ctx.currentTime);
        const rustleAmp = ctx.createGain();
        rustleAmp.gain.setValueAtTime(0.08, ctx.currentTime);
        rustleLfo.connect(rustleAmp);
        rustleAmp.connect(leafGain.gain);

        whiteSrc.connect(leafFilter);
        leafFilter.connect(leafGain);
        leafGain.connect(outNode);
        whiteSrc.start();
        rustleLfo.start();

        cleanups.push(() => { whiteSrc.stop(); rustleLfo.stop(); });
        break;
      }

      // 6. Cỏ đồng nội lắc lư (Swaying Grass) - Yêu cầu trọng tâm của User
      case 'swaying_grass': {
        // Tiếng cỏ đu đưa xào xạc mượt mà, âm vực dịu dàng hơn lá khô
        const pinkSrc = this._createNoiseSource(this.noiseBuffers.pink);
        const grassFilter = ctx.createBiquadFilter();
        grassFilter.type = 'bandpass';
        grassFilter.frequency.setValueAtTime(1800, ctx.currentTime);
        grassFilter.Q.setValueAtTime(2.2, ctx.currentTime);

        const grassGain = ctx.createGain();
        grassGain.gain.setValueAtTime(0.2, ctx.currentTime);

        // Nhịp lắc lư của đồng cỏ theo nhịp gió 0.16 Hz (khoảng 6 giây một nhịp lay)
        const swayLfo = ctx.createOscillator();
        swayLfo.frequency.setValueAtTime(0.16, ctx.currentTime);
        const swayGain = ctx.createGain();
        swayGain.gain.setValueAtTime(0.18, ctx.currentTime);
        swayLfo.connect(swayGain);
        swayGain.connect(grassGain.gain);

        // Dao động nhẹ tần số tạo tiếng cỏ cọ vào nhau
        const swayFreqMod = ctx.createOscillator();
        swayFreqMod.frequency.setValueAtTime(0.32, ctx.currentTime);
        const freqGain = ctx.createGain();
        freqGain.gain.setValueAtTime(450, ctx.currentTime);
        swayFreqMod.connect(freqGain);
        freqGain.connect(grassFilter.frequency);

        pinkSrc.connect(grassFilter);
        grassFilter.connect(grassGain);
        grassGain.connect(outNode);

        pinkSrc.start();
        swayLfo.start();
        swayFreqMod.start();

        cleanups.push(() => {
          pinkSrc.stop(); swayLfo.stop(); swayFreqMod.stop();
        });
        break;
      }

      // 7. Chim rừng hót líu lo (Forest Birds) - Yêu cầu trọng tâm của User
      case 'birds': {
        // Bộ sinh tiếng chim hót ngẫu nhiên, phong phú nhiều loài hót
        let isAlive = true;
        
        const triggerBirdSong = () => {
          if (!isAlive || !this.audioCtx || ctx.state === 'closed') return;

          const numNotes = Math.floor(Math.random() * 4) + 2;
          const baseFreq = 2200 + Math.random() * 1600;
          let delay = 0;

          for (let i = 0; i < numNotes; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';

            const startT = ctx.currentTime + delay;
            const dur = 0.08 + Math.random() * 0.12;

            const noteFreq = baseFreq + (Math.random() * 600 - 300);
            osc.frequency.setValueAtTime(noteFreq, startT);
            // Luyến giọng chim (frequency sweep)
            if (Math.random() > 0.5) {
              osc.frequency.exponentialRampToValueAtTime(noteFreq * 1.3, startT + dur * 0.7);
            } else {
              osc.frequency.exponentialRampToValueAtTime(noteFreq * 0.75, startT + dur * 0.8);
            }

            gain.gain.setValueAtTime(0.001, startT);
            gain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.05, startT + dur * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.0001, startT + dur);

            osc.connect(gain);
            gain.connect(outNode);

            osc.start(startT);
            osc.stop(startT + dur + 0.02);

            delay += dur + 0.04 + Math.random() * 0.06;
          }

          // Khoảng cách giữa các lượt hót (1.8s - 4.5s)
          const nextInterval = 1800 + Math.random() * 2800;
          timeoutId = setTimeout(triggerBirdSong, nextInterval);
        };

        let timeoutId = setTimeout(triggerBirdSong, 500);

        cleanups.push(() => {
          isAlive = false;
          clearTimeout(timeoutId);
        });
        break;
      }

      // 8. Dế đêm rả rích (Night Crickets)
      case 'crickets': {
        let isAlive = true;
        const cricketLoop = () => {
          if (!isAlive || !this.audioCtx || ctx.state === 'closed') return;
          const bursts = 3;
          let timeOffset = 0;

          for (let b = 0; b < bursts; b++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(4600 + Math.random() * 200, ctx.currentTime + timeOffset);

            // AM modulation cho tiếng dế rung
            const am = ctx.createOscillator();
            am.frequency.setValueAtTime(48, ctx.currentTime);
            const amGain = ctx.createGain();
            amGain.gain.setValueAtTime(0.5, ctx.currentTime);
            am.connect(amGain);

            gain.gain.setValueAtTime(0.035, ctx.currentTime + timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + timeOffset + 0.12);

            osc.connect(gain);
            gain.connect(outNode);

            osc.start(ctx.currentTime + timeOffset);
            osc.stop(ctx.currentTime + timeOffset + 0.13);
            timeOffset += 0.09;
          }

          const nextInterval = 1200 + Math.random() * 1500;
          timeoutId = setTimeout(cricketLoop, nextInterval);
        };

        let timeoutId = setTimeout(cricketLoop, 300);
        cleanups.push(() => { isAlive = false; clearTimeout(timeoutId); });
        break;
      }

      // 9. Lửa trại tí tách (Campfire Crackling)
      case 'campfire': {
        const brownSrc = this._createNoiseSource(this.noiseBuffers.brown);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, ctx.currentTime);

        const roarGain = ctx.createGain();
        roarGain.gain.setValueAtTime(0.6, ctx.currentTime);

        brownSrc.connect(filter);
        filter.connect(roarGain);
        roarGain.connect(outNode);
        brownSrc.start();
        cleanups.push(() => brownSrc.stop());

        // Tiếng củi nổ lách tách ngẫu nhiên
        const crackleInterval = setInterval(() => {
          if (!this.audioCtx || ctx.state === 'closed') return;
          if (Math.random() > 0.4) {
            const popOsc = ctx.createOscillator();
            const popGain = ctx.createGain();
            const popFilter = ctx.createBiquadFilter();

            popFilter.type = 'bandpass';
            popFilter.frequency.setValueAtTime(1500 + Math.random() * 3000, ctx.currentTime);
            popFilter.Q.setValueAtTime(5, ctx.currentTime);

            popOsc.type = 'sawtooth';
            popOsc.frequency.setValueAtTime(80 + Math.random() * 300, ctx.currentTime);

            const vol = 0.05 + Math.random() * 0.08;
            popGain.gain.setValueAtTime(vol, ctx.currentTime);
            popGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

            popOsc.connect(popFilter);
            popFilter.connect(popGain);
            popGain.connect(outNode);

            popOsc.start();
            popOsc.stop(ctx.currentTime + 0.04);
          }
        }, 120);
        cleanups.push(() => clearInterval(crackleInterval));
        break;
      }

      // 10. Mèo gừ gừ êm ái (Cat Purring)
      case 'cat_purr': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(26, ctx.currentTime);

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(52, ctx.currentTime);

        // Điều chế nhịp thở gừ gừ (AM tremolo 24 Hz)
        const tremolo = ctx.createOscillator();
        tremolo.frequency.setValueAtTime(23, ctx.currentTime);
        const tremoloGain = ctx.createGain();
        tremoloGain.gain.setValueAtTime(0.4, ctx.currentTime);
        tremolo.connect(tremoloGain);

        // Nhịp thở ra hít vào (chu kỳ 3 giây)
        const breathLfo = ctx.createOscillator();
        breathLfo.frequency.setValueAtTime(0.33, ctx.currentTime);
        const breathGain = ctx.createGain();
        breathGain.gain.setValueAtTime(0.3, ctx.currentTime);
        breathLfo.connect(breathGain);

        const baseGain = ctx.createGain();
        baseGain.gain.setValueAtTime(0.6, ctx.currentTime);
        tremoloGain.connect(baseGain.gain);
        breathGain.connect(baseGain.gain);

        osc.connect(baseGain);
        osc2.connect(baseGain);
        baseGain.connect(outNode);

        osc.start();
        osc2.start();
        tremolo.start();
        breathLfo.start();

        cleanups.push(() => {
          osc.stop(); osc2.stop(); tremolo.stop(); breathLfo.stop();
        });
        break;
      }

      // 11. Quán cà phê ấm cúng (Coffee Shop Ambience)
      case 'coffee_shop': {
        // Nền thì thầm xa xăm (warm ambient murmur)
        const pinkSrc = this._createNoiseSource(this.noiseBuffers.pink);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);

        const bgGain = ctx.createGain();
        bgGain.gain.setValueAtTime(0.45, ctx.currentTime);

        pinkSrc.connect(filter);
        filter.connect(bgGain);
        bgGain.connect(outNode);
        pinkSrc.start();
        cleanups.push(() => pinkSrc.stop());

        // Tiếng chạm cốc chén, thìa sứ lanh canh nhẹ nhàng
        let isAlive = true;
        const clinkLoop = () => {
          if (!isAlive || !this.audioCtx || ctx.state === 'closed') return;
          const clinkOsc = ctx.createOscillator();
          const clinkGain = ctx.createGain();
          clinkOsc.type = 'sine';
          const freq = [2100, 2480, 2900, 3400][Math.floor(Math.random() * 4)];
          clinkOsc.frequency.setValueAtTime(freq, ctx.currentTime);

          clinkGain.gain.setValueAtTime(0.04 + Math.random() * 0.03, ctx.currentTime);
          clinkGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

          clinkOsc.connect(clinkGain);
          clinkGain.connect(outNode);
          clinkOsc.start();
          clinkOsc.stop(ctx.currentTime + 0.4);

          const nextTime = 2500 + Math.random() * 4500;
          timeoutId = setTimeout(clinkLoop, nextTime);
        };
        let timeoutId = setTimeout(clinkLoop, 2000);
        cleanups.push(() => { isAlive = false; clearTimeout(timeoutId); });
        break;
      }

      // 12. Văn phòng & Bàn phím cơ (Typing & Office)
      case 'office_typing': {
        // Nền gió quạt điều hòa văn phòng êm ái
        const brownSrc = this._createNoiseSource(this.noiseBuffers.brown);
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(220, ctx.currentTime);
        const roomGain = ctx.createGain();
        roomGain.gain.setValueAtTime(0.2, ctx.currentTime);
        brownSrc.connect(lowpass);
        lowpass.connect(roomGain);
        roomGain.connect(outNode);
        brownSrc.start();
        cleanups.push(() => brownSrc.stop());

        // Tiếng gõ phím cơ êm ái ngẫu nhiên theo nhịp làm việc
        let isAlive = true;
        const keyType = () => {
          if (!isAlive || !this.audioCtx || ctx.state === 'closed') return;
          const strokes = Math.floor(Math.random() * 6) + 2;
          let delay = 0;

          for (let i = 0; i < strokes; i++) {
            const clickOsc = ctx.createOscillator();
            const clickGain = ctx.createGain();
            const clickFilter = ctx.createBiquadFilter();

            clickFilter.type = 'bandpass';
            clickFilter.frequency.setValueAtTime(1800 + Math.random() * 1200, ctx.currentTime);
            clickFilter.Q.setValueAtTime(3, ctx.currentTime);

            clickOsc.type = 'triangle';
            clickOsc.frequency.setValueAtTime(120 + Math.random() * 80, ctx.currentTime);

            const clickT = ctx.currentTime + delay;
            clickGain.gain.setValueAtTime(0.03 + Math.random() * 0.02, clickT);
            clickGain.gain.exponentialRampToValueAtTime(0.0001, clickT + 0.04);

            clickOsc.connect(clickFilter);
            clickFilter.connect(clickGain);
            clickGain.connect(outNode);

            clickOsc.start(clickT);
            clickOsc.stop(clickT + 0.05);

            delay += 0.09 + Math.random() * 0.12;
          }

          const nextInterval = 800 + Math.random() * 2200;
          timeoutId = setTimeout(keyType, nextInterval);
        };
        let timeoutId = setTimeout(keyType, 1000);
        cleanups.push(() => { isAlive = false; clearTimeout(timeoutId); });
        break;
      }

      // 13. Đồng hồ tích tắc (Clock Tick)
      case 'clock_tick': {
        let isTick = true;
        const intervalId = setInterval(() => {
          if (!this.audioCtx || ctx.state === 'closed') return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(isTick ? 1400 : 1050, ctx.currentTime);
          filter.Q.setValueAtTime(8, ctx.currentTime);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(isTick ? 400 : 300, ctx.currentTime);

          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(outNode);

          osc.start();
          osc.stop(ctx.currentTime + 0.05);

          isTick = !isTick;
        }, 1000);
        cleanups.push(() => clearInterval(intervalId));
        break;
      }

      // 14. Chuông gió thiền tịnh (Wind Chimes)
      case 'wind_chimes': {
        let isAlive = true;
        // Tần số thang âm ngũ cung thiền tịnh (Pentatonic C6, D6, E6, G6, A6, C7)
        const chimeFreqs = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0];

        const strikeChime = () => {
          if (!isAlive || !this.audioCtx || ctx.state === 'closed') return;
          const numStrikes = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < numStrikes; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);

            const startT = ctx.currentTime + i * 0.15;
            gain.gain.setValueAtTime(0.05 + Math.random() * 0.03, startT);
            gain.gain.exponentialRampToValueAtTime(0.0001, startT + 2.8);

            osc.connect(gain);
            gain.connect(outNode);

            osc.start(startT);
            osc.stop(startT + 3.0);
          }

          const nextInterval = 3000 + Math.random() * 4500;
          timeoutId = setTimeout(strikeChime, nextInterval);
        };

        let timeoutId = setTimeout(strikeChime, 1500);
        cleanups.push(() => { isAlive = false; clearTimeout(timeoutId); });
        break;
      }

      // 15. Tiếng sấm xa êm dịu (Distant Thunder)
      case 'thunder': {
        let isAlive = true;
        const triggerThunder = () => {
          if (!isAlive || !this.audioCtx || ctx.state === 'closed') return;
          const brownSrc = this._createNoiseSource(this.noiseBuffers.brown);
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(100, ctx.currentTime);

          const gain = ctx.createGain();
          const startT = ctx.currentTime;
          const dur = 4.5;

          gain.gain.setValueAtTime(0.01, startT);
          gain.gain.linearRampToValueAtTime(0.35, startT + 0.8);
          gain.gain.linearRampToValueAtTime(0.2, startT + 1.8);
          gain.gain.exponentialRampToValueAtTime(0.0001, startT + dur);

          brownSrc.connect(filter);
          filter.connect(gain);
          gain.connect(outNode);

          brownSrc.start(startT);
          brownSrc.stop(startT + dur + 0.1);

          const nextInterval = 14000 + Math.random() * 18000;
          timeoutId = setTimeout(triggerThunder, nextInterval);
        };

        let timeoutId = setTimeout(triggerThunder, 4000);
        cleanups.push(() => { isAlive = false; clearTimeout(timeoutId); });
        break;
      }

      // 16. Tiếng ồn nâu (Brown Noise - Sâu lắng, ru ngủ)
      case 'brown_noise': {
        const brownSrc = this._createNoiseSource(this.noiseBuffers.brown);
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(450, ctx.currentTime);

        brownSrc.connect(lowpass);
        lowpass.connect(outNode);
        brownSrc.start();
        cleanups.push(() => brownSrc.stop());
        break;
      }

      // 17. Tiếng ồn trắng (White Noise - Tập trung học tập)
      case 'white_noise': {
        const whiteSrc = this._createNoiseSource(this.noiseBuffers.white);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, ctx.currentTime);

        whiteSrc.connect(filter);
        filter.connect(gain);
        gain.connect(outNode);
        whiteSrc.start();
        cleanups.push(() => whiteSrc.stop());
        break;
      }

      default: {
        const pinkSrc = this._createNoiseSource(this.noiseBuffers.pink);
        pinkSrc.connect(outNode);
        pinkSrc.start();
        cleanups.push(() => pinkSrc.stop());
      }
    }

    return () => {
      cleanups.forEach(fn => {
        try { fn(); } catch (e) {}
      });
    };
  }
}

// Khởi tạo instance toàn cục
window.audioEngine = new ZenAudioEngine();
