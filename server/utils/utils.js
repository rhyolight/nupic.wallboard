var path = require('path')
  , fs = require('fs')
  ;

/**
 * Reads all the JavaScript files within a directory, assuming they are all 
 * proper node.js modules, and loads them. 
 * @return {Array} Modules loaded.
 */
function initializeModulesWithin(dir, exclusions) {
    var output = {}
      , fullDir = path.join(__dirname, '..', '..', dir)
      , requirePath = '../' + fullDir.split('server/').pop() + '/'
      ;
    fs.readdirSync(fullDir).forEach(function(fileName) {
        var moduleName = fileName.split('.').shift()
          , excluded = false;
        if (exclusions != undefined && exclusions.indexOf(moduleName) > -1) {
            excluded = true;
        }
        if(! excluded && 
                fileName.charAt(0) != "." 
                && fileName.substr(fileName.length - 3) == ".js")   {
            output[moduleName] = require(requirePath + moduleName);
        }
    });
    return output;
}

module.exports = {
    initializeModulesWithin: initializeModulesWithin
};