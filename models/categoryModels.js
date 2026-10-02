const mongoose = require("mongoose");
const { toImageUrl, toFileName } = require("../utils/imageUrl");

//   create schema

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category required'],
      unique: [true, 'Category must be unique'],
      minlength: [3, 'Too short category name'],
      maxlength: [32, 'Too long category name'],
    },
    nameAr: {
      type: String,
      trim: true,
      maxlength: [32, 'Too long category name'],
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
  doc.image = toImageUrl('categories', doc.image);
};
categorySchema.post('init', setImageUrl);
categorySchema.post('save', setImageUrl);
// store the file name only, never the public URL
categorySchema.pre('save', function (next) {
  this.image = toFileName(this.image);
  next();
});

const CategoryModel = mongoose.model("Category", categorySchema);
module.exports = CategoryModel;
