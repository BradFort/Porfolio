<?php

namespace App\Http\Controllers;

use App\Http\Requests\PartieRequest;
use App\Models\Missile;
use App\Models\Partie;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class BattleshipIaController extends Controller
{

    use AuthorizesRequests;

    /**
     * contien les différentes coordonées occupées
     * @var array
     */
    private array $grilleOccupee = [];

    /**
     *
     * permets de commencer la parties
     *
     * @param PartieRequest $request qui permet de valider les données envoyer
     * @return JsonResponse réponse json qui sera envoyer au client pour faire les requêtes futures
     */
    public function startGame(PartieRequest $request): JsonResponse
    {
        // Valider les données entrantes
        $validated = $request->validate([
            'adversaire' => 'required|string',
        ]);


        // Créer la partie
        $partie = Partie::create([
            'adversaire' => $validated['adversaire'],
            'bateaux' => $this->placerBateaux(),  // Appeler la fonction pour placer les bateaux
            'user_id' => auth()->id(),
        ]);


        // Retourner la réponse JSON
        return response()->json([
            'data' => [
                'id' => $partie->id,
                'adversaire' => $partie->adversaire,
                'bateaux' => $partie->bateaux,  // Renvoyer les bateaux dans la réponse
                'created_at' => $partie->created_at,  // Ajouter created_at
                'updated_at' => $partie->updated_at,
            ]
        ], 201);
    }

    /**
     * Place les bateaux sur la grille pour l'ia
     *
     *
     * @return array l'array de tout les bateaux
     */
    private function placerBateaux(): array
    {
        return [
            'porte-avions' => $this->placerBateau('porte-avions'),
            'cuirasse' => $this->placerBateau('cuirasse'),
            'destroyer' => $this->placerBateau('destroyer'),
            'sous-marin' => $this->placerBateau('sous-marin'),
            'patrouilleur' => $this->placerBateau('patrouilleur')
        ];
    }


    /**
     * Place un bateau spécifique sur la grille
     *
     * @param string $type Le type de bateau à placer
     * @return array Les positions du bateau placé
     */
    private function placerBateau(string $type): array
    {
        // Logique pour générer des positions valides pour chaque type de bateau
        // Par exemple, un porte-avions de taille 5
        $taille = $this->getTailleBateau($type);
        return $this->genererPositionsBateau($taille);
    }

    /**
     * Retourne la taille du bateau en fonction de son type
     *
     * @param string $type Le type de bateau
     * @return int La taille du bateau
     */
    private function getTailleBateau(string $type): int
    {
        $typesBateaux = [
            'porte-avions' => 5,
            'cuirasse' => 4,
            'destroyer' => 3,
            'sous-marin' => 3,
            'patrouilleur' => 2,
            // Ajouter les autres types de bateaux ici
        ];

        return $typesBateaux[$type] ?? 0;
    }

    /**
     * Génère des positions aléatoires pour un bateau de taille donnée
     *
     * @param int $taille La taille du bateau
     * @return array Les positions générées
     */
    private function genererPositionsBateau(int $taille): array
    {
        $letters = range('A', 'J');

        do {
            $positions = [];
            $horizontal = rand(0, 1) === 1;

            if ($horizontal) {
                $row = rand(0, 9);
                $startCol = rand(0, 10 - $taille);

                for ($i = 0; $i < $taille; $i++) {
                    $coord = $letters[$startCol + $i] . '-' . ($row + 1);
                    $positions[] = $coord;
                }
            } else {
                $col = rand(0, 9);
                $startRow = rand(0, 10 - $taille);

                for ($i = 0; $i < $taille; $i++) {
                    $coord = $letters[$col] . '-' . ($startRow + $i + 1);
                    $positions[] = $coord;
                }
            }

        } while ($this->chevauchement($positions));

        // Marquer ces positions comme occupées
        foreach ($positions as $pos) {
            $this->grilleOccupee[] = $pos;
        }

        return $positions;
    }

    /**
     * Vérifie si les positions générées chevauchent déjà des positions occupées
     *
     * @param array $positions Les positions à vérifier
     * @return bool True si chevauchement, false sinon
     */
    private function chevauchement(array $positions): bool
    {
        foreach ($positions as $pos) {
            if (in_array($pos, $this->grilleOccupee)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Affiche la liste de tous les missiles
     *
     * @param int $partie L'ID de la partie
     * @return JsonResponse La réponse JSON contenant la liste des missiles
     */
    public function getAllMissiles(int $partie): JsonResponse
    {
        $partie = Partie::find($partie);


        $missilesCount = $partie->missiles()->count();

        return response()->json([
            'data' => $missilesCount,
        ], 200);
    }

    /**
     * Permet à l'IA de jouer un missile
     *
     * @param int $partie L'ID de la partie
     * @return JsonResponse La réponse JSON contenant le missile joué
     * @throws AuthorizationException si l'utilisateur n'est pas autorisé à jouer
     */
    public function aiPlayMissiles(int $partie): JsonResponse
    {
        $partie = Partie::findOrFail($partie);

        // Vérifie si l'utilisateur a le droit de jouer
        $this->authorize('owns', $partie);

        // Vérifie si le dernier coup a coulé un bateau
        $dernierMissile = $partie->missiles()->latest()->first();
        $doRandom = false;
        if ($dernierMissile && $dernierMissile->resultat >= 2 && $dernierMissile->resultat <= 6) {
            $doRandom = true;
        }

        if ($doRandom) {
            $position = $this->tirAleatoire($partie);
        } else {
            $dernierToucher = $partie->missiles()
                ->where('resultat', 1)
                ->latest()
                ->first();

            if ($dernierToucher) {
                $position = $this->choisirCoordonneeAutour($dernierToucher->coordonnee, $partie);
            } else {
                $position = $this->tirAleatoire($partie);
            }
        }


        $missile = Missile::create([
            'coordonnee' => $position,
            'resultat' => null,
            'partie_id' => $partie->id,
        ]);

        return response()->json([
            'data' => [
                'id' => $missile->id,
                'coordonnee' => $missile->coordonnee,
                'resultat' => $missile->resultat,
                'partie_id' => $missile->partie_id,
                'created_at' => $missile->created_at,
            ],
        ], 201);
    }

    /**
     * Met à jour le résultat d'un missile
     *
     * @param int $id L'ID de la partie
     * @param string $coordonnee La coordonnée du missile
     * @param Request $request La requête contenant le résultat
     * @return JsonResponse La réponse JSON contenant le missile mis à jour
     * @throws AuthorizationException si l'utilisateur n'est pas autorisé à mettre à jour le missile
     */
    public function updateMissileResult(int $id, string $coordonnee, Request $request): JsonResponse
    {
        // Valider les données de la requête
        $request->validate([
            'resultat' => 'required|integer|min:0|max:6',
        ]);

        $partie = Partie::findOrFail($id);

        $this->authorize('owns', $partie);

        // Trouver le missile correspondant
        $missile = $partie->missiles()->where('coordonnee', $coordonnee)->firstOrFail();


        // Mettre à jour le résultat du missile
        $resultat = $request->resultat;
        $missile->update(['resultat' => $resultat]);


        // Mettre à jour le résultat en fonction du bateau touché ou coulé
        $missile->update(['resultat' => $resultat]);

        return response()->json([
            'data' => [
                'coordonnee' => $missile->coordonnee,
                'resultat' => $missile->resultat,
                'created_at' => $missile->created_at->toISOString(),
            ],
        ], 200);
    }

    /**
     * Fonction pour obtenir le code du bateau coulé en fonction du type de bateau
     *
     * @param string $type Le type du bateau
     * @return int Le code du bateau coulé
     */
    private function getBateauCouleResult(string $type): int
    {
        return match ($type) {
            'porte-avions' => 2,
            'cuirasse' => 3,
            'destroyer' => 4,
            'sous-marin' => 5,
            'patrouilleur' => 6,
            default => 0,
        };
    }


    /**
     * Choisit une coordonnée autour d'une coordonnée initiale
     *
     * @param string $coordonneeInitiale La coordonnée initiale
     * @param Partie $partie La partie en cours
     * @return string La nouvelle coordonnée choisie
     */
    private function choisirCoordonneeAutour(string $coordonneeInitiale, Partie $partie): string
    {

        $missiles = $partie->missiles()
            ->where('resultat', 1) // Résultat 1 signifie "touché"
            ->orderBy('created_at')
            ->get();

        if ($missiles->count() < 2) {
            return $this->tirAutour($coordonneeInitiale, $partie);
        }

        // Obtenir les deux derniers coups réussis
        $lastTwo = $missiles->take(-2)->values();
        $coord1 = $this->parseCoord($lastTwo[0]->coordonnee);
        $coord2 = $this->parseCoord($lastTwo[1]->coordonnee);

        $horizontal = $coord1['row'] === $coord2['row'];
        $vertical = $coord1['col'] === $coord2['col'];

        if ($horizontal || $vertical) {
            $direction = $horizontal
                ? ['row' => 0, 'col' => $coord2['col'] > $coord1['col'] ? 1 : -1]
                : ['row' => $coord2['row'] > $coord1['row'] ? 1 : -1, 'col' => 0];

            // Continuer dans la même direction
            $current = $coord2;
            while (true) {
                $next = $this->nextCoord($current, $direction);

                // Vérifier si la coordonnée est valide et non tirée
                if ($this->estCoordonneeValideEtNonTiree($next, $partie)) {
                    return $next;
                }

                // Arrêter si le tir précédent n'a pas touché
                $lastMissile = $partie->missiles()->where('coordonnee', $next)->first();
                if ($lastMissile && $lastMissile->resultat === 0) { // 0 signifie "miss"
                    break;
                }

                // Arrêter si on atteint une limite
                if (!$this->inGrille($next)) {
                    break;
                }

                $current = $this->parseCoord($next);
            }

            // Revenir au début et essayer dans l'autre sens
            $current = $coord1;
            $reverseDir = ['row' => -$direction['row'], 'col' => -$direction['col']];
            while (true) {
                $next = $this->nextCoord($current, $reverseDir);

                if ($this->estCoordonneeValideEtNonTiree($next, $partie)) {
                    return $next;
                }

                $lastMissile = $partie->missiles()->where('coordonnee', $next)->first();
                if ($lastMissile && $lastMissile->resultat === 0) {
                    break;
                }

                if (!$this->inGrille($next)) {
                    break;
                }

                $current = $this->parseCoord($next);
            }
        }

        // Si aucune suite logique possible, tirer autour du dernier
        return $this->tirAutour($coordonneeInitiale, $partie);
    }

    /**
     * Vérifie si la coordonnée est dans la grille (A-J et 1-10)
     *
     * @param string $coordonnee La coordonnée à vérifier
     * @return bool True si la coordonnée est valide, false sinon
     */
    private function inGrille(string $coordonnee): bool
    {
        // Split the coordinate into row and column
        [$row, $col] = explode('-', $coordonnee);

        // Check if the row is between A and J and the column is between 1 and 10
        return preg_match('/^[A-J]$/', $row) && $col >= 1 && $col <= 10;
    }

    /**
     * Parse une coordonnée au format "A-1" en un tableau associatif
     *
     * @param string $coord La coordonnée à parser
     * @return array Un tableau associatif contenant la ligne et la colonne
     */
    private function parseCoord(string $coord): array
    {
        [$row, $col] = explode('-', $coord);
        return ['row' => $row, 'col' => (int)$col];
    }

    /**
     * Calcule la prochaine coordonnée en fonction de la direction
     *
     * @param array $coord La coordonnée actuelle
     * @param array $direction La direction à suivre
     * @return string La nouvelle coordonnée
     */
    private function nextCoord(array $coord, array $direction): string
    {
        $newRow = chr(ord($coord['row']) + $direction['row']);
        $newCol = $coord['col'] + $direction['col'];
        return $newRow . '-' . $newCol;
    }

    /**
     * Vérifie si la coordonnée est valide et non déjà tirée
     *
     * @param string $coordonnee La coordonnée à vérifier
     * @param Partie $partie La partie en cours
     * @return bool True si la coordonnée est valide et non tirée, false sinon
     */
    private function estCoordonneeValideEtNonTiree($coordonnee, Partie $partie): bool
    {
        // Valide la coordonnée (A-J et 1-10)
        if (!preg_match('/^[A-J]-(10|[1-9])$/', $coordonnee)) {
            return false;
        }

        return !$partie->missiles()->where('coordonnee', $coordonnee)->exists();
    }

    /**
     * Tire autour d'une coordonnée donnée
     *
     * @param string $coordonnee La coordonnée de départ
     * @param Partie $partie La partie en cours
     * @return string La coordonnée tirée
     */
    private function tirAutour(string $coordonnee, Partie $partie): string
    {
        $directions = [
            ['row' => -1, 'col' => 0], // haut
            ['row' => 1, 'col' => 0],  // bas
            ['row' => 0, 'col' => -1], // gauche
            ['row' => 0, 'col' => 1],  // droite
        ];

        $base = $this->parseCoord($coordonnee);
        shuffle($directions);

        foreach ($directions as $dir) {
            $next = $this->nextCoord($base, $dir);
            if ($this->estCoordonneeValideEtNonTiree($next, $partie)) {
                return $next;
            }
        }

        return $this->tirAleatoire($partie); // fallback
    }


    /**
     * Tire un missile aléatoire
     *
     * @param Partie $partie La partie en cours
     * @return string La coordonnée du missile tiré
     */
    private function tirAleatoire(Partie $partie): string
    {
        $letters = range('A', 'J');

        // Rechercher une coordonnée qui n'a pas encore été utilisée
        do {
            $coord = $letters[array_rand($letters)] . '-' . rand(1, 10);
        } while ($partie->missiles()->where('coordonnee', $coord)->exists());

        return $coord;
    }

    /**
     * Supprime une partie
     *
     * @param int $id L'ID de la partie à supprimer
     * @return JsonResponse La réponse JSON indiquant le succès de la suppression
     * @throws AuthorizationException  si le utilisateur n'est pas autorisé à supprimer la partie
     */
    public function deleteGame(int $id): JsonResponse
    {
        $partie = Partie::findOrFail($id);

        $this->authorize('owns', $partie);

        $partie->delete();
        return response()->json(['data' =>
            [
                'id' => $partie->id,
                'adversaire' => $partie->adversaire,
                'bateaux' => $partie->bateaux,
                'created_at' => $partie->created_at,
            ], 200]);
    }
}
