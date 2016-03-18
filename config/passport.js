var _ = require('lodash');
var passport = require('passport');
var request = require('request');
var LocalStrategy = require('passport-local').Strategy;
var ForceDotComStrategy = require('passport-forcedotcom').Strategy;

var User = require('../models/User');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  email = email.toLowerCase();
  User.findOne({ email: email }, function(err, user) {
    if (!user) {
      return done(null, false, { message: 'Email ' + email + ' not found'});
    }
    user.comparePassword(password, function(err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid email or password.' });
      }
    });
  });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */


/**
 * Sign in with Salesforce.
 */
passport.use(new ForceDotComStrategy({
      clientID: process.env.SALESFORCE_ID,
      clientSecret: process.env.SALESFORCE_SECRET,
      callbackURL: process.env.SALESFORCE_CALLBACK_URL,
      authorizationURL: process.env.SALESFORCE_AUTHORIZE_URL,
      tokenURL: process.env.SALESFORCE_TOKEN_URL,
      passReqToCallback: true
    },
    function(req, accessToken, refreshToken, profile, done) {
      User.findOne({ salesforce: profile._raw.user_id }, function(err, existingUser) {
        if (existingUser) {
          console.log("logging into an existing user");
          return done(null, existingUser);
        }
        User.findOne({ email: profile._raw.email }, function(err, existingEmailUser) {
          if (existingEmailUser) {
            req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Salesforce manually from Account Settings.' });
            done(err);
          } else {
            console.log("creating a new user");
            var user = new User();
            user.email = profile._raw.email;
            user.salesforce = profile._raw.user_id;
            user.tokens.push({ kind: 'salesforce', accessToken: accessToken, refreshToken: refreshToken });
            user.profile.name = profile._raw.displayName;
         //   user.profile.gender = profile._json.gender;
         //   user.profile.picture = profile._json.image.url;
            console.log("updating the user");
            user.save(function(err) {
              done(err, user);
            });
          }
        });
      });
      console.log("accesstoken :", accessToken);
    }
));


/**
 * Login Required middleware.
 */
exports.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = function(req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, { kind: provider })) {
    next();
  } else {
    res.redirect('/auth/' + provider);
  }
};
