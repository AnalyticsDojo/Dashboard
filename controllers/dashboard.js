/**
 * GET /
 * Dashboard page.
 */
exports.dashboardIndex = function(req, res) {
	var _ = require('lodash');
	var Twit = require('twit');
	var day_of_week = [1,2,3,4,5,6,7,8,9];
	var token = _.find(req.user.tokens, { kind: 'twitter' });
	var T = new Twit({
		consumer_key: process.env.TWITTER_KEY,
	    consumer_secret: process.env.TWITTER_SECRET,
	    access_token: token.accessToken,
	    access_token_secret: token.tokenSecret
	});
	T.get('search/tweets', { q: 'nepal since:2016-01-01', count: 100 }, function(err, reply) {
		if (err) {
	      	return next(err);
	    }
	    var arr_days = [];
	    for (var i = 0; i < reply.statuses.length; i++){
	    	reply.statuses[i].created_at = new Date(reply.statuses[i].created_at);
	    	arr_days.push(reply.statuses[i].created_at.getSeconds().toString());
	    }
	    var days = [], counts_of_days = [], prev;

	    arr_days.sort();
	    for ( var i = 0; i < arr_days.length; i++ ) {
	        if ( arr_days[i] !== prev ) {
	            days.push(arr_days[i]);
	            counts_of_days.push(1);
	        } else {
	            counts_of_days[counts_of_days.length-1]++;
	        }
	        prev = arr_days[i];
	    }
	    // console.log(days);
	    // console.log(counts_of_days);
	    res.render('dashboard', {
      		title: 'Dashboard',
      		a: JSON.stringify(days),
      		b: JSON.stringify(counts_of_days)
		});
	});
	// console.log(reply);
};
