Package.describe({
  name: 'nous:autoform-picker',
  summary: 'Picker is a select component for autoform with new database entrance creation possibility.',
  version: '1.0.1',
  git: 'https://github.com/nous-consulting/autoform-picker',
  documentation: 'README.md'
});

Npm.depends({
  lodash: '4.12.0',
  jquery: '2.2.3'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.2.4');
  api.use([
    'ecmascript',
    'templating',
    'blaze',
    'reactive-var',

    'twbs:bootstrap@3.3.4',
    'aldeed:template-extension@4.0.0',
    'aldeed:autoform@5.0.0',
    'nous:search-in@0.1.0'
  ]);
  api.addFiles([
    'src/template.html',
    'src/styles.css'
    ], 'client');
  api.mainModule('src/main.js', 'client');
  api.mainModule('src/methods.js', 'server');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('nous:autoform-picker');
  api.addFiles('autoform-picker-tests.js');
});
