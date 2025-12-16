import NewDMModal from './NewDMModal.js'

export default function SetupNewDMButton() {
  const newDMBtn = document.getElementById('new-dm')

  if (newDMBtn) {
    newDMBtn.addEventListener('click', async () => {
      const modal = new NewDMModal()
      await modal.show()
    })
  } else {
    console.warn('[SetupNewDMButton] New DM button not found')
  }
}
