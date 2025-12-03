# Utilise l'image Nginx Alpine (très légère) pour servir les fichiers statiques
FROM nginx:stable-alpine

# Copie explicite des fichiers et dossiers nécessaires. 
# Cela contourne les problèmes potentiels liés aux fichiers temporaires ou symboliques.
COPY index.html /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY README.md /usr/share/nginx/html/
COPY res /usr/share/nginx/html/res

# Expose le port 80 
EXPOSE 80

# Commande par défaut pour démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]