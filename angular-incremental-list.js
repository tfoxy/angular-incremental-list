/*!
 * angular-incremental-list
 * @see https://github.com/tfoxy/angular-incremental-list
 * @version 0.3.0
 * @author Tomás Fox <tomas.c.fox@gmail.com>
 * @license MIT
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

        var listener = function() {
          ilListCtrl.listItemChanged(selectedScope.$index, ngModelCtrl);
        };

        ngModelCtrl.$viewChangeListeners.push(listener);

        pushToScopeArray(selectedScope.$$ilListModels, ngModelCtrl, scope);
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
          return lastItemScope.$eval(attrs.ilNewItem, ctrl.localScope);
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
        ctrl.mustIncrement = function(lastItemScope) {
          return lastItemScope.$eval(attrs.ilIncreaseOn, ctrl.localScope);
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
        ctrl.mustIncrement = function(lastItemScope) {
          return lastItemScope.$eval(attrs.ilIncrementOn);
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
        ctrl.mustDecrement = function(itemScope) {
          return itemScope.$eval(attrs.ilDecreaseOn, ctrl.localScope);
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
        ctrl.mustDecrement = function(itemScope) {
          return itemScope.$eval(attrs.ilDecrementOn, ctrl.localScope);
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

        elementCtrl.notifyParentList = function(scope, changed) {
          var parentScope = attrs.ilListModel ?
              scope.$eval(attrs.ilListModel) :
              scope.$parent;
          parentCtrl.listItemChanged(parentScope.$index, changed);
        };

        pushToScopeArray(scope.$$ilListChildCtrls, elementCtrl, scope);
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

    var localScope = {
      $ilList: {
        emptyModel: listInputsHelper(false, true),
        emptyView: listInputsHelper(false, false),
        fullModel: listInputsHelper(true, true),
        fullView: listInputsHelper(true, false),
        modelExists: modelExists,
        viewExists: viewExists
      }
    };

    vm.createItem = createItem;
    vm.list = $scope.$eval($attrs.ilList);
    vm.listItemChanged = listItemChanged;
    vm.localScope = localScope;
    vm.maxLength = 9007199254740991;
    vm.minLength = 1;
    vm.mustDecrement = localScope.$ilList.emptyView;
    vm.mustIncrement = modelExists;
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

    function listItemChanged(index, changed) {
      if (typeof index !== 'number') {
        throw new Error('scope.$index is not a number. Got: ' + index);
      }

      var length = vm.list.length;
      var scope = getScope(index);

      vm.localScope.$ilList.changed = changed;

      if (index === length - 1 && length < vm.maxLength) {
        lastItemChanged(scope, localScope);
      } else if (index === length - 2 && length > vm.minLength) {
        checkDecrementConditions(scope, localScope);
      }

      delete vm.localScope.$ilList.changed;

      vm.notifyParentList(scope, changed);
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

      if (vm.mustDecrement(scope) &&
          vm.mustDecrement(otherScope)) {
        if (!scope.$last) {
          vm.list.pop();
        }

        removeEmptyItems(prevScope(scope));
      }
    }

    function removeEmptyItems(scope) {
      var minFrom = vm.minLength - 1;
      var auxScope = scope;
      var from, to;
      from = to = vm.list.length - 2;

      for (; from >= minFrom; --from, auxScope = prevScope(auxScope)) {
        if (!vm.mustDecrement(auxScope)) {
          break;
        }
      }

      vm.list.splice(from + 1, to - from);
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

      scope.$$ilListModels = [];
      scope.$$ilListChildCtrls = [];

      scope.$on('$destroy', function() {
        delete item[SCOPE_PROP_NAME];
      });
    }

    function listInputsHelper(onFull, useModel) {
      var valueProp = useModel ? '$modelValue' : '$viewValue';

      var fn = function(scope) {
        var isEmpty = scope.$$ilListModels.every(function(ngModelCtrl) {
          return onFull ^ !valueExists(ngModelCtrl[valueProp]);
        });
        if (isEmpty) {
          return scope.$$ilListChildCtrls.every(function(ctrl) {
            return ctrl.list.every(function(item) {
              return fn(item[SCOPE_PROP_NAME]);
            });
          });
        } else {
          return false;
        }
      };

      return fn;
    }

    function modelExists() {
      var value = vm.localScope.$ilList.changed.$modelValue;
      return valueExists(value);
    }

    function valueExists(value) {
      return value || value === 0;
    }

    function viewExists() {
      var value = vm.localScope.$ilList.changed.$viewValue;
      return valueExists(value);
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

  function removeElementFromArray(array, element) {
    var index = array.indexOf(element);
    if (index >= 0) {
      array.splice(index, 1);
    }
  }

  function pushToScopeArray(scopeArray, element, scope) {
    scopeArray.push(element);

    scope.$on('$destroy', function() {
      removeElementFromArray(scopeArray, scope);
    });
  }
})();
