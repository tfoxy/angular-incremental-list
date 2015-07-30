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
      {}
    ];
    var t = '<ol><li ng-repeat="item in list" il-list="list"' +
            ' il-increment-on="item.x && item.y">' +
            '<input type="number" ng-model="item.x">' +
            '<input type="number" ng-model="item.y">' +
            '<input type="text" ng-model="item.name">' +
            '</li></ol>';
    var element = compileAndDigest(t);
    var ilListCtrl = element.find('li').controller('ilList');
    ilListCtrl.listItemChanged(element.find('input').last().scope());
    scope.$digest();

    expect(scope.list).to.have.property('length', 3);

    var lastItem = scope.list[scope.list.length - 1];
    lastItem.x = 1;
    lastItem.y = 2;
    ilListCtrl.listItemChanged(element.find('input').last().scope());
    scope.$digest();

    expect(scope.list).to.have.property('length', 4);
  });
});
