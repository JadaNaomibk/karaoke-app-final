const audio = document.getElementById("karaoke-audio");
const selector = document.getElementById("song-selector");
const currentLyric = document.getElementById("current-lyric");
const prev = document.getElementById("prev-lyric");
const next = document.getElementById("next-lyric");
const visualizer = document.getElementById("visualizer");

let lyrics = [];
let currentIndex = 0;

let audioCtx, analyser, source, dataArray, bufferLength;

// Build visualizer bars
for (let i = 0; i < 32; i++) {
  const bar = document.createElement("div");
  visualizer.appendChild(bar);
}

// Load the selected song and lyrics
function loadSong(songName) {
  audio.src = `songs/${songName}.mp3`;

  fetch(`lyrics/${songName}.lrc`)
    .then(res => res.text())
    .then(parseLRC)
    .catch(() => {
      currentLyric.textContent = "Lyrics not found, sorry deary.";
      prev.textContent = "";
      next.textContent = "";
    });
}

// Parse .lrc format into timestamped lines
function parseLRC(data) {
  const lines = data.split("\n");
  lyrics = lines.map(line => {
    const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
    if (!match) return null;
    const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
    return { time, text: match[3].trim() };
  }).filter(Boolean);

  currentIndex = 0;
}

// Initialize Web Audio API visualizer when audio starts
audio.addEventListener("play", () => {
  if (!audioCtx) {
    setupAudioAnalyzer();
    animateVisualizer();
  }

  requestAnimationFrame(updateLyrics);
});

// Web Audio API setup
function setupAudioAnalyzer() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  analyser.fftSize = 64;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
}

// Animate visualizer bars
function animateVisualizer() {
  analyser.getByteFrequencyData(dataArray);
  const bars = visualizer.children;

  for (let i = 0; i < bars.length; i++) {
    const value = dataArray[i];
    bars[i].style.height = `${value / 2}px`;

    const hue = (value * 2 + i * 10) % 360;
    bars[i].style.backgroundColor = `hsl(${hue}, 100%, 60%)`;
  }

  requestAnimationFrame(animateVisualizer);
}

// Lyrics sync logic
function updateLyrics() {
  const time = audio.currentTime;

  const nextIndex = lyrics.findIndex((line, i) => {
    const next = lyrics[i + 1];
    return time >= line.time && (!next || time < next.time);
  });

  if (nextIndex !== -1 && nextIndex !== currentIndex) {
    currentIndex = nextIndex;
    currentLyric.textContent = lyrics[currentIndex].text || "";
    prev.textContent = lyrics[currentIndex - 1]?.text || "";
    next.textContent = lyrics[currentIndex + 1]?.text || "";
  }

  requestAnimationFrame(updateLyrics);
}

// Handle dropdown song change
selector.addEventListener("change", (e) => {
  loadSong(e.target.value);
});

// Load default
loadSong("song1");
