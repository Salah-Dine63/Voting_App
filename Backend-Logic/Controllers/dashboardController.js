const dashboardService = require('../services/dashboardService');
const { asyncHandler } = require('../utils/asyncHandler');

const getDashboard = asyncHandler(async (req, res) => {
    res.json(await dashboardService.getDashboard(req.user.id));
});

module.exports = { getDashboard };
