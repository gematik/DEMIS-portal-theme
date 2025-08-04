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
const { PACKAGE_NAME, validateTargetProject, checkPortalThemeDependency, runNpmCommand, clearCaches } = require('./package-utils');

/**
 * Searches for the TGZ file in the dist directory
 */
function findTgzFile() {
  const distDir = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(distDir)) {
    throw new Error('dist directory not found. Please run "npm run build:dev" first.');
  }

  const files = fs.readdirSync(distDir);
  const tgzFiles = files.filter(file => file.match(/^gematik-demis-portal-theme-library-.*\.tgz$/));

  if (tgzFiles.length === 0) {
    throw new Error('No TGZ file found in dist directory. Please run "npm run build:dev" first.');
  }

  if (tgzFiles.length > 1) {
    console.warn(`Multiple TGZ files found: ${tgzFiles.join(', ')}. Using the latest one.`);
    // Sort by modification date and use the latest
    tgzFiles.sort((a, b) => {
      const statA = fs.statSync(path.join(distDir, a));
      const statB = fs.statSync(path.join(distDir, b));
      return statB.mtime - statA.mtime;
    });
    console.log(`Selected latest file: ${tgzFiles[0]}`);
  }

  const selectedTgz = path.join(distDir, tgzFiles[0]);

  // Show file timestamp for transparency
  const stat = fs.statSync(selectedTgz);
  console.log(`TGZ file timestamp: ${stat.mtime.toISOString()}`);

  return selectedTgz;
}

/**
 * Installs the local TGZ file
 */
function installLocalPackage(tgzPath, targetPath) {
  const absoluteTgzPath = path.resolve(tgzPath);

  console.log(`\nInstalling local package: ${absoluteTgzPath}`);

  // Install the TGZ file
  runNpmCommand(`npm install "${absoluteTgzPath}"`, targetPath, 'Installing local package');

  // Install all other dependencies
  runNpmCommand('npm install', targetPath, 'Installing all dependencies');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Usage: node deploy-local-dev-package.js <target-project-path>');
    console.error('Example: node deploy-local-dev-package.js ../portal-shell');
    process.exit(1);
  }

  const targetPath = path.resolve(args[0]);

  console.log('Portal-Theme local installation started');
  console.log(`Target directory: ${targetPath}`);
  console.log('Note: This will always install the latest TGZ build, replacing any existing installation.');

  try {
    // 1. Find TGZ file
    console.log('\nSearching for TGZ file...');
    const tgzPath = findTgzFile();
    console.log(`TGZ file found: ${tgzPath}`);

    // 2. Validate target directory
    console.log('\nValidating target directory...');
    const packageJson = validateTargetProject(targetPath);
    console.log(`Valid npm project found: ${packageJson.name}`);

    // 3. Check Portal-Theme dependency
    console.log('\nChecking Portal-Theme dependency...');
    const hasPortalTheme = checkPortalThemeDependency(packageJson);

    if (!hasPortalTheme) {
      console.warn(`⚠️  ${PACKAGE_NAME} is not found as dependency in ${packageJson.name}.`);
      console.log('Installation will continue anyway...');
    } else {
      console.log(`${PACKAGE_NAME} found as dependency`);
    }

    // 4. Clear caches
    clearCaches(targetPath);

    // 5. Install local package
    installLocalPackage(tgzPath, targetPath);

    console.log('\n✅ Installation completed successfully!');
    console.log(`\nSummary:`);
    console.log(`   TGZ file: ${path.basename(tgzPath)}`);
    console.log(`   Installed in: ${targetPath}`);
    console.log(`   Package name: ${PACKAGE_NAME}`);
  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    process.exit(1);
  }
}

// Script executed if called directly
if (require.main === module) {
  main();
}

module.exports = {
  findTgzFile,
  installLocalPackage,
};
