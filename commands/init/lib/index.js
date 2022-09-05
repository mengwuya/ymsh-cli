'use strict';

function init(projectName, comObj) {
    console.log('init', projectName, comObj.force, process.env.CLI_TARGET_PATH);
}

module.exports = init;
