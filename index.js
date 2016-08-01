const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({ pkg }).notify();

const yeoman = require('yeoman-environment');
const env = yeoman.createEnv();

process.on('uncaughtException', function(err) {
    console.log('uncaughtException', err.stack || err.message || err);
});

env.registerStub(require('./generators/pob'), 'pob:generator');

const options = {};

const generator = env.run('pob:generator', options, function(err) {
    if (err) {
        console.log(err.stack || err.message || err);
        return;
    }
    console.log('done !');
});


env.on('error', err => {
    console.log(err.stack || err.message || err);
});

generator.on('error', err => {
    console.log(err.stack || err.message || err);
});
