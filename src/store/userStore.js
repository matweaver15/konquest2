const users = [];

function createUser({ username, passwordHash }) {
  const user = {
    id: users.length + 1,
    username,
    passwordHash,
    createdAt: new Date(),
    score: 0,
    usedKeywords: [],
  };
  users.push(user);
  return user;
}

function findByUsername(username) {
  return users.find((user) => user.username === username);
}

function findById(id) {
  return users.find((user) => user.id === id);
}

function toPublicUser(user) {
  if (!user) {
    return null;
  }
  return { id: user.id, username: user.username, score: user.score };
}

function recordKeywordUsage(userId, keyword, points) {
  const user = findById(userId);
  if (!user) {
    return { user: null, alreadyUsed: false };
  }

  const normalizedKeyword = keyword.toLowerCase();

  if (user.usedKeywords.includes(normalizedKeyword)) {
    return { user, alreadyUsed: true };
  }

  user.usedKeywords.push(normalizedKeyword);
  user.score += points;
  return { user, alreadyUsed: false };
}

function getLeaderboard() {
  return [...users]
    .sort((a, b) => {
      if (b.score === a.score) {
        return a.username.localeCompare(b.username);
      }
      return b.score - a.score;
    })
    .map((user) => toPublicUser(user));
}

module.exports = {
  createUser,
  findByUsername,
  findById,
  toPublicUser,
  recordKeywordUsage,
  getLeaderboard,
};
