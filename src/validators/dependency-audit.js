/* eslint no-restricted-syntax: 'off', guard-for-in: 'off', no-continue: 'off' */
const semver = require('semver');

const hasExceptions = config => {
  return typeof config === 'object' && config.hasOwnProperty('exceptions');
};

/**
 * Determines whether or not the package has a given dependency
 * @param  {object} packageJsonData         Valid JSON
 * @param  {string} nodeName                Name of a node in the package.json file
 * @param  {string} depsToCheckFor  An array of packages to check for
 * @return {boolean}                        True if the package has a dependency. False if it is not or the node is missing.
 */
const hasDependency = (packageJsonData, nodeName, depsToCheckFor) => {
  if (!packageJsonData.hasOwnProperty(nodeName)) {
    return false;
  }

  for (const dependencyName in packageJsonData[nodeName]) {
    if (depsToCheckFor.includes(dependencyName)) {
      return true;
    }
  }

  return false;
};

/**
 * Determines whether or not the package has a pre-release version of a given dependency
 * @param  {object} packageJsonData         Valid JSON
 * @param  {string} nodeName                Name of a node in the package.json file
 * @param  {string} depsToCheckFor          An array of packages to check for
 * @return {boolean}                        True if the package has a pre-release version of a dependency. False if it is not or the node is missing.
 */
const hasDepPrereleaseVers = (packageJsonData, nodeName, depsToCheckFor) => {
  if (!packageJsonData.hasOwnProperty(nodeName)) {
    return false;
  }

  for (const dependencyName in packageJsonData[nodeName]) {
    if (depsToCheckFor.includes(dependencyName)) {
      const dependencyVersion = packageJsonData[nodeName][dependencyName];

      if (dependencyVersion.includes('-beta') || dependencyVersion.includes('-rc')) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Determines whether or not the package has a dependency with a major version of 0
 * @param  {object} packageJsonData   Valid JSON
 * @param  {string} nodeName          Name of a node in the package.json file
 * @param  {object} config            Rule configuration
 * @return {boolean}                  True if the package has a dependency with version 0. False if it does not or the node is missing.
 */
const hasDepVersZero = (packageJsonData, nodeName, config) => {
  for (const dependencyName in packageJsonData[nodeName]) {
    if (hasExceptions(config) && config.exceptions.includes(dependencyName)) {
      continue;
    }

    const dependencyVersRange = packageJsonData[nodeName][dependencyName];

    if (semver.validRange(dependencyVersRange)) {
      const startIndex = 0;
      const length = 1;
      const dependencyVersion = dependencyVersRange.replace(/[\D]+/g, '');
      const dependencyMjrVersion = dependencyVersion.substr(startIndex, length);

      // if first char is 0 then major version is 0
      if (dependencyMjrVersion === '0') {
        return true;
      }
    }
  }

  return false;
};

/**
 * Determines if the dependencies version string starts with the specified range
 * @param  {String}   dependencyVersion   Dependency's version range
 * @param  {String}   rangeSpecifier      A version range specifier
 * @return {Boolean}                      True if the version starts with the range, false if it doesn't.
 */
const doesVersStartsWithRange = (dependencyVersion, rangeSpecifier) => {
  const firstCharOfStr = 0;

  return dependencyVersion.startsWith(rangeSpecifier, firstCharOfStr);
};

/**
 * Determines whether or not all dependency version ranges match expected range
 * @param  {object} packageJsonData  Valid JSON
 * @param  {string} nodeName         Name of a node in the package.json file
 * @param  {string} rangeSpecifier   A version range specifier
 * @param  {object} config           Rule configuration
 * @return {boolean}                 False if the package has an invalid range. True if it is not or the node is missing.
 */
const areVersRangesValid = (packageJsonData, nodeName, rangeSpecifier, config) => {
  if (!packageJsonData.hasOwnProperty(nodeName)) {
    return true;
  }

  let rangesValid = true;

  for (const dependencyName in packageJsonData[nodeName]) {
    if (hasExceptions(config) && config.exceptions.includes(dependencyName)) {
      continue;
    }

    const dependencyVersion = packageJsonData[nodeName][dependencyName];

    if (!doesVersStartsWithRange(dependencyVersion, rangeSpecifier)) {
      rangesValid = false;
    }
  }

  return rangesValid;
};

/**
 * Determines if any dependencies have a version string that starts with the specified invalid range
 * @param  {object} packageJsonData  Valid JSON
 * @param  {string} nodeName         Name of a node in the package.json file
 * @param  {string} rangeSpecifier   A version range specifier
 * @param  {object} config           Rule configuration
 * @return {Boolean}                 True if any dependencies versions start with the invalid range, false if they don't.
 */
const doVersContainInvalidRange = (packageJsonData, nodeName, rangeSpecifier, config) => {
  if (!packageJsonData.hasOwnProperty(nodeName)) {
    return false;
  }

  let containsInvalidVersion = false;

  for (const dependencyName in packageJsonData[nodeName]) {
    if (hasExceptions(config) && config.exceptions.includes(dependencyName)) {
      continue;
    }

    const dependencyVersion = packageJsonData[nodeName][dependencyName];

    if (doesVersStartsWithRange(dependencyVersion, rangeSpecifier)) {
      containsInvalidVersion = true;
    }
  }

  return containsInvalidVersion;
};

/**
 * Determines whether or not all dependency versions are absolut
 * @param {object} packageJsonData    Valid JSON
 * @param {string} nodeName           Name of a node in the package.json file
 * @param {object} config             Rule configuration
 * @return {boolean}                  False if the package has an non-absolute version. True if it is not or the node is missing.
 */
const absoluteVersionChecker = (packageJsonData, nodeName, config) => {
  const notFound = -1;
  const firstCharOfStr = 0;
  let onlyAbsoluteVersionDetected = true;
  let dependenciesChecked = 0;

  for (const dependencyName in packageJsonData[nodeName]) {
    if (hasExceptions(config) && config.exceptions.includes(dependencyName)) {
      continue;
    }

    const dependencyVersion = packageJsonData[nodeName][dependencyName];

    if (
      dependencyVersion.startsWith('^', firstCharOfStr) ||
      dependencyVersion.startsWith('~', firstCharOfStr) ||
      dependencyVersion.startsWith('>', firstCharOfStr) ||
      dependencyVersion.startsWith('<', firstCharOfStr) ||
      dependencyVersion.indexOf('*') !== notFound
    ) {
      onlyAbsoluteVersionDetected = false;
    }

    dependenciesChecked += 1;
  }

  return {
    onlyAbsoluteVersionDetected,
    dependenciesChecked
  };
};

/**
 * Determines whether or not all dependency versions are absolut
 * @param {object} packageJsonData    Valid JSON
 * @param {string} nodeName           Name of a node in the package.json file
 * @param {object} config             Rule configuration
 * @return {boolean}                  False if the package has an non-absolute version. True if it is not or the node is missing.
 */
const areVersionsAbsolute = (packageJsonData, nodeName, config) => {
  const {onlyAbsoluteVersionDetected, dependenciesChecked} = absoluteVersionChecker(packageJsonData, nodeName, config);

  return dependenciesChecked > 0 ? onlyAbsoluteVersionDetected : false;
};

/**
 * Determines whether or not all dependency versions are absolut
 * @param {object} packageJsonData    Valid JSON
 * @param {string} nodeName           Name of a node in the package.json file
 * @param {object} config             Rule configuration
 * @return {boolean}                  False if the package has an non-absolute version. True if it is not or the node is missing.
 */
const doVersContainNonAbsolute = (packageJsonData, nodeName, config) => {
  const {onlyAbsoluteVersionDetected, dependenciesChecked} = absoluteVersionChecker(packageJsonData, nodeName, config);

  return dependenciesChecked > 0 ? !onlyAbsoluteVersionDetected : false;
};

module.exports = {
  hasDependency,
  hasDepPrereleaseVers,
  hasDepVersZero,
  doesVersStartsWithRange,
  areVersRangesValid,
  doVersContainInvalidRange,
  areVersionsAbsolute,
  doVersContainNonAbsolute
};
