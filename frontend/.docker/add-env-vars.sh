_writeFrontendEnvVars() {
    ENV_JSON="$(jq --compact-output --null-input 'env | with_entries(select(.key | startswith("REACT_APP_")))')"
    ENV_JSON_ESCAPED="$(printf "%s" "${ENV_JSON}" | sed -e 's/[\&/]/\\&/g')"
    sed -i "s/<noscript id=\"env-insertion-point\"><\/noscript>/<script>var ENV=${ENV_JSON_ESCAPED}<\/script>/g" ${PUBLIC_HTML}index.html
}

_writeNginxEnvVars() {
    if dockerize -template /etc/nginx/conf.d/default.conf:/etc/nginx/conf.d/default.conf; then
        echo "Nginx environment variables written successfully."
    else
        echo "Failed to write Nginx environment variables. Check the template configuration."
    fi
}

_addSslConfig() {
    local ENVIRONMENT="$1"
    local SSL_CERTIFICATE="/etc/nginx/ssl/${ENVIRONMENT}/fullchain.pem"
    local SSL_CERTIFICATE_KEY="/etc/nginx/ssl/${ENVIRONMENT}/privkey.pem"
    local FILE_CONF="/etc/nginx/sites.d/${ENVIRONMENT}.conf"
    local FILE_SSL_CONF="/etc/nginx/conf.d/00-ssl-redirect.conf"

    if [ -f "${SSL_CERTIFICATE}" ] && [ -f "${SSL_CERTIFICATE_KEY}" ]; then
        echo "SSL certificates found for ${ENVIRONMENT}, saving SSL config in ${FILE_CONF}"
        echo 'include include.d/ssl-redirect.conf;' >> "${FILE_SSL_CONF}"
        echo 'include "include.d/ssl.conf";' >> "${FILE_CONF}"
        echo "ssl_certificate ${SSL_CERTIFICATE};" >> "${FILE_CONF}"
        echo "ssl_certificate_key ${SSL_CERTIFICATE_KEY};" >> "${FILE_CONF}"
    else
        echo "SSL certificates not found for ${ENVIRONMENT}, using non-SSL configuration."
        echo 'listen 80;' >> "${FILE_CONF}"
        echo "ssl ${ENVIRONMENT} not found >> ${SSL_CERTIFICATE} -> ${SSL_CERTIFICATE_KEY}"
    fi
}

# Execute functions
_writeFrontendEnvVars
_writeNginxEnvVars

_addSslConfig 'backend'
_addSslConfig 'frontend'
