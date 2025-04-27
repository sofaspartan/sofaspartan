import { useState } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { showToast } from './ToastNotifications';
import { createClient } from '@supabase/supabase-js';

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

interface AuthModalsProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModals({ isOpen, onClose, onAuthSuccess }: AuthModalsProps) {
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setError(null);
    setIsSigningIn(true);
    
    try {
      console.log('Signing in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes('Email not confirmed')) {
          showToast.info.emailNotConfirmed();
        } else {
          showToast.error.signIn();
        }
        throw error;
      }

      console.log('Sign in successful:', data);
      showToast.success.signIn();
      setEmail('');
      setPassword('');
      onAuthSuccess();
      onClose();
    } catch (err) {
      console.error('Error signing in:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setError(null);
    setIsSigningUp(true);
    
    try {
      console.log('Signing up...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName,
            email_confirmed: false,
            user_type: 'regular'
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        showToast.error.signUp();
        throw error;
      }

      console.log('Sign up successful:', data);
      showToast.success.signUp();
      
      if (data.user?.identities?.length === 0) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError('Please check your email for the confirmation link. If you don\'t see it, check your spam folder.');
      }
      
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (err) {
      console.error('Error signing up:', err);
      setError('Failed to sign up. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!email) {
      showToast.error.emailRequired();
      return;
    }
    setIsResettingPassword(true);
    setResetMessage(null);
    setError(null);
    
    try {
      console.log(`Attempting password reset for: ${email}`);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (resetError) {
        showToast.error.resetFailed();
        throw resetError;
      }
      showToast.success.resetSent();
      setResetMessage('Password reset email sent! Check your inbox (and spam folder).');
    } catch (err: any) {
      console.error('Error sending password reset email:', err);
      setResetMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{showSignUp ? 'Sign Up' : 'Sign In'}</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
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
    </div>
  );
} 