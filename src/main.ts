/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as core from '@actions/core'
import {getTeamLabel} from './teams'
import {
  getPrNumber,
  getPrAuthor,
  getLabelsConfiguration,
  addLabels,
  createClient
} from './github'
import {getCodeOwners} from './code-owner.utils'

async function run() {
  // try {
  //   const token = core.getInput('repo-token', {required: true})
  //   const configPath = core.getInput('configuration-path', {required: true})
  //   const teamsRepo = core.getInput('teams-repo', {required: false})
  //   const teamsBranch = core.getInput('teams-branch', {required: false})

  //   const prNumber = getPrNumber()
  //   if (!prNumber) {
  //     core.info('Could not get pull request number from context, exiting')
  //     return
  //   }

  //   const author = getPrAuthor()
  //   if (!author) {
  //     core.info('Could not get pull request user from context, exiting')
  //     return
  //   }

  //   const client = createClient(token)
  //   const labelsConfiguration: Map<string, string[]> =
  //     await getLabelsConfiguration(
  //       client,
  //       configPath,
  //       teamsRepo !== '' ? {repo: teamsRepo, ref: teamsBranch} : undefined
  //     )

  //   const labels: string[] = getTeamLabel(labelsConfiguration, `@${author}`)

  //   if (labels.length > 0) await addLabels(client, prNumber, labels)
  //   core.setOutput('team_labels', JSON.stringify(labels))
  // } catch (error) {
  //   if (error instanceof Error) {
  //     core.error(error)
  //     core.setFailed(error.message)
  //   }
  // }

  const token = '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'
  const codeOwnersConfigPath = 'CODEOWNERS'
  const teamLabelerConfigPath = '.github/teams.yml'
  const client = createClient(token)
  const codeOwners = await getCodeOwners(
    client,
    codeOwnersConfigPath,
    undefined
  )
  console.log('Code owners are :- ', codeOwners)
  const labelsConfiguration: Map<string, string[]> =
    await getLabelsConfiguration(client, teamLabelerConfigPath, undefined)

  const labels: string[] = getTeamLabel(labelsConfiguration, codeOwners)
  console.log(labels)
}

run()
