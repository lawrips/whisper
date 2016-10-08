'use strict';

const path = require('path'),
    fs = require('fs'),
    Handlebars = require('handlebars');

// register helpers
Handlebars.registerHelper('ifvalue', (conditional, options) => {
  if (options.hash.value === conditional) {
    return options.fn(this)
  } else {
    return options.inverse(this);
  }
});


// register partials
fs.exists(path.join(__dirname, '../views/custom/footer.html'), (exists) => {
    if (!exists) return;
    Handlebars.registerPartial('footer', () => partial('footer.html'));
});

fs.exists(path.join(__dirname, '../views/custom/header.html'), (exists) => {
    if (!exists) return;
    Handlebars.registerPartial('header', () => partial('header.html'));
});

fs.exists(path.join(__dirname, '../views/custom/notices.html'), (exists) => {
    if (!exists) return;
    Handlebars.registerPartial('notices', () => partial('notices.html'));
});

function partial (file) {
    return fs.readFileSync(path.join(__dirname, '../views/custom/' + file)); 
}
