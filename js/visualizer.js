/**
 * Visualizer - Crtanje frekvencijskih stubića i talasnog oblika na Canvas-u
 */
class Visualizer {
    constructor(freqCanvasId, waveCanvasId) {
        this.freqCanvas = document.getElementById(freqCanvasId);
        this.freqCtx = this.freqCanvas.getContext('2d');
        
        this.waveCanvas = document.getElementById(waveCanvasId);
        this.waveCtx = this.waveCanvas.getContext('2d');
        
        this.animationId = null;
        this.isRunning = false;
        this.isVisible = true;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Prilagodi veličinu canvas-a
     */
    resize() {
        // Frekvencijski canvas
        if (this.freqCanvas) {
            const rect = this.freqCanvas.parentElement.getBoundingClientRect();
            this.freqCanvas.width = rect.width * window.devicePixelRatio;
            this.freqCanvas.height = rect.height * window.devicePixelRatio;
            this.freqCanvas.style.width = rect.width + 'px';
            this.freqCanvas.style.height = rect.height + 'px';
            this.freqCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        
        // Talasni oblik canvas
        if (this.waveCanvas) {
            const rect = this.waveCanvas.parentElement.getBoundingClientRect();
            this.waveCanvas.width = rect.width * window.devicePixelRatio;
            this.waveCanvas.height = rect.height * window.devicePixelRatio;
            this.waveCanvas.style.width = rect.width + 'px';
            this.waveCanvas.style.height = rect.height + 'px';
            this.waveCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
    }

    /**
     * Pokreni vizualizaciju
     */
    start(audioEngine) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.audioEngine = audioEngine;
        this.animate();
    }

    /**
     * Zaustavi vizualizaciju
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.clear();
    }

    /**
     * Toggle vidljivost
     */
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        const panel = document.getElementById('vizPanel');
        if (panel) {
            panel.style.display = this.isVisible ? 'flex' : 'none';
        }
        return this.isVisible;
    }

    /**
     * Očisti canvas-e
     */
    clear() {
        if (this.freqCtx) {
            this.freqCtx.clearRect(0, 0, this.freqCanvas.width, this.freqCanvas.height);
        }
        if (this.waveCtx) {
            this.waveCtx.clearRect(0, 0, this.waveCanvas.width, this.waveCanvas.height);
        }
    }

    /**
     * Glavna animacijska petlja
     */
    animate() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (!this.isVisible) return;
        
        const freqData = this.audioEngine.getFrequencyData();
        const waveData = this.audioEngine.getWaveformData();
        
        if (freqData) this.drawFrequencyBars(freqData);
        if (waveData) this.drawWaveform(waveData);
    }

    /**
     * Crtanje frekvencijskih stubića
     */
    drawFrequencyBars(data) {
        const canvas = this.freqCanvas;
        const ctx = this.freqCtx;
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        
        // Očisti
        ctx.clearRect(0, 0, width, height);
        
        // Pozadina
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(10, 10, 30, 0.8)');
        gradient.addColorStop(1, 'rgba(26, 16, 64, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Broj stubića
        const barCount = data.length;
        const barWidth = (width / barCount) * 2.5;
        const barSpacing = 1;
        let x = 0;
        
        for (let i = 0; i < barCount; i++) {
            const value = data[i];
            const barHeight = (value / 255) * height * 0.9;
            
            // Gradijent boje za svaki stubić
            const hue = (i / barCount) * 280 + 200; // Plava do ljubičaste
            const barGradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
            barGradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.8)`);
            barGradient.addColorStop(0.5, `hsla(${hue}, 100%, 65%, 0.9)`);
            barGradient.addColorStop(1, `hsla(${hue}, 100%, 80%, 1)`);
            
            ctx.fillStyle = barGradient;
            
            // Zaobljeni vrh
            const radius = Math.min(barWidth / 2, 3);
            
            ctx.beginPath();
            ctx.moveTo(x, height);
            ctx.lineTo(x, height - barHeight + radius);
            ctx.quadraticCurveTo(x, height - barHeight, x + radius, height - barHeight);
            ctx.lineTo(x + barWidth - radius, height - barHeight);
            ctx.quadraticCurveTo(x + barWidth, height - barHeight, x + barWidth, height - barHeight + radius);
            ctx.lineTo(x + barWidth, height);
            ctx.closePath();
            ctx.fill();
            
            // Sjaj na vrhu
            if (barHeight > 5) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(x, height - barHeight, barWidth, 2);
            }
            
            x += barWidth + barSpacing;
        }
        
        // Refleksija
        ctx.globalAlpha = 0.15;
        ctx.scale(1, -1);
        ctx.drawImage(canvas, 0, -height * 2, width, height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
    }

    /**
     * Crtanje talasnog oblika
     */
    drawWaveform(data) {
        const canvas = this.waveCanvas;
        const ctx = this.waveCtx;
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        
        // Očisti
        ctx.clearRect(0, 0, width, height);
        
        // Pozadina
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(10, 10, 30, 0.8)');
        gradient.addColorStop(1, 'rgba(26, 16, 64, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Centralna linija
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Talasni oblik
        ctx.beginPath();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        
        const sliceWidth = width / data.length;
        let x = 0;
        
        for (let i = 0; i < data.length; i++) {
            const v = data[i] / 128.0;
            const y = (v * height) / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Drugi sloj - magenta glow
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 0, 170, 0.5)';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#ff00aa';
        ctx.shadowBlur = 8;
        
        x = 0;
        for (let i = 0; i < data.length; i++) {
            const v = data[i] / 128.0;
            const y = (v * height) / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}