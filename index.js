const path= require('path')
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
// eslint-disable-next-line import/no-extraneous-dependencies
const cors = require('cors');
// eslint-disable-next-line import/no-extraneous-dependencies
const compression = require('compression');

dotenv.config({ path: "config.env" });
const dbConnection = require("./config/database");

const couponRoutes=require("./routes")
 


const ApiError = require("./utils/apiError");
const globalError = require("./middleWares/globalError");
const { webhookCheckout } = require('./services/orderService');

// connect with db
dbConnection();

//  express app
const app = express();

// Enable other domains to access your application
app.use(cors());
app.options('*', cors());

// compress all responses
app.use(compression());

// Checkout webhook
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);
//  middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname,'uploads')))

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode : ${process.env.NODE_ENV}`);
}

// mount routes
// app.get('/test', (req,res) =>{
//   res.send('Hello World!');
// })
couponRoutes(app); 
// create error and send it to handling error
app.all("*", (req, res, next) => {
  // const err = new Error(`can't find this route ${req.originalUrl}`);
  // next(err.message);
  next(new ApiError(`can't find this route ${req.originalUrl}`, 400));
});

//  Global error handling middleware
app.use(globalError);
// listen
const PORT = process.env.PORT || 8000;

const sever = app.listen(PORT, () => {
  console.log(`app running on port ${PORT}`);
});
// Handle Errors Rejections Outside Express
process.on("unhandledRejection", (err) => {
  console.log(`unhandledRejection error ${err.name} ${err.message}`);
  sever.close(() => {
    console.log("server shutting down");
    process.exit(1);
  });
});
