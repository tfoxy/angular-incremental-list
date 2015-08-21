describe('incrementalList', function() {
  'use strict';

  var scope, compileAndDigest;

  var simpleListHtml = '<div><input ' +
      'ng-repeat="item in list" il-list="list" ' +
      '></div>';

  var ngModelListHtml = '<div><input ' +
      'ng-repeat="item in list" il-list="list" ' +
      'ng-model="item.s" il-item-model></div>';

  beforeEach(module('incrementalList'));

  beforeEach(inject(function($rootScope, $compile) {
    scope = $rootScope.$new();
    compileAndDigest = function(html) {
      var element = angular.element(html);
      $compile(element)(scope);
      scope.$digest();

      return element;
    };
  }));

  describe('ilList directive', function() {

    it('creates a controller', function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: '9'}];
      var t = simpleListHtml;
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      assert.isDefined(ilListCtrl);
    });

    it('has the passed list inside the controller', function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: '9'}];
      var t = simpleListHtml;
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      expect(ilListCtrl.list).to.deep.equal(scope.list);
    });

    it('is created once per ng-repeat', function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: '9'}];
      scope.spy = sinon.spy(function() {
        return scope.list;
      });
      var t = '<div><input ng-repeat="item in list" il-list="spy()"></div>';
      compileAndDigest(t);
      assert.isTrue(scope.spy.calledOnce);
    });

    describe('$$ilListScope property', function() {

      it('is created on every item', function() {
        var item = {s: '5'};
        scope.list = [item, {s: '3'}, {s: '9'}];
        var t = simpleListHtml;
        compileAndDigest(t);
        expect(item).to.have.property('$$ilListScope');
      });

      it('is not enumerable', function() {
        var item = {s: '5'};
        scope.list = [item, {s: '3'}, {s: '9'}];
        var t = simpleListHtml;
        compileAndDigest(t);

        for (var key in item) {
          expect(key).to.match(/^(s|\$\$hashKey)$/);
        }
      });

    });

  });

  describe('ilItemModel directive', function() {

    it('listen to the changes of the model', function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: '9'}];
      var t = ngModelListHtml;
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      var ngModelCtrl = element.find('input').controller('ngModel');
      var spy = ilListCtrl.listItemChanged = sinon.spy();
      ngModelCtrl.$setViewValue('7');
      expect(spy).to.have.property('calledOnce', true);
      expect(spy.withArgs(0)).to.have.property('calledOnce', true);
    });

  });

  describe('ilList controller', function() {

    it('adds a new item if last item in the list is defined', function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: ''}];
      var listLength = scope.list.length;
      var t = ngModelListHtml;
      var element = compileAndDigest(t);
      var ngModelCtrl = element.find('input').last().controller('ngModel');
      ngModelCtrl.$setViewValue('9');
      expect(scope.list.length).to.equals(listLength + 1);
    });

    it('deletes one item if the last two items are not defined', function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: ''}, {s: '9'}];
      var listLength = scope.list.length;
      var t = ngModelListHtml;
      var element = compileAndDigest(t);
      var ngModelCtrl = element.find('input').last().controller('ngModel');
      ngModelCtrl.$setViewValue('');
      expect(scope.list.length).to.equals(listLength - 1);
    });

    it('deletes two items if the last three items are not defined', function() {
      scope.list = [{s: '5'}, {s: ''}, {s: ''}, {s: '9'}];
      var listLength = scope.list.length;
      var t = ngModelListHtml;
      var element = compileAndDigest(t);
      var ngModelCtrl = element.find('input').last().controller('ngModel');
      ngModelCtrl.$setViewValue('');
      expect(scope.list.length).to.equals(listLength - 2);
    });

    it('deletes all items except the penultimate if all items are not defined' +
        ' and the focus is on the penultimate', function() {
      scope.list = [{s: ''}, {s: ''}, {s: '1', focus: null}, {s: ''}];
      var t = ngModelListHtml;
      var element = compileAndDigest(t);
      var ngModelCtrl = element.find('input').eq(-2).controller('ngModel');
      ngModelCtrl.$setViewValue('');
      expect(scope.list).to.have.length(1);
      expect(scope.list[0]).to.have.property('focus');
    });

    it('deletes all items except the last if all items are not defined' +
        ' and the focus is on the last item', function() {
      scope.list = [{s: ''}, {s: ''}, {s: ''}, {s: '1', focus: null}];
      var t = ngModelListHtml;
      var element = compileAndDigest(t);
      var ngModelCtrl = element.find('input').last().controller('ngModel');
      ngModelCtrl.$setViewValue('');
      expect(scope.list).to.have.length(1);
      expect(scope.list[0]).to.have.property('focus');
    });

    it('decreases the list depending only on inputs, not item properties', function() {
      scope.list = [
        {s: ''},
        {s: '3'},
        {s: '', something: 'here'},
        {s: '', num: 3},
        {s: 'str', foo: 'bar'}
      ];
      var t = ngModelListHtml;
      var element = compileAndDigest(t);
      var ngModelCtrl = element.find('input').last().controller('ngModel');
      expect(scope.list).to.have.length(5);

      ngModelCtrl.$setViewValue('');

      expect(scope.list).to.have.length(3);
    });

  });

  describe('ilListModel directive', function() {

    it('updates the parent ilList', function() {
      scope.list = [
        {n: 5, sub: [{n: 2}]},
        {n: 4, sub: [{n: 3}]}
      ];

      var t = '<ol>' +
          '<li ng-repeat="item in list" il-list="list" il-new-item="{sub: []}">' +
          '<input type="number" ng-model="item.n" il-item-model>' +
          '<ol>' +
          '<li ng-repeat="subItem in item.sub" il-list="item.sub" il-list-model>' +
          '<input type="number" ng-model="subItem.n" il-item-model>' +
          '</li>' +
          '</ol>' +
          '</li>' +
          '</ol>';
      var element = compileAndDigest(t);
      var inputs = element.find('input');
      var lastInput = inputs.last();
      var ngModelCtrl = lastInput.controller('ngModel');

      ngModelCtrl.$setViewValue(4);

      expect(scope.list).to.have.length(3);
    });

    it('pops items from the list if it exceeds the maximum length', function() {
      scope.list = [
        {s: '1'},
        {s: '2'},
        {s: '3'},
        {s: '4'},
        {s: ''}
      ];

      var t = '<div><input ' +
          'ng-repeat="item in list" il-list="list" ' +
          'ng-model="item.s" il-item-model ' +
          'il-max-length="2"></div>';
      compileAndDigest(t);

      expect(scope.list).to.have.length(2);
    });

    it('does not decrease with nested ilListModel, until all inputs are empty', function() {
      scope.list = [
        {sub: [{
          sub: [{s: 'foo'}, {s: ''}]
        }, {
          sub: [{s: ''}]
        }]},
        {sub: [{
          sub: [{s: ''}]
        }]}
      ];

      var t =
          '<div><div ng-repeat="item in list" il-list="list">\
          <div ng-repeat="subItem in item.sub" il-list="item.sub" il-list-model>\
          <div ng-repeat="subSubItem in subItem.sub" il-list="subItem.sub" il-list-model>\
          <input ng-model="subSubItem.s" il-item-model>\
          </div></div></div></div>';
      var element = compileAndDigest(t);
      var inputs = element.find('input');
      var firstInput = inputs.first();
      var ngModelCtrl = firstInput.controller('ngModel');

      expect(scope.list[0].sub[0].sub).to.have.length(2);
      expect(scope.list[0].sub).to.have.length(2);
      expect(scope.list).to.have.length(2);

      ngModelCtrl.$setViewValue('');

      expect(scope.list[0].sub[0].sub).to.have.length(1);
      expect(scope.list[0].sub).to.have.length(1);
      expect(scope.list).to.have.length(1);
    });

  });

  describe('ilMinLength directive', function() {

    it('stops the decrease', function() {
      scope.list = [
        {s: ''},
        {s: ''},
        {s: ''},
        {s: ''},
        {s: ''},
        {s: 'string'}
      ];

      var t = '<div><input ' +
          'ng-repeat="item in list" il-list="list" ' +
          'ng-model="item.s" il-item-model ' +
          'il-min-length="3"></div>';
      var element = compileAndDigest(t);
      var inputs = element.find('input');
      var lastInput = inputs.last();
      var ngModelCtrl = lastInput.controller('ngModel');

      ngModelCtrl.$setViewValue('');

      expect(scope.list).to.have.length(3);
    });

    it('pushes new items to the list if it does not have enough', function() {
      scope.list = [];

      var t = '<div><input ' +
          'ng-repeat="item in list" il-list="list" ' +
          'ng-model="item.s" il-item-model ' +
          'il-min-length="3"></div>';
      compileAndDigest(t);

      expect(scope.list).to.have.length(3);
    });

    it('pushes new items using ilNewItem directive', function() {
      scope.list = [];

      var t = '<div><input ' +
          'ng-repeat="item in list" il-list="list" ' +
          'ng-model="item.s" il-item-model ' +
          'il-min-length="3" il-new-item="{s: \'n\' + $index}"></div>';
      compileAndDigest(t);

      expect(scope.list[0]).to.have.property('s', 'n');
      expect(scope.list[1]).to.have.property('s', 'n0');
      expect(scope.list[2]).to.have.property('s', 'n1');
    });

  });

  describe('ilMaxLength directive', function() {

    it('stops the increase', function() {
      scope.list = [
        {s: '1'},
        {s: '2'},
        {s: '3'},
        {s: '4'},
        {s: '5'},
        {s: ''}
      ];

      var t = '<div><input ' +
          'ng-repeat="item in list" il-list="list" ' +
          'ng-model="item.s" il-item-model ' +
          'il-max-length="6"></div>';
      var element = compileAndDigest(t);
      var inputs = element.find('input');
      var lastInput = inputs.last();
      var ngModelCtrl = lastInput.controller('ngModel');

      ngModelCtrl.$setViewValue('6');

      expect(scope.list).to.have.length(6);
    });

  });

  describe('ilIncreaseOn directive', function() {

    it('has a local scope with $ilList.fullModel property', function() {
      scope.list = [
        {n: 5, s: 'n'},
        {}
      ];
      var t = '<span><div ng-repeat="item in list" il-list="list"\
          il-increase-on="$ilList.fullModel(this)">\
          <input type="number" ng-model="item.n" il-item-model>\
          <input type="text" ng-model="item.s" il-item-model>\
          </div></span>';
      var element = compileAndDigest(t);
      var nNgModelCtrl = element.find('div').last().find('input').first().controller('ngModel');
      var sNgModelCtrl = element.find('div').last().find('input').last().controller('ngModel');

      expect(scope.list).to.have.length(2);

      nNgModelCtrl.$setViewValue('a');

      expect(scope.list).to.have.length(2);

      sNgModelCtrl.$setViewValue('m');

      expect(scope.list).to.have.length(2);

      nNgModelCtrl.$setViewValue('3');

      expect(scope.list).to.have.length(3);
    });

  });

});
