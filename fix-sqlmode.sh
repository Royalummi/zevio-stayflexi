#!/bin/bash
# Fix MySQL ONLY_FULL_GROUP_BY issue

NEW_MODE="STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION"

# Set globally (immediate effect, no restart needed)
mysql -u root '-pZevioDb@2026!' -e "SET GLOBAL sql_mode='${NEW_MODE}';" 2>/dev/null
echo "Global sql_mode updated"

# Verify immediately
mysql -u root '-pZevioDb@2026!' -e "SELECT @@GLOBAL.sql_mode;" 2>/dev/null

# Persist in MySQL config so it survives reboots
CONF_FILE="/etc/mysql/mysql.conf.d/mysqld.cnf"
if grep -q "sql_mode" "$CONF_FILE" 2>/dev/null; then
  sed -i "s|^sql_mode.*|sql_mode = ${NEW_MODE}|" "$CONF_FILE"
  echo "Updated existing sql_mode in $CONF_FILE"
else
  echo "" >> "$CONF_FILE"
  echo "sql_mode = ${NEW_MODE}" >> "$CONF_FILE"
  echo "Added sql_mode to $CONF_FILE"
fi

echo "SQLMODE_FIX_DONE"
