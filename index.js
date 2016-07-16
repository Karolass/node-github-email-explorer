const program = require('commander');
const fs = require('fs');
const pkg = require('./package.json');

program
  .version(pkg.version)
  .usage("[options] <Github Repo URL> \n " + 
         "        ge-explore [options] <config> <Github Repo URL>")
  .option('-s, --star', 'explore who star the repo. default option.')
  .option('-f, --fork', 'explore who fork the repo')
  .option('-S, --status', 'Github API status')
  .parse(process.argv);

let config = process.cwd() + '/config.json';
let regex, repoUser, repoName;
switch (program.args.length) {
  case 1:
    regex = program.args[0].match(/https:\/\/github.com\/([^\s\/]+)\/([^\s\/]+)/);
    if (!regex) { console.log("incorrect Github Repo URL"); return; }
    repoUser = regex[1];
    repoName = regex[2];
    break;
  case 2:
    config = process.cwd() + '/' + program.args[0];
    regex = program.args[1].match(/https:\/\/github.com\/([^\s\/]+)\/([^\s\/]+)/);
    if (!regex) { console.log("incorrect Github Repo URL"); return; }
    repoUser = regex[1];
    repoName = regex[2];
    break;
  case 0:
  default:
    program.help();
    break;
}

let options;
try {
  config = require(config);

  options = {
    config: config,
    repoUser: repoUser,
    repoName: repoName,
    star: program.star ? program.star : false,
    fork: program.fork ? program.fork : false,
    status: program.status ? program.status : false,
  }
  // console.log(JSON.stringify(options, null, 4));
}
catch (err) {
  console.error(err.message);
  return;
}

const github = require('./lib/github-api-url');
const ghEmail = require('./lib/github-email');
const co = require('co');
const Table = require('cli-table');

co(function* () {
  let github_api_auth = options.config;

  if (!options.star && !options.fork)
    options.star = true;  //set default if all false

  //get starers email
  if (options.star)
    yield ghEmail.stargazersEmails(options.repoUser, options.repoName, github_api_auth);

  //api status
  if (options.status) 
    yield ghEmail.apiStatus(github_api_auth);
}).then(function (result) {
  // console.log(result);
}, function (err) {
  console.error(err.message);
});
