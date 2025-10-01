const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const userStore = require('../store/userStore');

const router = express.Router();

const usernameSanitizer = body('username')
  .trim()
  .isLength({ min: 3, max: 20 })
  .withMessage('Username must be between 3 and 20 characters.')
  .matches(/^[a-zA-Z0-9_-]+$/)
  .withMessage('Username can only contain letters, numbers, underscores, and dashes.')
  .customSanitizer((value) => value.toLowerCase());

const passwordValidator = body('password')
  .isLength({ min: 6, max: 100 })
  .withMessage('Password must be between 6 and 100 characters.')
  .matches(/[A-Za-z]/)
  .withMessage('Password must contain at least one letter.')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number.');

router.get('/register', (req, res) => {
  res.render('register', { errors: [], values: { username: '' } });
});

router.post('/register', [usernameSanitizer, passwordValidator], async (req, res) => {
  const { username, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('register', { errors: errors.array(), values: { username } });
  }

  const existingUser = userStore.findByUsername(username);
  if (existingUser) {
    return res.status(409).render('register', {
      errors: [{ msg: 'Username already exists.' }],
      values: { username },
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = userStore.createUser({ username, passwordHash });
    req.session.user = userStore.toPublicUser(user);
    return res.redirect('/');
  } catch (error) {
    return res.status(500).render('register', {
      errors: [{ msg: 'Could not create account. Please try again.' }],
      values: { username },
    });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { errors: [], values: { username: '' } });
});

router.post(
  '/login',
  [usernameSanitizer, body('password').notEmpty().withMessage('Password is required.')],
  async (req, res) => {
    const { username, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('login', { errors: errors.array(), values: { username } });
    }

    const user = userStore.findByUsername(username);
    if (!user) {
      return res.status(401).render('login', {
        errors: [{ msg: 'Invalid username or password.' }],
        values: { username },
      });
    }

    try {
      const passwordMatches = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatches) {
        return res.status(401).render('login', {
          errors: [{ msg: 'Invalid username or password.' }],
          values: { username },
        });
      }

      req.session.user = userStore.toPublicUser(user);
      return res.redirect('/');
    } catch (error) {
      return res.status(500).render('login', {
        errors: [{ msg: 'Could not log in. Please try again.' }],
        values: { username },
      });
    }
  }
);

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('konquest.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
