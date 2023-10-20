const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildFolderPath = '../dist';

const executeCommand = (command, cwd) => {
  return execSync(command, {
    cwd,
    stdio: 'inherit'
  })
}

const checkDependenciesInFile = (filePath, dependencies) => {
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
  return dependencies.filter((dependency) => new RegExp(`\\(('|")${dependency}(\/([a-zA-Z\d+-_]{1,}))?\\1\\)`, 'm').test(content))
}

const omit = (array1, array2) => {
  const cloned = [...array1];
  array1.length = 0;
  return cloned.reduce((res, item) => {
    if (!array2.includes(item)) {
      res.push(item)
    }
    return res;
  }, array1)
}

const getUnusedDependencies = (dependencies, dirPath) => {
  if (!dependencies.length) return dependencies;

  const buildFiles = fs.readdirSync(dirPath, { withFileTypes: true });
  buildFiles.forEach((dirent) => {
    if (!dependencies.length) return;

    const activePath = path.join(dirPath, dirent.name);
    if (!dirent.isFile()) {
      getUnusedDependencies(dependencies, activePath);
    }
    else if (dirent.name.endsWith('.js')) {
      const depsInFile = checkDependenciesInFile(activePath, dependencies);
      omit(dependencies, depsInFile);
    }
  });

  return dependencies;
}

const uninstallDependencies = (dependencies) => {
  dependencies.forEach((dependency) => {
    try {
      console.log(`Uninstalling unused dependency "${dependency}"`);
      executeCommand(`npm --prefix ./dist uninstall ${dependency}`);
    } catch { }
  })
}

const removeUnusedFilesInBuild = () => {
  const packageJson = require(path.join(__dirname, buildFolderPath, 'package.json'));
  const { dependencies = {} } = packageJson;
  const dependenciesList = Object.keys(dependencies);

  const buildSrcPath = path.join(__dirname, buildFolderPath, 'src');

  const unusedDependencies = getUnusedDependencies(dependenciesList, buildSrcPath);

  if (unusedDependencies.length) {
    uninstallDependencies(unusedDependencies);
  }
}

const moveModulesToDist = () => {
  fs.cpSync('./node_modules', './dist/node_modules', { recursive: true });
  fs.cpSync('./package.json', './dist/package.json');
}

(() => {
  // move node_modules from root folder to dist
  moveModulesToDist()
  // to reduce build size
  removeUnusedFilesInBuild()

  try {
    // remove dev dependencies from the dist folder
    executeCommand('npm --prefix ./dist prune --omit=dev');
  } catch { }
})()