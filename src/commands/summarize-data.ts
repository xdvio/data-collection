import { GluegunCommand } from 'gluegun'
import * as fs from 'fs'
import * as csv from 'csv-parser'

const command: GluegunCommand = {
  name: 'summarize-data',
  run: async toolbox => {
    const { print, parameters } = toolbox

    // TODO: Add support for Devnet and test-net datasets as a parameter (Default to Testnet)
    if (parameters.first) {
        print.info(`${parameters.first}`)
        return
    }

    const txFile = 'transactions.csv'

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

    let dataGroupedByDay: Map<string, Array<any>> = new Map()
    allData.forEach(result => {
      if(!dataGroupedByDay.get(result.date)) {
        dataGroupedByDay.set(result.date, [])
      }
      dataGroupedByDay.get(result.date).push(result)
    })

    const shrinkFactor = 250
    dataGroupedByDay.forEach((value, key, map) => {
      console.log("Total transactions on", key, "=", "-".repeat(value.length / shrinkFactor), value.length)
    })
    console.log(dataGroupedByDay.entries.length)
    


    // TODO: Make this configurable to target either testnet or devnet, with nice messages throughout to remind people, + Saving to different data sets


  }
}

module.exports = command
