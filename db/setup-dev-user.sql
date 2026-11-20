-- Ejecutar una vez desde MySQL Workbench conectado como administrador.
CREATE USER IF NOT EXISTS 'jmo_app'@'localhost' IDENTIFIED BY 'JmoDev_2026!';
ALTER USER 'jmo_app'@'localhost' IDENTIFIED BY 'JmoDev_2026!';
GRANT SELECT, INSERT, UPDATE, DELETE ON colegio_jose_maria_obando.* TO 'jmo_app'@'localhost';
SHOW GRANTS FOR 'jmo_app'@'localhost';
