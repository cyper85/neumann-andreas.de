// Builds css/, js/freelancer.min.js and vendor/
// NOTE: requires `npm install` before running!
const fs = require('fs');
const path = require('path');
const sass = require('sass');
const CleanCSS = require('clean-css');
const esbuild = require('esbuild');
const { PurgeCSS } = require('purgecss');
const pkg = require('./package.json');

const banner = '/*!\n' +
  ' * Based on Start Bootstrap - Freelancer (https://startbootstrap.com/theme/freelancer)\n' +
  ' * Copyright 2013-' + new Date().getFullYear() + ' Start Bootstrap\n' +
  ' * Licensed under ' + pkg.license + ' (https://github.com/StartBootstrap/startbootstrap-freelancer/blob/master/LICENSE)\n' +
  ' */\n';

// Bootstrap components used by index.html and js/freelancer.js
const bootstrapComponents = ['collapse', 'modal', 'scrollspy'];

// Self-hosted web fonts (no requests to Google Fonts)
const fonts = [
  'montserrat/400', 'montserrat/700',
  'lato/400', 'lato/700', 'lato/400-italic', 'lato/700-italic'
];

async function build() {
  // Copies the font files into vendor/fonts/files and collects their @font-face rules
  fs.rmSync('vendor', { recursive: true, force: true });
  fs.mkdirSync('vendor/fonts/files', { recursive: true });
  let fontCss = '';
  for (const font of fonts) {
    const css = fs.readFileSync(path.join('node_modules/@fontsource', font + '.css'), 'utf8');
    for (const [, file] of css.matchAll(/url\(\.\/files\/([^)]+)\)/g)) {
      fs.copyFileSync(path.join('node_modules/@fontsource', path.dirname(font), 'files', file),
        path.join('vendor/fonts/files', file));
    }
    fontCss += css.replace(/url\(\.\/files\//g, 'url(../vendor/fonts/files/') + '\n';
  }

  // Compiles Bootstrap and the SCSS files from /scss into /css, adds the fonts,
  // removes the CSS rules not used by the page and minifies the result
  fs.mkdirSync('css', { recursive: true });
  const compiled = fontCss + sass.compile('scss/freelancer.scss', {
    style: 'expanded',
    loadPaths: ['node_modules'],
    quietDeps: true,
    silenceDeprecations: ['import', 'color-functions', 'global-builtin']
  }).css;
  const [purged] = await new PurgeCSS().purge({
    content: [
      'index.html',
      'js/freelancer.js',
      // classes toggled by Bootstrap's JavaScript (show, collapsing, modal-open, ...)
      ...bootstrapComponents.map((c) => `node_modules/bootstrap/js/src/${c}.js`),
      'node_modules/bootstrap/js/src/util/backdrop.js'
    ],
    css: [{ raw: compiled }]
  });
  const css = banner + purged.css + '\n';
  fs.writeFileSync('css/freelancer.css', css);
  fs.writeFileSync('css/freelancer.min.css', new CleanCSS({ level: 1 }).minify(css).styles);

  // Bundles the needed Bootstrap components (as global `bootstrap`) with the custom JS
  const bundle = await esbuild.build({
    stdin: {
      contents: bootstrapComponents.map((c) =>
        `export { default as ${c === 'scrollspy' ? 'ScrollSpy' : c[0].toUpperCase() + c.slice(1)} } from 'bootstrap/js/src/${c}.js';`).join('\n'),
      resolveDir: __dirname
    },
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'bootstrap',
    target: 'es2019',
    write: false
  });
  const custom = await esbuild.transform(fs.readFileSync('js/freelancer.js', 'utf8'), { minify: true, target: 'es2019' });
  fs.writeFileSync('js/freelancer.min.js', banner +
    '/*! Bootstrap (https://getbootstrap.com/) | MIT License (https://github.com/twbs/bootstrap/blob/main/LICENSE) */\n' +
    bundle.outputFiles[0].text + custom.code);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
