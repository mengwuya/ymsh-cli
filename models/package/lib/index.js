'use strict';

const path = require('path');
const npminstall = require('npminstall');
const fse = require('fs-extra');
const pkgDir = require('pkg-dir').sync;
const pathExists = require('path-exists').sync;
const { isObject } = require('@ymsh-cli/utils');
const { getDefaultRegistry, getNpmLatestVersion } = require('@ymsh-cli/get-npm-info');
const formatPath = require('@ymsh-cli/format-path');

class Package {
    constructor(options) {
        if (!options) {
            throw new Error('Package类的options参数不能为空!')
        }
        if (!isObject(options)) {
            throw new Error('Package类的options参数必须为对象!')
        }
        // package目标路径
        this.targetPath = options.targetPath;
        // 缓存路径
        this.storeDir = options.storeDir;
        // package的name
        this.packageName = options.packageName;
        // package的version
        this.packageVersion = options.packageVersion;
        // package缓存的目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_')
    }

    // 判断当前Package是否存在
    async exists() {
        // 是否是缓存模式下
        if (this.storeDir) {
            await this.prepare();
            return pathExists(this.cacheFilePath);
        } else {
            return pathExists(this.targetPath);
        }
    }

    // 安装Package
    async install() {
        await this.prepare();
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs: [
                {
                    name: this.packageName,
                    version: this.packageVersion
                }
            ]
        })
    }

    // 更新Package
    async update() {
        await this.prepare();
        // 1、获取最新的npm模块版本号
        const latestPackageVersion = await getNpmLatestVersion(this.packageName);
        // 2、查询最新版本号对应的路径是否存在
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
        // 3、如果不存在 则直接安装最新版本
        if (!pathExists(latestFilePath)) {
            await npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                pkgs: [
                    {
                        name: this.packageName,
                        version: latestPackageVersion
                    }
                ]
            })
            this.packageVersion = latestPackageVersion;
        } else {
            this.packageVersion = latestPackageVersion;
        }
    }

    async prepare() {
        if (this.storeDir && !pathExists(this.storeDir)) {
            // 创建文件缓存目录
            fse.mkdirpSync(this.storeDir);
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName);
        }
    }

    // 获取入口文件的路径
    getRootFilePath() {
        function _getRootFile(targetPath) {
            // 1、获取package.json所在的目录 pkg-dir
            const dir = pkgDir(targetPath);
            if (dir) {
                // 2、读取package.json require()进行读取 js/json/node
                const pkgFile = require(path.resolve(dir, 'package.json'));
                // 3、找到main或者lib path
                if (pkgFile && pkgFile.main) {
                    // 4、路径兼容（macos/windows）
                    return formatPath(path.resolve(dir, pkgFile.main));
                }
            }
            return null;
        }
        if (this.storeDir) {
            return _getRootFile(this.cacheFilePath);
        } else {
            // 1、获取package.json所在的目录 pkg-dir
            return _getRootFile(this.targetPath);
        }
    }

    get cacheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    getSpecificCacheFilePath(packageVersion) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
    }
}

module.exports = Package;


