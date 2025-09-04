SHELL := /bin/bash

.PHONY: migrate seed

migrate:
	cd apps/api && pnpm prisma:generate && pnpm prisma:migrate

seed:
	pnpm tsx scripts/seed.ts

