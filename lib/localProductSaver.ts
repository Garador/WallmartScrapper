import { ProductSaver } from "./productSaver";
import { Product } from "./product";
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export class LocalProductSaver extends ProductSaver {
    mainLocation:string;

    constructor(mainLocation = "./storedProducts"){
        super();
        this.mainLocation = mainLocation;
    }

    async storeProducts(products:Product[]) {
        for(let pathI = 0; pathI < products.length; pathI++){
            let product = products[pathI];
            let mainPath = path.join(this.mainLocation, product.sku);
            if(!fs.existsSync(this.mainLocation) || !fs.statSync(this.mainLocation).isDirectory()){
                fs.mkdirSync(this.mainLocation);
            }
            if(!fs.existsSync(mainPath)){
                fs.mkdirSync(mainPath);
            }
            await this.storeProductImages(product);
            await this.storeProductInfo(product);
        }
    }

    private getImagePath(sku:string, imageUrl:string){
        return path.join(this.mainLocation, sku, imageUrl.split("/").pop().split("?")[0]);
    }

    private getDescriptionFilePath(sku:string){
        return path.join(this.mainLocation, sku, "description.txt");
    }

    async storeProductImages(product:Product) {
        for(let imageI=0;imageI<product.imagePaths.length;imageI++){
            let imageUrl = product.imagePaths[imageI];
            let response = await axios({
                url: imageUrl,
                responseType: 'stream'
            });

            try{
                await new Promise((accept, reject) => {
                    response.data.pipe(fs.createWriteStream(this.getImagePath(product.sku, imageUrl)))
                    .on("finish", accept)
                    .on("error", reject);
                });
            }catch(e){
                console.log("Error storing image...");
                console.log({e});
            }
        }
    }


    async storeProductInfo(product:Product){
        fs.writeFileSync(this.getDescriptionFilePath(product.sku), product.toText());
    }
}