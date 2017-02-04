const { execSync } = require('child_process');
const glob = require('glob');
const { logger: parentLogger } = require('./logger');
const Task = require('./cli-spinner');

const logger = parentLogger.child('clean', 'clean');

module.exports = function clean(envs) {
  const task = new Task('clean');
  const startTime = logger.infoTime('starting');

  if (!envs) {
    execSync('rm -Rf lib-* test/node6 examples/node6');
    task.succeed();
    logger.infoSuccessTimeEnd(startTime, 'done.');
    return;
  }

  const diff = glob.sync('lib*').filter(path => !envs.includes(path.substr('lib-'.length)));
  if (diff.length) {
    const log = `removing: ${diff.join(',')}`;
    const subtask = task.subtask(log);
    logger.warn(log);
    if (diff.some(diff => diff.startsWith('src'))) {
      throw new Error('Cannot contains src');
    }

    execSync(`rm -Rf ${diff.join(' ')}`);
    subtask.done();
  }

  task.succeed();
  logger.infoSuccessTimeEnd(startTime, 'done.');
};
