var _ = require('lodash');

module.exports = {
  objectFromPairs: function (pairs) {
    var result = {};
    pairs.forEach(function (pair) {
      if (result[pair[0]]) {
        result[pair[0]].push(pair[1]);
      } else {
        result[pair[0]] = [pair[1]];
      }
    });
    for (var key in result) {
      if (result[key].length === 1) {
        result[key] = result[key][0];
      }
    }
    return result;
  },
  objectToPairs: function (object) {
    return _.toPairs(object).
      map(function (pair) {
        if (!Array.isArray(pair[1])) {
          pair[1] = [pair[1]];
        }
        return pair;
      }).
      reduce(function (all, pair) {
        pair[1].
          map(function (nested) {
            return [pair[0], nested];
          }).
          forEach(function (pair) {
            all.push(pair);
          });
        return all;
      }, []);
  },
  clock: {
    wait: function (amount) {
      return function() {
        return new Promise(function (resolve) {
          setTimeout(resolve, amount);
        });
      };
    }
  }
};
