import { GluegunCommand } from 'gluegun'
import * as fs from 'fs'
import * as csv from 'csv-parser'

const command: GluegunCommand = {
  name: 'summarize-data',
  run: async toolbox => {
    const { print, parameters } = toolbox

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

    /*let dataGroupedByDay = {} 
    allData.forEach(result => {
      dataGroupedByDay[result.date].push(result)
    })*/
    


    // TODO: Make this configurable to target either testnet or devnet, with nice messages throughout to remind people, + Saving to different data sets


  }
}

module.exports = command
