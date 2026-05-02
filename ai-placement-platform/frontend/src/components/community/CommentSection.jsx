import React, { useState } from 'react';
import axios from 'axios';

const CommentSection = ({ postId, initialComments, onCommentAdded }) => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/community/comment', 
        { postId, text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const commentData = response.data;
      setComments([...comments, commentData]);
      setNewComment('');
      onCommentAdded(commentData);
    } catch (err) {
      console.error(err);
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50/50 border-t border-white/40 p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment, idx) => (
            <div key={comment.id || idx} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 flex-shrink-0">
                <span className="text-sm font-bold text-slate-400">
                  {comment.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="bg-white/80 border border-white p-5 rounded-[24px] shadow-sm transition-all duration-300 group-hover:shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-sm">{comment.username}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {comment.text}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-400 text-sm font-medium italic">No comments yet. Be the first to join the conversation!</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a helpful comment..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-6 pr-32 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500/30 transition-all duration-300 font-medium shadow-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white px-6 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all duration-300 disabled:opacity-50"
        >
          {isSubmitting ? '...' : 'Reply'}
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
