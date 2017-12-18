module.exports.flatten = function (people) {
  if (!Array.isArray(people)) return [];
  return people.map(function (person) {
    if(typeof person === 'string') return person;
    return person.email;
  });
};

module.exports.expand = function (people) {
  if (!Array.isArray(people)) return [];
  return people.map(function (person) {
    if (typeof person === 'string') return {
      email: person
    };
    return person;
  });
};
