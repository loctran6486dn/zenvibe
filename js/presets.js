/**
 * presets.js
 * Quản lý các cấu hình phối âm sẵn (Default Presets)
 * và lưu trữ phối âm cá nhân của người dùng (Custom User Presets)
 */

const DEFAULT_PRESETS = [
  {
    id: 'sound_bath_zen',
    name: 'Tắm âm thanh Sound Bath',
    subtitle: 'Chuông xoay Tây Tạng, trống đĩa Handpan và chuông gió Koshi',
    icon: 'singing_bowl',
    theme: 'bath',
    sounds: [
      { id: 'singing_bowl', volume: 60 },
      { id: 'handpan', volume: 55 },
      { id: 'tongue_drum', volume: 50 },
      { id: 'wind_chimes', volume: 45 }
    ]
  },
  {
    id: 'bamboo_winds',
    name: 'Thiền định Sáo trúc & Rừng thu',
    subtitle: 'Sáo trúc Bansuri, suối chảy và gió luồn qua cành lá xào xạc',
    icon: 'bamboo_flute',
    theme: 'bamboo',
    sounds: [
      { id: 'bamboo_flute', volume: 60 },
      { id: 'stream', volume: 55 },
      { id: 'wind_leaves', volume: 50 },
      { id: 'birds', volume: 45 }
    ]
  },
  {
    id: 'peaceful_strings',
    name: 'Khúc hòa tấu Đàn hạc & Cello',
    subtitle: 'Đàn hạc Celtic trong vắt, Cello trầm ấm vỗ về giấc ngủ',
    icon: 'celtic_harp',
    theme: 'strings',
    sounds: [
      { id: 'celtic_harp', volume: 60 },
      { id: 'warm_cello', volume: 55 },
      { id: 'rain', volume: 45 },
      { id: 'rain_roof', volume: 40 }
    ]
  },
  {
    id: 'temple_mindfulness',
    name: 'Vườn thiền Mõ & Đàn tranh',
    subtitle: 'Tiếng mõ gỗ định tâm, Cổ tranh Guzheng và tiếng nước róc rách',
    icon: 'temple_wood',
    theme: 'temple',
    sounds: [
      { id: 'temple_wood', volume: 50 },
      { id: 'zen_zither', volume: 55 },
      { id: 'rivulet', volume: 50 },
      { id: 'wind_chimes', volume: 40 }
    ]
  },
  {
    id: 'rainy_guitar_coffee',
    name: 'Quán quen & Guitar mộc',
    subtitle: 'Tiếng đàn guitar mộc mạc bên khung cửa sổ chiều mưa rào',
    icon: 'acoustic_guitar',
    theme: 'coffee',
    sounds: [
      { id: 'acoustic_guitar', volume: 60 },
      { id: 'rain', volume: 50 },
      { id: 'coffee_shop', volume: 45 },
      { id: 'kalimba', volume: 40 }
    ]
  },
  {
    id: 'deep_forest',
    name: 'Rừng chiều an yên',
    subtitle: 'Tiếng suối, chim rừng hót và gió luồn qua cành lá xào xạc',
    icon: 'wind_leaves',
    theme: 'forest',
    sounds: [
      { id: 'stream', volume: 65 },
      { id: 'birds', volume: 60 },
      { id: 'wind_leaves', volume: 55 },
      { id: 'swaying_grass', volume: 45 }
    ]
  },
  {
    id: 'deep_sleep',
    name: 'Giấc ngủ sâu & Chữa lành',
    subtitle: 'Tiếng dế rả rích, mưa đêm và tiếng ồn nâu đưa bạn vào giấc ngủ',
    icon: 'moon',
    theme: 'night',
    sounds: [
      { id: 'brown_noise', volume: 65 },
      { id: 'rain_roof', volume: 50 },
      { id: 'crickets', volume: 45 }
    ]
  }
];

class PresetManager {
  constructor(engine) {
    this.engine = engine;
    this.customPresetsKey = 'zenvibe_custom_presets';
    this.customPresets = this.loadCustomPresets();
  }

  loadCustomPresets() {
    try {
      const data = localStorage.getItem(this.customPresetsKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Lỗi đọc preset từ localStorage:', e);
      return [];
    }
  }

  saveCustomPresets() {
    try {
      localStorage.setItem(this.customPresetsKey, JSON.stringify(this.customPresets));
    } catch (e) {
      console.warn('Lỗi lưu preset vào localStorage:', e);
    }
  }

  // Áp dụng một preset (dừng các âm khác, bật các âm trong preset với volume chuẩn)
  applyPreset(preset) {
    if (!preset || !preset.sounds) return;

    // Tắt các âm thanh hiện tại
    this.engine.stopAll(0.2);

    // Kích hoạt các âm thanh trong preset
    setTimeout(() => {
      preset.sounds.forEach(item => {
        this.engine.setChannelVolume(item.id, item.volume);
        this.engine.startSound(item.id);
      });
      // Bắn event để UI cập nhật
      window.dispatchEvent(new CustomEvent('zen:preset_applied', { detail: preset }));
    }, 250);
  }

  // Lấy danh sách âm thanh hiện tại đang phát để lưu thành preset mới
  getCurrentMix(presetName) {
    const activeSounds = [];
    for (const [id, channel] of this.engine.channels.entries()) {
      if (channel.isPlaying) {
        activeSounds.push({
          id: id,
          volume: channel.volume
        });
      }
    }
    if (activeSounds.length === 0) return null;

    return {
      id: 'custom_' + Date.now(),
      name: presetName || 'Phối âm của tôi',
      subtitle: `${activeSounds.length} âm thanh được phối`,
      icon: '🎵',
      theme: 'custom',
      sounds: activeSounds,
      isCustom: true,
      createdAt: new Date().toLocaleDateString('vi-VN')
    };
  }

  addCustomPreset(preset) {
    if (!preset) return false;
    this.customPresets.unshift(preset);
    this.saveCustomPresets();
    window.dispatchEvent(new CustomEvent('zen:presets_updated'));
    return true;
  }

  deleteCustomPreset(presetId) {
    this.customPresets = this.customPresets.filter(p => p.id !== presetId);
    this.saveCustomPresets();
    window.dispatchEvent(new CustomEvent('zen:presets_updated'));
  }
}

window.DEFAULT_PRESETS = DEFAULT_PRESETS;
window.PresetManager = PresetManager;
