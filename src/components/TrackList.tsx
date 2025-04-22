import { PlayIcon, PauseIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSoundcloud } from '@fortawesome/free-brands-svg-icons';

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  albumArt: string;
}

interface TrackListProps {
  tracks: Track[];
  onTrackSelect: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
}

export const TrackList = ({ tracks, onTrackSelect, currentTrack, isPlaying }: TrackListProps) => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const checkScroll = () => {
      const isScrollable = list.scrollHeight > list.clientHeight;
      const isAtBottom = list.scrollHeight - list.scrollTop <= list.clientHeight + 1;
      setShowScrollIndicator(isScrollable && !isAtBottom);
    };

    list.addEventListener('scroll', checkScroll);
    checkScroll(); // Initial check

    return () => list.removeEventListener('scroll', checkScroll);
  }, [tracks]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-lg overflow-hidden shadow-lg mx-8 md:mx-0">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-4 md:p-6">
          {/* Album Art */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="w-[240px] h-[240px] md:w-[320px] md:h-[320px] rounded-lg overflow-hidden shadow-lg">
              {currentTrack?.albumArt ? (
                <img 
                  src={currentTrack.albumArt} 
                  alt="Album art"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <MusicalNoteIcon className="h-24 w-24 text-white" />
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              {currentTrack ? (
                <>
                  <h2 className="text-2xl font-bold">{currentTrack.title}</h2>
                  <p className="text-lg text-muted-foreground">{currentTrack.artist}</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">Track Collection</h2>
                  <p className="text-lg text-muted-foreground">sofaspartan</p>
                </>
              )}
            </div>
          </div>

          {/* Track List */}
          <div className="flex-grow relative">
            <div 
              ref={listRef}
              className="h-[320px] md:h-[400px] overflow-y-auto pr-4"
            >
              {tracks.map((track) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-4 p-3 md:p-4 hover:bg-white/10 transition-colors cursor-pointer group rounded-lg ${
                      isCurrentTrack ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => onTrackSelect(track)}
                  >
                    <div className="text-muted-foreground text-sm md:text-base w-6 flex-shrink-0">
                      {track.id}
                    </div>
                    <div className="relative aspect-square w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={track.albumArt} 
                        alt={`${track.title} album art`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <h3 className="font-medium truncate text-sm md:text-base">
                        {track.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {track.artist}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`p-1.5 md:p-2 rounded-full h-8 w-8 md:h-10 md:w-10 flex items-center justify-center ${
                        isCurrentTrack ? 'bg-primary' : 'bg-primary/20'
                      }`}>
                        {isCurrentTrack ? (
                          isPlaying ? (
                            <PauseIcon className="h-4 w-4 text-white" />
                          ) : (
                            <PlayIcon className="h-4 w-4 text-white" />
                          )
                        ) : (
                          <MusicalNoteIcon className="h-4 w-4 text-white/40" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {showScrollIndicator && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2">
                <div className="bg-primary text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <ChevronDown className="h-3 w-3" />
                  Scroll
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-16 mb-24 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <h3 className="text-xl font-semibold">Let's Connect:</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <a 
              href="https://soundcloud.com/sofaspartan" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <FontAwesomeIcon icon={faSoundcloud} className="w-5 h-5 text-white/60 group-hover:text-white" />
              <span className="text-sm text-white/60 group-hover:text-white">SoundCloud</span>
            </a>
            <a 
              href="https://www.instagram.com/sofaspartan/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <svg className="w-5 h-5 text-white/60 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-sm text-white/60 group-hover:text-white">Instagram</span>
            </a>
            <a 
              href="mailto:sofaspartan.music@gmail.com"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <EnvelopeIcon className="w-5 h-5 text-white/60 group-hover:text-white" />
              <span className="text-sm text-white/60 group-hover:text-white">Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
