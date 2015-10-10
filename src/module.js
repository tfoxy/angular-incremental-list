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