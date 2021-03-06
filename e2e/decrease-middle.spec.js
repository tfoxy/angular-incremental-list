describe('il-decrease-middle spec:', function() {
  'use strict';

  var Page = require('./po.js');
  var page = new Page();

  describe('list', function() {

    beforeEach(function() {
      browser.get('decrease-middle.html');
    });

    it('removes an item in the middle', function() {
      page.getInput(0).sendKeys('0');
      page.getInput(1).sendKeys('1');
      page.getInput(2).sendKeys('2');
      page.getInput(3).sendKeys('3');
      page.getInput(4).sendKeys('4');
      page.getInput(5).sendKeys('5');
      page.getInput(6).sendKeys('6');
      expect(page.listInputs.count()).toBe(8);
      page.getInput(3).clear();
      expect(page.listInputs.count()).toBe(8);
      page.anotherInput.click();
      expect(page.listInputs.count()).toBe(7);
      expect(page.getInput(5).getAttribute('value')).toBe('6');
      expect(page.getInput(3).getAttribute('value')).toBe('4');
    });

    it('does not removes an item in the middle if condition is not met', function() {
      page.getInput(0).sendKeys('0');
      page.getInput(1).sendKeys('1');
      page.getInput(2).sendKeys('2');
      page.getInput(3).sendKeys('3');
      page.getInput(4).sendKeys('4');
      page.getInput(5).sendKeys('5');
      page.getInput(6).sendKeys('6');
      expect(page.listInputs.count()).toBe(8);
      page.getInput(3).click();
      expect(page.listInputs.count()).toBe(8);
      page.anotherInput.click();
      expect(page.listInputs.count()).toBe(8);
    });

    it('removes an item in the middle, but not the following one if it is not blurred', function() {
      page.getInput(0).sendKeys('0');
      page.getInput(1).sendKeys('1');
      page.getInput(2).sendKeys('2');
      page.getInput(3).sendKeys('3');
      page.getInput(4).sendKeys('4');
      page.getInput(5).sendKeys('5');
      page.getInput(6).sendKeys('6');
      expect(page.listInputs.count()).toBe(8);
      page.getInput(3).clear();
      expect(page.listInputs.count()).toBe(8);
      page.getInput(4).clear();
      expect(page.listInputs.count()).toBe(7);
    });

    it('removes the first item when it is cleared and blurred', function() {
      page.getInput(0).sendKeys('0');
      page.getInput(1).sendKeys('1');
      page.getInput(2).sendKeys('2');
      page.getInput(3).sendKeys('3');
      expect(page.listInputs.count()).toBe(5);
      page.getInput(0).clear();
      expect(page.listInputs.count()).toBe(5);
      page.anotherInput.click();
      expect(page.listInputs.count()).toBe(4);
    });

  });
});
