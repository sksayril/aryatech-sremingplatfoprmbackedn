const WatchHistory = require('../../models/watchHistory.model');
const Movie = require('../../models/movie.model');
const User = require('../../models/user.model');
const os = require('os');

/**
 * Get dashboard overview statistics
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

    // Today's views (from watch history created today)
    const todayViews = await WatchHistory.countDocuments({
      createdAt: { $gte: todayStart },
    });

    // Today's watch time (sum of watched duration)
    const todayWatchTimeData = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          totalWatchTime: { $sum: '$WatchedDuration' },
        },
      },
    ]);
    const todayWatchTime = todayWatchTimeData[0]?.totalWatchTime || 0;

    // Active users (users who watched in last 5 minutes)
    const activeUsers = await WatchHistory.distinct('User', {
      LastWatchedAt: { $gte: last5Minutes },
    });

    // Live viewers (users currently watching - watched in last 2 minutes)
    const last2Minutes = new Date(now.getTime() - 2 * 60 * 1000);
    const liveViewers = await WatchHistory.distinct('User', {
      LastWatchedAt: { $gte: last2Minutes },
    });

    // Total watch time (month)
    const monthWatchTimeData = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          totalWatchTime: { $sum: '$WatchedDuration' },
        },
      },
    ]);
    const monthWatchTime = monthWatchTimeData[0]?.totalWatchTime || 0;

    // Average watch time per user (today)
    const avgWatchTimeData = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: '$User',
          totalWatchTime: { $sum: '$WatchedDuration' },
        },
      },
      {
        $group: {
          _id: null,
          avgWatchTime: { $avg: '$totalWatchTime' },
          userCount: { $sum: 1 },
        },
      },
    ]);
    const avgWatchTimePerUser = avgWatchTimeData[0]?.avgWatchTime || 0;

    // Bounce rate (users who watched less than 10 seconds)
    const totalSessions = await WatchHistory.countDocuments({
      createdAt: { $gte: todayStart },
    });
    const bouncedSessions = await WatchHistory.countDocuments({
      createdAt: { $gte: todayStart },
      WatchedDuration: { $lt: 10 },
    });
    const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

    // Video completion rate (videos watched 90% or more)
    const completedVideos = await WatchHistory.countDocuments({
      createdAt: { $gte: todayStart },
      IsCompleted: true,
    });
    const completionRate = totalSessions > 0 ? (completedVideos / totalSessions) * 100 : 0;

    // Server load status
    const serverLoad = {
      cpuUsage: os.loadavg()[0], // 1-minute load average
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: os.totalmem() - os.freemem(),
      memoryUsagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      uptime: os.uptime(),
    };

    res.json({
      success: true,
      data: {
        todayViews,
        todayWatchTime: Math.round(todayWatchTime), // in seconds
        todayWatchTimeFormatted: formatDuration(todayWatchTime),
        activeUsers: activeUsers.length,
        liveViewers: liveViewers.length,
        monthWatchTime: Math.round(monthWatchTime),
        monthWatchTimeFormatted: formatDuration(monthWatchTime),
        avgWatchTimePerUser: Math.round(avgWatchTimePerUser),
        avgWatchTimePerUserFormatted: formatDuration(avgWatchTimePerUser),
        bounceRate: Math.round(bounceRate * 100) / 100,
        completionRate: Math.round(completionRate * 100) / 100,
        serverLoad,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview',
      error: error.message,
    });
  }
};

/**
 * Get views vs watch time graph data
 */
exports.getViewsVsWatchTimeGraph = async (req, res) => {
  try {
    const { period = '7d' } = req.query; // 7d, 30d, 90d
    const days = parseInt(period.replace('d', '')) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Group by date
    const graphData = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          views: { $sum: 1 },
          watchTime: { $sum: '$WatchedDuration' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format data for chart
    const formattedData = graphData.map((item) => ({
      date: item._id,
      views: item.views,
      watchTime: Math.round(item.watchTime),
      watchTimeFormatted: formatDuration(item.watchTime),
    }));

    res.json({
      success: true,
      data: formattedData,
      period,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch views vs watch time graph',
      error: error.message,
    });
  }
};

/**
 * Get user growth data (daily/weekly)
 */
exports.getUserGrowth = async (req, res) => {
  try {
    const { type = 'daily' } = req.query; // daily, weekly
    const days = type === 'weekly' ? 90 : 30; // 90 days for weekly, 30 for daily
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let groupFormat = '%Y-%m-%d';
    if (type === 'weekly') {
      // Group by week (ISO week)
      groupFormat = '%Y-W%V';
    }

    const growthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' },
          },
          newUsers: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Calculate cumulative growth
    let cumulativeUsers = 0;
    const formattedData = growthData.map((item) => {
      cumulativeUsers += item.newUsers;
      return {
        period: item._id,
        newUsers: item.newUsers,
        cumulativeUsers,
      };
    });

    res.json({
      success: true,
      data: formattedData,
      type,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user growth data',
      error: error.message,
    });
  }
};

/**
 * Get peak streaming time (hour-wise)
 */
exports.getPeakStreamingTime = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Group by hour of day
    const peakData = await WatchHistory.aggregate([
      {
        $match: {
          LastWatchedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $hour: '$LastWatchedAt',
          },
          views: { $sum: 1 },
          watchTime: { $sum: '$WatchedDuration' },
          uniqueUsers: { $addToSet: '$User' },
        },
      },
      {
        $project: {
          hour: '$_id',
          views: 1,
          watchTime: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
        },
      },
      {
        $sort: { hour: 1 },
      },
    ]);

    // Format data for 24-hour chart
    const formattedData = peakData.map((item) => ({
      hour: item.hour,
      hourLabel: formatHour(item.hour),
      views: item.views,
      watchTime: Math.round(item.watchTime),
      watchTimeFormatted: formatDuration(item.watchTime),
      uniqueUsers: item.uniqueUsers,
    }));

    // Fill in missing hours with 0
    const fullDayData = [];
    for (let hour = 0; hour < 24; hour++) {
      const existing = formattedData.find((d) => d.hour === hour);
      if (existing) {
        fullDayData.push(existing);
      } else {
        fullDayData.push({
          hour,
          hourLabel: formatHour(hour),
          views: 0,
          watchTime: 0,
          watchTimeFormatted: '0s',
          uniqueUsers: 0,
        });
      }
    }

    res.json({
      success: true,
      data: fullDayData,
      days: parseInt(days),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch peak streaming time data',
      error: error.message,
    });
  }
};

/**
 * Helper function to format duration in seconds to readable format
 */
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Helper function to format hour to readable format
 */
function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

