const cloudinary = require('../Config/Cloudinary');

exports.uploadImage = (buffer) => new Promise((resolve, reject) => {

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        return reject(new Error('Cloudary is not configured in .env'));
    }

    const stream = cloudinary.uploader.upload_stream({ folder: 'ecommerce-store' }, (err, result) => err ? reject(err) : resolve(result.secure_url));

    stream.end(buffer);

    });