'use strict';

const axios = require('axios');
const semver = require('semver');
const urlJoin = require('url-join');


function getNpmInfo(npmName, registry) {
    if (!npmName) {
        return null;
    }
    const registryUrl = registry || getDefaultRegistry();
    const npmInfoUrl = urlJoin(registryUrl, npmName);
    return axios.get(npmInfoUrl).then(response => {
        if (response.status === 200) {
            return response.data;
        } else {
            return null;
        }
    }).catch(err => {
        return Promise.reject(err);
    });
}

function getDefaultRegistry(isOriginal = true) {
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

async function getNpmVersions(npmName, registry) {
    const data = await getNpmInfo(npmName, registry);
    if (data) {
        return Object.keys(data.versions);
    } else {
        return [];
    }
}

function getNpmSemverVersions(baseVersion, versions) {
    return sortVersions(versions
        .filter(version => semver.satisfies(version, `^${baseVersion}`))
    )
}

async function getNpmLatestVersion(npmName, registry) {
    let versions = await getNpmVersions(npmName, registry);
    if (versions && versions.length > 0) {
        versions = sortVersions(versions);
        return versions[0];
    }
    return null;
}

function sortVersions(versions) {
    return versions.sort((a, b) => {
        let i = 0;
        const arr1 = a.split('.');
        const arr2 = b.split('.');
        while (true) {
            const s1 = arr1[i];
            const s2 = arr2[i++];
            if (s1 === undefined || s2 === undefined) {
                return arr2.length - arr1.length;
            }
            if (s1 === s2) continue;
            return s2 - s1;
        }
    });
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
    const versions = await getNpmVersions(npmName, registry);
    const newVersions = getNpmSemverVersions(baseVersion, versions);
    if (newVersions && newVersions.length > 0) {
        return newVersions[0]
    }
}

module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmSemverVersion,
    getDefaultRegistry,
    getNpmLatestVersion,
};
