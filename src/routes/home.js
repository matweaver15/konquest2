const express = require('express');
const { body, validationResult } = require('express-validator');

const userStore = require('../store/userStore');
const secretKeywords = require('../data/secretKeywords');

const KEYWORD_POINTS = 100;

const router = express.Router();

const keywordValidator = body('keyword')
  .trim()
  .toLowerCase()
  .isLength({ min: 1 })
  .withMessage('Enter a keyword before submitting.')
  .isIn(secretKeywords)
  .withMessage('Keyword not recognized. Try again.');

function getSessionUser(req) {
  if (!req.session.user) {
    return null;
  }

  const storedUser = userStore.findById(req.session.user.id);
  if (!storedUser) {
    delete req.session.user;
    return null;
  }

  const publicUser = userStore.toPublicUser(storedUser);
  req.session.user = publicUser;
  return publicUser;
}

function renderHome(req, res, keywordState = {}) {
  const user = getSessionUser(req);

  res.render('home', {
    user,
    keywordState: {
      errors: keywordState.errors || [],
      success: keywordState.success || null,
      info: keywordState.info || null,
      value: keywordState.value || '',
    },
  });
}

router.get('/', (req, res) => {
  renderHome(req, res);
});

router.post('/submit-keyword', keywordValidator, (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return res.redirect('/auth/login');
  }

  const validationErrors = validationResult(req);
  const submittedKeyword = (req.body.keyword || '').trim();
  const normalizedKeyword = submittedKeyword.toLowerCase();

  if (!validationErrors.isEmpty()) {
    return renderHome(req, res, {
      errors: validationErrors.array(),
      value: submittedKeyword,
    });
  }

  const { user: updatedUser, alreadyUsed } = userStore.recordKeywordUsage(
    sessionUser.id,
    normalizedKeyword,
    KEYWORD_POINTS
  );

  if (!updatedUser) {
    delete req.session.user;
    return res.redirect('/auth/login');
  }

  req.session.user = userStore.toPublicUser(updatedUser);

  if (alreadyUsed) {
    return renderHome(req, res, {
      info: `You already claimed "${normalizedKeyword}". Try another keyword.`,
    });
  }

  return renderHome(req, res, {
    success: `Nice find! "${normalizedKeyword}" earned you ${KEYWORD_POINTS} points.`,
  });
});

router.get('/leaderboard', (req, res) => {
  const user = getSessionUser(req);
  const leaderboard = userStore.getLeaderboard();

  res.render('leaderboard', {
    user,
    leaderboard,
  });
});

module.exports = router;
