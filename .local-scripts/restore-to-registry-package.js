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
const { PACKAGE_NAME, validateTargetProject, checkPortalThemeDependency, getPortalThemeVersion, runNpmCommand, clearCaches } = require('./package-utils');

/**
 * Finds the dependency type and original version of the package
 */
function findDependencyInfo(packageJson) {
  const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies'];

  for (const type of dependencyTypes) {
    if (packageJson[type] && packageJson[type][PACKAGE_NAME]) {
      return {
        type,
        originalVersion: packageJson[type][PACKAGE_NAME],
      };
    }
  }

  return { type: null, originalVersion: null };
}

/**
 * Removes the package from package.json
 */
function removePackageFromJson(targetPath, dependencyType, originalVersion) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  delete packageJson[dependencyType][PACKAGE_NAME];
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`Removed ${PACKAGE_NAME} from package.json (${originalVersion})`);
}

/**
 * Determines the version to install from registry
 */
function determineVersionToInstall(targetPath, version) {
  if (version && !version.startsWith('file:')) {
    console.log(`Using specified version: ${version}`);
    return `@${version}`;
  }

  return getLatestStableVersion(targetPath);
}

/**
 * Gets the latest stable version from registry
 */
function getLatestStableVersion(targetPath) {
  try {
    console.log('Fetching available versions from registry...');
    const output = runNpmCommand(`npm view ${PACKAGE_NAME} versions --json`, targetPath, 'Fetching available versions');

    const versions = JSON.parse(output.trim());
    const stableVersions = versions.filter(v => {
      return !/-[a-zA-Z]/.test(v) && !/-\d+$/.test(v);
    });

    if (stableVersions.length > 0) {
      const latestStable = stableVersions.sort((a, b) => {
        const parseVersion = v => v.split('.').map(Number);
        const aVersion = parseVersion(a);
        const bVersion = parseVersion(b);

        for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
          const aPart = aVersion[i] || 0;
          const bPart = bVersion[i] || 0;
          if (aPart !== bPart) return bPart - aPart;
        }
        return 0;
      })[0];

      console.log(`Found latest stable version: ${latestStable}`);
      return `@${latestStable}`;
    } else {
      console.log('⚠️  No stable versions found, using latest available');
      return '';
    }
  } catch (error) {
    console.warn('⚠️  Could not fetch versions from registry, using latest:', error.message);
    return '';
  }
}

/**
 * Uninstalls the local package and reinstalls from registry
 */
function reinstallFromRegistry(targetPath, version) {
  console.log(`\nReinstalling ${PACKAGE_NAME} from registry...`);

  try {
    const packageJsonPath = path.join(targetPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const { type: dependencyType, originalVersion } = findDependencyInfo(packageJson);

    if (dependencyType && originalVersion) {
      removePackageFromJson(targetPath, dependencyType, originalVersion);
    }

    const versionToInstall = determineVersionToInstall(targetPath, version);

    // Install the package from registry
    runNpmCommand(`npm install ${PACKAGE_NAME}${versionToInstall}`, targetPath, 'Installing package from registry');

    // Install all other dependencies
    runNpmCommand('npm install', targetPath, 'Installing all dependencies');
  } catch (error) {
    console.error('❌ Error during registry restoration:', error.message);
    throw error;
  }
}

/**
 * Checks if there's a newer stable version available in the registry
 */
function hasNewerStableVersion(currentVersion, targetPath) {
  try {
    // Skip check if current version is a file: path
    if (currentVersion.startsWith('file:')) {
      return { hasNewer: false, latestVersion: null };
    }

    console.log('Checking for newer stable versions...');
    const output = runNpmCommand(`npm view ${PACKAGE_NAME} versions --json`, targetPath, 'Fetching available versions for comparison');

    const versions = JSON.parse(output.trim());
    const stableVersions = versions.filter(v => {
      return !/-[a-zA-Z]/.test(v) && !/-\d+$/.test(v);
    });

    if (stableVersions.length === 0) {
      return { hasNewer: false, latestVersion: null };
    }

    // Sort versions and get the latest stable one
    const latestStable = stableVersions.sort((a, b) => {
      const parseVersion = v => v.split('.').map(Number);
      const aVersion = parseVersion(a);
      const bVersion = parseVersion(b);

      for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
        const aPart = aVersion[i] || 0;
        const bPart = bVersion[i] || 0;
        if (aPart !== bPart) return bPart - aPart;
      }
      return 0;
    })[0];

    // Compare current version with latest stable
    const currentVersionClean = currentVersion.replace(/^[\^~]/, ''); // Remove ^ or ~ prefixes
    const isNewer = compareVersions(latestStable, currentVersionClean) > 0;

    return { hasNewer: isNewer, latestVersion: latestStable };
  } catch (error) {
    console.warn('⚠️  Could not check for newer versions:', error.message);
    return { hasNewer: false, latestVersion: null };
  }
}

/**
 * Compares two version strings
 * Returns: 1 if version1 > version2, -1 if version1 < version2, 0 if equal
 */
function compareVersions(version1, version2) {
  const parseVersion = v => v.split('.').map(Number);
  const v1Parts = parseVersion(version1);
  const v2Parts = parseVersion(version2);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  return 0;
}

/**
 * Reads package.json and extracts all dependencies
 */
function readPackageDependencies(targetPath) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  };
}

/**
 * Checks if the package is a local file dependency
 */
function isLocalFileDependency(dependency) {
  return dependency && dependency.startsWith('file:');
}

/**
 * Checks if there's a newer version available for update
 */
function checkForNewerVersion(dependency, targetPath, specificVersion) {
  if (specificVersion || !dependency) {
    return null;
  }

  const { hasNewer, latestVersion } = hasNewerStableVersion(dependency, targetPath);
  if (hasNewer) {
    console.log(`Found newer stable version: ${latestVersion} (current: ${dependency})`);
    return { reason: 'newer', currentVersion: dependency, latestVersion };
  }

  return null;
}

/**
 * Checks if the package is installed locally (from file path) or needs update
 */
function needsUpdate(targetPath, specificVersion) {
  try {
    const allDeps = readPackageDependencies(targetPath);
    if (!allDeps) {
      return checkNodeModulesForLocalInstallation(targetPath);
    }

    const dependency = allDeps[PACKAGE_NAME];

    // Check for local file dependency
    if (isLocalFileDependency(dependency)) {
      return { needsUpdate: true, reason: 'local', currentVersion: dependency };
    }

    // Check for newer version
    const newerVersionResult = checkForNewerVersion(dependency, targetPath, specificVersion);
    if (newerVersionResult) {
      return { needsUpdate: true, ...newerVersionResult };
    }

    // No local installation found in package.json, check node_modules as fallback
    return checkNodeModulesForLocalInstallation(targetPath);
  } catch (error) {
    console.warn('⚠️  Error checking installation status:', error.message);
    return { needsUpdate: false, reason: 'error' };
  }
}

/**
 * Checks node_modules for local installation as fallback
 */
function checkNodeModulesForLocalInstallation(targetPath) {
  try {
    const nodeModulesPath = path.join(targetPath, 'node_modules', ...PACKAGE_NAME.split('/'));

    if (!fs.existsSync(nodeModulesPath)) {
      return { needsUpdate: false, reason: 'not-installed' };
    }

    const installedPackageJsonPath = path.join(nodeModulesPath, 'package.json');

    if (!fs.existsSync(installedPackageJsonPath)) {
      return { needsUpdate: false, reason: 'registry' };
    }

    const installedPackageJson = JSON.parse(fs.readFileSync(installedPackageJsonPath, 'utf8'));

    // Check if the package has a _resolved field pointing to a local file
    if (installedPackageJson._resolved && installedPackageJson._resolved.startsWith('file:')) {
      return { needsUpdate: true, reason: 'local', currentVersion: installedPackageJson.version };
    }

    // Alternative check: look for local installation indicators in package-lock.json
    const packageLockPath = path.join(targetPath, 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
      const dependency = packageLock.dependencies && packageLock.dependencies[PACKAGE_NAME];

      if (dependency && dependency.resolved && dependency.resolved.startsWith('file:')) {
        return { needsUpdate: true, reason: 'local', currentVersion: dependency.version };
      }
    }

    return { needsUpdate: false, reason: 'registry' };
  } catch (error) {
    console.warn('⚠️  Could not determine installation type, assuming local installation:', error.message);
    return { needsUpdate: true, reason: 'local' };
  }
}

/**
 * Determines if an update is needed and provides user feedback
 */
function checkAndReportUpdateStatus(targetPath, specificVersion) {
  // If specific version is requested, always proceed with installation
  if (specificVersion) {
    console.log(`Specific version requested (${specificVersion}), proceeding with installation...`);
    return { shouldProceed: true, reason: 'specific' };
  }

  const updateCheck = needsUpdate(targetPath, specificVersion);

  if (!updateCheck.needsUpdate) {
    if (updateCheck.reason === 'registry') {
      console.log('Package is already installed from registry with the latest stable version.');
    } else {
      console.log('Package is already up to date.');
    }
    console.log('Nothing to restore.');
    return { shouldProceed: false };
  }

  if (updateCheck.reason === 'local') {
    console.log('Local installation detected, proceeding with restoration...');
  } else if (updateCheck.reason === 'newer') {
    console.log(`Newer stable version available (${updateCheck.latestVersion}), proceeding with update...`);
  }

  return { shouldProceed: true, updateCheck };
}

/**
 * Determines the target version for installation
 */
function determineTargetVersion(targetPath, specificVersion, version) {
  if (specificVersion) {
    return specificVersion;
  }

  const updateCheck = needsUpdate(targetPath, specificVersion);
  return updateCheck.latestVersion || version;
}

/**
 * Prints installation summary
 */
function printInstallationSummary(targetPath, targetVersion, specificVersion) {
  console.log('\n✅ Registry restoration completed successfully!');
  console.log(`\nSummary:`);
  console.log(`   Package: ${PACKAGE_NAME}`);
  console.log(`   Restored in: ${targetPath}`);
  console.log(`   Version: ${targetVersion}`);

  if (specificVersion) {
    console.log(`   Installed specific version: ${specificVersion}`);
  }

  console.log(`   Source: npm registry`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Usage: node restore-to-registry-package.js <target-project-path> [version]');
    console.error('Example: node restore-to-registry-package.js ../portal-shell');
    console.error('Example: node restore-to-registry-package.js ../portal-shell 2.0.1');
    process.exit(1);
  }

  const targetPath = path.resolve(args[0]);
  const specificVersion = args[1]; // Optional version parameter

  console.log('Portal-Theme registry restoration started');
  console.log(`Target directory: ${targetPath}`);

  try {
    // 1. Validate target directory
    console.log('\nValidating target directory...');
    const packageJson = validateTargetProject(targetPath);
    console.log(`Valid npm project found: ${packageJson.name}`);

    // 2. Check Portal-Theme dependency
    console.log('\nChecking Portal-Theme dependency...');
    const hasPortalTheme = checkPortalThemeDependency(packageJson);

    if (!hasPortalTheme) {
      console.error(`❌ ${PACKAGE_NAME} is not found as dependency in ${packageJson.name}.`);
      console.log('Nothing to restore.');
      process.exit(1);
    }

    const version = getPortalThemeVersion(packageJson);
    console.log(`${PACKAGE_NAME} found as dependency with version: ${version}`);

    // 3. Check if package needs update
    console.log('\nChecking installation type and available updates...');
    const updateStatus = checkAndReportUpdateStatus(targetPath, specificVersion);

    if (!updateStatus.shouldProceed) {
      process.exit(0);
    }

    // 4. Clear caches
    clearCaches(targetPath);

    // 5. Reinstall from registry
    const targetVersion = determineTargetVersion(targetPath, specificVersion, version);
    reinstallFromRegistry(targetPath, targetVersion);

    // 6. Print summary
    printInstallationSummary(targetPath, targetVersion, specificVersion);
  } catch (error) {
    console.error('\n❌ Registry restoration failed:', error.message);
    process.exit(1);
  }
}

// Script executed if called directly
if (require.main === module) {
  main();
}

module.exports = {
  reinstallFromRegistry,
  needsUpdate,
  hasNewerStableVersion,
  compareVersions,
};
