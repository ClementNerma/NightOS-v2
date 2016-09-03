
![NightOS Logo](http://i.imgur.com/iRikS7cl.png)

*Vous pouvez lire ce fichier [en français](https://github.com/ClementNerma/NightOS/blob/master/README-fr.md) !*

NightOS is a desktop environment which is based on a custom Linux distribution. It uses the [Electron](https://github.com/electron/electron) and [NodeJS](https://nodejs.org) technology to access the filesystem, manage the network connections, and manage applications safely.

# How does it work ?

NightOS allows you to run JavaScript-written applications into a safe context. The application is entirely controlled by the system, and you can define its permissions as you want. For example, an application will have to ask you the permission for accessing your hard drive or for sending data through the internet network.

Applications are runned into new threads that are isolated from the main process which manages them. That allows great performances ; if an application requires a lot of power the OS will use its built-in load balancer to give it a higher priority than the other processes.

Further details will come soon in the documentation or in the [OpenClassrooms thread (french)](https://openclassrooms.com/forum/sujet/desktop-environment-nightos-le-retour).

# Installation

Installation requires [NodeJS](https://nodejs.org), [NPM](https://npmjs.com) and [Git](https://git-scm.com/) installed on your machine. On Linux, you can run `sudo apt-get install nodejs npm git`.

To install NightOS, open a command-line and run the following code :

```bash
git clone https://github.com/ClementNerma/NightOS # Download NightOS
cd NightOS # Go to the NightOS directory
npm install # Install the npm dependencies
npm start # Start NightOS
```

You can also run NightOS in debug mode :

```bash
node start.js --force-debug
```

# License

This project is released under the [Creative Commons Attribution BY-NC-ND 4.0 International](https://creativecommons.org/licenses/by-nc-nd/4.0/) license.
The license of the project may change on the future and it will maybe release using the GPL license in a future version.

# Disclaimer

The software is provided "as is" and the author disclaims all warranties
with regard to this software including all implied warranties of
merchantability and fitness. In no event shall the author be liable for
any special, direct, indirect, or consequential damages or any damages
whatsoever resulting from loss of use, data or profits, whether in an action
of contract, negligence or other tortious action, arising out of or in
connection with the use or performance of this software.

# Credits

NightOS was built using [NodeJS](https://nodejs.org) and [Electron](https://github.com/electron/electron).
Icons from [Icons8](https://icons8.com), [Joe Parks](https://www.flickr.com/people/34450190@N08) and [Font-Awesome](http://fortawesome.github.io/Font-Awesome).
