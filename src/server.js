import express from "express";
import handlebars from "express-handlebars";
import {
    ProductManager
} from "./DAO/productManager.js";
import {
    routerProducts
} from "./routes/products.router.js";
import {
    routerViewProducts
} from "./routes/products.view.router.js";
import {
    routerViewCart
} from "./routes/cart.view.router.js";
import {
    routerCarts
} from "./routes/cart.router.js";
import { routerUsers } from "./routes/users.router.js";
import {
    routerLogin
} from "./routes/login.router.js";
import {
    routerViews
} from "./routes/views.router.js";
import {
    __dirname,
    connectMongo
} from "./utils.js";
import {
    Server
} from "socket.io";
import session from 'express-session';
import MongoStore from 'connect-mongo';
import {
    iniPassport
} from "./config/passport.config.js";
import passport from 'passport';
import {
    enviroment
} from "./utils.js";
import {
    generateMockProducts
} from "./utils.js";
import errorHandler from "./middlewares/error.js";
import {
    logger
} from "./utils.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUiExpress from "swagger-ui-express";
const app = express();
const port = enviroment.PORT;



connectMongo();

const productManager = new ProductManager();

const httpServer = app.listen(port, () => {
    logger.info(`Server running on port http://localhost:${port}`);
});
const socketServer = new Server(httpServer)


app.use(express.json())
app.use(express.urlencoded({
    extended: true
}));

app.use(
    session({
        store: MongoStore.create({
            mongoUrl: 'mongodb+srv://diegobustamante:coder2023@bustamantedb.2llatvf.mongodb.net/?retryWrites=true&w=majority',
            ttl: 86400 * 7 
        }),
        secret: 'un-re-secreto',
        resave: true,
        saveUninitialized: true,
    })
);


app.engine("handlebars", handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

iniPassport();
app.use(passport.initialize());
app.use(passport.session());

const swaggerOptions = {

    definition: {

        openapi: "3.0.1",

        info: {

            title: "Ecomerce documentation",

            description: "Backend e-commerce project",

        },

    },

    apis: [`${__dirname}/docs/**/*.yaml`],

};



const specs = swaggerJSDoc(swaggerOptions);

app.use("/apidocs", swaggerUiExpress.serve, swaggerUiExpress.setup(specs));

app.use("/api/products", routerProducts);
app.use("/api/carts", routerCarts);
app.use('/api/sessions', routerLogin);
app.use('/api/users', routerUsers);

app.use("/view/products", routerViewProducts)
app.use("/view/cart", routerViewCart)


app.use(express.static(__dirname + "/public"));

app.use("/", routerViews)

app.get("/mockingproducts", (req, res) => {
    const products = generateMockProducts(100);
    res.json(products);
});

app.get("/loggerTest", (req, res) => {
    logger.debug("this is a debug level log")
    logger.verbose("this is a debug level verbose")
    logger.http("this is a debug level http")
    logger.info("this is a debug level info")
    logger.warn("this is a debug level warn")
    logger.error("this is a debug level error")
})



app.get("*", (req, res) => {
    res.status(404).send({
        status: "error",
        data: "Page not found",
    });
});



app.use(errorHandler);

socketServer.on("connection", (socket) => {
    logger.info(`New Connection: ${socket.id}`);
    socket.on("new-product", async (newProduct) => {
        try {
            await productManager.addProduct(newProduct);
            const productsList = await productManager.getProducts();
            socketServer.emit("products", {
                productsList
            });
        } catch (error) {
            logger.info(error);
        }
    });
    socket.on("id-to-delete", async (id) => {
        try {
            logger.info("el id es " + id)
            await productManager.deleteProduct(id);
            const productsListDeleted = await productManager.getProducts();
            socketServer.emit("products-deleted", {
                productsListDeleted
            });
        } catch (error) {
            logger.info(error);
        }
    });
});