import { useState, useRef, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, BackwardIcon, ForwardIcon } from '@heroicons/react/24/solid';
import { MusicalNoteIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    setIsMaximized(!isMaximized);
  };

  return (
    <div className={`fixed ${isMaximized ? 'inset-0' : 'bottom-6 left-6 right-6'} glass-morphism transition-all duration-300 rounded-xl ${isMaximized ? 'z-50' : 'z-40'}`}>
      <div className={`flex ${isMaximized ? 'flex-col items-center justify-center min-h-screen' : 'items-center justify-between'} gap-4 p-2 md:p-4 relative`}>
        {isMaximized ? (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <div className="relative w-80 h-80 rounded-2xl overflow-hidden shadow-2xl">
              {currentTrack?.albumArt ? (
                <img
                  src={currentTrack.albumArt}
                  alt={`${currentTrack.title} album art`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-primary flex items-center justify-center">
                  <MusicalNoteIcon className="h-24 w-24 text-white" />
                </div>
              )}
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">{currentTrack?.title || 'No track selected'}</h2>
              <p className="text-xl text-muted-foreground">{currentTrack?.artist}</p>
            </div>
            <div className="flex items-center gap-6">
              <button 
                className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                onClick={onPreviousTrack}
              >
                <BackwardIcon className="h-8 w-8" />
              </button>
              <button 
                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-white"
                onClick={togglePlay}
              >
                {isPlaying ? <PauseIcon className="h-10 w-10" /> : <PlayIcon className="h-10 w-10" />}
              </button>
              <button 
                className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                onClick={onNextTrack}
              >
                <ForwardIcon className="h-8 w-8" />
              </button>
            </div>
            <div className="w-full max-w-md space-y-2">
              <Slider
                value={[duration ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleProgressChange}
                max={100}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 w-64">
              <button
                className="flex items-center justify-center text-white transition-colors hover:text-white/80"
                onClick={toggleMute}
              >
                {isMuted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
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
              className="absolute top-4 right-4 h-10 w-10"
              onClick={toggleMaximize}
            >
              {isMaximized ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className="relative aspect-square w-12 md:w-16 rounded-lg overflow-hidden flex-shrink-0">
                {currentTrack?.albumArt ? (
                  <img
                    src={currentTrack.albumArt}
                    alt={`${currentTrack.title} album art`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary flex items-center justify-center">
                    <MusicalNoteIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                )}
              </div>
              <div className="text-sm md:text-base min-w-0 max-w-[120px] md:max-w-[200px]">
                <p className="font-medium truncate">{currentTrack?.title || 'No track selected'}</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{currentTrack?.artist}</p>
              </div>
            </div>
            <div className="absolute right-20 md:left-1/2 md:-translate-x-1/2 flex items-center gap-1 md:gap-2 justify-end md:justify-center">
              <button 
                className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                onClick={onPreviousTrack}
              >
                <BackwardIcon className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              <button 
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-white"
                onClick={togglePlay}
              >
                {isPlaying ? <PauseIcon className="h-6 w-6 md:h-8 md:w-8" /> : <PlayIcon className="h-6 w-6 md:h-8 md:w-8" />}
              </button>
              <button 
                className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                onClick={onNextTrack}
              >
                <ForwardIcon className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <div className="hidden lg:block text-xs text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <div className="hidden lg:flex items-center gap-2 w-24 md:w-32">
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
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={toggleMaximize}
              >
                {isMaximized ? <ArrowsPointingInIcon className="h-3 w-3 md:h-4 md:w-4" /> : <ArrowsPointingOutIcon className="h-3 w-3 md:h-4 md:w-4" />}
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
