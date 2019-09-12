const express = require('express');
const router = express.Router(); // Manejo de Rutas
const jwt = require('jsonwebtoken');
const pool = require('../database');
const helpers = require('../helpers');
const nodeMailer = require('nodemailer');
const {jwt_key, email_key} = require('../keys');
const axios = require('axios'); // Permite llamadas AJAX desde NodeJS

// =================================================== METODOS PROTEGIDOS CON JWT ===================================================

// Retorna el Balance del address Logueado
router.get('/api/profile', verificarToken, async (req, res) => {
	jwt.verify(req.token, jwt_key.secret_pass, async (err, data) => {	
		let result = data.user;	 	
	 	console.log("====> /api/profile");
		res.json({
	  		status : 'ok',
			result
	  	});
	});
});

// =================================================== METODOS PUBLICOS ===================================================

// Registro de Usuarios
router.post('/api/register', async (req, res) => {
	const {email, password} = req.body;
	let msj = "";
	
	if(email && password){
		const user = await pool.query('SELECT id FROM users where email = ? ', [email]);
		
		if(user.length > 0){
			msj = {
		    	"status" : 'error',
		    	"msg" : "El email "+email+" ya existe en la BD",
		    	"details" : "Ingrese otro email para registrarse",
		    }
		} else {
							    
		    // Creo la estructura del usuario para guardar
			const newUser = {
				email,
				password,
				activo : 1,
				verificado: 0,
			};

			
				newUser.password = await helpers.encryptPassword(password); // Encripto la contraseña
				const result = await pool.query('INSERT INTO users set ? ', [newUser]); // Inserto el registro
				newUser.id = result.insertId; // Asigno el ID insertado en la BD al objeto Usuario
				
				msj = {
			    	"status" : 'ok',
			    	"msg" : "El usuario se registró correctamente",
			    	"user" : newUser,	    	
			    }

			    // Enviar mail, para validar el registro
			    let transporter = nodeMailer.createTransport({
				      host: 'smtp.gmail.com',
				      port: 465,
				      secure: true,
				      auth: {
				          // should be replaced with real sender's account
				          user: email_key.user,
				          pass: email_key.password,
				      }
				  });
				  let mailOptions = {
				      // should be replaced with real recipient's account
				      to: email,
				      subject: 'Prueba JWT',
				      html: "<p>Bienvenido </p><p>Para confirmar el registro por favor haga <a href='http://10.10.2.250:4000/api/verifiy?hash="+newUser.password+"&id="+newUser.id+"' target='_blank'>click aquí</a> </p>", // HTML
				  };
				  await transporter.sendMail(mailOptions, (error, info) => {
				      if (error) {
				          return console.log(error);
				      }
				      console.log('Message %s sent: %s', info.messageId, info.response);
				  });
			
			
		}

	} else {
		msj = {
	    	"status" : 'error',
	    	"msg" : "No se recibieron datos",
	    	"details" : "Envie por POST el email y contrasenia a registrar",
	    }
	}
	
	console.log("====> /api/register", msj.status);
	res.json({
		msj
	})
});

// Login de Usuarios y entrega de Token
router.post('/api/login', async (req, res) => {
	const {email, password} = req.body;
	let token;
	let status;
	let mensaje;
	let user;
	
	try{
		if(email.length > 0){
			const rows = await pool.query('SELECT * FROM users WHERE email = ?', [email]);			

			if (rows.length > 0) {
				user = rows[0];

				if(user.verificado == '1'){
					const validPassword = await helpers.matchPassword(password, user.password)
				
					if (validPassword) {
						token = jwt.sign({user}, jwt_key.secret_pass);
						status = 'ok';
						mensaje = 'Login correcto';
				    } else {	    	
						status = 'error';
						mensaje = 'Contrasenia incorrecta';			
				    }
				} else {
					status = 'error';
					mensaje = 'El usuario ingresado no ha verificado su cuenta.';
				}				
			} else {
				status = 'error';
				mensaje = 'El usuario ingresado no existe en la BD';
			}	
		} else {
			status = 'error';
			mensaje = 'Debe enviar el parametro email';
		}
	} catch (e) {
		status = 'error';
		mensaje = e.message;		
	}	
	
	console.log("====> /api/login", email, mensaje);
	res.json({
		status : status,
		token : token,
		mensaje: mensaje,
		//user: user,
	})
});

// Verificación del registro de Usuarios
router.get('/api/verifiy', async (req, res) => {
	const {hash, id } = req.query;
	const result = await pool.query('UPDATE users SET verificado = 1 WHERE password =  ? AND id = ?', [hash, id]);
	
	if(result.affectedRows === 1){		
		status = 'ok';		
	} else {
		status = 'error';
	}
	
	console.log("====> /api/verify", hash, status);
	res.json({
		status : status,
		result 
	})
});

router.post('/api/recovery', async (req, res) => {
  let email = req.body.email;  
  // Primero valido que el correo exista en la BD
  const row = await pool.query('SELECT id FROM users WHERE email = ?', email); 
  
  if(row.length > 0){
    let user = row[0];
    let password = 'jwt_'+Math.floor(Math.random() * 101);
    let hash_password = await helpers.encryptPassword(password);

    // Actualizo el password en la BD
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash_password, user.id] ); 

    // Enviar mail, para validar el registro
    let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            // should be replaced with real sender's account
            user: email_key.user,
            pass: email_key.password,
        }
    });
    let mailOptions = {
        // should be replaced with real recipient's account
        to: email,
        subject: 'JWT - Recuperar Contraseña',
        html: "<p>JWT</p><p>Su nueva contraseña para acceder es <b>"+password+"</b> </p>", // HTML
    };
    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("====> /api/recovery", error);
			res.json({
				status : 'error',
				codigo : 1,
			})
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        res.json({
			status : 'ok',
			codigo : 0,
		})
        
    });

  } else {    
	console.log("====> /api/recovery", email, 'error #2');
	res.json({
		status : 'error',
		codigo : 2,
	})
  }

});

module.exports = router; // Eporto el módulo con las rutas definidas

// Middlewares
function verificarToken(req, res, next) {
	const bearerHeader = req.headers['authorization'];
	
	if(typeof bearerHeader !== 'undefined'){
		const bearer = bearerHeader.split(" ");
		const bearerToken = bearer[1];
		req.token = bearerToken;		
		next(); // Le indico que el código continue
	} else {
		console.log("No se envió el token correctamente");
		res.json({
			status : 'error',
			mensaje : 'Revisar la cabecera enviada',
		})
	}
}