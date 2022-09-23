const fs = require('fs');
const { parse } = require('json2csv');
const data = require('./form-export.example.json');

const main = () => {
  try {
    console.log(data);
  } catch (err) {}
};

main();
