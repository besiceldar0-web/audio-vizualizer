/**
 * Playlist - Upravljanje plejlistom pesama
 */
class Playlist {
    constructor(playlistElementId, playlistEmptyId) {
        this.playlistEl = document.getElementById(playlistElementId);
        this.playlistEmptyEl = document.getElementById(playlistEmptyId);
        this.songs = [];
        this.currentIndex = -1;
        this.onSongChange = null; // Callback
    }

    /**
     * Dodaj pesmu u plejlistu
     */
    addSong(songData) {
        const song = {
            id: Date.now() + Math.random(),
            name: songData.name || 'Nepoznata pesma',
            file: songData.file || null,
            url: songData.url || null,
            duration: songData.duration || 0,
            type: songData.file ? 'file' : 'url'
        };
        
        this.songs.push(song);
        this.render();
        
        // Ako je prva pesma, selektuj je
        if (this.songs.length === 1) {
            this.selectSong(0);
        }
        
        return song;
    }

    /**
     * Ukloni pesmu iz plejliste
     */
    removeSong(songId) {
        const index = this.songs.findIndex(s => s.id === songId);
        if (index === -1) return;
        
        // Ako je trenutna pesma obrisana
        if (index === this.currentIndex) {
            this.currentIndex = -1;
        } else if (index < this.currentIndex) {
            this.currentIndex--;
        }
        
        this.songs.splice(index, 1);
        this.render();
        
        // Ako nema više pesama
        if (this.songs.length === 0) {
            this.currentIndex = -1;
            if (this.onSongChange) this.onSongChange(null);
        } else if (index === this.currentIndex) {
            this.selectSong(Math.min(this.currentIndex, this.songs.length - 1));
        }
    }

    /**
     * Selektuj pesmu po indeksu
     */
    selectSong(index) {
        if (index < 0 || index >= this.songs.length) return null;
        
        this.currentIndex = index;
        const song = this.songs[index];
        
        // Ažuriraj aktivni element u listi
        this.render();
        
        if (this.onSongChange) {
            this.onSongChange(song);
        }
        
        return song;
    }

    /**
     * Sledeća pesma
     */
    next() {
        if (this.songs.length === 0) return null;
        
        let nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.songs.length) {
            nextIndex = 0; // Loop
        }
        
        return this.selectSong(nextIndex);
    }

    /**
     * Prethodna pesma
     */
    previous() {
        if (this.songs.length === 0) return null;
        
        let prevIndex = this.currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.songs.length - 1; // Loop
        }
        
        return this.selectSong(prevIndex);
    }

    /**
     * Dobavi trenutnu pesmu
     */
    getCurrentSong() {
        if (this.currentIndex >= 0 && this.currentIndex < this.songs.length) {
            return this.songs[this.currentIndex];
        }
        return null;
    }

    /**
     * Renderuj plejlistu u DOM
     */
    render() {
        if (!this.playlistEl) return;
        
        this.playlistEl.innerHTML = '';
        
        if (this.songs.length === 0) {
            if (this.playlistEmptyEl) {
                this.playlistEmptyEl.style.display = 'block';
            }
            return;
        }
        
        if (this.playlistEmptyEl) {
            this.playlistEmptyEl.style.display = 'none';
        }
        
        this.songs.forEach((song, index) => {
            const li = document.createElement('li');
            
            if (index === this.currentIndex) {
                li.classList.add('active');
            }
            
            li.innerHTML = `
                <div class="song-info">
                    <div class="song-name">${this.escapeHtml(song.name)}</div>
                    <div class="song-meta">${song.type === 'file' ? '📁 Uploadovano' : '🎵 Demo'}</div>
                </div>
                <button class="remove-song" data-id="${song.id}" title="Ukloni">×</button>
            `;
            
            // Klik na pesmu
            li.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-song')) return;
                this.selectSong(index);
            });
            
            // Dugme za uklanjanje
            li.querySelector('.remove-song').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeSong(song.id);
            });
            
            this.playlistEl.appendChild(li);
        });
    }

    /**
     * Escape HTML za sigurnost
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Da li je plejlista prazna?
     */
    isEmpty() {
        return this.songs.length === 0;
    }
}