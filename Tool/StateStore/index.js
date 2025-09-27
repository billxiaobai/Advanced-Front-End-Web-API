const fs = require('fs');
const path = require('path');
// 讀取並匯出目錄下所有 *Store.js（保留原本動態匯出行為）
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('Store.js'));
const stores = {};
files.forEach(f => {
  const name = path.basename(f, '.js');
  stores[name] = require('./' + name);
});

// 同時匯出 StateStore 的高階 API（若存在）
let StateStoreAPI = null;
try { StateStoreAPI = require('./StateStoreAPI'); } catch (e) { StateStoreAPI = null; }

// 共同輸出：將 stores 放在 exports.stores，並提供 StateStore API 在 exports.StateStore
module.exports = Object.assign({}, stores, {
  stores,
  StateStore: StateStoreAPI
});
