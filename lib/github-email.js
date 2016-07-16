const github = require('./github-api-url');
const { wrap: async } = require('co');
const request = require('co-request');
const Table = require('cli-table');
const ProgressBar = require('progress');

let apiReq = async(function* (URL, method) {
  try {
    let response = yield request({
      uri: URL,
      method: method,
      headers: {
        "User-Agent": "Awesome-Octocat-App",
      }
    });

    return response.body;
  }
  catch (err) {
    // console.error(`error: ${err.message}`);
    throw err;
  }
});

module.exports = {
  apiStatus: function* (github_api_auth) {
    let rateLimitURL =  github.rateLimit();
    let URLWithAuth = github.addAuthInfo(rateLimitURL, github_api_auth);

    let result = yield Promise.resolve(apiReq(URLWithAuth, "GET"));
    result = JSON.parse(result).resources;
    let table = new Table({ head: ['Resource Type', 'Limit', 'Remaining', 'Reset Time']});
    table.push(['Core', result.core.limit, result.core.remaining, new Date(result.core.reset * 1000).toISOString()]);
    table.push(['Search', result.search.limit, result.search.remaining, new Date(result.search.reset * 1000).toISOString()]);
    console.log(table.toString());
  },
  userProfile: function* (user_login, github_api_auth) {
    let userURL = github.userProfile(user_login);
    let URLWithAuth = github.addAuthInfo(userURL, github_api_auth);

    let result = yield Promise.resolve(apiReq(URLWithAuth, "GET"));
    result = JSON.parse(result);
    result = {
      login: result.login,
      name: result.name ? result.name : result.login,
      email: result.email
    };
    return result;
  },
  stargazersUserIDs: function* (repo_user, repo_name, github_api_auth) {
    let stargazersURL =  github.stargazers(repo_user, repo_name);
    let URLWithAuth = github.addAuthInfo(stargazersURL, github_api_auth);

    let result = yield Promise.resolve(apiReq(URLWithAuth, "GET"));
    result = JSON.parse(result);
    return result;
  },
  stargazersEmails: function* (repo_user, repo_name, github_api_auth) {
    let userProfiles = [];
    let starIDs = yield this.stargazersUserIDs(repo_user, repo_name, github_api_auth);

    let bar = new ProgressBar('Processing... :current / :total', { total: starIDs.length });
    for (let i = 0; i < starIDs.length; i++) {
      let result = yield this.userProfile(starIDs[i].login, github_api_auth);
      userProfiles.push(result);
      bar.tick();
    }

    let arrFilter = userProfiles.filter(function(item) { return item.email != null; });
    let table = new Table({ head: ['Total stargazer', 'with email']});
    table.push([userProfiles.length, arrFilter.length]);
    console.log(table.toString());

    let userEmails = [];
    userProfiles.forEach(function(item) {
      if (item.email)  userEmails.push(`${item.name} <${item.email}>`);
    });
    console.log(userEmails.join('; '));
  },
};