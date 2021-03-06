#!/usr/bin/env node

const config = require('./config');
const commander = require('commander');
const util = require('./util');

commander
    .option('-i, --id <id>', 'filter profiles by id')
    .option('-q, --query <query>', 'filter profiles by username, full name, or email address')
    .option('-j, --json', 'output data in json format')
    .option('-h, --h')
    .parse(process.argv);

util.loadJwt().then(jwt => {
    if (commander.h) commander.help();
    let headers = { "Authorization": "Bearer " + jwt };
    let datatypeTable = {};
    
    util.queryProfiles(headers, {
        id: commander.id,
        search: commander.query
    }).then(profiles=>{
        if (commander.json) console.log(JSON.stringify(profiles));
        else console.log(formatProfiles(headers, profiles, { all: true }));
    }).catch(err=>{
        console.error(err);
    });
});

function formatProfiles(headers, data, whatToShow) {
    data = data.sort((a, b) => a.id > b.id);
    let resultArray = data.map(profile => {
        let info = [];
        if (whatToShow.all || whatToShow.id) info.push("Id: " + profile.id);
        if (whatToShow.all || whatToShow.username) info.push("Username: " + profile.username);
        if (whatToShow.all || whatToShow.fullname) info.push("Full Name: " + profile.fullname);
        if (whatToShow.all || whatToShow.email) info.push("Email: " + profile.email);
        if (whatToShow.all || whatToShow.active) info.push("Active: " + profile.active);
        return info.join('\n');
    });
    resultArray.push("(Returned " + data.length + " " + util.pluralize("result", data) + ")");
    return resultArray.join('\n\n');
}
