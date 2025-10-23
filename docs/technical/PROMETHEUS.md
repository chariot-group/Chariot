# 📊 Prometheus et AlertManager - Guide Complet

## 📋 Vue d'ensemble

Ce guide couvre l'implémentation complète et la résolution de la configuration de Prometheus et AlertManager dans le projet Chariot.

- **Architecture** : Configuration basée sur des variables d'environnement
- **Sécurité** : Credentials protégées dans `.env.prometheus` (Git-ignoré)
- **Multi-environnements** : Support pour dev, integ, et prod
- **Statut** : ✅ Fonctionnel et stable

---

## 🏗️ Architecture Technique

### Pattern d'implémentation

```
┌─────────────────────────────────────────────────┐
│         Docker Compose Files                    │
│  (compose.yml, integ, prod)                    │
└─────────────────────────────────────────────────┘
           │
           ├─ env_file: .env.prometheus
           │  (Variables d'environnement chargées à runtime)
           │
           ├─ volumes:
           │  ├─ prometheus.yml.template
           │  └─ alertmanager.yml.template
           │  (Configuration avec placeholders ${VAR})
           │
           └─ entrypoint: /usr/local/bin/*-entrypoint.sh
              (Scripts de substitution de variables)
```

### ⚠️ Compatibilité multi-plateforme (Linux vs macOS)

La configuration Prometheus fonctionne sur **toutes les plateformes** (Linux, macOS, Windows) grâce aux **variables d'environnement** :

| Platform | Stratégie | Exemple |
|----------|-----------|---------|
| **Linux** (Prod) | Service names via bridge network | `backend:9000` |
| **macOS** (Docker Desktop) | host.docker.internal | `host.docker.internal:9000` |

**Solution :** Les cibles sont paramétrables via `.env.prometheus` → une seule configuration template fonctionne partout ! 🎉

### Flux d'exécution

1. **Docker Compose démarre** → Charge `.env.prometheus` via `env_file:`
2. **Entrypoint script exécuté** → Lit les variables d'environnement
3. **Substitution sed** → Remplace `${VAR}` dans les templates
4. **Service lancé** → Utilise la configuration générée

### Services et ports

| Service | Image | Port | Endpoint santé |
|---------|-------|------|-----------------|
| Prometheus | `prom/prometheus:latest` | 9090 | `http://localhost:9090/-/healthy` |
| AlertManager | `prom/alertmanager:latest` | 9093 | `http://localhost:9093/-/healthy` |

---

## 📁 Structure des fichiers

### Fichiers de configuration

```
├── prometheus.yml.template           # Template de configuration Prometheus
├── alertmanager.yml.template         # Template de configuration AlertManager
├── .env.prometheus.example           # Exemple de variables d'environnement
├── .env.prometheus                   # ⚠️ Secrets (Git-ignoré, local seulement)
│
├── compose.yml                       # Docker Compose (développement)
├── compose.integ.yml                 # Docker Compose (intégration)
├── compose.prod.yml                  # Docker Compose (production)
│
└── scripts/
    ├── prometheus-entrypoint.sh      # Script d'entrée Prometheus
    └── alertmanager-entrypoint.sh    # Script d'entrée AlertManager
```

---

## 🔐 Variables d'environnement (minimum requis)

### Prometheus - Configuration essentielles

| Variable | Défaut | Utilité |
|----------|--------|---------|
| `PROMETHEUS_ENVIRONMENT` | `development` | Label "environment" sur les métriques |
| `PROMETHEUS_MONITOR_NAME` | `chariot-monitor` | Label "monitor" sur les métriques |
| `PROMETHEUS_SCRAPE_INTERVAL` | `15s` | Fréquence de collecte globale |
| `PROMETHEUS_EVALUATION_INTERVAL` | `15s` | Intervalle d'évaluation des règles |

### Prometheus - Intervalles par job

| Variable | Défaut | Utilité |
|----------|--------|---------|
| `PROMETHEUS_CHARIOT_BACKEND_SCRAPE_INTERVAL` | `10s` | Collecte du backend |
| `PROMETHEUS_CADVISOR_SCRAPE_INTERVAL` | `15s` | Métriques des containers |
| `PROMETHEUS_NODE_EXPORTER_SCRAPE_INTERVAL` | `15s` | Métriques de la machine |
| `PROMETHEUS_MONGODB_SCRAPE_INTERVAL` | `15s` | Métriques MongoDB |

### Prometheus - Cibles (targets)

| Variable | Défaut | Utilité |
|----------|--------|---------|
| `PROMETHEUS_SELF_TARGET` | `localhost:9090` | Auto-monitoring Prometheus |
| `PROMETHEUS_BACKEND_TARGET` | `backend:9000` | Adresse du backend NestJS |
| `PROMETHEUS_BACKEND_METRICS_PATH` | `/metrics` | Endpoint des métriques backend |
| `PROMETHEUS_CADVISOR_TARGET` | `cadvisor:8080` | Adresse cAdvisor |
| `PROMETHEUS_NODE_EXPORTER_TARGET` | `node-exporter:9100` | Adresse Node Exporter |
| `PROMETHEUS_MONGODB_EXPORTER_TARGET` | `mongodb-exporter:9216` | Adresse MongoDB Exporter |
| `PROMETHEUS_ALERTMANAGER_TARGET` | `alertmanager:9093` | Adresse AlertManager |

### AlertManager - SMTP (Secrets ⚠️)

| Variable | Défaut | Utilité |
|----------|--------|---------|
| `ALERTMANAGER_SMTP_FROM` | - | Email expéditeur (requis) |
| `ALERTMANAGER_SMTP_HOST` | - | Serveur SMTP (requis) |
| `ALERTMANAGER_SMTP_PORT` | - | Port SMTP (587 pour TLS) |
| `ALERTMANAGER_SMTP_USER` | - | Login SMTP (requis) |
| `ALERTMANAGER_SMTP_PASSWORD` | - | Mot de passe SMTP (requis) ⚠️ |
| `ALERTMANAGER_SMTP_REQUIRE_TLS` | `true` | TLS obligatoire |
| `ALERTMANAGER_RECEIVER_EMAIL` | - | Email destinataire (requis) |

### AlertManager - Timing et groupement

| Variable | Défaut | Utilité |
|----------|--------|---------|
| `ALERTMANAGER_TIMEOUT` | `10s` | Timeout de connexion à AlertManager |
| `ALERTMANAGER_GROUP_WAIT` | `30s` | Attendre avant de grouper les alertes |
| `ALERTMANAGER_GROUP_INTERVAL` | `5m` | Intervalle de regroupage |
| `ALERTMANAGER_REPEAT_INTERVAL` | `3h` | Répétition des alertes non-résolues |
| `ALERTMANAGER_CRITICAL_GROUP_WAIT` | `10s` | Attente pour alertes critiques |
| `ALERTMANAGER_CRITICAL_REPEAT_INTERVAL` | `30m` | Répétition des alertes critiques |
| `ALERTMANAGER_RESOLVE_TIMEOUT` | `5m` | Timeout de résolution |

**⚠️ ATTENTION** : Ne jamais commiter `.env.prometheus` avec des secrets réels dans Git !

---

## 🚀 Utilisation

### Configuration initiale

```bash
# 1. Créer la configuration locale
cp .env.prometheus.example .env.prometheus

# 2. Éditer avec les credentials SMTP
# (Attention : ne jamais commiter ce fichier!)
nano .env.prometheus

# 3. Vérifier que .env.prometheus est dans .gitignore
grep ".env.prometheus" .gitignore
```

### ⚙️ Configuration multi-OS (Linux vs macOS)

#### 🐧 Configuration pour LINUX (CI/Prod) - Par défaut

Sur Linux, les containers communiquent via le réseau bridge Docker. **Pas de modification nécessaire** - utilisez la configuration par défaut dans `.env.prometheus.example` :

```bash
# ✅ Défaut (Linux) - Utilisez les noms de service
PROMETHEUS_BACKEND_TARGET=backend:9000
PROMETHEUS_CADVISOR_TARGET=cadvisor:8080
PROMETHEUS_NODE_EXPORTER_TARGET=node-exporter:9100
PROMETHEUS_MONGODB_EXPORTER_TARGET=mongodb-exporter:9216
PROMETHEUS_ALERTMANAGER_TARGET=alertmanager:9093
```

#### 🍎 Configuration pour MACOS (Dev) - Override

Sur macOS avec Docker Desktop, les containers ne peuvent pas accéder directement aux services locaux. Utilisez `host.docker.internal` pour accéder au host :

```bash
# 📝 Éditer .env.prometheus et remplacer les cibles par :
PROMETHEUS_BACKEND_TARGET=host.docker.internal:9000
PROMETHEUS_CADVISOR_TARGET=host.docker.internal:8080
PROMETHEUS_NODE_EXPORTER_TARGET=host.docker.internal:9100
PROMETHEUS_MONGODB_EXPORTER_TARGET=host.docker.internal:9216
PROMETHEUS_ALERTMANAGER_TARGET=alertmanager:9093  # AlertManager reste en local
```

**Pourquoi ?**
- Sur macOS, Docker Desktop exécute un VM Linux intermédiaire
- Les noms de service (`backend`, `cadvisor`) ne sont accessibles que dans la VM
- `host.docker.internal` est un alias spécial pour accéder à la machine hôte (macOS)
- Les containers Prometheus/AlertManager restent accessibles via `localhost` dans compose.yml

**Checklist macOS :**
```bash
# Vérifier la configuration
grep "host.docker.internal" .env.prometheus

# Tester la connectivité depuis Prometheus
docker exec prometheus wget -v http://host.docker.internal:9000/metrics
```

### Lancer les services

```bash
# Développement
docker-compose up -d prometheus alertmanager

# Intégration
docker-compose -f compose.integ.yml up -d prometheus alertmanager

# Production
docker-compose -f compose.prod.yml up -d prometheus alertmanager
```

### Vérifier le démarrage

```bash
# Voir les services en cours d'exécution
docker-compose ps prometheus alertmanager

# Vérifier les logs
docker-compose logs prometheus --tail=20
docker-compose logs alertmanager --tail=20

# Tester les endpoints
curl http://localhost:9090/-/healthy
curl http://localhost:9093/-/healthy
```

### Vérifier la substitution des variables

```bash
# Afficher la configuration générée (Prometheus)
docker exec prometheus cat /etc/prometheus/prometheus.yml | head -30

# Afficher la configuration générée (AlertManager)
docker exec alertmanager cat /etc/alertmanager/alertmanager.yml | head -30

# Vérifier qu'une variable spécifique a été remplacée
docker exec prometheus cat /etc/prometheus/prometheus.yml | grep -A2 "external_labels"
docker exec alertmanager cat /etc/alertmanager/alertmanager.yml | grep "smtp_from"
```

---

## 🔧 Entrypoint scripts

### `scripts/prometheus-entrypoint.sh`

**Responsabilités :**
1. Lire les variables d'environnement Prometheus (avec valeurs par défaut)
2. Lire les variables d'environnement AlertManager (timeout, etc.)
3. Substituer les `${VAR}` dans le template via `sed`
4. Changer le répertoire courant vers `/etc/prometheus`
5. Exécuter Prometheus avec les arguments fournis

**Technologie :**
- Utilise `sed` pour la substitution (compatible Alpine)
- Pas de dépendance externe (`envsubst` n'est pas nécessaire)
- Shell standard `/bin/sh` (portabilité)

### `scripts/alertmanager-entrypoint.sh`

**Responsabilités :**
1. Lire les variables d'environnement AlertManager (avec valeurs par défaut)
2. Substituer les `${VAR}` dans le template via `sed`
3. Changer le répertoire courant vers `/etc/alertmanager`
4. Exécuter AlertManager avec les arguments fournis

---

## 🐛 Troubleshooting

### Services redémarrent en boucle

**Symptôme :** Containers affichent `Restarting (1)` dans `docker-compose ps`

**Diagnostic :**
```bash
docker-compose logs prometheus --tail=50
docker-compose logs alertmanager --tail=50
```

**Solutions courantes :**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Error parsing command line arguments` | Syntax du shell incorrect | Vérifier l'entrypoint |
| `parsing YAML: not a valid duration string: "${VAR}"` | Variable non substituée | Vérifier que `env_file: .env.prometheus` est présent |
| `open prometheus.yml: no such file or directory` | Configuration non générée | Vérifier que le script d'entrée a exécuté `sed` |

### Variables d'environnement non chargées

**Diagnostic :**
```bash
docker exec prometheus env | grep PROMETHEUS_
docker exec alertmanager env | grep ALERTMANAGER_
```

**Solution :** Vérifier que `.env.prometheus` existe et contient les variables.

### Configuration incorrecte

**Diagnostic :**
```bash
# Afficher la configuration générée
docker exec prometheus cat /etc/prometheus/prometheus.yml

# Chercher des valeurs non remplacées
docker exec prometheus cat /etc/prometheus/prometheus.yml | grep "\${"
```

**Solution :** Si des `${VAR}` restent, c'est que la variable d'environnement n'était pas définie. Vérifier `.env.prometheus`.

### Recharger la configuration

```bash
# Sans redémarrer les conteneurs (pour Prometheus)
curl -X POST http://localhost:9090/-/reload

# Redémarrer les services
docker-compose restart prometheus alertmanager
```

---

## 🔐 Sécurité

### Protection des secrets

| Élément | Sécurité | Action |
|---------|----------|--------|
| `.env.prometheus` | 🔴 SECRETS | Git-ignoré (ne pas commiter) |
| `.env.prometheus.example` | 🟢 SAFE | Git-tracked (exemple seulement) |
| `prometheus.yml.template` | 🟢 SAFE | Git-tracked (pas de secrets) |
| `alertmanager.yml.template` | 🟢 SAFE | Git-tracked (pas de secrets) |
| Generated config in container | 🟡 MEMORY | Non persisté, chiffré en mémoire |

### Vérifier que .gitignore est correct

```bash
# Vérifier la protection
cat .gitignore | grep "\.env\|prometheus\.yml\|alertmanager\.yml"

# Vérifier qu'aucun secret n'est tracké
git ls-files | grep ".env.prometheus"  # Ne devrait rien retourner
```

### Best practices

1. ✅ **Jamais commiter** `.env.prometheus`
2. ✅ **Utiliser** des variables d'environnement pour les secrets en CI/CD
3. ✅ **Valider** que les credentials SMTP sont corrects
4. ✅ **Restreindre** l'accès aux serveurs ayant les secrets

---

## 📈 Monitoring et métriques

### Targets Prometheus

Prometheus collecte les métriques de :

```yaml
prometheus:9090        # Prometheus lui-même (auto-monitoring)
backend:9000          # Backend NestJS
cadvisor:8080         # Docker containers metrics
node-exporter:9100    # Host machine metrics
mongodb-exporter:9216 # MongoDB metrics
```

### Accès aux interfaces

```
Prometheus Web UI:     http://localhost:9090
AlertManager Web UI:   http://localhost:9093
```

### Requêtes Prometheus utiles

```promql
# État du scrape
up{job="prometheus"}

# Containers en cours d'exécution
container_last_seen{name="prometheus"}

# Espace disque MongoDB
mongodb_disk_storageSize_bytes

# CPU du backend
process_resident_memory_bytes{job="chariot-backend"}
```

---

## ✅ Checklist de déploiement

### Avant le déploiement

- [ ] `.env.prometheus` créé localement (non git-tracked)
- [ ] Variables SMTP valides
- [ ] Endpoints des services accessibles
- [ ] `.gitignore` protège `.env.prometheus`

### Après le déploiement

- [ ] `docker-compose ps` montre services `Up (healthy)`
- [ ] Health checks répondent correctement
- [ ] Configuration correctement générée (vérifier avec `docker exec`)
- [ ] Logs sans erreurs
- [ ] Prometheus collecte des métriques
- [ ] AlertManager reçoit les routes

---

## 📊 Résumé des changements

### Problème initial

Prometheus et AlertManager redémarraient en boucle avec :
```
Error parsing command line arguments: unexpected /bin/sh
```

### Solution appliquée

1. ✅ Scripts d'entrée dédiés (`prometheus-entrypoint.sh`, `alertmanager-entrypoint.sh`)
2. ✅ Substitution via `sed` (sans `envsubst`)
3. ✅ Configuration correcte des `entrypoint` et `command` dans Docker Compose
4. ✅ Gestion des répertoires de travail

### Résultat

```
NAME           IMAGE                  STATUS
prometheus     prom/prometheus:latest Up 1 minute (healthy) ✅
alertmanager   prom/alertmanager      Up 1 minute (healthy) ✅
```

---

## 📞 Support

### Ressources

- Prometheus docs: https://prometheus.io/docs/
- AlertManager docs: https://prometheus.io/docs/alerting/latest/overview/
- Docker Compose docs: https://docs.docker.com/compose/

### Rapporter des problèmes

Si vous rencontrez un problème :

1. Vérifier les logs : `docker-compose logs SERVICE --tail=50`
2. Vérifier l'absence d'erreurs dans la configuration : voir Troubleshooting
3. Consulter la documentation de Prometheus/AlertManager
4. Ouvrir une issue si le problème persiste
