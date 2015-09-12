/*!
 * angular-incremental-list
 * @see https://github.com/tfoxy/angular-incremental-list
 * @version 0.4.1
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
      .directive('ilListModel', ilListModelDirective)
      .directive('ilMinLength', ilMinLengthDirective)
      .directive('ilMaxLength', ilMaxLengthDirective)
      .directive('ilEnableHasFocus', ilEnableHasFocusDirective)
      .directive('ilDecreaseMiddle', ilDecreaseMiddleDirective);

  ////////////////

  function ilListDirective() {
    return {
      restrict: 'A',
      priority: IL_LIST_PRIORITY,
      controller: ilListController,
      link: function postLink(scope, element, attrs, ctrl) {
        ctrl.postInitialize();
      }
    };
  }

  function ilListScopeDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      link: {
        pre: function preLink(scope, element, attrs, ctrl) {
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
      link: function postLink(scope, element, attrs, ctrl) {
        var ilListCtrl = ctrl[0];
        var ngModelCtrl = ctrl[1];

        var selectedScope = attrs.ilItemModel ?
            scope.$eval(attrs.ilItemModel) :
            scope;

        var listener = function viewChangeListener() {
          ilListCtrl.listItemChanged(selectedScope.$index, ngModelCtrl);
        };

        ngModelCtrl.$viewChangeListeners.push(listener);

        pushToScopeArray(selectedScope.$$ilListModels, ngModelCtrl, scope);

        ilListCtrl.listenToEvents(selectedScope, element, listener);
      }
    };
  }

  function ilNewItemDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function postLink(scope, element, attrs, ctrl) {
        ctrl.createItem = function ilNewItemEval() {
          return ctrl.evalWithCurrentScope(attrs.ilNewItem);
        };
      }
    };
  }

  function ilIncreaseOnDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function postLink(scope, element, attrs, ctrl) {
        ctrl.mustIncrement = function ilIncreaseOnEval() {
          return ctrl.evalWithCurrentScope(attrs.ilIncreaseOn);
        };
      }
    };
  }

  function ilDecreaseOnDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function postLink(scope, element, attrs, ctrl) {
        ctrl.mustDecrement = function ilDecreaseOnEval() {
          return ctrl.evalWithCurrentScope(attrs.ilDecreaseOn);
        };
      }
    };
  }

  function ilListModelDirective() {
    return {
      restrict: 'A',
      require: ['^^ilList', 'ilList'],
      priority: MAIN_PRIORITY,
      link: function postLink(scope, element, attrs, ctrl) {
        var parentCtrl = ctrl[0];
        var elementCtrl = ctrl[1];

        elementCtrl.notifyParentList = function notifyParentList(scope, changed) {
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
      link: function postLink(scope, element, attrs, ctrl) {
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
      link: function postLink(scope, element, attrs, ctrl) {
        var num = parseInt(attrs.ilMaxLength);
        ctrl.maxLength = num > 0 ? num : 0;
      }
    };
  }

  ilEnableHasFocusDirective.$inject = ['$timeout'];

  function ilEnableHasFocusDirective($timeout) {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: postLink
    };

    function postLink(scope, element, attrs, ctrl) {
      ctrl.listenToEvents = function listenForHasFocus(inputScope, inputElement, listener) {
        inputElement.on('focus', function inputFocus() {
          ctrl.cancelBlurTimeout();
          ctrl.focusIndex = inputScope.$index;
          if (ctrl.blurListener) {
            inputScope.$apply(ctrl.blurListener);
            ctrl.blurListener = null;
          }
          inputScope.$apply(listener);
        });

        inputElement.on('blur', function inputBlur() {
          ctrl.blurListener = listener;
          ctrl.blurTimeout = $timeout(function blurTimeout() {
            ctrl.blurTimeout = null;
            ctrl.focusIndex = -1;
            ctrl.blurListener = null;
            listener();
          });
        });
      };
    }
  }

  function ilDecreaseMiddleDirective() {
    return {
      restrict: 'A',
      require: 'ilList',
      priority: MAIN_PRIORITY,
      link: function postLink(scope, element, attrs, ctrl) {
        ctrl.enableMiddleDecrease();
      }
    };
  }


  ilListController.$inject = ['$scope', '$attrs', '$timeout'];

  function ilListController($scope, $attrs, $timeout) {
    /* jshint validthis: true */
    var vm = this;

    var $ilList = {
      emptyModel: listInputsHelper(false, true),
      emptyView: listInputsHelper(false, false),
      fullModel: listInputsHelper(true, true),
      fullView: listInputsHelper(true, false),
      hasFocus: hasFocus,
      modelExists: modelExists,
      viewExists: viewExists
    };

    var localScope = {
      $ilList: $ilList
    };

    vm.blurTimeout = null;
    vm.cancelBlurTimeout = cancelBlurTimeout;
    vm.checkDecreaseConditions = angular.noop;
    vm.createItem = createItem;
    vm.enableMiddleDecrease = enableMiddleDecrease;
    vm.evalWithCurrentScope = evalWithCurrentScope;
    vm.focusIndex = -1;
    vm.list = $scope.$eval($attrs.ilList);
    vm.listenToEvents = angular.noop;
    vm.listItemChanged = listItemChanged;
    vm.localScope = localScope;
    vm.maxLength = 9007199254740991;
    vm.minLength = 1;
    vm.mustDecrement = $ilList.emptyView;
    vm.mustIncrement = modelExists;
    vm.notifyParentList = angular.noop;
    vm.postInitialize = postInitialize;
    vm.scopeCreatedAt = scopeCreatedAt;

    initialize();

    ////////////////

    function initialize() {
      var list = vm.list;

      if (angular.isUndefined(list) || list === null) {
        throw Error('ilList is ' + list + ': ' + $attrs.ilList);
      }
    }


    function cancelBlurTimeout() {
      if (vm.blurTimeout) {
        $timeout.cancel(vm.blurTimeout);
        vm.blurTimeout = null;
      }
    }


    function listItemChanged(index, changed) {
      if (typeof index !== 'number') {
        throw new Error('scope.$index is not a number. Got: ' + index);
      }

      var length = vm.list.length;
      var scope = getScope(index);

      $ilList.currentScope = scope;
      $ilList.changed = changed;

      if (index === length - 1 && length < vm.maxLength) {
        lastItemChanged();
      } else if (index === length - 2 && length > vm.minLength) {
        checkLastItemsDecreaseConditions();
      } else if (length > vm.minLength) {
        vm.checkDecreaseConditions();
      }

      delete $ilList.currentScope;
      delete $ilList.changed;

      vm.notifyParentList(scope, changed);
    }


    function enableMiddleDecrease() {
      vm.checkDecreaseConditions = checkDecreaseConditions;

      function checkDecreaseConditions() {
        removeEmptyItems($ilList.currentScope, $ilList.currentScope.$index);
      }
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


    function lastItemChanged() {
      if (vm.mustIncrement()) {
        vm.list.push(vm.createItem());
      } else if (!$ilList.currentScope.$first) {
        checkLastItemsDecreaseConditions();
      }
    }


    function checkLastItemsDecreaseConditions() {
      var scope = $ilList.currentScope;
      var otherScope = scope.$last ? prevScope(scope) : nextScope(scope);

      if (vm.mustDecrement() &&
          mustDecrementWithScope(otherScope)) {
        if (!scope.$last) {
          vm.list.pop();
        }

        removeEmptyItems(prevScope(scope));
      }
    }


    function mustDecrementWithScope(scope) {
      $ilList.currentScope = scope;
      return vm.mustDecrement();
    }


    function removeEmptyItems(scope, endIndex) {
      var minFrom = vm.minLength - 1;
      var auxScope = scope;
      var from, to;
      from = to = endIndex || (vm.list.length - 2);

      for (; from >= minFrom; --from, auxScope = prevScope(auxScope)) {
        if (!mustDecrementWithScope(auxScope)) {
          break;
        }
      }

      vm.list.splice(from + 1, to - from);
    }


    function evalWithCurrentScope(expression) {
      return $ilList.currentScope.$eval(expression, localScope);
    }


    function createItem() {
      return {};
    }


    function hasFocus() {
      return vm.focusIndex === $ilList.currentScope.$index;
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

      return listInputsHelperFn;

      function listInputsHelperFn(paramScope) {
        var scope = paramScope || $ilList.currentScope;
        var isEmpty = scope.$$ilListModels.every(function(ngModelCtrl) {
          return onFull ^ !valueExists(ngModelCtrl[valueProp]);
        });
        if (isEmpty) {
          return scope.$$ilListChildCtrls.every(function(ctrl) {
            return ctrl.list.every(function(item) {
              return listInputsHelperFn(item[SCOPE_PROP_NAME]);
            });
          });
        } else {
          return false;
        }
      }
    }


    function modelExists() {
      var value = $ilList.changed.$modelValue;
      return valueExists(value);
    }


    function valueExists(value) {
      return value || value === 0;
    }


    function viewExists() {
      var value = $ilList.changed.$viewValue;
      return valueExists(value);
    }
  }


  // ItemPusher class

  function ItemPusher(times, vm, scopeCreatedAt) {
    this._countdown = times;
    this._vm = vm;
    this._scopeCreatedAt = scopeCreatedAt;
  }

  ItemPusher.prototype.pushItem = function pushItem(scope) {
    this._vm.localScope.$ilList.currentScope = scope;
    this._vm.list.push(this._vm.createItem());
    if (--this._countdown <= 0) {
      this._vm.scopeCreatedAt = this._scopeCreatedAt;
    }
    delete this._vm.localScope.$ilList.currentScope;
  };

  ItemPusher.prototype.scopeCreatedAt = function scopeCreatedAt(index, scope) {
    this._scopeCreatedAt(index, scope);
    this.pushItem(scope);
  };


  // Helper functions

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
