#!/bin/bash

set -e

echo "Waiting for Keycloak to be ready..."
sleep 10

echo "Configuring realms..."

# Configure kcadm
/opt/keycloak/bin/kcadm.sh config credentials \
  --server http://keycloak:8080 \
  --realm master \
  --user "${KEYCLOAK_ADMIN}" \
  --password "${KEYCLOAK_ADMIN_PASSWORD}"

# Disable SSL requirement on master realm
echo "Disabling SSL requirement on master realm..."
/opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE

# Disable SSL requirement on chariot realm  
echo "Disabling SSL requirement on chariot realm..."
/opt/keycloak/bin/kcadm.sh update realms/chariot -s sslRequired=NONE

# Disable email verification requirement on chariot realm
echo "Disabling email verification requirement on chariot realm..."
/opt/keycloak/bin/kcadm.sh update realms/chariot -s verifyEmail=false

# Configure SMTP if variables are set
if [ -n "${KEYCLOAK_SMTP_HOST}" ]; then
  echo "Configuring SMTP for chariot realm..."
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.host=${KEYCLOAK_SMTP_HOST}"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.port=${KEYCLOAK_SMTP_PORT}"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.from=${KEYCLOAK_SMTP_FROM}"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.fromDisplayName=${KEYCLOAK_SMTP_FROM_DISPLAY_NAME}"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.replyTo=${KEYCLOAK_SMTP_REPLY_TO}"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.replyToDisplayName=${KEYCLOAK_SMTP_REPLY_TO_DISPLAY_NAME}"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.auth=true"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.user=${KEYCLOAK_SMTP_USER}"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s smtpServer.password="${KEYCLOAK_SMTP_PASSWORD}"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.starttls=${KEYCLOAK_SMTP_STARTTLS}"
  /opt/keycloak/bin/kcadm.sh update realms/chariot -s "smtpServer.ssl=${KEYCLOAK_SMTP_SSL}"
  echo "SMTP configured successfully"
fi

# Create default admin user if variables are set
if [ -n "${KEYCLOAK_ADMIN_EMAIL}" ]; then
  echo "Checking if default admin user exists..."
  
  # Check if user exists by email
  USERS_JSON=$(/opt/keycloak/bin/kcadm.sh get users -r chariot --query email="${KEYCLOAK_ADMIN_EMAIL}")
  
  if echo "$USERS_JSON" | grep -q '"id"'; then
    echo "Default admin user already exists, updating..."
    # Extract user ID using jq or grep
    USER_ID=$(echo "$USERS_JSON" | grep -o '"id" : "[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$USER_ID" ]; then
      # Remove required actions if any
      echo "Removing required actions for user $USER_ID..."
      /opt/keycloak/bin/kcadm.sh update users/"$USER_ID" -r chariot -s 'requiredActions=[]'
      
      # Ensure user has the necessary roles (in case they were removed)
      echo "Ensuring user has admin and management roles..."
      /opt/keycloak/bin/kcadm.sh add-roles -r chariot --uid "$USER_ID" --rolename admin --rolename users 2>/dev/null || true
      /opt/keycloak/bin/kcadm.sh add-roles -r chariot --uid "$USER_ID" --cclientid realm-management --rolename manage-users --rolename view-users --rolename query-users 2>/dev/null || true
      
      echo "User updated successfully"
    fi
  else
    echo "Creating default admin user: ${KEYCLOAK_ADMIN_EMAIL}..."
    
    # Create user
    USER_ID=$(/opt/keycloak/bin/kcadm.sh create users -r chariot \
      -s username="${KEYCLOAK_ADMIN_EMAIL}" \
      -s email="${KEYCLOAK_ADMIN_EMAIL}" \
      -s firstName="${KEYCLOAK_ADMIN_FIRSTNAME}" \
      -s lastName="${KEYCLOAK_ADMIN_LASTNAME}" \
      -s enabled=true \
      -s emailVerified=true \
      -i)
    
    # Set password
    /opt/keycloak/bin/kcadm.sh set-password -r chariot \
      --username "${KEYCLOAK_ADMIN_EMAIL}" \
      --new-password "${KEYCLOAK_ADMIN_PASSWORD}"
    
    # IMPORTANT: Remove required actions AFTER user creation
    # (because realm's verifyEmail:true adds VERIFY_EMAIL by default)
    echo "Removing required actions from admin user..."
    /opt/keycloak/bin/kcadm.sh update users/"$USER_ID" -r chariot -s 'requiredActions=[]'
    
    # Assign realm roles
    echo "Assigning admin and users roles to user..."
    /opt/keycloak/bin/kcadm.sh add-roles -r chariot --uid "$USER_ID" --rolename admin --rolename users
    
    # Assign realm-management client roles for user management
    echo "Assigning user management roles..."
    /opt/keycloak/bin/kcadm.sh add-roles -r chariot --uid "$USER_ID" --cclientid realm-management --rolename manage-users --rolename view-users --rolename query-users
    
    echo "Default admin user created successfully with ID: $USER_ID"
  fi
fi

echo "Configuration complete!"
