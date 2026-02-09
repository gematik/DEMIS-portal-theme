/*
    Copyright (c) 2026 gematik GmbH
    Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
    European Commission – subsequent versions of the EUPL (the "Licence").
    You may not use this work except in compliance with the Licence.
    You find a copy of the Licence in the "Licence" file or at
    https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
    Unless required by applicable law or agreed to in writing,
    software distributed under the Licence is distributed on an "AS IS" basis,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
    In case of changes by gematik find details in the "Readme" file.
    See the Licence for the specific language governing permissions and limitations under the Licence.
    *******
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

const fs = require('fs');
const path = require('path');
const rootPkg = require('../package.json');
const libPkgPath = path.resolve(__dirname, '../src/package.json');
const libPkg = require(libPkgPath);

// Automatically get all peerDependencies from the library package.json
const peerDepsToSync = Object.keys(libPkg.peerDependencies || {});
// Automatically get all dependencies from the library package.json
const depsToSync = Object.keys(libPkg.dependencies || {});

console.log('Syncing dependencies...');

console.log('\nThe following peer dependencies will be synced:');
peerDepsToSync.forEach(dep => {
  console.log(`- ${dep}`);
});

console.log('\nThe following dependencies will be synced:');
depsToSync.forEach(dep => {
  console.log(`- ${dep}`);
});

/**
 * Syncs versions from the root package.json to the target object.
 * First looks in dependencies, then in devDependencies.
 * @param {string[]} depsToSync - List of dependency names to sync
 * @param {Object} targetObj - Target object to write versions to
 * @returns {{ synced: number, skipped: string[] }} - Sync result with count and skipped deps
 */
function syncVersions(depsToSync, targetObj) {
  let synced = 0;
  const skipped = [];

  depsToSync.forEach(dep => {
    if (rootPkg.dependencies && rootPkg.dependencies[dep]) {
      targetObj[dep] = rootPkg.dependencies[dep];
      synced++;
    } else if (rootPkg.devDependencies && rootPkg.devDependencies[dep]) {
      targetObj[dep] = rootPkg.devDependencies[dep];
      synced++;
    } else {
      skipped.push(dep);
    }
  });

  return { synced, skipped };
}

const peerResult = syncVersions(peerDepsToSync, libPkg.peerDependencies);
const depsResult = syncVersions(depsToSync, libPkg.dependencies);

fs.writeFileSync(libPkgPath, JSON.stringify(libPkg, null, 2) + '\n');

console.log(`\n✓ ${peerResult.synced} peer dependencies synced.`);
if (peerResult.skipped.length > 0) {
  console.log(`⚠ ${peerResult.skipped.length} peer dependencies not found in workspace package.json:`);
  peerResult.skipped.forEach(dep => console.log(`  - ${dep}`));
}

console.log(`✓ ${depsResult.synced} dependencies synced.`);
if (depsResult.skipped.length > 0) {
  console.log(`⚠ ${depsResult.skipped.length} dependencies not found in workspace package.json:`);
  depsResult.skipped.forEach(dep => console.log(`  - ${dep}`));
}

console.log('\nDependencies are in sync now!');
