/**
 * this will be the logger method
 */
var fs = require('fs');
var util = require('util');
var path = require('path');
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

    fs.writeFile(
        path.join(
            '..' , '..' , 'logs' , fileName
        ),
        util.inspect(data , false , 2) ,
        function(err) {
            if (err) {
                console.log(
                    'ERROR WRITING TO LOG FILE: ' + fileName
                );
            }
        }
    );

};
