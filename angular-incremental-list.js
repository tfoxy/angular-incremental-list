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
  var SCOPE_PROP_NAME = '$$ilListScope';

  angular.module('incrementalList', [])
      .directive('ilList', ilListDirective)
      .directive('ilList', ilListScopeDirective)
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

  function ilListScopeDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      link: {
        pre: function(scope, element, attrs, ctrl) {
          var index = scope.$index;
          if (typeof index !== 'number') {
            throw new Error('scope.$index is not a number. Got: ' + index);
          }

          var item = ctrl.list[index];
          Object.defineProperty(item, SCOPE_PROP_NAME, {
            configurable: true,
            enumerable: false,
            value: scope
          });

          scope.$on('$destroy', function() {
            delete item[SCOPE_PROP_NAME];
          });
        }
      }
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
          ilListCtrl.listItemChanged(selectedScope.$index);
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
          parentCtrl.listItemChanged(parentScope.$index);
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

    function listItemChanged(index) {
      if (typeof index !== 'number') {
        throw new Error('scope.$index is not a number. Got: ' + index);
      }

      var length = vm.list.length;
      var scope = getScope(index);

      if (index === length - 1) {
        lastItemChanged(scope);
      } else if (index === length - 2) {
        checkDecrementConditions(scope);
      }

      vm.notifyParentList(scope);
    }

    function getScope(index) {
      if (index >= vm.list.length || index < 0) {
        return null;
      }
      return vm.list[index][SCOPE_PROP_NAME];
    }

    function prevScope(scope) {
      return getScope(scope.$index - 1);
    }

    function nextScope(scope) {
      return getScope(scope.$index + 1);
    }

    function lastItemChanged(scope) {
      if (vm.mustIncrement(scope)) {
        vm.list.push(vm.createItem(scope));
      } else if (!scope.$first) {
        checkDecrementConditions(scope);
      }
    }

    function checkDecrementConditions(scope) {
      var otherScope = scope.$last ? prevScope(scope) : nextScope(scope);

      if (vm.mustDecrement(scope) && vm.mustDecrement(otherScope)) {
        if (!scope.$last) {
          vm.list.pop();
        }

        removeEmptyItems(prevScope(scope));
      }
    }

    function removeEmptyItems(scope) {
      var from, to, auxScope = scope;
      from = to = vm.list.length - 2;

      for (; from >= 0; --from, auxScope = prevScope(auxScope)) {
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
        if (Object.prototype.hasOwnProperty.call(item, key) && key.slice(0, 2) !== '$$') {
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
