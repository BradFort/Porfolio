package cstjean.mobile.dames.damier;

import java.util.HashMap;

/**
 * Classe représentant un damier de jeu de dames.
 *
 * @author Bradley Fortin & Antoine Davignon
 */
public class Damier {
    /**
     * HashMap pour stocker les pions sur le damier, avec la position comme clé.
     */
    private final HashMap<Integer, Pion> pions;

    /**
     * Constructeur de la classe Damier.
     * Initialise le HashMap pour stocker les pions avec des clés de 1 à 50.
     */
    public Damier() {
        pions = new HashMap<>(50);
    }

    /**
     * Calcule et renvoie le nombre total de pions présents sur le damier.
     *
     * @return Le nombre de pions.
     */
    public int nbPions() {
        return pions.size();
    }

    /**
     * Ajoute un pion à une position spécifique dans le HashMap.
     *
     * @param position La position où ajouter le pion.
     * @param pion     Le pion à ajouter.
     */
    public void ajouterPion(int position, Pion pion) {
        pions.put(position, pion);
    }

    /**
     * Enlève un pion de la position spécifiée dans le HashMap.
     *
     * @param position La position du pion à enlever.
     */
    public void enleverPion(int position) {
        pions.remove(position); // Supprime le pion à la position spécifiée
    }

    /**
     * Initialise le damier avec des pions noirs et blancs selon la configuration
     * traditionnelle d'un jeu de dames. Les pions noirs sont placés sur les quatre
     * premières lignes, et les pions blancs sur les quatre dernières lignes, avec une
     * alternance de positions pour simuler un damier.
     * La méthode assigne des positions de 1 à 50 pour les pions noirs et blancs
     * sur les lignes respectives :
     *      1. Les pions noirs sont placés sur les positions 1 à 20.
     *      2. Les pions blancs sont placés sur les positions 31 à 50.
     *      3. Les positions 21 à 30 restent vides.
     * Cette configuration respecte le principe de placement des pions sur les
     * cases noires d'un damier.
     */

    public void initializer() {
        placerPions(1, Pion.CouleurPion.noir);  // Placer les pions noirs
        placerPions(31, Pion.CouleurPion.blanc); // Placer les pions blancs
    }

    /**
     * Enlève tous les pions du damier en vidant le HashMap.
     */
    public void enleverTousLesPions() {
        pions.clear();
    }

    /**
     * Méthode pour placer les pions sur le damier selon une position de départ et une couleur.
     *
     * @param positionDepart La position de départ pour placer les pions.
     * @param couleur        La couleur des pions à placer (noir ou blanc).
     */
    private void placerPions(int positionDepart, Pion.CouleurPion couleur) {
        int position = positionDepart;
        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 5; j++) {
                Pion pion = new Pion(couleur);
                ajouterPion(position, pion);
                position++;
            }
        }
    }

    /**
     * Récupère le pion situé à une position donnée dans le HashMap.
     *
     * @param position La position du pion à récupérer.
     * @return Le pion à la position spécifiée, ou null s'il n'y a pas de pion.
     */
    public Pion getPion(int position) {
        return pions.get(position);
    }
}
