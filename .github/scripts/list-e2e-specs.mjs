/**
 * Emits the E2E spec list as a JSON array, in the order GitHub Actions should
 * start the matrix jobs.
 *
 * ---------------------------------------------------------------------------
 * SCOPE: this file belongs to the release line only. DELETE IT when merging
 * back to develop.
 *
 * Its one and only consumer is the `discover-tests` job in
 * `.github/workflows/deploy-and-e2e.yml`. On develop that job no longer
 * exists -- commit 0f63dd8af ("chore: Cleanup docker swarm") removed the
 * `deploy`, `discover-tests` and `test` jobs, and e2e now runs from the
 * separate `opencrvs-testland-infrastructure` repository, which owns its own
 * matrix and concurrency policy.
 *
 * Because this is a path that does not exist on develop, a merge-back will
 * NOT raise a conflict here: git simply adds the file, and it lands as dead
 * code with no caller and nothing to prompt the reviewer. So either
 *
 *   - delete this file as part of the merge-back, or
 *   - port the ordering below into `opencrvs-testland-infrastructure`, where
 *     the matrix actually lives, and then delete it here.
 *
 * The same warning is repeated at the `discover-tests` step, because that
 * file *does* conflict on merge-back and is therefore the one place a
 * reviewer is guaranteed to read.
 * ---------------------------------------------------------------------------
 *
 * Every matrix job runs one spec file against a *single shared* environment, so
 * the start order decides which specs contend with each other. Two goals:
 *
 * 1. Spread contention. Specs under the same directory drive the same
 *    workqueues and the same seeded users, so starting a whole directory at
 *    once maximises interference (a spec asserting a record is absent from a
 *    workqueue is racing every other spec that files a record as that user).
 *    Emitting round-robin across directories keeps concurrently started jobs on
 *    unrelated domains.
 *
 * 2. Keep wall clock down. Once concurrency is capped, starting the longest
 *    specs first (longest-processing-time scheduling) stops a big spec from
 *    becoming the tail everything else waits behind. Line count is the proxy
 *    for duration -- imperfect, but it needs no historical timing data.
 *
 * Matching `.spec.tsx` as well as `.spec.ts` matters: Playwright's default
 * testMatch picks up both, so a `.tsx` spec that this list misses is a test
 * that silently never runs in CI.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = 'e2e/testcases'
const SPEC_PATTERN = /\.spec\.tsx?$/

function findSpecs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      return findSpecs(path)
    }

    return SPEC_PATTERN.test(entry.name) ? [path] : []
  })
}

const specs = findSpecs(ROOT).map((path) => {
  const specPath = relative(ROOT, path)

  return {
    specPath,
    domain: specPath.split(sep)[0],
    weight: readFileSync(path, 'utf8').split('\n').length
  }
})

const byDomain = new Map()

for (const spec of specs) {
  const group = byDomain.get(spec.domain) ?? []
  group.push(spec)
  byDomain.set(spec.domain, group)
}

const totalWeight = (group) => group.reduce((sum, s) => sum + s.weight, 0)

// Heaviest spec first within a domain, heaviest domain first across domains, so
// the head of the list is both heavy and domain-diverse.
const queues = [...byDomain.values()]
  .map((group) => [...group].sort((a, b) => b.weight - a.weight))
  .sort((a, b) => totalWeight(b) - totalWeight(a))

const ordered = []

while (queues.some((queue) => queue.length > 0)) {
  for (const queue of queues) {
    const next = queue.shift()

    if (next) {
      // Playwright is invoked with a POSIX path regardless of host separator.
      ordered.push(next.specPath.split(sep).join('/'))
    }
  }
}

process.stdout.write(JSON.stringify(ordered))
