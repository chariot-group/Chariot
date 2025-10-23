# Configuration Prometheus & AlertManager

## Vue d'ensemble

La configuration de Prometheus et AlertManager utilise des variables d'environnement stockées dans `.env.prometheus`. Cela permet :

- **Séparation des secrets** : Les identifiants SMTP et autres données sensibles ne sont pas commités
- **Flexibilité** : Facilement modifier la configuration selon l'environnement (dev/integ/prod)
- **Normalisation** : Suit les bonnes pratiques de gestion de configuration

## Architecture

```
.env.prometheus                    # Variables d'environnement (IGNORÉ par git)
│
├── prometheus.yml.template        # Template Prometheus avec placeholders ${...}
│   └── scripts/prometheus-entrypoint.sh  # Script qui génère prometheus.yml
│
└── alertmanager.yml.template      # Template AlertManager avec placeholders ${...}
    └── scripts/alertmanager-entrypoint.sh # Script qui génère alertmanager.yml
```

## Setup

### 1. Copier le fichier d'exemple

```bash
# Pour la première utilisation
cp .env.prometheus.example .env.prometheus
```

Si `.env.prometheus.example` n'existe pas, créez-le en copiant `.env.prometheus` après configuration.

### 2. Configurer `.env.prometheus`

Éditez `.env.prometheus` avec vos valeurs :

```bash
# Sections principales
ALERTMANAGER_SMTP_PASSWORD=your_actual_smtp_password
ALERTMANAGER_RECEIVER_EMAIL=your_email@company.com
PROMETHEUS_ENVIRONMENT=development  # ou 'production'
```

### 3. Importer dans compose

Les fichiers `docker-compose.yml`, `compose.integ.yml` et `compose.prod.yml` chargent automatiquement `.env.prometheus` via Docker Compose si le fichier existe.

## Variables d'environnement

### Prometheus

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PROMETHEUS_ENVIRONMENT` | Environnement (dev/prod) | `development` |
| `PROMETHEUS_MONITOR_NAME` | Nom du monitor global | `chariot-monitor` |
| `PROMETHEUS_RETENTION_TIME` | Durée de conservation | `15d` |
| `PROMETHEUS_SCRAPE_INTERVAL` | Intervalle scrape global | `15s` |
| `PROMETHEUS_EVALUATION_INTERVAL` | Intervalle d'évaluation règles | `15s` |

### AlertManager - SMTP

| Variable | Description | Exemple |
|----------|-------------|---------|
| `ALERTMANAGER_SMTP_FROM` | Adresse d'expéditeur | `contact@chariot.tools` |
| `ALERTMANAGER_SMTP_HOST` | Serveur SMTP | `smtp.hostinger.com` |
| `ALERTMANAGER_SMTP_PORT` | Port SMTP | `587` |
| `ALERTMANAGER_SMTP_USER` | Utilisateur SMTP | `contact@chariot.tools` |
| `ALERTMANAGER_SMTP_PASSWORD` | **Secret - Mot de passe SMTP** | N/A |
| `ALERTMANAGER_SMTP_REQUIRE_TLS` | Forcer TLS | `true` |
| `ALERTMANAGER_RECEIVER_EMAIL` | Destinataire des alertes | `contact@chariot.tools` |

### AlertManager - Grouping

| Variable | Description | Défaut |
|----------|-------------|--------|
| `ALERTMANAGER_GROUP_WAIT` | Attente avant groupage | `30s` |
| `ALERTMANAGER_GROUP_INTERVAL` | Intervalle entre groupes | `5m` |
| `ALERTMANAGER_REPEAT_INTERVAL` | Répétition des alertes | `3h` |
| `ALERTMANAGER_CRITICAL_GROUP_WAIT` | Attente critiques | `10s` |
| `ALERTMANAGER_CRITICAL_REPEAT_INTERVAL` | Répétition critiques | `30m` |

### Targets Prometheus

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PROMETHEUS_SELF_TARGET` | Prometheus lui-même | `localhost:9090` |
| `PROMETHEUS_BACKEND_TARGET` | Backend NestJS | `backend:9000` |
| `PROMETHEUS_CADVISOR_TARGET` | cAdvisor | `cadvisor:8080` |
| `PROMETHEUS_NODE_EXPORTER_TARGET` | Node Exporter | `node-exporter:9100` |
| `PROMETHEUS_MONGODB_EXPORTER_TARGET` | MongoDB Exporter | `mongodb-exporter:9216` |
| `PROMETHEUS_ALERTMANAGER_TARGET` | AlertManager | `alertmanager:9093` |

## Workflow

### Démarrage des containers

1. Docker Compose charge les variables depuis `.env.prometheus`
2. Prometheus utilise le script d'entrée `/prometheus-entrypoint.sh`
3. Le script substitue les variables du template :
   ```bash
   envsubst < prometheus.yml.template > prometheus.yml
   ```
4. Prometheus démarre avec la configuration générée

### Modification de la configuration

1. Éditez `.env.prometheus`
2. Redémarrez les services :
   ```bash
   docker-compose up -d prometheus alertmanager
   ```

## Fichiers à ignorer git

Assurez-vous que `.gitignore` contient :

```
# Environment files (secrets)
.env
.env.local
.env.prometheus
.env.*.local

# Generated configurations (from templates)
prometheus.yml
alertmanager.yml
```

Les fichiers `*.template` sont committés, pas les configurations générées.

## Exemples

### Configuration SMTP pour Hostinger

```env
ALERTMANAGER_SMTP_HOST=smtp.hostinger.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=contact@chariot.tools
ALERTMANAGER_SMTP_PASSWORD=your_app_password
ALERTMANAGER_SMTP_REQUIRE_TLS=true
ALERTMANAGER_SMTP_FROM=contact@chariot.tools
```

### Production - Augmenter la rétention

```env
PROMETHEUS_ENVIRONMENT=production
PROMETHEUS_RETENTION_TIME=30d  # 30 jours au lieu de 15
ALERTMANAGER_REPEAT_INTERVAL=1h  # Alertes plus fréquentes en prod
```

## Dépannage

### L'email d'alerte n'est pas envoyé

1. Vérifier les variables SMTP : `docker logs alertmanager | grep -i smtp`
2. Vérifier que le compte SMTP autorise l'authentification
3. Vérifier que le port n'est pas bloqué

### Template non trouvé lors du démarrage

```
Error: prometheus.yml.template not found
```

**Solution** : Vérifier que le volume est bien monté dans docker-compose :
```yaml
- ./prometheus.yml.template:/etc/prometheus/prometheus.yml.template:ro
```

### Configuration non appliquée après modification

Redémarrer le service pour régénérer la configuration :
```bash
docker-compose down alertmanager prometheus
docker-compose up -d alertmanager prometheus
```

## Bonnes pratiques

1. ✅ **Garder `.env.prometheus` secret** : Ne pas le committer
2. ✅ **Utiliser `.env.prometheus.example`** : Documenter les variables nécessaires
3. ✅ **Valider les templates** : Tester avec `docker run --rm -i ubuntu:latest /bin/bash -c 'envsubst' < template.yml`
4. ✅ **Documenter les changements** : Commenter les modifications non-évidentes dans les templates
5. ✅ **Versionner les templates** : Les fichiers `.template` sont committés pour la traçabilité

## Voir aussi

- [Prometheus Configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [AlertManager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
