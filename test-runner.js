command('jshint app/scripts --config tests/jshint/jshintrc.json', true);
command('testem ci --file tests/jasmine/testem.json', false);

function command(commandString, shouldEnd) {
    var commandArguments = commandString.trim().split(' ');
    var child = require('child_process').spawn(commandArguments.shift(), commandArguments);
    child.stdout.pipe(process.stdout, { end: shouldEnd });
    child.stderr.pipe(process.stderr, { end: shouldEnd });
}