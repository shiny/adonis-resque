import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { createWorker, createMultiWorker, isMultiWorkerEnabled } from 'adonis-resque/services/main'
import { importAllJobs } from '../jobs.js'
import { cancelSchedules, createScheduler, Interval, startJobSchedules } from '../scheduler.js'
import { MultiWorker, ParsedJob, Scheduler, Worker } from 'node-resque'
import { getConfig } from '../index.js'

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

    @flags.array({
        description: 'queue names for worker to listen'
    })
    declare queueName: string[]

    intervals?: Interval[]
    workerInstance?: MultiWorker | Worker
    schedulerInstance?: Scheduler

    async run() {
        const pid = process.pid
        const jobs = await importAllJobs()
        const emitter = await this.app.container.make('emitter')
        const verbose = this.verbose?? getConfig('verbose')
        if (this.worker) {
            const queueNames =
                this.queueName ?? getConfig('queueNameForWorkers')
                    .split(',')
                    .map((value) => value.trim())
                    .filter((value) => value !== '')
            const isMultiWorker = this.isMulti ?? isMultiWorkerEnabled()
            if (isMultiWorker) {
                this.workerInstance = createMultiWorker(jobs, queueNames) as MultiWorker
                this.logger.info(`Resque multiWorker:${pid} started with ${Object.keys(jobs).length} jobs`)
                this.workerInstance.on('failure', (workerId: number, queue: string, job: ParsedJob, failure: Error, duration: number) => {
                    if (verbose)
                        this.logger.info(`Job ${job.class} in queue ${queue} failed on worker ${workerId} in ${duration}ms`)
                    emitter.emit('resque:failure', {
                        workerId,
                        queue,
                        job: jobs[job.class],
                        failure,
                        duration,
                        args: job.args,
                        pluginOptions: job.pluginOptions
                    })
                })
                this.workerInstance.on('cleaning_worker', (workerId: number, _worker: Worker, pid: number) => {
                    if (verbose)
                        this.logger.info(`Worker ${workerId} (PID ${pid}) cleaning up...`)
                })
                this.workerInstance.on('end', (workerId: number) => {
                    if (verbose)
                        this.logger.info(`Worker ${workerId} ended.`)
                })
                this.workerInstance.on('success', (workerId: number, queue: string, job: ParsedJob, _result: any, duration: number) => {
                    if (verbose)
                        this.logger.info(`Job ${job.class} in queue ${queue} completed on worker ${workerId} in ${duration}ms`)
                })

            } else {
                this.workerInstance = createWorker(jobs, queueNames)
                this.workerInstance.on('failure', (queue: string, job: ParsedJob, failure: Error, duration: number) => {
                    if (verbose)
                        this.logger.info(`Job ${job.class} in queue ${queue} failed in ${duration}ms`)
                    emitter.emit('resque:failure', {
                        queue,
                        job: jobs[job.class],
                        failure,
                        duration,
                        args: job.args,
                        pluginOptions: job.pluginOptions
                    })
                })
                this.workerInstance.on('success', (queue: string, job: ParsedJob, _result: any, duration: number) => {
                    if (verbose)
                        this.logger.info(`Job ${job.class} in queue ${queue} completed in ${duration}ms`)
                })
                await this.workerInstance.connect()
            }
            await this.workerInstance.start()

        }
        const runScheduler = getConfig('runScheduler')
        if (this.schedule ?? runScheduler) {
            this.schedulerInstance = createScheduler()
            await this.schedulerInstance.connect()
            await this.schedulerInstance.start()
            this.schedulerInstance.on('end', () => {
                if (verbose)
                    this.logger.info(`Scheduler ended.`)
            })
            this.intervals = await startJobSchedules(this.schedulerInstance, jobs)
            if (verbose)
                this.logger.info(`Scheduler:${pid} started`)
        }
    }

    prepare() {
        const isVerbose = this.verbose ?? getConfig('verbose')
        const terminate = async (signal: NodeJS.Signals) => {
            if (isVerbose)
                this.logger.info('Receive ' + signal)
            await this.terminate()
        }
        const cleanup = async () => {
            this.logger.info('Resque worker terminating...')
            if (this.workerInstance) {
                await this.workerInstance.end()
            }
            if (this.schedulerInstance) {
                await this.schedulerInstance.end()
            }
            cancelSchedules(this.intervals)
        }
        this.app.listen('SIGINT', terminate).listen('SIGTERM', terminate)
        this.app.terminating(cleanup)
    }
}
