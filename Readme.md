Fork from [Daniel Waller's](https://github.com/d4l-w4r) [Immowelt Scraper Service ](https://github.com/d4l-w4r/immonet-scraper-service).

Adjusted for use in a research project.
The goal is to scrape publicly available real estate data for statistical analysis.

# Immowelt Scraper Service

This node service scrapes all available entries for a given city from http://immowelt.de and stores them in a simple Json file store.

To make the scraped data available, the service exposes an API with 2 GET endpoints:
* `GET /api/entries` - All scraped entries
* `GET /api/entry/{entryId}` - An entry by its Immonet ID

By default this service starts its API on `localhost:1234`.

Props to [Federico Bertolini](https://github.com/fedebertolini) for writing [immowelt-scraper](https://www.npmjs.com/package/immowelt-scraper) :)
