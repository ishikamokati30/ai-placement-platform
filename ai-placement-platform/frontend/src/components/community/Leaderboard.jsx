import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import API from '../../services/api';
=======
import axios from 'axios';
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a

const Leaderboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('Global');
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
<<<<<<< HEAD
      const response = await API.get('/community/leaderboard');
=======
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/community/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
>>>>>>> 412487494f6ea411007e0aa6e5c1367233ee236a
      setData(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Unable to load leaderboard');
      setLoading(false);
      // Fallback data if API fails
      setData([
        { userId: 1, name: 'Alex Johnson', xp: 1250, interviewsGiven: 12, streak: 7, rank: 1, percentile: 99 },
        { userId: 2, name: 'Sarah Miller', xp: 1100, interviewsGiven: 10, streak: 5, rank: 2, percentile: 95 },
        { userId: currentUser.id, name: currentUser.name || 'You', xp: 950, interviewsGiven: 8, streak: 4, rank: 3, percentile: 90 },
        { userId: 4, name: 'David Chen', xp: 800, interviewsGiven: 6, streak: 3, rank: 4, percentile: 85 },
      ]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-white/20 rounded-2xl border border-white/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-slate-800">Top Performers</h3>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white/50 border border-white/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 ring-violet-500/20"
        >
          <option>Global</option>
          <option>My College</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/30 bg-white/10 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/5 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">XP</th>
              <th className="px-6 py-4">Percentile</th>
              <th className="px-6 py-4">Interviews</th>
              <th className="px-6 py-4">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.map((user) => {
              const isCurrentUser = user.userId === currentUser.id;
              return (
                <tr 
                  key={user.userId} 
                  className={`group transition-all duration-300 ${
                    isCurrentUser ? 'bg-violet-500/10' : 'hover:bg-white/20'
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      user.rank === 1 ? 'bg-amber-100 text-amber-600' :
                      user.rank === 2 ? 'bg-slate-200 text-slate-600' :
                      user.rank === 3 ? 'bg-orange-100 text-orange-600' :
                      'bg-white/40 text-slate-500'
                    }`}>
                      #{user.rank}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.name}</p>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest bg-violet-100 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-slate-900">{user.xp}</span>
                      <span className="text-[10px] font-bold text-violet-500 uppercase">XP</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-700">{user.percentile}%</span>
                      <div className="w-24 h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-sky-400" 
                          style={{ width: `${user.percentile}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-medium text-slate-600">
                    {user.interviewsGiven}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1 text-orange-500">
                      <span className="text-sm font-bold">{user.streak}</span>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.66 11.57c-.2-.07-.4-.14-.58-.23C15.8 10.68 15 9.47 15 8.12V5.41c0-.5-.33-.94-.81-1.08-.48-.15-1.01.07-1.25.51l-.22.38c-.37.66-1.08 1.07-1.84 1.07-.15 0-.3 0-.45-.03l-.4-.08c-1.3-.26-2.03-1.63-1.62-2.88l.12-.37c.18-.54-.12-1.12-.66-1.29-.54-.17-1.12.13-1.29.66l-.12.38C5.64 5.06 6.64 7.6 8.7 9.1c.42.3.89.54 1.4.71.55.19.9.74.83 1.32-.05.41-.33.74-.7.88-2.61.94-4.23 3.6-3.79 6.37.37 2.3 2.18 4.14 4.5 4.5 3.52.54 6.57-2.18 6.57-5.59 0-2.31-1.33-4.32-3.35-5.29z" />
                      </svg>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-center text-sm font-medium">
          {error} (Showing fallback data)
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
