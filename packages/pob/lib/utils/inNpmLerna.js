import { readFileSync } from 'fs';
import inLerna from './inLerna.js';

export default inLerna &&
  JSON.parse(readFileSync(inLerna.lernaJsonPath)).npmClient !== 'yarn';
