<div align="center">
  <img src="https://i.imgur.com/SWHLZNO.png" />
  <h3>Node Resque Queue for AdonisJS v6</h3>
  <p>A third-party wrapper for `node-resque` in AdonisJS v6.</p>
  <a href="https://www.npmjs.com/package/adonis-resque">
    <img src="https://img.shields.io/npm/v/adonis-resque.svg?style=for-the-badge&logo=npm" />
  </a>
  <img src="https://img.shields.io/npm/l/adonis-resque?color=blueviolet&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript" />
</div>

> [!CAUTION]
> This package is not compatible with AdonisJS v5.

## Installation

```bash
node ace add adonis-resque
```

## Configuration

Here is an example of `config/resque.ts`

```typescript
{
    /**
     * redis connection config from @adonisjs/redis
     */
    redisConnection: 'main',
    /**
     * run web & worker in same process, if enabled
     * You need to run command node ace resque:start if it is turned off
     *
     * it's convenient but NOT Recommanded in production
     * also, DO NOT enable for math-heavy jobs, even in the dev or staging environment.
     * 
     */
    runWorkerInWebEnv: true,
    /**
     * when runScheduler enabled, it starts with worker
     * if you'd like to run scheduler in the separated processes
     * please turn runScheduler off, and run command
     * node ace resque:start --scheduler
     */
    runScheduler: true,
    /**
     * enable node-resque multiworker
     * @docs https://github.com/actionhero/node-resque?tab=readme-ov-file#multi-worker
     */
    isMultiWorkerEnabled: true,
    /**
     * the first argument in MultiWorker constructor
     */
    multiWorkerOption: {
        minTaskProcessors: 1,
        maxTaskProcessors: 10
    },
    /**
     * the argument for Worker constructor, if multiWorker is not enabled
     */
    workerOption: {
    },
    /**
     * the default queue name for jobs to enqueue
     */
    queueNameForJobs: 'default',
    /**
     * queue name for workers to listen,
     * is a string or an array of string
     */
    queueNameForWorkers: '*',
    /**
     * set null to use the default logger
     */
    logger: null,
    // verbose mode for debugging
    verbose: true
}
```

## Job
You can create a resque job by adonis command: `node ace make:job <YourJobName>`

> [!TIP]
> You can import the job by sub-path.
> `import Example from #jobs/example`  
> Follow the instruction: [The sub-path imports](https://docs.adonisjs.com/guides/folder-structure#the-sub-path-imports).
>  
> Both `package.json` and `tsconfig.json` are required to add the job path:
> - add `"#jobs/*": "./jobs/*.js"` to `package.json`
> - add `"#jobs/*": ["./jobs/*.js"]` to field `compilerOptions.paths` in `tsconfig.json`.

## Basic Usage

Every job has a perform method. It runs in the background, which consumer from the node-resque queue.

```typescript
// app/jobs/basic_example.ts
import { BaseJob } from 'node-resque'
export default class BasicExample extends BaseJob {
  async perform(name: string) {
    console.log(`Hello ${name}`)
  }
}
```

Now you can enqueue this job. 
```typescript
import BasicExample from '#jobs/basic_example'
await BasicExample.enqueue('Bob')

// if you'd like to delay for 1000ms
await BasicExample.enqueue('Bob').in(1000)
```

## Enqueue Job Repeatedly

class Job has a schedule property.
- `schedule.interval`, .e.g '5s', '2h', '1d'. [package ms](https://github.com/vercel/ms) for more details.
- `schedule.cron`, for cron syntax, look up the [croner package](https://github.com/hexagon/croner)

```typescript
export default class BasicExample extends BaseJob {
  schedule = {
    // enqueue job cronly
    cron: '*/1 * * * * *',
    // enqueue every five minutes
    interval: '5m',
  }
  async perform(name: string) {
    console.log(`Hello ${name}`)
  }
}
```

## Send Mail Job: a Basic Demonstration

In Adonis Documentation, they use bullmq as mail queueing example.
But if we wanna use `adonis-resque` for `mail.sendLater`, how to do?

1. Create a Mail Job  
Run `node ace make:job Mail` to create the mail job, then edit it in `app/jobs/mail.ts`

```typescript
import { BaseJob } from 'adonis-resque'
import mail from '@adonisjs/mail/services/main'
import { MessageBodyTemplates, NodeMailerMessage } from '@adonisjs/mail/types'

interface Options {
    mailMessage: {
        message: NodeMailerMessage;
        views: MessageBodyTemplates;
    }
    config: any
}
export default class Mail extends BaseJob {
    async perform(option: Options) {
        const { messageId } = await mail.use('smtp')
            .sendCompiled(option.mailMessage, option.config)
        this.logger.info(`Email sent, id is ${messageId}`)
    }
}
```

2. Custom `mail.setMessenger` in a service provider  
You can add the below code snippet to a boot method of any service provider.

```typescript
const mail = await this.app.container.make('mail.manager')
mail.setMessenger(() => {
  return {
    async queue(mailMessage, sendConfig) {
      return Mail.enqueue({ mailMessage, config: sendConfig })
    }
  }
})
```

3. `mail.sendLater` is available now! Try it: :shipit:
```typescript
await mail.sendLater((message) => {
  message.to('your-address@example.com', 'Your Name')
  .subject('Hello from adonis-resque')
  .html(`<strong>Congratulations!</strong>`)
})
```

> [!CAUTION]
> You should insure `@adonisjs/mail` has a correct config, you'd better to test it first.

## Documentation

See [node-resque](https://github.com/actionhero/node-resque)

## Lisence
the MIT
