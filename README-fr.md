
![NightOS Logo](http://i.imgur.com/iRikS7cl.png)

NightOS est un desktop environment basé sur une distribution Linux personnalisée. Il utilise les technologies [Electron](https://github.com/electron/electron) et [NodeJS](https://nodejs.org) pour accéder au système de fichiers, gérer les connexions réseaux, et gérer les applications de manière sécurisée.

# Comment ça marche ?

NightOS vous permet d'exécuter des applications écrites en JavaScript dans un environnement sécurisé. L'application est entièrement contrôllée par le système, et vous pouvez gérer ses permissions comme vous le voulez. Par exemple, une application devra vous demander la permissions pour accéder à votre disque dur ou pour envoyer des données sur Internet.

Les applications sont exécutées dans des processus séparés qui sont isolés du processus principal qui les contrôle. Cela permet d'obtenir de bonnes performances ; si une application nécessite une grosse puissance de calcul, l'OS va utiliser son load balancer intégré pour lui donner une plus grande priorité que les autres processus.

Plus de détails seront bientôt disponibles dans la documentation ou bien sur le thread OpenClassrooms :

# Installation

L'installation de NightOS nécessite que vous ayez installé [NodeJS](https://nodejs.org), [NPM](https://npmjs.com) et [Git](https://git-scm.com/) sur votre ordinateur. Sous Linux, vous pouvez simplement faire `sudo apt-get install nodejs npm git`.

Pour installer NightOS, ouvrez une ligne de commande et exécuter le code suivant :

```bash
git clone https://github.com/ClementNerma/NightOS # Télécharger NightOS
cd NightOS # Se rendre dans le dossier d'installation
npm install # Installer les dépendences du système
npm start # Lancer NightOS
```

Vous pouvez également lancer NightOS en mode debug :

```bash
node start.js --force-debug
```

# Licence

Ce projet est publié sous la licence [Creative Commons Attribution BY-NC-ND 4.0 International](https://creativecommons.org/licenses/by-nc-nd/4.0/).
Il est possible que la licence du projet change à l'avenir et il sera peut-être publié sous licence GPL dans une prochaine version.

# Disclaimer

The software is provided "as is" and the author disclaims all warranties
with regard to this software including all implied warranties of
merchantability and fitness. In no event shall the author be liable for
any special, direct, indirect, or consequential damages or any damages
whatsoever resulting from loss of use, data or profits, whether in an action
of contract, negligence or other tortious action, arising out of or in
connection with the use or performance of this software.

# Crédits

NightOS a été créé avec [NodeJS](https://nodejs.org) et [Electron](https://github.com/electron/electron).
Les icônes proviennent de [Icons8](https://icons8.com), [Joe Parks](https://www.flickr.com/people/34450190@N08) et [Font-Awesome](http://fortawesome.github.io/Font-Awesome).
