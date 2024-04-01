import { ApplicationService } from '@adonisjs/core/types'
import { Queue, ResqueConfig } from '../types.js'
import { getConnection, importJobs } from '../services/main.js'
import Cron from 'croner'
import ms from 'ms'

declare module '@adonisjs/core/types' {
    interface ContainerBindings {
      queue: Queue
    }
}

export default class ResqueProvider {
    croner?: Cron
    intervalId?: NodeJS.Timeout
    constructor(protected app: ApplicationService) {
    }

    register() {
        this.app.container.singleton('queue', async () => {
            const jobs = await importJobs()
            const queue = new Queue({
                connection: getConnection()
            }, jobs);
            await queue.connect()
            return queue
        })
    }

    async start() {
        const { runWorkerInWebEnv, runScheduler} = this.app.config.get<ResqueConfig>('resque')
        if (this.app.getEnvironment() === 'web' && runWorkerInWebEnv) {
            const ace = await this.app.container.make('ace')
            await ace.boot()
            if (ace.getCommand('resque:start')) {
                const command = await ace.exec('resque:start', [])
                if (command.exitCode !== 0 || command.error) {
                    const error = command.error || new Error(`Failed to start command resque:start`)
                    throw error
                }
            }
            if (runScheduler) {
                const jobs = await importJobs()
                for(const { job } of Object.values(jobs)) {
                    if (job.schedule?.immediate) {
                        await job.enqueue()
                    }
                    if (job.schedule?.cron) {
                        Cron(job.schedule.cron, async () => job.enqueue())
                    }
                    if (job.schedule?.interval) {
                        let milliseconds
                        if (typeof job.schedule?.interval === 'number') {
                            milliseconds = job.schedule.interval
                        } else {
                            milliseconds = ms(job.schedule.interval)
                        }
                        this.intervalId = setInterval(async () => {
                            await job.enqueue()
                        }, milliseconds)
                    }
                }
            }
        }
    }

    async shutdown() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
        }
        if (this.croner) {
            this.croner.stop()
        }
        const queue = await this.app.container.make('queue')
        await queue.end()
    }
}
