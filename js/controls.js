/**
 * Controls - Upravljanje UI kontrolama i interakcijama
 */
class Controls {
    constructor(audioEngine, playlist, visualizer) {
        this.audioEngine = audioEngine;
        this.playlist = playlist;
        this.visualizer = visualizer;
        
        // UI elementi
        this.playBtn = document.getElementById('playBtn');
        this.playIcon = document.getElementById('playIcon');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.progressSlider = document.getElementById('progressSlider');
        this.progressFill = document.getElementById('progressFill');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.toggleVizBtn = document.getElementById('toggleVizBtn');
        this.vizIcon = document.getElementById('vizIcon');
        this.vizText = document.getElementById('vizText');
        this.addSongBtn = document.getElementById('addSongBtn');
        this.fileInput = document.getElementById('fileInput');
        this.trackName = document.getElementById('trackName');
        this.trackArtist = document.getElementById('trackArtist');
        this.artIcon = document.querySelector('.art-icon');
        this.statusMessage = document.getElementById('statusMessage');
        
        this.isDragging = false;
        this.statusTimeout = null;
        
        this.bindEvents();
        this.startProgressUpdate();
    }

    /**
     * Poveži sve event listenere
     */
    bindEvents() {
        // Play / Pause
        this.playBtn.addEventListener('click', () => this.handlePlayPause());
        
        // Prev / Next / Stop
        this.prevBtn.addEventListener('click', () => this.handlePrev());
        this.nextBtn.addEventListener('click', () => this.handleNext());
        this.stopBtn.addEventListener('click', () => this.handleStop());
        
        // Progress slider
        this.progressSlider.addEventListener('input', () => this.handleProgressInput());
        this.progressSlider.addEventListener('change', () => this.handleProgressChange());
        
        // Audio ended event
        if (this.audioEngine.audioElement) {
            this.audioEngine.audioElement.addEventListener('ended', () => this.handleSongEnd());
            this.audioEngine.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
        }
        
        // Volume
        this.volumeSlider.addEventListener('input', () => this.handleVolumeChange());
        
        // Toggle vizualizacija
        this.toggleVizBtn.addEventListener('click', () => this.handleToggleViz());
        
        // Dodaj pesmu
        this.addSongBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Plejlista callback
        this.playlist.onSongChange = (song) => this.handlePlaylistSongChange(song);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Play / Pause handler
     */
    async handlePlayPause() {
        try {
            if (!this.audioEngine.isInitialized) {
                await this.audioEngine.initialize();
                this.bindEvents(); // Ponovo poveži nakon inicijalizacije
            }
            
            if (this.playlist.isEmpty()) {
                this.showStatus('Dodajte pesmu u plejlistu!', 'error');
                return;
            }
            
            await this.audioEngine.togglePlay();
            this.updatePlayButton();
            
            if (this.audioEngine.isPlaying()) {
                this.visualizer.start(this.audioEngine);
            }
        } catch (error) {
            console.error('Greška pri play/pause:', error);
            this.showStatus('Greška pri reprodukciji', 'error');
        }
    }

    /**
     * Prethodna pesma
     */
    async handlePrev() {
        try {
            if (!this.audioEngine.isInitialized) {
                await this.audioEngine.initialize();
            }
            
            const song = this.playlist.previous();
            if (song) {
                await this.loadAndPlaySong(song);
            }
        } catch (error) {
            console.error('Greška pri prethodnoj pesmi:', error);
        }
    }

    /**
     * Sledeća pesma
     */
    async handleNext() {
        try {
            if (!this.audioEngine.isInitialized) {
                await this.audioEngine.initialize();
            }
            
            const song = this.playlist.next();
            if (song) {
                await this.loadAndPlaySong(song);
            }
        } catch (error) {
            console.error('Greška pri sledećoj pesmi:', error);
        }
    }

    /**
     * Stop
     */
    handleStop() {
        this.audioEngine.stop();
        this.visualizer.stop();
        this.updatePlayButton();
        this.updateProgressDisplay();
    }

    /**
     * Progress slider
     */
    handleProgressInput() {
        if (!this.audioEngine.getDuration()) return;
        const value = parseFloat(this.progressSlider.value);
        const time = (value / 100) * this.audioEngine.getDuration();
        this.currentTimeEl.textContent = this.formatTime(time);
    }

    handleProgressChange() {
        if (!this.audioEngine.getDuration()) return;
        const value = parseFloat(this.progressSlider.value);
        const time = (value / 100) * this.audioEngine.getDuration();
        this.audioEngine.seek(time);
        this.updateProgressDisplay();
    }

    /**
     * Volume promena
     */
    handleVolumeChange() {
        const value = parseInt(this.volumeSlider.value) / 100;
        this.audioEngine.setVolume(value);
        this.volumeValue.textContent = Math.round(value * 100) + '%';
    }

    /**
     * Toggle vizualizacija
     */
    handleToggleViz() {
        const isVisible = this.visualizer.toggleVisibility();
        if (isVisible) {
            this.vizIcon.textContent = '👁️';
            this.vizText.textContent = 'Vizualizacija: ON';
        } else {
            this.vizIcon.textContent = '🚫';
            this.vizText.textContent = 'Vizualizacija: OFF';
        }
    }

    /**
     * Upload fajlova
     */
    async handleFileUpload(event) {
        const files = Array.from(event.target.files);
        
        if (files.length === 0) return;
        
        for (const file of files) {
            // Validacija
            const extension = file.name.split('.').pop().toLowerCase();
            if (!['mp3', 'wav'].includes(extension)) {
                this.showStatus(`Fajl "${file.name}" nije MP3/WAV format!`, 'error');
                continue;
            }
            
            try {
                if (!this.audioEngine.isInitialized) {
                    await this.audioEngine.initialize();
                }
                
                const songData = await this.audioEngine.loadAudio(file);
                this.playlist.addSong(songData);
                this.showStatus(`Dodato: ${file.name}`);
            } catch (error) {
                console.error('Greška pri uploadu:', error);
                this.showStatus('Greška pri učitavanju fajla', 'error');
            }
        }
        
        // Resetuj file input
        this.fileInput.value = '';
    }

    /**
     * Promena pesme u plejlisti
     */
    async handlePlaylistSongChange(song) {
        if (!song) return;
        
        try {
            await this.loadAndPlaySong(song);
        } catch (error) {
            console.error('Greška pri promeni pesme:', error);
        }
    }

    /**
     * Učitaj i reprodukuj pesmu
     */
    async loadAndPlaySong(song) {
        try {
            // Zaustavi prethodnu reprodukciju
            this.audioEngine.stop();
            this.visualizer.stop();
            
            // Učitaj novu pesmu
            if (song.type === 'file' && song.file) {
                await this.audioEngine.loadAudio(song.file);
            } else if (song.type === 'url' && song.url) {
                await this.audioEngine.loadAudioFromURL(song.url, song.name);
            }
            
            // Sačekaj da se metapodaci učitaju
            await new Promise((resolve) => {
                const onLoaded = () => {
                    this.audioEngine.audioElement.removeEventListener('loadedmetadata', onLoaded);
                    resolve();
                };
                this.audioEngine.audioElement.addEventListener('loadedmetadata', onLoaded);
                
                // Timeout ako se metadata ne učita
                setTimeout(resolve, 2000);
            });
            
            // Reprodukuj
            await this.audioEngine.play();
            this.updatePlayButton();
            this.updateDuration();
            this.visualizer.start(this.audioEngine);
            
            // Ažuriraj UI
            this.trackName.textContent = song.name;
            this.trackArtist.textContent = song.type === 'file' ? 'Uploadovana pesma' : 'Demo numera';
            this.artIcon.textContent = '🎵';
            
        } catch (error) {
            console.error('Greška pri učitavanju pesme:', error);
            this.showStatus('Greška pri reprodukciji pesme', 'error');
        }
    }

    /**
     * Kraj pesme - automatski sledeća
     */
    handleSongEnd() {
        const song = this.playlist.next();
        if (song) {
            this.loadAndPlaySong(song);
        } else {
            this.handleStop();
        }
    }

    /**
     * Keyboard shortcuts
     */
    handleKeyboard(e) {
        // Space za play/pause
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            this.handlePlayPause();
        }
        // Arrow left/right za prev/next
        if (e.code === 'ArrowLeft' && e.ctrlKey) {
            e.preventDefault();
            this.handlePrev();
        }
        if (e.code === 'ArrowRight' && e.ctrlKey) {
            e.preventDefault();
            this.handleNext();
        }
    }

    /**
     * Periodično ažuriranje progress bara
     */
    startProgressUpdate() {
        setInterval(() => {
            if (this.audioEngine.isPlaying()) {
                this.updateProgressDisplay();
            }
        }, 100);
    }

    /**
     * Ažuriraj prikaz progress bara
     */
    updateProgressDisplay() {
        const current = this.audioEngine.getCurrentTime();
        const duration = this.audioEngine.getDuration();
        
        if (duration > 0) {
            const percentage = (current / duration) * 100;
            this.progressSlider.value = percentage;
            this.progressFill.style.width = percentage + '%';
        }
        
        this.currentTimeEl.textContent = this.formatTime(current);
    }

    /**
     * Ažuriraj prikaz trajanja
     */
    updateDuration() {
        const duration = this.audioEngine.getDuration();
        this.durationEl.textContent = this.formatTime(duration);
        this.progressSlider.max = 100;
    }

    /**
     * Ažuriraj ikonicu play/pause
     */
    updatePlayButton() {
        if (this.audioEngine.isPlaying()) {
            this.playIcon.textContent = '⏸';
        } else {
            this.playIcon.textContent = '▶';
        }
    }

    /**
     * Formatiraj vreme u MM:SS
     */
    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Prikaz status poruke
     */
    showStatus(message, type = 'info') {
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }
        
        this.statusMessage.textContent = message;
        this.statusMessage.className = 'status-message show ' + type;
        
        this.statusTimeout = setTimeout(() => {
            this.statusMessage.classList.remove('show');
        }, 3000);
    }
}