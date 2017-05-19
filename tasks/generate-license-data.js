'use strict';

var _ = require('underscore');

module.exports = function(grunt) {
    var LicenseFinder = require('../lib/LicenseFinder')(grunt);

    var DEPENDENCY_TYPE = {
        BUILD_ONLY : 'build-only',
        PRODUCTION : 'production'
    };

    var DEPENDENCY_SCOPE = {
        TOP_LEVEL: 'top-level',
        TRANSITIVE: 'transitive'
    };


    grunt.task.registerMultiTask('generate-license-data', 'A task that generates a list of all the project dependencies (transitive) and ensures that the license is documented.', function() {
        var options = this.options({
            outFile: 'licenses.csv',
            roots: ['.'],
            metadata: {}
        });
        exportAppRoots(options.roots, options.outFile, options.metadata);
    });

    /**
     * appRoots - list of folders to search for libraries
     * fileName - name of result file
     */
    function exportAppRoots(appRoots, fileName, metadata) {
        var licenses = [];
        var errors = [];
        appRoots.forEach(function (appRoot) {
            accumulateNodeLicenses(licenses, errors, appRoot, metadata);
        });
        var sortedResult = licenses.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

        if (errors.length === 0) {
            exportToCsv(sortedResult, fileName);
        } else {
            grunt.log.error('Error generating license data.');
            grunt.log.error(errors.join('\n'));
        }
    }


    function exportToCsv(licenses, fileName) {

        var lines = [];

        for (var key in licenses) {
            if (licenses.hasOwnProperty(key)) {
                var node = licenses[key];
                var name = node.name;
                var version = node.version;
                var url = node.url;
                var type = node.type;
                var scope = node.scope;
                var license;
                var licenseUrl;
                if (typeof node.license === 'string') {
                    license = node.license;
                    licenseUrl = '';
                } else if (node.license.constructor === Array) {
                    license = _(node.license).map(function(it) { return it.type; }).join(', ');
                    licenseUrl = _(node.license).map(function(it) { return it.url; }).join(', ');
                } else {
                    license = node.license.type;
                    licenseUrl = node.license.url;
                }
                lines.push(
                        name + ';' + type + ';' + version + ';' + license + ';' + url + ';' + licenseUrl + ';' + scope);
            }
        }

        var text = lines.join('\n');
        grunt.file.write(fileName, text, { encoding: 'UTF-8' });
    }

    function accumulateNodeLicenses(licenses, errors, rootPath, metadata) {
        var queue = [ {
            path: rootPath,
            dependencyName: 'root',
            dependencyScope: DEPENDENCY_SCOPE.TOP_LEVEL,
            dependencyType: DEPENDENCY_TYPE.PRODUCTION
        } ];

        // Breadth-first search
        while (queue.length > 0) {

            var packageObj = queue.shift();

            var packageFile = packageObj.path + '/package.json';

            // Add children
            if (grunt.file.exists(packageFile)) {
                var packageData = grunt.file.readJSON(packageFile, { encoding: 'UTF-8' });
                for (var dependencyName in packageData.dependencies) {
                    createNodeLicenseEntry(queue,
                                           licenses,
                                           errors,
                                           packageObj.path,
                                           dependencyName,
                                           packageObj.dependencyType,
                                           packageObj.dependencyScope,
                                           metadata);
                }
                // For Node/NPM we need to list the top-level devDependencies, but we do not need transitive ones
                if (packageObj.dependencyScope === DEPENDENCY_SCOPE.TOP_LEVEL) {
                    for (var dependencyName in packageData.devDependencies) {
                        createNodeLicenseEntry(queue,
                                           licenses,
                                           errors,
                                           packageObj.path,
                                           dependencyName,
                                           DEPENDENCY_TYPE.BUILD_ONLY,
                                           packageObj.dependencyScope,
                                           metadata);
                    }
                }
            } else {
                grunt.verbose.writeln('Queue next file not found: ' + packageFile);
            }
        }
    }

    // due to npm the deduplication feature npm package can be found anywhere up the tree
    function nodeTreeWalkUp(path, name) {
        // check if walk is needed
        if (nodePackageExists(path, name)) {
            return path;
        }
        while (path.lastIndexOf('/node_modules') != -1) {
            path = path.substr(0, path.lastIndexOf('/node_modules'));
            if (nodePackageExists(path, name)) {
                return path;
            }
        }
        return undefined;
    }

    function createNodeLicenseEntry(queue, licenses, errors, rootPath, name, dependencyType, dependencyScope, metadata) {
        var path = nodeTreeWalkUp(rootPath, name); 
        // some dependencies are declared but not used within child projects
        if (path === undefined) {
            var optionalDependencies = findAttribute(rootPath + '/package.json', 'optionalDependencies');
            // optional dependencies might not be loaded
            if (optionalDependencies != null && optionalDependencies[name] != null) {
                grunt.verbose.writeln('Node dependency ' + name + ' was declared optional but not found'  + ' when in ' + rootPath);
            } else {
                errors.push('WARNING: Node dependency declared but not used: ' + name + ' when in ' + rootPath);
            }
            return;
        }

        var version = findNodeAttribute(name, path, 'version');
        if (version == null || version.length === 0) {
            errors.push('WARNING: Could not find version of ' + name + ' in ' + path);
            version = '0.0.0';
        }

        var existingNode = _(licenses).find(function(element){
            return element.name == name;
        });

        if (existingNode != null) {
            // ignore the node if it is a duplicate or an older version
            if (existingNode.version.localeCompare(version) >= 0) {
                return;
            }
            // update the existing node if it is newer than this one
            existingNode.version = version;
            existingNode.url = findNodeHomepage(name, path, errors, metadata);
            existingNode.license = findNodeLicense(name, path, errors, metadata);
        } else {
            licenses.push({
                name: name,
                version: version,
                url: findNodeHomepage(name, path, errors, metadata),
                license: findNodeLicense(name, path, errors, metadata),
                type: dependencyType,
                scope: dependencyScope
            });

        }

        // add child to the queue
        queue.push({ path: path + '/node_modules/' + name,
                     dependencyName: name,
                     dependencyScope: DEPENDENCY_SCOPE.TRANSITIVE, // all child dependencies are by definition transitive
                     dependencyType: dependencyType,
                   });
    }

    function nodePackageExists(rootPath, name) {
        var packageDir = rootPath + '/node_modules/' + name;
        return grunt.file.exists(packageDir);
    }

    function findNodeAttribute(name, rootPath, attribute) {
        var packageFile = rootPath + '/node_modules/' + name + '/package.json';
        return findAttribute(packageFile, attribute);
    }

    function findAttribute(packageFile, attribute) {
        if (grunt.file.exists(packageFile)) {
            var packageData = grunt.file.readJSON(packageFile, { encoding: 'UTF-8' });
            if (packageData[attribute] != null) {
                return packageData[attribute];
            }
        } else {
            grunt.log.writeln('file does not exist ' + packageFile)
        }
        return undefined;
    }

    function findNodeLicense(name, rootPath, errors, metadata) {
        var license = findNodeAttribute(name, rootPath, 'licenses');
        if (license != null) {
            return license;
        }
        license = findNodeAttribute(name, rootPath, 'license');
        if (license != null) {
            return license;
        }

        if (grunt.file.exists(rootPath + '/node_modules/' + name + '/MIT-LICENSE.txt')) {
            return 'The MIT License';
        }
        var licenseFiles = [
                rootPath + '/node_modules/' + name + '/LICENSE',
                rootPath + '/node_modules/' + name + '/LICENCE',  // some people misspell this
                rootPath + '/node_modules/' + name + '/LICENSE.txt',
                rootPath + '/node_modules/' + name + '/LICENSE.TXT',
                rootPath + '/node_modules/' + name + '/LICENSE.md',
                rootPath + '/node_modules/' + name + '/README.md',
                rootPath + '/node_modules/' + name + '/Readme.md'
        ];
        return LicenseFinder.discoverLicense(name, licenseFiles, errors, metadata);
    }

    function findNodeHomepage(name, rootPath, errors, metadata) {
        var homepage = findNodeAttribute(name, rootPath, 'homepage');
        if (homepage != null) {
            return homepage;
        }
        if (metadata[name] != null && metadata[name].homepage != null) {
            return metadata[name].homepage;
        }
        errors.push('Could not determine homepage for npm project ' + rootPath + '/node_modules/' + name);
        return 'missing';
    }
};
