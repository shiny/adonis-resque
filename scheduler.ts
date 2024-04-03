import { Scheduler } from 'node-resque'
import { getConnection } from './services/main.js';
import { NodeResqueJob } from './types.js';
import Cron from 'croner'
import ms from 'ms'

/**
 * Create a NodeResque Scheduler
 * @docs https://github.com/actionhero/node-resque?tab=readme-ov-file#scheduler
 * @returns 
 */
export function createScheduler() {
    return new Scheduler({
        connection: getConnection(),
    })
}
export type Interval = NodeJS.Timeout | Cron
export async function startJobSchedules(resqueScheduler: Scheduler, jobs: Record<string, NodeResqueJob>): Promise<Interval[]> {
    const intervals: Interval[] = []
    /**
     * check whether is a leader sheduler or not
     * @returns boolean isLeader
     */
    const isLeader = () => {
        return resqueScheduler.leader
    }

    /**
     * Create a croner if job.cron exists
     * @param job 
     * @returns 
     */
    const createCronerFor = (job: NodeResqueJob['job']) => {
        if (job.cron) {
            return Cron(job.cron, async () => {
                if (isLeader()) {
                    return await job.enqueue()
                }
            })
        }
    }

    /**
     * let job repeat for every ${job.interval} 
     * @param job 
     * @returns 
     */
    const createRepeaterFor = (job: NodeResqueJob['job']) => {
        if (!job.interval) {
            return
        }
        let milliseconds
        if (typeof job.interval === 'number') {
            milliseconds = job.interval
        } else {
            milliseconds = ms(job.interval)
        }
        const intervalId = setInterval(async () => {
            if (isLeader()) {
                await job.enqueue()
            }
        }, milliseconds)
        return intervalId
    }
    for (const { job } of Object.values(jobs)) {
        const croner = createCronerFor(job)
        if (croner) {
            intervals.push(croner)
        }
        const intervalId = createRepeaterFor(job)
        if (intervalId) {
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