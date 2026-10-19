const { getRandom, getRandomInt, C } = require("../utils/helpers");
const { trivia, truthQuestions } = require("../data/games");
const db = require("../utils/database");

const activeGames = {};

const gameCommands = {
  trivia: async (sock, msg, from) => {
    const q = getRandom(trivia);
    const opts = q.options.map((o, i) => `${["A", "B", "C", "D"][i]}. ${o}`).join("\n");
    activeGames[from] = { type: "trivia", answer: q.a, time: Date.now() };
    setTimeout(() => { if (activeGames[from]?.type === "trivia") delete activeGames[from]; }, 30000);
    await sock.sendMessage(from, {
      text: `🧠 *TRIVIA TIME!*\n\n❓ *${q.q}*\n\n${opts}\n\n_Reply with the letter or the answer! (30 seconds)_`,
    }, { quoted: msg });
  },

  guess: async (sock, msg, from) => {
    const number = getRandomInt(1, 100);
    activeGames[from] = { type: "guess", answer: number, attempts: 0, time: Date.now() };
    await sock.sendMessage(from, { text: `🎯 *Guess My Number!*\n\nI'm thinking of a number between *1 and 100*.\nYou have *7 attempts*!\n\nSend a number to guess!` }, { quoted: msg });
  },

  wordle: async (sock, msg, from) => {
    const words = ["ABUJA", "LAGOS", "NAIJA", "BREAD", "CHAIR", "PLANT", "WATER", "CLOUD", "STORM", "LIGHT", "NIGHT", "HEART", "GRACE", "PEACE", "POWER"];
    const word = getRandom(words);
    activeGames[from] = { type: "wordle", answer: word, guesses: [], time: Date.now() };
    await sock.sendMessage(from, { text: `🟩 *WORDLE!*\n\nGuess the 5-letter word! You have 6 attempts.\n\nSend a 5-letter word to start!\n\n🟩 = Correct position\n🟨 = Wrong position\n⬛ = Not in word` }, { quoted: msg });
  },

  hangman: async (sock, msg, from) => {
    const words = ["PEPPER", "SAPA", "NAIJA", "HUSTLE", "GRIND", "VIBES", "CORRECT", "WAHALA", "SUYA", "AMALA"];
    const word = getRandom(words);
    const display = "_".repeat(word.length).split("").join(" ");
    activeGames[from] = { type: "hangman", answer: word, guessed: [], display, attempts: 0, maxAttempts: 6, time: Date.now() };
    await sock.sendMessage(from, {
      text: `🎭 *HANGMAN!*\n\nWord: *${display}*\nLetters (${word.length})\nAttempts left: *6*\n\nGuess a letter!`,
    }, { quoted: msg });
  },

  checkgame: async (sock, msg, from, answer) => {
    const game = activeGames[from];
    if (!game) return false;

    if (game.type === "guess") {
      const num = parseInt(answer);
      if (isNaN(num)) return false;
      game.attempts++;
      if (num === game.answer) {
        delete activeGames[from];
        await sock.sendMessage(from, { text: `🎉 *Correct!!! You guessed it!*\nThe number was *${game.answer}*!\nAttempts used: *${game.attempts}*\n\n${game.attempts <= 3 ? "Incredible! You're a genius! 🧠🔥" : "Nice work! 💪"}` });
        return true;
      }
      if (game.attempts >= 7) {
        delete activeGames[from];
        await sock.sendMessage(from, { text: `💀 *Game Over!*\nThe number was *${game.answer}*!\nBetter luck next time 😭` });
        return true;
      }
      const hint = num < game.answer ? "Too low! Go higher ⬆️" : "Too high! Go lower ⬇️";
      await sock.sendMessage(from, { text: `${hint}\nAttempts left: *${7 - game.attempts}*` });
      return true;
    }

    if (game.type === "trivia") {
      const correct = answer.toUpperCase() === game.answer.toUpperCase() ||
        game.answer.toUpperCase().includes(answer.toUpperCase());
      delete activeGames[from];
      await sock.sendMessage(from, { text: correct ? `🎉 *CORRECT!!!*\n\nAnswer: *${game.answer}*\n\nYou dey try! Big brain energy! 🧠🔥` : `❌ *Wrong!*\n\nThe answer was: *${game.answer}*\nBetter luck on the next question! 😭` });
      return true;
    }

    if (game.type === "wordle") {
      const guess = answer.toUpperCase();
      if (guess.length !== 5 || !/^[A-Z]+$/.test(guess)) return false;
      const word = game.answer;
      let result = "";
      for (let i = 0; i < 5; i++) {
        if (guess[i] === word[i]) result += "🟩";
        else if (word.includes(guess[i])) result += "🟨";
        else result += "⬛";
      }
      game.guesses.push(guess);
      const history = game.guesses.map((g) => {
        let r = "";
        for (let i = 0; i < 5; i++) {
          if (g[i] === word[i]) r += "🟩";
          else if (word.includes(g[i])) r += "🟨";
          else r += "⬛";
        }
        return `${g} ${r}`;
      }).join("\n");
      if (guess === word) {
        delete activeGames[from];
        await sock.sendMessage(from, { text: `🎉 *YOU GOT IT!!!*\n\n${history}\n\nThe word was *${word}*!\n${game.guesses.length <= 2 ? "GENIUS!!!! 🧠🔥" : game.guesses.length <= 4 ? "Well done! 💪" : "Phew! Just made it 😅"}` });
        return true;
      }
      if (game.guesses.length >= 6) {
        delete activeGames[from];
        await sock.sendMessage(from, { text: `💀 *GAME OVER!*\n\n${history}\n\nThe word was *${word}*!\nNext time you'll get it 😭` });
        return true;
      }
      await sock.sendMessage(from, { text: `📊 *Wordle*\n\n${history}\n\nAttempts left: *${6 - game.guesses.length}*\nGuess again!` });
      return true;
    }

    if (game.type === "hangman") {
      const letter = answer.toUpperCase();
      if (letter.length !== 1 || !/^[A-Z]$/.test(letter)) return false;
      if (game.guessed.includes(letter)) {
        await sock.sendMessage(from, { text: `⚠️ You already guessed *${letter}*! Try another letter.` });
        return true;
      }
      game.guessed.push(letter);
      const word = game.answer;
      if (!word.includes(letter)) game.attempts++;
      const display = word.split("").map((c) => game.guessed.includes(c) ? c : "_").join(" ");
      if (!display.includes("_")) {
        delete activeGames[from];
        await sock.sendMessage(from, { text: `🎉 *YOU WIN!!!*\nThe word was *${word}*!\n\nBig brain! 🧠🔥` });
        return true;
      }
      if (game.attempts >= game.maxAttempts) {
        delete activeGames[from];
        await sock.sendMessage(from, { text: `💀 *GAME OVER!*\nThe word was *${word}*!\nSorry o 😭` });
        return true;
      }
      const gallows = ["😀", "😟", "😨", "😱", "💀😱", "☠️😭", "💀💀"];
      await sock.sendMessage(from, { text: `🎭 *HANGMAN*\n\n${gallows[game.attempts]}\nWord: *${display}*\nGuessed: ${game.guessed.join(", ")}\nAttempts left: *${game.maxAttempts - game.attempts}*` });
      return true;
    }

    return false;
  },
};

module.exports = gameCommands;
