# 📅 Processus de Travail Quotidien


## 📋 Table des matières

1. [Philosophie de travail](#🎯-philosophie-de-travail)
2. [Cycle de développement](#🔄-cycle-de-développement)
3. [Gestion des tickets](#🎫-gestion-des-tickets)
4. [Travail quotidien](#💼-travail-quotidien)


## 🎯 Philosophie de travail

### Principes fondamentaux

- Mieux vaut livrer moins mais stable
- Chaque feature doit être complète avant d'être mergée
- Les tests et la review ne sont pas optionnels

## 🔄 Cycle de développement

### Flexibilité du cycle

**Ce cycle n'est PAS rigide** :
- Si rien n'est prêt → on saute une release
- Si une feature urgente arrive → on s'adapte
- Si un bug critique survient → hotfix immédiat

### Phases du cycle

#### Phase 1 : Planification (1-2h en début de cycle)

**Ordre du jour** :
1. **Rétrospective du cycle précédent** (15 min)
   - Qu'est-ce qui a bien marché ?
   - Qu'est-ce qui a posé problème ?
   - Quels ajustements faire ?

2. **Objectifs du cycle** (30 min)
   - Quelle est la prochaine version : v1.X.0 ou v1.2.X ?
   - Quelles sont les priorités business/produit ?
   - Combien de temps avons-nous réellement disponible ?

3. **Sélection des tickets** (30 min)
   - Créer le milestone `v1.3.0`
   - Identifier les dépendances entre tickets
   - Sélectionner des tickets réalisables
   - Assigner les tickets (qui fait quoi)

4. **Questions et clarifications** (15 min)
   - Tous les tickets sont clairs ?
   - Besoin de specs complémentaires ?
   - Risques identifiés ?

**Livrable** :
- Milestone `v1.3.0` créé avec les tickets
- Date de feature freeze indicative (ex: 10 novembre)

#### Phase 2 : Développement (environ 2 semaines)

**C'est le cœur du cycle**, voir section [Travail quotidien](#travail-quotidien) pour les détails.

#### Phase 3 : Feature freeze le temps de la realease

**Déclencheur** : Date planifiée atteinte OU toutes les features prêtes

**Annonce** :
```
🔒 Feature freeze pour v1.3.0
À partir de maintenant :
- Plus de nouvelles features
- Uniquement des fixes de bugs
- Préparation de la release
```

## 🎫 Gestion des tickets

### Structure d'un ticket

**Template GitHub Issue** :

```markdown
## Description
[Description claire du besoin ou du bug]

## Contexte
[Pourquoi cette feature/ce fix est important]

## Critères d'acceptation
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3

## Spécifications techniques (optionnel)
[Détails techniques, API endpoints, etc.]

## Maquettes/Screenshots (si applicable)
[Images ou liens Figma]

## Notes
[Informations complémentaires]
```

**Exemple concret** :

```markdown
## Description
Permettre aux utilisateurs d'exporter leur historique en CSV

## Contexte
Demande récurrente de 5+ utilisateurs dans le support
Facilite l'analyse des données personnelles

## Critères d'acceptation
- [ ] Bouton "Exporter en CSV" dans la page profil
- [ ] Export contient : date, action, détails
- [ ] Format CSV valide (compatible Excel)
- [ ] Fichier téléchargé avec nom : historique_YYYY-MM-DD.csv
- [ ] Loader affiché pendant la génération

## Spécifications techniques
- Endpoint : GET /api/users/me/export
- Lib recommandée : papaparse ou csv-writer
- Limite : 10 000 lignes maximum

## Notes
Pas besoin de format Excel (XLSX) pour l'instant
```

### Labels et organisation

**Labels par type** :
- `feature` : Nouvelle fonctionnalité
- `bug` : Correction de bug
- `enhancement` : Amélioration d'une feature existante
- `docs` : Documentation
- `chore` : Tâches techniques (deps, config, refactoring)

**Labels techniques** :
- `Backend` : Concerne le backend
- `UX` : Logique frontend
- `UI` : Affichage
- `CI/CD` : Concerne le déploiement


**Labels par statut** :

_Vue maccro_
- `ideas` : Idées pour la suite (pas encore formatté)
- `backlog` : À faire (formatté pour le dev)
- `released-main` : Terminé et mergé dans main


_Vue sprint_
- `backlog` : À faire (formatté pour le dev)
- `in-progress` : En cours de dev
- `freeze` : Bloqué (obligation de spécifier ce qui bloque en première ligne)
- `in-review` : En review (PR ouverte)
- `done`: PR mergée dans develop

_Vue déploiement_
- `done`: PR mergée dans develop
- `released-integ`: PR mergée dans integ
- `released-main` : Terminé et mergé dans main


**Labels spéciaux** :
- `release-blocker` : Bloque la release en cours
- `release-integ` : Ticket de mise en intégration
- `release-main` : Ticket de mise en production 

### Workflow d'un ticket

```
1. CRÉATION
   ├─ Créer l'issue avec template (peut être incomplet) status `ideas`
   └─ Ajouter labels (type + priority)
        ↓
2. PLANIFICATION
   └─ Déplacer dans le `backlog` (milestone v1.X.0)
        ↓
3. DÉVELOPPEMENT
   ├─ Assigner à un développeur
   ├─ Status : in-progress
   ├─ Créer branche feature/123-xxx
   └─ Développer en respectant les contraintes techniques et fonctionnelles
        ↓
4. REVIEW
   ├─ Créer PR
   ├─ Checker les checks côté "développeur"
   ├─ Status : in-review
   └─ Attendre approbation
        ↓
5. MERGE
   ├─ Merger dans develop
   ├─ Status : done
   └─ Laisser ouvert jusqu'en prod
        ↓
6. PRODUCTION
   ├─ Ticket inclus dans release vX.Y.Z
   └─ Fermer l'issue
```

### Découpage des tickets

**Règle d'or** : Un ticket égal un processus utilisateur complet

**Si trop gros** : Découper en sous-tickets

**Exemple** :
```
❌ "Refonte du système d'authentification" (40h)

✅ Découper en :
- "Mise en place de la base JWT" (6h)
- "Ajout du refresh token" (4h)
- "Migration des users existants" (8h)
- "Interface de connexion" (6h)
- "Tests E2E authentification" (4h)
```


## 💼 Travail quotidien

### Routine quotidienne recommandée

#### Début de session de travail (5-10 min)

1. **Vérifier les notifications**
   - Messages Discord
   - PRs à reviewer
   - Commentaires sur vos PRs

2. **Consulter ses tickets**
   - Vérifier les tickets "in-progress"
   - Choisir la priorité du jour

#### Pendant le développement

**Cycle de travail** :

1. **Développer par petits incréments**
   - Feature partiellement fonctionnelle
   - Commit toutes les 30-60 min
   - Push régulièrement (backup)

2. **Tester localement**
   - Vérifier que ça fonctionne
   - Pas de log oubliés
   - Tests automatiques passent
   - Ajout de tests si nécessaires

3. **Créer la PR dès que possible**
   - Pas besoin d'attendre que tout soit parfait
   - Permet de montrer l'avancement

4. **Répondre aux reviews**
   - Notification de review
   - Faire les modifications demandées
   - Demander des clarifications si besoin

#### Fin de session (5 min)

1. **Commit et push le travail**
   ```bash
   git add .
   git commit -m "wip: avancement sur export CSV"
   git push origin feature/123-export-csv
   ```

2. **Mettre à jour le ticket**
   - Ajouter un commentaire sur l'avancement
   - Signaler les blocages éventuels

### Gestion des PRs

#### Créer une bonne PR

**Titre** : Convention
```
<type>(<scope>): <description> (#issue)

Exemples :
feat(export): add CSV export functionality (#123)
fix(auth): correct token expiration bug (#145)
chore(deps): update dependencies
```

**Description** :
```markdown
## Changements
- Ajout de l'endpoint /api/users/me/export
- Interface bouton d'export dans ProfilePage
- Tests unitaires et E2E

## Screenshots (si UI)
[Image du nouveau bouton]

## Comment tester
1. Se connecter
2. Aller sur /profile
3. Cliquer sur "Exporter en CSV"
4. Vérifier le fichier téléchargé

## Checklist
- [x] Tests ajoutés
- [x] Tests passent
- [x] Documentation mise à jour
- [x] Pas de console.log

## Issue liée
Closes #123
```

#### Faire une bonne review

**Checklist du reviewer** :

**1. Compréhension**
- [ ] Lire la description de la PR
- [ ] Comprendre l'objectif
- [ ] Vérifier l'issue liée

**2. Lecture du code**
- [ ] Logique métier correcte
- [ ] Pas de bugs évidents
- [ ] Code lisible et maintenable
- [ ] Respect des conventions du projet
- [ ] Pas de code dupliqué
- [ ] Gestion des erreurs présente

**3. Tests**
- [ ] Tests pertinents ajoutés
- [ ] Coverage acceptable
- [ ] Tester localement si possible

**4. Sécurité et performance**
- [ ] Pas de faille évidente
- [ ] Pas de code bloquant