const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 0.15;
const FREQUENCY_HZ = 880;
const AMPLITUDE = 0.5;

const numSamples = Math.floor(SAMPLE_RATE * DURATION_SECONDS);
const samples = new Int16Array(numSamples);

for (let i = 0; i < numSamples; i++) {
  const t = i / SAMPLE_RATE;
  // Fade the last 20% of the beep to zero so playback doesn't click on cutoff.
  const fadeStart = numSamples * 0.8;
  const envelope = i > fadeStart ? (numSamples - i) / (numSamples - fadeStart) : 1;
  const sample = Math.sin(2 * Math.PI * FREQUENCY_HZ * t) * AMPLITUDE * envelope;
  samples[i] = Math.round(sample * 32767);
}

const dataSize = samples.length * 2;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate (mono, 16-bit)
buffer.writeUInt16LE(2, 32); // block align
buffer.writeUInt16LE(16, 34); // bits per sample
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < samples.length; i++) {
  buffer.writeInt16LE(samples[i], 44 + i * 2);
}

const outDir = path.join(__dirname, '..', 'assets', 'audio');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'beep.wav');
fs.writeFileSync(outPath, buffer);
console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
