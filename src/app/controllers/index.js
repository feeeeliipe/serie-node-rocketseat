const fs = require('fs');
const path = require('path');

module.exports = app => {
    fs.readdirSync(__dirname).filter(file => {
        if((file.indexOf('.') !== 0) && (file != 'index.js'))
            return true
        else 
            return false;   
    }).forEach(file => {
        console.log(file);
        require(path.resolve(__dirname, file))
    });
}