export function getTeamLabel(
  labelsConfiguration: Map<string, string[]>,
  developers: string[]
): string[] {
  const labels: string[] = []
  for (const developer of developers) {
    for (const [teamLabel, teamDevelopers] of labelsConfiguration.entries())
      if (teamDevelopers.includes(developer)) labels.push(teamLabel)
  }

  return [...new Set(labels)]
}
