describe('incrementalList', function() {
  'use strict';

  var scope, compileAndDigest;

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

    it('creates a controller', inject(function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: '9'}];
      var t = '<div><input ng-repeat="item in list" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      assert.isDefined(ilListCtrl);
    }));

    it('has the passed list inside the controller', inject(function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: '9'}];
      var t = '<div><input ng-repeat="item in list" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      expect(ilListCtrl.list).to.deep.equal(scope.list);
    }));

    it('is created once per ng-repeat', inject(function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: '9'}];
      scope.spy = sinon.spy(function() {
        return scope.list;
      });
      var t = '<div><input ng-repeat="item in list" il-list="spy()"></div>';
      compileAndDigest(t);
      assert.isTrue(scope.spy.calledOnce);
    }));

    describe('$$ilListScope property', function() {

      it('is created on every item', inject(function() {
        var item = {s: '5'};
        scope.list = [item, {s: '3'}, {s: '9'}];
        var t = '<div><input ng-repeat="item in list" il-list="list"></div>';
        compileAndDigest(t);
        expect(item).to.have.property('$$ilListScope');
      }));

      it('is not enumerable', inject(function() {
        var item = {s: '5'};
        scope.list = [item, {s: '3'}, {s: '9'}];
        var t = '<div><input ng-repeat="item in list" il-list="list"></div>';
        compileAndDigest(t);

        for (var key in item) {
          expect(key).to.match(/^(s|\$\$hashKey)$/);
        }
      }));

    });

  });

  describe('ilItemModel directive', function() {

    it('listen to the changes of the model', inject(function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: '9'}];
      var t = '<div><input ' +
          'ng-repeat="item in list" il-list="list" ' +
          'ng-model="item.s" il-item-model></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      var ngModelCtrl = element.find('input').controller('ngModel');
      var spy = ilListCtrl.listItemChanged = sinon.spy();
      ngModelCtrl.$setViewValue('7');
      expect(spy).to.have.property('calledOnce', true);
      expect(spy.withArgs(0)).to.have.property('calledOnce', true);
    }));

  });

  describe('ilList controller', function() {

    it('adds a new item if last item in the list is defined', inject(function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: '9'}];
      var listLength = scope.list.length;
      var t = '<div><input ng-repeat="item in list" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(listLength - 1);
      expect(scope.list.length).to.equals(listLength + 1);
    }));

    it('deletes one item if the last two items are not defined', inject(function() {
      scope.list = [{s: '5'}, {s: '3'}, {s: ''}, {s: ''}];
      var listLength = scope.list.length;
      var t = '<div><input ng-repeat="item in list track by $index" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(listLength - 1);
      expect(scope.list.length).to.equals(listLength - 1);
    }));

    it('deletes two items if the last three items are not defined', inject(function() {
      scope.list = [{s: '5'}, {s: ''}, {s: ''}, {s: ''}];
      var listLength = scope.list.length;
      var t = '<div><input ng-repeat="item in list track by $index" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(listLength - 1);
      expect(scope.list.length).to.equals(listLength - 2);
    }));

    it('deletes all items except the penultimate if all items are not defined' +
        ' and the focus is on the penultimate', inject(function() {
      scope.list = [{s: ''}, {s: ''}, {s: null}, {s: ''}];
      var t = '<div><input ng-repeat="item in list track by $index" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(scope.list.length - 2);
      expect(scope.list).to.have.property('length', 1);
      expect(scope.list[0]).to.have.property('s', null);
    }));

    it('deletes all items except the last if all items are not defined' +
        ' and the focus is on the last item', inject(function() {
      scope.list = [{s: ''}, {s: ''}, {s: ''}, {s: null}];
      var t = '<div><input ng-repeat="item in list track by $index" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(scope.list.length - 1);
      expect(scope.list).to.have.property('length', 1);
      expect(scope.list[0]).to.have.property('s', null);
    }));

  });

  describe('ilListModel directive', function() {

    it('updates the parent ilList', function() {
      scope.list = [
        {n: 5, sub: [{n: 2}]},
        {n: 4, sub: [{n: 3}]}
      ];

      var t = '<ol>' +
          '<li ng-repeat="item in list" il-list="list">' +
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
      var ilListSubCtrl = lastInput.controller('ilList');

      ilListSubCtrl.listItemChanged(0);

      expect(scope.list).to.have.property('length', 3);
    });

  });

});
