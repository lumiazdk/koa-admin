const Client = require("mysql-pro");
const config = require('../config')
const client = new Client({
    mysql: {
        host: config.db_host,
        port: config.db_post,
        database: config.db_database,
        user: config.user,
        password: config.db_password
    }
});
module.exports = client