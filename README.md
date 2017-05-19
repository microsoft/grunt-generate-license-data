# grunt-generate-license-data

A grunt plugin to list npm packages' dependencies.

Example output:
```
backbone;production;0.0.1;MIT;https://github.com/jashkenas/backbone;;top-level
jquery;production;3.0.0;MIT;https://github.com/jquery/jquery;;transitive
mocha;build-only;0.0.2;MIT;https://github.com/mochajs/mocha;;top-level
underscore;build-only;1.0.0;MIT;https://github.com/jashkenas/underscore;;transitive
```

## Getting Started

This plugin requires [Grunt](http://gruntjs.com/)

```
npm install grunt-generate-license-data --save-dev
```

Once the plugin has been installed, it may be enabled inside Gruntfile:

```
grunt.loadNpmTasks("grunt-generate-license-data");
```

## The "generate-license-data" task

### Overview

In `Gruntfile.js`, add a section named `generate-license-data`:

```js
grunt.initConfig({
    'generate-license-data': {
        all: {
            options: {
                // options go here
            }
        }
    }
});
```

### Options

* `options.outFile: string` - name of output file. Defaults to `licenses.csv`.
* `options.roots: string[]` - array of folders with root npm packages. Defaults to ['.'].
* `options.metadata: { [packageName: string]: { homepage: string, license: string } }` - explicitly provide license or homepage.

### Usage Example

```js
grunt.initConfig({
    'generate-license-data': {
        all: {
            options: {
                outFile: 'export.csv',
                roots: [ 'module1', 'module2' ],
                metadata: {
                    backbone: {
                        license: 'MIT'
                    }
                }
            }
        }
    }
});
```

### Running
Make sure npm packages are up-to-date `npm install` and `npm prune`. Then:
```
grunt generate-license-data
```

# Contributing

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
