/*
    Copyright (c) 2025 gematik GmbH
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
    For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

const fs = require('fs');
const path = require('path');
const { getLibraryProjectName } = require('./package-utils');

// Portal Theme specific configuration
const rootPkgPath = path.resolve(__dirname, '../package.json');
const libPkgPath = path.resolve(__dirname, '../src/package.json');

console.log('Syncing dependencies for Portal Theme...');

// Read package.json files
if (!fs.existsSync(rootPkgPath)) {
  console.error('❌ Root package.json not found');
  process.exit(1);
}

if (!fs.existsSync(libPkgPath)) {
  console.error('❌ Library package.json not found in src/');
  process.exit(1);
}

const rootPkg = require(rootPkgPath);
const libPkg = require(libPkgPath);

// Dependencies to sync from root to library peerDependencies
const peerDepsToSync = ['@angular/material', '@angular/cdk'];

console.log('\nThe following peer dependencies will be synced:');
peerDepsToSync.forEach(dep => {
  console.log(`- ${dep}`);
});

libPkg.peerDependencies = libPkg.peerDependencies || {};

// Sync peerDependencies
peerDepsToSync.forEach(dep => {
  if (rootPkg.devDependencies && rootPkg.devDependencies[dep]) {
    const version = rootPkg.devDependencies[dep];
    libPkg.peerDependencies[dep] = version;
    console.log(`✅ Synced ${dep}: ${version}`);
  } else {
    console.warn(`⚠️  ${dep} not found in root devDependencies`);
  }
});

// Write the updated library package.json
fs.writeFileSync(libPkgPath, JSON.stringify(libPkg, null, 2));
console.log('\n✅ Dependencies are in sync now!');

// Show summary
console.log('\nSummary:');
console.log(`   Root package: ${rootPkg.name}`);
console.log(`   Library package: ${libPkg.name}`);
console.log(`   Synced peer dependencies: ${Object.keys(libPkg.peerDependencies).length}`);
