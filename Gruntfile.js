module.exports = function(grunt) {
  var DIST = 'dist';
  grunt.initConfig({
    'generate-license-data': {
        'test-npm-nested': {
          options: {
              roots: ['tests/test-npm-nested'],
              outFile: DIST + '/licenses-test-npm-nested.csv'
          }
        },
        'test-npm-optimized': {
          options: {
              roots: ['tests/test-npm-optimized'],
              outFile: DIST + '/licenses-test-npm-optimized.csv'
          }
        }
    },
    'assert-generate-license-data': {
        'test-npm-nested': {
          options: {
              expected: 'tests/test-npm-nested/licenses.csv',
              actual: DIST + '/licenses-test-npm-nested.csv'
          }
        },
        'test-npm-optimized': {
          options: {
              expected: 'tests/test-npm-optimized/licenses.csv',
              actual: DIST + '/licenses-test-npm-optimized.csv'
          }
        }
    }
  });

  grunt.loadTasks('tasks');
  grunt.loadTasks('tests');

  grunt.registerTask('tests', 'Tests generate license data', [
      'generate-license-data:test-npm-nested',
      'assert-generate-license-data:test-npm-nested',
      'generate-license-data:test-npm-optimized',
      'assert-generate-license-data:test-npm-optimized'
  ]);
}
