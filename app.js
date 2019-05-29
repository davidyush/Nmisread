const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const morgan = require('mongoose-morgan');
const path = require('path');

const routes = require('./routes/index');
require('dotenv').config({ path: 'variables.env' });

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

function getPathOut(folder) {
  let currentPath = __dirname;
  currentPath = currentPath.split('/');
  currentPath.pop();
  currentPath = currentPath.join('/');
  currentPath = `${currentPath}/${folder}`;
  console.log('currentPath', currentPath);
  return currentPath;
}

const buildPath = express.static(getPathOut('build'));
app.use(buildPath);

app.use('/', routes);

app.use(morgan({
  connectionString: process.env.MONGO
}));

mongoose.connect(process.env.MONGO, {
	useCreateIndex: true,
	useNewUrlParser: true
});

mongoose.Promise = Promise;

mongoose.connection.on('error', (err) => {
  console.error('(#.#) error!', err.message);
});

app.set('port', process.env.PORT || 4000);
const server = app.listen(app.get('port'), () => {
  console.log(`Misread ~~{^,^}~~ running on port ${server.address().port}`);
});
