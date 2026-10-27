const mongoose = require('mongoose');

// The response is sent by the controller only after this promise commits.
module.exports = function transaction(work) {
  return mongoose.connection.transaction(work, { writeConcern: { w: 'majority' } });
};
