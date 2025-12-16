<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Contrôleur pour la gestion de l'authentification multi-facteurs (MFA).
 * Permet d'activer, désactiver et vérifier le MFA pour les utilisateurs.
 */

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\MFAService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class MFAController extends Controller
{
    protected $mfaService;

    public function __construct(MFAService $mfaService)
    {
        $this->mfaService = $mfaService;
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/mfa/toggle",
     *     summary="Activer ou désactiver l'authentification à deux facteurs",
     *     tags={"MFA"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"mfa_enabled"},
     *             @OA\Property(property="mfa_enabled", type="boolean", example=true),
     *             @OA\Property(property="password", type="string", example="MyPassword123!", description="Requis uniquement pour désactiver le MFA")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="MFA modifié avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="MFA activé avec succès")
     *         )
     *     )
     * )
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'mfa_enabled' => 'required|boolean',
            'password' => 'required_if:mfa_enabled,false|string'
        ]);

        /** @var User $user */
        $user = Auth::user();
        $mfaEnabled = $request->input('mfa_enabled');

        if ($mfaEnabled) {
            if ($user->mfa_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'MFA est déjà activé'
                ], 400);
            }

            $this->mfaService->enableMFA($user);

            return response()->json([
                'success' => true,
                'message' => 'MFA activé avec succès. Vous recevrez un code par email à chaque connexion.'
            ]);
        }
        else {
            if (!$user->mfa_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'MFA n\'est pas activé'
                ], 400);
            }

            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect'
                ], 401);
            }

            $this->mfaService->disableMFA($user);

            return response()->json([
                'success' => true,
                'message' => 'MFA désactivé avec succès'
            ]);
        }
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/mfa/verify",
     *     summary="Vérifier le code MFA et obtenir le token JWT",
     *     tags={"MFA"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email", "code"},
     *             @OA\Property(property="email", type="string", example="user@example.com"),
     *             @OA\Property(property="code", type="string", example="123456"),
     *             @OA\Property(property="temp_token", type="string", example="temporary_jwt_token")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Code vérifié, token JWT retourné"
     *     )
     * )
     */
    public function verify(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'temp_token' => 'required|string'
        ]);

        try {
            JWTAuth::setToken($request->temp_token);
            $payload = JWTAuth::getPayload();

            if (!$payload->get('is_temp')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token invalide'
                ], 401);
            }

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }

            if (!$this->mfaService->verifyCode($user, $request->code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code invalide ou expiré'
                ], 401);
            }

            JWTAuth::invalidate($request->temp_token);

            $token = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'message' => 'Authentification réussie',
                'data' => [
                    'user' => new UserResource($user->load('disabledNotificationTypes')),
                    'token' => $token
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de vérification'
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/chatappAPI/mfa/resend",
     *     summary="Renvoyer le code MFA",
     *     tags={"MFA"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email", "temp_token"},
     *             @OA\Property(property="email", type="string", example="user@example.com"),
     *             @OA\Property(property="temp_token", type="string", example="temporary_jwt_token")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Code renvoyé avec succès"
     *     )
     * )
     */
    public function resend(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'temp_token' => 'required|string'
        ]);

        try {
            JWTAuth::setToken($request->temp_token);
            $payload = JWTAuth::getPayload();

            if (!$payload->get('is_temp')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token invalide'
                ], 401);
            }

            $user = User::where('email', $request->email)->first();

            if (!$user || !$user->mfa_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé ou MFA non activé'
                ], 404);
            }

            $this->mfaService->sendCode($user, $request->ip());

            return response()->json([
                'success' => true,
                'message' => 'Code renvoyé par email'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du renvoi du code'
            ], 500);
        }
    }
}
