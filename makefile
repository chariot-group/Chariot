# Makefile principal pour gérer tous les microservices
.PHONY: help up down restart logs ps clean build

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
	@echo "  $(GREEN)SERVICE$(NC)          Service spécifique à cibler"
	@echo ""
	@echo "$(BLUE)Exemples:$(NC)"
	@echo "  make up ENV=dev"
	@echo "  make down ENV=prod"
	@echo "  make logs SERVICE=app1"
	@echo "  make restart SERVICE=app2 ENV=integ"

network: ## Crée le réseau Docker si nécessaire
	@docker network inspect $(NETWORK_NAME) >/dev/null 2>&1 || \
		(echo "$(YELLOW)Création du réseau $(NETWORK_NAME)...$(NC)" && \
		docker network create $(NETWORK_NAME) && \
		echo "$(GREEN)✓ Réseau créé$(NC)")

up: network ## Lance tous les services (ENV=dev par défaut)
ifdef SERVICE
	@echo "$(YELLOW)Démarrage du service $(SERVICE) ($(ENV))...$(NC)"
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml up --build -d
	@echo "$(GREEN)✓ Service $(SERVICE) démarré$(NC)"
else
	@echo "$(YELLOW)Démarrage de tous les services ($(ENV))...$(NC)"
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$$dir/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(BLUE)→ Démarrage de $$service...$(NC)"; \
			cd $$dir && docker compose -f compose.$(ENV).yml up --build -d && cd ../..; \
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
		compose_file="$$dir/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(BLUE)→ Arrêt de $$service...$(NC)"; \
			cd $$dir && docker compose -f compose.$(ENV).yml down && cd ../..; \
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
		compose_file="$$dir/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			cd $$dir && docker compose -f compose.$(ENV).yml down -v && cd ../..; \
		fi; \
	done
endif
	@echo "$(GREEN)✓ Services arrêtés et volumes supprimés$(NC)"

restart: down up ## Redémarre les services

logs: ## Affiche les logs (SERVICE requis ou ALL pour tous)
ifdef SERVICE
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml logs -f
else
	@echo "$(RED)Veuillez spécifier un SERVICE ou utilisez 'make logs-all'$(NC)"
endif

logs-all: ## Affiche les logs de tous les services
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$$dir/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			cd $$dir && docker compose -f compose.$(ENV).yml logs --tail=50 && cd ../..; \
		fi; \
	done

ps: ## Liste tous les conteneurs en cours d'exécution
	@echo "$(BLUE)État des services:$(NC)"
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$$dir/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(YELLOW)→ $$service:$(NC)"; \
			cd $$dir && docker compose -f compose.$(ENV).yml ps && cd ../..; \
		fi; \
	done

build: ## Rebuild tous les services sans les démarrer
ifdef SERVICE
	@cd $(SERVICES_DIR)/$(SERVICE) && docker compose -f compose.$(ENV).yml build
else
	@for dir in $(SERVICES_DIR)/*/; do \
		service=$$(basename $$dir); \
		compose_file="$$dir/compose.$(ENV).yml"; \
		if [ -f "$$compose_file" ]; then \
			echo "$(BLUE)→ Build de $$service...$(NC)"; \
			cd $$dir && docker compose -f compose.$(ENV).yml build && cd ../..; \
		fi; \
	done
	@echo "$(GREEN)✓ Build terminé$(NC)"
endif

clean: down-volumes ## Nettoie tout (conteneurs, volumes, images)
	@echo "$(YELLOW)Nettoyage des images non utilisées...$(NC)"
	@docker image prune -f
	@echo "$(GREEN)✓ Nettoyage terminé$(NC)"

list: ## Liste tous les services disponibles
	@echo "$(BLUE)Services disponibles:$(NC)"
	@for service in $(SERVICES); do \
		echo "  $(GREEN)→ $$service$(NC)"; \
	done

# Alias pratiques
dev-up: ## Lance tous les services en dev
	@$(MAKE) up ENV=dev

prod-up: ## Lance tous les services en prod
	@$(MAKE) up ENV=prod

integ-up: ## Lance tous les services en integ
	@$(MAKE) up ENV=integ