const Joi = require('joi');

const userScan = Joi.object({
  qrData: Joi.string().trim().min(1),
  imageData: Joi.string().trim().min(32).max(8 * 1024 * 1024),
}).or('qrData', 'imageData');

module.exports = {
  userScan,
};
