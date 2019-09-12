CREATE TABLE `users` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `activo` int(1) NOT NULL DEFAULT '1',  
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verificado` int(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=latin1;