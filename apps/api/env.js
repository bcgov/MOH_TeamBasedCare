const path = require('path');
const NonLocalEnvironments = ['docker', 'remote'];
const NodeEnv = process.env.NODE_ENV;
if (!NonLocalEnvironments.includes(NodeEnv)) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

module.exports = {};
