const categoryRoute = require("./categoryRoutes");
const subCategoryRoute = require("./subCategoryRoute");
const brandRoutes = require("./brandRoutes");
const productRoutes = require("./productRoutes");
const userRoutes = require("./userRoute");
const authRoutes = require("./authRoute");
const reviewRoute = require('./reviewRoute');
const wishlistRoute = require('./wishListRoute');
const addressRoute = require('./addressRoute');
const couponRoute = require('./couponRoute');
const cartRoute = require('./cartRoute');
const orderRoute = require('./orderRoute');
const branchRoute = require('./branchRoute');

  const couponRoutes= (app) => { 
    app.use("/api/v1/categories", categoryRoute);
    app.use("/api/v1/subcategories", subCategoryRoute);
    app.use("/api/v1/brands", brandRoutes);
    app.use("/api/v1/products", productRoutes);
    app.use("/api/v1/users", userRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/reviews", reviewRoute);
    app.use("/api/v1/wishlist", wishlistRoute);
    app.use("/api/v1/address", addressRoute);
    app.use("/api/v1/coupon", couponRoute);
    app.use('/api/v1/cart', cartRoute);
    app.use('/api/v1/orders', orderRoute);
    app.use('/api/v1/branches', branchRoute);

 
  }

  module.exports = couponRoutes;