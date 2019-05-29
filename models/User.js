const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const uniqueValidator = require('mongoose-unique-validator');

const store = require('../store');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  confirmed: {
    type: Boolean,
    default: false
  },
  money: {
    type: Number,
    required: true,
    default: 5000
  },
  buyHistory: [{
    date: {
      type: Number,
      default: Date.now()
    },
    amount: Number,
    price: Number,
    id: String,
    symbol: String
  }],
  sellHistory: [{
    date: {
      type: Number,
      default: Date.now()
    },
    amount: Number,
    price: Number,
    id: String,
    symbol: String
  }],
  coins: [{
    symbol: String,
    id: String,
    count: Number
  }]
});

store.init().then(() => store.initWS());

//trade
userSchema.methods.buyCoins = function buyCoins(tradeInfo) {
  const { id, symbol } = tradeInfo;
  const count = Number(tradeInfo.count);
  const price = store.coins[id];
  const totalPrice = price * count;

  if(totalPrice > this.money) {
    console.log('not enoth money to buy');
    return { message : 'You have not enough money' };
  }

  this.money = this.money - totalPrice;

  for(let i = 0; i < this.coins.length; i++) {
    if(this.coins[i].id === id) {
      this.coins[i].count += count;
      this.buyHistory.push({
        date: Date.now(),
        amount: count,
        symbol,
        price,
        id
      });
      return;
    }
  }

  this.coins.push({
    symbol,
    count,
    id
  });

  this.buyHistory.push({
    date: Date.now(),
    amount: count,
    symbol,
    price,
    id
  });

  return;
}

userSchema.methods.sellCoins = function sellCoins(tradeInfo) {
  const { id, symbol } = tradeInfo;
  let count = Number(tradeInfo.count);
  const price = store.coins[id];

  if(count <= 0) {
    return { message: 'Cant sell nothing' };
  }

  for(let i = 0; i < this.coins.length; i++) {
    if(this.coins[i].id === id) {
      if(count > this.coins[i].count) {
        count = this.coins[i].count;
      }

      this.money = this.money + count * price;
      this.coins[i].count = this.coins[i].count - count;
      if(this.coins[i].count === 0) {
        this.coins.splice(i, 1);
      }

      this.sellHistory.push({
        date: Date.now(),
        amount: count,
        symbol,
        price,
        id
      });
    }
  }

  return;
}

//auth etc
userSchema.methods.isValidPassword = function isValidPassword(password) {
  return bcrypt.compareSync(password, this.passwordHash);
}

userSchema.methods.setPassword = function setPassword(password) {
  this.passwordHash = bcrypt.hashSync(password, 10);
}

userSchema.methods.setConfirmationToken = function setConfirmationToken() {
  this.confirmationToken = this.generateJWT();
}

userSchema.methods.generateJWT = function generateJWT() {
  return jwt.sign({
      name: this.name,
      email: this.email,
    },
    process.env.JWT_SECRET
  );
}

userSchema.methods.toAuthJSON = function toAuthJSON() {
  return {
    name: this.name,
    email: this.email,
    confirmed: this.confirmed,
    money: this.money,
    buyHistory: this.buyHistory.reverse(),
    sellHistory: this.sellHistory.reverse(),
    coins: this.coins,
    token: this.generateJWT()
  }
}



userSchema.plugin(uniqueValidator, { message: 'This name or email is already taken' });

module.exports = mongoose.model('User', userSchema);
