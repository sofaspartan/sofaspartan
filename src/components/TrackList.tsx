import { PlayIcon, PauseIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSoundcloud } from '@fortawesome/free-brands-svg-icons';
import { AudioSpectrum } from './AudioSpectrum';

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
  audioElement: HTMLAudioElement | null;
}

export const TrackList = ({ tracks, onTrackSelect, currentTrack, isPlaying, audioElement }: TrackListProps) => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

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

  useEffect(() => {
    let lastTime = 0;
    const throttleDelay = 1000 / 60; // 60fps

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = performance.now();
      if (currentTime - lastTime < throttleDelay) return;
      lastTime = currentTime;

      // Calculate tilt based on mouse position relative to window
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Convert to -1 to 1 range
      const newTiltX = ((e.clientX / windowWidth) * 2 - 1) * 10; // Max 10 degrees
      const newTiltY = ((e.clientY / windowHeight) * 2 - 1) * -10; // Max 10 degrees, negative for natural feel
      
      // Use requestAnimationFrame for smooth updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setTiltX(newTiltX);
        setTiltY(newTiltY);
      });
    };

    const handleMouseLeave = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setTiltX(0);
      setTiltY(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Scroll to current track when it changes
  useEffect(() => {
    if (!currentTrack || !listRef.current) return;

    const currentTrackElement = listRef.current.querySelector(`[data-track-id="${currentTrack.id}"]`) as HTMLElement;
    if (!currentTrackElement) return;

    const listRect = listRef.current.getBoundingClientRect();
    const trackRect = currentTrackElement.getBoundingClientRect();

    // Calculate if the track is outside the visible area
    const isAbove = trackRect.top < listRect.top;
    const isBelow = trackRect.bottom > listRect.bottom;

    if (isAbove || isBelow) {
      // Calculate the scroll position to center the track
      const trackTop = currentTrackElement.offsetTop;
      const trackHeight = currentTrackElement.offsetHeight;
      const listHeight = listRef.current.offsetHeight;
      const scrollTop = trackTop - (listHeight / 2) + (trackHeight / 2);

      // Smooth scroll the list container
      listRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [currentTrack]);

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-6 pb-4 sm:pb-6">
      <div 
        className="bg-white/5 backdrop-blur-xl rounded-lg overflow-hidden shadow-lg mx-2 sm:mx-8 md:mx-0 glass-morphism"
        ref={containerRef}
      >
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-3 md:p-6">
          {/* Album Art and Title */}
          <div className="flex flex-row md:flex-col items-center justify-center gap-4 md:gap-0">
            <div className="flex-shrink-0">
              <div 
                className="w-[120px] h-[120px] md:w-[320px] md:h-[320px] rounded-lg overflow-hidden shadow-lg transition-transform duration-100"
                style={{
                  transform: window.innerWidth >= 768 
                    ? `perspective(1000px) rotateX(${tiltY}deg) rotateY(${tiltX}deg)`
                    : 'none',
                  transformStyle: 'preserve-3d'
                }}
              >
                {currentTrack?.albumArt ? (
                  <img 
                    src={currentTrack.albumArt} 
                    alt="Album art"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center">
                    <MusicalNoteIcon className="h-12 w-12 md:h-24 md:w-24 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-left md:text-center md:mt-4">
              {currentTrack ? (
                <>
                  <h2 className="text-lg md:text-2xl font-bold">{currentTrack.title}</h2>
                  <p className="text-sm md:text-lg text-muted-foreground">{currentTrack.artist}</p>
                </>
              ) : (
                <>
                  <h2 className="text-lg md:text-2xl font-bold">Track Collection</h2>
                  <p className="text-sm md:text-lg text-muted-foreground">sofaspartan</p>
                </>
              )}
            </div>
          </div>

          {/* Track List */}
          <div className="flex-grow relative">
            <div 
              ref={listRef}
              className="h-[280px] md:h-[400px] overflow-y-auto pr-2 md:pr-4"
            >
              {tracks.map((track) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    data-track-id={track.id}
                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer group rounded-lg ${
                      isCurrentTrack ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => onTrackSelect(track)}
                  >
                    <div className="text-muted-foreground text-base md:text-base w-6 flex-shrink-0 group-hover:text-white transition-colors">
                      {track.id}
                    </div>
                    <div className="relative aspect-square w-10 h-10 md:w-16 md:h-16 rounded-sm md:rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                      <img 
                        src={track.albumArt} 
                        alt={`${track.title} album art`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate text-base md:text-base group-hover:text-white transition-colors">
                          {track.title}
                        </h3>
                        {isCurrentTrack && (
                          <AudioSpectrum isPlaying={isPlaying} audioElement={audioElement} className="hidden md:block" />
                        )}
                      </div>
                      <p className="text-sm md:text-sm text-muted-foreground truncate group-hover:text-white/80 transition-colors">
                        {track.artist}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`p-1 md:p-2 rounded-full h-8 w-8 md:h-10 md:w-10 flex items-center justify-center transition-all duration-200 ${
                        isCurrentTrack ? 'bg-primary group-hover:scale-110' : 'bg-primary/20 group-hover:bg-primary/30'
                      }`}>
                        {isCurrentTrack ? (
                          isPlaying ? (
                            <PauseIcon className="h-4 w-4 md:h-4 md:w-4 text-white" />
                          ) : (
                            <PlayIcon className="h-4 w-4 md:h-4 md:w-4 text-white" />
                          )
                        ) : (
                          <MusicalNoteIcon className="h-4 w-4 md:h-4 md:w-4 text-white/40 group-hover:text-white/60" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {showScrollIndicator && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-1 md:pb-2">
                <div className="bg-primary text-white text-xs px-2 md:px-3 py-1 rounded-full flex items-center gap-1">
                  <ChevronDown className="h-3 w-3" />
                  Scroll
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 md:mt-8 mb-16 md:mb-24 text-center">
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
    </div>
  );
};
