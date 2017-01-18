const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const vsce = require('vsce');
var git = require('git-rev-sync');
const cliArgs = require('yargs').argv;
const azure = require('azure-storage');
const glob = require('glob');
const async = require('async');

function getVsixName() {
    const packageJson = JSON.parse(fs.readFileSync('package.json'));
    let vsixName = `${packageJson.name}-${packageJson.version}.vsix`;
    if (!cliArgs.tag) {
        if (/^\d+$/.test(cliArgs.pullRequest)) {
            vsixName = `${packageJson.name}-${packageJson.version}-PR${cliArgs.pullRequest}.vsix`
        } else if (cliArgs.branch) {
            vsixName = `${packageJson.name}-${packageJson.version}-${cliArgs.branch}-${git.short()}.vsix`
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
        done('Missing connection string parameter.');
        return ;
    }
    const blobSvc = azure.createBlobService(cliArgs.azureConnectionString);
    const container = cliArgs.tag ? 'vscode-arduino' : 'vscode-arduino-devint';
    blobSvc.createContainerIfNotExists(container, {publicAccessLevel: 'blob'}, (error, result, response) => {
        if (error) {
            done(`Create container failed with error "${error}"`);
        } else {
            glob("**/*.vsix", (error, files) => {
                if (error) {
                    done(error);
                    return;
                }
                const tasks = [];
                files.forEach(file => {
                    tasks.push(callback => {
                        blobSvc.createBlockBlobFromLocalFile(container, path.basename(file), file, (error, result, response) => {
                            if (error) {
                                callback(`Upload binary file "${file}" to azure blob failed.`);
                            } else {
                                callback();
                            }
                        });
                    });
                });
                async.series(tasks, done);
            });
        }
    });
});
