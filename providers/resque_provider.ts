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

    async shutdown() {
        const queue = await this.app.container.make('queue')
        await queue.end()
    }
}
