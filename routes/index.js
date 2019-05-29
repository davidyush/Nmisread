const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ..routes
router.get('/', (req, res) => {
  res.sendFile('index.html');
});

router.post('/api/signin', (req, res) => {
  console.log('req body sign', req.body);
  const { email, name, password } = req.body;
  const user = new User({ email, name: `@${name}` });
  user.setPassword(password);
  user.setConfirmationToken();
  user.save().then(userRecord => {
    res.json({ user: userRecord.toAuthJSON() });
  })
  .catch(err => res.status(400).json({ error: err }));
});

router.post('/api/login', async (req, res) => {
  console.log('req body login', req.body);
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log('user login', user);
    if(user && user.isValidPassword(password)) {
      res.json({ user : user.toAuthJSON() });
    } else {
      res.status(400).json({ error: 'login error' });
    }
  } catch(err) {
    res.status(400).json({ error: err });
  }
});

router.post('/api/auth', (req, res) => {
  jwt.verify(req.body.token, process.env.JWT_SECRET, (err, decoded) => {
    if(err) {
      res.status(401).json({ error: 'token in not valid'});
    } else {
      User.findOne({ email: decoded.email }).then(user => {
        res.json({ user: user.toAuthJSON() });
      });
    }
  });
});


router.post('/api/buycoins', (req, res) => {
  console.log('buy coins body', req.body.tradeInfo);
  jwt.verify(req.body.token, process.env.JWT_SECRET, async (err, decoded) => {
    if(err) {
      res.status(400).json({ error: err });
    } else {
      const user = await User.findOne({ email: decoded.email });
      const error = await user.buyCoins(req.body.tradeInfo);
      if(error) {
        res.status(400).json({ error: { message : error.message } });
      } else {
        const userRecord = await user.save();
        res.status(200).json({ user: userRecord.toAuthJSON(), msg: 'Success' });
      }
    }
  });
});

router.post('/api/sellcoins', (req, res) => {
  console.log('sell coins body', req.body.tradeInfo);
  jwt.verify(req.body.token, process.env.JWT_SECRET, async (err, decoded) => {
    if(err) {
      res.status(400).json({error: err });
    } else {
      const user = await User.findOne({ email: decoded.email });
      const error = await user.sellCoins(req.body.tradeInfo);
      // console.log('error in sellcoins', error);
      if(error) {
        res.status(400).json({ error: { message: error.message } });
      } else {
        const userRecord = await user.save();
        res.status(200).json({ user: userRecord.toAuthJSON(), msg: 'Success' });
      }
    }
  });
});

router.get('/api/users', async (req, res) => {
  console.log('req', req.query);
  const users = await User.find({})
    .select('money name coins')
    .sort({money: -1})
    .skip(Number(req.query.skip))
    .limit(5);

  res.json({ users });
});

router.get('/api/user', async (req, res) => {
  const user = await User.findOne({ name: req.query.name })
    .select('money name coins buyHistory sellHistory');

  if(!user) {
    res.json({ error: { message: 'There is no user with such name'}});
  } else {
    res.json({ user });
  }
});

function getPathOut(folder) {
  let currentPath = __dirname;
  currentPath = currentPath.split('/');
  currentPath.pop();
  currentPath.pop();
  currentPath = currentPath.join('/');
  currentPath = `${currentPath}/${folder}`;
  return currentPath;
}

router.get('*', (req, res) => {
  res.sendFile(getPathOut('build') + "/index.html");
});

module.exports = router;
