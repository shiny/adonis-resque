import { ApplicationService } from '@adonisjs/core/types'
import { Queue } from '../types.js'
import { getConnection, importJobs } from '../services/main.js'

declare module '@adonisjs/core/types' {
    interface ContainerBindings {
      queue: Queue
    }
}

export default class ResqueProvider {
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
        const runWorkerInWebEnv = this.app.config.get<boolean>('resque.runWorkerInWebEnv')
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
        }
    }

    async shutdown() {
        const queue = await this.app.container.make('queue')
        await queue.end()
    }
}
