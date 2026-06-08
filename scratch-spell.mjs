import nspell from 'nspell';
import enDict from 'dictionary-en';

const spell = nspell(enDict.aff, enDict.dic);

function hasSpellingErrors(story) {
  const cleanStory = story.replace(/[^a-zA-Z\s'-]/g, " ");
  const words = cleanStory.split(/\s+/).filter(Boolean);

  for (const word of words) {
    if (!spell.correct(word)) {
      if (!spell.correct(word.toLowerCase())) {
        console.warn(`[contextle] Spellcheck rejected word: ${word}`);
        return true;
      }
    }
  }
  return false;
}

console.log(hasSpellingErrors("The sound of gulls from the open sea."));
console.log(hasSpellingErrors("Te sound of gulls froo the open sea."));
