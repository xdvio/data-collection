import { GluegunCommand } from 'gluegun'
import * as xrpl from 'xrpl'
import { ExportToCsv } from 'export-to-csv'
import * as fs from 'fs'

const command: GluegunCommand = {
  name: 'data-collection',
  run: async toolbox => {
    const { print, parameters } = toolbox

    if (parameters.first) {
      print.info(`${parameters.first}`)
      return
    }

    // Define the network client
    const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
    await client.connect()

    const faucetAccount = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'

    const response = await client.request({
      command: 'account_tx',
      account: faucetAccount
    })

    const transactions = response.result.transactions

    const txs = transactions.map(transaction => {
      return {
        Account: transaction.tx.Account,
        Amount: "Amount" in transaction.tx ? transaction.tx.Amount : null,
        Destination: "Destination" in transaction.tx ? transaction.tx.Destination : null,
        delivered_amount: typeof transaction.meta === 'object' && "delivered_amount" in transaction.meta ? transaction.meta.delivered_amount : null,
        date: "date" in transaction.tx ? xrpl.rippleTimeToISOTime((transaction.tx as any).date) : null
      }
    })

    const csvExporter = new ExportToCsv({
      showLabels: true,
      filename: 'transactions'
    })
 
    const csvData = csvExporter.generateCsv(txs, true)

    fs.writeFileSync('transactions.csv', csvData)

    // Disconnect when done (If you omit this, Node.js won't end the process)
    client.disconnect()
  }
}

module.exports = command
