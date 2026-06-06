# Makefile principal pour gérer tous les microservices
.PHONY: help up down restart logs ps clean build test test-watch test-cov test-e2e deploy pull deploy-prod deploy-integ stripe-login stripe-listen stripe-trigger-checkout lint lint-status lint-adventure lint-gateway lint-session lint-payment lint-web lint-admin lint-fix lint-fix-adventure lint-fix-gateway lint-fix-session lint-fix-payment lint-fix-web lint-fix-admin

# Configuration
SERVICES_DIR := services
NETWORK_NAME := traefik-public
ENV ?= dev

# Couleurs
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# Liste des services disponibles
SERVICES := $(notdir $(wildcard $(SERVICES_DIR)/*))

help: ## Affiche cette aide
	@echo "$(BLUE)Commandes disponibles:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BLUE)Variables:$(NC)"
	@echo "  $(GREEN)ENV$(NC)              Environnement (dev|integ|prod) [défaut: dev]"
	@echo "  $(GREEN)SERVICE$(NC)          Service spécifique à cibler (adventure|gateway|sso|web)"
	@echo ""
	@echo "$(BLUE)Exemples:$(NC)"
	@echo "  make up ENV=dev"
	@echo "  make down ENV=prod"
	@echo "  make pull ENV=integ"
	@echo "  make deploy ENV=prod"
	@echo "  make logs SERVICE=adventure"
	@echo "  make logs SERVICE=gateway"
	@echo "  make restart SERVICE=web ENV=integ"
	@echo "  make test SERVICE=adventure"
	@echo "  make test-cov SERVICE=gateway"
	@echo "  make lint"
	@echo "  make lint SERVICE=web"
	@echo "  make lint-status"
	@echo "  make lint-fix SERVICE=gateway"

network: ## Crée le réseau Docker si nécessaire
	@docker network inspect $(NETWORK_NAME) >/dev/null 2>&1 || \
		(echo "$(YELLOW)Création du réseau $(NETWORK_NAME)...$(NC)" && \
		docker network create $(NETWORK_NAME) && \
		echo "$(GREEN)✓ Réseau créé$(NC)")

up: network ## Lance tous les services (ENV=dev par défaut)
ifdef SERVICE
	@echo "$(YELLOW)Démarrage du service $(SERVICE) ($(ENV))...$(NC)"
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml up -d
	@echo "$(GREEN)✓ Service $(SERVICE) démarré$(NC)"
else
	@echo "$(YELLOW)Démarrage de tous les services ($(ENV))...$(NC)"
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$(SERVICES_DIR)/$$service/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(BLUE)→ Démarrage de $$service...$(NC)"; \
			cd $(SERVICES_DIR)/$$service && docker compose -f compose.$(ENV).yml up -d; cd ../..; \
		else \
			echo "$(RED)✗ Fichier $$compose_file introuvable$(NC)"; \
		fi; \
	done
	@echo "$(GREEN)✓ Tous les services sont démarrés$(NC)"
endif

down: ## Arrête tous les services
ifdef SERVICE
	@echo "$(YELLOW)Arrêt du service $(SERVICE) ($(ENV))...$(NC)"
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml down
	@echo "$(GREEN)✓ Service $(SERVICE) arrêté$(NC)"
else
	@echo "$(YELLOW)Arrêt de tous les services ($(ENV))...$(NC)"
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$(SERVICES_DIR)/$$service/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(BLUE)→ Arrêt de $$service...$(NC)"; \
			cd $(SERVICES_DIR)/$$service && docker compose -f compose.$(ENV).yml down; cd ../..; \
		fi; \
	done
	@echo "$(GREEN)✓ Tous les services sont arrêtés$(NC)"
endif

down-volumes: ## Arrête tous les services et supprime les volumes
ifdef SERVICE
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml down -v
else
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$(SERVICES_DIR)/$$service/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			cd $(SERVICES_DIR)/$$service && docker compose -f compose.$(ENV).yml down -v; cd ../..; \
		fi; \
	done
endif
	@echo "$(GREEN)✓ Services arrêtés et volumes supprimés$(NC)"

restart: down up ## Redémarre les services

rebuild: ## Rebuild et lance les services (avec reconstruction des images)
ifdef SERVICE
	@echo "$(YELLOW)Rebuild et démarrage du service $(SERVICE) ($(ENV))...$(NC)"
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml up --build -d
	@echo "$(GREEN)✓ Service $(SERVICE) rebuilded et démarré$(NC)"
else
	@echo "$(YELLOW)Rebuild et démarrage de tous les services ($(ENV))...$(NC)"
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$(SERVICES_DIR)/$$service/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(BLUE)→ Rebuild de $$service...$(NC)"; \
			cd $(SERVICES_DIR)/$$service && docker compose -f compose.$(ENV).yml up --build -d; cd ../..; \
		fi; \
	done
	@echo "$(GREEN)✓ Tous les services sont rebuilded et démarrés$(NC)"
endif

pull: ## Pull les images depuis le registry (pour prod/integ)
ifdef SERVICE
	@echo "$(YELLOW)Pull des images pour $(SERVICE) ($(ENV))...$(NC)"
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml pull
	@echo "$(GREEN)✓ Images pullées$(NC)"
else
	@echo "$(YELLOW)Pull des images pour tous les services ($(ENV))...$(NC)"
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$(SERVICES_DIR)/$$service/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(BLUE)→ Pull de $$service...$(NC)"; \
			cd $(SERVICES_DIR)/$$service && docker compose -f compose.$(ENV).yml pull; cd ../..; \
		fi; \
	done
	@echo "$(GREEN)✓ Toutes les images sont pullées$(NC)"
endif

deploy: network down pull up ## Déploiement complet (down + pull + up)
	@echo "$(GREEN)✓✓✓ Déploiement terminé avec succès! ✓✓✓$(NC)"

logs: ## Affiche les logs (SERVICE requis ou ALL pour tous)
ifdef SERVICE
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml logs -f
else
	@echo "$(RED)Veuillez spécifier un SERVICE ou utilisez 'make logs-all'$(NC)"
endif

logs-all: ## Affiche les logs de tous les services
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$(SERVICES_DIR)/$$service/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			cd $(SERVICES_DIR)/$$service && docker compose -f compose.$(ENV).yml logs --tail=50; cd ../..; \
		fi; \
	done

ps: ## Liste tous les conteneurs en cours d'exécution
	@echo "$(BLUE)État des services:$(NC)"
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$(SERVICES_DIR)/$$service/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(YELLOW)→ $$service:$(NC)"; \
			cd $(SERVICES_DIR)/$$service && docker compose -f compose.$(ENV).yml ps; cd ../..; \
		fi; \
	done

build: ## Rebuild tous les services sans les démarrer
ifdef SERVICE
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml build
else
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$(SERVICES_DIR)/$$service/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(BLUE)→ Build de $$service...$(NC)"; \
			cd $(SERVICES_DIR)/$$service && docker compose -f compose.$(ENV).yml build; cd ../..; \
		fi; \
	done
	@echo "$(GREEN)✓ Build terminé$(NC)"
endif

# Lint
lint: ## Lance le lint d'un service (SERVICE=adventure|gateway|web) ou de tous les services applicatifs
ifdef SERVICE
	@if [ "$(SERVICE)" = "adventure" ]; then \
		$(MAKE) --no-print-directory lint-adventure; \
	elif [ "$(SERVICE)" = "gateway" ]; then \
		$(MAKE) --no-print-directory lint-gateway; \
	elif [ "$(SERVICE)" = "session" ]; then \
		$(MAKE) --no-print-directory lint-session; \
	elif [ "$(SERVICE)" = "payment" ]; then \
		$(MAKE) --no-print-directory lint-payment; \
	elif [ "$(SERVICE)" = "web" ]; then \
		$(MAKE) --no-print-directory lint-web; \
	elif [ "$(SERVICE)" = "admin" ]; then \
		$(MAKE) --no-print-directory lint-admin; \
	else \
		echo "$(RED)SERVICE invalide: $(SERVICE). Utilisez adventure|gateway|session|payment|web|admin$(NC)"; \
		exit 1; \
	fi
else
	@$(MAKE) --no-print-directory lint-status
endif

lint-status: ## Affiche l'état du lint de chaque service (adventure, gateway, session, payment, web)
	@status=0; \
	echo "$(BLUE)=== Lint status: adventure ===$(NC)"; \
	$(MAKE) --no-print-directory lint-adventure || status=1; \
	echo ""; \
	echo "$(BLUE)=== Lint status: gateway ===$(NC)"; \
	$(MAKE) --no-print-directory lint-gateway || status=1; \
	echo ""; \
	echo "$(BLUE)=== Lint status: session ===$(NC)"; \
	$(MAKE) --no-print-directory lint-session || status=1; \
	echo ""; \
	echo "$(BLUE)=== Lint status: payment ===$(NC)"; \
	$(MAKE) --no-print-directory lint-payment || status=1; \
	echo ""; \
	echo "$(BLUE)=== Lint status: web ===$(NC)"; \
	$(MAKE) --no-print-directory lint-web || status=1; \
	echo ""; \
	echo "$(BLUE)=== Lint status: admin ===$(NC)"; \
	$(MAKE) --no-print-directory lint-admin || status=1; \
	echo ""; \
	if [ $$status -ne 0 ]; then \
		echo "$(RED)✗ Au moins un service a des erreurs lint$(NC)"; \
		exit 1; \
	fi; \
	echo "$(GREEN)✓ Tous les services sont lint-clean$(NC)"

lint-adventure: ## Lance le lint du service adventure
	@echo "$(YELLOW)Lint adventure/api...$(NC)"
	@cd $(SERVICES_DIR)/adventure/api && npm run lint

lint-gateway: ## Lance le lint du service gateway
	@echo "$(YELLOW)Lint gateway/api...$(NC)"
	@cd $(SERVICES_DIR)/gateway/api && npm run lint

lint-session: ## Lance le lint du service session
	@echo "$(YELLOW)Lint session/api...$(NC)"
	@cd $(SERVICES_DIR)/session/api && npm run lint

lint-payment: ## Lance le lint du service payment
	@echo "$(YELLOW)Lint payment/api...$(NC)"
	@cd $(SERVICES_DIR)/payment/api && npm run lint

lint-web: ## Lance le lint du service web
	@echo "$(YELLOW)Lint web/client...$(NC)"
	@cd $(SERVICES_DIR)/web/client && npm run lint

lint-admin: ## Lance le lint du service admin
	@echo "$(YELLOW)Lint admin/client...$(NC)"
	@cd $(SERVICES_DIR)/admin/client && npm run lint

lint-fix: ## Lance l'auto-fix lint (SERVICE requis: adventure|gateway|web)
ifndef SERVICE
	@echo "$(RED)Veuillez spécifier un SERVICE: make lint-fix SERVICE=web$(NC)"
	@exit 1
else
	@if [ "$(SERVICE)" = "adventure" ]; then \
		$(MAKE) --no-print-directory lint-fix-adventure; \
	elif [ "$(SERVICE)" = "gateway" ]; then \
		$(MAKE) --no-print-directory lint-fix-gateway; \
	elif [ "$(SERVICE)" = "session" ]; then \
		$(MAKE) --no-print-directory lint-fix-session; \
	elif [ "$(SERVICE)" = "payment" ]; then \
		$(MAKE) --no-print-directory lint-fix-payment; \
	elif [ "$(SERVICE)" = "web" ]; then \
		$(MAKE) --no-print-directory lint-fix-web; \
	elif [ "$(SERVICE)" = "admin" ]; then \
		$(MAKE) --no-print-directory lint-fix-admin; \
	else \
		echo "$(RED)SERVICE invalide: $(SERVICE). Utilisez adventure|gateway|session|payment|web|admin$(NC)"; \
		exit 1; \
	fi
endif

lint-fix-adventure: ## Lance le lint --fix du service adventure
	@echo "$(YELLOW)Lint fix adventure/api...$(NC)"
	@cd $(SERVICES_DIR)/adventure/api && npm run lint:fix

lint-fix-gateway: ## Lance le lint --fix du service gateway
	@echo "$(YELLOW)Lint fix gateway/api...$(NC)"
	@cd $(SERVICES_DIR)/gateway/api && npm run lint:fix

lint-fix-session: ## Lance le lint --fix du service session
	@echo "$(YELLOW)Lint fix session/api...$(NC)"
	@cd $(SERVICES_DIR)/session/api && npm run lint:fix

lint-fix-payment: ## Lance le lint --fix du service payment
	@echo "$(YELLOW)Lint fix payment/api...$(NC)"
	@cd $(SERVICES_DIR)/payment/api && npm run lint:fix

lint-fix-web: ## Lance le lint --fix du service web
	@echo "$(YELLOW)Lint fix web/client...$(NC)"
	@cd $(SERVICES_DIR)/web/client && npm run lint:fix

lint-fix-admin: ## Lance le lint --fix du service admin
	@echo "$(YELLOW)Lint fix admin/client...$(NC)"
	@cd $(SERVICES_DIR)/admin/client && npm run lint:fix

clean: down-volumes ## Nettoie tout (conteneurs, volumes, images)
	@echo "$(YELLOW)Nettoyage des images non utilisées...$(NC)"
	@docker image prune -f
	@echo "$(GREEN)✓ Nettoyage terminé$(NC)"

list: ## Liste tous les services disponibles
	@echo "$(BLUE)Services disponibles:$(NC)"
	@for service in $(SERVICES); do \
		echo "  $(GREEN)→ $$service$(NC)"; \
	done

swagger-generate: ## Regénère le fichier swagger.json pour le service adventure
	@echo "$(YELLOW)Génération de swagger.json pour adventure...$(NC)"
	@cd $(SERVICES_DIR)/adventure && docker compose -f compose.$(ENV).yml exec chariot-adventure npm run swagger:generate
	@echo "$(GREEN)✓ swagger.json généré$(NC)"

# Alias pratiques
dev-up: ## Lance tous les services en dev
	@$(MAKE) up ENV=dev

prod-up: ## Lance tous les services en prod
	@$(MAKE) up ENV=prod

integ-up: ## Lance tous les services en integ
	@$(MAKE) up ENV=integ

deploy-prod: ## Déploiement complet en production
	@$(MAKE) deploy ENV=prod

deploy-integ: ## Déploiement complet en intégration
	@$(MAKE) deploy ENV=integ

# Tests
test: ## Lance les tests d'un service (SERVICE requis)
ifndef SERVICE
	@echo "$(RED)Veuillez spécifier un SERVICE: make test SERVICE=adventure$(NC)"
	@exit 1
else
	@echo "$(YELLOW)Exécution des tests pour $(SERVICE)...$(NC)"
	@if [ -f "$(SERVICES_DIR)/$(SERVICE)/api/package.json" ]; then \
		cd $(SERVICES_DIR)/$(SERVICE)/api && npm test; \
	elif [ -f "$(SERVICES_DIR)/$(SERVICE)/client/package.json" ]; then \
		cd $(SERVICES_DIR)/$(SERVICE)/client && npm test; \
	else \
		echo "$(RED)✗ Service $(SERVICE) introuvable ou pas de package.json$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Tests terminés$(NC)"
endif

test-watch: ## Lance les tests en mode watch (SERVICE requis)
ifndef SERVICE
	@echo "$(RED)Veuillez spécifier un SERVICE: make test-watch SERVICE=adventure$(NC)"
	@exit 1
else
	@if [ -f "$(SERVICES_DIR)/$(SERVICE)/api/package.json" ]; then \
		cd $(SERVICES_DIR)/$(SERVICE)/api && npm run test:watch; \
	elif [ -f "$(SERVICES_DIR)/$(SERVICE)/client/package.json" ]; then \
		cd $(SERVICES_DIR)/$(SERVICE)/client && npm run test:watch; \
	fi
endif

test-cov: ## Lance les tests avec couverture (SERVICE requis)
ifndef SERVICE
	@echo "$(RED)Veuillez spécifier un SERVICE: make test-cov SERVICE=adventure$(NC)"
	@exit 1
else
	@echo "$(YELLOW)Exécution des tests avec couverture pour $(SERVICE)...$(NC)"
	@if [ -f "$(SERVICES_DIR)/$(SERVICE)/api/package.json" ]; then \
		cd $(SERVICES_DIR)/$(SERVICE)/api && npm run test:cov; \
	elif [ -f "$(SERVICES_DIR)/$(SERVICE)/client/package.json" ]; then \
		cd $(SERVICES_DIR)/$(SERVICE)/client && npm run test:cov; \
	fi
	@echo "$(GREEN)✓ Tests avec couverture terminés$(NC)"
endif

test-e2e: ## Lance les tests e2e (SERVICE requis)
ifndef SERVICE
	@echo "$(RED)Veuillez spécifier un SERVICE: make test-e2e SERVICE=adventure$(NC)"
	@exit 1
else
	@echo "$(YELLOW)Exécution des tests e2e pour $(SERVICE)...$(NC)"
	@if [ -f "$(SERVICES_DIR)/$(SERVICE)/api/package.json" ]; then \
		cd $(SERVICES_DIR)/$(SERVICE)/api && npm run test:e2e; \
	fi
	@echo "$(GREEN)✓ Tests e2e terminés$(NC)"
endif

stripe-login: ## Authentifie Stripe CLI (navigateur) pour les tests webhooks locaux
	@echo "$(YELLOW)Authentification Stripe CLI...$(NC)"
	@env -u STRIPE_API_KEY stripe login

stripe-listen: ## Démarre Stripe CLI et forward les webhooks vers le gateway local
	@echo "$(YELLOW)Démarrage de Stripe CLI listener...$(NC)"
	@if [ -n "$(STRIPE_CLI_API_KEY)" ]; then \
		STRIPE_API_KEY=$(STRIPE_CLI_API_KEY) stripe listen --forward-to $${WEBHOOK_FORWARD_URL:-http://localhost:8082/payment/stripe/webhook}; \
	else \
		env -u STRIPE_API_KEY stripe listen --forward-to $${WEBHOOK_FORWARD_URL:-http://localhost:8082/payment/stripe/webhook}; \
	fi

stripe-trigger-checkout: ## Déclenche un event Stripe checkout.session.completed en local
	@echo "$(YELLOW)Déclenchement d'un webhook Stripe checkout.session.completed...$(NC)"
	@if [ -n "$(STRIPE_CLI_API_KEY)" ]; then \
		STRIPE_API_KEY=$(STRIPE_CLI_API_KEY) stripe trigger checkout.session.completed; \
	else \
		env -u STRIPE_API_KEY stripe trigger checkout.session.completed; \
	fi
	@echo "$(GREEN)✓ Event Stripe déclenché$(NC)"

seed: ## Lance le seeder pour adventure
	@echo "$(YELLOW)Exécution du seeder pour adventure...$(NC)"
	@cd $(SERVICES_DIR)/adventure && docker compose -f compose.$(ENV).yml exec chariot-adventure npm run seed
	@echo "$(GREEN)✓ Seeder exécuté$(NC)"

seed-clean: ## Lance le seeder avec nettoyage pour adventure
	@echo "$(YELLOW)Nettoyage et exécution du seeder pour adventure...$(NC)"
	@cd $(SERVICES_DIR)/adventure && docker compose -f compose.$(ENV).yml exec chariot-adventure npm run seed:clean
	@echo "$(GREEN)✓ Base de données nettoyée et seeder exécuté$(NC)"