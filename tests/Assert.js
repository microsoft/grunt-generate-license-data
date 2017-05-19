const assert = require('assert');

module.exports = function(grunt) {
    grunt.task.registerMultiTask('assert-generate-license-data', 'A task that asserts results are equal.', function() {
        var options = this.options();
        var expected = grunt.file.read(options.expected, { encoding: 'UTF-8' });
        var actual = grunt.file.read(options.actual, { encoding: 'UTF-8' });
        assert.equal(actual, expected, 'Result of ' + options.expected + ' is not equal to ' + options.actual);
    });
}
