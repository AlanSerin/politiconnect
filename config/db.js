const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectdb = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    //asdasd

    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    //EXIT PROCESS WITH FAILURE
    process.exit(1);
  }
};

module.exports = connectdb;
