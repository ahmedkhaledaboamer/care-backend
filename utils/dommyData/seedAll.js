// Seed dummy data for every model from dummyData.json, using pictures from /images.
// node utils/dommyData/seedAll.js -i   => (re)insert dummy data
// node utils/dommyData/seedAll.js -d   => remove dummy data only
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const slugify = require('slugify');
// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require('sharp');
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require('uuid');
require('colors');

const ROOT = path.join(__dirname, '../..');
dotenv.config({ path: path.join(ROOT, 'config.env') });

const Category = require('../../models/categoryModels');
const SubCategory = require('../../models/subCategoryModels');
const Brand = require('../../models/brandModels');
const Product = require('../../models/productsModels');
const User = require('../../models/userModels');
const Review = require('../../models/reviewModels');
const Coupon = require('../../models/couponModel');
const Cart = require('../../models/cartModel');
const Order = require('../../models/orderModel');
const Branch = require('../../models/branchModel');
const { toFileName } = require('../imageUrl');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'dummyData.json')));

const IMAGES_DIR = path.join(ROOT, 'images');
const UPLOADS_DIR = path.join(ROOT, 'uploads');

const white = { r: 255, g: 255, b: 255, alpha: 1 };

// same name prefix + sharp pipeline as the upload handlers in /services
const IMAGE_STYLES = {
  categories: { prefix: 'category', size: 600, quality: 95 },
  brands: { prefix: 'brands', size: 600, quality: 95, contain: true },
  products: { prefix: 'products', size: 1000, quality: 90, contain: true },
  users: { prefix: 'Users', size: 600, quality: 95 },
};

// process image from /images into /uploads/<folder> exactly like an API upload
// and return the stored file name, e.g. Users-<uuid>-<timestamp>.jpeg
const saveImage = async (file, folder, suffix = '') => {
  const { prefix, size, quality, contain } = IMAGE_STYLES[folder];
  const name = `${prefix}-${uuidv4()}-${Date.now()}${suffix}.jpeg`;
  const dest = path.join(UPLOADS_DIR, folder);
  fs.mkdirSync(dest, { recursive: true });
  let image = sharp(path.join(IMAGES_DIR, file));
  image = contain
    ? image.resize(size, size, { fit: 'contain', background: white }).flatten({ background: '#ffffff' })
    : image.resize(size, size);
  await image.toFormat('jpeg').jpeg({ quality }).toFile(path.join(dest, name));
  return name;
};

// delete stored images of old dummy data so re-running the seed does not pile up files
const removeImages = (folder, names) => {
  names.filter(Boolean).forEach((value) => {
    const target = path.join(UPLOADS_DIR, folder, toFileName(value));
    if (fs.existsSync(target)) fs.unlinkSync(target);
  });
};

const slug = (s) => slugify(s, { lower: true, strict: true });

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Generates a square brand logo (images/brands/<slug>.png) when it does not exist yet
const ensureBrandLogo = async (brand) => {
  const file = `brands/${slug(brand.name)}.png`;
  const target = path.join(IMAGES_DIR, file);
  if (fs.existsSync(target)) return file;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${brand.color}" stop-opacity="0.95"/>
        <stop offset="1" stop-color="${brand.color}" stop-opacity="0.7"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="#ffffff"/>
    <circle cx="300" cy="245" r="150" fill="url(#g)"/>
    <circle cx="300" cy="245" r="132" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="4"/>
    <text x="300" y="245" dy="0.35em" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
      font-size="120" font-weight="700" fill="#ffffff" letter-spacing="4">${escapeXml(brand.initials)}</text>
    <text x="300" y="490" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
      font-size="54" font-weight="700" fill="#2b2b2b">${escapeXml(brand.name)}</text>
    <rect x="230" y="520" width="140" height="5" rx="2.5" fill="${brand.color}"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(target);
  return file;
};

const destroyData = async () => {
  const users = await User.find({ email: { $in: data.users.map((u) => u.email) } })
    .select('_id profileImg')
    .lean();
  const userIds = users.map((u) => u._id);
  const products = await Product.find({ title: { $in: data.products.map((p) => p.title) } })
    .select('_id imageCover images')
    .lean();
  const productIds = products.map((p) => p._id);
  const brands = await Brand.find({ name: { $in: data.brands.map((b) => b.name) } }).select('image').lean();
  const categories = await Category.find({ name: { $in: data.categories.map((c) => c.name) } })
    .select('image')
    .lean();

  removeImages('users', users.map((u) => u.profileImg));
  removeImages('products', products.flatMap((p) => [p.imageCover, ...(p.images || [])]));
  removeImages('brands', brands.map((b) => b.image));
  removeImages('categories', categories.map((c) => c.image));

  await Order.deleteMany({ user: { $in: userIds } });
  await Cart.deleteMany({ user: { $in: userIds } });
  await Review.deleteMany({ $or: [{ user: { $in: userIds } }, { product: { $in: productIds } }] });
  await Coupon.deleteMany({ name: { $in: data.coupons.map((c) => c.name) } });
  await Product.deleteMany({ _id: { $in: productIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await SubCategory.deleteMany({ name: { $in: data.subCategories.map((s) => s.name) } });
  await Brand.deleteMany({ name: { $in: data.brands.map((b) => b.name) } });
  await Category.deleteMany({ name: { $in: data.categories.map((c) => c.name) } });
  await Branch.deleteMany({ name: { $in: data.branches.map((b) => b.name) } });
};

const insertData = async () => {
  // remove old dummy data first so the script can be re-run safely
  await destroyData();

  // Categories
  const categories = await Category.insertMany(
    await Promise.all(
      data.categories.map(async (c) => ({
        name: c.name,
        nameAr: c.nameAr,
        slug: slug(c.name),
        image: await saveImage(c.image, 'categories'),
      }))
    )
  );
  const categoryId = (name) => categories.find((c) => c.name === name)._id;
  console.log(`Categories: ${categories.length}`.cyan);

  // SubCategories
  const subCategories = await SubCategory.insertMany(
    data.subCategories.map((s) => ({
      name: s.name,
      nameAr: s.nameAr,
      slug: slug(s.name),
      category: categoryId(s.category),
    }))
  );
  const subId = (name) => subCategories.find((s) => s.name === name)._id;
  console.log(`SubCategories: ${subCategories.length}`.cyan);

  // Brands (logos are generated once into images/brands)
  const brandDocs = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const b of data.brands) {
    // eslint-disable-next-line no-await-in-loop
    const logo = await ensureBrandLogo(b);
    brandDocs.push({ name: b.name, nameAr: b.nameAr, slug: slug(b.name), image: await saveImage(logo, 'brands') });
  }
  const brands = await Brand.insertMany(brandDocs);
  const brandId = (name) => brands.find((b) => b.name === name)._id;
  console.log(`Brands: ${brands.length}`.cyan);

  // Products
  const products = await Product.insertMany(
    await Promise.all(data.products.map(async (p) => ({
      title: p.title,
      titleAr: p.titleAr,
      slug: slug(p.title),
      description: p.description,
      descriptionAr: p.descriptionAr,
      benefits: p.benefits,
      ingredients: p.ingredients,
      directions: p.directions,
      sizes: p.sizes,
      featured: p.featured,
      quantity: p.quantity,
      sold: p.sold,
      price: p.price,
      priceAfterDiscount: p.priceAfterDiscount,
      colors: p.colors,
      imageCover: await saveImage(p.cover, 'products', '-cover'),
      images: await Promise.all(p.images.map((img, index) => saveImage(img, 'products', `-${index + 1}`))),
      category: categoryId(p.category),
      subcategories: [subId(p.sub)],
      brand: brandId(p.brand),
    })))
  );
  console.log(`Products: ${products.length}`.cyan);

  // Users (create => password gets hashed by pre save hook)
  const addressOf = (u, i) => ({
    details: `${i + 1} Main Street`,
    phone: `0100000000${i}`,
    city: u.city,
    postalCode: `1${i}000`,
  });
  const users = await User.create(
    await Promise.all(data.users.map(async (u, i) => ({
      name: u.name,
      email: u.email,
      role: u.role,
      slug: slug(u.name),
      password: data.userPassword,
      phone: `0100000000${i}`,
      profileImg: await saveImage(u.image, 'users'),
      wishlist: [products[i % products.length]._id, products[(i + 7) % products.length]._id],
      addresses: [{ id: new mongoose.Types.ObjectId(), alias: 'home', ...addressOf(u, i) }],
    })))
  );
  const shoppers = users.filter((u) => u.role === 'user');
  console.log(`Users: ${users.length}`.cyan);

  // Reviews: two different shoppers per product (create => recalculates product ratings)
  let reviewCount = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const [i, product] of products.entries()) {
    // eslint-disable-next-line no-restricted-syntax
    for (const k of [0, 1]) {
      const r = data.reviews[(i * 2 + k) % data.reviews.length];
      // eslint-disable-next-line no-await-in-loop
      await Review.create({
        title: r.title,
        ratings: r.ratings,
        user: shoppers[(i + k * 3) % shoppers.length]._id,
        product: product._id,
      });
      reviewCount += 1;
    }
  }
  console.log(`Reviews: ${reviewCount}`.cyan);

  // Coupons
  const coupons = await Coupon.insertMany(
    data.coupons.map((c, i) => ({
      name: c.name,
      discount: c.discount,
      expire: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
    }))
  );
  console.log(`Coupons: ${coupons.length}`.cyan);

  // Carts + Orders (one each per user)
  const priceOf = (p) => p.priceAfterDiscount || p.price;
  const buildItems = (i) => {
    const a = i % products.length;
    const b = (i + 3) % products.length;
    return [
      { product: products[a]._id, quantity: 1, price: priceOf(data.products[a]) },
      { product: products[b]._id, quantity: 2, price: priceOf(data.products[b]) },
    ];
  };
  const total = (items) => items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const carts = await Cart.insertMany(
    users.map((u, i) => {
      const cartItems = buildItems(i);
      return { user: u._id, cartItems, totalCartPrice: total(cartItems) };
    })
  );
  console.log(`Carts: ${carts.length}`.cyan);

  const orders = await Order.insertMany(
    users.map((u, i) => {
      const cartItems = buildItems(i + 5);
      const shippingPrice = 0;
      const isPaid = i % 2 === 0;
      const isDelivered = i % 3 === 0;
      return {
        user: u._id,
        cartItems,
        taxPrice: 0,
        shippingPrice,
        totalOrderPrice: total(cartItems) + shippingPrice,
        paymentMethodType: isPaid ? 'card' : 'cash',
        isPaid,
        paidAt: isPaid ? new Date() : undefined,
        isDelivered,
        deliveredAt: isDelivered ? new Date() : undefined,
        shippingAddress: addressOf(data.users[i], i),
      };
    })
  );
  console.log(`Orders: ${orders.length}`.cyan);

  // Branches (store locator map)
  const branches = await Branch.insertMany(
    data.branches.map(({ lat, lng, ...b }) => ({ ...b, location: { lat, lng } }))
  );
  console.log(`Branches: ${branches.length}`.cyan);
};

const run = async () => {
  const flag = process.argv[2];
  if (!['-i', '-d'].includes(flag)) {
    console.log('Usage: node utils/dommyData/seedAll.js -i | -d');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Database Connected'.green);
    if (flag === '-i') {
      await insertData();
      console.log('Dummy Data Inserted'.green.inverse);
      console.log(`Login: ${data.users[0].email} / ${data.userPassword}`.yellow);
    } else {
      await destroyData();
      console.log('Dummy Data Destroyed'.red.inverse);
    }
  } catch (error) {
    console.log(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
