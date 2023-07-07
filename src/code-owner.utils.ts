/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as github from '@actions/github'
import * as core from '@actions/core'
import {ExternalRepo} from './types'

type GitHub = ReturnType<typeof github.getOctokit>
export async function getCodeOwners(
  client: GitHub,
  configurationPath: string,
  externalRepo: ExternalRepo | undefined
): Promise<void> {
  const configurationContent: string = await fetchContent(
    client,
    configurationPath,
    externalRepo
  )
  console.log('configurationContent is :- ', configurationContent)
  const result = configurationContent.split(/\r?\n/).filter(element => element)
  console.log('Result after split is  :- ', result)
}

async function fetchContent(
  client: GitHub,
  path: string,
  externalRepo: ExternalRepo | undefined
): Promise<string> {
  let repo = 'team-name-labeler'
  let ref = '0effe9565cf925c5570479009bbc3686032983fc'
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
