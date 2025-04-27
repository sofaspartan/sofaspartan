import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteCommentModalProps {
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteCommentModal({
  isDeleting,
  onConfirm,
  onCancel
}: DeleteCommentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-lg p-6 max-w-md w-full mx-4 shadow-lg relative">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <h3 className="text-xl font-semibold text-white">Delete Comment?</h3>
        </div>
        <p className="text-white/70 mb-6">
          Are you sure you want to permanently delete this comment and all its replies? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>Deleting...</>
            ) : (
              <><Trash2 className="w-4 h-4"/>Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 