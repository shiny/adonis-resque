import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { createWorker, createMultiWorker, isMultiWorkerEnabled } from 'adonis-resque/services/main'


export default class ResqueStart extends BaseCommand {
  static commandName = 'resque:start'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    if (isMultiWorkerEnabled()) {
      const multiWorker = await createMultiWorker(['default'])
      await multiWorker.start()
      this.logger.info(`Resque multiWorker started.`)
    } else {
      const worker = await createWorker(['default'])
      await worker.connect()
      await worker.start()
      this.logger.info(`Resque worker started`)
    }
  }
}