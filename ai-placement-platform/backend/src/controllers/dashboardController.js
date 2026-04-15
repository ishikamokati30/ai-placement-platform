const dashboardService = require("../services/dashboardService");

// 📊 Dashboard data
const getDashboard = async (req, res) => {
  try {
    const stats = await dashboardService.getUserStats(req.user.id);

    const readiness = Math.round((stats.avg_score || 0) * 10);

    res.json({
      readinessScore: readiness,
      message: `You are ${readiness}% ready for interviews`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching dashboard" });
  }
};

// 📈 Progress graph
const getProgress = async (req, res) => {
  try {
    const data = await dashboardService.getProgress(req.user.id);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching progress" });
  }
};

module.exports = {
  getDashboard,
  getProgress,
};