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

You can change it in `config/resque.ts`, it's all same with `createClient` Configuration.

## How to import
As it is a container service, you can init it by
```typescript
await app.container.make('resque')
```
or
```typescript
import resque from 'adonis-resque/services/main'
```


## Documentation

See [node-resque](https://github.com/actionhero/node-resque)

## Lisence
the MIT
