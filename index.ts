export const packageName = 'adonis-resque'

export { configure } from './configure.js'
export { stubsRoot } from './stubs/index.js'
export { defineConfig } from './define_config.js'

export { Worker } from 'node-resque'
export { Queue } from 'node-resque'
export { default as BaseJob } from './base_job.js'
