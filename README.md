# Paris Audit et Conseil

Site vitrine local pour presentation du cabinet avec formulaire de contact.

## Demarrage

Lancer le serveur :

```powershell
node server.js
```

Puis ouvrir :

`http://localhost:3000`

## Contact

Le formulaire :

- enregistre chaque demande dans `data/contacts.json`
- ouvre ensuite la messagerie locale avec un email pre-rempli vers l'adresse definie par `CONTACT_TO_EMAIL`

## Deploiement Vercel

Le projet est compatible avec Vercel :

- les fichiers statiques sont servis depuis `public/`
- l'endpoint `api/contact` prepare le message de contact en serverless
- sur Vercel, aucune ecriture locale n'est tentee

Pour changer l'adresse email de destination, definir la variable d'environnement :

```powershell
$env:CONTACT_TO_EMAIL="amazondU16@gmail.com"
node server.js
```
