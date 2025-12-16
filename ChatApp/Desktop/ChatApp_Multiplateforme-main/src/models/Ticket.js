// Modèle représentant un ticket de support ou de bug
export default class Ticket {
  /**
   * Crée un nouveau ticket
   * @param {number|string} id - Identifiant du ticket
   * @param {string} title - Titre du ticket
   * @param {string} [description=''] - Description détaillée du problème
   * @param {('open'|'in_progress'|'closed'|string)} [status='open'] - Statut du ticket
   * @param {('low'|'medium'|'high'|string)} [priority='medium'] - Priorité du ticket
   * @param {number|string} user_id - ID de l'utilisateur ayant créé le ticket
   * @param {number|string|null} assigned_to - ID de l'admin assigné (ou null)
   */
  constructor(
    id,
    title,
    description = '',
    status = 'open',
    priority = 'medium',
    user_id,
    assigned_to
  ) {
    this.id = id
    this.title = title
    this.description = description
    this.status = status
    this.priority = priority
    this.user_id = user_id
    this.assigned_to = assigned_to
  }
}
