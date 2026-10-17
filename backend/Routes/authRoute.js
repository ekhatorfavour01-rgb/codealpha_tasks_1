const router = require('express').Router();
const { register, login } = require('../Controllers/authController');
const { validateRegister, validateLogin } = require('../Validations/authValidation');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

module.exports = router;