const dashboardService = require("../services/dashboardService");

const calculateStreak = (interviews) => {
  if (interviews.length === 0) return 0;

  const dates = [...new Set(interviews.map(i => 
    new Date(i.created_at).toISOString().split('T')[0]
  ))].sort().reverse();

  let streak = 0;
  let today = new Date().toISOString().split('T')[0];
  let yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let currentDate = new Date(dates[0]);
  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    const diff = (currentDate - d) / (1000 * 60 * 60 * 24);
    
    if (diff === i) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const groupByWeek = (interviews) => {
  const weeks = {};
  interviews.forEach(i => {
    const date = new Date(i.created_at);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((date - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
    const key = `Week ${weekNum}`;
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(i.score);
  });

  return Object.keys(weeks).map(key => ({
    week: key,
    score: Math.round(weeks[key].reduce((a, b) => a + b, 0) / weeks[key].length * 10)
  })).slice(-6);
};

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const interviews = await dashboardService.getAllInterviews(userId);

    if (!interviews || interviews.length === 0) {
      return res.json({
        totalInterviews: 0,
        readinessScore: 0,
        avgScore: 0,
        streak: 0,
        progress: [],
        topicPerformance: [],
        weakAreas: [],
        strongAreas: [],
        insights: ["Start your first interview to unlock insights"]
      });
    }

    const total = interviews.length;
    const avgScore = interviews.reduce((a, b) => a + (Number(b.score) || 0), 0) / total;
    const readiness = Math.round(avgScore * 10);
    const streak = calculateStreak(interviews);
    const progress = groupByWeek(interviews);

    const topicMap = {};
    interviews.forEach(i => {
      if (!i.topic) return;
      if (!topicMap[i.topic]) topicMap[i.topic] = [];
      topicMap[i.topic].push(Number(i.score) || 0);
    });

    const topicPerformance = Object.keys(topicMap).map(t => ({
      topic: t,
      avgScore: topicMap[t].reduce((a, b) => a + b, 0) / topicMap[t].length
    }));

    const weakAreas = topicPerformance
      .filter(t => t.avgScore < 5)
      .map(t => t.topic);

    const strongAreas = topicPerformance
      .filter(t => t.avgScore > 7)
      .map(t => t.topic);

    const insights = [];
    if (weakAreas.length > 0) {
      insights.push(`Focus on ${weakAreas.slice(0, 2).join(", ")} to improve your readiness.`);
    }
    if (avgScore > 7) {
      insights.push("You are interview ready! Keep practicing to stay sharp.");
    }
    if (progress.length >= 2) {
      const last = progress[progress.length - 1].score;
      const prev = progress[progress.length - 2].score;
      const diff = last - prev;
      if (diff > 0) {
        insights.push(`You improved ${diff}% this week!`);
      }
    }

    res.json({
      totalInterviews: total,
      readinessScore: readiness,
      avgScore,
      streak,
      progress,
      topicPerformance,
      weakAreas,
      strongAreas,
      insights
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching dashboard" });
  }
};

module.exports = {
  getDashboard,
};
