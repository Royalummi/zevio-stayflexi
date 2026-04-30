#!/bin/bash
curl -s -X POST https://api.zevio.in/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@zevio.com","password":"Admin@123","role":"admin"}'
