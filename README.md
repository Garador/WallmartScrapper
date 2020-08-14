# Wallmart Scrapper

## How to use
This scrapper is a Playwright-based scrapper I used to scrap products from category from wallMart. It includes a saver class that stores the product info and images locally (although you can create your own later on).
It can also take debug screenshots.

### Install
`npm run install`
That's it

### Run
It can be launched via:
`npm run dev`


## Environment Variables
You can set up a set of environment variables that will help you to configure the search functionality.

**SEARCH_CATEGORY** The category code to be used to search the products. An integer.

**SEARCH_LOCATION** The location for the products to be searched at. Can be a zip code or a city.

**PAGES_TO_SCRAP** The number of pages to scrap.

**NO_SCREENSHOTS** If this exists, it will not take screenshots.