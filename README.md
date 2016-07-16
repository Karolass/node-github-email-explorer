# node-github-email-explorer

A tool to get email addresses from starred list of repositories on GitHub. 

Translate from [github-email-explorer](https://github.com/yuecen/github-email-explorer)

Notice: The code is base on Nodejs v6.0.0 or later.

## Installation

`npm install -g node-github-email-explorer`

## Github OAuth

Your Github Setting -> OAuth applications -> Developer applications -> Register a new application

## Config
`vi config.json`

type content below:

```
{
  "client_id": "<Github Client ID>",
  "client_secret": "<Github Client Secret>"
}
```

## Usage

```
  Usage: ge-explore [options] <Github Repo URL>
         ge-explore [options] <config> <Github Repo URL>

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -s, --star     explore who star the repo. default option.
    -f, --fork     explore who fork the repo
    -S, --status   Github API status
```

example 1 (require local config.json and explore stargazer is Default): 
`ge-explore https://github.com/Karolass/node-github-email-explorer`

example 2:
`ge-explore custom_config.json https://github.com/Karolass/node-github-email-explorer`
