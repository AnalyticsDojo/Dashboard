/**
 * GET /
 * Dashboard page.
 */
exports.dashboardIndex = function(req, res) {
    res.render('dashboard', {
  		title: 'Dashboard',
	});
};
