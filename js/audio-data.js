/**
 * audio-data.js
 * Danh mục âm thanh thư giãn ZenVibe với chất lượng thu âm thực tế chân thực nhất
 * Chuẩn bị vòng lặp mượt mà (seamless loop), dải tần êm dịu, không gắt, không rè.
 */

const SOUND_CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: '✨' },
  { id: 'nature', name: 'Thiên nhiên & Cây cỏ', icon: '🍃' },
  { id: 'fauna', name: 'Chim muông & Sinh vật', icon: '🐦' },
  { id: 'space', name: 'Không gian & Làm việc', icon: '☕' },
  { id: 'relax', name: 'Thư giãn & Giấc ngủ', icon: '🌙' }
];

const SOUND_ITEMS = [
  // --- THIÊN NHIÊN & CÂY CỎ ---
  {
    id: 'rain',
    name: 'Mưa rào êm dịu',
    category: 'nature',
    icon: '🌧️',
    description: 'Tiếng mưa rơi đều ngoài trời, êm dịu giải tỏa căng thẳng và mỏi mệt',
    type: 'audio_sample',
    audioSrc: 'assets/audio/rain_seamless.m4a',
    audioSrcFallback: 'assets/audio/light_rainfall.mp3',
    synthType: 'rain',
    defaultVolume: 65,
    tag: 'Âm thanh tự nhiên'
  },
  {
    id: 'rain_roof',
    name: 'Mưa trên mái hiên',
    category: 'nature',
    icon: '🏠',
    description: 'Tiếng mưa lộp độp êm ái trên mái hiên và cửa kính, tạo cảm giác ấm cúng',
    type: 'audio_sample',
    audioSrc: 'assets/audio/rain_roof_seamless.m4a',
    audioSrcFallback: 'assets/audio/rain_roof.mp3',
    synthType: 'rain_roof',
    defaultVolume: 60,
    tag: 'Ấm áp'
  },
  {
    id: 'stream',
    name: 'Suối chảy róc rách',
    category: 'nature',
    icon: '💧',
    description: 'Dòng suối tự nhiên êm đềm luồn qua khe đá mát rượi, thanh lọc tâm trí',
    type: 'audio_sample',
    audioSrc: 'assets/audio/stream_seamless.m4a',
    audioSrcFallback: 'assets/audio/stream_brook.mp3',
    synthType: 'stream_synth',
    defaultVolume: 65,
    tag: 'Âm thanh tự nhiên'
  },
  {
    id: 'rivulet',
    name: 'Suối rừng róc rách',
    category: 'nature',
    icon: '🏞️',
    description: 'Tiếng bọt nước cuộn róc rách sống động của dòng suối nhỏ giữa rừng sâu',
    type: 'audio_sample',
    audioSrc: 'assets/audio/rivulet_seamless.m4a',
    audioSrcFallback: 'assets/audio/stream_rivulet.mp3',
    synthType: 'stream_synth',
    defaultVolume: 60,
    tag: 'Tươi mát'
  },
  {
    id: 'ocean',
    name: 'Sóng biển vỗ bờ',
    category: 'nature',
    icon: '🌊',
    description: 'Từng đợt sóng biển dập dềnh êm ái xô bờ cát, ru êm tâm trí',
    type: 'audio_sample',
    audioSrc: 'assets/audio/ocean_seamless.m4a',
    audioSrcFallback: 'assets/audio/ocean_raw.mp3',
    synthType: 'ocean',
    defaultVolume: 50,
    tag: 'Sâu lắng'
  },
  {
    id: 'wind_leaves',
    name: 'Gió thổi lá xào xạc',
    category: 'nature',
    icon: '🍃',
    description: 'Cơn gió thu luồn qua tán cây rừng, lá cây cọ xát xào xạc êm đềm',
    type: 'audio_sample',
    audioSrc: 'assets/audio/wind_leaves_seamless.m4a',
    audioSrcFallback: 'assets/audio/wind_leaves_raw.mp3',
    synthType: 'wind_leaves',
    defaultVolume: 55,
    tag: 'Đặc trưng'
  },
  {
    id: 'swaying_grass',
    name: 'Cỏ đồng nội lắc lư',
    category: 'nature',
    icon: '🌾',
    description: 'Đồng cỏ xanh mướt đu đưa, thì thầm êm ả theo từng đợt gió nhẹ',
    type: 'audio_sample',
    audioSrc: 'assets/audio/swaying_grass_seamless.m4a',
    audioSrcFallback: 'assets/audio/wind_leaves_raw.mp3',
    synthType: 'swaying_grass',
    defaultVolume: 50,
    tag: 'Êm đềm'
  },
  {
    id: 'thunder',
    name: 'Tiếng sấm xa êm dịu',
    category: 'nature',
    icon: '⚡',
    description: 'Tiếng sấm rền từ đằng xa trầm ấm, rầm rì lăn tăn qua các tầng mây êm đềm',
    type: 'audio_sample',
    audioSrc: 'assets/audio/thunder_seamless.m4a',
    audioSrcFallback: 'assets/audio/thunder_booming.mp3',
    synthType: 'thunder',
    defaultVolume: 55,
    tag: 'Rầm rì êm dịu'
  },
  {
    id: 'campfire',
    name: 'Lửa trại tí tách',
    category: 'nature',
    icon: '🔥',
    description: 'Ngọn lửa hồng ấm áp với tiếng củi nổ lách tách thư giãn phòng khách',
    type: 'audio_sample',
    audioSrc: 'assets/audio/campfire_seamless.m4a',
    audioSrcFallback: 'assets/audio/campfire_raw.mp3',
    synthType: 'campfire',
    defaultVolume: 50,
    tag: 'Ấm cúng'
  },

  // --- CHIM MUÔNG & SINH VẬT ---
  {
    id: 'birds',
    name: 'Chim rừng hót líu lo',
    category: 'fauna',
    icon: '🐦',
    description: 'Tiếng chim rừng chuyền cành cất tiếng hót tự nhiên lúc bình minh',
    type: 'audio_sample',
    audioSrc: 'assets/audio/birds_seamless.m4a',
    audioSrcFallback: 'assets/audio/birds_raw.mp3',
    synthType: 'birds',
    defaultVolume: 55,
    tag: 'Tươi mới'
  },
  {
    id: 'crickets',
    name: 'Dế đêm rả rích',
    category: 'fauna',
    icon: '🦗',
    description: 'Âm thanh đồng quê về đêm, mang lại cảm giác thanh bình và ngủ sâu',
    type: 'audio_sample',
    audioSrc: 'assets/audio/crickets_seamless.m4a',
    audioSrcFallback: 'assets/audio/crickets_raw.mp3',
    synthType: 'crickets',
    defaultVolume: 45,
    tag: 'Bình yên'
  },
  {
    id: 'cat_purr',
    name: 'Mèo gừ gừ êm ái',
    category: 'fauna',
    icon: '🐱',
    description: 'Tiếng thở gừ gừ rung ấm từ chú mèo nằm ngoan ngoãn bên bạn',
    type: 'audio_sample',
    audioSrc: 'assets/audio/cat_purr_seamless.m4a',
    audioSrcFallback: 'assets/audio/cat_purr_raw.mp3',
    synthType: 'cat_purr',
    defaultVolume: 60,
    tag: 'Chữa lành'
  },

  // --- KHÔNG GIAN & LÀM VIỆC ---
  {
    id: 'coffee_shop',
    name: 'Quán cà phê ấm cúng',
    category: 'space',
    icon: '☕',
    description: 'Tiếng ly tách lanh canh nhẹ nhàng, tiếng thì thầm không khí quán quen dễ chịu',
    type: 'audio_sample',
    audioSrc: 'assets/audio/coffee_shop_seamless.m4a',
    audioSrcFallback: 'assets/audio/coffee_shop_raw.mp3',
    synthType: 'coffee_shop',
    defaultVolume: 55,
    tag: 'Tập trung'
  },
  {
    id: 'office_typing',
    name: 'Văn phòng & Gõ phím cơ',
    category: 'space',
    icon: '⌨️',
    description: 'Nhịp gõ phím cơ êm ái kích thích tư duy và tinh thần làm việc năng suất',
    type: 'audio_sample',
    audioSrc: 'assets/audio/office_typing_seamless.m4a',
    audioSrcFallback: 'assets/audio/office_typing_raw.mp3',
    synthType: 'office_typing',
    defaultVolume: 45,
    tag: 'Năng suất'
  },
  {
    id: 'clock_tick',
    name: 'Đồng hồ quả lắc tích tắc',
    category: 'space',
    icon: '🕰️',
    description: 'Nhịp tích tắc gỗ đều đặn nơi phòng khách, giữ nhịp tập trung và hoài niệm',
    type: 'audio_sample',
    audioSrc: 'assets/audio/clock_tick_seamless.m4a',
    audioSrcFallback: 'assets/audio/clock_tick_raw.mp3',
    synthType: 'clock_tick',
    defaultVolume: 40,
    tag: 'Nhịp điệu'
  },

  // --- THƯ GIÃN & GIẤC NGỦ ---
  {
    id: 'wind_chimes',
    name: 'Chuông gió Koshi thiền tịnh',
    category: 'relax',
    icon: '🎐',
    description: 'Chuông gió Koshi thanh tao ngân vang theo gió, xua tan căng thẳng',
    type: 'audio_sample',
    audioSrc: 'assets/audio/wind_chimes_seamless.m4a',
    audioSrcFallback: 'assets/audio/wind_chimes_raw.mp3',
    synthType: 'wind_chimes',
    defaultVolume: 50,
    tag: 'Thanh tịnh'
  },
  {
    id: 'brown_noise',
    name: 'Tiếng ồn nâu (Brown Noise)',
    category: 'relax',
    icon: '🟤',
    description: 'Dải tần số trầm sâu ấm áp mô phỏng Brownian, tối ưu cho giấc ngủ sâu',
    type: 'procedural',
    synthType: 'brown_noise',
    defaultVolume: 55,
    tag: 'Ngủ sâu'
  },
  {
    id: 'white_noise',
    name: 'Tiếng ồn trắng (White Noise)',
    category: 'relax',
    icon: '⚪',
    description: 'Dải tần số cân bằng giúp che phủ tiếng ồn xung quanh khi học bài',
    type: 'procedural',
    synthType: 'white_noise',
    defaultVolume: 45,
    tag: 'Tập trung'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SOUND_CATEGORIES, SOUND_ITEMS };
}
