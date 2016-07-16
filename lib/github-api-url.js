const api_url = 'https://api.github.com/';

module.exports = {
  userProfile: function (user_id) {
    return `${api_url}users/${user_id}`;
  },
  repository: function (user_id, repo) {
    return `${api_url}repos/${user_id}/${repo}`;
  },
  stargazers: function (user_id, repo) {
    return `${api_url}repos/${user_id}/${repo}/stargazers`;
  },
  forks: function (user_id, repo) {
    return `${api_url}repos/${user_id}/${repo}/forks`;
  },
  rateLimit: function () {
    return `${api_url}rate_limit`;
  },
  addAuthInfo: function (url, github_api_auth) {
    if (github_api_auth === undefined)
      github_api_auth = { client_id: '', client_secret: ''};
    return `${url}?client_id=${github_api_auth.client_id}&client_secret=${github_api_auth.client_secret}`;
  },
  pagination: function (url, page, per_page) {
    return `${url}&page=${page}&per_page=${per_page}`;
  }
};
