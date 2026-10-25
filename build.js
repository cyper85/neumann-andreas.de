// Builds css/, js/freelancer.min.js and vendor/
// NOTE: requires `npm install` before running!
const fs = require('fs');
const path = require('path');
const sass = require('sass');
const CleanCSS = require('clean-css');
const { minify } = require('terser');
const pkg = require('./package.json');

const banner = '/*!\n' +
  ' * Based on Start Bootstrap - Freelancer (https://startbootstrap.com/theme/freelancer)\n' +
  ' * Copyright 2013-' + new Date().getFullYear() + ' Start Bootstrap\n' +
  ' * Licensed under ' + pkg.license + ' (https://github.com/StartBootstrap/startbootstrap-freelancer/blob/master/LICENSE)\n' +
  ' */\n';

// Copies files from src into dest; filter receives the path relative to src
function copy(src, dest, filter = () => true) {
  src = path.join('node_modules', src);
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (file) => {
      const rel = path.relative(src, file).split(path.sep).join('/');
      return rel === '' || fs.statSync(file).isDirectory() || filter(rel);
    }
  });
}

async function build() {
  // Compiles Bootstrap and the SCSS files from /scss into /css and minifies them
  fs.mkdirSync('css', { recursive: true });
  const css = banner + sass.compile('scss/freelancer.scss', {
    style: 'expanded',
    loadPaths: ['node_modules'],
    quietDeps: true,
    silenceDeprecations: ['import', 'color-functions', 'global-builtin']
  }).css + '\n';
  fs.writeFileSync('css/freelancer.css', css);
  fs.writeFileSync('css/freelancer.min.css', new CleanCSS({ level: 1 }).minify(css).styles);

  // Minify custom JS
  const js = await minify(fs.readFileSync('js/freelancer.js', 'utf8'));
  fs.writeFileSync('js/freelancer.min.js', banner + js.code);

  // Copy vendor files from /node_modules into /vendor
  fs.rmSync('vendor', { recursive: true, force: true });
  copy('bootstrap/dist/js', 'vendor/bootstrap/js', (f) => /^bootstrap\.bundle(\.min)?\.js$/.test(f));
  copy('@fortawesome/fontawesome-free', 'vendor/fontawesome', (f) =>
    /^(css\/all(\.min)?\.css|webfonts\/.*|LICENSE\.txt)$/.test(f));
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
