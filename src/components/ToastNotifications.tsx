import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, AlertCircle, Pin, Flag, WifiOff, Wifi, RefreshCw, Clock } from "lucide-react";

export const showToast = {
  // Success toasts
  success: {
    signIn: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Signed in
        </div>
      ),
      description: "You have successfully signed in",
      variant: "success",
    }),
    signUp: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Sign up successful
        </div>
      ),
      description: "Please check your email for the confirmation link",
      variant: "success",
    }),
    signOut: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Signed out
        </div>
      ),
      description: "You have successfully signed out",
      variant: "success",
    }),
    commentPosted: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Comment posted
        </div>
      ),
      description: "Your comment has been posted successfully",
      variant: "success",
    }),
    commentDeleted: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Comment deleted
        </div>
      ),
      description: "The comment has been deleted successfully",
      variant: "success",
    }),
    commentEdited: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Comment edited
        </div>
      ),
      description: "The comment has been edited successfully",
      variant: "success",
    }),
    flagRemoved: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Flag removed
        </div>
      ),
      description: "The flag has been removed successfully",
      variant: "success",
    }),
    commentFlagged: (flagType: string) => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Comment flagged
        </div>
      ),
      description: `Comment has been flagged as ${flagType}`,
      variant: "success",
    }),
    commentPinned: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Comment pinned
        </div>
      ),
      description: "The comment has been pinned successfully",
      variant: "success",
    }),
    commentUnpinned: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Comment unpinned
        </div>
      ),
      description: "The comment has been unpinned successfully",
      variant: "success",
    }),
    allFlagsRemoved: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          All flags removed
        </div>
      ),
      description: "All flags have been removed successfully",
      variant: "success",
    }),
    profileUpdate: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Profile updated
        </div>
      ),
      description: "Your profile has been updated successfully",
      variant: "success",
    }),
    resetSent: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Reset email sent
        </div>
      ),
      description: "Password reset email sent! Check your inbox (and spam folder).",
      variant: "success",
    }),
    voteSubmitted: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Vote submitted
        </div>
      ),
      description: "Your vote has been recorded successfully",
      variant: "success",
    }),
    voteRemoved: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Vote removed
        </div>
      ),
      description: "Your vote has been removed successfully",
      variant: "success",
    }),
    voteUpdated: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Vote updated
        </div>
      ),
      description: "Your vote has been updated successfully",
      variant: "success",
    }),
    avatarUploaded: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Avatar uploaded
        </div>
      ),
      description: "Your avatar has been uploaded successfully",
      variant: "success",
    }),
    accountDeleted: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Account deleted
        </div>
      ),
      description: "Your account has been deleted successfully",
      variant: "success",
    }),
    replyPosted: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Reply posted
        </div>
      ),
      description: "Your reply has been posted successfully",
      variant: "success",
    }),
    replyDeleted: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Reply deleted
        </div>
      ),
      description: "The reply has been deleted successfully",
      variant: "success",
    }),
    connectionRestored: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4" />
          Connection restored
        </div>
      ),
      description: "Your connection has been restored",
      variant: "success",
    }),
  },

  // Error toasts
  error: {
    signIn: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Sign in failed
        </div>
      ),
      description: "Failed to sign in. Please try again.",
      variant: "destructive",
    }),
    signUp: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Sign up failed
        </div>
      ),
      description: "Failed to sign up. Please try again.",
      variant: "destructive",
    }),
    signOut: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Sign out failed
        </div>
      ),
      description: "Failed to sign out. Please try again.",
      variant: "destructive",
    }),
    commentPost: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Post failed
        </div>
      ),
      description: "Failed to post comment. Please try again.",
      variant: "destructive",
    }),
    commentDelete: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Delete failed
        </div>
      ),
      description: "Failed to delete comment. Please try again.",
      variant: "destructive",
    }),
    commentEdit: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Edit failed
        </div>
      ),
      description: "Failed to edit comment. Please try again.",
      variant: "destructive",
    }),
    flag: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Flag failed
        </div>
      ),
      description: "Failed to flag comment. Please try again.",
      variant: "destructive",
    }),
    unflag: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Unflag failed
        </div>
      ),
      description: "Failed to remove flag. Please try again.",
      variant: "destructive",
    }),
    pin: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Pin failed
        </div>
      ),
      description: "Failed to pin comment. Please try again.",
      variant: "destructive",
    }),
    unpin: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Unpin failed
        </div>
      ),
      description: "Failed to unpin comment. Please try again.",
      variant: "destructive",
    }),
    removeAllFlags: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Remove all flags failed
        </div>
      ),
      description: "Failed to remove all flags. Please try again.",
      variant: "destructive",
    }),
    commentFetch: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Error
        </div>
      ),
      description: "Failed to fetch new comment. Please refresh the page.",
      variant: "destructive",
    }),
    voteRemove: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Failed to remove vote
        </div>
      ),
      description: "Failed to remove your vote. Please try again.",
      variant: "destructive",
    }),
    voteUpdate: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Failed to update vote
        </div>
      ),
      description: "Failed to update your vote. Please try again.",
      variant: "destructive",
    }),
    voteSubmit: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Failed to vote
        </div>
      ),
      description: "Failed to submit your vote. Please try again.",
      variant: "destructive",
    }),
    avatarUpload: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Upload failed
        </div>
      ),
      description: "Failed to upload avatar. Please try again.",
      variant: "destructive",
    }),
    profileUpdate: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Update failed
        </div>
      ),
      description: "Failed to update profile. Please try again.",
      variant: "destructive",
    }),
    emailRequired: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Email required
        </div>
      ),
      description: "Please enter your email address first.",
      variant: "destructive",
    }),
    resetFailed: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Reset failed
        </div>
      ),
      description: "Failed to send reset email. Please try again.",
      variant: "destructive",
    }),
    accountDelete: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Delete failed
        </div>
      ),
      description: "Failed to delete account. Please try again.",
      variant: "destructive",
    }),
    replyPost: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Reply failed
        </div>
      ),
      description: "Failed to post reply. Please try again.",
      variant: "destructive",
    }),
    replyDelete: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Delete failed
        </div>
      ),
      description: "Failed to delete reply. Please try again.",
      variant: "destructive",
    }),
    connectionLost: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          Connection lost
        </div>
      ),
      description: "Your connection has been lost. Please check your internet connection.",
      variant: "destructive",
    }),
    cannotRemoveFlag: () => toast({
      title: "Error",
      description: "You can only remove your own flags.",
      variant: "destructive",
    }),
  },

  // Info toasts
  info: {
    signInRequired: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Sign in required
        </div>
      ),
      description: "Please sign in to perform this action.",
      variant: "destructive",
    }),
    trackReactionSignInRequired: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Sign in required
        </div>
      ),
      description: "You must log in in the comments section to add reactions to tracks",
      variant: "destructive",
    }),
    emailNotConfirmed: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Email not confirmed
        </div>
      ),
      description: "Please confirm your email address before signing in. Check your email for the confirmation link.",
      variant: "destructive",
    }),
    sessionExpired: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Session expired
        </div>
      ),
      description: "Your session has expired. Please sign in again.",
      variant: "destructive",
    }),
    autoSignOut: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Signed out
        </div>
      ),
      description: "You have been automatically signed out due to inactivity.",
      variant: "destructive",
    }),
    refreshRequired: () => toast({
      title: (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh required
        </div>
      ),
      description: "Please refresh the page to see the latest changes.",
      variant: "destructive",
    }),
  },
}; 