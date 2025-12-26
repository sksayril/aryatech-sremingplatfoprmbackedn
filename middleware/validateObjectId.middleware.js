const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || id === 'null' || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} provided`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }

    next();
  };
};

module.exports = validateObjectId;

