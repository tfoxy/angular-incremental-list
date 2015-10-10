var MAIN_PRIORITY = 2000;
var IL_LIST_PRIORITY = 3000;


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
          ctrl.focusIndex = inputScope.$index;
        }
        inputScope.$apply(listener);
        ctrl.focusIndex = inputScope.$index;
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
