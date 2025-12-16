import NewChannelModal from './NewChannelModal.js'

export default function SetupCreateChannelButton(chatInstance) {
  const btn = document.getElementById('new-channel')
  if (btn) {
    btn.addEventListener('click', () => {
      const modal = new NewChannelModal(chatInstance)
      modal.show()
    })
  }
}
