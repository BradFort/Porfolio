package cstjean.mobile.dames.damier;

import android.util.Log;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Stack;

/**
 * Classe représentant le jeu de dames. * Gère l'état du jeu, le tour des joueurs et les règles du jeu.
 */
public class JeuDames {
    /**
     * Le damier du jeu, contenant les pions et dames en jeu.
     */
    private final Damier damier;
    /**
     * Liste enregistrant l'historique des déplacements effectués dans la partie.
     */
    private final Stack<int[]> historiqueActions;
    /**
     * Indicateur de tour du joueur : 0 pour le joueur 1, 1 pour le joueur 2.
     */
    private int tour;

    /**
     * Constructeur de la classe JeuDames.
     * Initialise le damier, place les pions au départ, et attribue le tour au joueur 1.
     */
    public JeuDames() {
        damier = new Damier();
        damier.initializer();
        tour = 0;
        historiqueActions = new Stack<>();
    }

    /**
     * Calcule la position intermédiaire d'un pion lors d'un mouvement de capture.
     *
     * @param positionActuelle La position actuelle du pion.
     * @param delta            La différence de position entre la case de départ et celle d'arrivée.
     * @return La position intermédiaire du pion.
     */
    public int getPositionIntermediaire(int positionActuelle, int delta) {
        int positionIntermediaire = 0;
        int colonneActuelle = positionActuelle % 10;
        if (delta == 9) {
            positionIntermediaire = (colonneActuelle >= 1 && colonneActuelle <= 5) ?
                    positionActuelle + 5 : positionActuelle + 4;
        } else if (delta == 11) {
            positionIntermediaire = (colonneActuelle >= 1 && colonneActuelle <= 5) ?
                    positionActuelle + 6 : positionActuelle + 5;
        } else if (delta == -9) {
            positionIntermediaire = (colonneActuelle >= 1 && colonneActuelle <= 5) ?
                    positionActuelle - 4 : positionActuelle - 5;
        } else if (delta == -11) {
            positionIntermediaire = (colonneActuelle >= 2 && colonneActuelle <= 6) ?
                    positionActuelle - 5 : positionActuelle - 6;
        }
        return positionIntermediaire;
    }

    /**
     * Déplace un pion d'une position actuelle vers une position souhaitée.
     *
     * @param positionActuelle  La position actuelle du pion.
     * @param positionSouhaitee La position où déplacer le pion.
     * @return true si le déplacement est réussi, false sinon.
     */
    public boolean deplacerPion(int positionActuelle, int positionSouhaitee) {
        Pion pion = damier.getPion(positionActuelle);
        if (!estDeTour(pion)) {
            System.out.println("Coup invalide :mauvais joueur.");
            Log.d("DEPLACERPION", "Coup invalide :mauvais joueur.");
            return false;
        }
        if (pion == null) {
            System.out.println("Coup invalide : pas de pion.");
            Log.d("DEPLACERPION", "Coup invalide : pas de pion.");
            return false;
        }
        if (pion instanceof Dame) {
            if (!deplacementValideDame(positionActuelle, positionSouhaitee)) {
                System.out.println("Déplacement invalide pour la dame.");
                return false;
            }
        } else {
            if (!deplacementValide(positionActuelle, positionSouhaitee)) {
                System.out.println("Déplacement invalide pour un pion normal.");
                return false;
            }
        }
        damier.enleverPion(positionActuelle);
        damier.ajouterPion(positionSouhaitee, pion);
        if ((pion.getCouleur() == Pion.CouleurPion.blanc && positionSouhaitee <= 5) ||
                (pion.getCouleur() == Pion.CouleurPion.noir && positionSouhaitee >= 46)) {
            damier.enleverPion(positionSouhaitee);
            damier.ajouterPion(positionSouhaitee, new Dame(pion.getCouleur()));
            System.out.println("Le pion à la position " + positionSouhaitee + " a été promu en dame !");
        }
        historiqueActions.push(new int[]{positionActuelle, positionSouhaitee});
        changerTour();
        return true;
    }

    /**
     * Vérifie si le déplacement d'un pion est valide.
     *
     * @param positionDepart  La position de départ du pion.
     * @param positionArrivee La position d'arrivée du pion.
     * @return true si le déplacement est valide, false sinon.
     */
    public boolean deplacementValide(int positionDepart, int positionArrivee) {
        Pion pion = damier.getPion(positionDepart);
        List<Integer> casesPossibles = new ArrayList<>();
        if (pion == null) {
            return false;
        }
        if (damier.getPion(positionArrivee) != null) {
            Log.d("ERREUR", "La case d'arrivée n'est pas vide.");
            return false;
        }
        if (pion.getCouleur() == Pion.CouleurPion.blanc) {
            switch (positionDepart) {
                case 6:
                    casesPossibles = Collections.singletonList(1);
                    break;
                case 7:
                    casesPossibles = Arrays.asList(1, 2);
                    break;
                case 8:
                    casesPossibles = Arrays.asList(2, 3);
                    break;
                case 9:
                    casesPossibles = Arrays.asList(3, 4);
                    break;
                case 10:
                    casesPossibles = Arrays.asList(4, 5);
                    break;
                case 11:
                    casesPossibles = Arrays.asList(6, 7);
                    break;
                case 12:
                    casesPossibles = Arrays.asList(7, 8);
                    break;
                case 13:
                    casesPossibles = Arrays.asList(8, 9);
                    break;
                case 14:
                    casesPossibles = Arrays.asList(9, 10);
                    break;
                case 15:
                    casesPossibles = Collections.singletonList(10);
                    break;
                case 16:
                    casesPossibles = Collections.singletonList(11);
                    break;
                case 17:
                    casesPossibles = Arrays.asList(11, 12);
                    break;
                case 18:
                    casesPossibles = Arrays.asList(12, 13);
                    break;
                case 19:
                    casesPossibles = Arrays.asList(13, 14);
                    break;
                case 20:
                    casesPossibles = Arrays.asList(14, 15);
                    break;
                case 21:
                    casesPossibles = Arrays.asList(16, 17);
                    break;
                case 22:
                    casesPossibles = Arrays.asList(17, 18);
                    break;
                case 23:
                    casesPossibles = Arrays.asList(18, 19);
                    break;
                case 24:
                    casesPossibles = Arrays.asList(19, 20);
                    break;
                case 25:
                    casesPossibles = Collections.singletonList(20);
                    break;
                case 26:
                    casesPossibles = Collections.singletonList(21);
                    break;
                case 27:
                    casesPossibles = Arrays.asList(21, 22);
                    break;
                case 28:
                    casesPossibles = Arrays.asList(22, 23);
                    break;
                case 29:
                    casesPossibles = Arrays.asList(23, 24);
                    break;
                case 30:
                    casesPossibles = Arrays.asList(24, 25);
                    break;
                case 31:
                    casesPossibles = Arrays.asList(26, 27);
                    break;
                case 32:
                    casesPossibles = Arrays.asList(27, 28);
                    break;
                case 33:
                    casesPossibles = Arrays.asList(28, 29);
                    break;
                case 34:
                    casesPossibles = Arrays.asList(29, 30);
                    break;
                case 35:
                    casesPossibles = Collections.singletonList(30);
                    break;
                case 36:
                    casesPossibles = Collections.singletonList(31);
                    break;
                case 37:
                    casesPossibles = Arrays.asList(31, 32);
                    break;
                case 38:
                    casesPossibles = Arrays.asList(32, 33);
                    break;
                case 39:
                    casesPossibles = Arrays.asList(33, 34);
                    break;
                case 40:
                    casesPossibles = Arrays.asList(34, 35);
                    break;
                case 41:
                    casesPossibles = Arrays.asList(36, 37);
                    break;
                case 42:
                    casesPossibles = Arrays.asList(37, 38);
                    break;
                case 43:
                    casesPossibles = Arrays.asList(38, 39);
                    break;
                case 44:
                    casesPossibles = Arrays.asList(39, 40);
                    break;
                case 45:
                    casesPossibles = Collections.singletonList(40);
                    break;
                case 46:
                    casesPossibles = Collections.singletonList(41);
                    break;
                case 47:
                    casesPossibles = Arrays.asList(41, 42);
                    break;
                case 48:
                    casesPossibles = Arrays.asList(42, 43);
                    break;
                case 49:
                    casesPossibles = Arrays.asList(43, 44);
                    break;
                case 50:
                    casesPossibles = Arrays.asList(44, 45);
                    break;
                default:
                    casesPossibles = Collections.emptyList();
                    break;
            }
        } else if (pion.getCouleur() == Pion.CouleurPion.noir) {
            switch (positionDepart) {
                case 1:
                    casesPossibles = Arrays.asList(6, 7);
                    break;
                case 2:
                    casesPossibles = Arrays.asList(7, 8);
                    break;
                case 3:
                    casesPossibles = Arrays.asList(8, 9);
                    break;
                case 4:
                    casesPossibles = Arrays.asList(9, 10);
                    break;
                case 5:
                    casesPossibles = Collections.singletonList(10);
                    break;
                case 6:
                    casesPossibles = Collections.singletonList(11);
                    break;
                case 7:
                    casesPossibles = Arrays.asList(11, 12);
                    break;
                case 8:
                    casesPossibles = Arrays.asList(12, 13);
                    break;
                case 9:
                    casesPossibles = Arrays.asList(13, 14);
                    break;
                case 10:
                    casesPossibles = Arrays.asList(14, 15);
                    break;
                case 11:
                    casesPossibles = Arrays.asList(16, 17);
                    break;
                case 12:
                    casesPossibles = Arrays.asList(17, 18);
                    break;
                case 13:
                    casesPossibles = Arrays.asList(18, 19);
                    break;
                case 14:
                    casesPossibles = Arrays.asList(19, 20);
                    break;
                case 15:
                    casesPossibles = Collections.singletonList(20);
                    break;
                case 16:
                    casesPossibles = Collections.singletonList(21);
                    break;
                case 17:
                    casesPossibles = Arrays.asList(21, 22);
                    break;
                case 18:
                    casesPossibles = Arrays.asList(22, 23);
                    break;
                case 19:
                    casesPossibles = Arrays.asList(23, 24);
                    break;
                case 20:
                    casesPossibles = Arrays.asList(24, 25);
                    break;
                case 21:
                    casesPossibles = Arrays.asList(26, 27);
                    break;
                case 22:
                    casesPossibles = Arrays.asList(27, 28);
                    break;
                case 23:
                    casesPossibles = Arrays.asList(28, 29);
                    break;
                case 24:
                    casesPossibles = Arrays.asList(29, 30);
                    break;
                case 25:
                    casesPossibles = Collections.singletonList(30);
                    break;
                case 26:
                    casesPossibles = Collections.singletonList(31);
                    break;
                case 27:
                    casesPossibles = Arrays.asList(31, 32);
                    break;
                case 28:
                    casesPossibles = Arrays.asList(32, 33);
                    break;
                case 29:
                    casesPossibles = Arrays.asList(33, 34);
                    break;
                case 30:
                    casesPossibles = Arrays.asList(34, 35);
                    break;
                case 31:
                    casesPossibles = Collections.singletonList(36);
                    break;
                case 32:
                    casesPossibles = Arrays.asList(37, 38);
                    break;
                case 33:
                    casesPossibles = Arrays.asList(38, 39);
                    break;
                case 34:
                    casesPossibles = Arrays.asList(39, 40);
                    break;
                case 35:
                    casesPossibles = Collections.singletonList(40);
                    break;
                case 36:
                    casesPossibles = Collections.singletonList(41);
                    break;
                case 37:
                    casesPossibles = Arrays.asList(41, 42);
                    break;
                case 38:
                    casesPossibles = Arrays.asList(42, 43);
                    break;
                case 39:
                    casesPossibles = Arrays.asList(43, 44);
                    break;
                case 40:
                    casesPossibles = Arrays.asList(44, 45);
                    break;
                case 41:
                    casesPossibles = Arrays.asList(46, 47);
                    break;
                case 42:
                    casesPossibles = Arrays.asList(47, 48);
                    break;
                case 43:
                    casesPossibles = Arrays.asList(48, 49);
                    break;
                case 44:
                    casesPossibles = Arrays.asList(49, 50);
                    break;
                case 45:
                    casesPossibles = Collections.singletonList(50);
                    break;
                default:
                    casesPossibles = Collections.emptyList();
                    break;
            }
        }
        if (casesPossibles.contains(positionArrivee)) {
            return true;
        } else {
            Log.d("ERREUR", "Déplacement non valide.");
            return false;
        }
    }

    /**
     * Vérifie si le déplacement d'une dame est valide.
     *
     * @param positionDepart  La position de départ de la dame.
     * @param positionArrivee La position d'arrivée de la dame.
     * @return true si le déplacement est valide, false sinon.
     */
    public boolean deplacementValideDame(int positionDepart, int positionArrivee) {
        if (damier.getPion(positionArrivee) != null) {
            return false;
        }

        List<Integer> casesPossibles;

        switch (positionDepart) {
            case 1:
                casesPossibles = Arrays.asList(6, 7, 12, 18, 23, 29, 34, 40, 45);
                break;
            case 2:
                casesPossibles = Arrays.asList(7, 11, 16, 8, 13, 19, 24, 20, 35, 30);
                break;
            case 3:
                casesPossibles = Arrays.asList(8, 12, 17, 21, 26, 9, 14, 20, 25);
                break;
            case 4:
                casesPossibles = Arrays.asList(9, 13, 18, 22, 27, 31, 36, 10, 15);
                break;
            case 5:
                casesPossibles = Arrays.asList(10, 14, 19, 23, 28, 32, 37, 41, 46);
                break;
            case 6:
                casesPossibles = Arrays.asList(1, 11, 17, 22, 28, 33, 39, 44, 50);
                break;
            case 7:
                casesPossibles = Arrays.asList(1, 2, 11, 16, 12, 18, 23, 29, 34, 40, 45);
                break;
            case 8:
                casesPossibles = Arrays.asList(2, 3, 12, 17, 21, 26, 13, 19, 24, 30, 35);
                break;
            case 9:
                casesPossibles = Arrays.asList(3, 4, 13, 18, 22, 27, 31, 36, 14, 20, 25);
                break;
            case 10:
                casesPossibles = Arrays.asList(4, 5, 14, 19, 23, 28, 32, 37, 41, 46, 15);
                break;
            case 11:
                casesPossibles = Arrays.asList(6, 7, 2, 16, 17, 22, 28, 33, 39, 44, 50);
                break;
            case 12:
                casesPossibles = Arrays.asList(7, 1, 8, 3, 17, 21, 26, 17, 23, 29, 34, 40, 45);
                break;
            case 13:
                casesPossibles = Arrays.asList(8, 2, 9, 4, 18, 22, 27, 31, 36, 19, 24, 30, 35);
                break;
            case 14:
                casesPossibles = Arrays.asList(9, 3, 10, 5, 20, 25, 19, 23, 28, 32, 37, 41, 46);
                break;
            case 15:
                casesPossibles = Arrays.asList(10, 4, 20, 24, 29, 33, 38, 42, 47);
                break;
            case 16:
                casesPossibles = Arrays.asList(11, 7, 2, 21, 27, 32, 38, 43, 49);
                break;
            case 17:
                casesPossibles = Arrays.asList(11, 6, 12, 8, 3, 22, 28, 33, 39, 44, 50, 21, 26);
                break;
            case 18:
                casesPossibles = Arrays.asList(12, 7, 1, 13, 9, 4, 22, 27, 31, 36, 23, 29, 34, 40, 45);
                break;
            case 19:
                casesPossibles = Arrays.asList(13, 8, 2, 14, 10, 5, 19, 23, 28, 32, 37, 41, 46, 24, 30, 35);
                break;
            case 20:
                casesPossibles = Arrays.asList(14, 9, 3, 25, 24, 29, 33, 38, 42, 47);
                break;
            case 21:
                casesPossibles = Arrays.asList(16, 17, 12, 8, 3, 27, 32, 38, 43, 49, 26);
                break;
            case 22:
                casesPossibles = Arrays.asList(17, 11, 6, 18, 13, 9, 4, 27, 31, 36, 28, 33, 39, 44, 50);
                break;
            case 23:
                casesPossibles = Arrays.asList(18, 12, 7, 1, 19, 14, 10, 5, 29, 34, 40, 45, 28, 32, 37, 41, 46);
                break;
            case 24:
                casesPossibles = Arrays.asList(19, 13, 8, 2, 20, 15, 29, 33, 38, 42, 47, 30, 35);
                break;
            case 25:
                casesPossibles = Arrays.asList(20, 14, 9, 3, 30, 34, 39, 43, 48);
                break;
            case 26:
                casesPossibles = Arrays.asList(31, 37, 42, 48, 21, 17, 12, 8, 3);
                break;
            case 27:
                casesPossibles = Arrays.asList(31, 36, 22, 18, 13, 9, 4, 32, 38, 43, 49);
                break;
            case 28:
                casesPossibles = Arrays.asList(46, 41, 37, 32, 23, 19, 14, 10, 5, 6, 11, 17, 22, 33, 39, 44, 50);
                break;
            case 29:
                casesPossibles = Arrays.asList(47, 42, 38, 33, 24, 20, 15, 1, 7, 12, 18, 23, 34, 40, 45);
                break;
            case 30:
                casesPossibles = Arrays.asList(2, 8, 13, 19, 24, 35, 48, 43, 39, 34, 25);
                break;
            case 31:
                casesPossibles = Arrays.asList(36, 27, 22, 18, 13, 9, 4, 26, 37, 42, 48);
                break;
            case 32:
                casesPossibles = Arrays.asList(16, 21, 27, 38, 43, 49, 46, 41, 37, 28, 23, 19, 14, 10, 5);
                break;
            case 33:
                casesPossibles = Arrays.asList(6, 11, 17, 22, 28, 39, 44, 50, 47, 42, 38, 29, 24, 20, 15);
                break;
            case 34:
                casesPossibles = Arrays.asList(1, 7, 12, 18, 23, 29, 40, 45, 48, 43, 39, 30, 25);
                break;
            case 35:
                casesPossibles = Arrays.asList(2, 8, 13, 19, 24, 30, 49, 44, 40);
                break;
            case 36:
                casesPossibles = Arrays.asList(47, 41, 4, 9, 13, 18, 22, 27, 31);
                break;
            case 37:
                casesPossibles = Arrays.asList(26, 31, 42, 48, 5, 10, 14, 19, 23, 28, 32, 41, 46);
                break;
            case 38:
                casesPossibles = Arrays.asList(16, 21, 27, 32, 43, 49, 47, 42, 33, 29, 24, 20, 15);
                break;
            case 39:
                casesPossibles = Arrays.asList(6, 11, 17, 22, 28, 33, 44, 50, 25, 30, 34, 43, 48);
                break;
            case 40:
                casesPossibles = Arrays.asList(1, 7, 12, 18, 23, 29, 34, 45, 49, 44, 35);
                break;
            case 41:
                casesPossibles = Arrays.asList(5, 10, 14, 19, 23, 28, 32, 37, 46, 36, 47);
                break;
            case 42:
                casesPossibles = Arrays.asList(26, 31, 37, 48, 47, 38, 33, 29, 24, 20, 15);
                break;
            case 43:
                casesPossibles = Arrays.asList(48, 39, 34, 30, 25, 49, 38, 32, 27, 21, 16);
                break;
            case 44:
                casesPossibles = Arrays.asList(50, 39, 33, 28, 22, 17, 11, 6, 35, 40, 49);
                break;
            case 45:
                casesPossibles = Arrays.asList(1, 7, 12, 18, 23, 29, 34, 40, 45, 50);
                break;
            case 46:
                casesPossibles = Arrays.asList(41, 37, 32, 28, 23, 19, 14, 10, 5);
                break;
            case 47:
                casesPossibles = Arrays.asList(41, 36, 42, 38, 33, 29, 24, 20, 15);
                break;
            case 48:
                casesPossibles = Arrays.asList(42, 37, 31, 26, 43, 39, 34, 30, 25);
                break;
            case 49:
                casesPossibles = Arrays.asList(43, 38, 32, 27, 21, 16, 44, 40, 35);
                break;
            case 50:
                casesPossibles = Arrays.asList(44, 39, 33, 28, 22, 17, 11, 6, 45);
                break;
            default:
                casesPossibles = Collections.emptyList();
                break;

        }
        return casesPossibles.contains(positionArrivee);
    }

    /**
     * Effectue la capture d'un pion adverse.
     *
     * @param positionActuelle  La position actuelle du pion.
     * @param positionSouhaitee La position où déplacer le pion après la capture.
     * @return true si la capture est réussie, false sinon.
     */
    public boolean capturerPion(int positionActuelle, int positionSouhaitee) {
        Pion pion = damier.getPion(positionActuelle);
        Log.d("PION", "Selection du pion :" + pion);
        if (pion == null || !estDeTour(pion)) {
            System.out.println("Capture invalide : pas de pion ou mauvais joueur.");
            return false;
        }
        int delta = positionSouhaitee - positionActuelle;
        int positionIntermediaire = getPositionIntermediaire(positionActuelle, delta);
        System.out.println("Position pion à capturer : " + positionIntermediaire);
        Pion pionAdverse = damier.getPion(positionIntermediaire);
        if (pionAdverse == null || pionAdverse.getCouleur() == pion.getCouleur()) {
            return false;
        }
        damier.enleverPion(positionActuelle);
        damier.enleverPion(positionIntermediaire);
        damier.ajouterPion(positionSouhaitee, pion);
        historiqueActions.push(new int[]{positionActuelle, positionSouhaitee});
        changerTour();
        return true;
    }

    /**
     * Change le tour du joueur.
     */
    public void changerTour() {
        tour = 1 - tour;
    }

    /**
     * Vérifie si le pion est du joueur dont c'est le tour.
     *
     * @param pion Le pion à vérifier.
     * @return true si c'est le bon joueur, false sinon.
     */
    public boolean estDeTour(Pion pion) {
        if (pion == null) {
            return false;
        }
        return (tour == 0 && pion.getCouleur() == Pion.CouleurPion.blanc) ||
                (tour == 1 && pion.getCouleur() == Pion.CouleurPion.noir);
    }

    /**
     * Vérifie si la partie est terminée.
     *
     * @return true si la partie est terminée, false sinon.
     */
    public boolean estFinDePartie() {
        // Vérifie si un joueur n'a plus de pions
        boolean aucunPionNoir = nbPionsParCouleur(Pion.CouleurPion.noir) == 0;
        boolean aucunPionBlanc = nbPionsParCouleur(Pion.CouleurPion.blanc) == 0;

        // Si un joueur n'a plus de pions, la partie est terminée
        return aucunPionNoir || aucunPionBlanc;
    }

    /**
     * Vérifie si la partie est terminée.
     *
     * @return true si la partie est terminée, false sinon.
     */
    public boolean estFinDePartieNoir() {
        // Vérifie si le joueur noir n'a plus de pions
        return nbPionsParCouleur(Pion.CouleurPion.noir) == 0;
    }

    /**
     * Vérifie si la partie est terminée.
     *
     * @return true si la partie est terminée, false sinon.
     */
    public boolean estFinDePartieBlanc() {
        // Vérifie si le joueur blanc n'a plus de pions
        return nbPionsParCouleur(Pion.CouleurPion.blanc) == 0;
    }

    /**
     * Calcule le nombre de pions d'une couleur donnée sur le damier.
     * Cette méthode parcourt tous les pions du damier et compte ceux qui ont la couleur spécifiée.
     *
     * @param couleur La couleur des pions à compter. Cela peut être une valeur de l'énumération.
     * @return Le nombre de pions de la couleur spécifiée sur le damier.
     */
    public int nbPionsParCouleur(Pion.CouleurPion couleur) {
        int compteur = 0;
        for (int i = 0; i < damier.nbPions(); i++) {
            Pion pion = damier.getPion(i);
            if (pion != null && pion.getCouleur() == couleur) {
                compteur++;
            }
        }
        return compteur;
    }

    /**
     * Promeut les pions en dames lorsqu'ils atteignent les rangées de promotion.
     *
     * @param damier Le damier contenant les pions et dames.
     */
    public void pionDevientDame(Damier damier) {
        for (int i = 1; i <= 50; i++) {
            Pion pion = damier.getPion(i);
            if (pion != null && pion.getCouleur() == Pion.CouleurPion.blanc && i <= 5) {
                damier.enleverPion(i);
                damier.ajouterPion(i, new Dame(pion.getCouleur()));
            }
            if (pion != null && pion.getCouleur() == Pion.CouleurPion.noir && i >= 46) {
                damier.enleverPion(i);
                damier.ajouterPion(i, new Dame(pion.getCouleur()));
            }
        }
    }

    /**
     * Retourne l'historique des déplacements effectués dans la partie.
     *
     * @return Liste des déplacements en tant que chaînes de caractères.
     */
    public Stack<int[]> getHistoriqueActions() {
        return historiqueActions;
    }

    /**
     * Retourne le numéro du joueur dont c'est le tour.
     *
     * @return L'entier représentant le tour du joueur (0 pour joueur 1, 1 pour joueur 2).
     */
    public int getTour() {
        return tour;
    }

    /**
     * Retourne l'instance du damier du jeu.
     *
     * @return Le damier du jeu de dames.
     */
    public Damier getDamier() {
        return damier;
    }

    public void setTour(int tour) {
        this.tour = tour;
    }
}