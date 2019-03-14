const path = require('path');
const config = require('./config');

/**
 * You can manually run:
 * npm_package_version=0.5.0 gulp release
 */
exports.release = () => {
    const releaseUtils = require('@tryghost/release-utils');
    const newVersion = process.env.npm_package_version;

    if (!newVersion || newVersion === '') {
        console.log('Invalid version.');
        return;
    }

    console.log(`Draft release for ${newVersion}.`);

    if (!config || !config.github || !config.github.username || !config.github.token) {
        console.log('Please copy config.example.json and configure Github token.');
        return;
    }

    const changelog = new releaseUtils.Changelog({
        changelogPath: path.join(process.cwd(), '.', 'changelog.md'),
        folder: path.join(process.cwd(), '.')
    });

    return releaseUtils
        .releases
        .get({
            userAgent: 'casper',
            uri: 'https://api.github.com/repos/kirrg001/testing/releases'
        })
        .then((response) => {
            if (!response || !response.length) {
                console.log('No releases found. Skipping');
                return;
            }

            let previousVersion = response[0].name;

            console.log(`previous version ${previousVersion}`);

            changelog
                .write({
                    githubRepoPath: 'https://github.com/kirrg001/testing',
                    lastVersion: previousVersion
                })
                .sort()
                .clean();

            releaseUtils
                .releases
                .create({
                    draft: true,
                    preRelease: false,
                    tagName: `v${newVersion}`, // yarn version creates v prefix
                    releaseName: newVersion,
                    userAgent: 'casper',
                    uri: 'https://api.github.com/repos/kirrg001/testing/releases',
                    github: {
                        username: config.github.username,
                        token: config.github.token
                    },
                    changelogPath: path.join(process.cwd(), 'changelog.md')
                })
                .then((response)=> {
                    console.log('Release draft generated: ' + response.releaseUrl);
                });
        });
};