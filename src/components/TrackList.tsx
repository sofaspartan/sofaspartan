import { PlayIcon, PauseIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSoundcloud } from '@fortawesome/free-brands-svg-icons';
import { AudioSpectrum } from './AudioSpectrum';
import ReactionButton from './ReactionButton';
import { createClient } from '@supabase/supabase-js';
import { ReactionType } from './ReactionPicker';
import { showToast } from './ToastNotifications';
import ShareButton from './ShareButton';

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

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
});

export const TrackList = ({ tracks, onTrackSelect, currentTrack, isPlaying, audioElement }: TrackListProps) => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [trackReactions, setTrackReactions] = useState<Record<number, {
    like: number;
    dislike: number;
    love: number;
    laugh: number;
    surprise: number;
    sad: number;
    mad: number;
  }>>({});
  const [userReactions, setUserReactions] = useState<Record<number, ReactionType>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch track reactions
  useEffect(() => {
    const fetchTrackReactions = async () => {
      const { data: reactions, error } = await supabase
        .from('track_reactions')
        .select('*');

      if (error) {
        console.error('Error fetching track reactions:', error);
        return;
      }

      // Calculate reaction counts for each track
      const reactionCounts: Record<number, {
        like: number;
        dislike: number;
        love: number;
        laugh: number;
        surprise: number;
        sad: number;
        mad: number;
      }> = {};

      reactions.forEach((reaction) => {
        if (!reactionCounts[reaction.track_id]) {
          reactionCounts[reaction.track_id] = {
            like: 0,
            dislike: 0,
            love: 0,
            laugh: 0,
            surprise: 0,
            sad: 0,
            mad: 0
          };
        }
        reactionCounts[reaction.track_id][reaction.reaction_type]++;
      });

      setTrackReactions(reactionCounts);

      // Get user's reactions
      if (user) {
        const userReactions: Record<number, ReactionType> = {};
        reactions.forEach((reaction) => {
          if (reaction.user_id === user.id) {
            userReactions[reaction.track_id] = reaction.reaction_type;
          }
        });
        setUserReactions(userReactions);
      }
    };

    fetchTrackReactions();
  }, [user]);

  // Handle track reaction
  const handleTrackReaction = async (trackId: number, type: ReactionType) => {
    if (!user) {
      showToast.info.trackReactionSignInRequired();
      return;
    }

    try {
      const currentReaction = userReactions[trackId];

      if (currentReaction === type) {
        // Remove reaction
        const { error } = await supabase
          .from('track_reactions')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);

        if (error) {
          showToast.error.voteRemove();
          throw error;
        }

        // Update local state
        setUserReactions(prev => {
          const newState = { ...prev };
          delete newState[trackId];
          return newState;
        });

        setTrackReactions(prev => ({
          ...prev,
          [trackId]: {
            ...prev[trackId],
            [type]: Math.max(0, (prev[trackId]?.[type] || 0) - 1)
          }
        }));

        showToast.success.voteRemoved();
      } else if (currentReaction) {
        // Update reaction
        const { error } = await supabase
          .from('track_reactions')
          .update({ reaction_type: type })
          .eq('user_id', user.id)
          .eq('track_id', trackId);

        if (error) {
          showToast.error.voteUpdate();
          throw error;
        }

        // Update local state
        setUserReactions(prev => ({
          ...prev,
          [trackId]: type
        }));

        setTrackReactions(prev => ({
          ...prev,
          [trackId]: {
            ...prev[trackId],
            [currentReaction]: Math.max(0, (prev[trackId]?.[currentReaction] || 0) - 1),
            [type]: (prev[trackId]?.[type] || 0) + 1
          }
        }));

        showToast.success.voteUpdated();
      } else {
        // Add new reaction
        const { error } = await supabase
          .from('track_reactions')
          .insert({
            user_id: user.id,
            track_id: trackId,
            reaction_type: type
          });

        if (error) {
          showToast.error.voteSubmit();
          throw error;
        }

        // Update local state
        setUserReactions(prev => ({
          ...prev,
          [trackId]: type
        }));

        setTrackReactions(prev => ({
          ...prev,
          [trackId]: {
            ...prev[trackId],
            [type]: (prev[trackId]?.[type] || 0) + 1
          }
        }));

        showToast.success.voteSubmitted();
      }
    } catch (error) {
      console.error('Error handling track reaction:', error);
      showToast.error.voteSubmit();
    }
  };

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
        className="bg-white/5 backdrop-blur-xl rounded-lg overflow-visible shadow-lg mx-2 sm:mx-8 md:mx-0 glass-morphism"
        ref={containerRef}
      >
        <div className="p-6">
          <div className="border-b border-white/10 pb-4 mb-6 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                <MusicalNoteIcon className="w-5 h-5 text-white/60" />
                Track List
              </h3>
              <div className="flex items-center gap-2">
                <ShareButton 
                  url={window.location.href}
                  title="Track Collection by sofaspartan"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
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
              <div className="relative">
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
                        <div className="flex items-center gap-2">
                          <div className="relative z-50" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <ReactionButton
                                commentId={track.id.toString()}
                                reactions={trackReactions[track.id] || {
                                  like: 0,
                                  dislike: 0,
                                  love: 0,
                                  laugh: 0,
                                  surprise: 0,
                                  sad: 0,
                                  mad: 0
                                }}
                                userReaction={userReactions[track.id]}
                                onReaction={(_, type) => handleTrackReaction(track.id, type)}
                                user={user}
                              />
                            </div>
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
        </div>
      </div>
    </div>
  );
};
