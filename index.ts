import { WallmartProductFetcher } from './lib/wallmartProductFetcher';
import { Product } from './lib/product';
import { LocalProductSaver } from './lib/localProductSaver';
  
(async ()=>{
    let localProductSaver = new LocalProductSaver();
    let location = process.env.SEARCH_LOCATION || "Miami";
    let category = process.env.SEARCH_CATEGORY ? parseInt(process.env.SEARCH_CATEGORY) : 976759;
    let fetcher = new WallmartProductFetcher(localProductSaver, location, category);

    let products:Product[] = [];
    let pagesToScrap = process.env.PAGES_TO_SCRAP ? parseInt(process.env.PAGES_TO_SCRAP) : 10;
    for(let currentPage=0;currentPage<pagesToScrap;currentPage++){
        products = await fetcher.searchProducts(currentPage, (product)=>{
            let allows = !!!product.location.match("not available")
            && !!product.location.toLowerCase().match('doral');
            return allows;
        });
    }
    console.log("Run finished.");
})()