const mongoose = require("mongoose");
const { toImageUrl, toFileName } = require("../utils/imageUrl");

//   create schema

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'brand required'],
      unique: [true, 'brand must be unique'],
      minlength: [3, 'Too short brand name'],
      maxlength: [32, 'Too long brand name'],
    },
    nameAr: {
      type: String,
      trim: true,
      maxlength: [32, 'Too long brand name'],
    },
    // A and B => shopping.com/a-and-b
    slug: {
      type: String,
      lowercase: true,
    },
    image: String,
  },
  { timestamps: true }
);

const setImageUrl = (doc) => {
  doc.image = toImageUrl('brands', doc.image);
};
brandSchema.post('init', setImageUrl);
brandSchema.post('save', setImageUrl);
brandSchema.pre('save', function (next) {
  this.image = toFileName(this.image);
  next();
});

const brandModel = mongoose.model("Brand", brandSchema);
module.exports = brandModel;
