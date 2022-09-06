'use strict';

const Command = require("@ymsh-cli/command");
const log = require("@ymsh-cli/log");

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
    }

    exec() {
        console.log('init的业务');
    }
}

function init(argv) {
    // console.log('init', projectName, comObj.force, process.env.CLI_TARGET_PATH);
    return new InitCommand(argv);
}

module.exports = init;

module.exports.InitCommand = InitCommand;
