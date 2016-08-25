/**
 * this will be the logger method
 */
var fs = require('fs');
var util = require('util');
var path = require('path');
var colors = require('colors');
/**
 * main
 */
module.exports = function(data)
{
    var time = new Date();
    var fileName = [
        [
            time.getTime() ,
            time.getMilliseconds()
        ].join('-'),
        'log'
    ].join('.');

    var logFile = path.join(process.cwd() , 'logs' , fileName);

    fs.writeFile(
        logFile,
        util.inspect(data , false , 2),
        function(err) {
            if (err) {
                console.log(
                    colors.red(
                        'ERROR WRITING TO LOG FILE: ' + logFile
                    )
                );
            }
        }
    );
};
