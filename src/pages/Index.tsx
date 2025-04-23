import { useState, useEffect } from 'react';
import { MusicPlayer } from '../components/MusicPlayer';
import { TrackList } from '../components/TrackList';
import { BackgroundOverlay } from '../components/BackgroundOverlay';
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
              <span className="text-white">Hey, I'm Sofaspartan</span>, a bedroom producer fusing chiptune, synthwave, and EDM into a high-voltage blast of pixelated nostalgia and neon-charged soundscapes. My tracks don't just play, <i>they level up.</i>
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
