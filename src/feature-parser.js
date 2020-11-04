import * as fs from "fs-extra";
import * as glob from "glob";
import * as path from "path";
import Parser from "gherkin/dist/src/Parser";
import AstBuilder from "gherkin/dist/src/AstBuilder";
import { IdGenerator } from "cucumber-messages";

const FEATURE_PATH_GLOB = path.join(process.cwd(), "features/**/*.feature");
const EXT_JSON = ".json";
const OUTPUT_DIR = path.join(process.cwd(), "output");
const OUTPUT_RAW_DOCS_DIR = path.join(OUTPUT_DIR, "raw");
const OUTPUT_PARSED_NAME = "parsed" + EXT_JSON;

function stringify(object) {
  return JSON.stringify(object, null, 2);
}

function logger(name, object) {
  name = name.toUpperCase();
  console.log("--------------------------------------------------------");
  console.log(name + ": begin");
  console.log("--------------------------------------------------------");
  console.log(stringify(object));
  console.log("--------------------------------------------------------");
  console.log(name + ": end");
  console.log("--------------------------------------------------------");
}

export default () => {
  // Prep work
  fs.removeSync(OUTPUT_DIR);
  fs.mkdirsSync(OUTPUT_DIR);

  // Get all feature files
  const files = glob.sync(FEATURE_PATH_GLOB);

  // Parse em!
  const parsed = files.map((file) => {
    const featureFile = path.parse(path.relative(process.cwd(), file));

    // simply read the file contents
    const contents = fs.readFileSync(file).toString();
    // create a gherkin document object from the contents above
    const document = new Parser(new AstBuilder(IdGenerator.uuid())).parse(contents);

    // pipe to json file purely for reference
    const documentOutPath = path.join(OUTPUT_RAW_DOCS_DIR, featureFile.dir);
    fs.mkdirsSync(documentOutPath);
    fs.writeFileSync(path.join(documentOutPath, featureFile.name + EXT_JSON), stringify(document));

    // properties
    const tags = (document.feature.tags || []).map((tag) => tag.name);
    const title = document.feature.name || "";
    const description = document.feature.description || "";
    const children = document.feature.children || []; // Background or Scenario

    // utils
    const tableBuilder = (object) => {
      const output = [];

      if (object) {
        if (object.tableHeader) {
          // example table
          output.push(object.tableHeader.cells.map((cell) => cell.value));
          object.tableBody.forEach((row) => output.push(row.cells.map((cell) => cell.value)));
        } else {
          // data table
          object.forEach((row) => output.push(row.cells.map((cell) => cell.value)));
        }
      }

      return output;
    };
    const stepsBuilder = (object) => {
      return object.map((step) => ({
        text: step.keyword + step.text,
        data: step.dataTable ? tableBuilder(step.dataTable.rows) : step.docString ? step.docString.content : undefined
      }));
    };

    const background = children
      .filter((child) => child.background)
      .map((child) => {
        const background = child.background;
        const steps = stepsBuilder(background.steps);

        return {
          steps: steps
        };
      })[0];

    const scenarios = children
      .filter((child) => child.scenario)
      .map((child) => {
        const scenario = child.scenario;
        const tags = (scenario.tags || []).map((tag) => tag.name);
        const type = scenario.keyword; // Scenario or Scenario Outline
        const title = scenario.name;
        const steps = stepsBuilder(scenario.steps);
        const examples = tableBuilder((scenario.examples || [])[0]);

        return {
          tags: tags,
          type: type,
          title: title,
          steps: steps,
          examples: examples
        };
      });

    return {
      tags: tags,
      title: title,
      description: description,
      background: background,
      scenarios
    };
  });

  const output = path.join(OUTPUT_DIR, OUTPUT_PARSED_NAME);
  fs.writeFileSync(output, stringify(parsed));
  console.log(`
  Finished!
  
  Parsed output (raw minus all the noise): ${output}
  Raw gherkin documents for reference: ${OUTPUT_RAW_DOCS_DIR}
  `);
};
