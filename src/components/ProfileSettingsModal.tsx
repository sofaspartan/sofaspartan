import { useState } from 'react';
import { X, Star, User, Trash2, AlertTriangle, Bell, Settings, UserCircle } from 'lucide-react';
import { showToast } from './ToastNotifications';

interface ProfileSettingsModalProps {
  user: any;
  onClose: () => void;
  onSignOut: () => void;
  onProfileUpdate: (newDisplayName: string, newEmail: string, avatarFile: File | null) => Promise<void>;
  onDeleteAccount: (confirmation: string) => Promise<void>;
}

type Tab = 'profile' | 'toasts' | 'advanced';

export default function ProfileSettingsModal({
  user,
  onClose,
  onSignOut,
  onProfileUpdate,
  onDeleteAccount
}: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [newDisplayName, setNewDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastSettings, setToastSettings] = useState({
    commentToasts: user?.user_metadata?.toast_settings?.commentToasts ?? true,
    profileToasts: user?.user_metadata?.toast_settings?.profileToasts ?? true,
    systemToasts: user?.user_metadata?.toast_settings?.systemToasts ?? true,
  });
  const [isUpdatingToasts, setIsUpdatingToasts] = useState(false);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setError(null);
    try {
      await onProfileUpdate(newDisplayName, newEmail, avatarFile);
      onClose();
    } catch (err) {
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

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsDeletingAccount(true);
    setError(null);
    try {
      await onDeleteAccount(deleteConfirmation);
      setShowDeleteAccountModal(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Handle toast settings update
  const handleToastSettingsUpdate = async () => {
    setIsUpdatingToasts(true);
    try {
      await onProfileUpdate(newDisplayName, newEmail, avatarFile);
      showToast.success.profileUpdate();
      onClose();
    } catch (err) {
      showToast.error.profileUpdate();
    } finally {
      setIsUpdatingToasts(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Profile Settings</h3>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('toasts')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'toasts'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              Toasts
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'advanced'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              Advanced
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'profile' && (
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
                  <label className="block text-sm font-medium mb-1 text-white/80">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={user?.email || 'Enter email'}
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
                    onClick={onClose}
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
            )}

            {activeTab === 'toasts' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold mb-4">Toast Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-white/80">Comment Notifications</label>
                    <button
                      onClick={() => setToastSettings(prev => ({ ...prev, commentToasts: !prev.commentToasts }))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        toastSettings.commentToasts ? 'bg-primary' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                        toastSettings.commentToasts ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-white/80">Profile Notifications</label>
                    <button
                      onClick={() => setToastSettings(prev => ({ ...prev, profileToasts: !prev.profileToasts }))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        toastSettings.profileToasts ? 'bg-primary' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                        toastSettings.profileToasts ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-white/80">System Notifications</label>
                    <button
                      onClick={() => setToastSettings(prev => ({ ...prev, systemToasts: !prev.systemToasts }))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        toastSettings.systemToasts ? 'bg-primary' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                        toastSettings.systemToasts ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-white/70 hover:text-white transition-colors rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleToastSettingsUpdate}
                    disabled={isUpdatingToasts}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {isUpdatingToasts ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-4">
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
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 text-sm p-3 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20">
              {error}
            </div>
          )}
        </div>
      </div>

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
    </>
  );
} 