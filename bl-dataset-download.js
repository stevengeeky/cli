#!/usr/bin/env node

const request = require('request');
const config = require('./config');
const fs = require('fs');
const tar = require('tar');
const commander = require('commander');
const util = require('./util');
const terminalOverwrite = require('terminal-overwrite');
const size = require('window-size');

commander
    .option('-i, --id <id>', 'download a dataset with the given id')
    .option('-d, --directory <directory>', 'directory to stream the downloaded dataset to')
    .option('-j, --json', 'output info about downloaded dataset in json format')
    .option('-h, --h')
    .parse(process.argv);

util.loadJwt().then(jwt => {
    if (commander.h) commander.help();
    let headers = { "Authorization": "Bearer " + jwt };
    if (commander.args.length > 0 && util.isValidObjectId(commander.args[0])) {
        commander.id = commander.id || commander.args[0];
        commander.args = commander.args.slice(1);
    }
    if (commander.args.length > 0) commander.directory = commander.directory || commander.args[0];
    downloadDataset(headers, commander.id, commander.directory, commander.json);
});

function downloadDataset(headers, id, dir, json) {
    util.queryDatasets(headers, { id })
    .then(datasets => {
        if (datasets.length != 1) throw new Error('invalid dataset id given');
        
        let id = datasets[0]._id;
        let contentLength = Infinity, loaded = 0;
        dir = dir || datasets[0]._id;
        
        if (!json) console.log("Streaming dataset to " + dir);
        showProgress(0);

        fs.mkdir(dir, err => {
            request.get({ url: config.api.warehouse + "/dataset/download/" + id, headers })
            .on('response', res => {
                if(res.statusCode != 200) throw new Error(res.body.message);
                contentLength = res.headers['content-length'];
            })
            .on('data', chunk => {
                loaded += chunk.length;
                
                showProgress(loaded / contentLength);
            })
            .on('end', () => {
                if (process.stdout.isTTY) terminalOverwrite.done();
                if (!json) console.log("Done!");
            }).pipe(tar.x({ C: dir }));
        });
        
        function showProgress(percentage) {
            let progressBar = '', progressBarLength = size.width - 12;
            for (let i = 0; i < progressBarLength; i++) {
                if (i / progressBarLength > percentage) progressBar += ' ';
                else progressBar += '=';
            }
            if (process.stdout.isTTY && !json) {
                // percentage can be NaN if no
                // contentLength is provided from the server
                if (!percentage) {
                    terminalOverwrite('(download progress unknown)');
                } else {
                    terminalOverwrite(Math.round(percentage*100) + '% done [' + progressBar + ']');
                }
            }
        }
    });
}
