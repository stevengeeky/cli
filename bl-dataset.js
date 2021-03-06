#!/usr/bin/env node

const commander = require('commander');

commander
    .command('query', 'query the list of all datasets')
    .command('download', 'download a dataset with the given id')
    .command('upload', 'upload a dataset');

if (commander.parse(process.argv)) {
    commander.help();
}