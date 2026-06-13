import { test } from '@japa/runner'
import { resolveJobPaths } from '../../jobs.js'

test.group('resolveJobPaths', () => {
    test('returns ["app/jobs"] when no path is configured', ({ expect }) => {
        expect(resolveJobPaths(undefined)).toEqual(['app/jobs'])
    })

    test('wraps a single string in an array', ({ expect }) => {
        expect(resolveJobPaths('app/billing/jobs')).toEqual(['app/billing/jobs'])
    })

    test('returns an array of paths as-is', ({ expect }) => {
        const paths = ['app/contacts/jobs', 'app/reminders/jobs']
        expect(resolveJobPaths(paths)).toEqual(paths)
    })

    test('returns a one-element array unchanged', ({ expect }) => {
        expect(resolveJobPaths(['app/custom/jobs'])).toEqual(['app/custom/jobs'])
    })
})
