// Shared by the dummy-data scripts: stores pictures exactly like the API upload handlers do.
const fs = require('fs');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require('sharp');
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const white = { r: 255, g: 255, b: 255, alpha: 1 };

// same name prefix + sharp pipeline as the upload handlers in /services
const IMAGE_STYLES = {
  categories: { prefix: 'category', size: 600, quality: 95 },
  brands: { prefix: 'brands', size: 600, quality: 95, contain: true },
  products: { prefix: 'products', size: 1000, quality: 90, contain: true },
  users: { prefix: 'Users', size: 600, quality: 95 },
};

// process an image file into /uploads/<folder> and return the stored file name,
// e.g. Users-<uuid>-<timestamp>.jpeg
const saveImage = async (source, folder, suffix = '') => {
  const { prefix, size, quality, contain } = IMAGE_STYLES[folder];
  const name = `${prefix}-${uuidv4()}-${Date.now()}${suffix}.jpeg`;
  const dest = path.join(UPLOADS_DIR, folder);
  fs.mkdirSync(dest, { recursive: true });
  let image = sharp(source);
  image = contain
    ? image.resize(size, size, { fit: 'contain', background: white }).flatten({ background: '#ffffff' })
    : image.resize(size, size);
  await image.toFormat('jpeg').jpeg({ quality }).toFile(path.join(dest, name));
  return name;
};

// true when the name already looks like an API upload, e.g. Users-<uuid>-<timestamp>.jpeg
const isUploadName = (folder, name) =>
  new RegExp(`^${IMAGE_STYLES[folder].prefix}-[0-9a-f-]{36}-\\d+(-[\\w]+)?\\.jpeg$`).test(name);

module.exports = { UPLOADS_DIR, saveImage, isUploadName };
