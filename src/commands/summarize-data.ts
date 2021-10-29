import { GluegunCommand } from 'gluegun'
import * as fs from 'fs'
import * as csv from 'csv-parser'
import { DevnetDataFilename, TestnetDataFilename } from '../types'

/**
 * Creates a histogram of transactions per day using the shrinkFactor to scale the bars to the right size.
 * 
 * @param allData Saved transactions from the data-collection command
 * @param shrinkFactor The number of entries per "tick" mark in the histogram. 
 * (Use trial and error to get a scale that makes the graph intuitive :P)
 */
function printDataGroupedByDay(allData, shrinkFactor: number) {
  let dataGroupedByDay: Map<string, Array<any>> = new Map()
  allData.forEach(result => {
    if(!dataGroupedByDay.get(result.date)) {
      dataGroupedByDay.set(result.date, [])
    }
    dataGroupedByDay.get(result.date).push(result)
  })

  dataGroupedByDay.forEach((value, key, map) => {
    // We want a bar that fits on a single row
    const maxBarLength = 45
    let bar = "|".repeat(Math.min((value.length / shrinkFactor) + 1, maxBarLength))
    // Signal that the bar should go beyond the row
    if(bar.length === maxBarLength) {
      bar = bar + "+" 
    }
    console.log("Total transactions on", key, "=", bar, value.length)
  })
}

/**
 * Looks at all destination addresses and prints out which are most common, and second most common.
 * 
 * @param allData Saved transactions from the data-collection command
 */
function printLargestDestinations(allData) {
  const addressCount: Map<string, number> = new Map()
  allData.forEach(result => {
    if(!addressCount.get(result.Destination)) {
      addressCount.set(result.Destination, 1)
    } else {
      addressCount.set(result.Destination, addressCount.get(result.Destination) + 1)
    }
  })

  let largest = { Destination: "None", count: 0 }
  let secondLargest = {...largest}
  addressCount.forEach((value, key, map) => {
    if(value > largest.count) {
      secondLargest = {...largest}
      largest.Destination = key
      largest.count = value
    }
  })
  console.log("The most common destination account was:", largest.Destination, "with", largest.count, "occurrences!")
  console.log("The second most common destination account was:", secondLargest.Destination, "with", secondLargest.count, "occurrences!")
}

/**
 * This creates a histogram of the transactions sent to the faucet. 
 * It uses a heuristic of checking for the same 'amount' sent as the tutorial, so may be slightly inaccurate.
 * This only works on Testnet because the tutorial only interacts with Testnet!
 * 
 * @param allData Saved transactions from the data-collection command
 */
 function checkForSendXRPTutorialTransactions(allData) {
  // Send XRP unfortunately does not track interactions like this, but other tutorials do!
  allData.forEach(tx => {
    if(tx.Memos !== null && tx.Memos !== "null") {
      console.log(tx.Memos)
      console.log(tx)
    }
  })

  const allSendXRPTransactions = []
  allData.forEach((tx => {
    if(tx.Amount === "22000000" && tx.Destination === "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe") {
      allSendXRPTransactions.push(tx)
    }
  }))

  console.log("JUST SEND XRP TRANSACTIONS:")
  printDataGroupedByDay(allSendXRPTransactions, 5)
}

const command: GluegunCommand = {
  name: 'summarize-data',
  run: async toolbox => {
    const { print, parameters } = toolbox

    /**
     * Configure for looking at Testnet data or Devnet data based on inputs.
     */
    let txFile = TestnetDataFilename
    let shrinkFactor = 250
    let server = "test"
    if(parameters.first === "dev") {
      print.info('Summarizing Devnet data...')
      txFile = DevnetDataFilename
      shrinkFactor = 50
      server = "dev"
    } else {
      print.info('Summarizing Testnet data...')
    }

    const allData: any = await new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(txFile)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
          if(results.length === 0) {
              console.log(`No data found in ${txFile}`)
          } else {
              console.log(`Done reading in ${results.length} lines of data!`)
          }
          resolve(results)
      })
    })

    const destinations = allData.map(result => result.Destination)
    const uniqueDestinations = new Set(destinations)
    console.log(`Total unique addresses that interacted with the faucet = ${uniqueDestinations.size}`)

    printDataGroupedByDay(allData, shrinkFactor)

    printLargestDestinations(allData)

    if(server === "test") {
      checkForSendXRPTutorialTransactions(allData)
    }
  }
}

module.exports = command
