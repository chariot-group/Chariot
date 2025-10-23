# Scripts d'entrée Docker

## prometheus-entrypoint.sh

Script d'initialisation pour Prometheus qui :
1. Charge les variables d'environnement depuis `.env.prometheus`
2. Substitue les placeholders dans `prometheus.yml.template`
3. Génère `prometheus.yml` finalisé
4. Lance Prometheus

**Usage** :
```yaml
# Dans docker-compose.yml
prometheus:
  entrypoint: /prometheus-entrypoint.sh
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
```

## alertmanager-entrypoint.sh

Script d'initialisation pour AlertManager qui :
1. Charge les variables d'environnement depuis `.env.prometheus`
2. Substitue les placeholders dans `alertmanager.yml.template`
3. Génère `alertmanager.yml` finalisé
4. Lance AlertManager

**Usage** :
```yaml
# Dans docker-compose.yml
alertmanager:
  entrypoint: /alertmanager-entrypoint.sh
  command:
    - '--config.file=/etc/alertmanager/alertmanager.yml'
    - '--storage.path=/alertmanager'
```

## Prérequis

- Image Docker contenant `envsubst` (disponible dans `alpine:latest`, `ubuntu:latest`, etc.)
- Les templates doivent être disponibles aux chemins montés
- Les variables d'environnement doivent être définies dans le service Docker

## Dépannage

### Erreur: Command not found: envsubst

Assurez-vous que votre image Docker contient `envsubst` :
```dockerfile
# Ajouter à votre Dockerfile personnalisé
FROM prom/prometheus:latest
RUN apk add --no-cache gettext
```

Ou utilisez directement une image qui le contient :
```yaml
image: alpine:latest  # Pour tester
```

### Erreur: Template not found

```
Error: prometheus.yml.template not found
```

Vérifiez le volume dans docker-compose.yml :
```yaml
volumes:
  - ./prometheus.yml.template:/etc/prometheus/prometheus.yml.template:ro
```

### Les variables ne sont pas substituées

Vérifier :
1. Que les variables sont définies dans `environment:`
2. Que le template utilise la syntaxe `${VAR_NAME}` (pas `$VAR_NAME`)
3. Que `envsubst` est disponible dans l'image

Tester manuellement :
```bash
docker exec prometheus cat /etc/prometheus/prometheus.yml | grep -i environment
```
