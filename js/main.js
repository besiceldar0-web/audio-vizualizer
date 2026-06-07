(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
    });
    
    async function initApp() {
        try {
            const audioEngine = new AudioEngine();
            const visualizer = new Visualizer('visualizerCanvas', 'waveformCanvas');
            const playlist = new Playlist('playlist', 'playlistEmpty');
            const controls = new Controls(audioEngine, playlist, visualizer);
            
            await loadDemoTracks(playlist, controls);
        } catch (error) {
            console.error('Greška:', error);
        }
    }
    
    async function loadDemoTracks(playlist, controls) {
        const demoTracks = [
            {
                name: 'Demo Numera 1 - Synthwave',
                file: 'track1.mp3'
            },
            {
                name: 'Demo Numera 2 - Lo-Fi Beat',
                file: 'track2.mp3'
            },
            {
                name: 'Demo Numera 3 - Ambient',
                file: 'track3.mp3'
            }
        ];
        
        let loadedCount = 0;
        
        for (const track of demoTracks) {
            try {
                const response = await fetch('demo/' + track.file);
                if (response.ok) {
                    const blob = await response.blob();
                    const file = new File([blob], track.file, { type: 'audio/mpeg' });
                    const url = URL.createObjectURL(file);
                    
                    playlist.addSong({
                        name: track.name,
                        url: url
                    });
                    loadedCount++;
                }
            } catch (error) {
                console.log('Nije dostupna: ' + track.name);
            }
        }
        
        if (playlist.isEmpty()) {
            controls.showStatus('Demo numere nisu dostupne. Dodajte svoje MP3/WAV fajlove.', 'info');
        } else {
            controls.showStatus('Ucitano ' + loadedCount + ' demo numera. Kliknite Play!');
        }
    }
})();
