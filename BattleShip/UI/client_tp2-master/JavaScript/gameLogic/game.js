import {envoyerMissile, mettreAJourResultat, detruirePartie} from "../api.js";
import {verifierVainqueur, isPlacementValid} from "/JavaScript/gameLogic/validations.js"

const inputApiUrl = localStorage.getItem('inputApiUrl');
const token = localStorage.getItem('token');
const gameId = localStorage.getItem('gameId');
const gridEnnemie = document.getElementById('enemy-grid');
const shipSelect = document.getElementById('ship-select');
const toggleOrientation = document.getElementById('toggle-orientation');
const buttonRetour = document.getElementById('button-reset');
const listeBateauxJoueur = document.getElementById('liste-bateaux-joueur');
const placedShips = new Set();
const positionsToucheesEnnemiPourIA = [];
const positionsToucheesEnnemiPourJoueur = [];
const letters = "ABCDEFGHIJ";
const shipsToPlace = [
    {name: 'Porte-avions', size: 5},
    {name: 'Cuirassé', size: 4},
    {name: 'Contre-torpilleur', size: 3},
    {name: 'Sous-marin', size: 3},
    {name: 'Torpilleur', size: 2}
];

let coordoComplete;
let tourJoueur;
export let bateauxPositionsEnnemi = [];
export let bateauxPositionsJoueur = [];
let tirsEffectues = new Set();
let allShipsPlaced = false;
let currentOrientation = 'horizontal';
let selectedShip = shipsToPlace[0];
export let partieTerminee = false;


window.addEventListener('load', () => {
    createGrid('grid', true); // ta grille, avec placement
    createGrid('enemy-grid', false);
    afficherBateauxEnnemi();

})

buttonRetour.addEventListener('click', () => {
    detruirePartie(inputApiUrl, gameId, token)
        .then(
            (response) => {
                localStorage.removeItem('inputApiUrl');
                localStorage.removeItem('token');
                localStorage.removeItem('gameId');
                localStorage.removeItem('ennemi_bateaux');
                window.location.href = '/index.html';
            }
        )
        .catch(error => {
            console.log(error);
            alert("Erreur lors de la suppression de la partie.");
        });
});

shipsToPlace.forEach(ship => {
    const option = document.createElement('option');
    option.value = ship.name;
    option.textContent = `${ship.name} (${ship.size})`;
    shipSelect.appendChild(option);
});

shipSelect.addEventListener('change', (e) => {
    selectedShip = shipsToPlace.find(s => s.name === e.target.value);
});

toggleOrientation.addEventListener('click', () => {
    currentOrientation = currentOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    toggleOrientation.textContent = `Orientation : ${currentOrientation.charAt(0).toUpperCase() + currentOrientation.slice(1)}`;
});

gridEnnemie.addEventListener('click', (e) => {
    if (partieTerminee) {
        alert("La partie est déjà terminée !");
        return;
    }
    if (allShipsPlaced) {
        if (tourJoueur) {
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);

            const coord = `${row}-${col}`;

            if (tirsEffectues.has(coord)) {
                alert("Vous avez déjà tiré sur cette case !");
                return;
            }
            tirsEffectues.add(coord);
            tirerMissile(row, col);
            tourIa();
        } else {
            alert("Ce n'est pas votre tour !");
        }
    } else {
        alert("Placez tous vos bateaux avant de tirer !");
    }
});


/**
 * Crée dynamiquement une grille de jeu.
 * @param {string} containerId - ID de l'élément DOM qui contiendra la grille.
 * @param {boolean} isPlayerGrid - Indique si c'est la grille du joueur (permet le placement).
 */
export function createGrid(containerId, isPlayerGrid) {
    const container = document.getElementById(containerId);
    const firstTopCell = container.appendChild(createCell('', true));
    firstTopCell.classList.add("first_Top_Cell_border")
    for (let l = 0; l < 10; l++) {
        if (letters[l] === "J") {
            const lastTopCell = container.appendChild(createCell(letters[l], true));
            lastTopCell.classList.add("last_Top_Cell_border");
        } else {
            container.appendChild(createCell(letters[l], true));
        }
    }
    for (let i = 0; i < 10; i++) {
        if (i === 9) {
            const firstBottomCell = createCell(i + 1, true);
            firstBottomCell.classList.add("first_Bottom_Cell_border");
            container.appendChild(firstBottomCell);
        } else {
            container.appendChild(createCell(i + 1, true));
        }
        for (let j = 0; j < 10; j++) {
            const cell = createCell('', false);
            cell.dataset.row = i;
            cell.dataset.col = j;

            if (isPlayerGrid) {
                cell.addEventListener('click', () => {
                    if (!selectedShip || placedShips.has(selectedShip.name)) {
                        alert("Ce bateau a déjà été placé !");
                        return;
                    }
                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);
                    if (!isPlacementValid(row, col, selectedShip.size, currentOrientation)) {
                        alert("Placement invalide !");
                        return;
                    }
                    placeShip(row, col, selectedShip, currentOrientation, containerId);
                });
            }
            container.appendChild(cell);
        }
    }
}

/**
 * Crée une cellule de grille.
 * @param {string} content - Contenu textuel à afficher.
 * @param {boolean} isHeader - Si la cellule est une cellule d’en-tête.
 * @returns {HTMLDivElement} La cellule créée.
 */
function createCell(content, isHeader = false) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (isHeader) cell.classList.add('header');
    cell.textContent = content;
    return cell;
}

/**
 * Place un bateau sur la grille du joueur.
 * @param {number} row - Ligne de départ.
 * @param {number} col - Colonne de départ.
 * @param {{name: string, size: number}} ship - Bateau à placer.
 * @param {string} orientation - 'horizontal' ou 'vertical'.
 */
function placeShip(row, col, ship, orientation) {
    let shipPositions = [];
    for (let i = 0; i < ship.size; i++) {
        const targetRow = orientation === 'horizontal' ? row : row + i;
        const targetCol = orientation === 'horizontal' ? col + i : col;
        const cell = document.querySelector(`.cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
        cell.classList.add('ship');
        shipPositions.push({row: targetRow, col: targetCol});
    }
    bateauxPositionsJoueur.push({name: ship.name, positions: shipPositions});
    placedShips.add(ship.name);

    const optionToRemove = shipSelect.querySelector(`option[value="${ship.name}"]`);
    if (optionToRemove) {
        optionToRemove.remove();
    }

    if (placedShips.size === shipsToPlace.length) {
        allShipsPlaced = true; // Tous les bateaux sont placés
        alert("Tous les bateaux sont placés ! Vous pouvez maintenant tirer.");
        // Tu peux activer un bouton de tir ou changer l'état de la grille pour permettre de tirer
    }

    // Choisir un autre bateau automatiquement si dispo
    if (shipSelect.options.length > 0) {
        selectedShip = shipsToPlace.find(s => s.name === shipSelect.value);
    } else {
        selectedShip = null;
        //une foi que tout les bateaux sont placés, de qui joue entre le joueur et l'IA

        const randomNumber = Math.floor(Math.random() * 2);

        if (randomNumber === 0) {
            tourJoueur = true;
            alert("C'est a vous de commencer");
        } else {
            tourJoueur = false;
            alert("C'est au tour de l'IA de commencer");
            // Appeler la fonction de l'IA pour tirer
            tourIa();
        }
    }
    mettreAJourEtatDesBateaux();
}

/**
 * Lit les bateaux ennemis depuis le localStorage et prépare leurs positions
 * pour la logique de détection de touche.
 */
export function afficherBateauxEnnemi() {
    const bateaux = JSON.parse(localStorage.getItem('ennemi_bateaux'));

    if (!bateaux) {
        console.log("Aucun bateau ennemi trouvé dans le localStorage.");
        return;
    }

    localStorage.setItem('bateaux_ennemis_structures', JSON.stringify(bateaux));

    bateauxPositionsEnnemi = [];

    Object.values(bateaux).forEach(positions => {
        positions.forEach(coord => {
            const [colLetter, rowNumber] = coord.split('-');
            const row = parseInt(rowNumber) - 1;
            const col = "ABCDEFGHIJ".indexOf(colLetter);
            bateauxPositionsEnnemi.push({ row, col }); // Ajouter la position dans le tableau
        });
    });
    localStorage.removeItem('ennemi_bateaux');
}

/**
 * Gère le tir d'un missile par le joueur.
 * @async
 * @param {number} row - Ligne ciblée.
 * @param {number} col - Colonne ciblée.
 * @returns {Promise<boolean>} Résultat : true si touché, false sinon.
 */
async function tirerMissile(row, col) {
    const touche = bateauxPositionsEnnemi.some(position => position.row === row && position.col === col);
    console.log(bateauxPositionsEnnemi);

    const cell = document.querySelector(`#enemy-grid .cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        if (touche) {
            const icon = document.createElement('i');
            icon.classList.add('fa-solid', 'fa-ship', 'fa-lg');
            cell.classList.add('touche');
            cell.appendChild(icon);

            // Marquer cette position comme touchée
            positionsToucheesEnnemiPourJoueur.push({ row, col });
            console.log(positionsToucheesEnnemiPourJoueur);

            const bateaux = JSON.parse(localStorage.getItem('bateaux_ennemis_structures'));
            if (bateaux) {
                for (const [nom, coords] of Object.entries(bateaux)) {
                    const coordObjList = coords.map(coord => {
                        const [colLetter, rowNumber] = coord.split('-');
                        console.log(colLetter, rowNumber);
                        return {
                            row: parseInt(rowNumber) - 1,
                            col: letters.indexOf(colLetter)
                        };

                    });

                    for (const [nom, coords] of Object.entries(bateaux)) {
                        let i = 0
                        const coordObjList = coords.map(coord => {
                            const [colLetter, rowNumber] = coord.split('-');
                            return {
                                row: parseInt(rowNumber) - 1,
                                col: letters.indexOf(colLetter)
                            };
                        });

                        const positionsBateau = coordObjList.map(c => `${c.row}-${c.col}`);
                        const positionsToucheesFormat = positionsToucheesEnnemiPourJoueur.map(t => `${t.row}-${t.col}`);
                            console.log("Positions du porte-avion : ", coordObjList);
                            console.log("Positions touchées : ", positionsToucheesEnnemiPourJoueur);

                        const estCoule = positionsBateau.every(pos => positionsToucheesFormat.includes(pos));

                        if (estCoule) {
                            const listeBateaux = document.getElementById('liste-bateaux-ennemi');
                            const li = document.createElement('li');
                            li.textContent = `Vous avez coulé le ${nom} !`;
                            listeBateaux.appendChild(li);

                            delete bateaux[nom];
                            localStorage.setItem('bateaux_ennemis_structures', JSON.stringify(bateaux));
                            console.log(JSON.parse(localStorage.getItem('bateaux_ennemis_structures')));

                            break;
                        }
                    }
                }
            }
        } else {
            cell.classList.add('rate');
        }
    }
    mettreAJourEtatDesBateaux();
    return touche;
}

/**
 * Gère le tour de l’IA : appelle l’API, lit la coordonnée et met à jour l’état du jeu.
 * @async
 */

async function tourIa() {
    tourJoueur = false; // Changer le tour
   await envoyerMissile(inputApiUrl, gameId, token)
        .then(async (response2) => {
            coordoComplete = response2.data.data.coordonnee;
            const coordParts = response2.data.data.coordonnee.split("-");
            const col = "ABCDEFGHIJ".indexOf(coordParts[0]);
            const row = parseInt(coordParts[1]) - 1;
            resultatDuTireIa(row, col);
            positionsToucheesEnnemiPourIA.push({row: row, col: col});

        })
        .catch((error) => {
            console.log(error)
        })

    tourJoueur = true;
}

/**
 * Applique le résultat du tir de l’IA sur la grille du joueur.
 * @async
 * @param {number} row - Ligne du tir.
 * @param {number} col - Colonne du tir.
 */
async function resultatDuTireIa(row, col) {
    let resultat = 0;

    let bateauTouche = null;
    for (const bateau of bateauxPositionsJoueur) {
        const position = bateau.positions.find(p => p.row === row && p.col === col);
        if (position) {
            position.touche = true;
            bateauTouche = bateau;
            resultat = 1; // Touché
            break;
        }
    }
    const cellJoueur = document.querySelector(`#grid .cell[data-row="${row}"][data-col="${col}"]`);

    if (cellJoueur) {
        if (bateauTouche) {
            const estCoule = bateauTouche.positions.every(p => p.touche);

            if (estCoule) {
                switch (bateauTouche.name) {
                    case "Porte-avions":
                        resultat = 2;
                        break;
                    case "Cuirassé":
                        resultat = 3;
                        break;
                    case "Contre-torpilleur":
                        resultat = 4;
                        break;
                    case "Sous-marin":
                        resultat = 5;
                        break;
                    case "Torpilleur":
                        resultat = 6;
                        break;
                }

            }
            const icon = document.createElement('i');
            icon.classList.add('fa-solid', 'fa-ship', 'fa-lg');
            cellJoueur.classList.add('touche');
            cellJoueur.classList.remove('ship');
            cellJoueur.appendChild(icon);
        } else {
            resultat = 0;
            cellJoueur.classList.add('rate');
        }

       mettreAJourEtatDesBateaux();
      await mettreAJourResultat(inputApiUrl, gameId, coordoComplete, resultat, token)
            .then((response3) => {
                console.log(response3.data);
            });
    }
    await verifierVainqueur();
    return !!bateauTouche;
}

/**
 * Permet d'afficher l'état des bateaux du joueur. Il permet aussi d'updater leur état, pour que ce soit à jour.
 * @param {array} bateauxPositions - Tableau contenant les positions des bateaux.
 * @param {HTMLDListElement} listeBateaux - Liste HTML .
 */
function afficherBateauxAvecEtat(bateauxPositions, listeBateaux) {
    listeBateaux.innerHTML = '';

    bateauxPositions.forEach(bateau => {
        if (!bateau.positions || bateau.positions.length === 0) {
            // Si "positions" est undefined ou vide, on passe au suivant
            console.warn(`Le bateau ${bateau.name} n'a pas de positions valides`);
            return; // Ne pas traiter ce bateau
        }

        const total = bateau.positions.length;
        const touches = bateau.positions.filter(p => p.touche).length;
        const pourcentage = (touches / total) * 100;

        let classeCouleur = 'progress-vert';
        if (pourcentage === 100) classeCouleur = 'progress-rouge';
        else if (pourcentage > 0) classeCouleur = 'progress-jaune';

        const li = document.createElement('li');
        li.className = 'bateau-joueur';

        const nomDiv = document.createElement('div');
        nomDiv.className = 'bateau-nom';
        nomDiv.textContent = `${bateau.name} (${touches}/${total})`;

        const barre = document.createElement('div');
        barre.className = 'bateau-barre';

        const progress = document.createElement('div');
        progress.className = `bateau-progress ${classeCouleur}`;
        progress.style.width = `${pourcentage}%`;

        barre.appendChild(progress);
        li.appendChild(nomDiv);
        li.appendChild(barre);
        listeBateaux.appendChild(li);
    });
}

/**
 * Appel la methode afficherBateauxAvecEtat avec les positions des bateaux du joueur et la liste des bateaux du joueur.
 */
function mettreAJourEtatDesBateaux() {
    afficherBateauxAvecEtat(bateauxPositionsJoueur, listeBateauxJoueur);
}
