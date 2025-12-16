import {partieTerminee, bateauxPositionsJoueur, bateauxPositionsEnnemi } from "/JavaScript/gameLogic/game.js";

/**
 * @fileoverview Implémente la logique principale du jeu Battleship côté client :
 * - création de la grille
 * - placement des bateaux
 * - gestion des tirs joueur et IA
 * - affichage des résultats et état de la partie
 *
 * Dépendances :
 * - API : envoyerMissile, mettreAJourResultat, detruirePartie
 * - Validations : verifierVainqueur, isPlacementValid
 */

export function isPlacementValid(row, col, size, orientation) {
    if (orientation === 'horizontal') {
        if (col + size > 10) return false;
        for (let i = 0; i < size; i++) {
            const cell = document.querySelector(`#grid .cell[data-row="${row}"][data-col="${col + i}"]`);
            if (cell && cell.classList.contains('ship')) {
                return false; // chevauchement détecté
            }
        }
    } else {
        if (row + size > 10) return false;
        for (let i = 0; i < size; i++) {
            const cell = document.querySelector(`#grid .cell[data-row="${row + i}"][data-col="${col}"]`);
            if (cell && cell.classList.contains('ship')) {
                return false; // chevauchement détecté
            }
        }
    }
    return true;
}


export function verifierVainqueur() {
    // Vérifie si tous les bateaux du joueur sont coulés
    const tousBateauxJoueurCoules = bateauxPositionsJoueur.every(bateau =>
        bateau.positions.every(position => position.touche)
    );

    // Vérifie si tous les bateaux de l'ennemi sont coulés
    const tousBateauxEnnemiCoules = bateauxPositionsEnnemi.every(position =>
        document.querySelector(`#enemy-grid .cell[data-row="${position.row}"][data-col="${position.col}"]`).classList.contains('touche')
    );

    if (tousBateauxJoueurCoules) {
        alert(`${localStorage.getItem("nom_IA")} a gagne!`);
        partieTerminee = true;
    } else if (tousBateauxEnnemiCoules) {
        alert("Vous avez gagné !");
        partieTerminee = true;
    }
}