import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronDown, ChevronUp, Reply, Settings, X, LogOut, SortAsc, SortDesc, ThumbsUp, ThumbsDown, LogIn, UserPlus, Mail, Flag, Edit, Trash2, Save, AlertTriangle, Star, User, MoreVertical, Filter, Pin, MessageSquare } from 'lucide-react';

// Types
interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes: number;
  dislikes: number;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    user_metadata?: {
      display_name?: string;
      avatar_url?: string;
      user_type?: string;
    };
  };
}

interface Vote {
  id: string;
  user_id: string;
  comment_id: string;
  vote_type: 'like' | 'dislike';
  created_at: string;
}

interface FlagRecord {
  comment_id: string;
  flag_type: 'inappropriate' | 'spam' | 'pinned';
  count?: number;
}

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseKey.length);

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
});

// Define Sort Orders
type SortOrder = 'latest' | 'oldest' | 'likes' | 'dislikes' | 'flagged';

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike'>>({});
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [visibleCommentCount, setVisibleCommentCount] = useState(3);
  const [userFlags, setUserFlags] = useState<Record<string, { type: 'inappropriate' | 'spam' | 'pinned', count: number }>>({});
  const [openFlagMenu, setOpenFlagMenu] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Function to format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  };

  // Check user authentication and set up session listener
  useEffect(() => {
    // Function to fetch profile and merge with auth user
    const fetchProfileAndSetUser = async (authUser: any) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_metadata')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore "No rows found" error
          console.error('Error fetching profile:', profileError);
        }

        // Merge auth user with profile metadata if it exists
        const mergedUser = {
          ...authUser,
          user_metadata: profileData?.user_metadata || authUser.user_metadata || {}
        };
        console.log('Setting user with merged profile:', mergedUser);
        setUser(mergedUser);

      } catch (err) {
        console.error('Error in fetchProfileAndSetUser:', err);
        // Set user with only auth data if profile fetch fails
        setUser(authUser);
      }
    };

    // Initial session check
    const checkUser = async () => {
      try {
        setIsLoading(true);
        console.log('Checking initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          setUser(null);
          return;
        }
        console.log('Initial session check result:', session);
        if (session?.user) {
          console.log('User session found, fetching profile...', session.user.id);
          await fetchProfileAndSetUser(session.user);
        } else {
          console.log('No user session found');
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (session?.user) {
        console.log('Auth state change: User found, fetching profile...', session.user.id);
        fetchProfileAndSetUser(session.user);
      } else {
        console.log('Clearing user from auth state change');
        setUser(null);
      }
    });

    checkUser();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null); // Clear reset message on sign-in attempt
      setError(null);
      
      console.log('Signing in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in. Check your email for the confirmation link.');
        } else {
          setError(error.message);
        }
        return;
      }

      console.log('Sign in successful:', data);
      setEmail('');
      setPassword('');
  };

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null); // Clear reset message on sign-up attempt
      setError(null);
      
      console.log('Signing up...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName,
          email_confirmed: false,
          user_type: 'regular' // Set default user_type
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        setError(error.message);
        return;
      }

      console.log('Sign up successful:', data);
      
      if (data.user?.identities?.length === 0) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError('Please check your email for the confirmation link. If you don\'t see it, check your spam folder.');
      }
      
      setEmail('');
      setPassword('');
      setDisplayName('');
  };

  // Handle sign out
  const handleSignOut = async () => {
    if (isCommentsCollapsed) setIsCommentsCollapsed(false); // Expand if collapsed
    try {
      setError(null);
      console.log('Signing out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  // Fetch all flags for comments
  const fetchAllFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('flags')
        .select('comment_id, flag_type');

      if (error) throw error;

      // Count flags per comment
      const flagCounts: Record<string, number> = {};
      const flagTypes: Record<string, 'inappropriate' | 'spam' | 'pinned'> = {};
      
      data.forEach((flag: FlagRecord) => {
        flagCounts[flag.comment_id] = (flagCounts[flag.comment_id] || 0) + 1;
        flagTypes[flag.comment_id] = flag.flag_type;
      });

      // Combine counts and types
      const flags: Record<string, { type: 'inappropriate' | 'spam' | 'pinned', count: number }> = {};
      Object.keys(flagCounts).forEach(commentId => {
        flags[commentId] = {
          type: flagTypes[commentId],
          count: flagCounts[commentId]
        };
      });

      setUserFlags(flags);
      console.log('Fetched all flags:', flags);
    } catch (err) {
      console.error('Error fetching flags:', err);
    }
  };

  // Fetch comments and user votes based on user state
  useEffect(() => {
    console.log('User state changed, fetching comments...', user ? `User: ${user.id}` : 'Logged out');
    fetchComments(); // Always fetch comments regardless of login state
    fetchAllFlags(); // Fetch all flags regardless of login state

    if (user) {
      console.log('User logged in, fetching votes...');
      fetchUserVotes();
    } else {
      console.log('User logged out, clearing votes...');
      setUserVotes({});
    }
  }, [user]); // Re-run when user logs in or out

  // Fetch comments with associated user profiles
  const fetchComments = async () => {
    try {
      setError(null);
      console.log('Fetching comments from DB...');
      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*') // Select all comment fields
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      if (!commentsData) {
        console.log('No comments data received.');
        setComments([]); // Keep clearing if fetch returns null/empty
        return;
      }
      console.log(`Fetched ${commentsData.length} comments.`);

      // Get unique user IDs from comments, filtering out nulls
      const userIds = [...new Set(commentsData.map(comment => comment.user_id).filter(id => !!id))];
      console.log('Unique user IDs from comments:', userIds);

      let usersData: any[] = []; // Default to empty
      if (userIds.length > 0) {
        console.log('Fetching profiles for comment authors...');
        // Fetch corresponding profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_metadata') // Select ID for matching and metadata for display
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Continue without profile data if fetch fails
        } else {
          usersData = profilesData || [];
          console.log(`Fetched ${usersData.length} profiles.`);
        }
      }

      // Fetch all votes for these comments
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .in('comment_id', commentsData.map(c => c.id));

      if (votesError) {
        console.error('Error fetching votes:', votesError);
      }

      // Calculate vote counts for each comment
      const voteCounts: Record<string, { likes: number, dislikes: number }> = {};
      votesData?.forEach((vote: Vote) => {
        if (!voteCounts[vote.comment_id]) {
          voteCounts[vote.comment_id] = { likes: 0, dislikes: 0 };
        }
        if (vote.vote_type === 'like') {
          voteCounts[vote.comment_id].likes++;
        } else {
          voteCounts[vote.comment_id].dislikes++;
        }
      });

      // Combine comments with user data and vote counts
      const commentsWithUsers = commentsData.map(comment => ({
        ...comment,
        // Find profile if user_id exists, otherwise user is undefined
        user: comment.user_id ? usersData.find(profile => profile.id === comment.user_id) : undefined,
        // Add vote counts
        likes: voteCounts[comment.id]?.likes || 0,
        dislikes: voteCounts[comment.id]?.dislikes || 0
      }));

      console.log('Setting comments state with combined data.');
      setComments(commentsWithUsers);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to fetch comments. Please try again.');
      setComments([]); // Keep clearing comments on error
    }
  };

  // Fetch user's votes (only called when logged in)
  const fetchUserVotes = async () => {
    if (!user) return;

    try {
      console.log('Fetching votes for user:', user.id);
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching votes:', error);
        throw error;
      }

      console.log('Fetched votes:', data);

      // Convert votes array to a record of comment_id -> vote_type
      const votes: Record<string, 'like' | 'dislike'> = {};
      data.forEach((vote: Vote) => {
        votes[vote.comment_id] = vote.vote_type;
      });
      setUserVotes(votes);
    } catch (err) {
      console.error('Error fetching user votes:', err);
    }
  };

  // Add new comment or reply
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      setError(null);
      console.log('Attempting to post comment with data:', {
        content: newComment,
        user_id: user.id,
        parent_id: replyingTo,
        likes: 0,
        dislikes: 0
      });
      
      // First try to insert without select
      const { error: insertError } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          user_id: user.id,
          parent_id: replyingTo,
          likes: 0,
          dislikes: 0
        });

      if (insertError) {
        console.error('Error posting comment:', insertError);
        console.error('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw insertError;
      }

      // If insert succeeds, fetch the new comment
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Error fetching new comment:', fetchError);
        throw fetchError;
      }
      
      // Create a new comment object with user metadata
      const newCommentWithUser = {
        ...data,
        user: {
          email: user.email,
          user_metadata: user.user_metadata
        }
      };
      
      setComments([newCommentWithUser, ...comments]);
      setNewComment('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle reply form
  const handleReplyClick = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  // Toggle expanded replies
  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Memoized sorted comments
  const sortedComments = useMemo(() => {
    const topLevelComments = comments.filter(comment => !comment.parent_id);
    
    // Separate pinned and unpinned comments
    const pinnedComments = topLevelComments.filter(comment => 
      userFlags[comment.id]?.type === 'pinned'
    );
    const unpinnedComments = topLevelComments.filter(comment => 
      userFlags[comment.id]?.type !== 'pinned'
    );

    // Filter by search query if one exists
    const filteredUnpinned = searchQuery
      ? unpinnedComments.filter(comment => 
          comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (comment.user?.user_metadata?.display_name || comment.user?.email || 'Anonymous')
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      : unpinnedComments;

    // Sort unpinned comments based on sortOrder
    const sortedUnpinned = [...filteredUnpinned].sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        case 'dislikes':
          return (b.dislikes || 0) - (a.dislikes || 0);
        case 'flagged':
          return (userFlags[b.id]?.count || 0) - (userFlags[a.id]?.count || 0);
        case 'latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Return pinned comments first, then sorted unpinned comments
    return [...pinnedComments, ...sortedUnpinned];
  }, [comments, sortOrder, userFlags, searchQuery]);

  // Get replies for a comment
  const getReplies = (commentId: string) => {
    return comments.filter(comment => comment.parent_id === commentId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  // Handle flagging/unflagging a comment
  const handleFlagComment = async (commentId: string, flagType: 'inappropriate' | 'spam' | 'pinned') => {
    if (!user) {
      setError('Please sign in to flag comments.');
      return;
    }
    setError(null);
    setOpenFlagMenu(null); // Close menu

    const currentFlag = userFlags[commentId];

    try {
      if (currentFlag) {
        // Already flagged, so unflag (delete)
        console.log(`Unflagging comment ${commentId}`);
        const { error } = await supabase
          .from('flags')
          .delete()
          .match({ user_id: user.id, comment_id: commentId });
        if (error) throw error;
        // Update local state
        setUserFlags(prev => {
          const newState = { ...prev };
          delete newState[commentId];
          return newState;
        });
      } else {
        // Not flagged, so flag (insert)
        console.log(`Flagging comment ${commentId} as ${flagType}`);
        const { error } = await supabase
          .from('flags')
          .insert({ user_id: user.id, comment_id: commentId, flag_type: flagType });
        if (error) throw error;
        // Update local state
        setUserFlags(prev => ({ ...prev, [commentId]: { type: flagType, count: 1 } }));
      }
    } catch (err: any) {
      console.error('Error flagging comment:', err);
      setError(err.message || 'Failed to update flag. Please try again.');
    }
  };

  // Render a comment and its replies
  const renderComment = (comment: Comment, level: number = 0) => {
    const replies = getReplies(comment.id);
    const hasReplies = replies.length > 0;
    const isExpanded = expandedReplies[comment.id];
    const isFlagged = !!userFlags[comment.id];
    const flagCount = userFlags[comment.id]?.count || 0;
    const isOwner = user?.id === comment.user_id;
    const isAdmin = user?.user_metadata?.user_type === 'admin';
    const isEditing = editingCommentId === comment.id;
    const isCommenterAdmin = comment.user?.user_metadata?.user_type === 'admin';

    const displayName = comment.user?.user_metadata?.display_name || comment.user?.email || 'Anonymous';
    const avatarUrl = comment.user?.user_metadata?.avatar_url;
    const fallbackInitial = displayName.charAt(0).toUpperCase();

    return (
      <div key={comment.id} className={`flex gap-4 ${level > 0 ? 'ml-8' : ''}`}>
        {/* Avatar Column */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${displayName}'s avatar`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-medium text-white/80">{fallbackInitial}</span>
            )}
          </div>
        </div>

        {/* Comment Column */}
        <div className="flex-grow space-y-4">
          <div className="border border-white/10 rounded-lg p-4 bg-white/5 relative group">
            {/* Top Right Actions */}
            <div className="absolute top-1 right-1 flex items-center gap-1">
              {isFlagged && (
                <div className={`flex items-center gap-1 ${userFlags[comment.id]?.type === 'pinned' ? 'text-yellow-400' : 'text-yellow-500'} ${!user ? 'mt-2 mr-2' : ''}`} 
                  title={userFlags[comment.id]?.type === 'pinned' 
                    ? 'Pinned Comment' 
                    : `Flagged as ${userFlags[comment.id]?.type} (${flagCount} ${flagCount === 1 ? 'flag' : 'flags'})`}
                >
                  {userFlags[comment.id]?.type === 'pinned' ? (
                    <Pin className="w-4 h-4" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  {userFlags[comment.id]?.type !== 'pinned' && (
                    <span>{flagCount}</span>
                  )}
                </div>
              )}
              {user && (
                <div className="relative flag-dropdown-container">
                  <button
                    onClick={() => setOpenFlagMenu(openFlagMenu === comment.id ? null : comment.id)}
                    className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openFlagMenu === comment.id && (
                    <div className="absolute top-full right-0 mt-1 w-44 bg-[#2c2c2c] border border-white/20 rounded-lg shadow-lg z-50 py-1 overflow-visible">
                      {/* Edit Button (if owner or admin) */}
                      {(isOwner || isAdmin) && !isEditing && (
                        <button
                          onClick={() => {
                            handleEditClick(comment);
                            setOpenFlagMenu(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {/* Delete Button (if owner or admin) */}
                      {(isOwner || isAdmin) && !isEditing && (
                        <button
                          onClick={() => {
                            handleDeleteClick(comment.id);
                            setOpenFlagMenu(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                      {/* Divider after delete */}
                      {(isOwner || isAdmin) && !isEditing && (
                        <div className="h-px bg-white/10 mx-2 my-1"></div>
                      )}
                      {/* Admin-only: Pin/Unpin Comment */}
                      {isAdmin && (
                        <button
                          onClick={async () => {
                            try {
                              const isPinned = userFlags[comment.id]?.type === 'pinned';
                              
                              if (isPinned) {
                                // Unpin the comment
                                const { error } = await supabase
                                  .from('flags')
                                  .delete()
                                  .eq('comment_id', comment.id)
                                  .eq('flag_type', 'pinned');
                                
                                if (error) throw error;
                                
                                // Update local state
                                setUserFlags(prev => {
                                  const newFlags = { ...prev };
                                  delete newFlags[comment.id];
                                  return newFlags;
                                });
                              } else {
                                // Pin the comment
                                const { error } = await supabase
                                  .from('flags')
                                  .insert({
                                    comment_id: comment.id,
                                    user_id: user.id,
                                    flag_type: 'pinned'
                                  });
                                
                                if (error) throw error;
                                
                                // Update local state
                                setUserFlags(prev => ({
                                  ...prev,
                                  [comment.id]: { type: 'pinned', count: 1 }
                                }));
                              }
                              
                              setOpenFlagMenu(null);
                            } catch (err) {
                              console.error('Error toggling pin:', err);
                              setError('Failed to toggle pin. Please try again.');
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2"
                        >
                          <Pin className="w-4 h-4" />
                          {userFlags[comment.id]?.type === 'pinned' ? 'Unpin Comment' : 'Pin Comment'}
                        </button>
                      )}
                      {/* Add divider before flag options */}
                      {(!isOwner || isAdmin) && (
                        <div className="h-px bg-white/10 mx-2 my-1"></div>
                      )}
                      {/* Flag Options (show for non-owners or admins) */}
                      {(!isOwner || isAdmin) && (
                        <>
                          <button
                            onClick={() => {
                              handleFlagComment(comment.id, 'inappropriate');
                              setOpenFlagMenu(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2"
                          >
                            <Flag className="w-4 h-4" />
                            Flag as Inappropriate
                          </button>
                          <button
                            onClick={() => {
                              handleFlagComment(comment.id, 'spam');
                              setOpenFlagMenu(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2"
                          >
                            <Flag className="w-4 h-4" />
                            Flag as Spam
                          </button>
                          {isFlagged && userFlags[comment.id]?.type !== 'pinned' && (
                            <>
                              <div className="h-px bg-white/10 mx-2 my-1"></div>
                              {(!isOwner || isAdmin) && (
                                <button
                                  onClick={() => {
                                    handleFlagComment(comment.id, 'inappropriate');
                                    setOpenFlagMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                                >
                                  <Flag className="w-4 h-4" />
                                  Unflag
                                </button>
                              )}
                              {/* Admin-only: Remove All Flags */}
                              {isAdmin && (
                                <button
                                  onClick={async () => {
                                    try {
                                      console.log('Attempting to remove all flags for comment:', comment.id);
                                      const { error } = await supabase
                                        .from('flags')
                                        .delete()
                                        .eq('comment_id', comment.id);
                                      
                                      if (error) {
                                        console.error('Error removing flags:', error);
                                        throw error;
                                      }
                                      
                                      // Update local state
                                      setUserFlags(prev => {
                                        const newFlags = { ...prev };
                                        delete newFlags[comment.id];
                                        return newFlags;
                                      });
                                      
                                      setOpenFlagMenu(null);
                                    } catch (err) {
                                      console.error('Error removing all flags:', err);
                                      setError('Failed to remove all flags. Please try again.');
                                    }
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                                >
                                  <Flag className="w-4 h-4" />
                                  Remove All Flags
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white/90">
                  {displayName}
                </span>
                {isCommenterAdmin ? (
                  <div className="relative inline-block">
                    <div className="bg-yellow-400/20 rounded-full p-0.5">
                      <Star 
                        className="w-3.5 h-3.5 text-yellow-400 cursor-help hover:opacity-80 transition-opacity" 
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.parentElement?.nextElementSibling;
                          if (tooltip) tooltip.classList.remove('hidden');
                        }}
                        onMouseLeave={(e) => {
                          const tooltip = e.currentTarget.parentElement?.nextElementSibling;
                          if (tooltip) tooltip.classList.add('hidden');
                        }}
                      />
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-xs rounded hidden pointer-events-none z-50">
                      Admin
                    </div>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <div className="bg-white/10 rounded-full p-0.5">
                      <User 
                        className="w-3.5 h-3.5 text-white/60 cursor-help hover:opacity-80 transition-opacity" 
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.parentElement?.nextElementSibling;
                          if (tooltip) tooltip.classList.remove('hidden');
                        }}
                        onMouseLeave={(e) => {
                          const tooltip = e.currentTarget.parentElement?.nextElementSibling;
                          if (tooltip) tooltip.classList.add('hidden');
                        }}
                      />
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-xs rounded hidden pointer-events-none z-50">
                      User
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content or Edit Form */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full p-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="text-white/60 hover:text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateComment}
                    disabled={isUpdatingComment || !editingContent.trim()}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {isUpdatingComment ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-2 text-white/90 whitespace-pre-wrap">{comment.content}</p>
                <span className="text-white/60 text-sm block mb-2">
                  {formatRelativeTime(comment.created_at)}
                  {comment.updated_at && new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime() + 1000 && (
                    <span className="text-xs italic text-white/50 ml-1">(edited)</span>
                  )}
                </span>
              </>
            )}

            {/* Bottom Actions */}
            {!isEditing && (
              <div className="flex items-center space-x-4 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(comment.id, 'like');
                  }}
                  className={`flex items-center gap-1 text-green-500 hover:text-green-400 transition-colors ${
                    userVotes[comment.id] === 'like' ? 'text-green-400' : ''
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" /> {comment.likes}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(comment.id, 'dislike');
                  }}
                  className={`flex items-center gap-1 text-red-500 hover:text-red-400 transition-colors ${
                    userVotes[comment.id] === 'dislike' ? 'text-red-400' : ''
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" /> {comment.dislikes}
                </button>
                {user && (
                  <button
                    onClick={() => handleReplyClick(comment.id)}
                    className="text-white/60 hover:text-white transition-colors flex items-center gap-1 text-sm"
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </button>
                )}
                {hasReplies && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="text-white/60 hover:text-white transition-colors flex items-center gap-1 text-sm"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && !isEditing && (
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-white/60 hover:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Replies */}
          {hasReplies && isExpanded && (
            <div className="space-y-4">
              {replies.map(reply => renderComment(reply, level + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vote on comment
  const handleVote = async (commentId: string, type: 'like' | 'dislike') => {
    if (!user) {
      setError('Please sign in to vote');
      return;
    }

    try {
      setError(null);
      console.log('Attempting to vote:', { commentId, type, userId: user.id });
      
      const comment = comments.find(c => c.id === commentId);
      if (!comment) {
        console.error('Comment not found:', commentId);
        return;
      }

      // Check if user has already voted
      const currentVote = userVotes[commentId];
      console.log('Current vote state:', { currentVote, userVotes });

      // Update local state immediately
      const newComments = [...comments];
      const commentIndex = newComments.findIndex(c => c.id === commentId);
      if (commentIndex !== -1) {
        const comment = newComments[commentIndex];
        if (currentVote === type) {
          // Removing vote
          if (type === 'like') comment.likes = Math.max(0, comment.likes - 1);
          if (type === 'dislike') comment.dislikes = Math.max(0, comment.dislikes - 1);
        } else if (currentVote) {
          // Changing vote
          if (currentVote === 'like') comment.likes = Math.max(0, comment.likes - 1);
          if (currentVote === 'dislike') comment.dislikes = Math.max(0, comment.dislikes - 1);
          if (type === 'like') comment.likes = (comment.likes || 0) + 1;
          if (type === 'dislike') comment.dislikes = (comment.dislikes || 0) + 1;
        } else {
          // New vote
          if (type === 'like') comment.likes = (comment.likes || 0) + 1;
          if (type === 'dislike') comment.dislikes = (comment.dislikes || 0) + 1;
        }
        setComments(newComments);
      }

      if (currentVote === type) {
        // If clicking the same vote type, remove the vote
        console.log('Removing vote');
        const { error: deleteError } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);

        if (deleteError) {
          console.error('Error deleting vote:', deleteError);
          throw deleteError;
        }

        // Update local state
        const newVotes = { ...userVotes };
        delete newVotes[commentId];
        setUserVotes(newVotes);
      } else if (currentVote) {
        // If changing vote type, update the vote
        console.log('Updating vote from', currentVote, 'to', type);
        const { error: updateError } = await supabase
          .from('votes')
          .update({ vote_type: type })
          .eq('user_id', user.id)
          .eq('comment_id', commentId);

        if (updateError) {
          console.error('Error updating vote:', updateError);
          throw updateError;
        }

        // Update local state
        setUserVotes({ ...userVotes, [commentId]: type });
      } else {
        // If no previous vote, create new vote
        console.log('Creating new vote');
        const { error: insertError } = await supabase
          .from('votes')
          .insert([
            {
              user_id: user.id,
              comment_id: commentId,
              vote_type: type
            }
          ]);

        if (insertError) {
          console.error('Error inserting vote:', insertError);
          throw insertError;
        }

        // Update local state
        setUserVotes({ ...userVotes, [commentId]: type });
      }

      // Fetch updated vote counts for this comment only
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('comment_id', commentId);

      if (votesError) {
        console.error('Error fetching updated votes:', votesError);
        return;
      }

      // Calculate new vote counts
      const voteCounts = { likes: 0, dislikes: 0 };
      votesData.forEach((vote: Vote) => {
        if (vote.vote_type === 'like') voteCounts.likes++;
        else voteCounts.dislikes++;
      });

      // Update the specific comment's vote counts
      setComments(prevComments => 
        prevComments.map(c => 
          c.id === commentId 
            ? { ...c, likes: voteCounts.likes, dislikes: voteCounts.dislikes }
            : c
        )
      );
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to vote. Please try again.');
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      setError(null);
      
      // Upload avatar if selected
      let avatarPath = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        // Upload the file
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload avatar. Please try again.');
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarPath = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_metadata: {
            ...user.user_metadata,
            display_name: newDisplayName || user.user_metadata?.display_name,
            avatar_url: avatarPath || user.user_metadata?.avatar_url
          }
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to update profile. Please try again.');
      }

      // Update local user state
      const updatedMetadata = {
        ...user.user_metadata,
        display_name: newDisplayName || user.user_metadata?.display_name,
        avatar_url: avatarPath || user.user_metadata?.avatar_url
      };
      setUser({
        ...user,
        user_metadata: updatedMetadata
      });

      setShowSettings(false);
      setNewDisplayName('');
      setAvatarFile(null);
      setAvatarUrl(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Open Settings Modal and pre-populate fields
  const openSettingsModal = () => {
    console.log('[DEBUG] openSettingsModal called. isCommentsCollapsed:', isCommentsCollapsed);
    if (isCommentsCollapsed) {
      console.log('[DEBUG] Expanding comments...');
      setIsCommentsCollapsed(false);
    }
    if (!user) {
      console.error('[DEBUG] Attempted to open settings modal without user.');
      return;
    }
    console.log('[DEBUG] Opening settings with user:', JSON.stringify(user)); // Stringify user for better logging
    setNewDisplayName(user.user_metadata?.display_name || '');
    setAvatarUrl(user.user_metadata?.avatar_url || null);
    setAvatarFile(null);
    console.log('[DEBUG] Setting showSettings to true');
    setShowSettings(true);
  };

  // Handle Password Reset
  const handlePasswordReset = async () => {
    if (!email) {
      setResetMessage('Please enter your email address first.');
      return;
    }
    setIsResettingPassword(true);
    setResetMessage(null); // Clear previous messages
    setError(null); // Clear general errors
    try {
      console.log(`Attempting password reset for: ${email}`);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`, // Redirect URL after clicking link
      });
      if (resetError) throw resetError;
      setResetMessage('Password reset email sent! Check your inbox (and spam folder).');
    } catch (err: any) {
      console.error('Error sending password reset email:', err);
      setResetMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle initiating comment edit
  const handleEditClick = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setOpenFlagMenu(null); // Close other menus
  };

  // Handle cancelling comment edit
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  // Handle submitting comment update
  const handleUpdateComment = async () => {
    if (!editingCommentId || !editingContent.trim()) return;
    setIsUpdatingComment(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editingContent, updated_at: new Date().toISOString() })
        .eq('id', editingCommentId);

      if (error) throw error;

      // Update local state
      setComments(prevComments =>
        prevComments.map(c =>
          c.id === editingCommentId ? { ...c, content: editingContent, updated_at: new Date().toISOString() } : c
        )
      );
      handleCancelEdit(); // Close edit form
    } catch (err: any) {
      console.error('Error updating comment:', err);
      setError(err.message || 'Failed to update comment.');
    } finally {
      setIsUpdatingComment(false);
    }
  };

  // Handle initiating comment delete (show modal)
  const handleDeleteClick = (commentId: string) => {
    setShowDeleteConfirmModal(commentId);
    setOpenFlagMenu(null); // Close other menus
  };

  // Handle cancelling comment delete (close modal)
  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(null);
  };

  // Handle confirming comment delete
  const handleConfirmDelete = async () => {
    if (!showDeleteConfirmModal) return;
    setIsDeletingComment(true);
    setError(null);
    try {
      const commentIdToDelete = showDeleteConfirmModal;

      // Call the database function to handle the deletion
      const { error: deleteError } = await supabase
        .rpc('delete_comment', { comment_id: commentIdToDelete });

      if (deleteError) {
        console.error('Error deleting comment:', deleteError);
        throw new Error('Failed to delete comment. Please try again.');
      }

      // Get all replies to this comment for local state update
      const { data: replies, error: repliesError } = await supabase
        .from('comments')
        .select('id')
        .eq('parent_id', commentIdToDelete);

      if (repliesError) {
        console.error('Error fetching replies:', repliesError);
        throw new Error('Failed to fetch replies. Please try again.');
      }

      const replyIds = replies?.map(r => r.id) || [];

      // Update local state
      setComments(prevComments => {
        const commentIdsToDelete = new Set<string>([commentIdToDelete, ...replyIds]);
        return prevComments.filter(c => !commentIdsToDelete.has(c.id));
      });

      handleCancelDelete(); // Close modal
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      setError(err.message || 'Failed to delete comment.');
    } finally {
      setIsDeletingComment(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== 'DELETE') return;
    
    setIsDeletingAccount(true);
    setError(null);
    
    try {
      // Call the Edge Function to handle account deletion
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      // Close modals and sign out
      setShowDeleteAccountModal(false);
      setShowSettings(false);
      setUser(null);
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Add click outside handler for sort dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSortDropdown && !target.closest('.sort-dropdown-container')) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortDropdown]);

  // Add click outside handler for flag dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openFlagMenu && !target.closest('.flag-dropdown-container')) {
        setOpenFlagMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFlagMenu]);

  // Add click outside handler for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-lg overflow-visible shadow-lg mx-2 sm:mx-8 md:mx-0 glass-morphism">
        <div className={`p-6 ${isCommentsCollapsed ? 'pb-0' : ''}`}>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-6">
            <div className={`w-full ${isCommentsCollapsed ? '' : 'border-b border-white/10 pb-4'}`}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
                    className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title={isCommentsCollapsed ? 'Expand comments' : 'Collapse comments'}
                  >
                    {isCommentsCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                  <h2 className="text-lg md:text-xl font-semibold">Comments</h2>
                  {isCommentsCollapsed && (
                    <span className="text-sm text-white/60 ml-2">Expand to see comments</span>
                  )}
                </div>
                {/* Three Dot Menu - All Screen Sizes */}
                {user && (
                  <div className="relative user-menu-container">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="pl-3 pr-1.5 py-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 border border-white/10"
                    >
                      {user.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt={`${user.user_metadata?.display_name || user.email}'s avatar`} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-sm">
                          {(user.user_metadata?.display_name || user.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {showUserMenu && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-[#2c2c2c] border border-white/20 rounded-lg shadow-lg z-20 py-1">
                        <div className="px-3 py-3 text-sm text-white/60 border-b border-white/10 flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                            {user.user_metadata?.avatar_url ? (
                              <img 
                                src={user.user_metadata.avatar_url} 
                                alt={`${user.user_metadata?.display_name || user.email}'s avatar`} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/60 text-lg">
                                {(user.user_metadata?.display_name || user.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-center font-medium text-base text-white/90">{user.user_metadata?.display_name || user.email}</span>
                          <div className="flex items-center gap-1.5 text-xs">
                            {user.user_metadata?.user_type === 'admin' ? (
                              <>
                                <Star className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-yellow-400">Admin</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3.5 h-3.5 text-white/60" />
                                <span className="text-white/60">User</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            openSettingsModal();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Collapsible Content Area */} 
          {!isCommentsCollapsed && (
            <>
              {/* Auth Forms */}
              {!user && showAuthForm && (
                <div className="mb-8 border border-white/10 rounded-lg bg-white/5 p-6 relative">
                  <button
                    onClick={() => setShowAuthForm(false)}
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold mb-6">{showSignUp ? 'Sign Up' : 'Sign In'}</h3>
                  <form onSubmit={showSignUp ? handleSignUp : handleSignIn}>
                    <div className="space-y-4">
                      {showSignUp && (
                        <div>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Display Name"
                            className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required={showSignUp}
                          />
                        </div>
                      )}
                      <div>
                        <label htmlFor="email-input" className="sr-only">Email</label>
                        <input
                          id="email-input"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setResetMessage(null);
                            setError(null);
                          }}
                          placeholder="Email"
                          className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div>
                        <label htmlFor="password-input" className="sr-only">Password</label>
                        <input
                          id="password-input"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                          required={!isResettingPassword && !showSignUp}
                          autoComplete={showSignUp ? "new-password" : "current-password"}
                        />
                      </div>

                      {/* Forgot Password Link */}
                      {!showSignUp && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={handlePasswordReset}
                            disabled={isResettingPassword}
                            className="text-sm text-white hover:text-white/80 disabled:opacity-50 transition-colors underline"
                          >
                            {isResettingPassword ? 'Sending...' : 'Forgot Password?'}
                          </button>
                        </div>
                      )}

                      {/* Display Reset Message */}
                      {resetMessage && (
                        <div className={`text-sm p-3 rounded-lg ${resetMessage.includes('sent') ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                          {resetMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSigningIn || isSigningUp || (isResettingPassword && !showSignUp)}
                        className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {isSigningIn ? 'Signing in...' : isSigningUp ? 'Signing up...' : showSignUp ? 'Sign Up' : 'Sign In'}
                      </button>

                      {/* Switch Form Link */}
                      <div className="text-center text-sm text-white/60">
                        {showSignUp ? (
                          <span>
                            Already have an account?{' '}
                            <button
                              type="button"
                              onClick={() => setShowSignUp(false)}
                              className="text-white hover:text-white/80 transition-colors underline"
                            >
                              Sign In
                            </button>
                          </span>
                        ) : (
                          <span>
                            Don't have an account?{' '}
                            <button
                              type="button"
                              onClick={() => setShowSignUp(true)}
                              className="text-white hover:text-white/80 transition-colors underline"
                            >
                              Sign Up
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Display general errors */}
                    {error && !resetMessage && (
                      <div className="mt-4 text-sm p-3 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20">
                        {error}
                      </div>
                    )}
                  </form>
                </div>
              )}
          
              {/* Sign In Prompt */}
              {!user && !showAuthForm && (
                <div className="mb-8 p-4 border border-white/10 rounded-lg bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-white/60">Sign in or sign up to post comments</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { 
                        if (isCommentsCollapsed) setIsCommentsCollapsed(false);
                        setShowSignUp(false); 
                        setShowAuthForm(true); 
                      }}
                      className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md whitespace-nowrap"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                    <button
                      onClick={() => { 
                        if (isCommentsCollapsed) setIsCommentsCollapsed(false);
                        setShowSignUp(true); 
                        setShowAuthForm(true); 
                      }}
                      className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md whitespace-nowrap"
                    >
                      <UserPlus className="w-4 h-4" />
                      Sign Up
                    </button>
                  </div>
                </div>
              )}

              {/* Comment Form */}
              {user && !replyingTo && !editingCommentId && (
                <form onSubmit={handleSubmit} className="mb-8">
                  <div className="mb-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      rows={3}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              )}

              {/* Comments List & Show More */}
              <div className="space-y-4">
                {sortedComments.length > 0 ? (
                  <>
                    {/* Pinned Comments Section */}
                    {sortedComments.some(comment => userFlags[comment.id]?.type === 'pinned') && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Pin className="w-5 h-5 text-yellow-400" />
                          Pinned Comments
                        </h3>
                        <div className="space-y-4">
                          {sortedComments
                            .filter(comment => userFlags[comment.id]?.type === 'pinned')
                            .map(comment => renderComment(comment))}
                        </div>
                      </div>
                    )}
                    {/* Regular Comments Section */}
                    <div className="space-y-4 mb-12">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 mt-8">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-white/60" />
                          All Comments
                        </h3>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-grow">
                            <input
                              type="text"
                              placeholder="Search comments..."
                              className="w-full px-3 py-1 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="relative sort-dropdown-container flex-shrink-0">
                            <button
                              onClick={() => setShowSortDropdown(!showSortDropdown)}
                              className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors border border-white/10 px-3 py-1 rounded-lg"
                            >
                              <Filter className="w-4 h-4" />
                              <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            {showSortDropdown && (
                              <div className="absolute top-full right-0 mt-1 w-44 bg-[#2c2c2c] border border-white/20 rounded-lg shadow-lg z-10 py-1">
                                <button 
                                  onClick={() => {
                                    setSortOrder('latest');
                                    setShowSortDropdown(false);
                                  }} 
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2 ${sortOrder === 'latest' ? 'text-primary' : ''}`}
                                >
                                  <SortDesc className='w-4 h-4'/> Latest
                                </button>
                                <button 
                                  onClick={() => {
                                    setSortOrder('oldest');
                                    setShowSortDropdown(false);
                                  }} 
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2 ${sortOrder === 'oldest' ? 'text-primary' : ''}`}
                                >
                                  <SortAsc className='w-4 h-4'/> Oldest
                                </button>
                                <button 
                                  onClick={() => {
                                    setSortOrder('likes');
                                    setShowSortDropdown(false);
                                  }} 
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2 ${sortOrder === 'likes' ? 'text-primary' : ''}`}
                                >
                                  <ThumbsUp className='w-4 h-4'/> Most Upvoted
                                </button>
                                <button 
                                  onClick={() => {
                                    setSortOrder('dislikes');
                                    setShowSortDropdown(false);
                                  }} 
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2 ${sortOrder === 'dislikes' ? 'text-primary' : ''}`}
                                >
                                  <ThumbsDown className='w-4 h-4'/> Most Downvoted
                                </button>
                                <button 
                                  onClick={() => {
                                    setSortOrder('flagged');
                                    setShowSortDropdown(false);
                                  }} 
                                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 flex items-center gap-2 ${sortOrder === 'flagged' ? 'text-primary' : ''}`}
                                >
                                  <Flag className='w-4 h-4'/> Flagged
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {sortedComments.filter(comment => userFlags[comment.id]?.type !== 'pinned').length > 0 ? (
                        sortedComments
                          .filter(comment => userFlags[comment.id]?.type !== 'pinned')
                          .slice(0, visibleCommentCount)
                          .map(comment => renderComment(comment))
                      ) : (
                        <div className="text-center py-8 text-white/60">
                          <p className="text-sm">No comments yet</p>
                          <p className="text-xs mt-1">Be the first to share your thoughts!</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <p className="text-sm">No comments found</p>
                    {sortOrder === 'flagged' && (
                      <p className="text-xs mt-1">No comments have been flagged yet</p>
                    )}
                  </div>
                )}
              </div>
              {visibleCommentCount < sortedComments.length && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setVisibleCommentCount(prevCount => prevCount + 5)}
                    className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Show More Comments ({sortedComments.length - visibleCommentCount} remaining)
                  </button>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className={`text-sm p-3 rounded-lg mt-6 ${resetMessage?.includes('sent') ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                  {error || resetMessage}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Profile Settings</h3>
              <button
                onClick={() => {
                  console.log("[DEBUG] Close button clicked in Settings Modal")
                  setShowSettings(false)
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Modal Form Content (Restored) */}
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Account Type Indicator */}
              <div className="flex items-center gap-2 mb-2">
                {user?.user_metadata?.user_type === 'admin' ? (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">Admin Account</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-white/60">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">User Account</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-white/80">Display Name</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder={user?.user_metadata?.display_name || 'Enter display name'}
                  className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-white/80">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Current avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60 text-xs">
                        No avatar
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="px-4 py-2 bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer text-sm"
                  >
                    {avatarFile ? 'Change Avatar' : 'Upload Avatar'}
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h4 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h4>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h5 className="text-red-400 font-medium mb-2">Delete Account</h5>
                <p className="text-white/60 text-sm mb-4">
                  This action cannot be undone. This will permanently delete your account and remove all of your comments and replies. Any replies to your comments will also be deleted.
                </p>
                <button
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <h3 className="text-xl font-semibold text-white">Delete Comment?</h3>
            </div>
            <p className="text-white/70 mb-6">Are you sure you want to permanently delete this comment and all its replies? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              {/* Keep distinct button colors but maybe match padding/shape */}
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeletingComment}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {isDeletingComment ? (
                  <>Deleting...</>
                ) : (
                  <><Trash2 className="w-4 h-4"/>Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <h3 className="text-xl font-semibold text-white">Delete Account?</h3>
            </div>
            <p className="text-white/70 mb-6">
              This action cannot be undone. This will permanently delete your account and remove all of your comments and replies. Any replies to your comments will also be deleted.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-white/80">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmation !== 'DELETE'}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  {isDeletingAccount ? (
                    <>Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4"/>Delete Account</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 