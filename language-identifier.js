(function() {
  var learnFromScratch = false;
  var englishTweets = learnFromScratch? [] : require('./data/english.js');
  var germanTweets = learnFromScratch? [] : require('./data/german.js');
  var frenchTweets = learnFromScratch? [] : require('./data/french.js');
  var dutchTweets = learnFromScratch? [] : require('./data/dutch.js');
  var spanishTweets = learnFromScratch? [] : require('./data/spanish.js');
  var newTweets = require('./data/tweets.js');

  var LanguageModel = require('./lib/language-model.js');
  var NaiveBayes = require('./lib/naive-bayes');
  var Micropost = require('./lib/micropost.js');

  // English
  var english = new LanguageModel();
  englishTweets.forEach(function(tweet) {
    var ngrams = new Micropost(tweet).getNGrams();
    english.calculateFrequencies(ngrams);
  });
  Object.keys(english.nGramFrequencies).forEach(function(nGram) {
    english.nGramProbabilities[nGram] = english.getNGramProbability(nGram);
  });
  english.nGramProbabilities.default = english.getNGramProbability(false);

  // German
  var german = new LanguageModel();
  germanTweets.forEach(function(tweet) {
    var ngrams = new Micropost(tweet).getNGrams();
    german.calculateFrequencies(ngrams);
  });
  Object.keys(german.nGramFrequencies).forEach(function(nGram) {
    german.nGramProbabilities[nGram] = german.getNGramProbability(nGram);
  });
  german.nGramProbabilities.default = german.getNGramProbability(false);

  // Dutch
  var dutch = new LanguageModel();
  dutchTweets.forEach(function(tweet) {
    var ngrams = new Micropost(tweet).getNGrams();
    dutch.calculateFrequencies(ngrams);
  });
  Object.keys(dutch.nGramFrequencies).forEach(function(nGram) {
    dutch.nGramProbabilities[nGram] = dutch.getNGramProbability(nGram);
  });
  dutch.nGramProbabilities.default = dutch.getNGramProbability(false);

  // Spanish
  var spanish = new LanguageModel();
  spanishTweets.forEach(function(tweet) {
    var ngrams = new Micropost(tweet).getNGrams();
    spanish.calculateFrequencies(ngrams);
  });
  Object.keys(spanish.nGramFrequencies).forEach(function(nGram) {
    spanish.nGramProbabilities[nGram] = spanish.getNGramProbability(nGram);
  });
  spanish.nGramProbabilities.default = spanish.getNGramProbability(false);

  // French
  var french = new LanguageModel();
  frenchTweets.forEach(function(tweet) {
    var ngrams = new Micropost(tweet).getNGrams();
    french.calculateFrequencies(ngrams);
  });
  Object.keys(french.nGramFrequencies).forEach(function(nGram) {
    french.nGramProbabilities[nGram] = french.getNGramProbability(nGram);
  });
  french.nGramProbabilities.default = french.getNGramProbability(false);

  // Main ////////////////////////////////////////////////////////////////////////

  var categories = {
    english: {
      sampleSize: englishTweets.length
    },
    german: {
      sampleSize: germanTweets.length
    },
    french: {
      sampleSize: frenchTweets.length
    },
    spanish: {
      sampleSize: spanishTweets.length
    },
    dutch: {
      sampleSize: dutchTweets.length
    }
  };
  var features = {
    nGrams: {
      probabilities: {
        english: english.nGramProbabilities,
        german: german.nGramProbabilities,
        french: french.nGramProbabilities,
        dutch: dutch.nGramProbabilities,
        spanish: spanish.nGramProbabilities
      },
      frequencies: {
        english: english.nGramFrequencies,
        german: german.nGramFrequencies,
        french: french.nGramFrequencies,
        dutch: dutch.nGramFrequencies,
        spanish: spanish.nGramFrequencies,
      },
      totals: {
        english: english.numberOfMicroposts,
        german: german.numberOfMicroposts,
        french: french.numberOfMicroposts,
        dutch: dutch.numberOfMicroposts,
        spanish: spanish.numberOfMicroposts      
      },
      minimumProbabilities: {
        english: english.minimumProbability,
        german: german.minimumProbability,
        french: french.minimumProbability,
        dutch: dutch.minimumProbability,
        spanish: spanish.minimumProbability            
      }
    }
  };
  var naiveBayes = new NaiveBayes(categories, features);
  newTweets.forEach(function(newTweet) {
    var nGrams = new Micropost(newTweet).getNGrams();
    if (nGrams) {
      var result = naiveBayes.classify({
        nGrams: nGrams
      }, {
        learn: true
      });
      console.log(newTweet + '\n' + result + '\n*********************');
    } 
  });
})();