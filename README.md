# team-name-labeler action

This GitHub Action can be used to add labels to your pull requests automatically based on code owners and PR author.

## Dependencies

This GitHub Action relies on the following dependencies:

- `@actions/core`: The @actions/core package provides functions for setting and getting input and output variables used in GitHub Actions.
- `@actions/github`: The @actions/github package provides functions for interacting with the GitHub API in GitHub Actions.
- `octokit`: The octokit package is used for making API requests to the GitHub API.

You will also need to create following 2 files in your repo :-

- `CODEOWNERS`: File for matching files against a set of developers.
- `teams.yml`: File for matching teams against a set of developers.

### `CODEOWNERS file template`

```yaml
/src/components @user1 @user2
/src/screens/ @user3 @user4
/.github/ @user5
```

### `teams.yml file template`

```yaml
teamLabel1:
  - '@user1'
  - '@user2'

teamLabel2:
  - '@user3'
  - '@user4'

teamLabel3:
  - '@user5'
```

## Usage

```yaml
# (Inside a workflow)
steps:
  - uses: saurabhasingh1997/team-name-labeler@v1.1
    with:
      repo-token: '${{ secrets.GITHUB_TOKEN }}'
      code-owners-config-path: '.github/CODEOWNERS'
      team-labeler-config-path: '.github/teams.yml'
```

### `repo-token`

The GitHub token used to authenticate API requests. You can use the `{{ secrets.GITHUB_TOKEN }}` token available in your workflow without any additional setup.

### `code-owners-config-path` (required)

Path of your CODEOWNERS file. Default value is '.github/CODEOWNERS'

### `team-labeler-config-path` (required)

Path of your yml file containing teams to developer mapping. Default value is '.github/teams.yml'

## Support

For any questions or issues regarding this GitHub Action, please open an issue in the repository.
