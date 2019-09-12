// Modulos Requeridos
const express = require('express'); // Framework de JS
const morgan = require('morgan'); // Mostrar peticiones por consola

// Inicializacion de Variables
const app = express(); 


// Configuracion de variables del servidor
app.set('port', process.env.PORT || 4000); // Puerto disponible OR Puerto #####
app.set('ip', '10.10.2.250'); // IP donde correrá el servidor. Colocar 0.0.0.0 en producción.


// Middleware
app.use(morgan('dev')); //Utilizo Morgan en Desarrollo
app.use(express.json()); //Utilizo express para retornar Json
app.use(express.urlencoded({extended: false})); // Aceptar desde los forms los datos que envía el usuaio


// Variables Globales
app.use((req, res, next) => {
	// Habilito el acceso desde otras IP'S
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Credentials", "*");
  	res.header("Access-Control-Allow-Headers", "*");
	next(); // Continúo con la ejecución del código
});


// Enrutadores. Incluyo el script donde defino las rutas de la API REST
app.use(require('./routes/api'));


// Inicio del Servidor
app.listen(app.get('port'), app.get('ip'), () => {
	console.log("Servidor iniciado en ", app.get('ip'), app.get('port'));
});
