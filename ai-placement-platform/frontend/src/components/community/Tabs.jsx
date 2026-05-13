import React from 'react';

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'discussions', label: 'Discussions' },
  ];

  return (
    <div className="flex gap-2 p-1 bg-white/30 backdrop-blur-md rounded-2xl border border-white/20 w-fit mx-auto mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeTab === tab.id
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
