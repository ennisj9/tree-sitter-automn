const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const Parser = require("tree-sitter");
const Automn = require("bindings/node/index.js");

const runGenerate = async () => {
  const { error, stdout, stderr } = await exec("tree-sitter generate");
  if (error) {
    console.error("tree-sitter generate ERROR");
    console.log(`exec error:\n ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
};
runGenerate();

const run = async () => {
  await runGenerate();
  const parser = new Parser();
  parser.setLanguage(Automn);
  const tree = parser.parse("Model");
  console.log(tree.rootNode.toString());
};
run();
