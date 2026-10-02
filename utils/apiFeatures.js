const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter() {
    const queryStringObj = { ...this.queryString };
    const excludesFields = ["limit", "page", "field", "fields", "sort", "keyword"];
    excludesFields.forEach((field) => delete queryStringObj[field]);

    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(`${sortBy} _id`);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt _id");
    }

    return this;
  }

  limitFields() {
    const fields = this.queryString.field || this.queryString.fields;
    if (fields) {
      const field = fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(field);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  search(modelName) {
    if (this.queryString.keyword) {
      const regex = { $regex: escapeRegex(String(this.queryString.keyword)), $options: "i" };
      let query = {};
      if (modelName === "products") {
        query.$or = [{ title: regex }, { titleAr: regex }, { description: regex }];
      } else if (modelName === "branches") {
        query.$or = [{ name: regex }, { nameAr: regex }, { city: regex }, { cityAr: regex }, { address: regex }];
      } else {
        query = { $or: [{ name: regex }, { nameAr: regex }] };
      }

      this.mongooseQuery = this.mongooseQuery.find(query);
    }
    return this;
  }

  paginate(countDocuments) {
    const page = Math.max(this.queryString.page * 1 || 1, 1);
    const limit = Math.min(Math.max(this.queryString.limit * 1 || 50, 1), 500);
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    // pagination result
    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.skip = skip;
    pagination.numberOfPage = Math.ceil(countDocuments / limit);
    pagination.totalResults = countDocuments;

    if (endIndex < countDocuments) {
      pagination.next = page + 1;
    }
    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    this.pagination = pagination;
    return this;
  }
}

module.exports = ApiFeatures;
