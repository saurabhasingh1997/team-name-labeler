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
  try {
    const token = core.getInput('repo-token')
    const codeOwnersConfigPath = core.getInput('code-owners-config-path', {
      required: true
    })
    const teamLabelerConfigPath = core.getInput('team-labeler-config-path', {
      required: true
    })

    const prNumber = getPrNumber()
    if (!prNumber) {
      core.info('Could not get pull request number from context, exiting')
      return
    }
    core.info(`PR number is :- ${prNumber}`)

    const author = getPrAuthor()
    if (!author) {
      core.info('Could not get pull request user from context, exiting')
      return
    }
    core.info(`PR author is :- ${author}`)

    const client = createClient(token)
    core.info('Fetching PR details...')
    core.info('PR details fetched')
    core.info('Fetching Code Owners details...')
    const codeOwners = await getCodeOwners(
      client,
      codeOwnersConfigPath,
      prNumber
    )
    core.info(`Code owners are :- ${codeOwners}`)
    core.info(`Fetching labels configuration ...`)
    const labelsConfiguration: Map<string, string[]> =
      await getLabelsConfiguration(client, teamLabelerConfigPath)
    core.info(`Labels Configuration :- ${JSON.stringify(labelsConfiguration)}`)
    const participants = [...codeOwners]
    if (!codeOwners.includes(`@${author}`)) {
      participants.push(`@${author}`)
    }
    const labels: string[] = getTeamLabel(labelsConfiguration, participants)
    core.info(`Labels to add :- ${labels}`)

    if (labels.length > 0) await addLabels(client, prNumber, labels)
    core.setOutput('team_labels', JSON.stringify(labels))
  } catch (error) {
    if (error instanceof Error) {
      core.error(error)
      core.setFailed(error.message)
    }
  }
}

run()
