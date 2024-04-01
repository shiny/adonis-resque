import type Configure from '@adonisjs/core/commands/configure'
import { packageName, stubsRoot } from './index.js'

/**
 * Configures the package
 */
export async function configure(command: Configure) {
    const codemods = await command.createCodemods()
    await codemods.makeUsingStub(stubsRoot, 'config/resque.stub', {})


    /**
     * Register provider
     */
    await codemods.updateRcFile((rcFile) => {
        rcFile.addProvider(`${packageName}/providers/resque_provider`)
        rcFile.addCommand(`${packageName}/commands`)
    })
}
