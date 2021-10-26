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

    const results = [];
    const txFile = 'transactions.csv'

    fs.createReadStream(txFile)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
        if(results.length === 0) {
            console.log(`No data found in ${txFile}`)
        } else {
            console.log(`Done reading in ${results.length} lines of data!`)
            console.log(results[1])
        }
    });


  }
}

module.exports = command
