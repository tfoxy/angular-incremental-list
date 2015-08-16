describe('incrementalList-steps', function() {
  'use strict';

  var scope, compileAndDigest;

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

  it('deletes and then adds an item when ilIncrementOn is defined', function() {
    scope.list = [
      {x: 5, y: 3},
      {x: 8, y: 1},
      {},
      {},
      {x: 1}
    ];
    var t = '<ol><li ng-repeat="item in list" il-list="list"' +
            ' il-increment-on="item.x && item.y">' +
            '<input type="number" ng-model="item.x" name="x" il-item-model>' +
            '<input type="number" ng-model="item.y" name="y" il-item-model>' +
            '<input type="text" ng-model="item.name" name="name" il-item-model>' +
            '</li></ol>';
    var element = compileAndDigest(t);
    var ngModelCtrl = element.find('li').last().find('input').first().controller('ngModel');
    ngModelCtrl.$setViewValue('');
    scope.$digest();

    expect(scope.list).to.have.length(3);

    ngModelCtrl = element.find('li').last().find('input').first().controller('ngModel');
    ngModelCtrl.$setViewValue('1');
    scope.$digest();

    expect(scope.list).to.have.length(3);

    ngModelCtrl = element.find('li').last().find('input').eq(1).controller('ngModel');
    ngModelCtrl.$setViewValue('2');
    scope.$digest();

    expect(scope.list).to.have.length(4);
  });
});
