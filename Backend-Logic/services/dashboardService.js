const pollRepository = require('../repositories/pollRepository');

const getDashboard = async (userId) => {
    const [summary, recentPolls, recentActivity] = await Promise.all([
        pollRepository.getDashboardSummary(userId),
        pollRepository.listRecent(userId),
        pollRepository.getRecentActivity(userId)
    ]);

    return { summary, recentPolls, recentActivity };
};

module.exports = { getDashboard };
