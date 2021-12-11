import { readFile as _readFile } from 'fs';

function readFile(fileName) {
  return new Promise((resolve, reject) => {
    _readFile(fileName, { encoding: 'utf8', flag: 'r' }, (err, data) => {
      if (err) reject(data);
      else resolve(data);
    });
  });
}

export default {
  readFile,
};
