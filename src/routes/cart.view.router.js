import express from "express";
import { CartModel } from "../DAO/mongo/models/carts.model.js";
import { CartService } from "../services/carts.service.js";
import { logger } from "../utils.js";

const cartService = new CartService();

export const routerViewCart = express.Router();


routerViewCart.get("/:cid", async (req, res) => {
    const cid = req.params.cid 
    const cart = await cartService.getCartById(cid)
    logger.info(cid)
    const products = cart.products.map((product) => {
        return{
        title: product.product.title,
        price: product.product.price,
        quantity: product.quantity
        }
    })
    return res.render('cart', { title: "Cart", products: products, cid: cid });
});