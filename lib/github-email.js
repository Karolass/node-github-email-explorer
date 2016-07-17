const github = require('./github-api-url');
const { wrap: async } = require('co');
const parallel = require('co-parallel');
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
    throw err;
  }
});

let rollPages = function* (URL, total_pages, per_page) {
  let result = [];
  for (let i = 1; i <= total_pages; i++) {
    let url = github.pagination(URL, i, per_page);
    let temp = yield Promise.resolve(apiReq(url, "GET"));
    temp = JSON.parse(temp);
    temp.forEach(function(item) {
      result.push(item.login ? item : item.owner);
    });
  }

  return result;
}

var bar;
let parallelExe = async(function* (user_ids, github_api_auth, func) {
  bar = new ProgressBar('Processing... :current / :total', { total: user_ids.length });
  let reqs = user_ids.map(function* (elem) {  return yield func(elem.login, github_api_auth); });
  let res = yield parallel(reqs, 5);
  return res;
});

module.exports = {
  apiStatus: function* (github_api_auth) {
    let rateLimitURL =  github.rateLimit();
    let URLWithAuth = github.addAuthInfo(rateLimitURL, github_api_auth);

    let result = yield Promise.resolve(apiReq(URLWithAuth, "GET"));
    result = JSON.parse(result).resources;
    let table = new Table({ head: ['Resource Type', 'Limit', 'Remaining', 'Reset Time']});
    table.push(['Core', result.core.limit, result.core.remaining, new Date(result.core.reset * 1000).toLocaleString()]);
    table.push(['Search', result.search.limit, result.search.remaining, new Date(result.search.reset * 1000).toLocaleString()]);
    console.log('Github API Status: ');
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
    bar.tick();
    return result;
  },
  repository: function* (repo_user, repo_name, github_api_auth) {
    let repoURL =  github.repository(repo_user, repo_name);
    let URLWithAuth = github.addAuthInfo(repoURL, github_api_auth);

    let result = yield Promise.resolve(apiReq(URLWithAuth, "GET"));
    result = JSON.parse(result);
    result = {
      id: result.id,
      name: result.name,
      description: result.description,
      stargazers: result.stargazers_count,
      watchers: result.watchers_count,
      forks: result.forks_count,
    };

    return result;
  },
  stargazersUserIDs: function* (repo_user, repo_name, github_api_auth) {
    // pagination
    let repoInfo = yield this.repository(repo_user, repo_name, github_api_auth);
    let perPage = 100;
    let totalPages = Math.ceil(repoInfo.stargazers / perPage);

    let stargazersURL =  github.stargazers(repo_user, repo_name);
    let URLWithAuth = github.addAuthInfo(stargazersURL, github_api_auth);

    let result = yield rollPages(URLWithAuth, totalPages, perPage);
    return result;
  },
  forksUserIDs: function* (repo_user, repo_name, github_api_auth) {
    // pagination
    let repoInfo = yield this.repository(repo_user, repo_name, github_api_auth);
    let perPage = 100;
    let totalPages = Math.ceil(repoInfo.forks / perPage);

    let forksURL =  github.forks(repo_user, repo_name);
    let URLWithAuth = github.addAuthInfo(forksURL, github_api_auth);

    let result = yield rollPages(URLWithAuth, totalPages, perPage);
    return result;
  },
  stargazersEmails: function* (repo_user, repo_name, github_api_auth) {
    console.log('Getting stargazers ID ...');
    let userIds = yield this.stargazersUserIDs(repo_user, repo_name, github_api_auth);
    yield this.emailProcess(userIds, github_api_auth);
  },
  forksEmails: function* (repo_user, repo_name, github_api_auth) {
    console.log('Getting forks ID ...');
    let userIds = yield this.forksUserIDs(repo_user, repo_name, github_api_auth);
    yield this.emailProcess(userIds, github_api_auth);
  },
  emailProcess: function* (user_ids, github_api_auth) {
    let userProfiles = yield parallelExe(user_ids, github_api_auth, this.userProfile);

    let arrFilter = userProfiles.filter(function(item) { return item.email != null; });
    let table = new Table({ head: ['stargazers count', 'with email']});
    table.push([userProfiles.length, arrFilter.length]);
    console.log(table.toString());

    let userEmails = [];
    userProfiles.forEach(function(item) {
      if (item.email)  userEmails.push(`${item.name} <${item.email}>`);
    });
    console.log(userEmails.join('; '), "\n");
  }
};
