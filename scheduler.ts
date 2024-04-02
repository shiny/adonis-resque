import { Scheduler } from 'node-resque'
import { getConnection } from './services/main.js';
import { NodeResqueJob } from './types.js';
import Cron from 'croner'
import ms from 'ms'

export async function createScheduler() {
    return new Scheduler({
        connection: getConnection(),
    })
}
export type Interval = NodeJS.Timeout | Cron
export async function startJobSchedules(resqueScheduler: Scheduler, jobs: Record<string, NodeResqueJob>): Promise<Interval[]> {
    const intervals: Interval[] = []
    for (const { job } of Object.values(jobs)) {
        if (job.schedule?.cron) {
            intervals.push(Cron(job.schedule.cron, async () => {
                if (resqueScheduler.leader) {
                    await job.enqueue()
                }
            }))
        }
        if (job.schedule?.interval) {
            let milliseconds
            if (typeof job.schedule?.interval === 'number') {
                milliseconds = job.schedule.interval
            } else {
                milliseconds = ms(job.schedule.interval)
            }
            const intervalId = setInterval(async () => {
                if (resqueScheduler.leader) {
                    await job.enqueue()
                }
            }, milliseconds)
            intervals.push(intervalId)
        }
    }
    return intervals
}

export function cancelSchedules(intervals?: Interval[]) {
    if (!intervals) {
        return
    }
    for(const inteval of intervals) {
        if (inteval instanceof Cron) {
            inteval.stop()
        } else {
            clearInterval(inteval)
        }
    }
}