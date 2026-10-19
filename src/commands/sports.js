const { getRandom, getRandomInt } = require("../utils/helpers");

// Simulated sports data for when no API is connected
const leagues = {
  epl: { name: "English Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿", teams: ["Manchester City", "Arsenal", "Liverpool", "Chelsea", "Manchester United", "Tottenham", "Newcastle", "Aston Villa", "Brighton", "West Ham"] },
  laliga: { name: "La Liga 🇪🇸", teams: ["Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Real Betis", "Villarreal", "Real Sociedad", "Valencia", "Osasuna", "Athletic Bilbao"] },
  bundesliga: { name: "Bundesliga 🇩🇪", teams: ["Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen", "Eintracht Frankfurt", "Wolfsburg", "Hoffenheim", "Freiburg", "Mainz", "Union Berlin"] },
  seriea: { name: "Serie A 🇮🇹", teams: ["Napoli", "Inter Milan", "AC Milan", "Juventus", "Roma", "Lazio", "Atalanta", "Fiorentina", "Torino", "Bologna"] },
  ligue1: { name: "Ligue 1 🇫🇷", teams: ["PSG", "Olympique Marseille", "Monaco", "Lille", "Lyon", "Nice", "Rennes", "Lens", "Strasbourg", "Nantes"] },
  efl: { name: "EFL Championship 🏴󠁧󠁢󠁥󠁮󠁧󠁿", teams: ["Leeds United", "Leicester City", "Sunderland", "Sheffield United", "Southampton", "Middlesbrough", "Coventry City", "Watford", "West Brom", "Burnley"] },
  el: { name: "UEFA Europa League 🏆", teams: ["Roma", "Bayer Leverkusen", "Feyenoord", "Manchester United", "Arsenal", "Real Sociedad", "Atalanta", "Sporting Lisbon"] },
  cl: { name: "UEFA Champions League ⭐", teams: ["Real Madrid", "Manchester City", "Bayern Munich", "PSG", "Barcelona", "Chelsea", "Liverpool", "Napoli", "Inter Milan", "Atletico Madrid"] },
  wc: { name: "FIFA World Cup 🌍", teams: ["Brazil", "France", "Argentina", "Germany", "Spain", "England", "Portugal", "Nigeria", "Senegal", "Morocco"] },
};

function fakeMatch(team1, team2) {
  const g1 = getRandomInt(0, 4), g2 = getRandomInt(0, 4);
  return `${team1} ${g1} - ${g2} ${team2}`;
}

function fakeStandings(teams) {
  return teams.slice(0, 5).map((t, i) => {
    const pts = 70 - i * (5 + getRandomInt(0, 4));
    return `${i + 1}. ${t} — *${pts}pts*`;
  }).join("\n");
}

function fakeScorer(teams) {
  const players = { "Manchester City": "Haaland", "Arsenal": "Saka", "Liverpool": "Salah", "Real Madrid": "Vinicius Jr", "Barcelona": "Lewandowski", "Bayern Munich": "Kane", "PSG": "Mbappé", "Napoli": "Osimhen", "default": "Top Player" };
  return teams.slice(0, 5).map((t, i) => `${i + 1}. ${players[t] || players["default"]} (${t}) — *${20 - i * (2 + getRandomInt(0, 2))} goals*`).join("\n");
}

function fakeUpcoming(teams) {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  return [
    `📅 ${shuffled[0]} vs ${shuffled[1]}`,
    `📅 ${shuffled[2]} vs ${shuffled[3]}`,
    `📅 ${shuffled[4]} vs ${shuffled[5]}`,
  ].join("\n");
}

function makeLeagueCommands(prefix, leagueKey) {
  const league = leagues[leagueKey] || leagues.epl;
  return {
    [`${prefix}matches`]: async (sock, msg, from) => {
      const teams = [...league.teams].sort(() => Math.random() - 0.5);
      const matches = [fakeMatch(teams[0], teams[1]), fakeMatch(teams[2], teams[3]), fakeMatch(teams[4], teams[5])];
      await sock.sendMessage(from, { text: `⚽ *${league.name} — Recent Matches*\n\n${matches.join("\n")}\n\n_Simulated data. Connect sports API for live scores._` }, { quoted: msg });
    },
    [`${prefix}standings`]: async (sock, msg, from) => {
      await sock.sendMessage(from, { text: `🏆 *${league.name} — Standings*\n\n${fakeStandings(league.teams)}\n...\n\n_Simulated data. Connect sports API for live standings._` }, { quoted: msg });
    },
    [`${prefix}scorers`]: async (sock, msg, from) => {
      await sock.sendMessage(from, { text: `⚽ *${league.name} — Top Scorers*\n\n${fakeScorer(league.teams)}\n\n_Simulated data._` }, { quoted: msg });
    },
    [`${prefix}upcoming`]: async (sock, msg, from) => {
      await sock.sendMessage(from, { text: `📅 *${league.name} — Upcoming Fixtures*\n\n${fakeUpcoming(league.teams)}\n\n_Simulated data._` }, { quoted: msg });
    },
  };
}

const sportsCommands = {
  ...makeLeagueCommands("epl", "epl"),
  ...makeLeagueCommands("laliga", "laliga"),
  ...makeLeagueCommands("bundesliga", "bundesliga"),
  ...makeLeagueCommands("seriea", "seriea"),
  ...makeLeagueCommands("ligue1", "ligue1"),
  ...makeLeagueCommands("efl", "efl"),
  ...makeLeagueCommands("el", "el"),
  ...makeLeagueCommands("cl", "cl"),
  ...makeLeagueCommands("wc", "wc"),

  // Wrestling
  wwenews: async (sock, msg, from) => {
    const news = [
      "🤼 Cody Rhodes defends championship at upcoming PPV!",
      "🤼 Roman Reigns returns after mysterious hiatus!",
      "🤼 New WWE Women's Championship match announced for next SmackDown!",
      "🤼 CM Punk vs Seth Rollins feud heats up ahead of WrestleMania!",
      "🤼 Rey Mysterio announces retirement match details!",
    ];
    await sock.sendMessage(from, { text: `🤼 *WWE News:*\n\n${getRandom(news)}\n\n_Simulated news. Connect sports API for real updates._` }, { quoted: msg });
  },

  wweschedule: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `🗓️ *WWE Schedule:*\n\n📺 *RAW* — Every Monday\n📺 *SmackDown* — Every Friday\n📺 *NXT* — Every Tuesday\n\n🏟️ *Next PPV:* Coming soon!\n\n_Connect WWE API for live schedule._` }, { quoted: msg });
  },

  wrestlingevents: async (sock, msg, from) => {
    await sock.sendMessage(from, { text: `🤼 *Wrestling Events:*\n\n• WrestleMania — April 🏟️\n• SummerSlam — August 🌞\n• Survivor Series — November 🎃\n• Royal Rumble — January ❄️\n\n_Major WWE PPV events._` }, { quoted: msg });
  },
};

module.exports = sportsCommands;
