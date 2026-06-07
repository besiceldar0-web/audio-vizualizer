/**
 * AudioEngine - Upravljanje AudioContext-om, AnalyserNode-om i reprodukcijom
 */
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyserNode = null;
        this.sourceNode = null;
        this.audioElement = null;
        this.isInitialized = false;
        this.analyserData = null;
        this.waveformData = null;
        this.fftSize = 256;
    }

    /**
     * Inicijalizacija audio konteksta (mora biti pozvana nakon korisničke interakcije)
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Kreiraj audio element
            this.audioElement = new Audio();
            this.audioElement.crossOrigin = 'anonymous';
            
            // Kreiraj source node od audio elementa
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
            
            // Kreiraj AnalyserNode
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = this.fftSize;
            this.analyserNode.smoothingTimeConstant = 0.8;
            
            // Poveži: source -> analyser -> destination
            this.sourceNode.connect(this.analyserNode);
            this.analyserNode.connect(this.audioContext.destination);
            
            // Pripremi nizove za podatke
            const bufferLength = this.analyserNode.frequencyBinCount;
            this.analyserData = new Uint8Array(bufferLength);
            this.waveformData = new Uint8Array(bufferLength);
            
            this.isInitialized = true;
            console.log('AudioEngine inicijalizovan. Frekvencijski binovi:', bufferLength);
        } catch (error) {
            console.error('Greška pri inicijalizaciji AudioEngine:', error);
            throw error;
        }
    }

    /**
     * Učitaj audio fajl
     */
    async loadAudio(file) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const url = URL.createObjectURL(file);
        this.audioElement.src = url;
        this.audioElement.load();
        
        return {
            name: file.name.replace(/\.[^/.]+$/, ''),
            duration: 0,
            file: file
        };
    }

    /**
     * Učitaj audio sa URL-a (za demo fajlove)
     */
    async loadAudioFromURL(url, name = 'Demo Track') {
        if (!this.isInitialized) {
            await this.initialize();
        }

        this.audioElement.src = url;
        this.audioElement.load();
        
        return {
            name: name,
            duration: 0,
            url: url
        };
    }

    /**
     * Play
     */
    play() {
        if (!this.isInitialized) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        return this.audioElement.play();
    }

    /**
     * Pause
     */
    pause() {
        if (!this.isInitialized) return;
        this.audioElement.pause();
    }

    /**
     * Stop
     */
    stop() {
        if (!this.isInitialized) return;
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
    }

    /**
     * Toggle play/pause
     */
    togglePlay() {
        if (!this.isInitialized) return;
        
        if (this.audioElement.paused) {
            return this.play();
        } else {
            this.pause();
            return Promise.resolve();
        }
    }

    /**
     * Postavi vrijeme reprodukcije
     */
    seek(time) {
        if (!this.isInitialized) return;
        this.audioElement.currentTime = time;
    }

    /**
     * Postavi volumen
     */
    setVolume(value) {
        if (!this.isInitialized) return;
        this.audioElement.volume = value;
    }

    /**
     * Dobavi trenutno vrijeme
     */
    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : 0;
    }

    /**
     * Dobavi ukupno trajanje
     */
    getDuration() {
        return this.audioElement ? this.audioElement.duration || 0 : 0;
    }

    /**
     * Da li trenutno reprodukuje?
     */
    isPlaying() {
        return this.audioElement && !this.audioElement.paused;
    }

    /**
     * Dobavi podatke za vizualizaciju frekvencija
     */
    getFrequencyData() {
        if (!this.analyserNode) return this.analyserData;
        this.analyserNode.getByteFrequencyData(this.analyserData);
        return this.analyserData;
    }

    /**
     * Dobavi podatke za talasni oblik
     */
    getWaveformData() {
        if (!this.analyserNode) return this.waveformData;
        this.analyserNode.getByteTimeDomainData(this.waveformData);
        return this.waveformData;
    }

    /**
     * Očisti resurse
     */
    destroy() {
        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }
        if (this.analyserNode) {
            this.analyserNode.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.isInitialized = false;
    }
}