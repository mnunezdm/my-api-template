const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');

/**
 *
 * @param {import('passport').PassportStatic} passport
 * @param {import('pg').Client} db
 */
function initialize(passport, db) {
  const authenticateUser = async (email, password, done) => {
    try {
      const user = await User.getByUsername(email, db);
      await user.checkPassword(password);
      return done(null, user, {
        message: 'User logged in',
      });
    } catch (e) {
      if (e === 'USER_NOT_FOUND') {
        return done({ message: 'User not found' });
      } else if (e === 'INVALID_PASSWORD') {
        return done({ message: 'Invalid password ' });
      }
      return done(e);
    }
  };

  passport.use(new LocalStrategy(authenticateUser));
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) =>
    done(null, await User.getById(id, db)),
  );
}

module.exports = initialize;
