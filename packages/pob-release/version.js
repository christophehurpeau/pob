const readFileSync = require('fs').readFileSync;
const existsSync = require('fs').existsSync;
const execSync = require('child_process').execSync;
const validateSemver = require('semver').valid;


const isSemverValid = version => validateSemver(version) !== null;

/* VERSION */
const pkg = JSON.parse(readFileSync('./package.json'));
const version = pkg.version;
if (!isSemverValid(version)) {
  throw new Error(`Unexpected version: ${version}`);
}

/* AUTHORS */
execSync('git --no-pager log --reverse --format="%aN <%aE>" | sort -fub > AUTHORS'
         + ' && git add AUTHORS && git commit -m "chore(authors): update AUTHORS" AUTHORS || true', { stdio: 'inherit' });

/* CHANGELOG */

execSync(`node_modules/.bin/standard-changelog ${existsSync('CHANGELOG.md') ? '--first-release ' : ''}`
         + '| sed -e :a -e \'/^\\n*$/{$d;N;};/\\n$/ba\' > \\#temp_changelog', { stdio: 'inherit' });
execSync('$EDITOR \\#temp_changelog', { stdio: 'inherit' });
execSync('echo "\\n" >> \\#temp_changelog', { stdio: 'inherit' });
try {
  execSync('cat CHANGELOG.md >> \\#temp_changelog', { stdio: 'inherit' });
} catch (err) {}
execSync('cat \\#temp_changelog | sed -e :a -e \'/^\\n*$/{$d;N;};/\\n$/ba\' > CHANGELOG.md', { stdio: 'inherit' });
execSync('rm \\#temp_changelog', { stdio: 'inherit' });
execSync('git add CHANGELOG.md');
