// Converts stored pictures that are not in the API upload format (e.g. seed-woman.png)
// into it (e.g. Users-<uuid>-<timestamp>.jpeg) and updates the database to match.
// Other data is left untouched; images already in the right format are skipped.
// node utils/dommyData/renameImages.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
require('colors');

const ROOT = path.join(__dirname, '../..');
dotenv.config({ path: path.join(ROOT, 'config.env') });

const Category = require('../../models/categoryModels');
const Brand = require('../../models/brandModels');
const Product = require('../../models/productsModels');
const User = require('../../models/userModels');
const { toFileName } = require('../imageUrl');
const { UPLOADS_DIR, saveImage, isUploadName } = require('./seedImages');

const IMAGES_DIR = path.join(ROOT, 'images');

// where to look for the original picture: /uploads first, then the seed pictures in /images
const findSource = (folder, name) =>
  [
    path.join(UPLOADS_DIR, folder, name),
    path.join(IMAGES_DIR, name.replace(/^seed-/, '')),
    path.join(IMAGES_DIR, 'brands', name.replace(/^seed-/, '')),
  ].find((p) => fs.existsSync(p));

const stats = { converted: 0, skipped: 0, missing: 0 };

// returns the new file name, or the old value when it cannot / need not be converted
const convert = async (folder, value, suffix) => {
  if (!value) return value;
  const name = toFileName(value);
  if (isUploadName(folder, name)) {
    stats.skipped += 1;
    return name;
  }
  const source = findSource(folder, name);
  if (!source) {
    stats.missing += 1;
    console.log(`missing file: ${folder}/${name}`.yellow);
    return value;
  }
  stats.converted += 1;
  return saveImage(source, folder, suffix);
};

// fields: { field: suffix } — array fields get -1, -2 … like the product upload handler
const migrate = async (Model, folder, fields) => {
  // raw collection: no find/init hooks, so we read and write plain file names
  const docs = await Model.collection.find({}).toArray();
  // eslint-disable-next-line no-restricted-syntax
  for (const doc of docs) {
    const update = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const [field, suffix] of Object.entries(fields)) {
      const value = doc[field];
      if (Array.isArray(value)) {
        // eslint-disable-next-line no-await-in-loop
        update[field] = await Promise.all(value.map((v, i) => convert(folder, v, `-${i + 1}`)));
      } else if (value) {
        // eslint-disable-next-line no-await-in-loop
        update[field] = await convert(folder, value, suffix);
      }
    }
    const changed = Object.keys(update).some((k) => JSON.stringify(update[k]) !== JSON.stringify(doc[k]));
    // eslint-disable-next-line no-await-in-loop
    if (changed) await Model.collection.updateOne({ _id: doc._id }, { $set: update });
  }
  console.log(`${folder}: ${docs.length} documents checked`.cyan);
};

const run = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Database Connected'.green);
    await migrate(Category, 'categories', { image: '' });
    await migrate(Brand, 'brands', { image: '' });
    await migrate(Product, 'products', { imageCover: '-cover', images: '' });
    await migrate(User, 'users', { profileImg: '' });
    console.log(
      `Converted: ${stats.converted}, already ok: ${stats.skipped}, missing: ${stats.missing}`.green.inverse
    );
  } catch (error) {
    console.log(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
