'use strict';

const { Directory } = require('@vamship/grunt-utils');
const _path = require('path');

// -------------------------------------------------------------------------------
//  Help documentation
// -------------------------------------------------------------------------------
//prettier-ignore
const HELP_TEXT =
'--------------------------------------------------------------------------------\n' +
' Defines tasks that are commonly used during the development process. This      \n' +
' includes tasks for linting, building and testing.                              \n' +
'                                                                                \n' +
' Supported Tasks:                                                               \n' +
'   [default]         : Shows help documentation.                                \n' +
'                                                                                \n' +
'   help              : Shows this help message.                                 \n' +
'                                                                                \n' +
'   format            : Formats source and test files.                           \n' +
'                                                                                \n' +
'   packge            : Packges the api server into a docker container. This     \n' +
'                       task assumes that the server has been built, and prepared\n' +
'                       for distribution.                                        \n' +
'                                                                                \n' +
'   publish[:[tags]]  : Publishes a packaged docker container to a docker        \n' +
'                       registry. This assumes that docker credentials have been \n' +
'                       setup correctly, and that the package has already been   \n' +
'                       created using the package task.                          \n' +
'                       This task accepts additional tags to associate with the  \n' +
'                       repo when publishing. The image is always tagged and     \n' +
'                       published with the current project version whether or    \n' +
'                       not any additional tags are specified.                   \n' +
'                                                                                \n' +
'   bump:[major|minor]: Updates the version number of the package. By default,   \n' +
'                       this task only increments the patch version number. Major\n' +
'                       and minor version numbers can be incremented by          \n' +
'                       specifying the "major" or "minor" subtask.               \n' +
'                                                                                \n' +
' IMPORTANT: Please note that while the grunt file exposes tasks in addition to  \n' +
' ---------  the ones listed below (no private tasks in grunt yet :( ), it is    \n' +
'            strongly recommended that just the tasks listed below be used       \n' +
'            during the dev/build process.                                       \n' +
'                                                                                \n' +
'--------------------------------------------------------------------------------';

module.exports = function(grunt) {
    /* ------------------------------------------------------------------------
     * Initialization of dependencies.
     * ---------------------------------------------------------------------- */
    //Load all grunt tasks by reading package.json. Ignore @vamshi/grunt-utils,
    //which is actually a utility library and not a grunt task.
    require('load-grunt-tasks')(grunt, {
        pattern: ['grunt-*', '@vamship/grunt-*', '!@vamship/grunt-utils']
    });

    /* ------------------------------------------------------------------------
     * Project structure and static parameters.
     * ---------------------------------------------------------------------- */
    const PROJECT = Directory.createTree('./', {
        src: null,
        node_modules: null
    });

    const packageConfig = grunt.file.readJSON('package.json') || {};

    PROJECT.appName = packageConfig.name || '__UNKNOWN__';
    PROJECT.version = packageConfig.version || '__UNKNOWN__';
    PROJECT.unscopedName = PROJECT.appName.replace(/^@[^/]*\//, '');
    PROJECT.unscopedName = PROJECT.unscopedName.replace(/-container/, '');
    PROJECT.dockerRepo = `${PROJECT.appName
        .replace(/^@/, '')
        .replace(/-container/, '')}`;
    PROJECT.dockerTag = `${PROJECT.dockerRepo}:${PROJECT.version}`;

    // Shorthand references to key folders.
    const SRC = PROJECT.getChild('src');
    const NODE_MODULES = PROJECT.getChild('node_modules');

    /* ------------------------------------------------------------------------
     * Grunt task configuration
     * ---------------------------------------------------------------------- */
    grunt.initConfig({
        /**
         * Configuration for grunt-prettier, which is used to:
         *  - Format javascript source code
         */
        prettier: {
            files: {
                src: ['README.md', 'Gruntfile.js', SRC.getAllFilesPattern('ts')]
            }
        },

        /**
         * Configuration for grunt-shell, which is used to execute:
         * - Build docker images using the docker cli
         * - Publish docker images to ECR
         */
        shell: {
            dockerBuild: {
                command: `docker build --rm --tag ${
                    PROJECT.dockerTag
                } ${__dirname} --build-arg APP_NAME=${
                    PROJECT.unscopedName
                } --build-arg APP_VERSION=${
                    PROJECT.version
                } --build-arg BUILD_TIMESTAMP=${Date.now()}`
            },
            dockerPublish: {
                command: `docker push ${PROJECT.dockerTag}`
            },
            dockerTagAndPublish: {
                command: (tag) => {
                    tag = tag || PROJECT.version;
                    const targetTag = `${PROJECT.dockerRepo}:${tag}`;
                    return [
                        `docker tag ${PROJECT.dockerTag} ${targetTag}`,
                        `docker push ${targetTag}`
                    ].join('&&');
                }
            }
        },

        /**
         * Configuration for grunt-bump, which is used to:
         *  - Update the version number on package.json
         */
        bump: {
            options: {
                push: false,
                prereleaseName: 'rc'
            }
        }
    });

    /* ------------------------------------------------------------------------
     * Task registrations
     * ---------------------------------------------------------------------- */
    /**
     * Formatter task - formats all source and test files.
     */
    grunt.registerTask('format', ['prettier']);

    /**
     * Packaging task - packages the application for release by building a
     * docker container.
     */
    grunt.registerTask('package', ['shell:dockerBuild']);

    /**
     * Publish task - publishes an packaged image to the docker registry.
     */
    grunt.registerTask('publish', (...tags) => {
        const tasks = ['shell:dockerPublish'].concat(
            tags.map((tag) => `shell:dockerTagAndPublish:${tag}`)
        );
        grunt.task.run(tasks);
    });

    /**
     * Shows help information on how to use the Grunt tasks.
     */
    grunt.registerTask('help', 'Displays grunt help documentation', () => {
        grunt.log.writeln(HELP_TEXT);
    });

    /**
     * Default task. Shows help information.
     */
    grunt.registerTask('default', ['help']);
};
