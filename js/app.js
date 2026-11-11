/**
 * app.js
 * Điều khiển chính ứng dụng ZenVibe (UI/UX Dark Purple #A371F7, Event Handlers, Canvas Animation, Phím tắt)
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

  // Mobile Drawer & Navigation Elements
  const quickDrawer = document.getElementById('quickDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const btnDrawerClose = document.getElementById('btnDrawerClose');
  const btnHeroOpenMixer = document.getElementById('btnHeroOpenMixer');
  const btnCenterFab = document.getElementById('btnCenterFab');
  const fabIcon = document.getElementById('fabIcon');
  const dockBtnHome = document.getElementById('dockBtnHome');

  // Hero Dashboard Elements
  const heroRingVisualizer = document.getElementById('heroRingVisualizer');
  const heroRingVal = document.getElementById('heroRingVal');
  const heroRingSub = document.getElementById('heroRingSub');
  const heroStatActive = document.getElementById('heroStatActive');
  const heroStatVol = document.getElementById('heroStatVol');
  const heroStatTimer = document.getElementById('heroStatTimer');

  // Quick Action Tiles
  const quickTiles = document.querySelectorAll('.quick-tile');

  // Upgrade & Streaks
  const btnUpgradePremium = document.getElementById('btnUpgradePremium');
  if (btnUpgradePremium) {
    btnUpgradePremium.addEventListener('click', () => {
      showToast('🌟 Bạn đang sử dụng gói ZenVibe Premium đầy đủ 100% tính năng!');
    });
  }

  // Mở khóa âm thanh tức thì trên iOS Safari & Android Chrome khi chạm lần đầu
  const unlockMobileAudio = () => {
    engine.initContext();
    const shield = document.getElementById('bgShieldAudio');
    if (shield && shield.paused) {
      shield.play().catch(e => console.warn('bgShield unlock error:', e));
    }
    document.removeEventListener('touchstart', unlockMobileAudio);
    document.removeEventListener('click', unlockMobileAudio);
  };
  document.addEventListener('touchstart', unlockMobileAudio, { passive: true, once: true });
  document.addEventListener('click', unlockMobileAudio, { passive: true, once: true });

  // Tự động khôi phục AudioContext khi người dùng quay lại tab/ứng dụng trên điện thoại
  document.addEventListener('visibilitychange', () => {
    if (engine.getActiveCount() > 0) {
      if (engine.audioCtx && engine.audioCtx.state === 'suspended') {
        engine.audioCtx.resume();
      }
      const shield = document.getElementById('bgShieldAudio');
      if (shield && shield.paused) {
        shield.play().catch(() => {});
      }
    }
  });

  // Tải trước ngầm các file âm thanh vào cache để khi bấm là phát ngay
  setTimeout(() => {
    if (engine && typeof engine.preloadAllSamples === 'function') {
      engine.preloadAllSamples();
    }
  }, 200);

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
        el.addEventListener('click', () => {
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
    const shield = document.getElementById('bgShieldAudio');
    if (shield && shield.paused) {
      shield.play().catch(() => {});
    }
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
        showToast(`Đã áp dụng: ${preset.name}`);
      });
      presetChipsWrapper.appendChild(chip);
    });

    // Custom presets (nếu có)
    presetManager.customPresets.forEach(preset => {
      const chip = document.createElement('button');
      chip.className = 'preset-chip';
      chip.style.borderColor = 'rgba(163, 113, 247, 0.4)';
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
  window.addEventListener('zen:preset_applied', () => {
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
  // 3. MASTER CONTROL BAR & MEDIA SESSION (LOCK SCREEN / CONTROL CENTER)
  // ==========================================

  function updateMediaSession(activeCount) {
    if ('mediaSession' in navigator) {
      if (activeCount > 0) {
        const activeNames = [];
        for (const [id, channel] of engine.channels.entries()) {
          if (channel.isPlaying) {
            const item = SOUND_ITEMS.find(s => s.id === id);
            if (item) activeNames.push(item.name);
          }
        }

        let albumText = 'Âm thanh thư giãn & tĩnh tâm';
        if (timer && timer.isRunning) {
          albumText = timer.mode === 'sleep' 
            ? `Hẹn giờ tắt: ${timer.getFormattedTime()}` 
            : `Pomodoro: ${timer.getFormattedTime()}`;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'ZenVibe - Relaxing Sounds',
          artist: activeNames.slice(0, 3).join(' • ') + (activeNames.length > 3 ? ` (+${activeNames.length - 3})` : ''),
          album: albumText,
          artwork: [
            { src: 'assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';
      } else {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }

  // MediaSession Action Handlers cho phím tai nghe & màn hình khóa
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (isMasterPaused || engine.getActiveCount() === 0) {
          btnMasterPlay.click();
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (!isMasterPaused && engine.getActiveCount() > 0) {
          btnMasterPlay.click();
        }
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        btnResetAll.click();
      });
    } catch (e) {
      console.warn('MediaSession handler error:', e);
    }
  }

  function updateMetricBars() {
    const metricNatBar = document.getElementById('metricNatBar');
    const metricSpaceBar = document.getElementById('metricSpaceBar');
    const metricSleepBar = document.getElementById('metricSleepBar');
    const metricNatText = document.getElementById('metricNatText');
    const metricSpaceText = document.getElementById('metricSpaceText');
    const metricSleepText = document.getElementById('metricSleepText');

    let natActive = 0, spaceActive = 0, sleepActive = 0;
    const natNames = [], spaceNames = [], sleepNames = [];

    for (const [id, channel] of engine.channels.entries()) {
      if (channel.isPlaying) {
        const item = SOUND_ITEMS.find(s => s.id === id);
        if (item) {
          if (['rain', 'water', 'nature'].includes(item.category)) {
            natActive++;
            natNames.push(item.name);
          } else if (['urban', 'focus'].includes(item.category)) {
            spaceActive++;
            spaceNames.push(item.name);
          } else if (['sleep'].includes(item.category)) {
            sleepActive++;
            sleepNames.push(item.name);
          }
        }
      }
    }

    if (metricNatBar) {
      const pct = natActive > 0 ? Math.min(100, natActive * 35) : 15;
      metricNatBar.style.width = `${pct}%`;
      if (metricNatText) metricNatText.textContent = natNames.length > 0 ? natNames.slice(0, 2).join(' • ') : 'Mưa • Suối • Gió';
    }

    if (metricSpaceBar) {
      const pct = spaceActive > 0 ? Math.min(100, spaceActive * 45) : 15;
      metricSpaceBar.style.width = `${pct}%`;
      if (metricSpaceText) metricSpaceText.textContent = spaceNames.length > 0 ? spaceNames.slice(0, 2).join(' • ') : 'Quán cafe • Phím';
    }

    if (metricSleepBar) {
      const pct = sleepActive > 0 ? Math.min(100, sleepActive * 45) : 15;
      metricSleepBar.style.width = `${pct}%`;
      if (metricSleepText) metricSleepText.textContent = sleepNames.length > 0 ? sleepNames.slice(0, 2).join(' • ') : 'Nâu • Sấm • Dế';
    }
  }

  function updateMasterStatus() {
    const activeCount = engine.getActiveCount();

    if (activeCount > 0) {
      btnMasterPlay.classList.remove('paused');
      btnMasterPlay.innerHTML = '⏸';
      if (fabIcon) fabIcon.textContent = '⏸';
      if (btnCenterFab) btnCenterFab.classList.add('is-playing');
      if (masterStatusText) masterStatusText.innerHTML = `<span class="pulse-dot"></span> Đang phát ${activeCount} âm thanh`;
      if (masterSubText) masterSubText.textContent = 'Nhấn phím Space để tạm dừng / phát tiếp';

      if (heroRingVal && (!timer || !timer.isRunning)) {
        heroRingVal.textContent = `${activeCount}`;
      }
      if (heroRingSub && (!timer || !timer.isRunning)) {
        heroRingSub.textContent = 'Âm thanh đang phát';
      }
    } else {
      btnMasterPlay.classList.add('paused');
      btnMasterPlay.innerHTML = '▶';
      if (fabIcon) fabIcon.textContent = '▶';
      if (btnCenterFab) btnCenterFab.classList.remove('is-playing');
      if (masterStatusText) masterStatusText.innerHTML = 'Chưa có âm thanh nào bật';
      if (masterSubText) masterSubText.textContent = 'Chọn âm thanh hoặc chọn Preset để bắt đầu thư giãn';

      if (heroRingVal && (!timer || !timer.isRunning)) {
        heroRingVal.textContent = 'Zen';
      }
      if (heroRingSub && (!timer || !timer.isRunning)) {
        heroRingSub.textContent = 'Chạm để thư giãn';
      }
    }

    if (heroStatActive) heroStatActive.textContent = `${activeCount}`;
    if (heroStatVol) heroStatVol.textContent = `${Math.round(engine.masterVolume * 100)}%`;

    // Cập nhật trạng thái active cho 4 quick tiles
    quickTiles.forEach(tile => {
      const sId = tile.dataset.soundId;
      const ch = engine.getChannel(sId);
      if (ch && ch.isPlaying) {
        tile.classList.add('is-active');
      } else {
        tile.classList.remove('is-active');
      }
    });

    // Cập nhật các thanh tiến độ 3 nhóm
    updateMetricBars();

    updateMediaSession(activeCount);
  }

  // Play / Pause Master Button
  btnMasterPlay.addEventListener('click', () => {
    engine.initContext();
    const shield = document.getElementById('bgShieldAudio');
    if (shield && shield.paused) {
      shield.play().catch(() => {});
    }
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
      if (fabIcon) fabIcon.textContent = '▶';
      if (btnCenterFab) btnCenterFab.classList.remove('is-playing');
      if (masterStatusText) masterStatusText.innerHTML = 'Đã tạm dừng';
      if (masterSubText) masterSubText.textContent = 'Nhấn để tiếp tục nghe';
      
      SOUND_ITEMS.forEach(s => updateCardUI(s.id, false));
      quickTiles.forEach(t => t.classList.remove('is-active'));
      if (heroRingVal) heroRingVal.textContent = 'Tạm dừng';
      if (heroRingSub) heroRingSub.textContent = 'Chạm để phát tiếp';
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
    if (heroStatVol) heroStatVol.textContent = `${Math.round(val * 100)}%`;
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
    quickTiles.forEach(t => t.classList.remove('is-active'));
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
      engine.initContext();
      const shield = document.getElementById('bgShieldAudio');
      if (shield && shield.paused) {
        shield.play().catch(() => {});
      }

      // Nếu chưa có âm thanh nào bật, tự động bật không gian mặc định đầu tiên
      if (engine.getActiveCount() === 0) {
        presetManager.applyPreset(DEFAULT_PRESETS[0]);
      }

      const mins = parseInt(btn.dataset.mins, 10);
      timer.startSleepTimer(mins);
      showToast(`Hẹn giờ ngủ: ${mins} phút (tự fade-out êm dịu)`);
      closeModal(timerModal);
      updateMediaSession(engine.getActiveCount());
    });
  });

  // Quick buttons Pomodoro
  document.querySelectorAll('.btn-pomo-val').forEach(btn => {
    btn.addEventListener('click', () => {
      engine.initContext();
      const shield = document.getElementById('bgShieldAudio');
      if (shield && shield.paused) {
        shield.play().catch(() => {});
      }

      if (engine.getActiveCount() === 0) {
        presetManager.applyPreset(DEFAULT_PRESETS[2]); // Office / Focus preset
      }

      const mins = parseInt(btn.dataset.mins, 10);
      timer.startPomodoro(mins);
      showToast(`Bắt đầu tập trung Pomodoro: ${mins} phút`);
      closeModal(timerModal);
      updateMediaSession(engine.getActiveCount());
    });
  });

  btnStopTimer.addEventListener('click', () => {
    timer.stop();
    showToast('Đã hủy hẹn giờ');
  });

  // Timer Tick listener
  let lastMediaUpdateSec = 0;
  timer.onTick(({ formatted, isRunning, mode, remaining }) => {
    timerClock.textContent = formatted;
    if (isRunning) {
      timerBadge.textContent = formatted;
      timerBadge.style.display = 'inline-block';
      btnOpenTimer.classList.add('active');
      timerStatusHint.textContent = mode === 'sleep' 
        ? 'Âm thanh sẽ hạ dần âm lượng trong 15s cuối'
        : 'Phiên làm việc tập trung cao độ';

      if (heroStatTimer) heroStatTimer.textContent = formatted;
      if (heroRingVal) heroRingVal.textContent = formatted;
      if (heroRingSub) heroRingSub.textContent = mode === 'sleep' ? 'Đang hẹn giờ ngủ' : 'Pomodoro tập trung';

      // Cập nhật thông tin lên màn hình khóa mỗi 5 giây
      if (Math.abs(remaining - lastMediaUpdateSec) >= 5) {
        lastMediaUpdateSec = remaining;
        updateMediaSession(engine.getActiveCount());
      }
    } else {
      timerBadge.style.display = 'none';
      btnOpenTimer.classList.remove('active');
      timerStatusHint.textContent = 'Hẹn giờ đang tắt';
      if (heroStatTimer) heroStatTimer.textContent = 'Tắt';
      updateMasterStatus();
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
  // 6. BOTTOM SHEET QUICK DRAWER & FAB
  // ==========================================
  const openDrawer = () => {
    if (quickDrawer) quickDrawer.classList.add('open');
    if (drawerBackdrop) drawerBackdrop.classList.add('open');
  };

  const closeDrawer = () => {
    if (quickDrawer) quickDrawer.classList.remove('open');
    if (drawerBackdrop) drawerBackdrop.classList.remove('open');
  };

  if (btnHeroOpenMixer) btnHeroOpenMixer.addEventListener('click', openDrawer);
  if (btnDrawerClose) btnDrawerClose.addEventListener('click', closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

  const btnDrawerTimer30 = document.getElementById('btnDrawerTimer30');
  if (btnDrawerTimer30) {
    btnDrawerTimer30.addEventListener('click', () => {
      engine.initContext();
      const shield = document.getElementById('bgShieldAudio');
      if (shield && shield.paused) shield.play().catch(() => {});
      if (engine.getActiveCount() === 0) {
        presetManager.applyPreset(DEFAULT_PRESETS[0]);
      }
      timer.startSleepTimer(30);
      showToast('💤 Hẹn giờ ngủ: 30 phút (tự fade-out êm dịu)');
      closeDrawer();
      updateMediaSession(engine.getActiveCount());
    });
  }

  const btnDrawerOpenPresets = document.getElementById('btnDrawerOpenPresets');
  if (btnDrawerOpenPresets) {
    btnDrawerOpenPresets.addEventListener('click', () => {
      closeDrawer();
      renderPresetsModalList();
      openModal(presetsModal);
    });
  }

  const btnDrawerSaveMix = document.getElementById('btnDrawerSaveMix');
  if (btnDrawerSaveMix) {
    btnDrawerSaveMix.addEventListener('click', () => {
      closeDrawer();
      btnSaveMix.click();
    });
  }

  // Floating Action Button (#A371F7 Purple Center Button)
  if (btnCenterFab) {
    btnCenterFab.addEventListener('click', () => {
      btnMasterPlay.click();
    });
  }

  // Hero circular ring
  if (heroRingVisualizer) {
    heroRingVisualizer.addEventListener('click', () => {
      btnMasterPlay.click();
    });
  }

  // Home icon click -> scroll to top
  if (dockBtnHome) {
    dockBtnHome.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Quick Action Tiles Click
  quickTiles.forEach(tile => {
    const soundId = tile.dataset.soundId;
    tile.addEventListener('click', () => {
      toggleSoundItem(soundId);
    });
  });

  // ==========================================
  // 7. DATE & WEEKDAYS INITIALIZER (HÌNH MẪU 1)
  // ==========================================
  function initDateAndWeekdays() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: CN, 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7
    const dayOfMonth = now.getDate();
    const month = now.getMonth() + 1;

    const dateLabel = document.getElementById('currentDateLabel');
    if (dateLabel) {
      dateLabel.textContent = `HÔM NAY, ${dayOfMonth} THG ${month}`;
    }

    const dayBubbles = document.querySelectorAll('.day-bubble');
    const targetDataDay = dayOfWeek === 0 ? '0' : String(dayOfWeek + 1);

    dayBubbles.forEach(bubble => {
      if (bubble.dataset.day === targetDataDay) {
        bubble.classList.add('today');
      } else {
        bubble.classList.remove('today');
      }

      bubble.addEventListener('click', () => {
        dayBubbles.forEach(b => b.classList.remove('today'));
        bubble.classList.add('today');
        const dayName = bubble.querySelector('.day-text')?.textContent || '';
        showToast(`Mục tiêu tĩnh tâm ngày ${dayName}: 30 phút`);
      });
    });
  }

  // ==========================================
  // 8. KEYBOARD SHORTCUTS
  // ==========================================
  window.addEventListener('keydown', (e) => {
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
      closeDrawer();
      document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m));
    }
  });

  // ==========================================
  // 9. TOAST NOTIFICATION
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
  // 10. AMBIENT CANVAS VISUALIZER (Bụi sao tím & Đom đóm vàng)
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

    const particles = [];
    const PARTICLE_COUNT = 38;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        speedX: Math.random() * 0.4 - 0.2 + 0.15,
        speedY: Math.random() * 0.45 + 0.15,
        alpha: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        isPurple: Math.random() > 0.4,
        isLeaf: Math.random() > 0.7,
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

        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.isLeaf) {
          // Chiếc lá xào xạc ánh tím #A371F7
          ctx.fillStyle = `rgba(163, 113, 247, ${Math.max(0.12, Math.min(0.45, p.alpha))})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.isPurple) {
          // Đom đóm tím dịu #A371F7
          ctx.fillStyle = `rgba(163, 113, 247, ${Math.max(0.15, Math.min(0.7, p.alpha))})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(163, 113, 247, 0.75)';
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Đom đóm vàng hổ phách #FBBF24
          ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0.15, Math.min(0.65, p.alpha))})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(251, 191, 36, 0.7)';
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
  initDateAndWeekdays();
  initAmbientCanvas();
  updateMasterStatus();
});
