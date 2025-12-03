-- Script d'initialisation pour désactiver SSL sur tous les realms
-- Ce script est exécuté après l'import des realms par Keycloak

-- Désactiver SSL pour le realm master
UPDATE realm SET ssl_required = 'NONE' WHERE name = 'master';

-- Désactiver SSL pour le realm chariot
UPDATE realm SET ssl_required = 'NONE' WHERE name = 'chariot';

-- Afficher la configuration
SELECT name, ssl_required FROM realm;
