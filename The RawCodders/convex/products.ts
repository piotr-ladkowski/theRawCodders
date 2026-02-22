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
        if (args.product.stock < 0) {
            throw new Error("Initial stock cannot be less than 0");
        }

        const productId = await ctx.db.insert('products', args.product)
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

        if (newStock < 0) {
            throw new Error(`Insufficient stock. Cannot reduce stock by ${Math.abs(args.amountChange)}. Only ${product.stock} left.`);
        }

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

export const deleteProduct = mutation({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.productId);
    },
});
