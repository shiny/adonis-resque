/*
 * adonis-resque
 *
 * (c) Dai Jie <https://github.com/shiny>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Plugin } from "node-resque";

export default abstract class BasePlugin extends Plugin {
  static create<T extends typeof BasePlugin>(
    this: T,
    options: T["prototype"]["options"] = {},
  ): [T, T["prototype"]["options"]] {
    return [this, options];
  }
}
