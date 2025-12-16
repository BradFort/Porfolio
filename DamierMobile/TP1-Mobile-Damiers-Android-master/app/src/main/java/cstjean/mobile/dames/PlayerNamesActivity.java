package cstjean.mobile.dames;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.Button;
import android.widget.EditText;
import androidx.appcompat.app.AppCompatActivity;

/**
 * Activité permettant à l'utilisateur de saisir les noms des joueurs avant de commencer une partie.
 * Cette activité contient des champs de texte pour entrer les noms des joueurs 1 et 2,
 * ainsi qu'un bouton pour démarrer le jeu une fois les noms saisis.
 */
public class PlayerNamesActivity extends AppCompatActivity {

    /**
     * Champ de texte pour saisir le nom du joueur 1.
     */
    private EditText player1NameEditText;

    /**
     * Champ de texte pour saisir le nom du joueur 2.
     */
    private EditText player2NameEditText;

    /**
     * Bouton pour démarrer le jeu une fois que les noms des joueurs ont été saisis.
     */
    private Button startGameButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_player_names);

        player1NameEditText = findViewById(R.id.player1Name);
        player2NameEditText = findViewById(R.id.player2Name);
        startGameButton = findViewById(R.id.startGameButton);

        startGameButton.setEnabled(false);

        TextWatcher nameWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence charSequence, int start, int before, int count) {
            }

            @Override
            public void afterTextChanged(Editable editable) {
                String player1Name = player1NameEditText.getText().toString();
                String player2Name = player2NameEditText.getText().toString();

                startGameButton.setEnabled(!player1Name.isEmpty() && !player2Name.isEmpty());
            }
        };

        player1NameEditText.addTextChangedListener(nameWatcher);
        player2NameEditText.addTextChangedListener(nameWatcher);

        startGameButton.setOnClickListener(v -> {
            String player1Name = player1NameEditText.getText().toString();
            String player2Name = player2NameEditText.getText().toString();

            Intent intent = new Intent(PlayerNamesActivity.this, MainActivity.class);
            intent.putExtra("player1Name", player1Name);
            intent.putExtra("player2Name", player2Name);
            startActivity(intent);
        });

    }
}
