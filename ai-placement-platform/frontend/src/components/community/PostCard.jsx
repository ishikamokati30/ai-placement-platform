import React, { useState } from 'react';
import API from '../../services/api';
import CommentSection from './CommentSection';

const PostCard = ({ post, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [upvotes, setUpvotes] = useState(post.upvotes || 0);
  const [upvotedBy, setUpvotedBy] = useState(post.upvotedBy || []);
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const isUpvoted = upvotedBy.includes(currentUser.id);
  const [isLiking, setIsLiking] = useState(false);

  const handleUpvote = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic Update
    const newIsUpvoted = !isUpvoted;
    setUpvotes(prev => newIsUpvoted ? prev + 1 : prev - 1);
    setUpvotedBy(prev => newIsUpvoted 
      ? [...prev, currentUser.id] 
      : prev.filter(id => id !== currentUser.id)
    );

    try {
      const response = await API.post('/community/upvote', { postId: post.id });
      // Sync with server response
      setUpvotes(response.data.upvotes);
      setUpvotedBy(response.data.upvotedBy);
    } catch (err) {
      console.error(err);
      // Rollback on error
      setUpvotes(prev => !newIsUpvoted ? prev + 1 : prev - 1);
      setUpvotedBy(prev => !newIsUpvoted 
        ? [...prev, currentUser.id] 
        : prev.filter(id => id !== currentUser.id)
      );
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] group">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/10 to-sky-500/10 flex items-center justify-center border border-white/50">
              <span className="text-xl font-black bg-gradient-to-br from-violet-600 to-sky-500 bg-clip-text text-transparent">
                {post.username?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg leading-tight">{post.username}</h4>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-0.5">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {post.tags?.map((tag) => (
              <span 
                key={tag} 
                className="px-4 py-1.5 rounded-full bg-white/60 border border-white/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed text-[17px] mb-8 font-medium">
          {post.content}
        </p>

        <div className="flex items-center gap-6 pt-6 border-t border-white/30">
          <button 
            onClick={handleUpvote}
            className={`flex items-center gap-2 group/btn transition-all duration-300 ${
              isUpvoted ? 'text-rose-500 scale-105' : 'text-slate-400 hover:text-rose-500'
            }`}
          >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${
              isUpvoted ? 'bg-rose-500/10' : 'bg-slate-100/50 group-hover/btn:bg-rose-50'
            }`}>
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${isUpvoted ? 'fill-current' : 'group-hover/btn:scale-110'}`} 
                fill={isUpvoted ? 'currentColor' : 'none'} 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight">{upvotes}</span>
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 group/btn text-slate-400 hover:text-sky-500 transition-all duration-300"
          >
            <div className="p-2.5 rounded-xl bg-slate-100/50 group-hover/btn:bg-sky-50 transition-all duration-300">
              <svg 
                className="w-5 h-5 group-hover/btn:scale-110 transition-transform duration-300" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight">{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>

      {showComments && (
        <CommentSection 
          postId={post.id} 
          initialComments={post.comments || []} 
          onCommentAdded={(newComment) => {
            const updatedPost = { ...post, comments: [...(post.comments || []), newComment] };
            onUpdate(updatedPost);
          }}
        />
      )}
    </div>
  );
};

export default PostCard;
