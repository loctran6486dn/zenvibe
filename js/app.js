/**
 * app.js
 * Điều khiển chính ứng dụng ZenVibe (UI, Event Handlers, Canvas Animation, Phím tắt)
 */

document.addEventListener('DOMContentLoaded', () => {
  const engine = window.audioEngine;
  const presetManager = new PresetManager(engine);
  const timer = new ZenTimer(engine);

  let currentCategory = 'all';
  let isMasterPaused = false;
  let activeBackupState = new Map(); // Lưu trạng thái khi master pause

  // DOM Elements
  const soundGrid = document.getElementById('soundGrid');
  const categoryNav = document.getElementById('categoryNav');
  const presetChipsWrapper = document.getElementById('presetChips');
  
  // Master bar elements
  const btnMasterPlay = document.getElementById('btnMasterPlay');
  const masterStatusText = document.getElementById('masterStatusText');
  const masterSubText = document.getElementById('masterSubText');
  const masterVolSlider = document.getElementById('masterVolSlider');
  const btnMasterMute = document.getElementById('btnMasterMute');
  const btnOpenTimer = document.getElementById('btnOpenTimer');
  const timerBadge = document.getElementById('timerBadge');
  const btnOpenPresets = document.getElementById('btnOpenPresets');
  const btnSaveMix = document.getElementById('btnSaveMix');
  const btnResetAll = document.getElementById('btnResetAll');

  // Modals
  const timerModal = document.getElementById('timerModal');
  const presetsModal = document.getElementById('presetsModal');
  const saveMixModal = document.getElementById('saveMixModal');
  const toastNotice = document.getElementById('toastNotice');

  // Mở khóa âm thanh tức thì trên iOS Safari & Android Chrome khi chạm lần đầu
  const unlockMobileAudio = () => {
    engine.initContext();
    document.removeEventListener('touchstart', unlockMobileAudio);
    document.removeEventListener('click', unlockMobileAudio);
  };
  document.addEventListener('touchstart', unlockMobileAudio, { passive: true, once: true });
  document.addEventListener('click', unlockMobileAudio, { passive: true, once: true });

  // ==========================================
  // 1. RENDER CATEGORIES & SOUND CARDS
  // ==========================================

  function renderCategories() {
    categoryNav.innerHTML = '';
    SOUND_CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-tab ${cat.id === currentCategory ? 'active' : ''}`;
      btn.innerHTML = `<span>${cat.icon}</span> <span>${cat.name}</span>`;
      btn.addEventListener('click', () => {
        currentCategory = cat.id;
        document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderSounds();
      });
      categoryNav.appendChild(btn);
    });
  }

  function renderSounds() {
    soundGrid.innerHTML = '';
    const filteredSounds = currentCategory === 'all' 
      ? SOUND_ITEMS 
      : SOUND_ITEMS.filter(s => s.category === currentCategory);

    filteredSounds.forEach(sound => {
      const channel = engine.getChannel(sound.id, sound.defaultVolume);
      const isPlaying = channel.isPlaying;

      const card = document.createElement('div');
      card.className = `sound-card ${isPlaying ? 'active' : ''}`;
      card.id = `card-${sound.id}`;

      card.innerHTML = `
        <div class="card-top" data-sound-id="${sound.id}">
          <div class="card-info">
            <div class="card-icon">${sound.icon}</div>
            <div class="card-text">
              <div class="card-name">${sound.name}</div>
              <span class="card-tag">${sound.tag}</span>
            </div>
          </div>
          <button class="toggle-btn" aria-label="Bật tắt ${sound.name}">
            <i class="icon-toggle">${isPlaying ? '⏸' : '▶'}</i>
          </button>
        </div>
        <p class="card-desc" data-sound-id="${sound.id}">${sound.description}</p>
        <div class="volume-control-wrap">
          <span class="vol-icon">🔉</span>
          <input type="range" class="custom-slider vol-slider" 
                 min="0" max="100" value="${channel.volume}" 
                 data-sound-id="${sound.id}"
                 aria-label="Âm lượng ${sound.name}">
          <span class="vol-value" id="val-${sound.id}">${channel.volume}%</span>
        </div>
      `;

      // Event click bật / tắt âm thanh
      const triggerElements = card.querySelectorAll('.card-top, .card-desc');
      triggerElements.forEach(el => {
        el.addEventListener('click', (e) => {
          // Bỏ qua nếu click trực tiếp vào nút con khác
          toggleSoundItem(sound.id);
        });
      });

      // Event slider âm lượng
      const slider = card.querySelector('.vol-slider');
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        engine.setChannelVolume(sound.id, val);
        const valLabel = card.querySelector(`#val-${sound.id}`);
        if (valLabel) valLabel.textContent = `${val}%`;

        // Nếu đang chỉnh mà track chưa bật -> tự động bật
        if (!channel.isPlaying && val > 0) {
          toggleSoundItem(sound.id, true);
        }
      });

      soundGrid.appendChild(card);
    });
  }

  function toggleSoundItem(soundId, forceState = null) {
    const isNowPlaying = engine.toggleSound(soundId, forceState);
    updateCardUI(soundId, isNowPlaying);
    updateMasterStatus();
  }

  function updateCardUI(soundId, isPlaying) {
    const card = document.getElementById(`card-${soundId}`);
    if (!card) return;

    if (isPlaying) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }

    const toggleIcon = card.querySelector('.icon-toggle');
    if (toggleIcon) {
      toggleIcon.textContent = isPlaying ? '⏸' : '▶';
    }
  }

  // ==========================================
  // 2. PRESETS STRIP & MODAL
  // ==========================================

  function renderPresetsStrip() {
    presetChipsWrapper.innerHTML = '';
    
    // Preset gợi ý sẵn
    DEFAULT_PRESETS.slice(0, 5).forEach(preset => {
      const chip = document.createElement('button');
      chip.className = 'preset-chip';
      chip.innerHTML = `<span>${preset.icon}</span> <span>${preset.name}</span>`;
      chip.addEventListener('click', () => {
        presetManager.applyPreset(preset);
        showToast(`Đã áp dụng preset: ${preset.name}`);
      });
      presetChipsWrapper.appendChild(chip);
    });

    // Custom presets (nếu có)
    presetManager.customPresets.forEach(preset => {
      const chip = document.createElement('button');
      chip.className = 'preset-chip';
      chip.style.borderColor = 'rgba(52, 211, 153, 0.4)';
      chip.innerHTML = `<span>${preset.icon}</span> <span>${preset.name}</span>`;
      chip.addEventListener('click', () => {
        presetManager.applyPreset(preset);
        showToast(`Đã áp dụng: ${preset.name}`);
      });
      presetChipsWrapper.appendChild(chip);
    });
  }

  function renderPresetsModalList() {
    const defaultList = document.getElementById('defaultPresetsList');
    const customList = document.getElementById('customPresetsList');
    if (!defaultList || !customList) return;

    defaultList.innerHTML = '';
    DEFAULT_PRESETS.forEach(preset => {
      const item = document.createElement('div');
      item.className = 'preset-card-item';
      item.innerHTML = `
        <div class="preset-card-left">
          <span class="preset-card-icon">${preset.icon}</span>
          <div>
            <div class="preset-card-name">${preset.name}</div>
            <div class="preset-card-sub">${preset.subtitle}</div>
          </div>
        </div>
        <button class="pill-btn primary">Áp dụng</button>
      `;
      item.addEventListener('click', () => {
        presetManager.applyPreset(preset);
        closeModal(presetsModal);
        showToast(`Đã chuyển sang ${preset.name}`);
      });
      defaultList.appendChild(item);
    });

    // Custom List
    customList.innerHTML = '';
    if (presetManager.customPresets.length === 0) {
      customList.innerHTML = `<p style="color: var(--text-subtle); font-size: 0.85rem; padding: 10px 0;">Chưa có phối âm cá nhân nào. Hãy phối âm và bấm "Lưu phối âm" nhé!</p>`;
    } else {
      presetManager.customPresets.forEach(preset => {
        const item = document.createElement('div');
        item.className = 'preset-card-item';
        item.innerHTML = `
          <div class="preset-card-left">
            <span class="preset-card-icon">${preset.icon}</span>
            <div>
              <div class="preset-card-name">${preset.name}</div>
              <div class="preset-card-sub">${preset.subtitle} • ${preset.createdAt}</div>
            </div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="pill-btn primary apply-btn">Bật</button>
            <button class="pill-btn danger del-btn">Xóa</button>
          </div>
        `;

        item.querySelector('.apply-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          presetManager.applyPreset(preset);
          closeModal(presetsModal);
          showToast(`Đã chuyển sang ${preset.name}`);
        });

        item.querySelector('.del-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          presetManager.deleteCustomPreset(preset.id);
          renderPresetsModalList();
          renderPresetsStrip();
          showToast(`Đã xóa combo ${preset.name}`);
        });

        item.addEventListener('click', () => {
          presetManager.applyPreset(preset);
          closeModal(presetsModal);
          showToast(`Đã chuyển sang ${preset.name}`);
        });

        customList.appendChild(item);
      });
    }
  }

  // Khi preset được áp dụng từ bất kỳ đâu, cập nhật lại toàn bộ UI
  window.addEventListener('zen:preset_applied', (e) => {
    isMasterPaused = false;
    btnMasterPlay.classList.remove('paused');
    btnMasterPlay.innerHTML = '⏸';

    // Cập nhật lại UI tất cả cards
    SOUND_ITEMS.forEach(item => {
      const channel = engine.getChannel(item.id);
      updateCardUI(item.id, channel.isPlaying);
      const valLabel = document.getElementById(`val-${item.id}`);
      const slider = document.querySelector(`.vol-slider[data-sound-id="${item.id}"]`);
      if (valLabel) valLabel.textContent = `${channel.volume}%`;
      if (slider) slider.value = channel.volume;
    });

    updateMasterStatus();
  });

  window.addEventListener('zen:presets_updated', () => {
    renderPresetsStrip();
    renderPresetsModalList();
  });

  // ==========================================
  // 3. MASTER CONTROL BAR
  // ==========================================

  function updateMasterStatus() {
    const activeCount = engine.getActiveCount();

    if (activeCount > 0) {
      btnMasterPlay.classList.remove('paused');
      btnMasterPlay.innerHTML = '⏸';
      masterStatusText.innerHTML = `<span class="pulse-dot"></span> Đang phát ${activeCount} âm thanh`;
      masterSubText.textContent = 'Nhấn phím Space để tạm dừng / phát tiếp';
    } else {
      btnMasterPlay.classList.add('paused');
      btnMasterPlay.innerHTML = '▶';
      masterStatusText.innerHTML = 'Chưa có âm thanh nào bật';
      masterSubText.textContent = 'Chọn âm thanh hoặc chọn Preset để bắt đầu thư giãn';
    }
  }

  // Play / Pause Master Button
  btnMasterPlay.addEventListener('click', () => {
    const activeCount = engine.getActiveCount();

    if (activeCount > 0 && !isMasterPaused) {
      // Lưu lại các kênh đang phát để khi bật lại khôi phục đúng
      activeBackupState.clear();
      for (const [id, channel] of engine.channels.entries()) {
        if (channel.isPlaying) {
          activeBackupState.set(id, channel.volume);
        }
      }
      engine.stopAll(0.3);
      isMasterPaused = true;
      btnMasterPlay.classList.add('paused');
      btnMasterPlay.innerHTML = '▶';
      masterStatusText.innerHTML = 'Đã tạm dừng';
      masterSubText.textContent = 'Nhấn để tiếp tục nghe';
      
      SOUND_ITEMS.forEach(s => updateCardUI(s.id, false));
    } else if (isMasterPaused && activeBackupState.size > 0) {
      // Khôi phục các kênh trước đó
      activeBackupState.forEach((vol, id) => {
        engine.setChannelVolume(id, vol);
        engine.startSound(id);
        updateCardUI(id, true);
      });
      isMasterPaused = false;
      updateMasterStatus();
    } else {
      // Chưa có gì phát -> Bật preset đầu tiên
      presetManager.applyPreset(DEFAULT_PRESETS[0]);
      showToast('Đang khởi động không gian Rừng chiều an yên');
    }
  });

  // Master Volume Slider
  masterVolSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    engine.setMasterVolume(val);
    btnMasterMute.innerHTML = val === 0 ? '🔇' : '🔊';
  });

  // Master Mute Button
  btnMasterMute.addEventListener('click', () => {
    const isMuted = engine.toggleMute();
    btnMasterMute.innerHTML = isMuted ? '🔇' : '🔊';
    showToast(isMuted ? 'Đã tắt tiếng toàn bộ' : 'Đã bật lại âm thanh');
  });

  // Reset All Button
  btnResetAll.addEventListener('click', () => {
    engine.stopAll(0.3);
    activeBackupState.clear();
    isMasterPaused = false;
    SOUND_ITEMS.forEach(s => updateCardUI(s.id, false));
    updateMasterStatus();
    showToast('Đã tắt tất cả âm thanh');
  });

  // ==========================================
  // 4. TIMER & POMODORO
  // ==========================================

  btnOpenTimer.addEventListener('click', () => openModal(timerModal));

  // Switch tabs in timer modal
  const tabSleep = document.getElementById('tabSleepTimer');
  const tabPomo = document.getElementById('tabPomodoro');
  const sleepGrid = document.getElementById('sleepTimerGrid');
  const pomoGrid = document.getElementById('pomodoroGrid');
  const timerClock = document.getElementById('timerClock');
  const timerStatusHint = document.getElementById('timerStatusHint');
  const btnStopTimer = document.getElementById('btnStopTimer');

  tabSleep.addEventListener('click', () => {
    tabSleep.classList.add('active');
    tabPomo.classList.remove('active');
    sleepGrid.style.display = 'grid';
    pomoGrid.style.display = 'none';
  });

  tabPomo.addEventListener('click', () => {
    tabPomo.classList.add('active');
    tabSleep.classList.remove('active');
    sleepGrid.style.display = 'none';
    pomoGrid.style.display = 'grid';
  });

  // Quick buttons Sleep Timer
  document.querySelectorAll('.btn-sleep-val').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.mins, 10);
      timer.startSleepTimer(mins);
      showToast(`Hẹn giờ ngủ: ${mins} phút (sẽ fade-out êm dịu)`);
      closeModal(timerModal);
    });
  });

  // Quick buttons Pomodoro
  document.querySelectorAll('.btn-pomo-val').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.dataset.mins, 10);
      timer.startPomodoro(mins);
      showToast(`Bắt đầu tập trung Pomodoro: ${mins} phút`);
      closeModal(timerModal);
    });
  });

  btnStopTimer.addEventListener('click', () => {
    timer.stop();
    showToast('Đã hủy hẹn giờ');
  });

  // Timer Tick listener
  timer.onTick(({ formatted, isRunning, mode, remaining }) => {
    timerClock.textContent = formatted;
    if (isRunning) {
      timerBadge.textContent = formatted;
      timerBadge.style.display = 'inline-block';
      btnOpenTimer.classList.add('active');
      timerStatusHint.textContent = mode === 'sleep' 
        ? 'Âm thanh sẽ hạ dần âm lượng trong 15s cuối'
        : 'Phiên làm việc tập trung cao độ';
    } else {
      timerBadge.style.display = 'none';
      btnOpenTimer.classList.remove('active');
      timerStatusHint.textContent = 'Hẹn giờ đang tắt';
    }
  });

  timer.onComplete((mode) => {
    if (mode === 'pomodoro') {
      showToast('⏰ Hết phiên Pomodoro! Hãy đứng dậy thư giãn 5 phút.');
    } else {
      showToast('💤 Hết giờ ngủ. Chúc bạn có một giấc ngủ thật ngon lành!');
    }
    updateMasterStatus();
  });

  // ==========================================
  // 5. SAVE CUSTOM MIX MODAL
  // ==========================================

  btnSaveMix.addEventListener('click', () => {
    const activeCount = engine.getActiveCount();
    if (activeCount === 0) {
      showToast('Hãy bật ít nhất 1 âm thanh để lưu phối âm!');
      return;
    }
    openModal(saveMixModal);
    document.getElementById('mixNameInput').value = '';
    document.getElementById('mixNameInput').focus();
  });

  document.getElementById('btnConfirmSaveMix').addEventListener('click', () => {
    const input = document.getElementById('mixNameInput');
    const name = input.value.trim() || 'Phối âm cá nhân';
    const newPreset = presetManager.getCurrentMix(name);

    if (newPreset) {
      presetManager.addCustomPreset(newPreset);
      closeModal(saveMixModal);
      showToast(`Đã lưu combo "${name}" thành công!`);
    }
  });

  // Presets modal open
  btnOpenPresets.addEventListener('click', () => {
    renderPresetsModalList();
    openModal(presetsModal);
  });

  // Modal helpers
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
  }

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      closeModal(modal);
    });
  });

  // ==========================================
  // 6. KEYBOARD SHORTCUTS
  // ==========================================
  window.addEventListener('keydown', (e) => {
    // Không nhận phím tắt khi đang gõ text vào input
    if (e.target.tagName === 'INPUT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      btnMasterPlay.click();
    } else if (e.code === 'KeyM') {
      btnMasterMute.click();
    } else if (e.code === 'KeyT') {
      openModal(timerModal);
    } else if (e.code === 'KeyP') {
      renderPresetsModalList();
      openModal(presetsModal);
    } else if (e.code === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m));
    }
  });

  // ==========================================
  // 7. TOAST NOTIFICATION
  // ==========================================
  let toastTimeout = null;
  function showToast(msg) {
    if (!toastNotice) return;
    const msgEl = toastNotice.querySelector('.toast-msg');
    if (msgEl) msgEl.textContent = msg;
    toastNotice.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2800);
  }

  // ==========================================
  // 8. AMBIENT CANVAS VISUALIZER (Lá bay & Đom đóm)
  // ==========================================
  function initAmbientCanvas() {
    const canvas = document.getElementById('ambientCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Hạt đom đóm & mảnh lá rơi nhẹ
    const particles = [];
    const PARTICLE_COUNT = 38;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        speedX: Math.random() * 0.4 - 0.2 + 0.15, // trôi nhẹ sang phải theo gió
        speedY: Math.random() * 0.5 + 0.2, // rơi từ từ
        alpha: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        isLeaf: Math.random() > 0.65,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;
        p.alpha += Math.sin(Date.now() * 0.001 * p.pulseSpeed) * 0.005;

        // Loop qua biên màn hình
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.isLeaf) {
          // Vẽ chiếc lá thu nhỏ bé bay xào xạc theo gió
          ctx.fillStyle = `rgba(52, 211, 153, ${Math.max(0.1, Math.min(0.4, p.alpha))})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Vẽ đom đóm phát sáng dịu
          ctx.fillStyle = `rgba(56, 189, 248, ${Math.max(0.15, Math.min(0.65, p.alpha))})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }

  // Khởi động toàn bộ
  renderCategories();
  renderSounds();
  renderPresetsStrip();
  initAmbientCanvas();
  updateMasterStatus();
});
