#!/usr/bin/env python3
"""
generate_instruments.py
Synthesizes high-fidelity, sample-accurate, seamless loop relaxing audio tracks
for the 4 new sound groups:
1. Ambient & Sound Bath: Singing Bowl, Handpan, Tongue Drum
2. Organic & Warm Percussion: Kalimba, Temple Woodblock, Rainstick
3. Acoustic Strings: Celtic Harp, Acoustic Guitar, Zen Zither (Guzheng), Warm Cello
4. Wind Instruments: Bamboo Flute (Bansuri), Clay Ocarina, Pan Flute
"""

import math
import random
import struct
import subprocess
import os
import wave

SAMPLE_RATE = 44100
LOOP_DURATION = 28.0  # 28.0 seconds exact loop
FADE_DURATION = 2.5   # 2.5s seamless crossfade
TOTAL_DURATION = LOOP_DURATION + FADE_DURATION
N_SAMPLES = int(SAMPLE_RATE * LOOP_DURATION)
N_FADE = int(SAMPLE_RATE * FADE_DURATION)
TOTAL_SAMPLES = N_SAMPLES + N_FADE

OUTPUT_DIR = "assets/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def apply_seamless_loop(left, right):
    """Equal-power sine/cosine crossfade tail into head for gapless loop"""
    out_left = left[:N_SAMPLES]
    out_right = right[:N_SAMPLES]
    
    for i in range(N_FADE):
        frac = i / float(N_FADE)
        fade_in = math.sin(frac * math.pi * 0.5)
        fade_out = math.cos(frac * math.pi * 0.5)
        
        tail_l = left[N_SAMPLES + i] if (N_SAMPLES + i) < len(left) else 0.0
        tail_r = right[N_SAMPLES + i] if (N_SAMPLES + i) < len(right) else 0.0
        
        out_left[i] = out_left[i] * fade_in + tail_l * fade_out
        out_right[i] = out_right[i] * fade_in + tail_r * fade_out
        
    return out_left, out_right

def normalize_and_export(left, right, filename):
    """Normalize stereo buffer to -1.5 dB peak and export as AAC M4A via afconvert"""
    peak = 0.0001
    for i in range(len(left)):
        if abs(left[i]) > peak: peak = abs(left[i])
        if abs(right[i]) > peak: peak = abs(right[i])
        
    target_peak = 0.84  # -1.5 dBFS
    gain = target_peak / peak
    
    raw_data = bytearray()
    for i in range(len(left)):
        val_l = max(-32767, min(32767, int(left[i] * gain * 32767)))
        val_r = max(-32767, min(32767, int(right[i] * gain * 32767)))
        raw_data += struct.pack('<hh', val_l, val_r)
        
    wav_path = f"/tmp/{filename}.wav"
    m4a_path = os.path.join(OUTPUT_DIR, f"{filename}.m4a")
    
    with wave.open(wav_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(raw_data)
        
    # Convert to AAC m4a using macOS afconvert
    cmd = ["/usr/bin/afconvert", "-f", "m4af", "-d", "aac", "-b", "128000", wav_path, m4a_path]
    subprocess.run(cmd, check=True)
    if os.path.exists(wav_path):
        os.remove(wav_path)
    print(f"Generated: {m4a_path} ({os.path.getsize(m4a_path) / 1024:.1f} KB)")


# =========================================================================
# 1. GROUP 1: AMBIENT & SOUND BATH
# =========================================================================

def gen_singing_bowl():
    """Tibetan Singing Bowl with deep 216Hz fundamental, non-harmonic overtones,
       mallet rubbing pulsation (0.8Hz) and 1Hz theta brainwave binaural spread."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    # 2 Main Strikes: at 0.5s and 14.5s
    strike_times = [0.5, 14.5]
    partials = [
        (216.0, 0.85, 14.0),     # Fundamental A3
        (585.36, 0.40, 10.0),    # 2.71x
        (1172.88, 0.22, 6.5),    # 5.43x
        (1753.92, 0.10, 4.0),    # 8.12x
        (2440.0, 0.05, 2.5)      # 11.3x
    ]
    
    # Add sustained singing rim-rub drone
    for i in range(TOTAL_SAMPLES):
        t = i / SAMPLE_RATE
        rub_mod = 0.5 + 0.5 * math.sin(2 * math.pi * 0.75 * t)
        drone_l = math.sin(2 * math.pi * 215.5 * t) * (0.12 * rub_mod)
        drone_r = math.sin(2 * math.pi * 216.5 * t) * (0.12 * rub_mod)
        # Overtone warmth
        drone_l += math.sin(2 * math.pi * 585.0 * t) * (0.04 * rub_mod)
        drone_r += math.sin(2 * math.pi * 586.0 * t) * (0.04 * rub_mod)
        left[i] += drone_l
        right[i] += drone_r
        
    # Add strikes
    for st in strike_times:
        start_idx = int(st * SAMPLE_RATE)
        for i in range(start_idx, TOTAL_SAMPLES):
            dt = (i - start_idx) / SAMPLE_RATE
            for freq, amp, decay in partials:
                env = math.exp(-dt / decay)
                # Strike transient pop
                transient = math.exp(-dt / 0.03) * 0.3 * math.sin(2 * math.pi * 440 * dt)
                s_l = (math.sin(2 * math.pi * (freq - 0.5) * dt) + transient) * (amp * env)
                s_r = (math.sin(2 * math.pi * (freq + 0.5) * dt) + transient) * (amp * env)
                left[i] += s_l * 0.7
                right[i] += s_r * 0.7
                
    return apply_seamless_loop(left, right)


def gen_handpan():
    """Handpan / Hang Drum in D minor Celtic scale (D3 Ding, A3, C4, D4, E4, F4, G4, A4)
       with ceramic transient strike, Helmholtz resonance (82Hz), and melodic phrasing."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    # Notes: (start_time, freq, pan_l, pan_r)
    notes = [
        (0.6, 146.83, 0.7, 0.7),   # Ding D3
        (3.8, 220.00, 0.8, 0.5),   # A3
        (7.2, 293.66, 0.5, 0.8),   # D4
        (10.6, 349.23, 0.9, 0.4),  # F4
        (14.2, 146.83, 0.7, 0.7),  # Ding D3
        (17.6, 329.63, 0.4, 0.9),  # E4
        (21.0, 261.63, 0.8, 0.5),  # C4
        (24.4, 220.00, 0.5, 0.8)   # A3
    ]
    
    for st, f0, pan_l, pan_r in notes:
        start_idx = int(st * SAMPLE_RATE)
        for i in range(start_idx, TOTAL_SAMPLES):
            dt = (i - start_idx) / SAMPLE_RATE
            if dt > 5.0: break
            
            # Strike transient
            trans = math.exp(-dt / 0.006) * 0.45 * (random.random() * 2 - 1)
            # Body resonance & harmonics
            pitch_bend = f0 * (1.0 + 0.015 * math.exp(-dt / 0.025))
            fund = math.sin(2 * math.pi * pitch_bend * dt) * math.exp(-dt / 2.8)
            octave = math.sin(2 * math.pi * f0 * 2.0 * dt) * 0.45 * math.exp(-dt / 2.0)
            fifth = math.sin(2 * math.pi * f0 * 3.0 * dt) * 0.20 * math.exp(-dt / 1.4)
            helmholtz = math.sin(2 * math.pi * 82.0 * dt) * 0.28 * math.exp(-dt / 1.8)
            
            sample = (fund + octave + fifth + helmholtz + trans)
            left[i] += sample * pan_l
            right[i] += sample * pan_r
            
    return apply_seamless_loop(left, right)


def gen_tongue_drum():
    """Steel Tongue Drum in soothing Akebono / Pentatonic scale
       with warm pure tones and soft mallet attack."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    melody = [
        (0.5, 164.81, 0.6, 0.6),   # E3
        (3.6, 246.94, 0.8, 0.4),   # B3
        (6.8, 261.63, 0.4, 0.8),   # C4
        (10.0, 329.63, 0.7, 0.5),  # E4
        (13.5, 164.81, 0.6, 0.6),  # E3
        (16.8, 349.23, 0.5, 0.8),  # F4
        (20.2, 261.63, 0.8, 0.4),  # C4
        (23.8, 246.94, 0.4, 0.7)   # B3
    ]
    
    for st, f0, pl, pr in melody:
        start_idx = int(st * SAMPLE_RATE)
        for i in range(start_idx, TOTAL_SAMPLES):
            dt = (i - start_idx) / SAMPLE_RATE
            if dt > 4.5: break
            
            # Soft rubber mallet attack
            attack = min(1.0, dt / 0.008)
            env = attack * math.exp(-dt / 2.6)
            s = math.sin(2 * math.pi * f0 * dt) + 0.35 * math.sin(2 * math.pi * f0 * 2.0 * dt) * math.exp(-dt / 1.8)
            s += 0.08 * math.sin(2 * math.pi * f0 * 3.01 * dt) * math.exp(-dt / 1.0)
            
            left[i] += s * env * pl
            right[i] += s * env * pr
            
    return apply_seamless_loop(left, right)


# =========================================================================
# 2. GROUP 2: ORGANIC & WARM PERCUSSION
# =========================================================================

def gen_kalimba():
    """African Thumb Piano / Kalimba with metal tine ping and mahogany wood soundboard buzz."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    notes = [
        (0.4, 261.63, 0.6, 0.6),   # C4
        (1.8, 329.63, 0.8, 0.4),   # E4
        (3.4, 392.00, 0.4, 0.8),   # G4
        (5.0, 523.25, 0.7, 0.5),   # C5
        (7.2, 329.63, 0.5, 0.7),   # E4
        (9.0, 440.00, 0.8, 0.4),   # A4
        (11.2, 392.00, 0.4, 0.8),  # G4
        (13.6, 261.63, 0.6, 0.6),  # C4
        (15.4, 329.63, 0.7, 0.5),  # E4
        (17.6, 392.00, 0.5, 0.8),  # G4
        (19.8, 440.00, 0.8, 0.4),  # A4
        (22.2, 523.25, 0.4, 0.8),  # C5
        (24.6, 392.00, 0.6, 0.6)   # G4
    ]
    
    for st, f0, pl, pr in notes:
        start_idx = int(st * SAMPLE_RATE)
        for i in range(start_idx, TOTAL_SAMPLES):
            dt = (i - start_idx) / SAMPLE_RATE
            if dt > 3.2: break
            
            # Metal tine chime (non-harmonic 4.2x mode)
            tine = math.sin(2 * math.pi * f0 * dt) * math.exp(-dt / 1.8)
            tine_overtone = math.sin(2 * math.pi * f0 * 4.2 * dt) * 0.3 * math.exp(-dt / 0.4)
            # Wood box thump
            wood = math.sin(2 * math.pi * 210.0 * dt) * 0.25 * math.exp(-dt / 0.08)
            
            val = (tine + tine_overtone + wood)
            left[i] += val * pl
            right[i] += val * pr
            
    return apply_seamless_loop(left, right)


def gen_temple_wood():
    """Zen Temple Woodblock (Mõ thiền) and Buddhist wooden clapper with hollow camphor wood ring."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    strike_times = [1.2, 5.5, 10.0, 14.8, 19.5, 24.2]
    
    for st in strike_times:
        start_idx = int(st * SAMPLE_RATE)
        for i in range(start_idx, TOTAL_SAMPLES):
            dt = (i - start_idx) / SAMPLE_RATE
            if dt > 2.5: break
            
            # Hollow woodblock physical strike: 520Hz + 740Hz + 1150Hz
            w1 = math.sin(2 * math.pi * 520.0 * dt) * math.exp(-dt / 0.09)
            w2 = math.sin(2 * math.pi * 740.0 * dt) * 0.6 * math.exp(-dt / 0.06)
            w3 = math.sin(2 * math.pi * 1150.0 * dt) * 0.3 * math.exp(-dt / 0.03)
            # Mallet impact click
            click = (random.random() * 2 - 1) * math.exp(-dt / 0.008) * 0.4
            # Deep hollow body
            cavity = math.sin(2 * math.pi * 280.0 * dt) * 0.3 * math.exp(-dt / 0.15)
            
            val = (w1 + w2 + w3 + click + cavity)
            # Gentle room reflection
            reverb = val * 0.2 * math.exp(-dt / 0.8)
            
            left[i] += val + reverb
            right[i] += val * 0.95 + reverb
            
    return apply_seamless_loop(left, right)


def gen_rainstick():
    """Bamboo Rainstick & Shaker: Thousands of tiny seed grains cascading inside hollow bamboo."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    random.seed(42)
    # Granular acoustic trickling
    # LFO envelope for gentle wave swells of seed flow
    for i in range(TOTAL_SAMPLES):
        t = i / SAMPLE_RATE
        swell = 0.65 + 0.35 * math.sin(2 * math.pi * (1.0 / 7.0) * t)
        
        # Micro clicks
        if random.random() < 0.18:
            grain_dur = 0.008 + random.random() * 0.015
            freq = 1400.0 + random.random() * 2800.0
            pan = random.random()
            grain_val = (random.random() * 2 - 1) * 0.35 * swell
            left[i] += grain_val * pan
            right[i] += grain_val * (1.0 - pan)
            
    # Smoothing filter across buffer
    for ch, buf in [(0, left), (1, right)]:
        filtered = 0.0
        for i in range(TOTAL_SAMPLES):
            filtered = 0.88 * filtered + 0.12 * buf[i]
            buf[i] = filtered
            
    return apply_seamless_loop(left, right)


# =========================================================================
# 3. GROUP 3: ACOUSTIC STRINGS
# =========================================================================

def gen_celtic_harp():
    """Celestial Celtic Harp arpeggio flowing serenely in D major."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    # Harp arpeggio sequence
    melody = [
        (0.4, 293.66, 0.7, 0.5),   # D4
        (1.6, 369.99, 0.5, 0.8),   # F#4
        (2.8, 440.00, 0.8, 0.4),   # A4
        (4.0, 587.33, 0.4, 0.8),   # D5
        (6.0, 392.00, 0.7, 0.5),   # G4
        (7.2, 493.88, 0.5, 0.7),   # B4
        (8.4, 587.33, 0.8, 0.4),   # D5
        (9.6, 739.99, 0.4, 0.8),   # F#5
        (11.8, 440.00, 0.7, 0.5),  # A4
        (13.2, 587.33, 0.5, 0.8),  # D5
        (14.8, 293.66, 0.6, 0.6),  # D4
        (16.4, 369.99, 0.8, 0.4),  # F#4
        (18.0, 440.00, 0.4, 0.8),  # A4
        (19.6, 587.33, 0.7, 0.5),  # D5
        (21.4, 392.00, 0.5, 0.7),  # G4
        (23.0, 493.88, 0.8, 0.4),  # B4
        (24.8, 587.33, 0.6, 0.6)   # D5
    ]
    
    for st, f0, pl, pr in melody:
        start_idx = int(st * SAMPLE_RATE)
        for i in range(start_idx, TOTAL_SAMPLES):
            dt = (i - start_idx) / SAMPLE_RATE
            if dt > 4.5: break
            
            # Harp string pluck harmonics
            f1 = math.sin(2 * math.pi * f0 * dt) * math.exp(-dt / 3.0)
            f2 = math.sin(2 * math.pi * f0 * 2.0 * dt) * 0.45 * math.exp(-dt / 2.2)
            f3 = math.sin(2 * math.pi * f0 * 3.0 * dt) * 0.22 * math.exp(-dt / 1.4)
            f4 = math.sin(2 * math.pi * f0 * 4.0 * dt) * 0.10 * math.exp(-dt / 0.8)
            snap = math.exp(-dt / 0.008) * 0.2 * (random.random() * 2 - 1)
            
            val = (f1 + f2 + f3 + f4 + snap)
            left[i] += val * pl
            right[i] += val * pr
            
    return apply_seamless_loop(left, right)


def gen_acoustic_guitar():
    """Warm fingerpicked nylon acoustic guitar in 60 BPM folk tranquil style."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    chords = [
        # Measure 1: D chord
        (0.5, 146.83, 0.6, 0.6),  # D3 bass
        (1.4, 293.66, 0.8, 0.4),  # D4
        (2.2, 369.99, 0.4, 0.8),  # F#4
        (3.0, 440.00, 0.7, 0.5),  # A4
        # Measure 2: G chord
        (4.2, 98.00, 0.6, 0.6),   # G2 bass
        (5.1, 246.94, 0.8, 0.4),  # B3
        (6.0, 293.66, 0.4, 0.8),  # D4
        (6.8, 392.00, 0.7, 0.5),  # G4
        # Measure 3: Bm chord
        (8.0, 123.47, 0.6, 0.6),  # B2 bass
        (8.9, 246.94, 0.8, 0.4),  # B3
        (9.8, 293.66, 0.4, 0.8),  # D4
        (10.7, 369.99, 0.7, 0.5), # F#4
        # Measure 4: A chord
        (12.0, 110.00, 0.6, 0.6), # A2 bass
        (12.9, 220.00, 0.8, 0.4), # A3
        (13.8, 277.18, 0.4, 0.8), # C#4
        (14.6, 329.63, 0.7, 0.5), # E4
        # Repeat with gentle variation
        (16.0, 146.83, 0.6, 0.6),
        (16.9, 293.66, 0.8, 0.4),
        (17.8, 369.99, 0.4, 0.8),
        (18.6, 440.00, 0.7, 0.5),
        (20.0, 98.00, 0.6, 0.6),
        (20.9, 246.94, 0.8, 0.4),
        (21.8, 293.66, 0.4, 0.8),
        (22.6, 392.00, 0.7, 0.5),
        (24.0, 146.83, 0.6, 0.6),
        (25.2, 440.00, 0.7, 0.5)
    ]
    
    for st, f0, pl, pr in chords:
        start_idx = int(st * SAMPLE_RATE)
        for i in range(start_idx, TOTAL_SAMPLES):
            dt = (i - start_idx) / SAMPLE_RATE
            if dt > 3.8: break
            
            # Nylon string harmonic decay
            f1 = math.sin(2 * math.pi * f0 * dt) * math.exp(-dt / 2.6)
            f2 = math.sin(2 * math.pi * f0 * 2.0 * dt) * 0.4 * math.exp(-dt / 1.8)
            f3 = math.sin(2 * math.pi * f0 * 3.0 * dt) * 0.2 * math.exp(-dt / 1.2)
            body = math.sin(2 * math.pi * 115.0 * dt) * 0.25 * math.exp(-dt / 0.18)
            
            val = (f1 + f2 + f3 + body)
            left[i] += val * pl
            right[i] += val * pr
            
    return apply_seamless_loop(left, right)


def gen_zen_zither():
    """Zen Guzheng / Koto zither with silk string plucks and gentle pitch bends."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    plucks = [
        (0.6, 293.66, 0.7, 0.5),   # D4
        (3.5, 329.63, 0.5, 0.8),   # E4
        (6.8, 369.99, 0.8, 0.4),   # F#4
        (10.2, 440.00, 0.4, 0.8),  # A4
        (14.0, 220.00, 0.6, 0.6),  # A3 (deep)
        (17.5, 293.66, 0.8, 0.4),  # D4
        (20.8, 493.88, 0.4, 0.8),  # B4
        (24.2, 440.00, 0.6, 0.6)   # A4
    ]
    
    for st, f0, pl, pr in plucks:
        start_idx = int(st * SAMPLE_RATE)
        for i in range(start_idx, TOTAL_SAMPLES):
            dt = (i - start_idx) / SAMPLE_RATE
            if dt > 4.8: break
            
            # Characteristic Guzheng left-hand bend
            bend = 1.0 + 0.04 * math.sin(2 * math.pi * 3.5 * dt) if dt > 0.4 else 1.0
            cur_f = f0 * bend
            
            s1 = math.sin(2 * math.pi * cur_f * dt) * math.exp(-dt / 3.2)
            s2 = math.sin(2 * math.pi * cur_f * 2.0 * dt) * 0.35 * math.exp(-dt / 2.0)
            s3 = math.sin(2 * math.pi * cur_f * 3.0 * dt) * 0.15 * math.exp(-dt / 1.2)
            plectrum = math.exp(-dt / 0.006) * 0.3 * (random.random() * 2 - 1)
            
            val = (s1 + s2 + s3 + plectrum)
            left[i] += val * pl
            right[i] += val * pr
            
    return apply_seamless_loop(left, right)


def gen_warm_cello():
    """Deep Warm Cello Bowed Drones in C2 & G2 (65Hz / 98Hz) for somatic grounding."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    # Breathing drone cycle: 7-second swells
    f_c2 = 65.41
    f_g2 = 97.99
    
    for i in range(TOTAL_SAMPLES):
        t = i / SAMPLE_RATE
        # Slow cello bow breathing vibrato (4.5Hz)
        vib = 1.0 + 0.008 * math.sin(2 * math.pi * 4.2 * t)
        # Slow acoustic breathing dynamics
        swell = 0.5 + 0.5 * math.sin(2 * math.pi * (1.0 / 7.0) * t)
        
        # C2 string (warm saw filtered)
        c2_tone = (
            math.sin(2 * math.pi * f_c2 * vib * t) * 0.70 +
            math.sin(2 * math.pi * f_c2 * 2.0 * vib * t) * 0.45 +
            math.sin(2 * math.pi * f_c2 * 3.0 * vib * t) * 0.25 +
            math.sin(2 * math.pi * f_c2 * 4.0 * vib * t) * 0.12
        )
        # G2 string (fifth harmony)
        g2_tone = (
            math.sin(2 * math.pi * f_g2 * vib * t) * 0.55 +
            math.sin(2 * math.pi * f_g2 * 2.0 * vib * t) * 0.30 +
            math.sin(2 * math.pi * f_g2 * 3.0 * vib * t) * 0.15
        )
        # Bow rosin texture
        rosin = (random.random() * 2 - 1) * 0.04
        
        sig = (c2_tone + g2_tone + rosin) * swell
        left[i] = sig * 0.8
        right[i] = sig * 0.75 + math.sin(2 * math.pi * (f_g2 + 0.5) * t) * 0.15 * swell
        
    return apply_seamless_loop(left, right)


# =========================================================================
# 4. GROUP 4: WIND INSTRUMENTS
# =========================================================================

def gen_bamboo_flute():
    """Zen Bamboo Flute (Bansuri / Shakuhachi) with breathy air embouchure and meditative bends."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    # Meditative flute phrases: (start_t, dur, freq, pan_l, pan_r)
    phrases = [
        (0.8, 4.5, 349.23, 0.7, 0.5),   # F4
        (6.0, 5.0, 392.00, 0.5, 0.8),   # G4
        (11.8, 5.2, 440.00, 0.8, 0.4),  # A4
        (17.8, 4.8, 523.25, 0.4, 0.8),  # C5
        (23.2, 4.6, 440.00, 0.6, 0.6)   # A4
    ]
    
    for st, dur, f0, pl, pr in phrases:
        start_idx = int(st * SAMPLE_RATE)
        end_idx = min(TOTAL_SAMPLES, int((st + dur) * SAMPLE_RATE))
        
        for i in range(start_idx, end_idx):
            dt = (i - start_idx) / SAMPLE_RATE
            # Flute envelope: gentle breath in (0.4s), sustained tone, breath out (0.6s)
            if dt < 0.4:
                env = math.sin((dt / 0.4) * math.pi * 0.5)
            elif dt > (dur - 0.6):
                env = math.sin(((dur - dt) / 0.6) * math.pi * 0.5)
            else:
                env = 1.0
                
            # Shakuhachi micro-vibrato (4.2 Hz) and pitch bend
            vib = 1.0 + 0.012 * math.sin(2 * math.pi * 4.2 * dt)
            # Subtle pitch bend up at beginning
            bend = 1.0 - 0.03 * math.exp(-dt / 0.15)
            cur_f = f0 * vib * bend
            
            # Harmonic richness of bamboo tube
            tone = (
                math.sin(2 * math.pi * cur_f * dt) * 0.85 +
                math.sin(2 * math.pi * cur_f * 2.0 * dt) * 0.35 +
                math.sin(2 * math.pi * cur_f * 3.0 * dt) * 0.15
            )
            # Breath air noise
            breath = (random.random() * 2 - 1) * 0.12 * env
            
            val = (tone + breath) * env
            left[i] += val * pl
            right[i] += val * pr
            
    return apply_seamless_loop(left, right)


def gen_clay_ocarina():
    """Warm Clay Ocarina: Sweet, hollow, soothing vessel flute tones."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    notes = [
        (0.6, 3.8, 523.25, 0.7, 0.5),   # C5
        (5.0, 4.2, 587.33, 0.5, 0.8),   # D5
        (10.0, 4.0, 659.25, 0.8, 0.4),  # E5
        (14.8, 4.5, 783.99, 0.4, 0.8),  # G5
        (20.0, 4.2, 659.25, 0.7, 0.5),  # E5
        (24.6, 3.2, 523.25, 0.6, 0.6)   # C5
    ]
    
    for st, dur, f0, pl, pr in notes:
        start_idx = int(st * SAMPLE_RATE)
        end_idx = min(TOTAL_SAMPLES, int((st + dur) * SAMPLE_RATE))
        for i in range(start_idx, end_idx):
            dt = (i - start_idx) / SAMPLE_RATE
            if dt < 0.3:
                env = math.sin((dt / 0.3) * math.pi * 0.5)
            elif dt > (dur - 0.5):
                env = math.sin(((dur - dt) / 0.5) * math.pi * 0.5)
            else:
                env = 1.0
                
            vib = 1.0 + 0.008 * math.sin(2 * math.pi * 4.6 * dt)
            cur_f = f0 * vib
            
            # Ocarina is very close to pure sine with soft second harmonic
            tone = math.sin(2 * math.pi * cur_f * dt) * 0.90 + math.sin(2 * math.pi * cur_f * 2.0 * dt) * 0.12
            air = (random.random() * 2 - 1) * 0.06 * env
            
            val = (tone + air) * env
            left[i] += val * pl
            right[i] += val * pr
            
    return apply_seamless_loop(left, right)


def gen_pan_flute():
    """Serene Andean / Romanian Pan Flute with airy chiff attack and pastoral resonance."""
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    melody = [
        (0.8, 3.6, 392.00, 0.7, 0.5),   # G4
        (4.8, 3.8, 440.00, 0.5, 0.8),   # A4
        (9.2, 4.2, 523.25, 0.8, 0.4),   # C5
        (14.0, 4.5, 587.33, 0.4, 0.8),  # D5
        (19.2, 4.0, 440.00, 0.7, 0.5),  # A4
        (23.8, 3.8, 392.00, 0.6, 0.6)   # G4
    ]
    
    for st, dur, f0, pl, pr in melody:
        start_idx = int(st * SAMPLE_RATE)
        end_idx = min(TOTAL_SAMPLES, int((st + dur) * SAMPLE_RATE))
        for i in range(start_idx, end_idx):
            dt = (i - start_idx) / SAMPLE_RATE
            if dt < 0.25:
                env = math.sin((dt / 0.25) * math.pi * 0.5)
            elif dt > (dur - 0.4):
                env = math.sin(((dur - dt) / 0.4) * math.pi * 0.5)
            else:
                env = 1.0
                
            vib = 1.0 + 0.010 * math.sin(2 * math.pi * 5.0 * dt)
            cur_f = f0 * vib
            
            # Pipe attack chiff transient (airy puff)
            chiff = (random.random() * 2 - 1) * 0.22 * math.exp(-dt / 0.05)
            tone = (
                math.sin(2 * math.pi * cur_f * dt) * 0.85 +
                math.sin(2 * math.pi * cur_f * 2.0 * dt) * 0.28 +
                math.sin(2 * math.pi * cur_f * 3.0 * dt) * 0.12
            )
            air = (random.random() * 2 - 1) * 0.08 * env
            
            val = (tone + chiff + air) * env
            left[i] += val * pl
            right[i] += val * pr
            
    return apply_seamless_loop(left, right)


# =========================================================================
# MAIN DISPATCH
# =========================================================================

def main():
    print("Beginning high-fidelity synthesis for 12 new relaxing instruments...")
    
    generators = [
        # Group 1: Sound Bath
        ("singing_bowl_seamless", gen_singing_bowl),
        ("handpan_seamless", gen_handpan),
        ("tongue_drum_seamless", gen_tongue_drum),
        
        # Group 2: Organic Percussion
        ("kalimba_seamless", gen_kalimba),
        ("temple_wood_seamless", gen_temple_wood),
        ("rainstick_seamless", gen_rainstick),
        
        # Group 3: Acoustic Strings
        ("celtic_harp_seamless", gen_celtic_harp),
        ("acoustic_guitar_seamless", gen_acoustic_guitar),
        ("zen_zither_seamless", gen_zen_zither),
        ("warm_cello_seamless", gen_warm_cello),
        
        # Group 4: Wind Instruments
        ("bamboo_flute_seamless", gen_bamboo_flute),
        ("ocarina_seamless", gen_clay_ocarina),
        ("pan_flute_seamless", gen_pan_flute)
    ]
    
    for filename, gen_fn in generators:
        print(f"Synthesizing {filename}...")
        l, r = gen_fn()
        normalize_and_export(l, r, filename)
        
    print("ALL 12 RELAXING INSTRUMENTS GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
