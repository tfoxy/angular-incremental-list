describe('In an isolated scope', function() {
  'use strict';

  var scope, compileAndDigest;

  beforeEach(module('incrementalList'));

  angular.module('customDirective', [])
      .directive('customDirective', function() {
        return {
          restrict: 'A',
          scope: {
            pScope: '='
          },
          template: '<input type="number" ng-model="pScope.item.n" il-item-model="pScope">'
        };
      });

  beforeEach(module('customDirective'));

  beforeEach(inject(function($rootScope, $compile) {
    scope = $rootScope.$new();
    compileAndDigest = function(html) {
      var element = angular.element(html);
      $compile(element)(scope);
      scope.$digest();

      return element;
    };
  }));

  it('il-item-model directive works', function() {
    scope.list = [{n: 7}, {n: 2}, {n: null}];
    var listLength = scope.list.length;
    var t =
        '<div>' +
        '<div ng-repeat="item in list" il-list="list">' +
        '<div custom-directive p-scope="this"></div>' +
        '</div>' +
        '</div>';
    var element = compileAndDigest(t);
    expect(scope.list).to.have.length(listLength);
    expect(element.find('input')).to.have.length(listLength);

    var ngModelCtrl = element.find('input').eq(-1).controller('ngModel');
    ngModelCtrl.$setViewValue(13);
    scope.$digest();
    expect(scope.list).to.have.length(listLength + 1);
    expect(element.find('input')).to.have.length(listLength + 1);

    expect(scope.list[listLength - 1]).to.have.property('n', 13);
  });
});
