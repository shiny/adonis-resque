import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { createWorker } from 'adonis-resque/services/main'


export default class ResqueStart extends BaseCommand {
  static commandName = 'resque:start'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const worker = await createWorker(['default'])
    await worker.connect()
    await worker.start()
    
    this.logger.info('Worker Started')
  }
}