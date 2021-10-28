import { GluegunCommand } from 'gluegun'
import * as xrpl from 'xrpl'
import { ExportToCsv } from 'export-to-csv'
import * as fs from 'fs'
import { hasNextPage } from 'xrpl'
import { DevnetDataFilename, TestnetDataFilename } from '../types'

const command: GluegunCommand = {
  name: 'data-collection',
  run: async toolbox => {
    const { print, parameters } = toolbox

    let server = "wss://s.altnet.rippletest.net:51233"
    let dataFileName = TestnetDataFilename
    if(parameters.first === "dev") {
      console.log("Connecting to Devnet...")
      server = "wss://s.devnet.rippletest.net"
      dataFileName = DevnetDataFilename
    } else {
      console.log("Connecting to Testnet...")
    }

    let maxPagesToRetrieve = -1
    if (parameters.second) {
      print.info(`Limiting to ${parameters.second} pages of results.`)
      maxPagesToRetrieve = parseInt(parameters.second)
    }
    
    // Define the network client
    const client = new xrpl.Client(server)
    await client.connect()

    const faucetAccount = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'

    console.log("Starting to retrieve data...")
    let response = await client.request({
      command: 'account_tx',
      account: faucetAccount
    })
    console.log("Retrieved first response!")

    let transactions = response.result.transactions

    let pagesRetrieved = 1
    const pagesPerStatusUpdate = 10
    
    while (hasNextPage(response) && (maxPagesToRetrieve == -1 || pagesRetrieved < maxPagesToRetrieve)) {
      
      try {
        response = await client.request({
          command: 'account_tx',
          account: faucetAccount,
          marker: response.result.marker
        })
      
        if(response.warning) {
          console.log("Warning:", response.warning)
        }

        transactions = transactions.concat(response.result.transactions)
      } catch(e) {
        console.log("Error:", e)
        break
      }

      pagesRetrieved += 1
      if(pagesRetrieved % pagesPerStatusUpdate === 0) {
        console.log("Retrieved pages", pagesRetrieved - pagesPerStatusUpdate + 1, "-", pagesRetrieved)
      }
    }

    console.log("Done retrieving data!")
    console.log("Total number of transactions retrieved:", transactions.length)

    // This is the format that our CSV will follow, with keys becoming headers
    const txs = transactions.map(transaction => {
      return {
        Account: transaction.tx.Account,
        Amount: "Amount" in transaction.tx ? transaction.tx.Amount : null,
        Destination: "Destination" in transaction.tx ? transaction.tx.Destination : null,
        delivered_amount: typeof transaction.meta === 'object' && "delivered_amount" in transaction.meta ? transaction.meta.delivered_amount : null,
        date: "date" in transaction.tx ? (xrpl.rippleTimeToISOTime((transaction.tx as any).date).split("T")[0]) : null
      }
    })

    const csvExtension = '.csv'
    const fileNameWithoutExtension = dataFileName.substring(0, dataFileName.length - csvExtension.length)
    const csvExporter = new ExportToCsv({
      showLabels: true,
      filename: fileNameWithoutExtension,
      useKeysAsHeaders: true
    })
 
    const csvData = csvExporter.generateCsv(txs, true)

    fs.writeFileSync(dataFileName, csvData)

    // Disconnect when done (If you omit this, Node.js won't end the process)
    await client.disconnect()
  }
}

module.exports = command
