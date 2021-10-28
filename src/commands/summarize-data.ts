import { GluegunCommand } from 'gluegun'
import * as fs from 'fs'
import * as csv from 'csv-parser'
import { DevnetDataFilename, TestnetDataFilename } from '../types'
/*
function decodeTutorialMemos(memos): 
{ path: string, button: string, step: string, totalsteps: string } {
  if(memos == null) {
    return null
  }

  // Documented here: https://github.com/XRPLF/xrpl-dev-portal/blob/master/tool/INTERACTIVE_TUTORIALS_README.md#memos
  const output = {
    path: null,
    button: null,
    step: null,
    totalsteps: null,
  }

  const memoData = JSON.parse(memos.MemoData)

  console.log("Has a memo!")
  if(memos.MemoType === 0x68747470733A2F2F6769746875622E636F6D2F5852504C462F7872706C2D6465762D706F7274616C2F626C6F622F6D61737465722F746F6F6C2F494E5445524143544956455F5455544F5249414C535F524541444D452E6D64) {
    console.log("Tutorial transaction found!")
    console.log(memoData)
  }

  if(memoData != null) {
    output.path = memoData.path;
    output.button = memoData.button;
    output.step = memoData.step;
    output.totalsteps = memoData.totalsteps;
  }

  return output
} */

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

const command: GluegunCommand = {
  name: 'summarize-data',
  run: async toolbox => {
    const { print, parameters } = toolbox

    let txFile = TestnetDataFilename
    let shrinkFactor = 250
    if(parameters.first === "dev") {
      print.info('Summarizing Devnet data...')
      txFile = DevnetDataFilename
      shrinkFactor = 50
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
}

module.exports = command
