package cstjean.mobile.dames.dames;

import static org.junit.Assert.assertEquals;

import cstjean.mobile.dames.damier.Dame;
import cstjean.mobile.dames.damier.Pion;
import org.junit.Test;

/**
 * Classe de test pour la classe Pion.
 *
 * @author Bradley Fortin & Antoine Davignon
 */
public class TestPion {

    /**
     * Teste la création de pions avec différentes couleurs.
     */
    @Test
    public void testCreer() {
        Pion.CouleurPion blanc = Pion.getCouleurs()[0];
        Pion.CouleurPion noir = Pion.getCouleurs()[1];
        Dame dameBlanche = new Dame(blanc);
        Dame dameNoir = new Dame(noir);
        assertEquals(blanc, dameBlanche.getCouleur());
        assertEquals("d", dameBlanche.getRepresentation(dameBlanche));
        assertEquals(noir, dameNoir.getCouleur());
        assertEquals("D", dameNoir.getRepresentation(dameNoir));
        Pion pion1 = new Pion(blanc);
        Pion pion2 = new Pion(noir);
        Pion pion3 = new Pion();
        assertEquals(blanc, pion1.getCouleur());
        assertEquals(noir, pion2.getCouleur());
        assertEquals(blanc, pion3.getCouleur());
    }
}
