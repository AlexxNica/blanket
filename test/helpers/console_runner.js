/**
 Jasmine Reporter that outputs test results to the browser console.
 Useful for running in a headless environment such as PhantomJs, ZombieJs etc.

 Usage:
 // From your html file that loads jasmine:
 jasmine.getEnv().addReporter(new jasmine.ConsoleReporter());
 jasmine.getEnv().execute();
*/
(function(jasmine, console) {
  if (!jasmine) {
    throw "jasmine library isn't loaded!";
  }

  function size(obj) {
    var _size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) _size++;
    }
    return _size;
  }

  var ANSI = {};
  ANSI.color_map = {
      "green" : 32,
      "red"   : 31
  };

  ANSI.colorize_text = function(text, color) {
    var color_code = this.color_map[color];
    return "\033[" + color_code + "m" + text + "\033[0m";
  };
  
  var ConsoleReporter = function() {
    if (!console || !console.log) { throw "console isn't present!"; }
    this.status = this.statuses.stopped;
  };

  var proto = ConsoleReporter.prototype;
  proto.statuses = {
    stopped : "stopped",
    running : "running",
    fail    : "fail",
    success : "success"
  };

  proto.reportRunnerStarting = function(runner) {
    this.status = this.statuses.running;
    this.start_time = (new Date()).getTime();
    this.executed_specs = 0;
    this.passed_specs = 0;
    this.log("Starting...");
  };

  proto.reportRunnerResults = function(runner) {
    if (typeof window.blanketTestJasmineExpected !== 'undefined' && size(window._$blanket) !== window.blanketTestJasmineExpected){
       this.log("Not all specs were covered. Expected "+window.blanketTestJasmineExpected+" but saw "+size(window._$blanket));
       this.status = this.statuses.fail;
       this.log("");
       this.log("ConsoleReporter finished");
       return;
    }
    var failed = this.executed_specs - this.passed_specs;
    var spec_str = this.executed_specs + (this.executed_specs === 1 ? " spec, " : " specs, ");
    var fail_str = failed + (failed === 1 ? " failure in " : " failures in ");
    var color = (failed > 0)? "red" : "green";
    var dur = (new Date()).getTime() - this.start_time;

    this.log("");
    this.log("Finished");
    this.log("-----------------");
    this.log(spec_str + fail_str + (dur/1000) + "s.", color);

    this.status = (failed > 0)? this.statuses.fail : this.statuses.success;

    /* Print something that signals that testing is over so that headless browsers
       like PhantomJs know when to terminate. */
    this.log("");
    this.log("ConsoleReporter finished");
  };


  proto.reportSpecStarting = function(spec) {
    this.executed_specs++;
  };

  proto.reportSpecResults = function(spec) {
    if (spec.results().passed()) {
      this.passed_specs++;
      return;
    }

    var resultText = spec.suite.description + " : " + spec.description;
    this.log(resultText, "red");

    var items = spec.results().getItems();
    for (var i = 0; i < items.length; i++) {
      var trace = items[i].trace.stack || items[i].trace;
      this.log(trace, "red");
    }
  };

  proto.reportSuiteResults = function(suite) {
    if (!suite.parentSuite) { return; }
    var results = suite.results();
    var failed = results.totalCount - results.passedCount;
    var color = (failed > 0)? "red" : "green";
    this.log(suite.description + ": " + results.passedCount + " of " + results.totalCount + " passed.", color);
  };

  proto.log = function(str, color) {
    var text = (color !== undefined)? ANSI.colorize_text(str, color) : str;
    console.log(text);
  };

  function cssLog(str, color) {
    if (color !== undefined) {
        console.log('%c' + str, 'color: ' + color);
    } else {
        console.log(str);
    }
  };

  function isExplorerConsole() {
    if (!window || !window.console) {
      return;
    }
    return window.console.clear;
  }
  function logTypes(str, color) {
    if (color === undefined) {
      console.log(str);
    }
    if (color === 'green') {
      console.info(str);
    }
    if (color === 'red') {
      console.error(str);
    }
  }
  if (isExplorerConsole()) {
    proto.log = logTypes;
  }

  function isChromeConsole() {
    if (!window) {
      return;
    }
    return !!window.chrome;
  }
  if (isChromeConsole()) {
    proto.log = cssLog;
  }

  function isFirefoxConsole() {
    if (!window || !window.console) {
      return;
    }
    return window.console.firebug || window.console.exception;
  }
  if (isFirefoxConsole()) {
    proto.log = cssLog;
  }

  jasmine.ConsoleReporter = ConsoleReporter;
})(jasmine, console);
