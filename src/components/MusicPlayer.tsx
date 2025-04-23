import { useState, useRef, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, BackwardIcon, ForwardIcon } from '@heroicons/react/24/solid';
import { MusicalNoteIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { AudioSpectrum } from './AudioSpectrum';

interface MusicPlayerProps {
  currentTrack: {
    title: string;
    artist: string;
    url: string;
    albumArt: string;
  } | null;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onTrackSelect?: (track: any) => void;
  tracks?: any[];
  onAudioElementChange?: (element: HTMLAudioElement | null) => void;
}

export const MusicPlayer = ({ currentTrack, onNextTrack, onPreviousTrack, onPlayStateChange, onTrackSelect, tracks, onAudioElementChange }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [isMuted, setIsMuted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>();

  // Update parent component when play state changes
  useEffect(() => {
    onPlayStateChange(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  useEffect(() => {
    if (audioRef.current) {
      const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
      const handleLoadedMetadata = () => {
        setDuration(audioRef.current?.duration || 0);
      };
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('pause', handlePause);

      // Auto-play when a new track is selected
      if (currentTrack) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('Error playing track:', error);
            setIsPlaying(false);
          });
      }

      return () => {
        audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current?.removeEventListener('play', handlePlay);
        audioRef.current?.removeEventListener('pause', handlePause);
      };
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      onAudioElementChange?.(audioRef.current);
    }
  }, [onAudioElementChange]);

  useEffect(() => {
    if (!isMaximized) return;

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
  }, [isMaximized]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const togglePlay = () => {
    if (!currentTrack && tracks && tracks.length > 0 && onTrackSelect) {
      onTrackSelect(tracks[0]);
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0] / 100;
      setVolume(newVolume);
    }
  };

  const toggleMaximize = () => {
    setIsAnimating(true);
    setIsMaximized(!isMaximized);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className={`fixed ${isMaximized ? 'inset-0' : 'bottom-4 left-1/2 -translate-x-1/2'} glass-morphism rounded-xl ${isMaximized ? 'z-50' : 'z-40'} ${!isMaximized && 'w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-5xl'}`}>
      <div className={`flex ${isMaximized ? 'flex-col items-center justify-center min-h-screen' : 'items-center justify-between'} gap-2 md:gap-4 p-3 md:p-4 relative`}>
        {isMaximized ? (
          <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-2xl">
            <div 
              className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-100"
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
                  alt={`${currentTrack.title} album art`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-primary flex items-center justify-center">
                  <MusicalNoteIcon className="h-20 w-20 md:h-24 md:w-24 text-white" />
                </div>
              )}
            </div>
            <div className="text-center space-y-1 md:space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl md:text-3xl font-bold">{currentTrack?.title || 'No track selected'}</h2>
                {currentTrack && (
                  <AudioSpectrum isPlaying={isPlaying} audioElement={audioRef.current} className="hidden md:block" />
                )}
              </div>
              <p className="text-lg md:text-xl text-muted-foreground">{currentTrack?.artist}</p>
            </div>
            <div className="w-full max-w-md space-y-1 md:space-y-2 px-4 md:px-0">
              <Slider
                value={[duration ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleProgressChange}
                max={100}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6 -mt-2">
              <button 
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                onClick={onPreviousTrack}
              >
                <BackwardIcon className="h-6 w-6 md:h-8 md:w-8" />
              </button>
              <button 
                className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                onClick={togglePlay}
              >
                {isPlaying ? <PauseIcon className="h-8 w-8 md:h-10 md:w-10" /> : <PlayIcon className="h-8 w-8 md:h-10 md:w-10" />}
              </button>
              <button 
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                onClick={onNextTrack}
              >
                <ForwardIcon className="h-6 w-6 md:h-8 md:w-8" />
              </button>
            </div>
            <div className="flex items-center gap-3 md:gap-4 w-56 md:w-64">
              <button
                className="flex items-center justify-center text-white transition-colors hover:text-white/80"
                onClick={toggleMute}
              >
                {isMuted ? <SpeakerXMarkIcon className="h-4 w-4 md:h-5 md:w-5" /> : <SpeakerWaveIcon className="h-4 w-4 md:h-5 md:w-5" />}
              </button>
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 md:top-4 right-2 md:right-4 h-8 w-8 md:h-10 md:w-10"
              onClick={toggleMaximize}
            >
              <ArrowsPointingInIcon className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        ) : (
          <>
            <div className="relative flex-grow group">
              <div 
                className="flex items-center gap-3 md:gap-4 flex-shrink-0 cursor-pointer"
                onClick={toggleMaximize}
              >
                <div className="relative aspect-square w-10 md:w-16 rounded-sm md:rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                  {currentTrack?.albumArt ? (
                    <img
                      src={currentTrack.albumArt}
                      alt={`${currentTrack.title} album art`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-primary flex items-center justify-center">
                      <MusicalNoteIcon className="h-5 w-5 md:h-8 md:w-8 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-xs md:text-base min-w-0 max-w-[180px] md:max-w-[200px]">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate text-base md:text-base group-hover:text-white transition-colors">{currentTrack?.title || 'No track selected'}</p>
                  </div>
                  <p className="text-sm md:text-sm text-muted-foreground truncate group-hover:text-white/80 transition-colors">{currentTrack?.artist}</p>
                </div>
              </div>
            </div>
            <div className="absolute right-4 md:left-1/2 md:-translate-x-1/2 flex items-center gap-1 md:gap-2 justify-end md:justify-center">
              <button 
                className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                onClick={onPreviousTrack}
              >
                <BackwardIcon className="h-4 w-4 md:h-6 md:w-6" />
              </button>
              <button 
                className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                onClick={togglePlay}
              >
                {isPlaying ? <PauseIcon className="h-5 w-5 md:h-8 md:w-8" /> : <PlayIcon className="h-5 w-5 md:h-8 md:w-8" />}
              </button>
              <button 
                className="h-8 w-8 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                onClick={onNextTrack}
              >
                <ForwardIcon className="h-4 w-4 md:h-6 md:w-6" />
              </button>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className="hidden lg:block text-xs text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <div className="hidden lg:flex items-center gap-2 w-20 md:w-32">
                <button
                  className="flex items-center justify-center text-white transition-colors hover:text-white/80"
                  onClick={toggleMute}
                >
                  {isMuted ? <SpeakerXMarkIcon className="h-3 w-3 md:h-5 md:w-5" /> : <SpeakerWaveIcon className="h-3 w-3 md:h-5 md:w-5" />}
                </button>
                <Slider
                  value={volume}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-6 w-6 md:h-8 md:w-8"
                onClick={toggleMaximize}
              >
                <ArrowsPointingOutIcon className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onEnded={() => {
            setIsPlaying(false);
            onNextTrack();
          }}
        />
      )}
    </div>
  );
};
