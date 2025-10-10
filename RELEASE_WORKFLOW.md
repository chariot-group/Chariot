# 🚀 Workflow de Mise en Production - Guide Interactif

> **Dernière update :** octobre 2025

---

## 📋 Table des matières

- [Scénario 1 : Développement d'une Feature](#scénario-1--développement-dune-feature)
- [Scénario 2 : Préparation d'une Release](#scénario-2--préparation-dune-release)
- [Scénario 3 : Hotfix en Production](#scénario-3--hotfix-en-production)
- [Annexes](#annexes)

---

## Scénario 1 : Développement d'une Feature

### Étape 1.1 : Démarrage de la feature

**Prérequis** : Un ticket existe dans GitHub Issues avec un numéro (ex: #123)

**Labellisation du ticket** :
- Type : `feature`, `bug`, `enhancement`
- Priority : `high`, `medium`, `low`
- Milestone : `v1.3.0` (si vous savez déjà) ou `Backlog`
- Status : `in-progress`

Développer la feature.

[→ Continuer vers Étape 1.2](#étape-12--finalisation-et-pr)

---

### Étape 1.2 : Finalisation et PR
**Prérequis** La checklist de la PR est complétée et le ticket est à jour de develop

Créer la PR.

[→ Continuer vers Étape 1.3](#étape-13--code-review)

---

### Étape 1.3 : Code Review

Le reviewer lit le ticket et il choisit si la PR est ok ou si des changements sont demandés.

**Choix du reviewer** :

→ [Code OK, approuvé](#étape-14--merge-après-approbation)  

---

### Étape 1.4 : Merge après approbation

✅ **La PR est approuvée**

```bash
# Sur GitHub, cliquer sur "Squash and merge pull request" pour garder un historique propre
```

**Automatique avec CI/CD configuré** :
- Tests automatiques passent ✅

**Mettre à jour le ticket** :
- Status : `done`
- Laisser l'issue ouverte jusqu'à la prod (permet d'avoir une liste des tickets ok develop mais pas encore dans main)

[→ Retour au développement ou → Préparer une release](#scénario-2--préparation-dune-release)

---

## Scénario 2 : Préparation d'une Release

### Étape 2.1 : Décision de release

**Déclencheur** : Ensemble cohérent de features prêtes.

**Questions à se poser** :
- ✅ Avons-nous des features complètes dans `develop` ?
- ✅ Rien d'instable ?

**Déterminer le numéro de version** :

Regardez les changements depuis la dernière version :

- **MAJOR** (v2.0.0) : Breaking changes, refonte majeure
- **MINOR** (v1.3.0) : Nouvelles fonctionnalités (backward compatible)
- **PATCH** (v1.2.1) : Corrections de bugs uniquement

**Création du ticket de release** :
- - Créer un ticket sur GitHub avec le numéro de version déterminé
- Titre : "Release vX.Y.Z" (ex: "Release v1.3.0")
- Description : 
  - Liste des features principales à inclure
  - Checklist des étapes du processus de release
  - Lien vers ce guide de workflow
  - Type de version (MAJOR/MINOR/PATCH) avec justification
- Labels : `release`
- Milestone : Créer un milestone correspondant si nécessaire (ex: `v1.3.0`)
- Assignees : Release Manager + second développeur

[→ Continuer vers Étape 2.2](#étape-22--création-de-la-branche-de-release)

---

### Étape 2.2 : Création de la branche de release

**⚠️ IMPORTANT** : Une seule personne crée la branche (il est le "Release Manager" de cette itération)

**Vérification préalable** :

```bash
# Tous les développeurs vérifient :
git checkout develop
git status  # Doit être propre
git pull origin develop  # Doit être à jour
```

**Création de la branche** (Release Manager uniquement) :

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.3.0
git push -u origin release/v1.3.0

# Créer une Pull Request sur GitHub
# Titre : "chore: prepare release v1.3.0"
# Description : Liste des features incluses dans la release
# Labels : release
# Reviewers : Ajouter l'autre développeur
```

[→ Continuer vers Étape 2.3](#étape-23--mise-à-jour-du-changelog-et-version)

---

### Étape 2.3 : Mise à jour du changelog et version

**Éditer le CHANGELOG.md** :

```markdown
# Changelog

## [1.3.0] - 2024-11-15

### Added
- Nouvelle fonctionnalité de profil utilisateur (#123)
- Support des notifications push (#145)
- Export des données en CSV (#156)

### Changed
- Amélioration des performances de la page d'accueil (#134)
- Refonte de l'interface de paramètres (#142)

### Fixed
- Correction du bug d'affichage sur mobile (#151)
- Fix de la fuite mémoire dans le dashboard (#148)

## [1.2.0] - 2024-10-28
...
```

**Mettre à jour la version dans le code** :

```json
// package.json
Changer "version": "1.2.0" → "version": "1.3.0"
```

[→ Continuer vers Étape 2.4](#étape-24--déploiement-sur-integ)

---

### Étape 2.4 : Déploiement sur integ

**Créer une PR pour integ** :

```bash
# S'assurer que develop est à jour
git checkout develop
git pull origin develop
```

- Créer une Pull Request sur GitHub
  - Source : `develop`
  - Target : `integ`
  - Titre : "chore: deploy features for release v1.3.0 to staging"
  - Description : 
    - Liste des changements majeurs
    - Lien vers le ticket de release
    - Checklist des tests à effectuer
  - Labels : `deploy-staging`
  - Reviewers : L'autre développeur

- Une fois la PR approuvée, merger dans integ

**Déploiement automatique** :
- Le CI/CD détecte le push sur `integ`
- Build + tests automatiques
- Déploiement sur le serveur d'intégration
- Health check automatique

**Vérification manuelle** :
- [ ] L'application démarre correctement
- [ ] Health check endpoint répond (ex: `/api/health`)
- [ ] Logs ne montrent pas d'erreurs critiques

[→ Continuer vers Étape 2.5](#étape-25--tests-sur-integ)

---

### Étape 2.5 : Tests sur integ

**Phase de tests** :

**Tests par les développeurs** :

Développeur 1 :
- [ ] Tester ses propres features
- [ ] Smoke test général (parcours utilisateur principal)
- [ ] Test sur navigateurs (Chrome, Firefox, Safari)

Développeur 2 :
- [ ] Tester ses propres features
- [ ] Smoke test général
- [ ] Test sur mobile (responsive)

**Tests de non-régression** :
- [ ] Fonctionnalités existantes toujours opérationnelles
- [ ] Pas de régression visuelle
- [ ] Performances acceptables

**Monitoring** :
- Vérifier logs : pas d'exceptions backend
- Vérifier métriques : temps de réponse OK

**Remontée de bugs** :
- Créer un ticket pour chaque bug trouvé
- Label `bug` + `release-blocker` (si bloquant)
- **Critères objectifs** :
  - Bug bloquant : Fonctionnalité principale cassée, erreur 500, perte de données
  - Bug mineur : Problème cosmétique, edge case rare, faute d'orthographe

**Choix après les tests** :

→ [Tout fonctionne parfaitement ✅](#étape-26a--integ-ok--go-prod)  
→ [Bugs mineurs détectés 🟡](#étape-26b--integ-ko--bugs-mineurs)  
→ [Bugs majeurs ou bloquants 🔴](#étape-26c--integ-ko--bugs-majeurs)

---

### Étape 2.6a : Integ OK : GO Prod

✅ **Aucun bug bloquant, tout fonctionne**

**Création de la PR vers main** :

- Créer une Pull Request sur GitHub
  - Source : `integ`
  - Target : `main`
  - Titre : "chore: release v1.3.0"
  - Description : 
    - Changelog complet de la version
    - Liste des tickets inclus
  - Labels : `release`
  - Reviewers : L'autre développeur

- Une fois la PR approuvée :

```bash
# Le merge se fait via GitHub avec "Squash and merge"
# Ensuite, en local :
git checkout main
git pull origin main
git tag -a v1.3.0 -m "Release v1.3.0

- Nouvelle fonctionnalité de profil utilisateur
- Support des notifications push
- Export des données en CSV
- Corrections de bugs divers
"
git push origin main --tags
```

**Déploiement en production** :
- Le CI/CD détecte le tag v1.3.0 sur `main`
- Build + tests automatiques
- **Approbation manuelle requise** (bouton à cliquer sur GitHub Actions)
- Déploiement sur le serveur de production
- Health check automatique
- Notification Discord : "✅ v1.3.0 déployée en production"

**Synchronisation avec develop** :

```bash
git checkout develop
git pull origin develop
git merge release/v1.3.0 --no-ff
git push origin develop
```

**Nettoyage** :

```bash
# Supprimer la branche de release
git branch -d release/v1.3.0
git push origin --delete release/v1.3.0
```

**Créer une GitHub Release** :
- Aller sur GitHub : Releases → Draft a new release
- Tag : `v1.3.0`
- Title : `Version 1.3.0 - Profils & Notifications`
- Description : Copier le contenu du changelog
- Publier

**Fermer les tickets** :
- Tous les tickets du milestone v1.3.0 → Status `released`
- Fermer les issues

[→ Continuer vers Étape 2.7](#étape-27--monitoring-post-production)

---

### Étape 2.6b : Integ KO : Bugs mineurs

🟡 **Bugs détectés mais non bloquants**

**Exemples de bugs mineurs** :
- Faute d'orthographe
- Alignement CSS légèrement décalé
- Edge case rare
- Problème cosmétique

**Décision** : Fixer rapidement sur la branche de release

```bash
git checkout release/v1.3.0

# Fixer le bug
git add .
git commit -m "fix: correction alignement bouton sur mobile"
git push origin release/v1.3.0

# Re-déployer sur integ
git checkout integ
git merge release/v1.3.0
git push origin integ
```

**Re-test rapide** :
- Vérifier que le fix fonctionne
- Smoke test général

[→ Retour à l'étape 2.5 (nouveaux tests)](#étape-25--tests-sur-integ)

---

### Étape 2.6c : Integ KO : Bugs majeurs

🔴 **Bugs bloquants détectés**

**Exemples de bugs majeurs** :
- Fonctionnalité principale cassée
- Erreurs 500 fréquentes
- Perte de données
- Problème de sécurité
- Performance inacceptable

**Fix complexe ou incertitude** -> Abandon de la release :

```bash
# Rollback d'integ
git checkout integ
git reset --hard HEAD~1  # Annule le dernier merge
git push origin integ --force

# Abandon de la release
git branch -D release/v1.3.0
git push origin --delete release/v1.3.0

# Retour au développement sur develop
# Fixer le bug dans une nouvelle feature branch
# Replanifier la release plus tard
```

[→ Retour au développement](#scénario-1--développement-dune-feature)

---

### Étape 2.7 : Monitoring post-production

**Surveillance intensive (24-48h après déploiement)** :

**Vérifications immédiates (H+1)** :
- [ ] Application accessible
- [ ] Logs backend propres (pas d'exceptions)
- [ ] Métriques normales (CPU, RAM, requêtes/s)

**Vérifications J+1** :
- [ ] Volume de requêtes normal
- [ ] Taux d'erreur < 1%
- [ ] Temps de réponse acceptable
- [ ] Pas de plainte utilisateur

**Outils à surveiller** :
- **Sentry** : Erreurs frontend/backend
- **Logs** : Exceptions, warnings
- **Uptime monitor** : Disponibilité
- **Grafana** (quand installé) : Métriques système et applicatives

**Astreinte légère** :
- Notifications activées sur Discord
- Un développeur disponible pour réagir rapidement

**Si tout va bien après 48h** : ✅ Release réussie !

**Si problème détecté** : 
→ [Aller au Scénario 3 : Hotfix](#scénario-3--hotfix-en-production)

**En cas de problème critique** :
→ [Procédure de rollback d'urgence](#procédure-de-rollback-durgence)

---

## Scénario 3 : Hotfix en Production

### Étape 3.1 : Détection du problème

**Sources de détection** :
- 🔔 Alerte Sentry : Pic d'erreurs
- 🔔 Alerte monitoring : App down ou dégradée
- 📧 Email/message utilisateur signalant un bug
- 👁️ Observation directe

**Triage immédiat** :

**Criticité du bug** :

🔴 **Critique** (hotfix immédiat dans les 24h) :
- Application down ou partiellement down
- Perte de données utilisateur
- Faille de sécurité
- Fonctionnalité principale cassée pour tous

→ [Action immédiate](#étape-32--hotfix-critique)

🟠 **Important** (fix dans v1.3.1 sous 1 semaine) :
- Bug gênant mais contournable
- Feature secondaire cassée
- Performance dégradée
- Impact limité à certains users

→ [Planifier un fix](#étape-33--fix-planifié)

🟡 **Mineur** (backlog) :
- Bug cosmétique
- Edge case très rare
- Amélioration UX

→ [Ticket dans le backlog](#retour-au-développement-normal)

---

### Étape 3.2 : Hotfix critique

🚨 **Bug critique détecté en production**

**Investigation rapide** (30 min max) :
- Reproduire le bug
- Identifier la cause (logs, Sentry, code)
- Évaluer l'ampleur (combien d'users impactés ?)

**Décision** :

**Option A : Fix rapide possible** → [Créer le hotfix](#création-du-hotfix)

**Option B : Fix complexe ou incertain** → [🚨 Procédure de Rollback d'Urgence](#🚨-procédure-de-rollback-durgence)

---

#### Création du hotfix

```bash
# Partir de main (la production actuelle)
git checkout main
git pull origin main

# Créer la branche de hotfix
git checkout -b hotfix/v1.3.x-numéro-ticket
```

**Fixer le bug** :

```bash
# Faire le fix (le plus minimal possible)
git add .
git commit -m "fix(critical): correction bug perte de données sur /api/save"

git push -u origin hotfix/v1.3.x-numéro-ticket
```

**Tester localement** :
- [ ] Bug reproduit et corrigé
- [ ] Pas de régression introduite
- [ ] Tests automatiques passent

**Déployer sur integ pour test rapide** :

```bash
git checkout integ
git merge hotfix/v1.3.1
git push origin integ
```

**Test rapide sur integ (15-30 min)** :
- [ ] Fix vérifié
- [ ] Smoke test général
- [ ] Pas de nouvelle erreur

**Choix** :

→ [Fix OK, déployer en prod](#déploiement-hotfix-en-prod)  
→ [Fix KO, continuer les corrections](#étape-32--hotfix-critique)

---

#### Déploiement hotfix en prod
**Mise à jour du changelog** :

```markdown
## [1.3.1] - 2024-11-16

### Fixed
- **CRITIQUE** : Correction du bug de perte de données sur /api/save (#178)
```

```bash
# Merge dans main
git checkout main
git merge hotfix/v1.3.1 --no-ff -m "chore: hotfix v1.3.1"

# Tag de la version
git tag -a v1.3.1 -m "Hotfix v1.3.1

- Correction critique: bug perte de données sur /api/save
"

git push origin main --tags
```

**Déploiement (peut nécessiter approbation manuelle)** :
- CI/CD détecte le nouveau tag
- Build + tests
- Approbation si configurée
- Déploiement production
- Notification : "🚑 Hotfix v1.3.1 déployé"

**Synchronisation avec develop** (IMPORTANT) :

```bash
git checkout develop
git pull origin develop
git merge hotfix/v1.3.1
git push origin develop
```

**Nettoyage** :

```bash
git branch -d hotfix/v1.3.1
git push origin --delete hotfix/v1.3.1
```

**Post-mortem (async)** :
- Documenter l'incident dans Notion/doc
- Cause racine
- Comment éviter à l'avenir
- Actions correctives

[→ Monitoring renforcé pendant 24h](#étape-27--monitoring-post-production)

---

## 🚨 Procédure de Rollback d'Urgence

### Quand utiliser le rollback d'urgence

**Critères de déclenchement automatique** :
- Taux d'erreur > 5% pendant plus de 5 minutes
- Temps de réponse moyen > 2 secondes
- Application inaccessible (HTTP 500/503)
- Perte de données détectée

**Critères de déclenchement manuel** :
- Bug critique impactant tous les utilisateurs
- Faille de sécurité découverte
- Performance dégradée de façon inacceptable

### Rollback manuel d'urgence

```bash
#!/bin/bash
# scripts/emergency-rollback.sh

echo "🚨 ROLLBACK D'URGENCE INITIÉ"
echo "Timestamp: $(date)"

# 1. Notification immédiate
curl -X POST $DISCORD_WEBHOOK \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"🚨 ROLLBACK D'URGENCE EN COURS - $(date)\"}"

# 2. Identifier les versions
CURRENT_VERSION=$(git describe --tags --abbrev=0)
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD~1)

echo "Version actuelle: $CURRENT_VERSION"
echo "Rollback vers: $PREVIOUS_VERSION"

# 3. Confirmation (skip en mode automatique)
  read -p "Confirmer le rollback $CURRENT_VERSION → $PREVIOUS_VERSION ? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback annulé"
    exit 1
  fi

# 4. Backup de sécurité
echo "📦 Création backup base de données..."
pg_dump $DATABASE_URL > "backup_rollback_$(date +%s).sql"

# 5. Rollback du code
echo "🔄 Rollback du code en cours..."

git checkout $PREVIOUS_VERSION
git tag -f emergency-rollback-$(date +%s)
git push origin emergency-rollback-$(date +%s) --force

# 6. Vérification
echo "🔍 Vérification du rollback..."
sleep 30

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://chariot.app/api/health)
if [ $HEALTH_CHECK -eq 200 ]; then
    echo "✅ Rollback réussi - Application accessible"
    STATUS="SUCCESS"
else
    echo "❌ Rollback partiellement échoué - Health check: $HEALTH_CHECK"
    STATUS="PARTIAL_FAILURE"
fi

# 7. Notification finale
curl -X POST $DISCORD_WEBHOOK \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"🚑 ROLLBACK TERMINÉ - Status: $STATUS\\n$CURRENT_VERSION → $PREVIOUS_VERSION\\nHealth check: $HEALTH_CHECK\"}"

# 8. Instructions pour l'équipe
echo ""
echo "📋 ACTIONS IMMÉDIATES REQUISES:"
echo "1. Vérifier l'application manuellement"
echo "2. Informer les utilisateurs si nécessaire"
echo "3. Analyser les logs de l'incident"
echo "4. Planifier le post-mortem"
echo ""
echo "💾 Backup créé: backup_rollback_$(date +%s).sql"
````

### Checklist de rollback

```markdown
## 🚨 Checklist Rollback d'Urgence

### Phase 1 - Évaluation (2 minutes)
- [ ] Problème confirmé par développeur disponible
- [ ] Criticité évaluée (bloquant total vs partiel)
- [ ] Équipe notifiée sur Discord #alerts
- [ ] Version de rollback identifiée

### Phase 2 - Préparation (3 minutes)
- [ ] Backup base de données lancé
- [ ] Communication utilisateurs préparée (si nécessaire)
- [ ] Accès admin confirmé (GitHub, serveurs)

### Phase 3 - Exécution (5 minutes)
- [ ] Script de rollback lancé
- [ ] Code rollback déployé
- [ ] Services redémarrés

### Phase 4 - Validation (5 minutes)
- [ ] Health check OK (HTTP 200)
- [ ] Fonctionnalités principales testées
- [ ] Logs vérifiés (pas d'erreur critique)
- [ ] Métriques revenues à la normale

### Phase 5 - Communication (5 minutes)
- [ ] Équipe notifiée du succès/échec
- [ ] Utilisateurs informés (si impact visible)
- [ ] Incident documenté
- [ ] Post-mortem planifié

### Phase 6 - Suivi (24h)
- [ ] Monitoring renforcé activé
- [ ] Cause racine analysée
- [ ] Plan de correction défini
- [ ] Processus amélioré si nécessaire
```

### Tests de rollback

```bash
#!/bin/bash
# scripts/test-rollback-procedure.sh

echo "🧪 Test de la procédure de rollback"

# Environnement de test uniquement
if [ "$ENVIRONMENT" != "test" ]; then
    echo "❌ Ce script ne peut être exécuté qu'en environnement de test"
    exit 1
fi

# 1. Simuler un déploiement problématique
echo "1. Création d'un faux problème..."
docker-compose exec app sh -c "echo 'exit 1' > /tmp/health-check-fail"

# 2. Tester la détection automatique
echo "2. Test de détection automatique..."
./scripts/auto-rollback.sh

# 3. Vérifier que le rollback fonctionne
echo "3. Vérification du rollback..."
sleep 10
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ $HEALTH -eq 200 ]; then
    echo "✅ Test de rollback réussi"
else
    echo "❌ Test de rollback échoué"
    exit 1
fi

echo "🎉 Procédure de rollback validée"
```

[→ Monitoring renforcé pendant 24h](#étape-27--monitoring-post-production)

---

#### Rollback en urgence

🆘 **Le fix est trop complexe ou le temps presse**

**Option 1 : Rollback complet vers version précédente**

```bash
git checkout main

# Trouver le tag de la version précédente stable
git tag
# Exemple : v1.2.0 était la dernière version stable

# Créer une branche de rollback
git checkout -b rollback/to-v1.2.0 v1.2.0

# Forcer le déploiement de cette version
git push origin rollback/to-v1.2.0 --force
```

**Déploiement manuel** :
- Déclencher le déploiement de la branche `rollback/to-v1.2.0`
- Ou redéployer le tag v1.2.0 directement

**Communication** :
- Notification users : "Maintenance en cours, retour à la version stable"
- Équipe : "Rollback effectué vers v1.2.0, on analyse le problème"

**Option 2 : Revert du commit problématique**

```bash
git checkout main

# Identifier le commit problématique
git log --oneline

# Revert (crée un nouveau commit qui annule les changements)
git revert -m 1 <hash-du-merge-v1.3.0>

git push origin main
```

[→ Une fois stable, reprendre le développement du fix](#étape-32--hotfix-critique)

---

### Étape 3.3 : Fix planifié

🟠 **Bug important mais non critique**

**Planification** :
- Créer un ticket avec label `bug` + `high-priority`
- Assigner au prochain sprint/itération
- Milestone : `v1.3.1` (release patch)

**Process normal** :
- Développer le fix dans une branche `fix/xxx`
- PR → review → merge dans `develop`
- Attendre la prochaine release (ou créer une release patch si plusieurs fixes accumulés)

[→ Retour au développement normal](#scénario-1--développement-dune-feature)

---

## Annexes

### A. Architecture des branches

```
main (production)
  ↑
  ├─ release/vX.Y.Z (préparation)
  ├─ hotfix/vX.Y.Z (corrections urgentes)
  ↑
integ (pré-production)
  ↑
develop (développement)
  ↑
  ├─ feature/XXX (fonctionnalités)
  ├─ fix/XXX (corrections)
```

### B. Semantic Versioning

**Format** : `MAJOR.MINOR.PATCH` (ex: v2.3.1)

- **MAJOR** : Changements incompatibles (breaking changes)
- **MINOR** : Nouvelles fonctionnalités (backward compatible)
- **PATCH** : Corrections de bugs

**Exemples** :
- v1.2.0 → v2.0.0 : Refonte complète de l'API
- v1.2.0 → v1.3.0 : Ajout de nouvelles features
- v1.2.0 → v1.2.1 : Correction de bugs

### C. Conventions de commit

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `chore`: Tâches techniques (deps, config)
- `docs`: Documentation
- `test`: Tests
- `refactor`: Refactoring
- `perf`: Amélioration de performance
- `style`: Formatage (pas de changement de code)

**Exemples** :
```
feat(auth): add OAuth2 login
fix(api): correct data validation on user endpoint
chore: update dependencies to latest versions
```

### D. Protection des branches sur GitHub

**`main`** :
- ✅ Require pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass
- ✅ Include administrators

**`develop`** :
- ✅ Require pull request before merging
- ⚠️ Approvals optionnelles

**`integ`** :
- ❌ Pas de protection (flexibilité pour tests)

### E. Checklist pré-release

- [ ] Tous les tickets du milestone sont terminés ou déplacés
- [ ] Changelog mis à jour
- [ ] Numéro de version mis à jour dans le code
- [ ] Tests automatiques passent en local
- [ ] Tests E2E passent sur la branche de release
- [ ] Pas de code de debug (console.log, debugger, etc.)
- [ ] Variables d'environnement prod vérifiées
- [ ] Backup de la base de données effectué (si applicable)
- [ ] Plan de rollback identifié et testé
- [ ] Scripts de rollback d'urgence accessibles
- [ ] Les deux développeurs sont disponibles pendant le déploiement
- [ ] Monitoring et alertes configurés

### F. Commandes Git de référence rapide

**Branches** :
```bash
git checkout -b <branch>        # Créer et se placer sur une branche
git branch -d <branch>          # Supprimer une branche locale
git push origin --delete <br>   # Supprimer une branche remote
```

**Merge et tags** :
```bash
git merge <branch> --no-ff      # Merge avec commit de merge
git tag -a v1.3.0 -m "msg"      # Créer un tag annoté
git push origin main --tags     # Push avec les tags
```

**Urgences** :
```bash
git reset --hard HEAD~1         # Annuler le dernier commit (local)
git push --force                # Push forcé (DANGER)
```

### G. Contacts et outils

**Outils de monitoring** :
- Sentry : https://sentry.io
- Uptime Robot : https://uptimerobot.com
- Grafana : (à configurer)

**Communication** :
- Discord channel : `#releases`
- Discord channel : `#alerts`

**Documentation** :
- Process détaillé : Ce document
- Doc technique : `/docs` dans le repo
- Post-mortems : Notion ou `/docs/incidents`

---

## 📞 En cas de doute

**Règles d'or** :
1. En cas de doute sur une release → **NE PAS DÉPLOYER**
2. En cas de bug critique en prod → **COMMUNIQUER D'ABORD**
3. En cas d'urgence → **ROLLBACK puis fix tranquillement**

**Communication** :
- Toujours prévenir avant un déploiement prod
- Toujours confirmer après un déploiement
- Toujours documenter les incidents

---

**Version du document** : 2.0.0  
**Dernière mise à jour** : 3 octobre 2025  
**Changements majeurs v2.0** :
- Ajout de procédures de rollback automatique et manuel
- Amélioration des critères objectifs de bugs
- Clarification du workflow develop → integ → main
- Checklist pré-release enrichie
- Référence au document FUTURE_IMPROVEMENTS.md pour les évolutions