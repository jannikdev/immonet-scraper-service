// Node dependencies
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const immowelt_scraper = require('immowelt-scraper');
const fs = require('fs');

// Local dependencies
const scraper = require('./scraper');
const store = require('./storage/store');


// configuration
var app = express();
var storeObj = new store.Store();
// var scrapeTarget = "Bremen"; //Name of federal state in "normal" capitalization without mutated vowels (eg. "Thueringen")
var scrapeTargets = immowelt_scraper.states; //List of federal states to scrape (immowelt-scraper.states contains every federal state of germany)
var scraperInstance = new scraper.ImmoweltScraper(scrapeTargets, storeObj);

app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());

// routes
app.get('/api/entries', function(req, res) {
  //get all entries
  data = storeObj.getEntries();
  res.json(data);
});

app.get('/api/entry/:entryId', function(req, res) {
  //get all entries
  data = storeObj.getEntry(req.params['entryId']);
  res.json(data);
});

app.get('/api/csv', function (req,res) {
  const items = storeObj.getEntries();
  const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
  const header = Object.keys(items[0]);
  const csv = [
    header.join(';'), // header row first
    ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(';'))
  ].join('\r\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('export.csv');
  res.send(csv);
});

app.get('/api/count', function(req, res) {
  //count all entries
  data = storeObj.getEntries().length;
  res.json(data);
});

// start server
var isInitialScrape = storeObj.getEntries().length == 0;
var args = process.argv.slice(2);
if(args.includes('restart')) {
  let appstate = fs.readFileSync('storage/appstate.json');
  appstate = JSON.parse(appstate);
  scraperInstance.start(isInitialScrape, appstate)
} else {
  scraperInstance.start(isInitialScrape, undefined);
}

// if (!isInitialScrape) {
//   setInterval(function() { scraperInstance.start(); }, (60 * 1000) * 10) // restart every 10 minutes
// }
app.listen(8081);
console.log("Scraper service running on http://localhost:8081");
