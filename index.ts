export const packageName = 'adonis-resque'

export { configure } from './configure.js'
export { defineConfig } from './define_config.js'

export { Worker } from 'node-resque'
export { Queue } from 'node-resque'
export { default as BaseJob } from './base_job.js'
import { joinToURL } from '@poppinss/utils'

export const stubsRoot = joinToURL(import.meta.url, 'stubs')
