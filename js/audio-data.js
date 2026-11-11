/**
 * audio-data.js
 * Danh mục âm thanh thư giãn ZenVibe với chất lượng thu âm và vật lý âm thanh chân thực nhất
 * 100% Seamless hardware looping, dải tần êm dịu, không gắt, không rè.
 */

const SOUND_CATEGORIES = [
  { id: 'all', name: 'Tất cả' },
  { id: 'sound_bath', name: 'Chuông & Kim loại ngân' },
  { id: 'organic_percussion', name: 'Mộc & Gõ nhẹ' },
  { id: 'acoustic_strings', name: 'Dây gảy & Dây rung' },
  { id: 'wind_instruments', name: 'Nhạc cụ hơi' },
  { id: 'nature', name: 'Thiên nhiên & Cây cỏ' },
  { id: 'fauna', name: 'Chim muông & Sinh vật' },
  { id: 'space', name: 'Không gian & Làm việc' },
  { id: 'relax', name: 'Thư giãn & Giấc ngủ' }
];

const SOUND_ITEMS = [
  // ==========================================
  // 1. NHÓM CHUÔNG VÀ KIM LOẠI NGÂN (AMBIENT & SOUND BATH)
  // ==========================================
  {
    id: 'singing_bowl',
    name: 'Chuông xoay Tây Tạng',
    category: 'sound_bath',
    description: 'Âm thanh chuông đồng cổ truyền ngân vang sâu lắng, cộng hưởng sóng não Theta êm dịu',
    type: 'audio_sample',
    audioSrc: 'assets/audio/singing_bowl_seamless.m4a',
    synthType: 'singing_bowl',
    defaultVolume: 60,
    tag: 'Sound Bath'
  },
  {
    id: 'handpan',
    name: 'Trống đĩa Handpan',
    category: 'sound_bath',
    description: 'Giai điệu huyền ảo, thanh khiết từ trống đĩa kim loại đưa tâm trí vào cõi an tĩnh',
    type: 'audio_sample',
    audioSrc: 'assets/audio/handpan_seamless.m4a',
    synthType: 'handpan',
    defaultVolume: 55,
    tag: 'Du dương'
  },
  {
    id: 'tongue_drum',
    name: 'Trống lưỡi thép',
    category: 'sound_bath',
    description: 'Âm vang tròn đầy, thanh thoát tựa giọt nước rơi trên chuông đồng thiền tịnh',
    type: 'audio_sample',
    audioSrc: 'assets/audio/tongue_drum_seamless.m4a',
    synthType: 'tongue_drum',
    defaultVolume: 55,
    tag: 'Thanh thoát'
  },
  {
    id: 'wind_chimes',
    name: 'Chuông gió Koshi thiền tịnh',
    category: 'sound_bath',
    description: 'Chuông gió Koshi thanh tao ngân vang theo gió, xua tan căng thẳng và muộn phiền',
    type: 'audio_sample',
    audioSrc: 'assets/audio/wind_chimes_seamless.m4a',
    audioSrcFallback: 'assets/audio/wind_chimes_raw.mp3',
    synthType: 'wind_chimes',
    defaultVolume: 50,
    tag: 'Thanh tịnh'
  },

  // ==========================================
  // 2. NHÓM MỘC, GÕ NHẸ (ORGANIC & WARM PERCUSSION)
  // ==========================================
  {
    id: 'kalimba',
    name: 'Đàn phím gỗ Kalimba',
    category: 'organic_percussion',
    description: 'Những nốt gảy trong trẻo từ phím thép trên hộp gỗ gụ mộc mạc, nhẹ nhàng vỗ về',
    type: 'audio_sample',
    audioSrc: 'assets/audio/kalimba_seamless.m4a',
    synthType: 'kalimba',
    defaultVolume: 55,
    tag: 'Mộc mạc'
  },
  {
    id: 'temple_wood',
    name: 'Mõ thiền & Chày gỗ',
    category: 'organic_percussion',
    description: 'Tiếng mõ gỗ nguyên khối trầm ấm, định tâm và đưa hơi thở về trạng thái chánh niệm',
    type: 'audio_sample',
    audioSrc: 'assets/audio/temple_wood_seamless.m4a',
    synthType: 'temple_wood',
    defaultVolume: 50,
    tag: 'Chánh niệm'
  },
  {
    id: 'rainstick',
    name: 'Ống mưa & Hạt gỗ Shaker',
    category: 'organic_percussion',
    description: 'Dòng hạt khô luồn qua nan tre tí tách như cơn mưa rào dịu dàng giữa rừng',
    type: 'audio_sample',
    audioSrc: 'assets/audio/rainstick_seamless.m4a',
    synthType: 'rainstick',
    defaultVolume: 50,
    tag: 'Êm ái'
  },

  // ==========================================
  // 3. NHÓM DÂY GẢY VÀ DÂY RUNG (ACOUSTIC STRINGS)
  // ==========================================
  {
    id: 'celtic_harp',
    name: 'Đàn hạc Celtic Harp',
    category: 'acoustic_strings',
    description: 'Từng nốt rải trong vắt bồng bềnh tựa mây trời, mang lại cảm giác thanh thản vô bờ',
    type: 'audio_sample',
    audioSrc: 'assets/audio/celtic_harp_seamless.m4a',
    synthType: 'celtic_harp',
    defaultVolume: 55,
    tag: 'Thanh tao'
  },
  {
    id: 'acoustic_guitar',
    name: 'Guitar mộc Fingerstyle',
    category: 'acoustic_strings',
    description: 'Tiếng đàn guitar dây nylon ấm áp, gảy chậm rãi bên tách trà chiều bình yên',
    type: 'audio_sample',
    audioSrc: 'assets/audio/acoustic_guitar_seamless.m4a',
    synthType: 'acoustic_guitar',
    defaultVolume: 55,
    tag: 'Ấm áp'
  },
  {
    id: 'zen_zither',
    name: 'Đàn tranh Cổ tranh Guzheng',
    category: 'acoustic_strings',
    description: 'Giai điệu ngũ cung phương Đông thiền vị, thanh lọc tâm trí và khai mở tĩnh tại',
    type: 'audio_sample',
    audioSrc: 'assets/audio/zen_zither_seamless.m4a',
    synthType: 'zen_zither',
    defaultVolume: 50,
    tag: 'Thiền vị'
  },
  {
    id: 'warm_cello',
    name: 'Cello trầm ấm',
    category: 'acoustic_strings',
    description: 'Tiếng vĩ kéo trầm sâu của cây đàn Cello rung động lồng ngực, giải tỏa mọi căng cứng',
    type: 'audio_sample',
    audioSrc: 'assets/audio/warm_cello_seamless.m4a',
    synthType: 'warm_cello',
    defaultVolume: 55,
    tag: 'Sâu lắng'
  },

  // ==========================================
  // 4. NHÓM NHẠC CỤ HƠI (WIND INSTRUMENTS)
  // ==========================================
  {
    id: 'bamboo_flute',
    name: 'Sáo trúc thiền Bansuri',
    category: 'wind_instruments',
    description: 'Tiếng thở sáo trúc thênh thang giữa non ngàn, đưa tâm hồn về với sự tĩnh lặng tuyệt đối',
    type: 'audio_sample',
    audioSrc: 'assets/audio/bamboo_flute_seamless.m4a',
    synthType: 'bamboo_flute',
    defaultVolume: 50,
    tag: 'Thênh thang'
  },
  {
    id: 'ocarina',
    name: 'Sáo đất Ocarina',
    category: 'wind_instruments',
    description: 'Âm thanh sáo đất nung mộc mạc, tròn trịa, như làn gió mát thổi qua thảo nguyên',
    type: 'audio_sample',
    audioSrc: 'assets/audio/ocarina_seamless.m4a',
    synthType: 'ocarina',
    defaultVolume: 50,
    tag: 'Ngọt ngào'
  },
  {
    id: 'pan_flute',
    name: 'Sáo sậy Pan Flute',
    category: 'wind_instruments',
    description: 'Giai điệu sáo sậy du dương, hoang sơ và phóng khoáng giữa thung lũng bình minh',
    type: 'audio_sample',
    audioSrc: 'assets/audio/pan_flute_seamless.m4a',
    synthType: 'pan_flute',
    defaultVolume: 50,
    tag: 'Phóng khoáng'
  },

  // ==========================================
  // 5. THIÊN NHIÊN & CÂY CỎ
  // ==========================================
  {
    id: 'rain',
    name: 'Mưa rào êm dịu',
    category: 'nature',
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
    description: 'Ngọn lửa hồng ấm áp với tiếng củi nổ lách tách thư giãn phòng khách',
    type: 'audio_sample',
    audioSrc: 'assets/audio/campfire_seamless.m4a',
    audioSrcFallback: 'assets/audio/campfire_raw.mp3',
    synthType: 'campfire',
    defaultVolume: 50,
    tag: 'Ấm cúng'
  },

  // ==========================================
  // 6. CHIM MUÔNG & SINH VẬT
  // ==========================================
  {
    id: 'birds',
    name: 'Chim rừng hót líu lo',
    category: 'fauna',
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
    description: 'Tiếng thở gừ gừ rung ấm từ chú mèo nằm ngoan ngoãn bên bạn',
    type: 'audio_sample',
    audioSrc: 'assets/audio/cat_purr_seamless.m4a',
    audioSrcFallback: 'assets/audio/cat_purr_raw.mp3',
    synthType: 'cat_purr',
    defaultVolume: 60,
    tag: 'Chữa lành'
  },

  // ==========================================
  // 7. KHÔNG GIAN & LÀM VIỆC
  // ==========================================
  {
    id: 'coffee_shop',
    name: 'Quán cà phê ấm cúng',
    category: 'space',
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
    description: 'Nhịp tích tắc gỗ đều đặn nơi phòng khách, giữ nhịp tập trung và hoài niệm',
    type: 'audio_sample',
    audioSrc: 'assets/audio/clock_tick_seamless.m4a',
    audioSrcFallback: 'assets/audio/clock_tick_raw.mp3',
    synthType: 'clock_tick',
    defaultVolume: 40,
    tag: 'Nhịp điệu'
  },

  // ==========================================
  // 8. THƯ GIÃN & GIẤC NGỦ
  // ==========================================
  {
    id: 'brown_noise',
    name: 'Tiếng ồn nâu (Brown Noise)',
    category: 'relax',
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
