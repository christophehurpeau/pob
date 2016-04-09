const argv = require('minimist-argv');
const inquirer = require('inquirer');
const execSync = require('child_process').execSync;
const validateSemver = require('semver').valid;
const isSemverValid = version => validateSemver(version) !== null;

Promise.resolve(argv._[0]).then(version => {
    if (version) {
        if (!isSemverValid(version)) {
            throw new Error(`Invalid semver version: ${version}`);
        }

        return version;
    }

    return inquirer.prompt([
        {
            type: 'list',
            name: 'version',
            message: 'npm version:',
            default: 'minor',
            choices: [
                'patch',
                'minor',
                'major',
                'manual',
                'premajor',
                'preminor',
                'prepatch',
                'prerelease',
            ]
        }
    ]).then(answers => {
        const version = answers.version;

        if (version !== 'manual') {
            return version;
        }

        return inquirer.prompt([
            {
                type: 'input',
                name: 'version',
                message: 'version (must follow semver):',
                validate: isSemverValid,
            }
        ]).then(answers => {
            return answers.version;
        });
    });
}).then(version => {
    console.log(execSync('npm version "' + version + '"').toString());
    version = execSync('node -pe "require(\'./package.json\').version"').toString().trim();
    if (!isSemverValid(version)) {
        throw new Error(`Unexpected version: ${version}`);
    }
    console.log(execSync('git push').toString());
    console.log(execSync('git push origin "v' + version + '"').toString());
}).catch(console.log);
