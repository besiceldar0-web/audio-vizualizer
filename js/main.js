/**
 * Main - Glavna inicijalizacija aplikacije
 */
(function() {
    'use strict';
    
    // Sačekaj da se DOM učita
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
    });
    
    async function initApp() {
        try {
            // Inicijalizuj komponente
            const audioEngine = new AudioEngine();
            const visualizer = new Visualizer('visualizerCanvas', 'waveformCanvas');
            const playlist = new Playlist('playlist', 'playlistEmpty');
            const controls = new Controls(audioEngine, playlist, visualizer);
            
            // Učitaj demo numere
            await loadDemoTracks(audioEngine, playlist, controls);
            
            console.log('🎵 Audio Vizualizer - Aplikacija uspešno pokrenuta');
            console.log('💡 Saveti: Space = Play/Pause | Ctrl+Strelica = Prev/Next');
            
        } catch (error) {
            console.error('Greška pri inicijalizaciji aplikacije:', error);
        }
    }
    
    /**
     * Učitavanje demo numera
     * Napomena: Demo fajlove treba smestiti u /demo/ direktorijum
     */
    async function loadDemoTracks(audioEngine, playlist, controls) {
        const demoTracks = [
            {
                name: 'Demo Numera 1 - Synthwave',
                url: 'demo/track1.mp3'
            },
            {
                name: 'Demo Numera 2 - Lo-Fi Beat',
                url: 'demo/track2.mp3'
            },
            {
                name: 'Demo Numera 3 - Ambient',
                url: 'demo/track3.mp3'
            }
        ];
        
        for (const track of demoTracks) {
            try {
                // Proveri da li fajl postoji pre dodavanja
                const response = await fetch(track.url, { method: 'HEAD' });
                if (response.ok) {
                    playlist.addSong({
                        name: track.name,
                        url: track.url
                    });
                }
            } catch (error) {
                console.log(`Demo numera "${track.name}" nije dostupna. Biće preskočena.`);
            }
        }
        
        if (playlist.isEmpty()) {
            controls.showStatus('Demo numere nisu dostupne. Dodajte svoje MP3/WAV fajlove.', 'info');
        } else {
            controls.showStatus(`Učitano ${playlist.songs.length} demo numera. Kliknite Play! 🎵`);
        }
    }
})();