import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { stubsRoot } from '../index.js'

import StringBuilder from '@poppinss/utils/string_builder'

export default class MakeJob extends BaseCommand {
  static commandName = 'make:job'
  static description = 'Make a new job class'

  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * The name of the job file.
   */
  @args.string({ description: 'Name of the job file' })
  declare name: string


  async run() {
    const codemods = await this.createCodemods()
    const jobName = new StringBuilder(this.name)
      .removeExtension()
      .removeSuffix('service')
      .removeSuffix('model')
      .singular()
      .pascalCase()
      .toString()
    const jobFileName = new StringBuilder(jobName).snakeCase().ext('.ts').toString()
    await codemods.makeUsingStub(stubsRoot, 'make/job/job.stub', {
      flags: this.parsed.flags,
      jobName,
      jobFileName
    })
  }
}