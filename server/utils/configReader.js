var fs = require('fs')
  , yaml = require('yaml-js')
  , _ = require('underscore')
  ;

function readConfigFileIntoObject(path) {
    console.log('reading yaml ' + path);
    if (! fs.existsSync(path)) {
        console.warn('Config file "' + path + '" does not exist!');
        return;
    }
    var raw = fs.readFileSync(path, 'utf-8');
    var obj;
    try {
        obj = yaml.load(raw);
    } catch(e) {
        console.error(e);
        throw new Error('Config file "' + path + '" is invalid YAML!');
    }
    return obj;
}

function read(configFile) {
    var username = process.env.USER.toLowerCase(),
        configSplit = configFile.split('.'),
        userFile = configSplit.slice(0, configSplit.length - 1).join('.') + '-' + username + '.yaml',
        config = readConfigFileIntoObject(configFile),
        userConfig = null;

    userConfig = readConfigFileIntoObject(userFile);
    _.extend(config, userConfig);
    return config;
}

module.exports.read = read;