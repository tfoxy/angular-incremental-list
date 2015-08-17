# angular-incremental-list

[![npm version](http://img.shields.io/npm/v/angular-incremental-list.svg)](https://npmjs.org/package/angular-incremental-list) ![bower version](https://img.shields.io/bower/v/angular-incremental-list.svg) [![build status](https://img.shields.io/travis/tfoxy/angular-incremental-list.svg)](https://travis-ci.org/tfoxy/angular-incremental-list)

List that auto-increments and decrements depending on the changes of the items in the list.


## Requirements

  - [AngularJS](https://github.com/angular/angular.js)


## Load into your app

You can get it from [Bower](http://bower.io/)

```sh
bower install angular-incremental-list
```

Load the script files in your application:

```html
<script type="text/javascript" src="bower_components/angular/angular.js"></script>
<script type="text/javascript" src="bower_components/angular-incremental-list/angular-incremental-list.js"></script>
```

Add the specific module to your dependencies:

```javascript
angular.module('myApp', ['incrementalList', ...])
```


## Usage examples

[Live demo](http://jsbin.com/dixefo/embed?html,output)

```html
<!-- Basic example -->
<ul>
  <li ng-repeat="item in list" il-list="list">
    <input type="text" ng-model="item.name" il-item-model>
  </li>
</ul>
<!-- -->
<!-- ilIncreaseOn example -->
<!-- First and last name are required, but age is optional -->
<ul>
  <li ng-repeat="person in list" il-list="list" il-increase-on="person.firstName && person.lastName">
    <input type="text" ng-model="person.firstName" il-item-model required>
    <input type="text" ng-model="person.lastName" il-item-model required>
    <input type="number" ng-model="person.age" il-item-model>
  </li>
</ul>
<ul>
```


## Directives

  - `ilList`: Indicates the list that will auto-increment or decrement.
    Used in conjunction with `ngRepeat`.
    All the other directives require this one.
  - `ilItemModel`: Notify of changes on the list. Requires `ngModel` directive.
  - `ilNewItem`: The item that is pushed to the list when it is increased.
    It is evaluated with the scope of the last item.
    Default: `{}`.
  - `ilIncreaseOn`: The conditions that must be met to increase the list.
    It is evaluated with the scope of the last item.
    Default: the changed input must be truthy or 0.
  - `ilDecreaseOn`: The conditions that must be met to decrease the list.
    It is evaluated with the scope of the last and the second to last item.
    Default: all properties of the item must be `undefined`, `null` or `''`,
    or if the property is an array, its length must not be greater than 1.
  - `ilListModel`: This is used when there are nested `ilList`.
    Used in an `ilList` to notify the parent `ilList` that changes were made.
  - `ilMinLength`: The minimum length that the list must have.
    If the list length is less than `ilMinLength` when the directive is processed,
    new items are pushed to the list (using `ilNewItem`).
    When decreasing the list, it will stop at this value.
    Default: `1`.
  - `ilMaxLength`: The maximum length that the list can have.
    If the list length is greater than `ilMaxLength` when the directive is processed,
    the items after its value are removed.
    When increasing the list, it will stop at this value.
    Default: `9007199254740991 (Number.MAX_SAFE_INTEGER)`.
