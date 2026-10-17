const Product = require('../Models/Product');

exports.buildOrderItem = async (cartItems) => {
    const items = [];
    let total = 0;

    for (const entry of cartItems) {

    const product = await Product.findById(entry.productId);
    if (!product) throw new Error('A product in your cart no longer exists');

    const qty = Number(entry.qty);
    if (!Number.isFinite(qty) || qty < 1) throw new Error(`Not enough stock for ${product.name}`);

    items.push({ 
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty
    });

    total += product.price * qty;
}

return { items, total: Math.round(total * 100) / 100 };
};

exports.reduceStock = async (order) => {
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } 
        });
    }
};