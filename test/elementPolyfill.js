(function() {
  'use strict';

  /* global document */

  var body = angular.element(document.body);
  var prototype = Object.getPrototypeOf(body);

  if (!('eq' in prototype)) {
    prototype.eq = function(index) {
      if (index < 0) {
        index = this.length + index;
      }
      return angular.element(this[index]);
    };
  }

  if (!('last' in prototype)) {
    prototype.last = function() {
      return this.eq(-1);
    };
  }

  if (!('first' in prototype)) {
    prototype.first = function() {
      return this.eq(0);
    };
  }
})();
