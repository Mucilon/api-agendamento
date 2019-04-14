const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('database.json');
const database = low(adapter);

database.defaults({ 

    days: [],
    daily: {},
    week:[]
     
}).write();


module.exports = database;