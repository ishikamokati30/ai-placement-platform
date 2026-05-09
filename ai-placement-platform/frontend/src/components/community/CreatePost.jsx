import React, { useState } from 'react';
import axios from 'axios';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTags, setShowTags] = useState(false);

  const availableTags = ['DSA', 'OS', 'DBMS', 'System Design', 'Behavioral', 'General'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/community/post`,
        { content, tags },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setContent('');
      setTags([]);
      setShowTags(false);
      onPostCreated(response.data);
    } catch (err) {
      console.error(err);
      alert('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-2xl border border-white/50 rounded-[32px] p-8 mb-10 shadow-[0_15px_40px_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an interview experience, ask a question, or discuss a topic..."
            className="w-full bg-white/40 border border-white/60 rounded-2xl p-6 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500/30 transition-all duration-300 min-h-[140px] resize-none text-[17px] font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTags(!showTags)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 text-sm font-bold ${
                showTags || tags.length > 0 
                  ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/20' 
                  : 'bg-white/60 text-slate-500 border-white/80 hover:bg-white hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {tags.length > 0 ? `${tags.length} Tagged` : 'Add Tags'}
            </button>
            
            {tags.length > 0 && !showTags && (
              <div className="flex gap-1.5 animate-in fade-in slide-in-from-left-2">
                {tags.map(t => (
                  <span key={t} className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-1 rounded-md uppercase tracking-wider">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-slate-900 text-white px-10 py-3.5 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all duration-300 shadow-xl shadow-slate-900/10 active:scale-95"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Posting...</span>
              </div>
            ) : 'Post to Community'}
          </button>
        </div>

        {showTags && (
          <div className="flex flex-wrap gap-2 p-6 bg-white/60 rounded-2xl border border-white/80 animate-in zoom-in-95 duration-300">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-widest border ${
                  tags.includes(tag)
                    ? 'bg-violet-100 text-violet-600 border-violet-200'
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePost;
