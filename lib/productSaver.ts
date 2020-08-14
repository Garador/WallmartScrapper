import { Product } from "./product";

export abstract class ProductSaver {
    /**
     * 
     * @description Saves a list of products
     */
    abstract async storeProducts(products:Product[]);

    /**
     * 
     * @description Saves the images from a product
     */
    abstract async storeProductImages(product:Product);
    
    /**
     * 
     * @description Stores the basic product information
     */
    abstract async storeProductInfo(product:Product);
}
