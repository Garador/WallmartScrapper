interface IProduct {
    imagePaths: string[]
    name: string;
    price: string;
    location: string;
    sku: string;
    /**
     * @description The location for the product
     */
    url: string;
}

export class Product implements IProduct {
    imagePaths: string[]
    name: string;
    price: string;
    location: string;
    sku: string;
    /**
     * @description The location for the product
     */
    url: string;


    toText(){
        return [
            `Name: ${this.name}`,
            `Url: ${this.url}`,
            `Location: ${this.location}`,
            `Price: ${this.price}`,
            `SKU: ${this.sku}`
        ].join("\n");
    }

    static fromJson(jsonData:IProduct[]):Product[]{
        return jsonData.map((productI)=>{
            let product = new Product();
            product.imagePaths = productI.imagePaths;
            product.location = productI.location;
            product.name = productI.name;
            product.price = productI.price;
            product.sku = productI.sku;
            product.url = productI.url;

            return product;
        })
    }
}