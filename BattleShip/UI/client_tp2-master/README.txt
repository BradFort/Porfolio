Projet TP2 BattleShip

Instrictions à suivre pour faire fonctionner le projet.

1. Ouvrir le projet dans un IDE compatible avec Java (comme IntelliJ IDEA ou Eclipse).
2. Une fois le projet ouvert dans l'IDE, faire un "npm install" dans le terminal, pour installer les dépendances nécessaires.

3. du côter de l'API
    -créer le fichier .env et copier coller ce qui se trouve dans le fichier .env.example
    -dans le terminal de l'API faire runner la commande suivate : docker run --rm \
                                                                      -u "$(id -u):$(id -g)" \
                                                                      -v "$(pwd):/var/www/html" \
                                                                      -w /var/www/html \
                                                                      laravelsail/php84-composer:latest \
                                                                      composer install --ignore-platform-reqs
    -ensuite faire un : sail compose up -d
    -ensuite faire un : sail artisan migrate
    -ensuite faire un : sail artisan db:seed
    -ensuite faire un : sail artisan tinker
        -Une fois dans le tinker, faire un : $user = \App\Models\User::find(1)
        -Appuyer sur Q
        - Ensuite faire un : $user->createToken('api-test')->plainTextToken
        - prendre le token et le sauvegarder dans un endroit facile d'accès pour l'utiliser dans le client.

4. maintenant on retourne du coté du client. Faire un : npm run dev
5. cliquer sur le lien donner dans le terminal pour ouvrir le projet dans le navigateur.
6. Pour partir la partie, mettre un nom, le nom de l'adversaire, l'adrresse url : http://localhost/battleship-ia
    et finalement le token que vous avez généré dans le tinker de l'API. Ensuite clique sur le bouton "Lancer l'attaque".
7.placer tout les bateaux sur la grille de jeu et ensuite vous pouvez commencer la partie.




