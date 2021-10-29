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
# Commands 
## data-collection ["dev" or "test"] maxPagesToRetrieve
This command fetches all transactions involving the faucet on either Testnet of Devnet. By default it looks at Testnet, but if you pass in the parameter "dev" as the first parameter, it will instead retrieve data from the Devnet faucet. Additionally you can specify the optional parameter of `maxPagesToRetrieve` if you do not want the complete recorded history from the ledger. 

It then saves a shortened version of the data in `testnet-transactions.csv` or `devnet-transactions.csv` respectively. 
Note: Testnet and Devnet have online deletion, which means they only store about a month or two of transaction history. More on that here: https://xrpl.org/online-deletion.html

## summarize-data ["dev" or "test"]
This command parses the data from `data-collection` into a readable format retrieving several interesting values:
1. It creates a histogram of total transactions involving the faucet account (Grouped by day)
2. It tries to find the most common destination address (Usually the faucet, but can be others!)
3. If looking at Testnet data, it creates a histogram of transactions which look like they came from the [Send XRP tutorial](https://xrpl.org/send-xrp.html)

The summary was mostly part of an exploratory effort to see what insights we could find from the data, and so may be extended or modified in the future based on what questions we are trying to answer.

# License

MIT - see LICENSE

