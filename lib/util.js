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
  }
};
