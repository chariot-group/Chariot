# Migration vers Configuration Prometheus Externalisée

## 🎯 Objectif

Passer d'une configuration Prometheus statique à une configuration dynamique utilisant des variables d'environnement pour améliorer la sécurité et la flexibilité.

## ✨ Bénéfices

- **Sécurité** : Les secrets (SMTP) ne sont plus commités
- **Flexibilité** : Configuration différente par environnement (dev/integ/prod)
- **Normalisation** : Suit les bonnes pratiques de gestion de configuration
- **Maintenance** : Plus facile de modifier la config sans éditer les templates

## 📋 Changements effectués

### Fichiers ajoutés

```
.env.prometheus              # Variables d'environnement (à créer, ignoré par git)
.env.prometheus.example      # Exemple pour documentation
prometheus.yml.template      # Template avec placeholders
alertmanager.yml.template    # Template avec placeholders
scripts/prometheus-entrypoint.sh     # Script d'initialisation
scripts/alertmanager-entrypoint.sh   # Script d'initialisation
setup-prometheus.sh          # Script de setup initial
docs/technical/PROMETHEUS_ENV_CONFIG.md  # Documentation complète
```

### Fichiers modifiés

- `compose.yml` - Intégration des templates et scripts
- `compose.integ.yml` - Intégration des templates et scripts
- `compose.prod.yml` - Intégration des templates et scripts
- `.env.example` - Ajout des sections Prometheus/AlertManager
- `.gitignore` - Ajout des fichiers à ignorer

### Fichiers dépréciés

- `prometheus.yml` - Remplacé par `prometheus.yml.template` + script
- `alertmanager.yml` - Remplacé par `alertmanager.yml.template` + script

## 🚀 Migration

### Pour les utilisateurs existants

#### 1. Pull les changements

```bash
git pull origin 448-configuration-de-prometheus
```

#### 2. Exécuter le script de setup

```bash
./setup-prometheus.sh
```

Ce script :
- Crée `.env.prometheus` à partir de `.env.prometheus.example`
- Vérifie que les templates existent
- Rend les scripts exécutables

#### 3. Configurer `.env.prometheus`

Éditez `.env.prometheus` et remplacez les valeurs fictives :

```bash
# SMTP - Remplacer avec vos coordonnées
ALERTMANAGER_SMTP_FROM=contact@chariot.tools
ALERTMANAGER_SMTP_HOST=smtp.hostinger.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=contact@chariot.tools
ALERTMANAGER_SMTP_PASSWORD=votre_mot_de_passe_reel  # ⚠️  Important!
ALERTMANAGER_RECEIVER_EMAIL=contact@chariot.tools
```

#### 4. Redémarrer les services

```bash
docker-compose up -d prometheus alertmanager
```

### Pour les nouveaux utilisateurs

```bash
# Clone du repo
git clone ...
cd chariot

# Setup initial
./setup-prometheus.sh

# Configuration
vi .env.prometheus  # Éditer les secrets

# Lancer
docker-compose up -d
```

## 🔍 Vérification

### Vérifier que les configurations sont générées

```bash
# Attendre quelques secondes après le démarrage, puis :
docker exec prometheus cat /etc/prometheus/prometheus.yml
docker exec alertmanager cat /etc/alertmanager/alertmanager.yml
```

Les fichiers doivent afficher les valeurs réelles (pas les placeholders `${...}`).

### Vérifier les logs

```bash
# Prometheus
docker logs prometheus | grep -i "configuration\|error"

# AlertManager
docker logs alertmanager | grep -i "configuration\|error"
```

### Tester les alertes

```bash
# Accéder à AlertManager
open http://localhost:9093

# Les alertes doivent être visibles
```

## 🔐 Sécurité

### Important ⚠️

- **NE COMMITEZ PAS `.env.prometheus`** avec des secrets réels
- Le fichier `.gitignore` l'ignore automatiquement
- En production, utilisez un gestionnaire de secrets (Vault, AWS Secrets Manager, etc.)

### .gitignore mis à jour

```bash
# Fichiers ignorés automatiquement :
.env
.env.prometheus
.env.*.local
prometheus.yml      # Généré, pas à committer
alertmanager.yml    # Généré, pas à committer
```

## 📊 Workflow

```
Développeur édite .env.prometheus (local)
                    ↓
docker-compose up -d
                    ↓
Script prometheus-entrypoint.sh s'exécute
                    ↓
Substitution : prometheus.yml.template → prometheus.yml
                    ↓
Prometheus démarre avec la config générée
```

## 🔧 Personnalisation

### Ajouter une nouvelle variable

1. Ajouter dans `.env.prometheus.example` :
   ```env
   PROMETHEUS_NEW_VAR=default_value
   ```

2. Ajouter dans `prometheus.yml.template` ou `alertmanager.yml.template` :
   ```yaml
   some_config: ${PROMETHEUS_NEW_VAR}
   ```

3. Ajouter au service dans `compose.yml` :
   ```yaml
   environment:
     - PROMETHEUS_NEW_VAR=${PROMETHEUS_NEW_VAR}
   ```

4. Committer les templates et exemple, pas les secrets

## ❓ FAQ

**Q: Pourquoi deux fichiers de config (yml et template) ?**
A: Le template est versionné (pour l'historique), le yml généré ne l'est pas (il contient les secrets).

**Q: Puis-je modifier prometheus.yml directement ?**
A: Non, il sera écrasé au prochain démarrage. Éditer le template ou les variables d'env.

**Q: Comment passer à une nouvelle version ?**
A: Pull la branche, exécuter `./setup-prometheus.sh`, redémarrer les services.

**Q: Que faire si je oublie de configurer .env.prometheus ?**
A: Les scripts utilisent des valeurs par défaut, mais les alertes SMTP ne fonctionneront pas. Un warning est affiché.

## 📚 Documentation

Pour plus de détails, consultez :
- `docs/technical/PROMETHEUS_ENV_CONFIG.md` - Configuration détaillée
- `scripts/README.md` - Documentation des scripts
- `.env.prometheus.example` - Liste des variables avec descriptions

## 🆘 Support

En cas de problème :

1. Vérifier les logs :
   ```bash
   docker logs prometheus
   docker logs alertmanager
   ```

2. Valider le template manuellement :
   ```bash
   envsubst < prometheus.yml.template | head -20
   ```

3. Consulter la documentation : `docs/technical/PROMETHEUS_ENV_CONFIG.md`

---

**Status** : ✅ Configuration déployée et testée
**Version** : 1.0
**Date** : Octobre 2025
