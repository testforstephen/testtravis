const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const vsce = require('vsce');
var git = require('git-rev-sync');
const cliArgs = require('yargs').argv;
const azure = require('azure-storage');

function getVsixName() {
    const packageJson = JSON.parse(fs.readFileSync('package.json'));
    let vsixName = `${packageJson.name}-${packageJson.version}.vsix`;
    if (!process.env.TRAVIS_TAG) {
        if (/^\d+$/.test(process.env.TRAVIS_PULL_REQUEST)) {
            vsixName = `${packageJson.name}-${packageJson.version}-PR#${process.env.TRAVIS_PULL_REQUEST}.vsix`
        } else if (process.env.TRAVIS_BRANCH) {
            vsixName = `${packageJson.name}-${packageJson.version}-${process.env.TRAVIS_BRANCH}-${git.short()}.vsix`
        } else {
            vsixName = `${packageJson.name}-${packageJson.version}-${git.short()}.vsix`;
        }
    }
    return vsixName;
}

gulp.task('package', (done) => {
    vsce.createVSIX({
        packagePath: getVsixName()
    }).then(() => {
        done();
    }, (error) => {
        done(error)
    });
});

gulp.task('upload', (done) => {
    if (!cliArgs.azureConnectionString) {
        done('Missing azure connection string parameter.');
        return ;
    }
    const blobSvc = azure.createBlobService(decodeURIComponent(cliArgs.azureConnectionString));
    const container = process.env.TRAVIS_TAG ? 'vscode-arduino' : 'vscode-arduino-devint';
    blobSvc.createContainerIfNotExists(container, {publicAccessLevel: 'blob'}, (error, result, response) => {
        if (error) {
            done(`Create container failed with error "${error}"`);
        } else {
            const vsixFile = getVsixName();
            blobSvc.createBlockBlobFromLocalFile(container, path.basename(vsixFile), vsixFile, (error, result, response) => {
                if (error) {
                    done(`Failed to upload vsix file "${vsixFile}" to azure blob. See error message "${error}"`);
                } else {
                    done();
                }
            });
        }
    });
});
