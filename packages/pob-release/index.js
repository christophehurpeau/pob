const readFileSync = require('fs').readFileSync;
const argv = require('minimist-argv');
const inquirer = require('inquirer');
const execSync = require('child_process').execSync;
const { valid: validateSemver, inc: incSemver } = require('semver');
const isSemverValid = version => validateSemver(version) !== null;

/*execSync('[[ -z $(git status --porcelain) ]] || (echo "Git working directory not clean."; exit 1)', { stdio: 'inherit' });
execSync('[[ -z $(git symbolic-ref HEAD) ]] || (echo "Git working directory not clean."; exit 1)', { stdio: 'inherit' });*/

const availableVersions = [
    'patch',
    'minor',
    'major',
    'manual',
    'premajor',
    'preminor',
    'prepatch',
    'prerelease',
];

const packageJson = JSON.parse(readFileSync('./package.json'));
const currentVersion = packageJson.version;

Promise.resolve(argv._[0]).then(version => {
    if (version) {
        if (!availableVersions.includes(version) && !isSemverValid(version)) {
            throw new Error(`Invalid semver version: ${version}`);
        }

        return version;
    }

    const availableVersionsWithSemver = availableVersions.map(version => {
        if (version === 'manual') return version;
        const nextVersion = incSemver(currentVersion, version);
        return {
            name: `${version}: ${nextVersion}`,
            value: nextVersion
        };
    });

    return inquirer.prompt([
        {
            type: 'list',
            name: 'version',
            message: 'npm version:',
            choices: availableVersionsWithSemver,
            default: availableVersionsWithSemver[1].value, // minor
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

    /* PUSH */
    execSync('git push', { stdio: 'inherit' });
    execSync('git push origin "v' + version + '"', { stdio: 'inherit' });

    if (!packageJson.private) {
        /* RELEASE */
        execSync('npm publish', { stdio: 'inherit' });
    }
}).catch(err => console.log(err.message || err));
