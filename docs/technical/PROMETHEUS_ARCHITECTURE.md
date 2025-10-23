# Standards de Configuration - Prometheus & AlertManager

## 📐 Architecture décidée

Suite à une analyse approfondie du projet Chariot, voici l'approche retenue pour la configuration Prometheus et AlertManager.

## 🎯 Principes

1. **Externalisation des secrets** : Pas de données sensibles dans le contrôle de version
2. **Variables d'environnement** : Source unique de vérité pour la configuration
3. **Templates réutilisables** : Configurations cohérentes entre dev/integ/prod
4. **Scriptabilité** : Substitution automatique lors du démarrage
5. **Documentation** : Chaque variable documentée et exemplifiée

## 📋 Convention de nommage

### Variables Prometheus

```
PROMETHEUS_{DOMAINE}_{ASPECT}
```

Exemples :
- `PROMETHEUS_ENVIRONMENT` - Environnement global
- `PROMETHEUS_RETENTION_TIME` - Stockage
- `PROMETHEUS_SCRAPE_INTERVAL` - Scraping
- `PROMETHEUS_BACKEND_TARGET` - Configuration d'une cible
- `PROMETHEUS_BACKEND_METRICS_PATH` - Détail d'une cible

### Variables AlertManager

```
ALERTMANAGER_{ASPECT}_{DETAIL}
```

Exemples :
- `ALERTMANAGER_SMTP_HOST` - Configuration SMTP
- `ALERTMANAGER_SMTP_PASSWORD` - Secret SMTP
- `ALERTMANAGER_RECEIVER_EMAIL` - Destinataire
- `ALERTMANAGER_GROUP_WAIT` - Groupage des alertes

## 🏗️ Structure des fichiers

```
chariot/
├── .env.prometheus              # ❌ IGNORE PAR GIT (secrets réels)
├── .env.prometheus.example      # ✅ Exemple public
├── prometheus.yml.template      # ✅ Template versionné
├── alertmanager.yml.template    # ✅ Template versionné
├── prometheus.yml               # ❌ IGNORE PAR GIT (généré)
├── alertmanager.yml             # ❌ IGNORE PAR GIT (généré)
├── scripts/
│   ├── prometheus-entrypoint.sh     # ✅ Script d'init
│   └── alertmanager-entrypoint.sh   # ✅ Script d'init
├── compose.yml                  # ✅ Intégre les templates
├── compose.integ.yml            # ✅ Intégre les templates
├── compose.prod.yml             # ✅ Intégre les templates
└── docs/
    └── technical/
        └── PROMETHEUS_ENV_CONFIG.md  # ✅ Documentation
```

## 🔄 Flux de déploiement

```
1. Docker compose charge .env.prometheus
   └─ docker-compose.yml lit les variables

2. Service Prometheus démarre
   └─ Exécute /prometheus-entrypoint.sh

3. Script substitue les variables
   └─ envsubst < prometheus.yml.template > prometheus.yml

4. Prometheus démarre avec la config générée
   └─ Démarre avec les vrais secrets
```

## 📊 Variables essentielles

### Tierung des variables

**CRITIQUES** (secrets, ne jamais committer)
```env
ALERTMANAGER_SMTP_PASSWORD         # Mot de passe SMTP
ALERTMANAGER_RECEIVER_EMAIL        # Email destinataire
```

**IMPORTANTES** (configuration métier)
```env
PROMETHEUS_ENVIRONMENT             # dev/prod
PROMETHEUS_RETENTION_TIME          # Durée de conservation
ALERTMANAGER_SMTP_HOST             # Serveur SMTP
```

**CONFIGURABLE** (fine-tuning)
```env
PROMETHEUS_SCRAPE_INTERVAL         # 15s par défaut
ALERTMANAGER_GROUP_WAIT            # 30s par défaut
```

### Valeurs par défaut

Chaque variable a une **valeur par défaut** saine définie dans le script :

```bash
export VAR="${VAR:-default_value}"
```

Permet un démarrage même sans `.env.prometheus` (mais dégradé).

## ✅ Bonnes pratiques appliquées

### 1. **Séparation des préoccupations**

| Fichier | Responsabilité |
|---------|-----------------|
| `.env.prometheus` | Secrets & config spécifique env |
| `*.template` | Structure et logique |
| `*.entrypoint.sh` | Substitution & démarrage |
| `compose*.yml` | Orchestration |

### 2. **Documentation in-situ**

```yaml
# Template avec commentaires explicatifs
global:
  # Intervalle de scrape (ex: 15s, 1m)
  scrape_interval: ${PROMETHEUS_SCRAPE_INTERVAL}
  
  # Labels ajoutés à TOUTES les métriques
  external_labels:
    monitor: '${PROMETHEUS_MONITOR_NAME}'
```

### 3. **Nommage cohérent**

Les noms reflètent :
- Le composant (`PROMETHEUS_*`, `ALERTMANAGER_*`)
- Le domaine (`SMTP_*`, `SCRAPE_*`, `GROUP_*`)
- Le détail spécifique (`_HOST`, `_PORT`, `_PASSWORD`)

### 4. **Exemple documenté**

`.env.prometheus.example` contient :
- **Toutes** les variables
- Des valeurs _exemples_ appropriées
- Des explications inline
- Des commentaires de sécurité

```env
# SMTP Configuration (required for email notifications)
ALERTMANAGER_SMTP_FROM=contact@chariot.tools    # Exemple valide
ALERTMANAGER_SMTP_PASSWORD=your_secure_...      # Placeholder clair
```

## 🔐 Politique de sécurité

### Fichiers secrets

**À ignorer par git** :
```
.env                        # General secrets
.env.local                  # Dev overrides
.env.prometheus             # Prometheus secrets
.env.prometheus.local       # Prometheus dev overrides
prometheus.yml              # Config générée avec secrets
alertmanager.yml            # Config générée avec secrets
```

### En production

**Recommandations** :
- Utiliser un gestionnaire de secrets (HashiCorp Vault)
- Montrer en lecture seule via Docker secrets
- Auditer les accès
- Rotater les mots de passe régulièrement

**Exemple avec Docker Secrets** :
```yaml
alertmanager:
  secrets:
    - alertmanager_smtp_password
  environment:
    - ALERTMANAGER_SMTP_PASSWORD_FILE=/run/secrets/alertmanager_smtp_password
```

## 🧪 Tests & Validation

### Valider un template

```bash
# Test de substitution manuelle
export PROMETHEUS_ENVIRONMENT=test
envsubst < prometheus.yml.template | head -20

# Vérifier la syntaxe YAML
docker run --rm -v $PWD:/config \
  prom/prometheus:latest \
  --config.file=/config/prometheus.yml check
```

### Vérifier après démarrage

```bash
# Voir la config générée
docker exec prometheus cat /etc/prometheus/prometheus.yml | head -20

# Vérifier les logs
docker logs prometheus | grep -i error
```

## 🔄 Évolution future

### Escalabilité

Pour passer à **plusieurs instances** Prometheus :
```env
PROMETHEUS_1_NAME=prometheus-prod-1
PROMETHEUS_1_STORAGE_PATH=/prometheus-1
PROMETHEUS_2_NAME=prometheus-prod-2
PROMETHEUS_2_STORAGE_PATH=/prometheus-2
```

### Intégration CD/CD

```bash
# GitOps approach
.env.prometheus.vault     # Secrets from HashiCorp Vault
.env.prometheus.encrypted # Encrypted with git-crypt
```

## 📚 Référence

### Normes suivies

- **12 Factor App** : Configuration via env
- **Docker Best Practices** : Secrets et configurations séparées
- **Prometheus** : Standard de templating
- **Bash/Shell** : Scripts POSIX-compliant

### Ressources

- [12 Factor - Config](https://12factor.net/config)
- [Docker Secrets Best Practices](https://docs.docker.com/engine/swarm/secrets/)
- [Prometheus Configuration](https://prometheus.io/docs/prometheus/latest/configuration/)
- [AlertManager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)

## ✨ Résumé

| Aspect | Solution |
|--------|----------|
| **Secrets** | Variables env non committées |
| **Configuration** | Templates + substitution |
| **Flexibilité** | Same template, different env |
| **Documentation** | Inline + markdown files |
| **Normalisation** | Suivre 12FA + Docker best practices |
| **Maintenance** | Scripts d'entrée gèrent tout |

---

**Décision architecturale validée** ✅
**Date** : Octobre 2025
**Auteur** : Configuration Team
