<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Service pour la validation des adresses email.
 * Vérifie la validité DNS (MX/A) et fournit des informations détaillées pour le debug.
 */

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Class EmailValidationService
 * Service pour la validation des adresses email.
 */
class EmailValidationService
{
    /**
     * Vérifie si le domaine d'une adresse email possède des enregistrements MX valides.
     * @param string $email Adresse email à vérifier
     * @return bool Vrai si le domaine peut recevoir des emails
     */
    public function hasValidDNS(string $email): bool
    {
        $domain = $this->extractDomain($email);

        if (!$domain) {
            Log::warning('Invalid email format for DNS check', ['email' => $email]);
            return false;
        }

        $hasMX = $this->checkMXRecords($domain);

        if ($hasMX) {
            Log::info('Valid DNS found for email', ['email' => $email, 'domain' => $domain]);
            return true;
        }

        $hasA = $this->checkARecord($domain);

        if ($hasA) {
            Log::info('A record found for email (no MX)', ['email' => $email, 'domain' => $domain]);
        } else {
            Log::warning('No valid DNS records for email', ['email' => $email, 'domain' => $domain]);
        }

        return $hasA;
    }

    /**
     * Extrait le domaine d'une adresse email.
     * @param string $email Adresse email
     * @return string|null Domaine extrait ou null si invalide
     */
    protected function extractDomain(string $email): ?string
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        $parts = explode('@', $email);
        return $parts[1] ?? null;
    }

    /**
     * Vérifie si le domaine possède des enregistrements MX.
     * @param string $domain Domaine à vérifier
     * @return bool Vrai si MX trouvé
     */
    protected function checkMXRecords(string $domain): bool
    {
        try {
            $mxRecords = [];
            return checkdnsrr($domain, 'MX') && getmxrr($domain, $mxRecords) && !empty($mxRecords);
        } catch (\Exception $e) {
            Log::error('Error checking MX records', [
                'domain' => $domain,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Vérifie si le domaine possède un enregistrement A.
     * @param string $domain Domaine à vérifier
     * @return bool Vrai si A trouvé
     */
    protected function checkARecord(string $domain): bool
    {
        try {
            return checkdnsrr($domain, 'A');
        } catch (\Exception $e) {
            Log::error('Error checking A record', [
                'domain' => $domain,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Obtenir des informations DNS détaillées pour le debug.
     * @param string $email Adresse email à analyser
     * @return array Informations DNS
     */
    public function getDNSInfo(string $email): array
    {
        $domain = $this->extractDomain($email);

        if (!$domain) {
            return ['valid' => false, 'reason' => 'Invalid email format'];
        }

        $mxRecords = [];
        $hasMX = checkdnsrr($domain, 'MX') && getmxrr($domain, $mxRecords);
        $hasA = checkdnsrr($domain, 'A');

        return [
            'valid' => $hasMX || $hasA,
            'domain' => $domain,
            'has_mx' => $hasMX,
            'mx_records' => $mxRecords,
            'has_a' => $hasA,
        ];
    }
}
