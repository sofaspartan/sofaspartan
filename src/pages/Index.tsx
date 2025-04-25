import { useState, useEffect } from 'react';
import { MusicPlayer } from '../components/MusicPlayer';
import { TrackList } from '../components/TrackList';
import { BackgroundOverlay } from '../components/BackgroundOverlay';
import Comments from '../components/Comments';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSoundcloud } from '@fortawesome/free-brands-svg-icons';
import * as mm from 'music-metadata';

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  albumArt: string | null;
}

const Index = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadTracks = async () => {
      // List of known songs in the songs directory
      const songFiles = [
        "Blazing Through Space.mp3", 
        "Lucid.mp3",     
	      "Static.mp3",
        "HappiErr.mp3",
        "Amped.mp3",
        "Powered Up.m4a",
        "Artificial Reality.mp3",
        "Icy Apex.m4a",
        "Funky Times in the Sewers.m4a",
        "Chasing Vapor.m4a",
        "Roar.mp3",

      ];

      // Create track entries for each audio file
      const trackFiles = songFiles.map((filename, index) => ({
        id: index + 1,
        title: filename.replace(/\.[^/.]+$/, ''), // Remove file extension
        artist: "sofaspartan", // Default artist name
        url: `/songs/${encodeURIComponent(filename)}`
      }));

      const tracksWithMetadata = await Promise.all(
        trackFiles.map(async (track) => {
          try {
            const response = await fetch(track.url);
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const mimeType = track.url.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';
            const metadata = await mm.parseBuffer(uint8Array, mimeType);
            
            console.log('Metadata:', metadata);
            console.log('Common metadata:', metadata.common);
            console.log('Pictures:', metadata.common.picture);
            
            let albumArt = null;
            if (metadata.common.picture && metadata.common.picture.length > 0) {
              const picture = metadata.common.picture[0];
              console.log('Picture format:', picture.format);
              console.log('Picture data length:', picture.data.length);
              
              // Convert Uint8Array to base64 using chunked approach
              const CHUNK_SIZE = 0x8000; // 32KB chunks
              const chunks = [];
              for (let i = 0; i < picture.data.length; i += CHUNK_SIZE) {
                const chunk = picture.data.slice(i, i + CHUNK_SIZE);
                chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
              }
              const base64 = btoa(chunks.join(''));
              albumArt = `data:${picture.format};base64,${base64}`;
              console.log('Generated album art URL:', albumArt);
            } else {
              console.log('No album art found in metadata');
            }

            return {
              ...track,
              title: metadata.common.title || track.title,
              artist: metadata.common.artist || track.artist,
              albumArt: albumArt || "/public/sofaspartan_artwork.png?w=400&h=400&fit=crop?w=400&h=400&fit=crop" // Fallback image
            };
          } catch (error) {
            console.error('Error loading track metadata:', error);
            return {
              ...track,
              albumArt: "/public/sofaspartan_artwork.png?w=400&h=400&fit=crop" // Fallback image
            };
          }
        })
      );

      setTracks(tracksWithMetadata);
    };

    loadTracks();
  }, []);

  const handleNextTrack = () => {
    if (currentTrackIndex === null) {
      setCurrentTrackIndex(0);
    } else {
      setCurrentTrackIndex((currentTrackIndex + 1) % tracks.length);
    }
  };

  const handlePreviousTrack = () => {
    if (currentTrackIndex === null) {
      setCurrentTrackIndex(tracks.length - 1);
    } else {
      setCurrentTrackIndex((currentTrackIndex - 1 + tracks.length) % tracks.length);
    }
  };

  const handleTrackSelect = (track: Track) => {
    console.log('Selected track:', track);
    const index = tracks.findIndex(t => t.id === track.id);
    console.log('Track index:', index);
    
    // If clicking the currently playing track, toggle play/pause
    if (currentTrackIndex === index) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        if (newIsPlaying) {
          audioElement.play().catch(error => {
            console.error('Error playing track:', error);
          });
        } else {
          audioElement.pause();
        }
      }
    } else {
      // If selecting a different track, play it
      setCurrentTrackIndex(index);
      setIsPlaying(true); // Ensure we set playing state to true when selecting a new track
      setTimeout(() => {
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          audioElement.play().catch(error => {
            console.error('Error playing track:', error);
          });
        }
      }, 100);
    }
  };

  // Add event listener for audio element to sync play state
  useEffect(() => {
    const audioElement = document.querySelector('audio');
    if (!audioElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <div className="min-h-screen relative">
      <BackgroundOverlay />
      <header className="py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            <div className="flex-shrink-0 flex justify-center">
              <img 
                src="/sofaspartan_logo_white_horizontal.png" 
                alt="Sofaspartan" 
                className="h-20 md:h-28"
              />
            </div>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            <span className="text-white">Hey, I'm Sofaspartan</span> — a bedroom producer blending chiptune, synthwave, and EDM into pixel-pumping, neon-charged soundscapes. My tracks don't just play, <i>they level up.</i>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto pb-24 relative z-10">
        <TrackList
          tracks={tracks}
          onTrackSelect={handleTrackSelect}
          currentTrack={currentTrackIndex !== null ? tracks[currentTrackIndex] : null}
          isPlaying={isPlaying}
          audioElement={document.querySelector('audio')}
        />
        
        {/* Comments Section */}
        <div className="mt-8">
          <Comments />
        </div>

        {/* Let's Connect Section */}
        <div className="mt-8 mb-32 text-center">
          <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Let's Connect:</h3>
          <div className="flex flex-row items-center justify-center gap-2 md:gap-4">
            <a 
              href="https://soundcloud.com/sofaspartan" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-0 md:gap-2 aspect-square w-10 h-10 md:aspect-auto md:px-4 md:py-2 md:w-auto md:h-auto rounded-full md:rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 group"
            >
              <FontAwesomeIcon icon={faSoundcloud} className="w-4 h-4 md:w-5 md:h-5 text-white/60 group-hover:text-white transition-colors" />
              <span className="hidden md:inline text-sm text-white/60 group-hover:text-white transition-colors">SoundCloud</span>
            </a>
            <a 
              href="https://www.instagram.com/sofaspartan/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-0 md:gap-2 aspect-square w-10 h-10 md:aspect-auto md:px-4 md:py-2 md:w-auto md:h-auto rounded-full md:rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 group"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white/60 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="hidden md:inline text-sm text-white/60 group-hover:text-white transition-colors">Instagram</span>
            </a>
            <a 
              href="mailto:sofaspartan.music@gmail.com"
              className="flex items-center justify-center gap-0 md:gap-2 aspect-square w-10 h-10 md:aspect-auto md:px-4 md:py-2 md:w-auto md:h-auto rounded-full md:rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 group"
            >
              <EnvelopeIcon className="w-4 h-4 md:w-5 md:h-5 text-white/60 group-hover:text-white transition-colors" />
              <span className="hidden md:inline text-sm text-white/60 group-hover:text-white transition-colors">Email</span>
            </a>
          </div>
        </div>
      </main>

      <MusicPlayer 
        currentTrack={currentTrackIndex !== null ? tracks[currentTrackIndex] : null}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
        onPlayStateChange={setIsPlaying}
        onTrackSelect={handleTrackSelect}
        tracks={tracks}
        onAudioElementChange={setAudioElement}
      />
    </div>
  );
};

export default Index;
