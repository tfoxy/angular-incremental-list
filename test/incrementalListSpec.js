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
      scope.list = ['5', '3', '9'];
      var t = '<div><input ng-repeat="item in list" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      assert.isDefined(ilListCtrl);
    }));

    it('has the passed list inside the controller', inject(function() {
      scope.list = ['5', '3', '9'];
      var t = '<div><input ng-repeat="item in list" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      expect(ilListCtrl.list).to.deep.equal(scope.list);
    }));

    it ('is created once per ng-repeat', inject(function() {
      scope.list = ['5', '3', '9'];
      scope.spy = sinon.spy(function() {
        return scope.list;
      });
      var t = '<div><input ng-repeat="item in list" il-list="spy()"></div>';
      compileAndDigest(t);
      assert.isTrue(scope.spy.calledOnce);
    }));

  });

  describe('ilItemModel directive', function() {

    it('listen to the changes of the model', inject(function() {
      scope.list = ['5', '3', '9'];
      var t = '<div><input ' +
          'ng-repeat="item in list" il-list="list" ' +
          'ng-model="item" il-item-model></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      var ngModelCtrl = element.find('input').controller('ngModel');
      var spy = ilListCtrl.listItemChanged = sinon.spy();
      ngModelCtrl.$setViewValue('7');
      assert.isTrue(spy.calledOnce);
      assert.isTrue(spy.withArgs(element.find('input').scope()).calledOnce);
    }));

  });

  describe('ilList controller', function() {

    it('adds a new item if last item in the list is defined', inject(function() {
      scope.list = ['5', '3', '9'];
      var listLength = scope.list.length;
      var t = '<div><input ng-repeat="item in list" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(element.find('input').last().scope());
      expect(scope.list.length).to.equals(listLength + 1);
    }));

    it('deletes one item if the last two items are not defined', inject(function() {
      scope.list = ['5', '3', '', ''];
      var listLength = scope.list.length;
      var t = '<div><input ng-repeat="item in list track by $index" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(element.find('input').last().scope());
      expect(scope.list.length).to.equals(listLength - 1);
    }));

    it('deletes two items if the last three items are not defined', inject(function() {
      scope.list = ['5', '', '', ''];
      var listLength = scope.list.length;
      var t = '<div><input ng-repeat="item in list track by $index" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(element.find('input').last().scope());
      expect(scope.list.length).to.equals(listLength - 2);
    }));

    it('deletes all items except the penultimate if all items are not defined' +
        ' and the focus is on the penultimate', inject(function() {
      scope.list = ['', '', null, ''];
      var t = '<div><input ng-repeat="item in list track by $index" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(element.find('input').eq(-2).scope());
      expect(scope.list).to.deep.equal([null]);
    }));

    it('deletes all items except the last if all items are not defined' +
        ' and the focus is on the last item', inject(function() {
      scope.list = ['', '', '', null];
      var t = '<div><input ng-repeat="item in list track by $index" il-list="list"></div>';
      var element = compileAndDigest(t);
      var ilListCtrl = element.find('input').controller('ilList');
      ilListCtrl.listItemChanged(element.find('input').last().scope());
      expect(scope.list).to.deep.equal([null]);
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

      ilListSubCtrl.listItemChanged(lastInput.scope());

      expect(scope.list).to.have.property('length', 3);
    });

  });

});
