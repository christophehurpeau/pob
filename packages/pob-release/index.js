const readFileSync = require('fs').readFileSync;
const argv = require('minimist-argv');
const inquirer = require('inquirer');
const execSync = require('child_process').execSync;
const validateSemver = require('semver').valid;
const isSemverValid = version => validateSemver(version) !== null;

/*execSync('[[ -z $(git status --porcelain) ]] || (echo "Git working directory not clean."; exit 1)', { stdio: 'inherit' });
execSync('[[ -z $(git symbolic-ref HEAD) ]] || (echo "Git working directory not clean."; exit 1)', { stdio: 'inherit' });*/

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
    /* VERSION */
    execSync('npm version "' + version + '"', { stdio: 'inherit' });
    const pkg = JSON.parse(readFileSync('./package.json'));
    version = pkg.version;
    if (!isSemverValid(version)) {
        throw new Error(`Unexpected version: ${version}`);
    }

    /* PUSH */
    execSync('git push', { stdio: 'inherit' });
    execSync('git push origin "v' + version + '"', { stdio: 'inherit' });

    /* RELEASE */
    execSync('npm publish', { stdio: 'inherit' });
}).catch(err => console.log(err.message || err));
