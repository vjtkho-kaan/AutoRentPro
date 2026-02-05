const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET routes
router.get('/login', authController.showLogin);
router.get('/register', authController.showRegister);

// POST routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.get('/logout', authController.logout); // Allow GET for logout link

module.exports = router;
