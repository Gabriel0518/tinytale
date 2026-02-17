"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../layout";
import { adminApi } from "@/lib/adminApi";

interface Comment {
  _id: string;
  userId: string;
  user?: { nickname: string; email: string };
  dramaId: string;
  drama?: { title: string };
  episodeId?: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  likes: number;
  createdAt: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const params = filter !== "all" ? { status: filter } : undefined;
        const res: any = await adminApi.getComments(params);
        setComments(res.data?.comments || res.data || []);
      } catch (err) {
        console.error(err);
        // Mock data
        setComments([
          { _id: "1", userId: "u1", user: { nickname: "Alice", email: "alice@test.com" }, dramaId: "d1", drama: { title: "CEO's Love" }, content: "Great drama!", status: "pending", likes: 5, createdAt: "2024-01-15T10:00:00Z" },
          { _id: "2", userId: "u2", user: { nickname: "Bob", email: "bob@test.com" }, dramaId: "d1", drama: { title: "CEO's Love" }, content: "Amazing story", status: "approved", likes: 12, createdAt: "2024-01-14T08:00:00Z" },
          { _id: "3", userId: "u3", user: { nickname: "Carol", email: "carol@test.com" }, dramaId: "d2", drama: { title: "Revenge" }, content: "Spam content here", status: "rejected", likes: 0, createdAt: "2024-01-13T15:00:00Z" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [filter]);

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveComment(id);
      setComments((prev) => prev.map((c) => c._id === id ? { ...c, status: "approved" } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminApi.rejectComment(id);
      setComments((prev) => prev.map((c) => c._id === id ? { ...c, status: "rejected" } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await adminApi.deleteComment(id);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Comment Management</h1>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === f.id ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
            ))
          ) : comments.length === 0 ? (
            <div className="rounded-xl bg-white py-12 text-center text-gray-400 shadow-sm">
              No comments found
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{comment.user?.nickname || "Unknown"}</span>
                      <span className="text-xs text-gray-400">{comment.user?.email}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[comment.status]}`}>
                        {comment.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{comment.content}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>Drama: {comment.drama?.title || comment.dramaId}</span>
                      <span>{comment.likes} likes</span>
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {comment.status === "pending" && (
                      <>
                        <button onClick={() => handleApprove(comment._id)} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
                          Approve
                        </button>
                        <button onClick={() => handleReject(comment._id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
                          Reject
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(comment._id)} className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
