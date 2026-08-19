import base64
from io import BytesIO
import wave
import struct
import math

sample_rate = 44100
duration = 1.0 # 1 second loop
num_samples = int(sample_rate * duration)
audio_data = []

# Old school mechanical bell frequencies
freqs = [1200, 1550, 2150, 2750]

for i in range(num_samples):
    t = float(i) / sample_rate
    
    # Rapid mechanical hammer strikes at ~25 Hz
    # Using a harsh envelope for the strikes
    strike_env = (math.sin(2 * math.pi * 25 * t) + 1.0) / 2.0
    strike_env = strike_env ** 3 # make strikes sharper
    
    val = 0
    for f in freqs:
        val += math.sin(2 * math.pi * f * t) * 0.25
        val += math.sin(2 * math.pi * (f + 25) * t) * 0.15 # slight beating
        
    val *= strike_env
    
    # Add a little constant ringing (decay tail of the bell housing)
    ringing = 0
    for f in freqs:
        ringing += math.sin(2 * math.pi * f * t) * 0.05
        
    val += ringing
    
    # clip
    val = max(-1.0, min(1.0, val * 1.5))
    audio_data.append(int(val * 32767.0))

buf = BytesIO()
with wave.open(buf, 'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sample_rate)
    for sample in audio_data:
        wf.writeframesraw(struct.pack('<h', sample))

encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
js_code = 'export const BEEP_SOUND = "data:audio/wav;base64,' + encoded + '";\n'

with open('../frontend/src/components/bellSound.js', 'w', encoding='utf-8') as f:
    f.write(js_code)
