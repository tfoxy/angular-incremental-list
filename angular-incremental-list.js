/*!
 * angular-incremental-list v0.2.0
 * https://github.com/tfoxy/angular-incremental-list
 *
 * Copyright 2015 Tomás Fox
 * Released under the MIT license
 */

(function() {
  'use strict';

  var MAIN_PRIORITY = 2000;
  var IL_LIST_PRIORITY = 3000;
  var SCOPE_PROP_NAME = '$$ilListScope';

  angular.module('incrementalList', [])
      .directive('ilList', ilListDirective)
      .directive('ilList', ilListScopeDirective)
      .directive('ilItemModel', ilItemModelDirective)
      .directive('ilNewItem', ilNewItemDirective)
      .directive('ilIncreaseOn', ilIncreaseOnDirective)
      .directive('ilDecreaseOn', ilDecreaseOnDirective)
      .directive('ilIncrementOn', ilIncrementOnDirective)
      .directive('ilDecrementOn', ilDecrementOnDirective)
      .directive('ilListModel', ilListModelDirective)
      .directive('ilMinLength', ilMinLengthDirective)
      .directive('ilMaxLength', ilMaxLengthDirective);

  //////////

  function ilListDirective() {
    return {
      restrict: 'A',
      priority: IL_LIST_PRIORITY,
      controller: ilListController,
      link: function(scope, element, attrs, ctrl) {
        ctrl.postInitialize();
      }
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

          ctrl.scopeCreatedAt(index, scope);
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

        var localScope = {
          ilList: {
            changed: {
              ngModelController: ngModelCtrl
            }
          }
        };

        var listener = function() {
          ilListCtrl.listItemChanged(selectedScope.$index, localScope);
        };

        ngModelCtrl.$viewChangeListeners.push(listener);
      }
    };
  }

  function ilNewItemDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        ctrl.createItem = function(lastItemScope) {
          return lastItemScope.$eval(attrs.ilNewItem);
        };
      }
    };
  }

  function ilIncreaseOnDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        ctrl.mustIncrement = function(lastItemScope, localScope) {
          return lastItemScope.$eval(attrs.ilIncreaseOn, localScope);
        };
      }
    };
  }

  /**
   * @deprecated since version 0.2.0
   */
  function ilIncrementOnDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        ctrl.mustIncrement = function(lastItemScope, localScope) {
          return lastItemScope.$eval(attrs.ilIncrementOn, localScope);
        };
      }
    };
  }

  function ilDecreaseOnDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        ctrl.mustDecrement = function(itemScope, localScope) {
          return itemScope.$eval(attrs.ilDecreaseOn, localScope);
        };
      }
    };
  }

  /**
   * @deprecated since version 0.2.0
   */
  function ilDecrementOnDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        ctrl.mustDecrement = function(itemScope, localScope) {
          return itemScope.$eval(attrs.ilDecrementOn, localScope);
        };
      }
    };
  }

  function ilListModelDirective() {
    return {
      restrict: 'A',
      require: ['^^ilList', 'ilList'],
      priority: MAIN_PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        var parentCtrl = ctrl[0];
        var elementCtrl = ctrl[1];

        elementCtrl.notifyParentList = function(scope, localScope) {
          var parentScope = attrs.ilListModel ?
              scope.$eval(attrs.ilListModel) :
              scope.$parent;
          parentCtrl.listItemChanged(parentScope.$index, localScope);
        };
      }
    };
  }

  function ilMinLengthDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        var num = parseInt(attrs.ilMinLength);
        ctrl.minLength = num > 0 ? num : 0;
      }
    };
  }

  function ilMaxLengthDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function(scope, element, attrs, ctrl) {
        var num = parseInt(attrs.ilMaxLength);
        ctrl.maxLength = num > 0 ? num : 0;
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
    vm.maxLength = 9007199254740991;
    vm.minLength = 1;
    vm.mustDecrement = defaultMustDecrement;
    vm.mustIncrement = defaultMustIncrement;
    vm.notifyParentList = angular.noop;
    vm.postInitialize = postInitialize;
    vm.scopeCreatedAt = scopeCreatedAt;

    initialize();

    //////////

    function initialize() {
      var list = vm.list;

      if (angular.isUndefined(list) || list === null) {
        throw Error('ilList is ' + list + ': ' + $attrs.ilList);
      }
    }

    function listItemChanged(index, localScope) {
      if (typeof index !== 'number') {
        throw new Error('scope.$index is not a number. Got: ' + index);
      }

      var length = vm.list.length;
      var scope = getScope(index);

      if (index === length - 1 && length < vm.maxLength) {
        lastItemChanged(scope, localScope);
      } else if (index === length - 2 && length > vm.minLength) {
        checkDecrementConditions(scope, localScope);
      }

      vm.notifyParentList(scope, localScope);
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

    function lastItemChanged(scope, localScope) {
      if (vm.mustIncrement(scope, localScope)) {
        vm.list.push(vm.createItem(scope));
      } else if (!scope.$first) {
        checkDecrementConditions(scope, localScope);
      }
    }

    function checkDecrementConditions(scope, localScope) {
      var otherScope = scope.$last ? prevScope(scope) : nextScope(scope);

      if (vm.mustDecrement(scope, localScope) &&
          vm.mustDecrement(otherScope, localScope)) {
        if (!scope.$last) {
          vm.list.pop();
        }

        removeEmptyItems(prevScope(scope), localScope);
      }
    }

    function removeEmptyItems(scope, localScope) {
      var minFrom = vm.minLength - 1;
      var auxScope = scope;
      var from, to;
      from = to = vm.list.length - 2;

      for (; from >= minFrom; --from, auxScope = prevScope(auxScope)) {
        if (!vm.mustDecrement(auxScope, localScope)) {
          break;
        }
      }

      vm.list.splice(from + 1, to - from);
    }

    function defaultMustDecrement(scope) {
      var item = vm.list[scope.$index];

      for (var key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key) && key.slice(0, 2) !== '$$') {
          var v = item[key];
          if ((v && (!Array.isArray(v) || v.length > 1)) || v === 0) {
            return false;
          }
        }
      }

      return true;
    }

    function defaultMustIncrement(scope, localScope) {
      var value = localScope.ilList.changed.ngModelController.$modelValue;
      return value || value === 0;
    }

    function createItem() {
      return {};
    }

    function postInitialize() {
      var length = vm.list.length;

      var scope = getScope(length - 1) || $scope;

      if (length < vm.minLength) {
        var itemPusher = new ItemPusher(vm.minLength - length, vm, scopeCreatedAt);
        vm.scopeCreatedAt = itemPusher.scopeCreatedAt.bind(itemPusher);
        itemPusher.pushItem(scope);
      } else if (length > vm.maxLength) {
        vm.list.splice(vm.maxLength, length - vm.maxLength);
      }
    }

    function scopeCreatedAt(index, scope) {
      var item = vm.list[index];
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

  function ItemPusher(times, vm, scopeCreatedAt) {
    this._countdown = times;
    this._vm = vm;
    this._scopeCreatedAt = scopeCreatedAt;
  }

  ItemPusher.prototype.pushItem = function(scope) {
    this._vm.list.push(this._vm.createItem(scope));
    if (--this._countdown <= 0) {
      this._vm.scopeCreatedAt = this._scopeCreatedAt;
    }
  };

  ItemPusher.prototype.scopeCreatedAt = function(index, scope) {
    this._scopeCreatedAt(index, scope);
    this.pushItem(scope);
  };
})();
