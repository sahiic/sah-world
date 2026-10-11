const fs = require('node:fs');
const ts = require('typescript');
module.exports = function load(file, dependencies = {}) {
  const result = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'exports', code)(name => {
    if (!Object.hasOwn(dependencies, name)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, result);
  return result;
};
