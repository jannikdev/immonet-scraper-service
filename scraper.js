const scraper = require('immowelt-scraper');
const _ = require('underscore');
const store = require('./storage/store');

module.exports.ImmoweltScraper = function(scrapeTarget, storage) {

  var state = scrapeTarget;
  var entryStore = storage;
  var maxPage = 10;
  var currentPage = 1;
  var retryOnFail = true;
  var initialScrape = false;
  var runningPromise = null;

  this.start = function(isInitialScrape) {
    console.log("Starting to scrape Immowelt");
    currentPage = 1;
    maxPage = 10;
    retryOnFail = true;
    initialScrape = isInitialScrape;
    scrapePage(currentPage);
  };

  var stop = function() {
    retryOnFail = false;
    runningPromise = null
    console.log("Scraping stopped");
  }

  var onPromiseSuccess = function (result) {
    if (initialScrape) {
      console.log(result)
      maxPage = result['pagination']['totalPages'];
      initialScrape = false;
    }
    var addedCount = entryStore.addEntries(result['items']);
    console.log(currentPage)
    console.log(maxPage)
    console.log(addedCount)
    if (currentPage < maxPage && addedCount > 0) {
      ++currentPage;
      console.log('increment')
      var delay =  _.random(2, 15) * 1000;
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
    console.log("Scraping page " + page);
    runningPromise = scraper.scrapeState(state, page).then(
        function(result) { onPromiseSuccess(result); },
        function(reason) { onPromiseReject(reason); }
    );
  };
};
