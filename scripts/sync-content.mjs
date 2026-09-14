import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncLearningJson, syncContentJson } from './study-catalog.mjs';
import { buildSearchIndex } from './search-index.mjs';

export async function syncAllContent(projectRoot) {
  await syncLearningJson({ learningRoot: join(projectRoot, 'docs_learning'), learningJsonPath: join(projectRoot, 'docs_learning/learning.json') });
  for (const source of ['travelling', 'dairy']) {
    await syncContentJson({ root: join(projectRoot, `docs_${source}`), manifestPath: join(projectRoot, `docs_${source}/${source}.json`), source });
  }
  await buildSearchIndex(projectRoot);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await syncAllContent(fileURLToPath(new URL('..', import.meta.url)));
  console.log('Updated learning, travelling and dairy manifests.');
}
