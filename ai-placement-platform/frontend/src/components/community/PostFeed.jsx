import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import CreatePost from './CreatePost';

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/community/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Unable to load discussion feed');
      setLoading(false);
      // Fallback mock posts
      setPosts([
        {
          id: 1,
          username: 'Interviewer_Pro',
          content: 'Just finished a mock interview session. The biggest tip I have for everyone is to explain your thought process clearly before writing code!',
          tags: ['DSA', 'General'],
          upvotes: 24,
          upvotedBy: [],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          comments: [
            { id: 101, username: 'Student_99', text: 'Totally agree! Communication is 50% of the interview.', createdAt: new Date(Date.now() - 1800000).toISOString() }
          ]
        },
        {
          id: 2,
          username: 'SystemDesignFan',
          content: 'Does anyone have good resources for learning about Rate Limiters? I find the token bucket algorithm a bit confusing.',
          tags: ['System Design'],
          upvotes: 12,
          upvotedBy: [],
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          comments: []
        }
      ]);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleUpdatePost = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 bg-white/20 rounded-[32px]" />
        <div className="h-60 bg-white/20 rounded-[32px]" />
        <div className="h-60 bg-white/20 rounded-[32px]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <CreatePost onPostCreated={handlePostCreated} />
      
      {posts.length > 0 ? (
        <div className="space-y-8">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onUpdate={handleUpdatePost}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/30 backdrop-blur-md rounded-[40px] border border-white/40">
          <div className="w-20 h-20 bg-white/50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No posts yet</h3>
          <p className="text-slate-500 font-medium max-w-xs mx-auto">Be the first to share something with the community!</p>
        </div>
      )}

      {error && (
        <div className="mt-8 bg-red-50 text-red-500 p-4 rounded-2xl text-center text-sm font-medium">
          {error} (Showing fallback posts)
        </div>
      )}
    </div>
  );
};

export default PostFeed;
