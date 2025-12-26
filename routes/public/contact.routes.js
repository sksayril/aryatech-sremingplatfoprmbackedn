const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/public/contact.controller');

// Public contact form submission
router.post('/submit', contactController.submitContact);

module.exports = router;

