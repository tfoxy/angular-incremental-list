describe('il-enable-has-focus spec:', function() {
  'use strict';

  var Page = require('./po.js');
  var page = new Page();

  describe('list', function() {

    beforeEach(function() {
      browser.get('enable-has-focus.html');
    });

    it('grows when focused on the last item', function() {
      page.getInput(0).sendKeys('123');
      page.getInput(1).sendKeys('2');
      page.getInput(2).click();
      expect(page.listInputs.count()).toBe(4);
    });

    it('grows multiple times when focused on the last item', function() {
      page.getInput(0).sendKeys('123');
      page.getInput(1).sendKeys('2');
      page.getInput(2).click();
      page.getInput(3).click();
      page.getInput(4).click();
      expect(page.listInputs.count()).toBe(6);
    });

    it('is shrinked when focused on another item', function() {
      page.getInput(0).sendKeys('1');
      page.getInput(1).sendKeys('2');
      page.getInput(2).click();
      page.getInput(3).click();
      page.getInput(4).click();
      page.getInput(5).click();
      page.getInput(3).click();
      expect(page.listInputs.count()).toBe(5);
    });

    it('is shrinked when focused outside the list (blurred)', function() {
      page.getInput(0).sendKeys('1');
      page.getInput(1).sendKeys('2');
      page.getInput(2).click();
      page.getInput(3).click();
      page.getInput(4).click();
      page.getInput(5).click();
      page.anotherInput.click();
      expect(page.listInputs.count()).toBe(3);
    });

  });
});
