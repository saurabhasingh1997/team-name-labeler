/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as github from '@actions/github'
import * as core from '@actions/core'
import {Minimatch} from 'minimatch'
import {ExternalRepo} from './types'

type GitHub = ReturnType<typeof github.getOctokit>
export async function getCodeOwners(
  client: GitHub,
  configurationPath: string,
  externalRepo: ExternalRepo | undefined
): Promise<string[]> {
  const prNumber = 9
  const codeOwnersContent: string = await fetchContent(
    client,
    configurationPath,
    externalRepo
  )
  const contentLines = codeOwnersContent
    .split(/\r?\n/)
    .filter(element => element)
  const globsToDevMapper: Record<string, string[]> = {}
  contentLines.map(currentLine => {
    const values = currentLine.split(' ')
    let pathGlob = values[0].slice(1) // removes preceeding '/'
    const isFolder = pathGlob.endsWith('/')
    if (isFolder) {
      pathGlob += '**'
    }
    values.shift()
    globsToDevMapper[pathGlob] = values
  })

  const prDetails = await getPRDetails(client, prNumber)

  core.debug(`fetching changed files for pr #${prNumber}`)
  const changedFiles: string[] = await getChangedFiles(client, prNumber)
  console.log('Changed files are :- ', changedFiles)

  const matchers = Object.keys(globsToDevMapper).map(
    pathGlob => new Minimatch(pathGlob, {dot: true})
  )
  const matchedGlobsToDevMapper: Record<string, string[]> = {}
  for (const changedFile of changedFiles) {
    const matchedGlob = isMatch(changedFile, matchers)
    if (matchedGlob) {
      if (!matchedGlobsToDevMapper.hasOwnProperty(matchedGlob)) {
        matchedGlobsToDevMapper[matchedGlob] = globsToDevMapper[matchedGlob]
      }
    }
  }
  const codeOwners = Object.values(matchedGlobsToDevMapper).flat()
  return [...new Set(codeOwners)]
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

async function getPRDetails(client: GitHub, prNumber: number) {
  let pullRequest: any
  try {
    const result = await client.rest.pulls.get({
      owner: 'saurabhasingh1997',
      repo: 'team-name-labeler',
      pull_number: prNumber
    })
    pullRequest = result.data
  } catch (error: any) {
    core.warning(`Could not find pull request #${prNumber}, skipping`)
  }
  return pullRequest
}

async function getChangedFiles(
  client: GitHub,
  prNumber: number
): Promise<string[]> {
  const listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
    owner: 'saurabhasingh1997',
    repo: 'team-name-labeler',
    pull_number: prNumber
  })

  const listFilesResponse = await client.paginate(listFilesOptions)
  const changedFiles = listFilesResponse.map((f: any) => f.filename)

  core.debug('found changed files:')
  //   for (const file of changedFiles) {
  //     core.debug('  ' + file)
  //   }

  return changedFiles
}

function isMatch(changedFile: string, matchers: Minimatch[]): string {
  core.debug(`    matching patterns against file ${changedFile}`)
  for (const matcher of matchers) {
    core.debug(`   - ${printPattern(matcher)}`)
    if (matcher.match(changedFile)) {
      core.debug(
        `   ${changedFile}  matched against  ${printPattern(matcher)} `
      )
      return matcher.pattern
    }
  }

  core.debug(`  ${changedFile} didn't match `)
  return ''
}

function printPattern(matcher: Minimatch): string {
  return (matcher.negate ? '!' : '') + matcher.pattern
}
