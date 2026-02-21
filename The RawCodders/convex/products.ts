import { v } from "convex/values";
import { query, mutation } from "./_generated/server";


export const insertProduct = mutation({
    args: {
        product: v.object({
            name: v.string(),
            price: v.float64(),
            stock: v.number(),
            image: v.string()
        })
    },

    handler: async (ctx, args) => {
        const productId = ctx.db.insert('products', args.product)
        return productId
    },
})


export const updateProductStock = mutation({

    args: {
        productId: v.id('products'),
        amountChange: v.number()
    },

    handler: async (ctx, args) => {

        const { productId } = args;
    

        const product = await ctx.db.get(args.productId)

        if (!product) {
            throw new Error("Product Not Found")
        }

        const newStock = product.stock + args.amountChange

        await ctx.db.patch(productId, { stock: newStock });
        

        return productId

    },
})


export const listProducts = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query('products').collect()
    },
})

export const getProduct = query({

    args: {
        productId: v.id('products'),
    },

    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId)
        return product
    },

})