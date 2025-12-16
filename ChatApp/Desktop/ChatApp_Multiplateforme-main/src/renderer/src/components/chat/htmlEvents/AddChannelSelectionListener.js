// Ajoute un listener de sélection de salon / DM sur les éléments enfants d'un conteneur
export default function addChannelSelectionListener(container, list, onSelect, itemClass) {
  // Sécurité : si aucun conteneur reçu, on ne fait rien
  if (!container) return

  // Sélectionne tous les éléments correspondant à la classe fournie (ex: 'channel-item')
  container.querySelectorAll('.' + itemClass).forEach((el) => {
    // Clic sur un item de la liste de salons / DMs
    el.onclick = () => {
      // Récupération de l'ID du canal ou du DM à partir des attributs data-*
      const id = el.getAttribute('data-channel-id') || el.getAttribute('data-dm-id')
      // On cherche dans la liste JS (channels ou DMs) l'élément correspondant
      const found = list.find((item) => String(item.id) === String(id))
      // Si trouvé, on appelle le callback de sélection avec l'objet complet
      if (found) onSelect(found)
    }
  })
}
