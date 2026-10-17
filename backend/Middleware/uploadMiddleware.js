const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(), // hold it in memory; do not save it on disk
    limits: { fileSize: 3 * 1024 * 1024 }, // the biggest allowed 3 MB

    fileFilter: (req, file, cb) => {
        // Only pictures are allowed in
        if (file.mimetype.startsWith('image/'))
            return cb(null, true);
        cb(new Error('Only image files are allowed'));
    },
});

module.exports = upload;