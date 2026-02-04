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
const { execSync } = require('child_process');

/**
 * Reads the library project name from src/package.json
 * This function dynamically determines the package name by reading the library package.json
 * @returns {string} The project name of the library (e.g., "@gematik/demis-portal-theme-library")
 * @throws {Error} If src/package.json is not found
 */
function getLibraryProjectName() {
  const packageJsonPath = path.join(__dirname, '..', 'src', 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('src/package.json not found in the current directory');
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.name;
  } catch (error) {
    throw new Error(`Failed to read src/package.json: ${error.message}`);
  }
}

// Configuration - dynamically read from src/package.json
const PACKAGE_NAME = getLibraryProjectName();

/**
 * Checks if the target directory is a valid npm project
 */
function validateTargetProject(targetPath) {
  const packageJsonPath = path.join(targetPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json found in target directory: ${targetPath}`);
  }

  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

/**
 * Checks if Portal-Theme is installed as a dependency
 */
function checkPortalThemeDependency(packageJson) {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  };

  return allDeps[PACKAGE_NAME] !== undefined;
}

/**
 * Gets the version of Portal-Theme from package.json
 */
function getPortalThemeVersion(packageJson) {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  };

  return allDeps[PACKAGE_NAME];
}

/**
 * Executes an npm command
 */
function runNpmCommand(command, cwd, description) {
  console.log(`\n${description}...`);
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log(`✅ ${description} successful`);
    return output;
  } catch (error) {
    console.error(`❌ Error during: ${description}`);
    console.error(`Command: ${command}`);
    console.error(`Error: ${error.message}`);
    if (error.stdout) console.error(`stdout: ${error.stdout}`);
    if (error.stderr) console.error(`stderr: ${error.stderr}`);
    throw error;
  }
}

/**
 * Clears caches
 */
function clearCaches(targetPath) {
  console.log('\nClearing caches...');

  // Clean npm cache
  try {
    runNpmCommand('npm cache clean --force', targetPath, 'Cleaning npm cache');
  } catch (error) {
    console.warn('⚠️  npm cache could not be cleaned, continuing...', error.message);
  }

  // Delete node_modules if present
  const nodeModulesPath = path.join(targetPath, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('Deleting node_modules directory...');
    try {
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
      console.log('✅ node_modules successfully deleted');
    } catch (error) {
      console.warn('⚠️  node_modules could not be deleted:', error.message);
    }
  }

  // Delete package-lock.json if present
  const packageLockPath = path.join(targetPath, 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    console.log('Deleting package-lock.json...');
    try {
      fs.unlinkSync(packageLockPath);
      console.log('✅ package-lock.json successfully deleted');
    } catch (error) {
      console.warn('⚠️  package-lock.json could not be deleted:', error.message);
    }
  }
}

module.exports = {
  getLibraryProjectName,
  PACKAGE_NAME,
  validateTargetProject,
  checkPortalThemeDependency,
  getPortalThemeVersion,
  runNpmCommand,
  clearCaches,
};
