package cstjean.mobile.dames.damier;

/**
 * Classe représentant un pion dans un jeu de dames.
 *
 * @author Bradley fortin & Antoine Davignon
 */
public class Pion {
    /**
     * La couleur du pion (blanc ou noir).
     * Ce champ est final, donc la couleur ne peut pas être modifiée après
     * l'initialisation du pion.
     */
    private final CouleurPion couleurPion;

    /**
     * Constructeur qui initialise la couleur du pion avec la valeur spécifiée.
     *
     * @param couleur La couleur du pion.
     */
    public Pion(CouleurPion couleur) { // Ligne 10
        this.couleurPion = couleur;
    }

    /**
     * Constructeur par défaut qui initialise la couleur du pion à "blanc".
     */
    public Pion() {
        this.couleurPion = CouleurPion.blanc;
    }

    public static CouleurPion[] getCouleurs() {
        return CouleurPion.values();
    }

    /**
     * Retourne la couleur du pion.
     *
     * @return La couleur du pion.
     */
    public CouleurPion getCouleur() {
        return couleurPion;
    }

    /**
     * Retourne une représentation du pion en fonction de sa couleur et
     * de son type (pion ou dame).
     *
     * @param pion Le pion dont on veut la représentation.
     * @return Une chaîne de caractères représentant le pion ("p" pour pion blanc, "P" pour pion noir,
     *         "d" pour dame blanche, "D" pour dame noire).
     */
    public String getRepresentation(Pion pion) { // Ligne 41

        if (pion.getClass() != Dame.class) {
            if (pion.couleurPion == CouleurPion.blanc) {
                return "p";
            } else {
                return "P";
            }
        } else {
            if (pion.couleurPion == CouleurPion.blanc) {
                return "d";
            } else {
                return "D";
            }
        }
    }

    /**
     * Enumération représentant les couleurs possibles d'un pion.
     */
    public enum CouleurPion { // Ligne 58
        /**
         * Représente la couleur blanche d'un pion.
         */
        blanc,

        /**
         * Représente la couleur noire d'un pion.
         */
        noir
    }
}
