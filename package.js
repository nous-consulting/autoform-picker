Package.describe({
  name: 'chompomonim:autoform-picker',
  summary: 'Collection document picker with document creation possibility.',
  version: '0.2.8',
  git: 'https://github.com/nous-consulting/autoform-picker',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('templating');
  api.use('blaze');
  api.use('coffeescript');
  api.use('reactive-var');
  api.use('twbs:bootstrap@3.3.4');
  api.use('matb33:collection-hooks@0.7.7');
  api.use('aldeed:template-extension');
  api.use('meteorhacks:npm@1.3.0');
  api.use('aldeed:autoform@5.0.0');
  api.addFiles([
    'autoform-picker.html',
    'autoform-picker.coffee',
    'autoform-picker.css',
    'utils.coffee'
    ], 'client');
  api.addFiles([
    'searchIn.coffee',
    ], 'server');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('chompomonim:autoform-picker');
  api.addFiles('autoform-picker-tests.js');
});
