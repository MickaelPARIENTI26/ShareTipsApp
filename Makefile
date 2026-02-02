.PHONY: help dev prod build test clean logs

# Default target
help:
	@echo "ShareBet - Available commands:"
	@echo ""
	@echo "  make dev        - Start development environment (Docker)"
	@echo "  make prod       - Start production environment (Docker)"
	@echo "  make build      - Build Docker images"
	@echo "  make test       - Run all tests"
	@echo "  make logs       - Show container logs"
	@echo "  make clean      - Stop and remove containers"
	@echo "  make db-shell   - Open PostgreSQL shell"
	@echo ""

# Development
dev:
	docker compose up -d
	@echo ""
	@echo "Services started:"
	@echo "  - API: http://localhost:8080"
	@echo "  - Swagger: http://localhost:8080"
	@echo "  - PostgreSQL: localhost:5432"
	@echo ""
	@echo "Run 'make logs' to see container logs"

# Production
prod:
	docker compose -f docker-compose.prod.yml up -d

# Build images
build:
	docker compose build --no-cache

# Run tests
test:
	cd backend && dotnet test --filter "Category!=Integration"

# View logs
logs:
	docker compose logs -f

# Clean up
clean:
	docker compose down -v
	docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true

# Database shell
db-shell:
	docker compose exec postgres psql -U sharebet -d sharebet

# Backend shell
api-shell:
	docker compose exec api sh

# Rebuild and restart API only
restart-api:
	docker compose up -d --build api

# Health check
health:
	@curl -s http://localhost:8080/api/health | jq . || echo "API not running"
