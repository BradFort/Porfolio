package cstjean.mobile.dames;

import static androidx.test.espresso.Espresso.closeSoftKeyboard;
import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;
import static org.hamcrest.Matchers.not;

import androidx.test.espresso.action.ViewActions;
import androidx.test.espresso.matcher.ViewMatchers;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Teste l'interaction avec l'interface utilisateur, en s'assurant que l'utilisateur peut
 * entrer un nom de joueur et que le texte est bien affiché dans l'interface.
 * Ce test simule la saisie d'un nom dans un champ de texte et vérifie la mise à jour de l'UI.
 */
@RunWith(AndroidJUnit4.class)
public class PlayerNamesActivityTest {

    /**
     * Règle pour lancer et contrôler l'activité de test {@link PlayerNamesActivity}.
     * Utilise {@link ActivityScenarioRule} pour fournir un contrôle direct
     * sur l'activité à tester dans le cadre du test d'UI.
     */
    @Rule
    public ActivityScenarioRule<PlayerNamesActivity> activityRule =
            new ActivityScenarioRule<>(PlayerNamesActivity.class);

    @Test
    public void testFieldsAndButtonEnabled() {
        final String texte1 = "Bibiche";
        final String texte2 = "Michamel";
        onView(withId(R.id.startGameButton)).check(matches(not(ViewMatchers.isEnabled())));
        onView(withId(R.id.player1Name)).perform(ViewActions.typeText("Bibiche"));
        closeSoftKeyboard();
        onView(withId(R.id.player1Name)).check(matches(withText(texte1)));
        onView(withId(R.id.startGameButton)).check(matches(not(ViewMatchers.isEnabled())));
        onView(withId(R.id.player2Name)).perform(ViewActions.typeText("Michamel"));
        closeSoftKeyboard();
        onView(withId(R.id.player2Name)).check(matches(withText(texte2)));
        onView(withId(R.id.startGameButton)).check(matches(ViewMatchers.isEnabled()));
    }
}
