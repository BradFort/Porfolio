package cstjean.mobile.dames.dames;

import cstjean.mobile.dames.damier.Dame;
import cstjean.mobile.dames.damier.JeuDames;
import cstjean.mobile.dames.damier.Pion;
import junit.framework.TestCase;

/**
 * Classe de tests unitaires pour la classe JeuDames.
 * Contient des méthodes pour tester diverses fonctionnalités du jeu de dames,
 * notamment le changement de joueur, la conversion de pions en dames,
 * les déplacements et captures de pions et de dames, et les conditions de fin de partie.
 *
 * <p>Ces tests valident la logique de jeu en vérifiant les comportements attendus
 * pour chaque action de jeu, garantissant que le jeu respecte les règles des dames.</p>
 *
 * @see JeuDames
 */
public class TestJeuDame extends TestCase {

    /**
     * Teste la fonctionnalité de changement de joueur.
     * Vérifie que l'indicateur de tour change correctement entre 0 et 1
     * après chaque appel à changerTour().
     */
    public void testChangementJoueur() {
        JeuDames jeu1 = new JeuDames();
        assertEquals(0, jeu1.getTour());
        jeu1.changerTour();
        assertEquals(1, jeu1.getTour());

    }

    /**
     * Teste si la méthode estDeTour() fonctionne correctement pour déterminer
     * si un pion est de tour pour un joueur donné.
     * Vérifie que les pions blancs jouent au tour zéro et les pions noirs au tour 1.
     */
    public void testEstDeTour() {
        JeuDames jeu = new JeuDames();
        Pion pionBlanc = new Pion(Pion.CouleurPion.blanc);
        Pion pionNoir = new Pion(Pion.CouleurPion.noir);

        // Tour 0 (Joueur blanc)
        assertTrue(jeu.estDeTour(pionBlanc));
        assertFalse(jeu.estDeTour(pionNoir));

        // Changement de tour à 1 (Joueur noir)
        jeu.changerTour();
        assertTrue(jeu.estDeTour(pionNoir));
        assertFalse(jeu.estDeTour(pionBlanc));
    }

    /**
     * Teste la fonctionnalité de conversion d'un pion en dame.
     * Ajoute des pions aux positions où ils devraient être convertis en dames,
     * puis vérifie que les pions à ces positions sont bien des instances de Dame.
     */
    public void testChangementPionEnDame() {
        JeuDames jeu2 = new JeuDames();
        Pion pionNoir = new Pion(Pion.CouleurPion.noir);
        Pion pionBlanc = new Pion(Pion.CouleurPion.blanc);

        // Ajout de pions aux positions 1 (blanc) et 50 (noir)
        jeu2.getDamier().ajouterPion(1, pionBlanc);  // Position où le pion blanc doit devenir dame
        jeu2.getDamier().ajouterPion(50, pionNoir); // Position où le pion noir doit devenir dame

        jeu2.pionDevientDame(jeu2.getDamier());   // Vérifie la position 1
        assertTrue(jeu2.getDamier().getPion(1) instanceof Dame);  // Doit être une Dame blanche
        assertTrue(jeu2.getDamier().getPion(50) instanceof Dame); // Doit être une Dame noire
    }

    /**
     * Teste le déplacement de pions blancs et noirs sur le damier.
     * Vérifie que chaque pion se déplace correctement vers la position cible
     * et que la position initiale devient vide après le déplacement.
     */
    public void testJouerCoupAvecPions() {
        JeuDames jeu = new JeuDames();

        // Vérifier que les pions sont bien présents au début
        assertNotNull(jeu.getDamier().getPion(33)); // Pion blanc
        assertNotNull(jeu.getDamier().getPion(34)); // Pion blanc
        assertNotNull(jeu.getDamier().getPion(18)); // Pion noir
        assertNotNull(jeu.getDamier().getPion(20)); // Pion noir

        // Déplacement du premier pion blanc
        int positionDepartBlanc1 = 33; // Position d'un pion blanc
        int positionArriveeBlanc1 = 28; // Position valide pour déplacer le pion blanc (vers la gauche)

        System.out.println("Déplacement du premier pion blanc de " + positionDepartBlanc1 + " à " +
                positionArriveeBlanc1 + ":");
        boolean deplacementBlanc1 = jeu.deplacerPion(positionDepartBlanc1, positionArriveeBlanc1);
        System.out.println("Résultat du déplacement: " + deplacementBlanc1);
        assertTrue(deplacementBlanc1);
        assertEquals(Pion.CouleurPion.blanc, jeu.getDamier().getPion(positionArriveeBlanc1).getCouleur());
        assertNull(jeu.getDamier().getPion(positionDepartBlanc1)); // Pion doit être retiré de la position de départ

        // Déplacement du premier pion noir
        int positionDepartNoir1 = 18; // Position d'un pion noir
        int positionArriveeNoir1 = 22; // Position valide pour déplacer le pion noir (vers la droite)

        System.out.println("Déplacement du premier pion noir de " + positionDepartNoir1 + " à " +
                positionArriveeNoir1 + ":");
        boolean deplacementNoir1 = jeu.deplacerPion(positionDepartNoir1, positionArriveeNoir1);
        System.out.println("Résultat du déplacement: " + deplacementNoir1);
        assertTrue(deplacementNoir1);
        assertEquals(Pion.CouleurPion.noir, jeu.getDamier().getPion(positionArriveeNoir1).getCouleur());
        assertNull(jeu.getDamier().getPion(positionDepartNoir1)); // Pion doit être retiré de la position de départ

        // Déplacement du deuxième pion blanc
        int positionDepartBlanc2 = 34; // Position d'un autre pion blanc
        int positionArriveeBlanc2 = 30; // Position valide pour déplacer le pion blanc (vers la gauche)

        System.out.println("Déplacement du deuxième pion blanc de " + positionDepartBlanc2 + " à " +
                positionArriveeBlanc2 + ":");
        boolean deplacementBlanc2 = jeu.deplacerPion(positionDepartBlanc2, positionArriveeBlanc2);
        System.out.println("Résultat du déplacement: " + deplacementBlanc2);
        assertTrue(deplacementBlanc2);
        assertEquals(Pion.CouleurPion.blanc, jeu.getDamier().getPion(positionArriveeBlanc2).getCouleur());
        assertNull(jeu.getDamier().getPion(positionDepartBlanc2)); // Pion doit être retiré de la position de départ

        // Déplacement du deuxième pion noir
        int positionDepartNoir2 = 20; // Position d'un autre pion noir
        int positionArriveeNoir2 = 25; // Position valide pour déplacer le pion noir (vers la droite)

        System.out.println("Déplacement du deuxième pion noir de " + positionDepartNoir2 + " à " +
                positionArriveeNoir2 + ":");
        boolean deplacementNoir2 = jeu.deplacerPion(positionDepartNoir2, positionArriveeNoir2);
        System.out.println("Résultat du déplacement: " + deplacementNoir2);
        assertTrue(deplacementNoir2);
        assertEquals(Pion.CouleurPion.noir, jeu.getDamier().getPion(positionArriveeNoir2).getCouleur());
        assertNull(jeu.getDamier().getPion(positionDepartNoir2)); // Pion doit être retiré de la position de départ
    }

    /**
     * Teste la capture d'un pion noir par un pion blanc.
     * Vérifie que la capture est réussie, que le pion blanc
     * occupe la nouvelle position et que le pion noir capturé est supprimé.
     */
    public void testCapturePionBlancSurNoir() {
        JeuDames jeu = new JeuDames();
        Pion pionBlanc = new Pion(Pion.CouleurPion.blanc);
        Pion pionNoir = new Pion(Pion.CouleurPion.noir);

        // Placer un pion blanc en position 22 et un pion noir en position 18
        jeu.getDamier().ajouterPion(22, pionBlanc);
        jeu.getDamier().ajouterPion(18, pionNoir);

        // Capture du pion noir par le pion blanc (22 → 13)
        boolean capture = jeu.capturerPion(22, 13);
        assertTrue(capture);
        assertEquals(Pion.CouleurPion.blanc, jeu.getDamier().getPion(13).getCouleur());
        assertNull(jeu.getDamier().getPion(22)); // Pion blanc déplacé
        assertNull(jeu.getDamier().getPion(18)); // Pion noir capturé
    }

    /**
     * Teste la capture d'un pion blanc par un pion noir.
     * Vérifie que la capture est réussie, que le pion noir
     * occupe la nouvelle position et que le pion blanc capturé est supprimé.
     */
    public void testCapturePionNoirSurBlanc() {
        JeuDames jeu = new JeuDames();
        Pion pionBlanc = new Pion(Pion.CouleurPion.blanc);
        Pion pionNoir = new Pion(Pion.CouleurPion.noir);
        jeu.getDamier().enleverTousLesPions();
        // Placer un pion noir en position 9 et un pion blanc en position 13
        jeu.getDamier().ajouterPion(9, pionNoir);
        jeu.getDamier().ajouterPion(13, pionBlanc);

        // Capture du pion blanc par le pion noir (9 → 18)
        jeu.changerTour(); // Tour du joueur noir
        boolean capture = jeu.capturerPion(9, 18);
        assertTrue(capture);
        assertEquals(Pion.CouleurPion.noir, jeu.getDamier().getPion(18).getCouleur());
        assertNull(jeu.getDamier().getPion(9)); // Pion noir déplacé
        assertNull(jeu.getDamier().getPion(13)); // Pion blanc capturé
    }

    /**
     * Teste le déplacement d'une dame blanche sur le damier.
     * Vérifie que la dame blanche se déplace correctement vers la position cible
     * et que la position initiale devient vide après le déplacement.
     */
    public void testDeplacerDameBlanche() {
        JeuDames jeu = new JeuDames();
        jeu.getDamier().enleverTousLesPions();
        Dame dameBlanche = new Dame(Pion.CouleurPion.blanc);

        // Ajouter une dame blanche à la position 14
        jeu.getDamier().ajouterPion(17, dameBlanche);

        // Test déplacement valide de la position 14 à la position 28
        int positionArrivee = 6;
        System.out.println("Déplacement de la dame blanche de 14 à " + positionArrivee);
        boolean deplacement = jeu.deplacerPion(17, positionArrivee);

        // Vérifier que le déplacement est réussi
        assertTrue(deplacement); // Déplacement valide
        assertEquals(Pion.CouleurPion.blanc, jeu.getDamier().getPion(positionArrivee).getCouleur());
        assertNull(jeu.getDamier().getPion(17)); // Vérifier que la case de départ est vide

    }

    /**
     * Teste la capture d'un pion intermédiaire par une dame.
     * Ce test simule un mouvement où une dame capture un pion en sautant par-dessus lui.
     * Il vérifie que le déplacement de la dame est valide, que le pion intermédiaire est capturé,
     * et que la dame arrive à la position correcte après le déplacement.
     */
    public void testCapturePionIntermediaireParDame() {
        // Initialisation du jeu
        JeuDames jeu = new JeuDames();
        Dame dameBlanche = new Dame(Pion.CouleurPion.blanc);
        Pion pionNoir = new Pion(Pion.CouleurPion.noir);
        jeu.getDamier().enleverTousLesPions();

        // Placer une dame blanche en position 22 et un pion noir en position 17
        jeu.getDamier().ajouterPion(22, dameBlanche);
        jeu.getDamier().ajouterPion(17, pionNoir);

        // Position de destination pour la dame blanche (position 11)
        int positionArrivee = 11;
        System.out.println("Déplacement de la dame blanche de 22 à " + positionArrivee);

        // Effectuer le déplacement et vérifier qu'il est valide
        boolean deplacement = jeu.deplacerPion(22, positionArrivee);
        assertTrue(deplacement); // Le déplacement doit être valide

        // Vérifier que la dame blanche est bien en position 11
        assertEquals(Pion.CouleurPion.blanc, jeu.getDamier().getPion(positionArrivee).getCouleur());

        // Vérifier que la case de départ est maintenant vide
        assertNull(jeu.getDamier().getPion(22));

        // Vérifier que le pion noir en position 17 a été capturé
        assertNull(jeu.getDamier().getPion(17));

        System.out.println("Test de capture par dame réussi !");
    }

    /**
     * Teste la condition de fin de partie.
     * Le test est incomplet et ne vérifie pas encore les conditions spécifiques
     * qui détermineraient la fin d'une partie dans JeuDames.
     */
    public void testFinPartie() {
        JeuDames jeu4 = new JeuDames();
        jeu4.getDamier().enleverTousLesPions();

        boolean fin = jeu4.estFinDePartie();
        assertTrue(fin); // Tous les pions sont enlevés, donc la partie est terminée
    }
}
