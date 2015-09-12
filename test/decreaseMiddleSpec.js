describe('ilDecreaseMiddle directive', function() {
  'use strict';

  var scope, compileAndDigest;

  var html = '<div><input ' +
      'ng-repeat="item in list" ' +
      'il-list="list" ' +
      'il-enable-has-focus ' +
      'il-decrease-middle ' +
      'il-decrease-on="!$ilList.hasFocus() && $ilList.emptyView()" ' +
      'ng-model="item.v" ' +
      'il-item-model ' +
      'title="i{{$index}}" ' +
      '></div>';

  beforeEach(module('incrementalList'));

  beforeEach(inject(function($rootScope, $compile) {
    scope = $rootScope.$new();
    compileAndDigest = function(html) {
      var element = angular.element(html);
      $compile(element)(scope);
      scope.$digest();

      return element;
    };
  }));

  it('removes an item in the middle', function() {
    scope.list = [{v: '0'}, {v: '1'}, {v: '2'}, {v: '3'}, {v: '4'}, {v: ''}];
    var initialLength = scope.list.length;
    var element = compileAndDigest(html);
    var inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.eq(2).controller('ngModel').$setViewValue('');
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength - 1);
    expect(inputs.eq(3).val()).to.equal('4');
    expect(inputs.eq(2).val()).to.equal('3');
  });

  it('does not removes an item in the middle if condition is not met', function() {
    scope.list = [{v: '0'}, {v: '1'}, {v: '2'}, {v: '3'}, {v: '4'}, {v: ''}];
    var initialLength = scope.list.length;
    var element = compileAndDigest(html);
    var inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.eq(2).triggerHandler('focus');
    inputs.eq(2).controller('ngModel').$setViewValue('');
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);
  });

  it('removes an item in the middle, ' +
      'but not the following one if it is not blurred', inject(function($timeout) {
    scope.list = [{v: '0'}, {v: '1'}, {v: '2'}, {v: '3'}, {v: '4'}, {v: ''}];
    var initialLength = scope.list.length;
    var element = compileAndDigest(html);
    var inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.eq(2).triggerHandler('focus');
    inputs.eq(2).controller('ngModel').$setViewValue('');
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.eq(2).triggerHandler('blur');
    inputs.eq(3).triggerHandler('focus');
    $timeout.verifyNoPendingTasks();
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength - 1);

    inputs.eq(2).controller('ngModel').$setViewValue('');
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength - 1);
  }));

  it('removes the first item when it is cleared and blurred', inject(function($timeout) {
    scope.list = [{v: '0'}, {v: '1'}, {v: '2'}, {v: '3'}, {v: '4'}, {v: ''}];
    var initialLength = scope.list.length;
    var element = compileAndDigest(html);
    var inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.first().triggerHandler('focus');
    inputs.first().controller('ngModel').$setViewValue('');
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.first().triggerHandler('blur');
    $timeout.flush();
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength - 1);
    expect(inputs.first().val()).to.equal('1');
  }));
});
