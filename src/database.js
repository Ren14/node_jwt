const mysql = require('mysql');
const {promisify} = require('util');
const {database} = require('./keys');

const pool = mysql.createPool(database);

pool.getConnection((err, connection) => {
	if(err) {
		if(err.code === 'PROTOCOL_CONNECTION_LOST'){
			console.error('La conexion con la BD fue cerrada');
		}

		if(err.code === 'ER_CON_COUNT_ERROR'){
			console.log('Database has to many conecctions');
		}

		if(err.code === 'ECONNREFUSED'){
			console.log('DATABASE CONNECTION WAS REFUSED');
		}
	}

	if(connection) connection.release(); // Comienza la conexión
	console.log('DB is Connected');
	return;
});

// Permite utilizar promesas para realizar consultas a la BD. Convierto los callbacks a promesas
pool.query = promisify(pool.query);

module.exports = pool;
