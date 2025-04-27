import { MoreVertical, Settings, LogOut, Star, User } from 'lucide-react';
import { useState } from 'react';

interface UserAvatarButtonProps {
  user: any;
  onSignOut: () => void;
  onOpenSettings: () => void;
}

export default function UserAvatarButton({ user, onSignOut, onOpenSettings }: UserAvatarButtonProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
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
              onOpenSettings();
              setShowUserMenu(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => {
              onSignOut();
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
  );
} 