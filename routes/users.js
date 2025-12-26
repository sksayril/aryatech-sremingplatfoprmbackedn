// This file is deprecated - use /api/auth routes instead
// Keeping for backward compatibility if needed
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'This endpoint is deprecated. Please use /api/auth/signup instead.',
  });
});

module.exports = router;
