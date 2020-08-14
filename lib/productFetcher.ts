import { Product } from "./product";

export abstract class ProductFetcher {
    /**
     * @description Gets the particular details from a particular product
     */
    abstract async _fetchProduct(...data:any):Promise<Product>;

    /**
     * @description Lists the products from the current products page.
     */
    abstract async _listProducts(...data:any): Promise<Product[]>;

    /**
     * @description Searches products and returns them
     */
    abstract async searchProducts(): Promise<Product[]>;
}