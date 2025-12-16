import '../style.css';

import {creerPartie} from "./api";


const canonGauche = document.getElementById('canonGauche');
const canonDroite = document.getElementById('canonDroite');
const boutonJouer = document.getElementById('start-button');
const formGame = document.getElementById('form_game');
let nom_joueur = document.getElementById('nom_joueur');
let nom_IA = document.getElementById('nom_IA');
let token = document.getElementById('jeton_IA');
let inputApiUrl = document.getElementById('url_api_IA');
let gameId;

document.addEventListener('DOMContentLoaded', (e) => {
    e.preventDefault()
    nom_joueur.value = localStorage.getItem('nom_joueur');
    nom_IA.value = localStorage.getItem('nom_IA');
    token.value = localStorage.getItem('jeton_IA');
    inputApiUrl.value = localStorage.getItem('url_api_IA');
})

if (formGame) {
    formGame.addEventListener('submit', (event) => {
        event.preventDefault();
        inputApiUrl = document.getElementById('url_api_IA').value;
        localStorage.setItem('url_api_IA', inputApiUrl);

        token = document.getElementById('jeton_IA').value;
        localStorage.setItem('jeton_IA', token);
        console.log(token);

        nom_joueur = document.getElementById('nom_joueur').value;
        localStorage.setItem('nom_joueur',nom_joueur);

        nom_IA = document.getElementById('nom_IA').value;
        localStorage.setItem('nom_IA',nom_IA);

        creerPartie(inputApiUrl, token, nom_joueur)
            .then((response) => {
                console.log(response.data);
                gameId = response.data.data.id;
                console.log(gameId);

                localStorage.setItem('inputApiUrl', inputApiUrl);
                localStorage.setItem('token', token);
                localStorage.setItem('gameId', gameId);

                if (response.data && response.data.data && response.data.data.bateaux) {
                    localStorage.setItem('ennemi_bateaux', JSON.stringify(response.data.data.bateaux));
                }

                window.location.href = '/game.html';
            })
            .catch((error) => {
                console.log(error);
            });
    });
}

if (boutonJouer) {
    boutonJouer.addEventListener('mouseenter', (event) => {
        event.preventDefault();
        if (canonGauche && canonDroite) {
            canonGauche.classList.add("show");
            canonDroite.classList.add("show");
        }
    });

    boutonJouer.addEventListener('mouseleave', (event) => {
        event.preventDefault();
        if (canonGauche && canonDroite) {
            canonGauche.classList.remove("show");
            canonDroite.classList.remove("show");
        }
    });
}