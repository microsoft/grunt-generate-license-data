'use strict';

var _ = require('underscore');

module.exports = function(grunt) {
    var LICENSE_REGEXES = [
        [/^\s*Apache License\s+Version 2\.0/m, 'Apache License Version 2.0'],
        [/^The BSD License$/m, 'The BSD License'],
        [/^\(The BSD License\)$/m, 'The BSD License'],
        [/^The ISC License$/m, 'The ISC License'],
        [/^\(The MIT License\)$/m, 'The MIT License'],
        [/^MIT License - http.*/m, 'The MIT License'],
        [/^# MIT License$/m, 'The MIT License'],
        [/^MIT License$/m, 'The MIT License'],
        [/^.* is licensed under the MIT license\.$/m, 'The MIT License'],
        [/^\(The MIT License\)$/m, 'The MIT License'],
        [/^The MIT License \(MIT\)$/m, 'The MIT License'],
        [/^Licensed under the MIT license.*$/m, 'The MIT License'],
        [/^## LICENSE - "MIT License"$/m, 'The MIT License'],
        [/^#### License: MIT$/m, 'The MIT License'],
        [/^MIT: http.*/m, 'The MIT License'],
        [/^\/\/ MIT License$/m, 'The MIT License'],
        [/## License\s*^MIT\s.\s/m, 'The MIT License'], // sometimes a copyright symbol is directly in the text
        [/## License\s*^\s*MIT$/m, 'The MIT License'],
        [/^\(c\).*, MIT license\.$/m, 'The MIT License'],
        [/^All the plugins are released under the MIT license\.$/m, 'The MIT License'],
        [/^\This software is released under the MIT license:$/m, 'The MIT License'],
        [/^\MIT \+no-false-attribs License$/m, 'MIT +no-false-attribs License'],
        [/^This project is free software released under the MIT\/X11 license:$/m, 'MIT/X11 License'],
        [/^# license\s*^MIT\/X11$/m, 'MIT/X11 License'],
        [/.*BSD and MIT licenses.*/m, 'BSD and MIT License'],
        [/^Mozilla Public License Version 2\.0$/m, 'Mozilla Public License Version 2.0'],
    ];
    
    function extractLicenseName(fileName) {
        if (grunt.file.exists(fileName)) {
            var text = grunt.file.read(fileName, { encoding: 'UTF-8' });
            var type = _(LICENSE_REGEXES).find(function(regex) {
                return regex[0].test(text);
            });
            if (type != null) {
                return type[1]; // index 0 is the regex, index 1 is the replacement (see LICENSE_REGEXES)
            }
        }
        return null;
    }

    function discoverLicense(name, licenseFiles, errors, metadata) {
        for (var index in licenseFiles) {
            var licenseFile = licenseFiles[index];
            var type = extractLicenseName(licenseFile);
            if (type != null) {
                return type;
            }
        }
        // as a last resort, hard code a license type based on the project website
        if (metadata[name] != null && metadata[name].license != null) {
            return metadata[name].license;
        }

        var scannedFiles = _(licenseFiles).filter(function(fileName) { return grunt.file.exists(fileName); });
        if (scannedFiles.length > 0){
            errors.push('Could not determine license type from file: \n\t' + scannedFiles.join('\n\t'));
        } else {
            errors.push('Could not read license file. Nothing found searching: \n\t' + licenseFiles.join('\n\t'));
        }
        return 'missing';
    }

    return {
        discoverLicense: discoverLicense
    }
};