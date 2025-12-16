<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Service pour la gestion de l'authentification multi-facteurs (MFA).
 * Permet de générer, envoyer, vérifier et invalider les codes MFA pour les utilisateurs.
 */

namespace App\Services;

use App\Models\MFACode;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Class MFAService
 * Service pour la gestion de l'authentification multi-facteurs.
 */
class MFAService
{
    protected EmailValidationService $emailValidationService;
    protected BrevoApiService $brevoApiService;

    /**
     * Constructeur du service MFA.
     * @param EmailValidationService $emailValidationService Service de validation email
     * @param BrevoApiService $brevoApiService Service d'envoi d'email
     */
    public function __construct(
        EmailValidationService $emailValidationService,
        BrevoApiService $brevoApiService
    ) {
        $this->emailValidationService = $emailValidationService;
        $this->brevoApiService = $brevoApiService;
    }

    /**
     * Générer un code MFA à 6 chiffres.
     * @return string Code MFA généré
     */
    public function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Créer et envoyer le code MFA à l'utilisateur par email.
     * @param User $user Utilisateur concerné
     * @param string|null $ipAddress Adresse IP de l'utilisateur
     * @return MFACode Code MFA créé
     */
    public function sendCode(User $user, string $ipAddress = null): MFACode
    {
        $this->invalidatePreviousCodes($user);
        $code = $this->generateCode();

        $mfaCode = MFACode::create([
            'user_id' => $user->id,
            'code' => $code,
            'expires_at' => now()->addMinutes(10),
            'ip_address' => $ipAddress,
        ]);

        // Schedule email to send AFTER HTTP response (non-blocking)
        $this->sendEmailCode($user, $code);

        return $mfaCode;
    }

    /**
     * Envoyer le code MFA par email via l'API Brevo (évite le blocage SMTP).
     * @param User $user Utilisateur concerné
     * @param string $code Code MFA à envoyer
     * @return void
     */
    protected function sendEmailCode(User $user, string $code): void
    {
        // Send email via HTTP API after HTTP response (no SMTP blocking)
        dispatch(function () use ($user, $code) {
            $success = $this->brevoApiService->sendMFACode($user, $code);

            if (!$success) {
                Log::warning('MFA code email failed but login proceeded', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);
            }
        })->afterResponse();

        Log::info('MFA code email dispatched', [
            'user_id' => $user->id,
            'email' => $user->email
        ]);
    }

    /**
     * Vérifier le code MFA.
     * @param User $user Utilisateur concerné
     * @param string $code Code MFA à vérifier
     * @return bool Vrai si le code est valide
     */
    public function verifyCode(User $user, string $code): bool
    {
        $mfaCode = MFACode::where('user_id', $user->id)
                          ->where('code', $code)
                          ->valid()
                          ->latest()
                          ->first();

        if (!$mfaCode) {
            Log::warning('Invalid MFA code attempt', [
                'user_id' => $user->id,
                'code' => $code
            ]);
            return false;
        }

        $mfaCode->markAsUsed();

        Log::info('MFA code verified successfully', [
            'user_id' => $user->id
        ]);

        return true;
    }

    /**
     * Invalider tous les codes précédents pour l'utilisateur.
     * @param User $user Utilisateur concerné
     * @return void
     */
    protected function invalidatePreviousCodes(User $user): void
    {
        MFACode::where('user_id', $user->id)
               ->where('used', false)
               ->update(['used' => true]);
    }

    /**
     * Activer MFA pour l'utilisateur.
     * @param User $user Utilisateur concerné
     * @return bool Vrai si activé
     * @throws Exception Si l'email n'est pas valide
     */
    public function enableMFA(User $user): bool
    {
        if (!$this->emailValidationService->hasValidDNS($user->email)) {
            Log::error('Cannot enable MFA - invalid email DNS', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);
            throw new Exception('Impossible d\'activer l\'authentification multi-facteurs. Votre adresse email ne peut pas recevoir de messages.');
        }

        $user->update(['mfa_enabled' => true]);

        Log::info('MFA enabled for user', [
            'user_id' => $user->id
        ]);

        return true;
    }

    /**
     * Désactiver MFA pour l'utilisateur.
     * @param User $user Utilisateur concerné
     * @return bool Vrai si désactivé
     */
    public function disableMFA(User $user): bool
    {
        $user->update(['mfa_enabled' => false]);
        $this->invalidatePreviousCodes($user);

        Log::info('MFA disabled for user', [
            'user_id' => $user->id
        ]);

        return true;
    }
}
