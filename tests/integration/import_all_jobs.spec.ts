import { test } from '@japa/runner'
import { fsImportAll } from '@poppinss/utils'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

/**
 * Tests the multi-path file loading logic that importAllJobs delegates to.
 * We test fsImportAll + Object.assign directly because spinning up a full
 * AdonisJS app in a library test is unnecessary — the wiring is a one-liner
 * and the path resolution is already covered in the unit tests.
 */
const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url))

function resolveFixture(p: string) {
    return join(FIXTURES, p)
}

test.group('multi-path job loading', () => {
    test('discovers jobs from the default path', async ({ expect }) => {
        const jobs = await fsImportAll(resolveFixture('app/jobs'), { ignoreMissingRoot: true })

        const names = Object.values(jobs).map((v: any) => v.name)
        expect(names).toContain('EmailJob')
    })

    test('discovers jobs from a single custom path', async ({ expect }) => {
        const jobs = await fsImportAll(resolveFixture('app/contacts/jobs'), { ignoreMissingRoot: true })

        const names = Object.values(jobs).map((v: any) => v.name)
        expect(names).toContain('ContactJob')
        expect(names).not.toContain('EmailJob')
    })

    test('merges jobs from multiple paths (modular architecture)', async ({ expect }) => {
        const results = await Promise.all([
            fsImportAll(resolveFixture('app/contacts/jobs'), { ignoreMissingRoot: true }),
            fsImportAll(resolveFixture('app/reminders/jobs'), { ignoreMissingRoot: true }),
        ])
        const jobs = Object.assign({}, ...results)

        const names = Object.values(jobs).map((v: any) => v.name)
        expect(names).toContain('ContactJob')
        expect(names).toContain('ReminderJob')
        expect(names).not.toContain('EmailJob')
    })

    test('returns empty object for a missing directory', async ({ expect }) => {
        const jobs = await fsImportAll(resolveFixture('app/nonexistent/jobs'), { ignoreMissingRoot: true })

        expect(Object.keys(jobs)).toHaveLength(0)
    })
})
