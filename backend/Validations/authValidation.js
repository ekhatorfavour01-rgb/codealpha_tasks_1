const emailRegex = /^\S+@\S+\.\S+$/;

exports.validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400); // 400 = "you made a mistake"
    return next(new Error('Name, email and password are required'));
  }
  if (!emailRegex.test(email)) {
    res.status(400);
    return next(new Error('Please enter a valid email'));
  }
  if (password.length < 6) {
    res.status(400);
    return next(new Error('Password must be at least 6 characters'));
  }
  next(); 
};


exports.validateLogin = (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    res.status(400);
    return next(new Error('Email and password are required'));
  }
  next();
};