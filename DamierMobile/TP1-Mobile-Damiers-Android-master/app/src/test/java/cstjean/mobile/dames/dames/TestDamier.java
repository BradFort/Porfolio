package cstjean.mobile.dames.dames;

import static org.junit.Assert.assertEquals;

import cstjean.mobile.dames.damier.AfficherDamier;
import cstjean.mobile.dames.damier.Damier;
import cstjean.mobile.dames.damier.Pion;
import org.junit.Before;
import org.junit.Test;

/**
 * Classe de test pour la classe Damier.
 *
 * @author Bradley Fortin & Antoine Davignon
 */
public class TestDamier {

    /**
     * Instance de la classe Damier représentant l'état du plateau de jeu de dames.
     * Cette variable est utilisée pour manipuler et vérifier l'état du damier dans les tests.
     */
    private Damier damier;

    /**
     * Méthode d'initialisation appelée avant chaque test.
     * Elle permet de créer une nouvelle instance du Damier afin que chaque test parte d'un état
     * propre du plateau de jeu.
     */
    @Before
    public void setUp() {
        damier = new Damier();
    }

    /**
     * Teste les fonctionnalités de la classe Damier.
     */
    @Test
    public void testDamier() {
        // Création de deux pions (un par défaut et un noir)
        Pion pion1 = new Pion();
        Pion pion2 = new Pion(Pion.getCouleurs()[1]);

        // Initialisation du damier
        damier.ajouterPion(1, pion1);
        assertEquals(1, damier.nbPions());

        // Ajout d'un autre pion à la position 38
        damier.ajouterPion(38, pion2);
        assertEquals(2, damier.nbPions());

        // Vérification des couleurs des pions
        assertEquals(pion1, damier.getPion(1));
        assertEquals(Pion.getCouleurs()[0], damier.getPion(1).getCouleur());
        assertEquals(Pion.getCouleurs()[1], damier.getPion(38).getCouleur());

        damier.initializer();

        assertEquals("-P-P-P-P-P\n" +
                "P-P-P-P-P-\n" +
                "-P-P-P-P-P\n" +
                "P-P-P-P-P-\n" +
                "----------\n" +
                "----------\n" +
                "-p-p-p-p-p\n" +
                "p-p-p-p-p-\n" +
                "-p-p-p-p-p\n" +
                "p-p-p-p-p-", AfficherDamier.afficher(damier));

        Damier damierInitial = new Damier();

        damierInitial.initializer();

        assertEquals(40, damierInitial.nbPions());
    }
}
