package cstjean.mobile.dames;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.GridLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import cstjean.mobile.dames.damier.Dame;
import cstjean.mobile.dames.damier.JeuDames;
import cstjean.mobile.dames.damier.Pion;
import java.util.ArrayList;
import java.util.List;

/**
 * MainActivity est l'activité principale de l'application, où l'on gère l'interface utilisateur du jeu de dames.
 */
public class MainActivity extends AppCompatActivity {

    /**
     * Objet représentant l'état du jeu de dames.
     * Il contient la logique du jeu, telle que les règles et l'état des pièces.
     */
    private final JeuDames jeu = new JeuDames();

    /**
     * Référence à l'ImageView représentant le dernier pion sélectionné.
     * Cela permet de mettre à jour l'interface utilisateur en fonction du pion sélectionné.
     */
    private ImageView dernierPionSelectionne = null;

    /**
     * Position de la case sélectionnée pour un pion dans le jeu.
     * -1 signifie qu'aucun pion n'est actuellement sélectionné.
     */
    private int positionPionSelectionne = -1;

    /**
     * Liste contenant les indices des cases qui sont surbrillantes.
     * Les cases surbrillantes sont celles qui peuvent être sélectionnées ou sur lesquelles un pion peut se déplacer.
     */
    private final List<Integer> casesSurbrillantes = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        String player1Name = getIntent().getStringExtra("player1Name");
        String player2Name = getIntent().getStringExtra("player2Name");
        String currentPlayer = (jeu.getTour() == 0) ? player1Name : player2Name;
        Toast.makeText(this, "C'est le tour de " + currentPlayer, Toast.LENGTH_SHORT).show();
        GridLayout gridLayout = findViewById(R.id.myGridLayout);
        int boardSize = 10;
        gridLayout.setRowCount(boardSize);
        gridLayout.setColumnCount(boardSize);
        for (int row = 0; row < boardSize; row++) {
            for (int col = 0; col < boardSize; col++) {
                FrameLayout caseLayout = new FrameLayout(this);
                if ((row + col) % 2 == 0) {
                    caseLayout.setBackgroundColor(getColor(R.color.white));
                } else {
                    caseLayout.setBackgroundColor(getColor(R.color.black));
                }
                int positionManoury = calculerPositionManoury(row, col);
                int finalRow = row;
                int finalCol = col;
                caseLayout.setOnClickListener(v -> {
                    mettreEnSurbrillanceDeplacementsValides(positionManoury);
                    if (positionManoury != -1) {
                        Log.d("CASE_CLIQUE", "Case cliquée: Position Manoury = " + positionManoury);
                        if (dernierPionSelectionne != null) {
                            dernierPionSelectionne.setColorFilter(null);
                        }
                        if (dernierPionSelectionne != null && positionPionSelectionne != -1) {
                            Log.d("DEPLACEMENT", "Passer de " + positionPionSelectionne + " à " + positionManoury);
                            int delta = positionManoury - positionPionSelectionne;
                            int positionCapturee = jeu.getPositionIntermediaire(positionPionSelectionne, delta);
                            Pion pionCapture = jeu.getDamier().getPion(positionCapturee);
                            int positionCaptureePrecedente =
                                    jeu.getPositionIntermediaire(positionPionSelectionne, delta);
                            int couleurPionCapture = pionCapture != null ? pionCapture.getCouleur().ordinal() : -1;
                            if (jeu.capturerPion(positionPionSelectionne, positionManoury)) {
                                jeu.deplacerPion(positionPionSelectionne, positionManoury);
                                jeu.getHistoriqueActions()
                                        // Je peux pas l'indenter pour réduire la ligne car sinon
                                        // j'ai une erreur de mauvaise indentation.
                                        .push(new int[]{positionPionSelectionne, positionManoury, positionCaptureePrecedente, couleurPionCapture});
                                enleverImagePionCapture(positionCapturee);
                                jeu.getDamier().enleverPion(positionCapturee);
                                mettreAjourVue(positionPionSelectionne, positionManoury);
                            } else if (jeu.deplacerPion(positionPionSelectionne, positionManoury)) {
                                jeu.getHistoriqueActions()
                                        .push(new int[]{positionPionSelectionne, positionManoury, -1, -1});
                                mettreAjourVue(positionPionSelectionne, positionManoury);
                            } else {
                                Log.d("DEPLACEMENT", "Déplacement invalide.");
                            }
                            dernierPionSelectionne.setColorFilter(null);
                            dernierPionSelectionne = null;
                            positionPionSelectionne = -1;
                        } else if (caseContientPion(finalRow, finalCol)) {
                            Pion pionSelectionne = jeu.getDamier().getPion(positionManoury);
                            if (pionSelectionne != null) {
                                ImageView pionView = (ImageView) caseLayout.getChildAt(0);
                                if (jeu.estDeTour(pionSelectionne)) {
                                    pionView.setColorFilter(getColor(R.color.selectionColor));
                                    dernierPionSelectionne = pionView;
                                    positionPionSelectionne = positionManoury;
                                } else {
                                    Log.d("CASE_CLIQUE", "C'est pas votre tour !");
                                }
                            }
                        }
                    } else {
                        Log.d("CASE_CLIQUE", "Case blanche cliquée, non valide.");
                        if (dernierPionSelectionne != null) {
                            dernierPionSelectionne.setColorFilter(null);
                            dernierPionSelectionne = null;
                        }
                    }
                });
                Pion pion = (positionManoury != -1) ? jeu.getDamier().getPion(positionManoury) : null;
                if (pion != null) {
                    ImageView pionView = new ImageView(this);
                    pionView.setImageResource(pion.getCouleur() == Pion.CouleurPion.noir ?
                            R.drawable.pion_noir : R.drawable.pion_blanc);
                    FrameLayout.LayoutParams params =
                            new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,
                                    FrameLayout.LayoutParams.MATCH_PARENT);
                    pionView.setLayoutParams(params);
                    caseLayout.addView(pionView);
                }
                GridLayout.LayoutParams params = new GridLayout.LayoutParams();
                params.width = 100;
                params.height = 100;
                caseLayout.setLayoutParams(params);
                gridLayout.addView(caseLayout);
            }
        }
        LinearLayout linearLayout = findViewById(R.id.myLinearLayout);
        Button boutonAnnuler = new Button(this);
        boutonAnnuler.setText(R.string.annuler);
        boutonAnnuler.setOnClickListener(v -> {
            Toast.makeText(MainActivity.this, "Action annule !", Toast.LENGTH_SHORT).show();
            annulerDerniereAction();
        });
        linearLayout.addView(boutonAnnuler);
    }

    private void afficherTourActuel() {
        String player1Name = getIntent().getStringExtra("player1Name");
        String player2Name = getIntent().getStringExtra("player2Name");
        String currentPlayer = (jeu.getTour() == 0) ? player1Name : player2Name;
        Toast.makeText(this, "C'est le tour de " + currentPlayer, Toast.LENGTH_SHORT).show();
    }

    private int calculerPositionManoury(int row, int col) {
        if ((row + col) % 2 != 0) {
            return (row * (10 / 2)) + (col / 2) + 1;
        }
        return -1;
    }

    private boolean caseContientPion(int row, int col) {
        int positionManoury = calculerPositionManoury(row, col);
        Pion pion = (positionManoury != -1) ? jeu.getDamier().getPion(positionManoury) : null;
        return pion != null;
    }

    private void mettreAjourVue(int positionPionSelectionne, int positionManoury) {
        GridLayout gridLayout = findViewById(R.id.myGridLayout);
        FrameLayout caseOrigine = (FrameLayout) gridLayout.getChildAt(positionToIndex(positionPionSelectionne));
        if (caseOrigine != null && caseOrigine.getChildCount() > 0) {
            caseOrigine.removeAllViews();
        }
        FrameLayout caseDestination = (FrameLayout) gridLayout.getChildAt(positionToIndex(positionManoury));
        if (caseDestination != null) {
            Pion pion = jeu.getDamier().getPion(positionManoury);
            if (pion != null) {
                ImageView pionView = getImageView(pion);
                caseDestination.addView(pionView);
            }
        }
        afficherTourActuel();
        verifierVictoire();
    }

    private ImageView getImageView(Pion pion) {
        ImageView pionView = new ImageView(this);
        if (pion instanceof Dame) {
            pionView.setImageResource(pion.getCouleur() == Pion.CouleurPion.noir ?
                    R.drawable.reine_joueur_noir : R.drawable.reine_joueur_blanc);
        } else {
            pionView.setImageResource(pion.getCouleur() == Pion.CouleurPion.noir ?
                    R.drawable.pion_noir : R.drawable.pion_blanc);
        }
        FrameLayout.LayoutParams params =
                new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT);
        pionView.setLayoutParams(params);
        return pionView;
    }

    private int positionToIndex(int positionManoury) {
        int row = (positionManoury - 1) / (10 / 2);
        int col = ((positionManoury - 1) % (10 / 2)) * 2 + (row % 2 == 0 ? 1 : 0);
        return row * 10 + col;
    }

    /**
     * Supprime l'image d'un pion à une position donnée.
     *
     * @param positionCapturee La position Manoury du pion capturé.
     */
    private void enleverImagePionCapture(int positionCapturee) {
        GridLayout gridLayout = findViewById(R.id.myGridLayout);
        int index = positionToIndex(positionCapturee);
        FrameLayout caseCapturee = (FrameLayout) gridLayout.getChildAt(index);
        if (caseCapturee != null && caseCapturee.getChildCount() > 0) {
            caseCapturee.removeAllViews();
        }
    }

    private void annulerDerniereAction() {
        if (jeu.getHistoriqueActions().isEmpty()) {
            Log.d("ANNULER_ACTION", "Aucune action à annuler.");
            return;
        }
        int[] derniereAction = jeu.getHistoriqueActions().pop();
        int positionInitiale = derniereAction[0];
        int positionFinale = derniereAction[1];
        if (derniereAction.length < 3) {
            Pion pionDeplace = jeu.getDamier().getPion(positionFinale);
            if (pionDeplace != null) {
                jeu.getDamier().enleverPion(positionFinale);
                if (pionDeplace instanceof Dame) {
                    pionDeplace = new Pion(pionDeplace.getCouleur());
                }
                jeu.getDamier().ajouterPion(positionInitiale, pionDeplace);
            }
        } else {
            int positionCapturee = derniereAction[2];
            int couleurPionCapture = derniereAction[3];
            Pion pionDeplace = jeu.getDamier().getPion(positionFinale);
            if (pionDeplace != null) {
                jeu.getDamier().enleverPion(positionFinale);
                if (pionDeplace instanceof Dame) {
                    pionDeplace = new Pion(pionDeplace.getCouleur());
                }
                jeu.getDamier().ajouterPion(positionInitiale, pionDeplace);
            }
            if (positionCapturee != -1 && couleurPionCapture != -1) {
                Pion pionCapture = new Pion(Pion.CouleurPion.values()[couleurPionCapture]);
                jeu.getDamier().ajouterPion(positionCapturee, pionCapture);
                remettreImagePion(positionCapturee, couleurPionCapture);
            }
        }
        jeu.setTour(jeu.getTour() == 1 ? 0 : 1);
        afficherTourActuel();
        jeu.pionDevientDame(jeu.getDamier());
        mettreAjourVue(positionFinale, positionInitiale);
        verifierVictoire();
    }

    /**
     * Cette méthode met en surbrillance les cases sur lesquelles un pion (ou une dame) peut se déplacer.
     * Elle parcourt toutes les cases du plateau et colore en vert celles où un mouvement est valide
     * pour le pion sélectionné.
     *
     * @param positionPion La position du pion sélectionné sur le damier.
     */
    public void mettreEnSurbrillanceDeplacementsValides(int positionPion) {
        GridLayout gridLayout = findViewById(R.id.myGridLayout);
        reinitialiserCouleursCases();
        Pion pion = jeu.getDamier().getPion(positionPion);
        if (pion instanceof Dame) {
            for (int i = 0; i < gridLayout.getChildCount(); i++) {
                View caseView = gridLayout.getChildAt(i);
                int row = i / 10;
                int col = i % 10;
                int positionCase = calculerPositionManoury(row, col);
                if (positionCase != -1 && jeu.deplacementValideDame(positionPion, positionCase)) {
                    caseView.setBackgroundColor(Color.GREEN);
                    casesSurbrillantes.add(i);
                }
            }
        } else {
            for (int i = 0; i < gridLayout.getChildCount(); i++) {
                View caseView = gridLayout.getChildAt(i);
                int row = i / 10;
                int col = i % 10;
                int positionCase = calculerPositionManoury(row, col);
                if (positionCase != -1 && jeu.deplacementValide(positionPion, positionCase)) {
                    caseView.setBackgroundColor(Color.GREEN);
                    casesSurbrillantes.add(i);
                }
            }
        }
    }

    private void verifierVictoire() {
        if (jeu.estFinDePartieBlanc()) {
            afficherMessageVictoire("Le joueur blanc a gagné!");
        } else if (jeu.estFinDePartieNoir()) {
            afficherMessageVictoire("Le joueur noir a gagné!");
        }
    }

    private void afficherMessageVictoire(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        new android.os.Handler().postDelayed(() -> {
            Intent intent = new Intent(MainActivity.this, PlayerNamesActivity.class);
            startActivity(intent);
            finish();
        }, 2000);
    }

    /**
     * Cette méthode réinitialise la couleur de fond de toutes les cases qui ont été surbrillantes.
     * Elle restaure la couleur des cases à leur état d'origine (noir dans ce cas) et vide la liste
     * des cases surbrillantes.
     */
    public void reinitialiserCouleursCases() {
        GridLayout gridLayout = findViewById(R.id.myGridLayout);
        for (int index : casesSurbrillantes) {
            View caseView = gridLayout.getChildAt(index);
            caseView.setBackgroundColor(getColor(R.color.black));
        }
        casesSurbrillantes.clear();
    }

    private void remettreImagePion(int positionManoury, int couleurPionCapture) {
        GridLayout gridLayout = findViewById(R.id.myGridLayout);
        FrameLayout caseCapturee = (FrameLayout) gridLayout.getChildAt(positionToIndex(positionManoury));
        if (caseCapturee != null) {
            ImageView pionView = new ImageView(this);
            pionView.setImageResource(couleurPionCapture == 1 ? R.drawable.pion_noir : R.drawable.pion_blanc);
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
            pionView.setLayoutParams(params);
            caseCapturee.addView(pionView);
        }
    }
}