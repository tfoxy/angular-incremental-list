(function() {
  'use strict';

  function Page() {
    this.anotherInput = element(by.id('another-input'));
    this.listInputs = element.all(by.css('ul li'));
  }

  Page.prototype.getInput = function getInput(index) {
    return element(by.css('[title="i' + index + '"]'));
  };

  module.exports = Page;
})();
