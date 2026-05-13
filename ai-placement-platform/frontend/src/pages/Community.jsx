import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Tabs from '../components/community/Tabs';
import Leaderboard from '../components/community/Leaderboard';
import PostFeed from '../components/community/PostFeed';

const Community = () => {
  const [activeTab, setActiveTab] = useState('leaderboard');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-violet-200/40 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-sky-200/40 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-pink-100/40 blur-[120px]" />
      </div>

      <Sidebar />
      
      <main className="lg:pl-32 pt-24 pb-12">
        <Header />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-12 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-6xl font-black tracking-tight text-slate-900 mb-6 bg-gradient-to-r from-slate-900 via-violet-900 to-slate-900 bg-clip-text text-transparent">
              Elevate Community
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Connect with peers, share interview insights, and track your progress against the global leaderboard.
            </p>
          </div>

          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="mt-12 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
            {activeTab === 'leaderboard' ? (
              <Leaderboard />
            ) : (
              <PostFeed />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;
