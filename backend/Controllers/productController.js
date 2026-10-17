const Product = require('../Models/Product');
const asyncHandler = require('../Utils/asyncHandler');
const { uploadImage } = require('../Services/imageService');

exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  const filter = {};
  if (search) {
    const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    filter.$or = [{ name: rx }, { brand: rx }];
  }
  if (category && category !== 'all') filter.category = category;
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

exports.getCategories = asyncHandler(async (req, res) => {
  res.json(await Product.distinct('category'));
});

exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

exports.createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = await uploadImage(req.file.buffer);
  res.status(201).json(await Product.create(data));
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = await uploadImage(req.file.buffer);
  const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ message: 'Product deleted' });
});