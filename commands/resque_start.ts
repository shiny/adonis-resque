import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { createWorker, createMultiWorker, isMultiWorkerEnabled } from 'adonis-resque/services/main'
import { ResqueConfig } from '../types.js'
import { importAllJobs } from '../jobs.js'
import { cancelSchedules, createScheduler, Interval, startJobSchedules } from '../scheduler.js'
import { MultiWorker, Scheduler, Worker } from 'node-resque'

export default class ResqueStart extends BaseCommand {
    static commandName = 'resque:start'
    static description = 'Start workers / schedules for resque'

    static options: CommandOptions = {
        startApp: true,
        staysAlive: true,
    }

    @flags.boolean({
        description: 'start job schedule'
    })
    declare schedule: boolean

    @flags.boolean({
        description: 'start workers',
        default: true
    })
    declare worker: boolean

    @flags.boolean({
        description: 'multi workers'
    })
    declare isMulti: boolean

    @flags.boolean({
        description: 'enable log verbose'
    })
    declare verbose: boolean

    intervals?: Interval[]
    workerInstance?: MultiWorker | Worker
    schedulerInstance?: Scheduler

    async run() {
        const pid = process.pid
        const isMultiWorker = this.isMulti ?? isMultiWorkerEnabled()
        if (this.worker && isMultiWorker) {
            this.workerInstance = await createMultiWorker(['default'])
            await this.workerInstance.start()
            this.logger.info(`Resque multiWorker:${pid} started.`)
        } else if(this.worker) {
            this.workerInstance = await createWorker(['default'])
            await this.workerInstance.connect()
            await this.workerInstance.start()
            this.logger.info(`Resque worker:${pid} started`)
        }
        const { runScheduler } = this.app.config.get<ResqueConfig>('resque')
        if (this.schedule ?? runScheduler) {
            this.schedulerInstance = await createScheduler()
            await this.schedulerInstance.connect()
            await this.schedulerInstance.start()
            const jobs = await importAllJobs()
            this.intervals = await startJobSchedules(this.schedulerInstance, jobs)
            this.logger.info(`Scheduler:${pid} started`)
        }
    }

    prepare() {
        const { verbose } = this.app.config.get<ResqueConfig>('resque')
        const isVerbose = this.verbose ?? verbose
        this.app.listen('SIGINT', async () => {
            if (isVerbose)
                this.logger.info('Receive SIGINT')
            await this.terminate()
        })
        this.app
            .listen('SIGTERM', async () => {
                if (isVerbose)
                    this.logger.info('Receive SIGTERM')
                await this.terminate()
            })
        this.app.terminating(async () => {
            this.logger.info('Resque worker terminating...')
            if (this.workerInstance) {
                await this.workerInstance.end()
            }
            if (this.schedulerInstance) {
                await this.schedulerInstance.end()
            }
            cancelSchedules(this.intervals)
        })
    }
}