const path = require('path');
const releaseUtils = require('@tryghost/release-utils');
const config = require('./config');

exports.changelog = ({previousVersion}) => {
    const changelog = new releaseUtils.Changelog({
        changelogPath: path.join(process.cwd(), '.', 'changelog.md'),
        folder: path.join(process.cwd(), '.')
    });

    changelog
        .write({
            githubRepoPath: 'https://github.com/kirrg001/testing',
            lastVersion: previousVersion
        })
        .sort()
        .clean();
};

exports.previousRelease = () => {
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

            console.log(`Previous version ${response[0].name}`);
            return response[0].name;
        });
};

/**
 * You can manually run:
 * npm_package_version=0.5.0 gulp release
 *
 * @NOTE:
 *
 * `yarn ship` uses the format v%s
 */
exports.release = () => {
    // https://yarnpkg.com/lang/en/docs/cli/version/
    const newVersion = process.env.npm_package_version;

    console.log(process.env.WITH_GHOST);

    if (!newVersion || newVersion === '') {
        console.log('Invalid version.');
        return;
    }

    console.log(`\nDraft release for ${newVersion}.`);

    if (!config || !config.github || !config.github.username || !config.github.token) {
        console.log('Please copy config.example.json and configure Github token.');
        return;
    }

    return exports.previousRelease()
        .then((previousVersion)=> {

            exports.changelog({previousVersion});

            return releaseUtils
                .releases
                .create({
                    draft: true,
                    preRelease: false,
                    tagName: newVersion,
                    releaseName: newVersion,
                    userAgent: 'casper',
                    uri: 'https://api.github.com/repos/kirrg001/testing/releases',
                    github: {
                        username: config.github.username,
                        token: config.github.token
                    },
                    content: ['**Ships with Ghost {VERSION} Compatible with Ghost >= {VERSION}**\n\n'],
                    changelogPath: path.join(process.cwd(), 'changelog.md')
                })
                .then((response)=> {
                    console.log(`\nRelease draft generated: ${response.releaseUrl}\n`);
                });
        });
};