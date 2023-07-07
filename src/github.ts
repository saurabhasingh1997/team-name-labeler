/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as github from '@actions/github'
import * as yaml from 'js-yaml'
import * as core from '@actions/core'
import {ExternalRepo} from './types'

type GitHub = ReturnType<typeof github.getOctokit>

export function getPrNumber(): number | undefined {
  const pullRequest = github.context.payload.pull_request
  if (!pullRequest) {
    const issue = github.context.payload.issue
    if (!issue) {
      return undefined
    }
    return issue.number
  }

  return pullRequest.number
}

export function getPrAuthor(): string | undefined {
  const pullRequest = github.context.payload.pull_request
  if (!pullRequest) {
    const issue = github.context.payload.issue
    if (!issue) {
      return undefined
    }
    return issue.user.login
  }

  return pullRequest.user.login
}

export async function getLabelsConfiguration(
  client: GitHub,
  configurationPath: string,
  externalRepo: ExternalRepo | undefined
): Promise<Map<string, string[]>> {
  const configurationContent: string = await fetchContent(
    client,
    configurationPath,
    externalRepo
  )
  const configObject: any = yaml.load(configurationContent)
  return getLabelGlobMapFromObject(configObject)
}

async function fetchContent(
  client: GitHub,
  path: string,
  externalRepo: ExternalRepo | undefined
): Promise<string> {
  let repo = 'team-name-labeler'
  let ref = 'a21746d0858da040cd8e020f2082bea33b2bb567'
  if (externalRepo?.repo) {
    repo = externalRepo?.repo
    ref = externalRepo?.ref
  }

  core.info(`Using repo ${repo} and ref ${ref}`)
  const response: any = await client.rest.repos.getContent({
    owner: 'saurabhasingh1997',
    repo,
    path,
    ref
  })

  if (!Array.isArray(response.data) && response.data.content)
    return Buffer.from(response.data.content, 'base64').toString()
  throw new Error('Invalid yaml file')
}

function getLabelGlobMapFromObject(configObject: any): Map<string, string[]> {
  const labelGlobs: Map<string, string[]> = new Map()
  for (const label in configObject) {
    if (typeof configObject[label] === 'string') {
      labelGlobs.set(label, [configObject[label]])
    } else if (configObject[label] instanceof Array) {
      labelGlobs.set(label, configObject[label])
    } else {
      throw Error(
        `found unexpected type for label ${label} (should be string or array of globs)`
      )
    }
  }

  return labelGlobs
}

export function createClient(token: string): GitHub {
  return github.getOctokit(token)
}

export async function addLabels(
  client: GitHub,
  prNumber: number,
  labels: string[]
) {
  await client.rest.issues.addLabels({
    owner: 'saurabhasingh1997',
    repo: 'saurabhasingh1997/team-name-labeler',
    issue_number: prNumber,
    labels
  })
}
