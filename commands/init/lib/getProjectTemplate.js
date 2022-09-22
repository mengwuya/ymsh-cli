const request = require('@ymsh-cli/request');

module.exports = function() {
  return request({
    url: '/project/template',
  });
};
