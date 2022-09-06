'use strict';

module.exports = core;

const semver = require('semver');
const commander = require('commander');
const colors = require('colors/safe');
const pathExists = require('path-exists').sync;
const userHome = require('user-home');
const log = require('@ymsh-cli/log');
const pkg = require('../package.json');
const constant = require('./const');
const path = require('path');
const exec = require('@ymsh-cli/exec');

const program = new commander.Command();

async function core() {
    try {
        await prepare();
        registerCommand();
    } catch (e) {
        log.error(e.message);
        if (program.debug) {
            console.log(e);
        }
    }

}

// 检查版本
function checkPkgVersion() {
    log.info('cli', pkg.version);
}

// root 用户getegid返回0 这样root创建的文件其他用户无法访问
function checkRoot() {
    const rootCheck = require('root-check');
    // root-check自动检查并且降级
    rootCheck()
}

// 检查用户主目录
function checkUserHome() {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登录用户主目录不存在!'))
    }
}

// 创建默认的配置
function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
    } else {
        cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

// 检查环境变量
function checkEnv() {
    const dotenv = require('dotenv');
    const dotenvPath = path.resolve(userHome, '.env')
    if (pathExists(dotenvPath)) {
        dotenv.config({
            path: dotenvPath
        });
    }
    createDefaultConfig();
}

async function checkGlobalUpdate() {
    // 1、获取当前版本号和模块名
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    // 2、调用npm Api 获取所有版本号
    const { getNpmSemverVersion } = require('@ymsh-cli/get-npm-info');
    // 3、提取所有版本号比对哪些版本号是大于当前版本号
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
    // 4、获取最新版本号，提示用户更新到该版本
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn(colors.yellow(`请手动更新 ${npmName}, 当前版本：${currentVersion}, 最新版本：${lastVersion} 更新命令: npm install -g ${npmName}`))
    }
}

// 注册命令
function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');

    program
        .command('init [projectName]')
        .option('-f, --force', '是否强制初始化项目')
        .action(exec);

    // 开启debug模式
    program.on('option:debug', function () {
        if (program.debug) {
            process.env.LOG_LEVEL = 'verbose';
        } else {
            process.env.LOG_LEVEL = 'info';
        }
        log.level = process.env.LOG_LEVEL;
    });

    // 指定targetPath
    program.on('option:targetPath', function () {
        process.env.CLI_TARGET_PATH = program.targetPath;
    });

    // 对未知命令监听
    program.on('command:*', function (obj) {
        const availableCommands = program.commands.map(cmd => cmd.name());
        console.log(colors.red('未知的命令：' + obj[0]));
        if (availableCommands.length > 0) {
            console.log(colors.red('可用命令' + availableCommands.join(',')));
        }
    });

    program.parse(process.argv);
    // 这里需要注意需要在命令解析之后进行判断 否则拿不到debug及参数
    if (program.args && program.args.length < 1) {
        program.outputHelp();
        console.log();
    }
}

async function prepare(params) {
    checkPkgVersion();
    checkRoot();
    checkUserHome();
    checkEnv();
    await checkGlobalUpdate();
}