const Client = require("mysql-pro");
const config = require('../config')

const client = new Client({
    mysql: {
        host: config.db_host,
        port: config.db_port,
        database: config.db_name,
        user: config.db_user,
        password: config.db_pass
    }
});
module.exports = client