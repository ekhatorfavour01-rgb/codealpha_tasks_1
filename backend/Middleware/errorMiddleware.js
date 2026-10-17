exports.notFound = (req, res, next) => {
    res.status(404);
    next(new Error(`Not found - ${req.originalUrl}`));
};

exports.errorHandler = (err, req, res, next) => {
    let status = res.statusCode && res. statusCode !== 200 ? res.statusCode : 500;
    let message = err.message;


// already existing email
if (err.code === 11000) {
    status = 400;
    message = 'This email is already registered';
}

// wrong id
if (err.name === 'CastError') {
    status = 404;
    message = 'Resource not found';
}

// if a form is filled wrongly
if (err.name === 'ValidateError') status = 400;

res.status(status).json({ message });

};