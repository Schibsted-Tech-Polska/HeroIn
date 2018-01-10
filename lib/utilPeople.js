module.exports.expand = expand;
module.exports.flatten = flatten;
module.exports.flattenAll = all(flatten);
module.exports.expandAll = all(expand);

function flatten(person) {
  if(typeof person === 'string') return person;
  return person.email;
}

function expand(person) {
  if (typeof person === 'string') return {
    email: person
  };
  return person;
}

function all(operation) {
  return function (people) {
    if (!Array.isArray(people)) return [];
    return people.map(operation);
  };
}
