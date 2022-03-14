const scraper = require('immowelt-scraper');
const _ = require('underscore');
const store = require('./storage/store');
const fs = require('fs');

module.exports.ImmoweltScraper = function(scrapeTargets, storage) {

  var states = scrapeTargets;
  var currentState;
  var entryStore = storage;
  var maxPage = 10;
  var currentPage = 1;
  var retryOnFail = true;
  var initialScrape = false;
  var runningPromise = null;

  this.start = function(isInitialScrape, appstate) {
    console.log("Starting to scrape Immowelt");
    if(appstate) {
      console.log("resuming with appstate: ");
      console.log(appstate);
      if (appstate.maxPage - appstate.currentPage >= 2 || states.length > 0) {
        currentPage = appstate.currentPage;
        maxPage = appstate.maxPage;
        states = appstate.states;
        currentState = appstate.currentState;
        retryOnFail = true;
        initialScrape = isInitialScrape;
        scrapePage(currentPage);
      }
    } else {
      currentPage = 1;
      maxPage = 10;
      retryOnFail = true;
      currentState = scrapeTargets.pop();
      initialScrape = isInitialScrape;
      scrapePage(currentPage);
    }

  };

  var stop = function() {
    retryOnFail = false;
    runningPromise = null;
    console.log("Scraping stopped");
  };

  var onPromiseSuccess = function (result) {
    if (initialScrape) {
      maxPage = result['pagination']['totalPages'];
      initialScrape = false;
    }
    var addedCount = entryStore.addEntries(result['items']);
    if (currentPage < maxPage && addedCount > 0) {
      ++currentPage;
      saveAppState();
      var delay =  _.random(0.5, 1.5) * 1000;
      console.log("Delaying " + delay / 1000 + " seconds.");
      _.delay(scrapePage, delay, currentPage);
    } else if(states.length > 0 && addedCount > 0) {
      currentState = states.pop();
      console.log("New State: " + currentState);
      console.log(states.length + " states left");
      currentPage = 1;
      initialScrape = true;
      saveAppState();
      var delay =  _.random(1, 2.5) * 1000;
      console.log("Delaying " + delay / 1000 + " seconds.");
      _.delay(scrapePage, delay, currentPage);
    } else {
      stop();
    }
  };

  var onPromiseReject = function(reason) {
    console.log(reason);
    if (retryOnFail) {
      scrapePage(currentPage);
    } else {
      return;
    }
  };

  var scrapePage = function(page) {
    console.log("Scraping page " + page + (page === 1 ? "" : (" of " + maxPage + " in " + currentState)));
    runningPromise = scraper.scrapeState(currentState, page).then(
        function(result) { onPromiseSuccess(result); },
        function(reason) { onPromiseReject(reason); }
    );
  };

  var saveAppState = function () {
    let appstate = {};
    appstate.currentPage = currentPage;
    appstate.maxPage = maxPage;
    appstate.states = states;
    appstate.currentState = currentState;

    let data = JSON.stringify(appstate);
    fs.writeFileSync('storage/appstate.json', data);
  };

};
