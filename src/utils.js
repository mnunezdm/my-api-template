const fs = require('fs');

function readFile(fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, { encoding: 'utf8', flag: 'r' }, (err, data) => {
      if (err) reject(data);
      else resolve(data);
    });
  });
}

module.exports = {
  readFile,
};
