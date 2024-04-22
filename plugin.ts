import { Plugins } from "node-resque"
type LockKey = string | (() => string)
export interface JobLockOptions {
    /**
     * should we re-enqueue the job if it is already locked?
     */
    reEnqueue?: boolean
    /**
     * reEnqueue the job, delay it by <enqueueTimeout> milliseconds
     */
    enqueueTimeout?: number
    /**
     * lock the job for <lockTimeout> seconds
     * default: 3600 (1 hour)
     */
    lockTimeout?: number
    /**
     * the key, for identifying the lock
     */
    key?: LockKey
}
export interface NoopOptions {
    logger?: (error: Error) => unknown
}
export interface QueueLockOptions {
    /**
     * in seconds
     */
    lockTimeout?: number
    key?: LockKey
}
export interface RetryOptions {
    retryLimit?: number
    /**
     * in milliseconds, delay for next retry attempt.
     */
    retryDelay?: number
    /**
     * define an array containing the delay milliseconds number for each retry attempt.
     * if the array is shorter than the retryLimit,
     * the last value will be used for all remaining attempts.
     */
    backoffStrategy?: number[]
}
export class Plugin {
    /**
     * If a job with the same name, queue
     * and args is already running
     * put this job back in the queue and try later
     * @param options.reEnqueue
     * @param options.enqueueTimeout
     * @param options.lockTimeout
     * @param options.key
     * If true, re-enqueue the job if it is already running. If false, do not enqueue the job if it is already running.
     * @docs Source code: https://github.com/actionhero/node-resque/blob/main/src/plugins/JobLock.ts
     */
    static jobLock (options: JobLockOptions = {}): [typeof Plugins.JobLock, JobLockOptions] {
        return [Plugins.JobLock, options]
    }
    /**
     * If a job with the same name, queue
     * and args is already in the delayed queue(s)
     * do not enqueue it again
     * @docs Source code: https://github.com/actionhero/node-resque/blob/main/src/plugins/DelayQueueLock.ts
     */
    static delayQueueLock(): [typeof Plugins.DelayQueueLock]  {
        return [Plugins.DelayQueueLock]
    }
    /**
     * Log the error and do not throw it
     * @param options.logger
     * @docs Source code: https://github.com/actionhero/node-resque/blob/main/src/plugins/Noop.ts
     * A function to log the error.
     */
    static noop(options: NoopOptions = {}): [typeof Plugins.Noop, NoopOptions] {
        return [Plugins.Noop, options]
    }
    /**
     * If a job with the same name, queue
     * and args is already in the queue
     * do not enqueue it again
     * @param options.lockTimeout
     * @param options.key
     * @docs Source Code: https://github.com/actionhero/node-resque/blob/main/src/plugins/QueueLock.ts
     */
    static queueLock(options: QueueLockOptions = {}): [typeof Plugins.QueueLock, QueueLockOptions] {
        return [Plugins.QueueLock, options]
    }
    /**
     * If a job fails, retry it N times 
     * before finally placing it into the failed queue
     * 
     * @param options.retryLimit
     * @param options.retryDelay
     * @param options.backoffStrategy
     * @docs Source code: https://github.com/actionhero/node-resque/blob/main/src/plugins/Retry.ts
     */
    static retry(options: RetryOptions = {}): [typeof Plugins.Retry, RetryOptions] {
        return [Plugins.Retry, options]
    }
}
