/**
 * icons.js
 * Thư viện Vector Icons (SVG) đồng bộ cho ZenVibe
 * Chuẩn hóa 100% theo phong cách tối giản, sắc nét của ứng dụng mẫu tham khảo (Image 1, 2, 3, 4)
 */

const ZenIcons = (() => {
  // Bảng mã SVG thuần với viewBox="0 0 24 24"
  const ICONS = {
    // Navigation & Common
    home: `<path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" fill="currentColor"/>`,
    spaces: `<path d="M12 2l2.4 5.6L20 10l-4.5 4.1 1.3 6.1-4.8-3.1-4.8 3.1 1.3-6.1L4 10l5.6-2.4L12 2zm7 13l.9 2.2 2.1.8-1.8 1.7.5 2.5-2-1.2-2 1.2.5-2.5-1.8-1.7 2.1-.8L19 15z" fill="currentColor"/>`,
    timer: `<circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 9v4l2.5 2.5M10 2h4M12 2v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
    save: `<path d="M17 3H7a2 2 0 00-2 2v16l7-4 7 4V5a2 2 0 00-2-2z" fill="currentColor"/>`,
    settings: `<path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
    
    // Playback Controls
    play: `<path d="M8 5.14v13.72a1 1 0 001.55.83l10.77-6.86a1 1 0 000-1.66L9.55 4.31A1 1 0 008 5.14z" fill="currentColor"/>`,
    pause: `<path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" fill="currentColor"/>`,
    volume_up: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    volume_mute: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    stop: `<rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor"/>`,
    close: `<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,

    // Accents & Badges
    sparkle: `<path d="M12 2l2.4 5.6L20 10l-4.5 4.1 1.3 6.1-4.8-3.1-4.8 3.1 1.3-6.1L4 10l5.6-2.4L12 2z" fill="currentColor"/>`,
    flame: `<path d="M12 2c.5 3 2.5 5 4.5 7 2.2 2.2 3.5 5.1 3.5 8 0 4.4-3.6 8-8 8s-8-3.6-8-8c0-3.9 2.5-7.3 5-10 1 3 2 4.5 3 5 0-3 1-8 2-10z" fill="currentColor"/>`,
    music: `<path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    lightning: `<path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" fill="currentColor"/>`,
    moon: `<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor"/>`,
    clock: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
    info: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="11" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,

    // Four Quick Action Tile Icons (Đồng bộ Dark Vector Glyphs như Hình 1 & 2)
    tile_rain: `<path d="M17.5 18H9a6 6 0 115.65-8A4 4 0 0118.5 14a3.5 3.5 0 01-1 4z" fill="none" stroke="#141322" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 20v2M12 20v2M16 20v2" stroke="#141322" stroke-width="2.4" stroke-linecap="round"/>`,
    tile_stream: `<path d="M12 2.7l5.7 5.7A8 8 0 116.3 8.4L12 2.7z" fill="none" stroke="#141322" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    tile_leaves: `<path d="M11 20A7 7 0 014 13C4 7 9 3 19 3c0 10-4 15-11 17z" fill="none" stroke="#141322" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 13c2.5-2.5 5.5-4 8-5" stroke="#141322" stroke-width="2.4" stroke-linecap="round"/>`,
    tile_thunder: `<path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" fill="#141322"/>`,

    // Sound Tracks Vector Icons
    rain: `<path d="M17.5 17H9a5 5 0 114.71-6.7A4 4 0 0118 13.5a3.5 3.5 0 01-.5 3.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 19v2M12 19v2M16 19v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    rain_roof: `<path d="M3 10.5L12 3l9 7.5v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 14v3M12 14v3M16 14v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    stream: `<path d="M12 2.7l5.7 5.7A8 8 0 116.3 8.4L12 2.7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    rivulet: `<path d="M3 8c3-2 6-2 9 0s6 2 9 0M3 13c3-2 6-2 9 0s6 2 9 0M3 18c3-2 6-2 9 0s6 2 9 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    ocean: `<path d="M2 10c2.5-1.8 5-1.8 7.5 0s5 1.8 7.5 0 5-1.8 5-1.8M2 15c2.5-1.8 5-1.8 7.5 0s5 1.8 7.5 0 5-1.8 5-1.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    wind_leaves: `<path d="M11 20A7 7 0 014 13C4 7 9 3 19 3c0 10-4 15-11 17z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 13c2.5-2.5 5.5-4 8-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    swaying_grass: `<path d="M5 21c2-6 5-11 10-14M6 21c4-4 8-6 13-7M4 21c0-7 2-13 6-17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    thunder: `<path d="M13 2L3 14h7l-2 8 10-12h-7l2-8z" fill="currentColor"/>`,
    campfire: `<path d="M12 2c.5 3 2.5 5 4.5 7 2.2 2.2 3.5 5.1 3.5 8 0 4.4-3.6 8-8 8s-8-3.6-8-8c0-3.9 2.5-7.3 5-10 1 3 2 4.5 3 5 0-3 1-8 2-10z" fill="currentColor"/><line x1="4" y1="21" x2="20" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    birds: `<path d="M3 10c3-3 6-3 9 0 3-3 6-3 9 0M7 15c2-2 4-2 6 0 2-2 4-2 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    crickets: `<path d="M4 14l4-4 4 4M8 10v10M16 8l-3 3 2 5M12 11l4-7M19 19l-3-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    cat_purr: `<path d="M12 13a4 4 0 100-8 4 4 0 000 8zm-5-8L5 2l3 1.5M17 5l2-3-3 1.5M12 14c-4 0-7 2.5-7 6h14c0-3.5-3-6-7-6z" fill="currentColor"/>`,
    coffee_shop: `<path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    office_typing: `<rect x="2" y="5" width="20" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><line x1="6" y1="9" x2="6.01" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="10" y1="9" x2="10.01" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="9" x2="14.01" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="18" y1="9" x2="18.01" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="7" y1="14" x2="17" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    clock_tick: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    wind_chimes: `<path d="M4 3h16M7 3v11M12 3v15M17 3v9M5 14l2 3 2-3M10 18l2 3 2-3M15 12l2 3 2-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    brown_noise: `<path d="M2 17c3-3 6-8 10-8s7 5 10 8M2 13c3-3 6-7 10-7s7 4 10 7M2 21c3-2 6-4 10-4s7 2 10 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    white_noise: `<path d="M2 12h2l2-6 3 12 3-10 2 8 3-4 2 2 3-2h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
  };

  /**
   * Tạo chuỗi SVG chuẩn hóa
   */
  function get(name, options = {}) {
    const {
      size = 22,
      className = '',
      color = 'currentColor',
      strokeWidth = null
    } = options;

    const inner = ICONS[name] || ICONS.sparkle;
    const styleAttr = color ? `style="color: ${color};"` : '';
    const classAttr = className ? `class="zen-svg ${className}"` : `class="zen-svg"`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" ${classAttr} ${styleAttr}>${inner}</svg>`;
  }

  /**
   * Lấy SVG cho từng ID âm thanh
   */
  function forSound(soundId, options = {}) {
    const map = {
      rain: 'rain',
      rain_roof: 'rain_roof',
      stream: 'stream',
      rivulet: 'rivulet',
      ocean: 'ocean',
      wind_leaves: 'wind_leaves',
      swaying_grass: 'swaying_grass',
      thunder: 'thunder',
      campfire: 'campfire',
      birds: 'birds',
      crickets: 'crickets',
      cat_purr: 'cat_purr',
      coffee_shop: 'coffee_shop',
      office_typing: 'office_typing',
      clock_tick: 'clock_tick',
      wind_chimes: 'wind_chimes',
      brown_noise: 'brown_noise',
      white_noise: 'white_noise'
    };
    const key = map[soundId] || 'sparkle';
    return get(key, { size: 24, ...options });
  }

  /**
   * Lấy SVG cho danh mục
   */
  function forCategory(catId, options = {}) {
    const map = {
      all: 'sparkle',
      nature: 'leaf',
      fauna: 'birds',
      space: 'coffee_shop',
      relax: 'moon'
    };
    const key = map[catId] || 'sparkle';
    return get(key, { size: 18, ...options });
  }

  /**
   * Lấy SVG cho Presets
   */
  function forPreset(presetId, options = {}) {
    const map = {
      deep_forest: 'wind_leaves',
      rainy_coffee: 'coffee_shop',
      office_focus: 'office_typing',
      deep_sleep: 'moon',
      living_room_warmth: 'campfire',
      nature_meadow: 'swaying_grass'
    };
    const key = map[presetId] || 'spaces';
    return get(key, { size: 20, ...options });
  }

  return {
    get,
    forSound,
    forCategory,
    forPreset,
    ICONS
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZenIcons;
}
