import type { RedisConnections } from '@adonisjs/redis/types'

export function defineConfig<Connections extends RedisConnections>(config: {
    redisConnection: keyof Connections
}) {
    return config
}