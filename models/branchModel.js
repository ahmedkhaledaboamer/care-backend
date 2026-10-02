const mongoose = require('mongoose');

// Physical store / pharmacy where the products can be found (shown on the map)
const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Branch name required'],
      unique: true,
      maxlength: [60, 'Too long branch name'],
    },
    nameAr: { type: String, trim: true, maxlength: [60, 'Too long branch name'] },
    city: { type: String, trim: true, required: [true, 'Branch city required'] },
    cityAr: { type: String, trim: true },
    address: { type: String, trim: true, required: [true, 'Branch address required'] },
    addressAr: { type: String, trim: true },
    phone: { type: String, trim: true },
    workingHours: { type: String, trim: true },
    location: {
      lat: {
        type: Number,
        required: [true, 'Latitude required'],
        min: [-90, 'Invalid latitude'],
        max: [90, 'Invalid latitude'],
      },
      lng: {
        type: Number,
        required: [true, 'Longitude required'],
        min: [-180, 'Invalid longitude'],
        max: [180, 'Invalid longitude'],
      },
    },
    isMain: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Branch', branchSchema);
