import { GluegunCommand } from 'gluegun'
import * as fs from 'fs'
import * as csv from 'csv-parser'
import { DevnetDataFilename, TestnetDataFilename } from '../types'

function printDataGroupedByDay(allData, shrinkFactor: number) {
  let dataGroupedByDay: Map<string, Array<any>> = new Map()
  allData.forEach(result => {
    if(!dataGroupedByDay.get(result.date)) {
      dataGroupedByDay.set(result.date, [])
    }
    dataGroupedByDay.get(result.date).push(result)
  })

  dataGroupedByDay.forEach((value, key, map) => {
    console.log("Total transactions on", key, "=", "|".repeat((value.length / shrinkFactor) + 1), value.length)
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

  }
}

module.exports = command
