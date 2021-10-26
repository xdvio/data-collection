# data-collection CLI

A CLI for data-collection.

## Running the CLI

```shell
$ yarn install
$ yarn start
```

Currently, this loads some transactions from the faucet account and writes a summary to `./transactions.csv`

## Publishing to NPM

To package your CLI up for NPM, do this:

```shell
$ npm login
$ npm whoami
$ npm lint
$ npm test
(if typescript, run `npm run build` here)
$ npm publish
```

# License

MIT - see LICENSE

