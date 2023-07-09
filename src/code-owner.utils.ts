/* eslint-disable @typescript-eslint/no-explicit-any */
import * as github from '@actions/github'
import * as core from '@actions/core'
import {Minimatch} from 'minimatch'
import {getChangedFiles} from './github'

type GitHub = ReturnType<typeof github.getOctokit>
export async function getCodeOwners(
  client: GitHub,
  configurationPath: string,
  prNumber: number
): Promise<string[]> {
  const codeOwnersContent: string = await fetchContent(
    client,
    configurationPath
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
      pathGlob += '**/*'
    }
    values.shift()
    globsToDevMapper[pathGlob] = values
  })
  core.info(`Globs to Dev mapper is :- ${JSON.stringify(globsToDevMapper)}`)
  core.info(`fetching changed files for pr #${prNumber}`)
  const changedFiles: string[] = await getChangedFiles(client, prNumber)
  core.info(`Changed files are :- ${changedFiles}`)

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
  core.info(
    `***** Matched Globs to Dev mapper is :- ${JSON.stringify(
      matchedGlobsToDevMapper
    )}`
  )
  const codeOwners = Object.values(matchedGlobsToDevMapper).flat()
  return [...new Set(codeOwners)]
}

async function fetchContent(client: GitHub, path: string): Promise<string> {
  const repo = github.context.repo.repo
  const ref = github.context.sha

  core.info(`Using repo ${repo} and ref ${ref}`)
  const response: any = await client.rest.repos.getContent({
    owner: github.context.repo.owner,
    repo,
    path,
    ref
  })

  if (!Array.isArray(response.data) && response.data.content)
    return Buffer.from(response.data.content, 'base64').toString()
  throw new Error('Invalid CodeOwners file')
}

function isMatch(changedFile: string, matchers: Minimatch[]): string {
  core.info(`    matching patterns against file ${changedFile}`)
  for (const matcher of matchers) {
    if (matcher.match(changedFile)) {
      core.info(`   ${changedFile}  matched against  ${printPattern(matcher)} `)
      return matcher.pattern
    }
  }

  core.info(`  ${changedFile} didn't match `)
  return ''
}

function printPattern(matcher: Minimatch): string {
  return (matcher.negate ? '!' : '') + matcher.pattern
}
