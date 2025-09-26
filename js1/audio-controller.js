class AudioController {
    constructor() {
        this.audio = document.getElementById('background-audio');
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isPlaying = false;
        this.volume = 0.3;
        this.hasUserInteracted = false;
        
        this.init();
    }
    
    init() {
        this.setupAudioPermission();
        this.setupAudioControls();
        this.setupVisualizer();
        this.createAlternativeAudio();
    }
    
    createAlternativeAudio() {
        if (!this.audio.canPlayType('audio/wav')) {
            this.createProceduralMusic();
        }
    }
    
    createProceduralMusic() {
        const createAmbientTone = () => {
            if (!this.audioContext) return;
            
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator1.type = 'sine';
            oscillator1.frequency.setValueAtTime(110 + Math.random() * 50, this.audioContext.currentTime);
            
            oscillator2.type = 'triangle';
            oscillator2.frequency.setValueAtTime(220 + Math.random() * 100, this.audioContext.currentTime);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
            filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 2);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 8);
            
            oscillator1.connect(filter);
            oscillator2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator1.start(this.audioContext.currentTime);
            oscillator2.start(this.audioContext.currentTime);
            oscillator1.stop(this.audioContext.currentTime + 8);
            oscillator2.stop(this.audioContext.currentTime + 8);
            
            setTimeout(() => {
                if (this.isPlaying) {
                    createAmbientTone();
                }
            }, 6000 + Math.random() * 4000);
        };
        
        this.proceduralMusic = createAmbientTone;
    }
    
    setupAudioPermission() {
        const permissionOverlay = document.getElementById('audio-permission');
        const enableBtn = document.getElementById('enable-audio');
        const skipBtn = document.getElementById('skip-audio');
        
        // Force audio on first interaction
        const handleFirstInteraction = () => {
            if (!this.hasUserInteracted) {
                this.hasUserInteracted = true;
                this.enableAudio(); // Force enable audio immediately
                permissionOverlay.classList.add('hidden'); // Skip permission overlay
            }
            document.removeEventListener('click', handleFirstInteraction);
        };
        
        document.addEventListener('click', handleFirstInteraction);
        
        // Also try on any user interaction
        document.addEventListener('keydown', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);
        
        enableBtn.addEventListener('click', async () => {
            await this.enableAudio();
            permissionOverlay.classList.add('hidden');
        });
        
        skipBtn.addEventListener('click', () => {
            permissionOverlay.classList.add('hidden');
            // Still try to enable procedural music
            this.startProceduralMusic();
        });
    }
    
    async enableAudio() {
        try {
            // Create AudioContext only after user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Try to play audio file if available
            if (this.audio.children.length > 0) {
                this.audio.volume = this.volume;
                const playPromise = this.audio.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        this.isPlaying = true;
                        this.setupAudioAnalyser();
                        this.updateAudioButton();
                    }).catch(() => {
                        this.startProceduralMusic();
                    });
                }
            } else {
                // No audio file, start procedural music
                this.startProceduralMusic();
            }
        } catch (error) {
            this.startProceduralMusic();
        }
    }
    
    startProceduralMusic() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.proceduralMusic) {
            this.isPlaying = true;
            this.proceduralMusic();
            this.updateAudioButton();
        }
    }
    
    setupAudioAnalyser() {
        if (!this.audioContext) return;
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        
        const source = this.audioContext.createMediaElementSource(this.audio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.animateVisualizer();
    }
    
    setupAudioControls() {
        const audioToggle = document.getElementById('audio-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        
        audioToggle.addEventListener('click', () => {
            this.toggleAudio();
        });
        
        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        volumeSlider.value = this.volume * 100;
    }
    
    toggleAudio() {
        if (!this.hasUserInteracted) {
            document.getElementById('audio-permission').classList.remove('hidden');
            return;
        }
        
        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    }
    
    async playAudio() {
        try {
            if (this.audio.paused) {
                await this.audio.play();
            }
            this.isPlaying = true;
            if (this.proceduralMusic && !this.audio.currentTime) {
                this.proceduralMusic();
            }
        } catch (error) {
            this.startProceduralMusic();
        }
        
        this.updateAudioButton();
    }
    
    pauseAudio() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateAudioButton();
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
    }
    
    updateAudioButton() {
        const audioIcon = document.querySelector('.audio-icon');
        if (audioIcon) {
            audioIcon.textContent = this.isPlaying ? '🔊' : '🔇';
        }
    }
    
    setupVisualizer() {
        const bars = document.querySelectorAll('.audio-visualizer .bar');
        
        if (!bars.length) return;
        
        const animateBars = () => {
            bars.forEach((bar, index) => {
                const height = this.isPlaying ? 
                    (Math.random() * 20 + 5) + 'px' : 
                    '4px';
                bar.style.height = height;
            });
            
            requestAnimationFrame(animateBars);
        };
        
        animateBars();
    }
    
    animateVisualizer() {
        if (!this.analyser || !this.dataArray) return;
        
        const bars = document.querySelectorAll('.audio-visualizer .bar');
        
        const animate = () => {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            bars.forEach((bar, index) => {
                const dataIndex = Math.floor((index / bars.length) * this.dataArray.length);
                const height = (this.dataArray[dataIndex] / 255) * 25 + 4;
                bar.style.height = height + 'px';
            });
            
            if (this.isPlaying) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    getAudioData() {
        if (this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);
            return Array.from(this.dataArray);
        }
        
        // Generate more interesting fake data for visual effect
        return new Array(128).fill(0).map((_, i) => {
            if (!this.isPlaying) return 0;
            
            const time = Date.now() * 0.01;
            const bassFreq = Math.sin(time * 0.5 + i * 0.1) * 30 + 50;
            const midFreq = Math.sin(time * 1.2 + i * 0.05) * 40 + 60;
            const trebleFreq = Math.sin(time * 2.0 + i * 0.02) * 50 + 70;
            
            if (i < 32) return bassFreq;
            if (i < 96) return midFreq;
            return trebleFreq;
        });
    }
    
    getBassBeat() {
        const audioData = this.getAudioData();
        if (!audioData || !audioData.length) return 0;
        
        const bassEnd = Math.floor(audioData.length * 0.1);
        let bassSum = 0;
        
        for (let i = 0; i < bassEnd; i++) {
            bassSum += audioData[i];
        }
        
        return bassSum / bassEnd / 255;
    }
    
    getTrebleBeat() {
        const audioData = this.getAudioData();
        if (!audioData || !audioData.length) return 0;
        
        const trebleStart = Math.floor(audioData.length * 0.7);
        let trebleSum = 0;
        
        for (let i = trebleStart; i < audioData.length; i++) {
            trebleSum += audioData[i];
        }
        
        return trebleSum / (audioData.length - trebleStart) / 255;
    }
}

let audioController;

window.addEventListener('DOMContentLoaded', () => {
    audioController = new AudioController();
});

window.AudioController = AudioController;
window.audioController = audioController;