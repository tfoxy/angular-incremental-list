/*!
 * angular-incremental-list v0.1.0
 * https://github.com/tfoxy/angular-incremental-list
 *
 * Copyright 2015 Tomás Fox
 * Released under the MIT license
 */

(function() {
  'use strict';

  var PRIORITY = 2000;

  angular.module('incrementalList', [])
      .directive('ilList', ilListDirective)
      .directive('ilItemModel', ilItemModelDirective)
      .directive('ilNewItem', ilNewItemDirective)
      .directive('ilIncrementOn', ilIncrementOnDirective)
      .directive('ilDecrementOn', ilDecrementOnDirective)
      .directive('ilListModel', ilListModelDirective);

  //////////

  function ilListDirective() {
    return {
      restrict: 'A',
      priority: PRIORITY,
      controller: ilListController
    };
  }

  function ilItemModelDirective() {
    return {
      restrict: 'A',
      require: ['^ilList', 'ngModel'],
      link: function(scope, element, attrs, ctrl) {
        var ilListCtrl = ctrl[0];
        var ngModelCtrl = ctrl[1];

        var selectedScope = attrs.ilItemModel ?
            scope.$eval(attrs.ilItemModel) :
            scope;

        ngModelCtrl.$viewChangeListeners.push(function() {
          ilListCtrl.listItemChanged(selectedScope);
        });
      }
    };
  }

  function ilNewItemDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        ctrl.createItem = function(lastItemScope) {
          return lastItemScope.$eval(attrs.ilNewItem);
        };
      }
    };
  }

  function ilIncrementOnDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        ctrl.mustIncrement = function(lastItemScope) {
          return lastItemScope.$eval(attrs.ilIncrementOn);
        };
      }
    };
  }

  function ilDecrementOnDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        ctrl.mustDecrement = function(itemScope) {
          return itemScope.$eval(attrs.ilDecrementOn);
        };
      }
    };
  }

  function ilListModelDirective() {
    return {
      restrict: 'A',
      require: ['^^ilList', 'ilList'],
      priority: PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        var parentCtrl = ctrl[0];
        var elementCtrl = ctrl[1];

        elementCtrl.notifyParentList = function(scope) {
          var parentScope = attrs.ilListModel ?
              scope.$eval(attrs.ilListModel) :
              scope.$parent;
          parentCtrl.listItemChanged(parentScope);
        };
      }
    };
  }

  ilListController.$inject = ['$scope', '$attrs'];

  function ilListController($scope, $attrs) {
    /* jshint validthis: true */
    var vm = this;

    vm.createItem = createItem;
    vm.list = $scope.$eval($attrs.ilList);
    vm.listItemChanged = listItemChanged;
    vm.mustDecrement = defaultMustDecrement;
    vm.mustIncrement = defaultMustIncrement;
    vm.notifyParentList = angular.noop;

    //////////

    /**
     * @param scope is the scope of the item that was changed
     */
    function listItemChanged(scope) {
      if (angular.isUndefined(scope) || scope === null) {
        throw new Error('Scope does not exists. Got: ' + scope);
      }

      var index = scope.$index;
      if (typeof index !== 'number') {
        throw new Error('scope.$index is not a number. Got: ' + index);
      }

      var length = vm.list.length;

      if (index === length - 1) {
        lastItemChanged(scope);
      } else if (index === length - 2) {
        checkDecrementConditions(scope);
      }

      vm.notifyParentList(scope);
    }

    function lastItemChanged(scope) {
      if (vm.mustIncrement(scope)) {
        vm.list.push(vm.createItem(scope));
      } else {
        checkDecrementConditions(scope);
      }
    }

    function checkDecrementConditions(scope) {
      var otherScope = scope.$last ? scope.$$prevSibling : scope.$$nextSibling;

      if (vm.mustDecrement(scope) && vm.mustDecrement(otherScope)) {
        if (!scope.$last) {
          vm.list.pop();
        }

        removeEmptyItems(scope.$$prevSibling);
      }
    }

    function removeEmptyItems(scope) {
      var from, to, auxScope = scope;
      from = to = vm.list.length - 2;

      for (; from >= 0; --from, auxScope = auxScope.$$prevSibling) {
        if (!vm.mustDecrement(auxScope)) {
          break;
        }
      }

      vm.list.splice(from + 1, to - from);
    }

    function defaultMustDecrement(scope) {
      return !defaultMustIncrement(scope);
    }

    function defaultMustIncrement(scope) {
      var item = vm.list[scope.$index];

      for (var key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key) && key !== '$$hashKey') {
          var v = item[key];
          if (angular.isDefined(v) && v !== null && v !== '' &&
              (!Array.isArray(v) || v.length > 1)) {
            return true;
          }
        }
      }

      return false;
    }

    function createItem() {
      return {};
    }
  }
})();
