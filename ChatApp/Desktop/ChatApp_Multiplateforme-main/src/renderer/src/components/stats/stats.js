import { getCurrentUser } from '../auth/auth.js';
import API from '../../../../main/api.js';
import * as i18n from '../../lang/LanguageManager.js'
const apiService = new API();

document.getElementById("btn-back").addEventListener("click", () => {
  history.back();
});

document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('stats-loader');
  const content = document.getElementById('stats-content');

  try {
    const user = await getCurrentUser();

    if (!user) {
      loader.textContent = "Impossible de charger les stats : utilisateur non connecté.";
      return;
    }

    const response = await apiService.request(`/user/${user.id}/stats`);

    if (!response.success) {
      loader.textContent = "Erreur lors du chargement des statistiques.";
      return;
    }

    const stats = response.data.stats;

    document.getElementById("stat-total-messages").textContent = stats.total_messages;
    document.getElementById("stat-total-channels").textContent = stats.total_channels;

    const topChannelsList = document.getElementById("stat-top-channels");
    topChannelsList.innerHTML = "";

    if (stats.top_channels && stats.top_channels.length > 0) {
      stats.top_channels.forEach(ch => {
        const li = document.createElement("li");
        li.textContent = `${ch.name} : ${ch.total} messages`;
        topChannelsList.appendChild(li);
      });
    } else {
      topChannelsList.innerHTML = "<li>Aucune donnée disponible.</li>";
    }

    const activityDaysList = document.getElementById("stat-activity-days");
    activityDaysList.innerHTML = "";

    if (stats.activity_by_day && Object.keys(stats.activity_by_day).length > 0) {

      const activityItems = [];

      Object.entries(stats.activity_by_day).forEach(([day, count]) => {

        const li = document.createElement("li");
        li.classList.add("activity-item");

        const text = document.createElement("div");
        const translatedDay = i18n.t(`days.${day}`);

        text.textContent = `${translatedDay} : ${count} messages`;



        const bar = document.createElement("div");
        bar.classList.add("activity-bar");


        const fill = document.createElement("div");
        fill.classList.add("activity-bar-fill");

        bar.appendChild(fill);
        li.appendChild(text);
        li.appendChild(bar);

        activityDaysList.appendChild(li);

        activityItems.push({ fill, count });
      });


      const max = Math.max(...activityItems.map(i => i.count));


      activityItems.forEach(item => {
        const percentage = (item.count / max) * 100;
        item.fill.style.width = percentage + "%";
      });

    } else {
      activityDaysList.innerHTML = "<li>Aucune activité enregistrée.</li>";
    }


    loader.classList.add('hidden');
    content.classList.remove("hidden");

  } catch (error) {
    console.error("Erreur stats:", error);
    loader.textContent = "Erreur lors du chargement des statistiques.";
  }
});

