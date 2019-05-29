const fetch = require('node-fetch');
const Bluebird = require('bluebird');
const WebSocketW3C = require('websocket').w3cwebsocket;

fetch.Promise = Bluebird;

// too much RAM? ~(-.-)~
class CoinStore {
  constructor() {
    this.coins = {};
  }

  init() {
    return fetch('https://api.coincap.io/v2/assets?limit=2000')
      .then(res => res.json())
      .then(json => {
        let current;
        for(let i = 0; i < json.data.length; i++) {
          current = json.data[i];
          this.coins[current.id] = current.priceUsd;
        }
    });
  }

  initWS() {
    return new Promise((resolve, reject) => {
  		const client = new WebSocketW3C(`wss://ws.coincap.io/prices?assets=ALL`, 'echo-protocol');
  		client.onopen = () => console.log('ws rider is on');
  		client.onclose = (evt) => {
        console.log('ws rider is dead', evt);
        this.initWS();
      }
  		client.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        for(let key in data) {
          this.coins[key] = data[key];
        }
  		}
  		client.onerror = (err) => reject(err);
	  });
  }
}


module.exports = new CoinStore();
