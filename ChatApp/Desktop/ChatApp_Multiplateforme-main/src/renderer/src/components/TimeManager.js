// Gestionnaire d'affichage d'une heure aléatoire parmi plusieurs fuseaux horaires
// Utilisé en front pour afficher une heure "vivante" dans l'interface
class TimeManager {
  // Liste de fuseaux horaires utilisés pour générer une heure aléatoire
  static TIMEZONES = [
    'Europe/London',
    'America/New_York',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Europe/Paris',
    'America/Los_Angeles',
    'Africa/Johannesburg',
    'Pacific/Auckland',
    'Asia/Dubai',
    'America/Sao_Paulo'
  ]

  /**
   * @param {string} elementId - id de l'élément DOM où l'heure sera affichée
   */
  constructor(elementId = 'current-time') {
    this.element = document.getElementById(elementId)
    this.updateTime()
    this.scheduleNextUpdate()
  }

  /**
   * Retourne une heure formatée (HH:mm) dans un fuseau horaire aléatoire
   * @returns {string}
   */
  getRandomTime() {
    const now = new Date()
    const zones = TimeManager.TIMEZONES
    const randomZone = zones[Math.floor(Math.random() * zones.length)]
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: randomZone
    }).format(now)
  }

  /**
   * Met à jour le texte de l'élément cible avec une nouvelle heure
   */
  updateTime() {
    if (this.element) {
      this.element.textContent = this.getRandomTime()
    }
  }

  /**
   * Programme la prochaine mise à jour de l'heure au début de la minute suivante,
   * puis toutes les minutes.
   */
  scheduleNextUpdate() {
    const now = new Date()
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
    setTimeout(() => {
      this.updateTime()
      setInterval(() => this.updateTime(), 60000)
    }, msToNextMinute)
  }
}

// Instancie automatiquement un TimeManager quand le DOM est prêt
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.timeManager = new TimeManager('current-time')
  })
}

export default TimeManager
