"use client";

interface DeleteDramaConfirmModalProps {
  open: boolean;
  dramaTitle?: string;
  submitting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteDramaConfirmModal({
  open,
  dramaTitle,
  submitting = false,
  error,
  onCancel,
  onConfirm,
}: DeleteDramaConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-[#1a1a2e] p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white">Confirm Delete</h3>
        <p className="mt-2 text-sm text-gray-400">
          Are you sure you want to delete &ldquo;{dramaTitle || "this drama"}&rdquo;? This action cannot be undone.
        </p>

        {error ? (
          <div className="mt-3 rounded-lg border border-red-700/50 bg-red-900/30 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

