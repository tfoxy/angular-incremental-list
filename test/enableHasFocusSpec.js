describe('ilEnableHasFocus directive', function() {
  'use strict';

  var scope, compileAndDigest;

  var html = '<div><input ' +
      'ng-repeat="item in list" ' +
      'il-list="list" ' +
      'il-enable-has-focus ' +
      'il-increase-on="$ilList.hasFocus()" ' +
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

  it('increases the list by focusing on the only input', function() {
    scope.list = [];
    var element = compileAndDigest(html);
    var inputs = element.find('input');
    expect(inputs).to.have.length(1);
    inputs.eq(0).triggerHandler('focus');
    inputs = element.find('input');
    expect(inputs).to.have.length(2);
  });

  it('increases the list by focusing on the last input', function() {
    scope.list = [{v: '0'}, {v: '1'}, {v: '2'}, {v: ''}];
    var initialLength = scope.list.length;
    var element = compileAndDigest(html);
    var inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);
    inputs.eq(-1).triggerHandler('focus');
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength + 1);
  });

  it('decreases the list when focused outside the list (blurred)', inject(function($timeout) {
    scope.list = [{v: '0'}, {v: '1'}, {v: ''}, {v: ''}, {v: ''}, {v: ''}];
    var initialLength = scope.list.length;
    var element = compileAndDigest(html);
    var inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.eq(-2).triggerHandler('focus');
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.eq(-2).triggerHandler('blur');
    inputs.eq(3).triggerHandler('focus');
    $timeout.verifyNoPendingTasks();
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength - 1);
  }));

  it('decreases the list when focused outside the list (blurred)', inject(function($timeout) {
    scope.list = [{v: '0'}, {v: '1'}, {v: ''}, {v: ''}, {v: ''}, {v: ''}];
    var initialLength = scope.list.length;
    var element = compileAndDigest(html);
    var inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.eq(-2).triggerHandler('focus');
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength);

    inputs.eq(-2).triggerHandler('blur');
    $timeout.flush();
    inputs = element.find('input');
    expect(inputs).to.have.length(initialLength - 3);
  }));
});
