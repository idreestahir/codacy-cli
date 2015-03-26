require('pkginfo')(module, 'version');

var program = require('commander');
var appVersion = module.exports.version;
var options = getConfig();
var api = require('./api.js')(options.apiToken);
var apiv2 = require('./apiV2.js')(options.apiToken);

program.version(appVersion);
program.usage('[options]');

program
  .option('-c, --config [file]', 'Load the specified configuration file')
  .option('-o, --output [format]', 'Select the output format. Choices are "json", "table" and "raw". Defaults to "raw".')
  .option('-l, --projects', 'List projects')
  .option('-p, --project [id]', 'Set project id')
  .option('-O, --projectOwner [id]', 'Set project owner')
  .option('-N, --projectName [id]', 'Set project name')
  .option('-C, --commit [uuid]', 'Se commit uuid')
  .option('-a, --analyse [file]', 'Analyse the specified file or directory');

program.on('--help', function () {
  console.log('For support, email team@codacy.com');
});

program.parse(process.argv);

function getConfig() {
  var configFilePath = program.config;
  var config = require('./config.js');

  return config.readConfig(configFilePath);
}

function prepareResponse(program) {
  var formatter = require('./formatter.js')(program.output);

  if (isSet(program.projectOwner) && isSet(program.projectName) && isSet(program.commit)) {
    commitByName(formatter, program.projectOwner, program.projectName, program.commit);
  } else if (isSet(program.project) && isSet(program.commit)) {
    commit(formatter, program.project, program.commit);
  } else if (isSet(program.project)) {
    project(formatter, program.project);
  } else if (program.analyse) {
    analyse(formatter, program)
  } else if (program.projects) {
    projects(formatter);
  } else {
    program.help();
  }
}

function projects(formatter) {
  var result = api.getProjects();
  formatter.print(result);
}

function project(formatter, projectId) {
  var result = api.getProject(projectId);
  formatter.print(result);
}

function commit(formatter, projectId, commitUUID) {
  var result = apiv2.getCommit(projectId, commitUUID);
  formatter.printCommitOverview(result);
}

function commitByName(formatter, projectOwner, projectName, commitUUID) {
  var result = apiv2.getByNameCommit(projectOwner, projectName, commitUUID);
  formatter.printCommitOverview(result);
}

function analyse(formatter) {
  var analysis = require('./analysis.js')(api);
  var result = analysis.analyseFile(program.analyse);
  formatter.print(result);
}

function isSet(param) {
  return param && param.length > 0;
}

function main(program) {
  prepareResponse(program);

  process.exit(0);
}

main(program);
