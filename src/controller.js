var SCOPE_PROP_NAME = '$$ilListScope';

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

    $scope.$on('$destroy', cancelBlurTimeout);
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
    from = to = endIndex >= 0 ? endIndex : vm.list.length - 2;
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
