import { Plugin } from "node-resque"

export default abstract class BasePlugin extends Plugin {
    static create<T extends typeof BasePlugin>(this: T, options: T['prototype']['options'] = {}): [T, T['prototype']['options']] {
        return [this, options]
    }
}
