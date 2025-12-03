# Utilise l'image Nginx Alpine (très légère) pour servir les fichiers statiques
FROM nginx:stable-alpine

# Copie le contenu de votre dépôt (y compris index.html, CSS, JS, etc.)
# vers le répertoire de service par défaut de Nginx
COPY . /usr/share/nginx/html

# Expose le port 80 (qui sera mappé sur le port 8081 du VPS par le pipeline)
EXPOSE 80

# Commande par défaut pour démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]