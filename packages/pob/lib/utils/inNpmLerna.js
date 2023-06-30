import { readFileSync } from 'node:fs';
import inLerna from './inLerna.js';

export default inLerna &&
  JSON.parse(readFileSync(inLerna.lernaJsonPath)).npmClient !== 'yarn';
