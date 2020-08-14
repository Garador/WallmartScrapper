import { chromium, Page, Browser } from "playwright";
import { ProductFetcher } from "./productFetcher";
import {Product} from './product';
import { ProductSaver } from "./productSaver";
import * as fs from 'fs';

/**
 * @description Gets the products from WallMart
 */
export class WallmartProductFetcher extends ProductFetcher {

    location: string;
    mainProductsPage:Page;
    browser: Browser;
    saver:ProductSaver;
    category: number;

    /**
     * 
     * @param saver The saver object that will store the products after they get fetched
     * @param location The zip code / city to use in order to determine the location
     * @param category 
     */
    constructor(saver:ProductSaver, location:string, category: number){
        super();
        this.saver = saver;
        this.location = location;
        this.category = category;
    }

    async getPageSKU(page:Page){
        let sku = await page.evaluate(function(){
            return document.querySelector("#product-overview > div > div:nth-child(3) > div > meta[itemProp='sku']").getAttribute("content");
        });
        return sku;
    }

    /**
     * @description Sets the address explicitly from the product page
     * @param page The product page
     */
    async setAddressFromProductPage(page: Page){
        let sku = await this.getPageSKU(page);
    
        await page.click("#add-on-atc-container > section.prod-LocationSelectorSection.location-selection-link > button > span");
        await new Promise(accept => setTimeout(accept, 3000));
        await this.takeProductPageScreenshot(page, sku, "address_s1");
    
        let prevText:string = await page.evaluate(function(){
            let match;
            match = document.querySelector(".fulfillment-buy-box-update > div:last-child .fulfillment-text");
            return match ? match.innerText : "";
        });
    
        await page.focus(".prod-Fulfillment-container-body.prod-fulfillmentOptionsTable.prod-AccessFulfillmentOptionsTable div.zipcode-form-field.field.field--secondary > input");
        await page.evaluate(function(){
            let inputElement;
            inputElement = document.querySelector(".prod-Fulfillment-container-body.prod-fulfillmentOptionsTable.prod-AccessFulfillmentOptionsTable div.zipcode-form-field.field.field--secondary > input");
            inputElement.value = "";
        });
        await page.type(".prod-Fulfillment-container-body.prod-fulfillmentOptionsTable.prod-AccessFulfillmentOptionsTable div.zipcode-form-field.field.field--secondary > input", `${this.location}`, {delay:100});
        await page.click("div.prod-Fulfillment-container-body .zipcode-form-buttons-cntnr .spin-button-children");
    
        await this.takeProductPageScreenshot(page, sku, "address_s2");
        
        await page.click("div.modal.prod-fulfillmentOptionsModal > button > span > span");


        //console.log("Waiting for function...");
        try{
            await page.waitForFunction(function(prevText){
                let element;
                element = document.querySelector(".fulfillment-buy-box-update > div:last-child .fulfillment-text");
                return element && (element.innerText !== prevText);
            }, prevText, {timeout: 60000});
        }catch(e){
            await page.screenshot({
                path: "error2.png"
            });
        }
        //console.log("Function done");
    
        if(prevText.toLowerCase().indexOf("Doral") < 0){
            //console.log("Waiting for address to change...");
            try{
                await page.waitForRequest("about:blank", {timeout: 5000});
            }catch(e){
                //console.log(`Error getting data for ${sku}...`);
            }

            await this.takeProductPageScreenshot(page, sku, "address_s3");
        }
    
        await new Promise(accept => setTimeout(accept, 3500));
    
        await this.takeProductPageScreenshot(page, sku, "address_s4");
    }

    /**
     * @description Fetchs the product information from a webpage based on it's URL
     * and fills the information on the product object
     * @param product The product gotten
     */
    async _fetchProduct(product:Product): Promise<Product>{

        let page = await this.browser.newPage();

        try{
            await page.goto(product.url, {timeout: 65000});
        }catch(e){
            //console.log("Error going to product page...");
            throw e;
        }
        
        await page.waitForLoadState("domcontentloaded");

        let sku = await this.getPageSKU(page);

        await this.takeProductPageScreenshot(page, sku);

        //console.log("Setting up product address...");
        await this.setAddressFromProductPage(page);

        //console.log("Getting page data...");
        let productData = await page.evaluate(([selector])=>{
            let imageElements;
            imageElements = document.querySelectorAll(selector);
            let images = [];
            for(let i=0;i<imageElements.length;i++){
                let mainEl = imageElements[i].src.split("?")[0];
                images.push(`${mainEl}?onWidth=612&odnHeight=612&odnBg=ffffff`);
            }
            let titleElement, priceElement, addressElement;
            titleElement = document.querySelector(".prod-ProductTitle");
            priceElement = document.querySelector("#price");
            addressElement = document.querySelector(".fulfillment-buy-box-update > div:last-child .fulfillment-text");
            let title = titleElement ? titleElement.innerText : "";
            let price = priceElement ? priceElement.innerText.split("\n")[0] : "";
            let address = addressElement ? addressElement.innerText : "";

            return {
                images,
                title,
                price,
                address
            };
        }, ['.prod-alt-image-carousel-image--left'])
        await this.takeProductPageScreenshot(page, sku, "example2");
        await new Promise(accept => setTimeout(accept, 2000));
        await this.takeProductPageScreenshot(page, sku, "example2-b");
        await page.close();

        product.imagePaths = productData.images;
        product.location = productData.address;
        product.price = productData.price;
        product.sku = sku;
        product.name = productData.title;

        return product;
    }

    /**
     * @description Gets the products from a webpage
     */
    async _listProducts(): Promise<Product[]>{
        let elements:string[] = await this.mainProductsPage.evaluate(()=>{
            let elements = document.querySelectorAll("#searchProductResult .search-result-gridview-item.clearfix.arrange-fill > div:nth-child(5) > div > a");
            let links = [];
            for(let i=0;i<elements.length;i++){
                links.push(`https://www.walmart.com${elements[i].getAttribute('href').split("?")[0]}`);
            }
            return links;
        });
        return elements.map(element => {
            let product = new Product();
            product.url = element;
            return product;
        });
    }

    /**
     * @description Sets the address on the main page
     */
    private async setMainPageAddress(){

        //console.log("setMainPageAddress clicking #1");
        try{
            await this.mainProductsPage.waitForSelector("button[data-tl-id='nd-zip']", {timeout: 60000});
            await this.mainProductsPage.click("button[data-tl-id='nd-zip']", {timeout: 60000});
        }catch(e){
            await this.mainProductsPage.screenshot({
                path:'error.png'
            });
            throw e;
        }
        
        await new Promise(accept => setTimeout(accept, 1000));
        await this.mainProductsPage.evaluate(function(zipCode){
            let element;
            element = document.querySelector("#next-day-location-modal [data-tl-id='zipcode-form-input']");
            element.value = zipCode;
    
            let submitElement;
            submitElement = document.querySelector("#next-day-location-modal button[location-input='submit-button']");
            submitElement.click();
        }, this.location);
        await new Promise(accept => { setTimeout(accept, 1000); });
        await this.mainProductsPage.waitForLoadState("networkidle", {timeout: 60000});
        await this.takeMainPageScreenshot("inputTest1");
        //console.log("Stored the input?...");
    }

    /**
     * @description Checks if the screenshots folder exist
     */
    checkScreenshotsDir(){
        if(!fs.existsSync("./screenshots") || !fs.statSync("./screenshots").isDirectory()){
            fs.mkdirSync("./screenshots");
        }
    }

    /**
     * @description Checks if the product screenshots exist
     */
    checkProductsScreenshotsDir(){
        if(!fs.existsSync('./screenshots/products') || !fs.statSync("./screenshots/products").isDirectory()){
            fs.mkdirSync("./screenshots/products");
        }
    }

    /**
     * @description Takes a screenshot from the main page
     * @param name The name of the screenshot
     */
    private async takeMainPageScreenshot(name="location1"){
        this.checkScreenshotsDir();
        if(!!process.env.NO_SCREENSHOTS){
            return;
        }
        await this.mainProductsPage.screenshot({
            path: `./screenshots/main_screen_${name}.png`
        });
    }

    /**
     * @description Takes a screenshot for the page
     * @param page The page to take the screenshot from
     * @param sku The SKU for the product
     * @param suffix The suffix for the screenshot (it's custom name)
     */
    private async takeProductPageScreenshot(page: Page, sku:string, suffix?:string){
        this.checkProductsScreenshotsDir();
        if(!!process.env.NO_SCREENSHOTS){
            return;
        }
        await page.screenshot({
            path: `./screenshots/products/${sku}${suffix ? `_${suffix}` : ''}.png`
        });
    }

    /**
     * @description Sets the address to the main page
     */
    private async setMainPageAddressProg(){
        await this.mainProductsPage.evaluate(function(zipCode){
            const formData = new FormData();
            formData.append('postalCode', `${zipCode}`);
            formData.append('clientName', "Web-Header-NDToggleBar");
            formData.append('persistLocation', "true");
    
            return fetch('https://www.walmart.com/account/api/location', {
                method: 'PUT',
                body: formData
            });
        }, this.location);
        await this.mainProductsPage.reload();
    }
    
    /**
     * @description The main function to search the wallmart products
     * @param startingPage Starting page (from)
     * @param filter The filter function to evaluate the pages that should be stored
     */
    public async searchProducts(startingPage?:number, filter?:(element:Product)=>boolean): Promise<Product[]>{
        this.browser = await chromium.launch();    
        this.mainProductsPage = await this.browser.newPage();
        //console.log("Going to main page...");
        let url = `https://www.walmart.com/search/?query=&cat_id=${this.category}`;
        if(!isNaN(startingPage) && startingPage){
            url = `https://www.walmart.com/search/?cat_id=${this.category}&page=${startingPage}&query=`  
        }
        //console.log({url});
        await this.mainProductsPage.goto(url);
        
        await this.mainProductsPage.waitForLoadState("networkidle", {timeout:60000});

        //console.log("Setting main page address via method #0...");
        await this.setMainPageAddressProg();
        
        //console.log("Opening products page...");
        await this.takeMainPageScreenshot("location0");

        //console.log("Setting address via method #1...");
        await this.setMainPageAddress();
        await this.takeMainPageScreenshot("location1");

        let products:Product[] = [];
        
        let productLinks = await this._listProducts();

        for(let linkI = 0; linkI < productLinks.length; linkI++){
            try{
                let product = await this._fetchProduct(productLinks[linkI]);
                if(filter && filter(product)){
                    await this.saver.storeProducts([product]);
                    products.push(product);
                }
            }catch(e){
                //console.log({e});
            }
        }

        await this.mainProductsPage.close();
        await this.browser.close();

        return products;
    }
}