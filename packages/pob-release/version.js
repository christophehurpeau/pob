const readFileSync = require('fs').readFileSync;
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
         + ' && git add AUTHORS && git commit -m "update AUTHORS" AUTHORS || true', { stdio: 'inherit' });

/* CHANGELOG */
execSync(`echo "### v${version}\\n" > \\#temp_changelog`, { stdio: 'inherit' });

let repository = pkg.repository;
if (repository) {
    repository = repository.replace(/^git@github.com:(.*)\.git$/, '$1');
}

// Initial commit: diff against an empty tree object
execSync('git log `git describe --abbrev=0 &> /dev/null && git rev-list --tags --max-count=1 || echo "4b825dc642cb6eb9a060e54bf8d69288fbee4904"`..HEAD  --reverse'
         + ` --pretty=format:"- [\\\`%h\\\`](https://github.com/${repository}/commit/%H) %s (%an)"`
         + '>> \\#temp_changelog', { stdio: 'inherit' });

execSync('$EDITOR \\#temp_changelog', { stdio: 'inherit' });
execSync('echo "\\n" >> \\#temp_changelog', { stdio: 'inherit' });
execSync('cat CHANGELOG.md || echo >> \\#temp_changelog || true', { stdio: 'inherit' });
execSync('mv -f \\#temp_changelog CHANGELOG.md', { stdio: 'inherit' });
execSync('git add CHANGELOG.md');
