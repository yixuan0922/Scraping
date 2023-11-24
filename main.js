
const cron = require("node-cron");
const { exec } = require('child_process');

const Chance = require('chance');

const chance = new Chance();

scrapePath = ' node ./index.js';
// hourly
cron.schedule('*/5 * * * *', () => {
//  7 days
// cron.schedule('0 0 * * 0', () => {
  exec(scrapePath, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      return;
    }
    console.log(`Script output: ${stdout}`);
  });
});