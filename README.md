<img align="right" width="250" height="47" src="media/Gematik_Logo_Flag.png"/> <br/>

# Portal Theme

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
       <ul>
        <li><a href="#quality-gate">Quality Gate</a></li>
        <li><a href="#release-notes">Release Notes</a></li>
      </ul>
	</li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#npm-configuration">NPM Configuration</a></li>
        <li><a href="#how-to-build">How to Build</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li>
      <a href="#development-scripts">Development Scripts</a>
      <ul>
        <li><a href="#builddev">build:dev</a></li>
        <li><a href="#deploy-local-dev-package">deploy-local-dev-package</a></li>
        <li><a href="#restore-to-registry-package">restore-to-registry-package</a></li>
        <li><a href="#typical-development-workflow">Typical development workflow</a></li>
      </ul>
    </li>
    <li><a href="#security-policy">Security Policy</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About The Project

This project contains the DEMIS Portal Theme Library, providing consistent styling and theming for DEMIS microfrontends based on Angular Material.

### Quality Gate

### Quality Gate

[![Quality Gate Status](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=de.gematik.demis%3Aportal-theme&metric=alert_status&token=f6b0d2644cdc236a78e65a44ef61eb7f161ba1ab)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=de.gematik.demis%3Aportal-theme)
[![Vulnerabilities](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=de.gematik.demis%3Aportal-theme&metric=vulnerabilities&token=f6b0d2644cdc236a78e65a44ef61eb7f161ba1ab)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=de.gematik.demis%3Aportal-theme)
[![Bugs](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=de.gematik.demis%3Aportal-theme&metric=bugs&token=f6b0d2644cdc236a78e65a44ef61eb7f161ba1ab)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=de.gematik.demis%3Aportal-theme)
[![Code Smells](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=de.gematik.demis%3Aportal-theme&metric=code_smells&token=f6b0d2644cdc236a78e65a44ef61eb7f161ba1ab)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=de.gematik.demis%3Aportal-theme)
[![Lines of Code](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=de.gematik.demis%3Aportal-theme&metric=ncloc&token=f6b0d2644cdc236a78e65a44ef61eb7f161ba1ab)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=de.gematik.demis%3Aportal-theme)
[![Coverage](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=de.gematik.demis%3Aportal-theme&metric=coverage&token=f6b0d2644cdc236a78e65a44ef61eb7f161ba1ab)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=de.gematik.demis%3Aportal-theme)

### Release Notes

See [ReleaseNotes](ReleaseNotes.md) for all information regarding the (newest) releases.

## Getting Started

### NPM Configuration

The Project requires access to the Nexus Private NPM registry from gematik, therefore the `npm` CLI tool should be configured accordingly:

```sh
# Login to private registry with username/password
npm login --registry=https://nexus.prod.ccs.gematik.solutions/repository/allNpmRepos/
# Set npm standard registry
npm config set registry https://nexus.prod.ccs.gematik.solutions/repository/allNpmRepos/
```

### How to build

The theme library can be built using the following commands:

```sh
npm clean-install
npm run build
```

## Usage

To use this library in your project, install it via npm, if you have access to a registry, where this library is pushed to:

```bash
npm install @gematik/demis-portal-theme-library
```

Then import the CSS file in your Angular application:

```scss
@import '@gematik/demis-portal-theme-library/demis-theme.css';
```

If you do not have access to a registry that has this library available, you first need to build it yourself (see: <a href="#builddev">build:dev</a>).
Afterwards, you can deploy this local build to any desired Angular project by utilizing the convenience script <a href="#deploy-local-dev-package">deploy-local-dev-package</a>.

**BEWARE!** This will most likely always affect the dependency tree of the target Angular project!

## Development Scripts

There are several scripts available for local development that simplify the workflow between local TGZ builds and registry installations:

### build:dev

Builds the theme library and packs it into a TGZ file in the `dist/` directory.
This is useful for local development and testing before deploying to a registry.

**Usage:**

```bash
# Build the library and create a TGZ file in dist/
npm run build:dev
```

### deploy-local-dev-package

Installs the locally built TGZ version of the Portal-Theme-Library into a target project.

**Usage:**

```bash
# Installs the latest TGZ file from dist/
npm run deploy-local-dev-package ../portal-shell

# Or directly:
node .local-scripts/deploy-local-dev-package.js ../portal-shell
```

**Features:**

- Automatically finds the latest TGZ file in the `dist/` directory
- Installs the local version as `file:` dependency
- Clears caches and reinstalls all dependencies
- Automatically validates target directory and project

### restore-to-registry-package

Restores registry versions of the Portal-Theme-Library and checks for available updates.

**Usage:**

```bash
# Automatic update to latest stable version
npm run restore-to-registry-package ../portal-shell

# Installation of a specific version
npm run restore-to-registry-package ../portal-shell 1.2.3

# Or directly:
node .local-scripts/restore-to-registry-package.js ../portal-shell [version]
```

As can be seen, the script can also be used to install a specific version of the library.
Typically, this is not necessary, as the latest version is always installed by default.

### Typical Development Workflow

1. **Local development**: Make changes to Portal-Theme styles
2. **Build**: Run `npm run build:dev`
3. **Deployment**: `npm run deploy-local-dev-package ../portal-shell` for testing
4. **Restoration**: `npm run restore-to-registry-package ../portal-shell` for production

## Security Policy

If you want to see the security policy, please check our [SECURITY.md](.github/SECURITY.md).

## Contributing

If you want to contribute, please check our [CONTRIBUTING.md](.github/CONTRIBUTING.md).

## License

Copyright 2024-2025 gematik GmbH

EUROPEAN UNION PUBLIC LICENCE v. 1.2

EUPL © the European Union 2007, 2016

See the [LICENSE](./LICENSE.md) for the specific language governing permissions and limitations under the License

## Additional Notes and Disclaimer from gematik GmbH

1. Copyright notice: Each published work result is accompanied by an explicit statement of the license conditions for use. These are regularly typical conditions in connection with open source or free software. Programs described/provided/linked here are free software, unless otherwise stated.
2. Permission notice: Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
    1. The copyright notice (Item 1) and the permission notice (Item 2) shall be included in all copies or substantial portions of the Software.
    2. The software is provided "as is" without warranty of any kind, either express or implied, including, but not limited to, the warranties of fitness for a particular purpose, merchantability, and/or non-infringement. The authors or copyright holders shall not be liable in any manner whatsoever for any damages or other claims arising from, out of or in connection with the software or the use or other dealings with the software, whether in an action of contract, tort, or otherwise.
    3. We take open source license compliance very seriously. We are always striving to achieve compliance at all times and to improve our processes. If you find any issues or have any suggestions or comments, or if you see any other ways in which we can improve, please reach out to: ospo@gematik.de
3. Please note: Parts of this code may have been generated using AI-supported technology. Please take this into account, especially when troubleshooting, for security analyses and possible adjustments.

## Contact

E-Mail to [DEMIS Entwicklung](mailto:demis-entwicklung@gematik.de?subject=[GitHub]%20portal-theme)
