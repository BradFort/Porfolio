package cstjean.mobile.dames.damier;

/**
 * La classe AfficherDamier gère l'affichage du damier pour le jeu de dames.
 * Elle fournit une méthode pour créer une représentation graphique du damier
 * sous forme de chaîne de caractères, affichant les pions noirs, les cases vides,
 * et les pions blancs sur les lignes correspondantes.
 *
 * <p>Le damier est composé de cases représentant des pions noirs et blancs.
 * Les lignes centrales sont affichées comme des cases vides pour séparer les
 * deux groupes de pions. Chaque ligne contient des séparateurs et l'affichage
 * est ajusté en fonction de la parité de la ligne pour un alignement en damier.</p>
 *
 * @see Damier
 */
public class AfficherDamier {
    /**
     * Méthode pour créer et retourner la représentation graphique du damier
     * sous forme de chaîne de caractères.
     *
     * @param damier Le damier à afficher.
     * @return La chaîne représentant le damier.
     */
    public static String afficher(Damier damier) {
        StringBuilder sb = new StringBuilder();
        int position = 1;

        // Parcours des 4 premières lignes avec les pions noirs
        for (int i = 0; i < 4; i++) {
            position = getPositionGraphique(sb, damier, position, i);
            sb.append('\n');
        }

        // Deux lignes vides
        for (int i = 0; i < 2; i++) {
            sb.append("-".repeat(10));
            sb.append('\n');
        }

        // Parcours des 4 dernières lignes avec les pions blancs
        position = 31;
        for (int i = 0; i < 4; i++) {
            position = getPositionGraphique(sb, damier, position, i);
            if (i < 3) {
                sb.append('\n');
            }
        }

        // Retourne la chaîne finale représentant le damier
        return sb.toString();
    }

    private static int getPositionGraphique(StringBuilder sb, Damier damier, int position, int i) {
        if (i % 2 == 0) {
            for (int j = 0; j < 5; j++) {
                sb.append('-');
                Pion pion = damier.getPion(position);  // Récupérer le pion du damier
                if (pion != null) {
                    sb.append(pion.getRepresentation(pion));  // Passer le pion en paramètre
                } else {
                    sb.append(' ');  // Case vide
                }
                position++;
            }
        } else {
            for (int j = 0; j < 5; j++) {
                Pion pion = damier.getPion(position);  // Récupérer le pion du damier
                if (pion != null) {
                    sb.append(pion.getRepresentation(pion));  // Passer le pion en paramètre
                } else {
                    sb.append(' ');  // Case vide
                }
                sb.append('-');
                position++;
            }
        }
        return position;
    }

}