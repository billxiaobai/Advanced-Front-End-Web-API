const fs = require('fs');
const path = require('path');
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('Store.js'));
const stores = {};
files.forEach(f => {
  const name = path.basename(f, '.js');
  stores[name] = require('./' + name);
});
module.exports = stores;
