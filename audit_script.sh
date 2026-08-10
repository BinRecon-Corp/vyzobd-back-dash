#!/bin/bash
echo "--- Controllers ---"
ls -la src/backend/controllers || true
echo "--- Services ---"
ls -la src/backend/services || true
echo "--- Routes ---"
ls -la src/backend/routes || true
echo "--- Validators ---"
ls -la src/backend/validators || true
echo "--- Storefront Controllers ---"
ls -la src/backend/controllers/storefront || true
echo "--- Storefront Services ---"
ls -la src/backend/services/storefront || true
echo "--- Storefront Routes ---"
ls -la src/backend/routes/storefront || true
echo "--- Pages ---"
find src/pages -type f || true
echo "--- Middlewares ---"
ls -la src/backend/middlewares || true
