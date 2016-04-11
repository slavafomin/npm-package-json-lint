"use strict";

let isObject = require("./../validators/type").isObject;
let isString = require("./../validators/type").isString;
let LintIssue = require("./../LintIssue");
const lintId = "repository-type";
const lintType = "error";
const nodeName = "repository";
const message = "Type should be either a string or an Object";
const ruleType = "type";

let lint = function(packageJsonData) {
  if (!isString(packageJsonData, nodeName) && !isObject(packageJsonData, nodeName)) {
    return new LintIssue(lintId, lintType, nodeName, message);
  }

  return true;
};

module.exports.lint = lint;
module.exports.lintType = lintType;
module.exports.ruleType = ruleType;
