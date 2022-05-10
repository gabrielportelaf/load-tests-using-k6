const reporter = require('k6-html-reporter');

const options = {
        jsonFile: "report.json",
        output: `report/`,
    };

reporter.generateSummaryReport(options);