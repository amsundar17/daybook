// Curated quote banks with a deterministic "quote of the day" per category --
// no API, no key, same quote all day, a different one tomorrow.
const Quotes = (() => {
  const BANKS = {
    spirituality: [
      { body: "Wherever you are, be all there.", source: "Jim Elliot" },
      { body: "The quieter you become, the more you can hear.", source: "Rumi" },
      { body: "Peace comes from within. Do not seek it without.", source: "Buddha" },
      { body: "Silence is the language of God; all else is poor translation.", source: "Rumi" },
      { body: "Yesterday is history, tomorrow is a mystery, today is a gift.", source: "attributed" },
      { body: "You are the sky. Everything else is just the weather.", source: "Pema Chödrön" },
      { body: "The soul always knows what to do to heal itself.", source: "Caroline Myss" },
      { body: "Be still, and know.", source: "Psalm 46:10" },
      { body: "What you seek is seeking you.", source: "Rumi" },
      { body: "The wound is the place where the light enters you.", source: "Rumi" },
      { body: "Faith is taking the first step even when you don't see the whole staircase.", source: "attributed to Martin Luther King Jr." },
      { body: "Every moment is a fresh beginning.", source: "T.S. Eliot" },
      { body: "Nothing external to me has any power over me.", source: "Walt Whitman" },
      { body: "The privilege of a lifetime is to become who you truly are.", source: "Carl Jung" },
      { body: "In the midst of movement and chaos, keep stillness inside of you.", source: "Deepak Chopra" },
      { body: "You cannot travel the path until you have become the path itself.", source: "Buddha" },
      { body: "Gratitude turns what we have into enough.", source: "attributed" },
      { body: "Let go of the life you planned, so you can have the life waiting for you.", source: "Joseph Campbell" },
      { body: "The present moment is the only moment available to us.", source: "Thich Nhat Hanh" },
      { body: "Not the wind, but the set of the sail determines direction.", source: "Jim Rohn" },
    ],
    wisdom: [
      { body: "The unexamined life is not worth living.", source: "Socrates" },
      { body: "Knowing yourself is the beginning of all wisdom.", source: "Aristotle" },
      { body: "It is not that we have a short time to live, but that we waste a lot of it.", source: "Seneca" },
      { body: "The obstacle is the way.", source: "Marcus Aurelius" },
      { body: "We suffer more often in imagination than in reality.", source: "Seneca" },
      { body: "He who has a why to live can bear almost any how.", source: "Friedrich Nietzsche" },
      { body: "The only true wisdom is in knowing you know nothing.", source: "Socrates" },
      { body: "What stands in the way becomes the way.", source: "Marcus Aurelius" },
      { body: "A man who dares to waste one hour of time has not discovered the value of life.", source: "Charles Darwin" },
      { body: "Fall seven times, stand up eight.", source: "Japanese proverb" },
      { body: "The best time to plant a tree was 20 years ago. The second best time is now.", source: "Chinese proverb" },
      { body: "You have power over your mind, not outside events.", source: "Marcus Aurelius" },
      { body: "It does not matter how slowly you go, so long as you do not stop.", source: "Confucius" },
      { body: "Waste no more time arguing about what a good man should be. Be one.", source: "Marcus Aurelius" },
      { body: "The chief cause of unhappiness is caring about opinions.", source: "Epictetus" },
      { body: "A river cuts through rock, not because of its power, but its persistence.", source: "attributed" },
      { body: "Well begun is half done.", source: "Aristotle" },
      { body: "Patience is bitter, but its fruit is sweet.", source: "Aristotle" },
      { body: "First say to yourself what you would be, and then do what you have to do.", source: "Epictetus" },
      { body: "Character is destiny.", source: "Heraclitus" },
    ],
    "life-hacks": [
      { body: "Do the hardest thing on your list first, while your willpower is highest.", source: "Mark Twain, paraphrased" },
      { body: "You don't rise to the level of your goals; you fall to the level of your systems.", source: "James Clear" },
      { body: "Make it easy to start and hard to quit.", source: "attributed" },
      { body: "A task left half-finished costs more attention than one you never started.", source: "Zeigarnik effect" },
      { body: "Write it down. A captured thought stops asking to be remembered.", source: "David Allen, paraphrased" },
      { body: "Two minutes or less? Do it now instead of scheduling it.", source: "GTD principle" },
      { body: "Decide once, not every day: batch small repeated decisions.", source: "attributed" },
      { body: "Put the thing you want to do next where you'll trip over it tomorrow.", source: "attributed" },
      { body: "Protect one hour of deep work before you open anything that pings.", source: "Cal Newport, paraphrased" },
      { body: "Default to 'no' on new commitments; say 'yes' only to a clear 'hell yes'.", source: "Derek Sivers" },
      { body: "If it takes less time to do than to explain, just do it.", source: "attributed" },
      { body: "Plan tomorrow the night before, while today's context is still warm.", source: "attributed" },
      { body: "A cluttered space quietly taxes a cluttered mind.", source: "attributed" },
      { body: "Review your week before you plan the next one.", source: "attributed" },
      { body: "Energy, not time, is the resource to budget first.", source: "attributed" },
      { body: "Small, boring, repeated actions outperform big, rare, dramatic ones.", source: "attributed" },
      { body: "Turn off one notification today that didn't earn its interruption.", source: "attributed" },
      { body: "Name the very next physical action, not the whole project.", source: "David Allen, paraphrased" },
      { body: "Rest is part of the work, not a break from it.", source: "attributed" },
      { body: "Track the habit, not the outcome; the outcome follows.", source: "attributed" },
    ],
  };

  function hashKey(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function quoteOfDay(category, dateKey = Dates.todayKey()) {
    const bank = BANKS[category];
    if (!bank || !bank.length) return null;
    const idx = hashKey(`${category}:${dateKey}`) % bank.length;
    return bank[idx];
  }

  function allOfDay(dateKey = Dates.todayKey()) {
    return Object.keys(BANKS).map((cat) => ({ category: cat, ...quoteOfDay(cat, dateKey) }));
  }

  return { BANKS, quoteOfDay, allOfDay };
})();
