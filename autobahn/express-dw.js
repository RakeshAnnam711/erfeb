#!/usr/bin/env node

const process = require('process')
const yargs = require('yargs');
const {hideBin} = require('yargs/helpers');
const fs = require('fs');
const path = require('path');

const argv = yargs(hideBin(process.argv))
    .usage('\nA CLI tool for transforming/outputting themes json data for autobahn express\n\nUsage: npm run index <command> [options]')
    .scriptName("")
    .command('modifyThemesJSON', 'Read a JSON global preference object and modify its themesJSON with new themes in the form {groupname: "example", instances: { development: { globalPreferenceID: "exampleValue" } }}', {
        config: {
            string: true,
            description: 'path to config json',
            default: 'dw.json'
        },
        stdin: {
            boolean: true,
            description: 'Read JSON OCAPI response object from stdin containing preference group names and values in the form {groupname: "example", instances: { development: { globalPreferenceID: "exampleValue" } }}',
        },
        themesFor: {
            array: true,
            description: 'Specify themes to add, an empty parameter implies "themesAll"',
            default: []
        },
        themesAll: {
            boolean: true,
            description: 'Will add every theme in the themesDirs folders. A true setting overrides "themesFor"'
        },
        themesDirs: {
            array: true,
            description: 'specify themes folder(s) to target, defaults to [data/themes/] if not set',
            default: ['data/themes/']
        }
    })
    .config('config', function (configPath) {
        if (path.extname(configPath) === '.js') {
            return require(configPath);
        } else {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
    })
    .recommendCommands()
    .version()
    .help()
    .argv;

if (!argv._[0]) {
    return yargs.showHelp();
}

if (argv._[0] !== 'modifyThemesJSON') {
    console.error();
    console.error(`Command ${argv[0]} unknown`);
    process.exit(1);
}

function doModification(args, data) {
    console.error('Modifying themesJSON received from stdin based on given parameters');

    if (args.themesAll || args.themesFor.length === 0) {
        let themesFor = [];
        for (const themesDir of args.themesDirs) {
            themesFor.push(fs.readdirSync(path.resolve(themesDir), {withFileTypes: true})
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name));
        }
        args.themesFor = [...new Set([].concat.apply([], themesFor))];
    }

    for (const instance of Object.keys(data.instances)) {
        if (!('themesJSON' in data.instances[instance])) {
            data.instances[instance].themesJSON = '{}';
        }

        let themesJSON = JSON.parse(data.instances[instance].themesJSON);
        if (!('templates' in themesJSON)) {
            themesJSON.templates = [];
        }

        for (const themesDir of args.themesDirs) {
            for (const theme of args.themesFor) {
                const themeJSON = JSON.parse(fs.readFileSync(path.resolve(themesDir, theme, 'theme.json')));
                for (const newTemplate of themeJSON.templates) {
                    let categoryExists = false;
                    for (const template of themesJSON.templates) {
                        //We're moving or replacing whatever was here previously
                        template.items = template.items.filter( item => {
                            for (const newItem of newTemplate.items) {
                                if (item.template === newItem.template) {
                                    return false;
                                }
                            }
                            return true;
                        })

                        if (template.category === newTemplate.category) {
                            for (const newItem of newTemplate.items) {
                                template.items.push(newItem)
                            }
                            categoryExists = true;
                        }
                    }

                    if (!categoryExists) {
                        themesJSON.templates.push(newTemplate);
                    }
                }
            }
        }

        themesJSON.templates = themesJSON.templates.filter(template => {
            return template.items.length > 0;
        });

        data.instances[instance].themesJSON = JSON.stringify(themesJSON);
    }

    console.error();
    console.error('Sending modified themesJSON to stdout');
    console.error();

    return data;
}


process.stdin.setEncoding('utf8');
process.stdin.once('data', data => {
    console.log(JSON.stringify(doModification(argv, JSON.parse(data))));
    process.stdin.destroy();
    process.exit(0);
})


