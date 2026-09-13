import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncLearningJson } from './study-catalog.mjs';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const learningRoot = join(projectRoot, 'docs_learning');
const learningJsonPath = join(learningRoot, 'learning.json');

const document = await syncLearningJson({ learningRoot, learningJsonPath });
console.log(`Updated docs_learning/learning.json (${document.catalog.length} terms).`);
