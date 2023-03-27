const { check, validationResult } = require('express-validator');

const validateCity = [
    check('city').isString().trim().matches(/^[a-zA-Z\s]+$/),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid city name' });
      }
      next();
    },
  ];

  module.exports= {validateCity}