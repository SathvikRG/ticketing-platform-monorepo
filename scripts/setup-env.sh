#!/bin/bash

# Setup script for environment variables
# This script creates .env files with proper configuration

echo "Setting up environment files..."

# Root .env
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/ticketing_platform
PORT=3001
API_KEY=dev-api-key-2024
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
PRICING_RULE_TIME_WEIGHT=0.4
PRICING_RULE_DEMAND_WEIGHT=0.35
PRICING_RULE_INVENTORY_WEIGHT=0.25
EOF

# apps/api/.env
mkdir -p apps/api
cat > apps/api/.env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/ticketing_platform
PORT=3001
API_KEY=dev-api-key-2024
FRONTEND_URL=http://localhost:3000
PRICING_RULE_TIME_WEIGHT=0.4
PRICING_RULE_DEMAND_WEIGHT=0.35
PRICING_RULE_INVENTORY_WEIGHT=0.25
EOF

# packages/database/.env
mkdir -p packages/database
cat > packages/database/.env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/ticketing_platform
EOF

# apps/web/.env
mkdir -p apps/web
cat > apps/web/.env << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

echo "Environment files created!"
echo ""
echo "⚠️  IMPORTANT: Update the DATABASE_URL in these files with your actual PostgreSQL connection string."
echo ""
echo "Example:"
echo "  postgresql://postgres:password@localhost:5432/ticketing_platform"

