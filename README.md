
<div align="center">
  <img src="https://i.imgur.com/SWHLZNO.png" />
  <h3>Node Resque Queue for AdonisJS v6</h3>
  <p>A third-party wrapper for `node-resque` in AdonisJS v6.</p>
  <a href="https://www.npmjs.com/package/adonis-resque">
    <img src="https://img.shields.io/npm/v/adonis-resque?logo=nodedotjs" />
  </a>
  <img src="https://img.shields.io/badge/Lang-typescript-blue?logo=typescript" />
  <img src="https://img.shields.io/npm/l/adonis-resque?logo=opensourceinitiative" />
</div>

> [!CAUTION]
> This package is not compatible with AdonisJS v5.

<!-- TOC -->

- [Installation](#installation)
- [Job Usage](#job-usage)
  - [Basic](#basic)
  - [Batch enqueue](#batch-enqueue)
  - [Delayed enqueue](#delayed-enqueue)
  - [Repeated Enqueue](#repeated-enqueue)
- [Demonstration](#demonstration)
  - [Send Mail Job](#send-mail-job)
- [Configuration](#configuration)
- [Web UI](#web-ui)
- [Reference](#reference)
- [Lisence](#lisence)

<!-- /TOC -->

## Installation

```bash
node ace add adonis-resque
```

## Job Usage
You can create a resque job by adonis command: `node ace make:job <YourJobName>`

> [!TIP]
> You can import the job by sub-path.
> `import Example from #jobs/example`  
> Follow the instruction: [The sub-path imports](https://docs.adonisjs.com/guides/folder-structure#the-sub-path-imports).
>  
> Both `package.json` and `tsconfig.json` are required to add the job path:
> - add `"#jobs/*": "./jobs/*.js"` to `package.json`
> - add `"#jobs/*": ["./jobs/*.js"]` to field `compilerOptions.paths` in `tsconfig.json`.

### Basic

Every job has a perform method. It runs in the background, which consumer from the node-resque queue.

```typescript
// app/jobs/basic_example.ts
import { BaseJob } from 'node-resque'
export default class BasicExample extends BaseJob {
  async perform(name: string) {
    this.logger.info(`Hello ${name}`)
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

### Batch enqueue
```typescript
await BasicExample.enqueueAll(['Alice', 'Bob', 'Carol', 'Dave', 'Eve'])
```

### Delayed enqueue
```typescript
const oneSecondLater = 1000
await BasicExample.enqueue('Bob').in(oneSecondLater)
```
Or enqueue at a specify timestamp
```typescript
const fiveSecondsLater = new Date().getTime() + 5000
await BasicExample.enqueue('Bob').at(fiveSecondsLater)
```

### Repeated Enqueue

class Job has the schedule properties.
- `interval`, .e.g `5s`, `15m`, `2h` and `1d`. [package ms](https://github.com/vercel/ms) for more details.
- `cron`, for cron syntax, look up the [croner package](https://github.com/hexagon/croner)

The example below enqueue in both every 1 second and 5 minutes, since it's `cron`/`interval` settings.

```typescript
export default class BasicExample extends BaseJob {
  // enqueue job cronly
  cron: '*/1 * * * * *',
  // enqueue every five minutes
  interval: '5m',
  async perform(name: string) {
    this.logger.log(`Hello ${name}`)
  }
}
```

> [!TIP]
> You can and should run multi process schedules.
> Not all schedules will enquene the cron job,
> only the leader do, even in the different machines.  
> For more informations, see node-resque leader scheduler: https://github.com/actionhero/node-resque?tab=readme-ov-file#job-schedules

## Demonstration
### Send Mail Job

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
     * setting a proper queue name could change their priorities 
     * e.g. queueNameForWorkers: "high-priority, medium-priority, low-priority"
     * All the jobs in high-priority will be worked before any of the jobs in the other queues. 
     */
    queueNameForWorkers: '*',
    queueNameForWorkers: '*',
    /**
     * set null to use the default logger
     */
    logger: null,
    // verbose mode for debugging
    verbose: true
}
```

## Web UI
node-resque also compatible with some Resque Web UI, .e.g [resque-web](https://github.com/resque/resque-web)

Here is `docker-compose.yml` an example
```yaml
services:
  redis:
    image: redis
  resque-web:
    image: appwrite/resque-web:1.1.0
    ports:
      - "5678:5678"
    environment:
      - RESQUE_WEB_HOST=redis # (OPTIONAL - Use only if different than the default 127.0.0.1)
      - RESQUE_WEB_PORT=6379  # (OPTIONAL - Use only if different the default 6379)
      - RESQUE_WEB_HTTP_BASIC_AUTH_USER= # (OPTIONAL - if not set no password used)
      - RESQUE_WEB_HTTP_BASIC_AUTH_PASSWORD=  # (OPTIONAL - if not set no password used)
    depends_on:
      - redis
    restart: unless-stopped
```
![Web UI](https://imgur.com/nN2d9ak)
## Reference

- [node-resque](https://github.com/actionhero/node-resque)

## Lisence
the MIT
