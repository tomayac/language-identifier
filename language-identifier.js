var englishTweets = require('./data/english.js');
var germanTweets = require('./data/german.js');
var frenchTweets = require('./data/french.js');

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
var newTweets = [
  'Looking forward to read @EricTopol\'s book "Destroying Medicine: Using patient\'s data" ow.ly/1IlzY7',
  'Si vous souhaitez contribuer à la traduction en français du rapport du Library Linked Data Group (LLD XG) contactez-moi #help #traductions',
  'Champions League: Bayern muss gegen Basel punktebn bit.ly/zQzlwz',
  'war heute beim Workshop zu Möglichkeiten der forschungsbezogenen Leistungsmessung an Universitäten bit.ly/ybDrmH #scientometrie #hhu',
  '@lechatpito Tiens, on m\'avait sollicité aussi ;-) bonne réunion et bon courage pour les convaincre',
  'This is the best thing you\'ll read all day: http://www.quora.com/Air-Force-One/Whats-it-like-to-fly-on-Air-Force-One #fb',
  'rumor, innuendo, pointless',
  'been playing with/QAing my new baby today. it’s the sexiest looking app you\'ve ever seen. the team here rocks. can’t wait to launch it :)',
  'http://SourceForge.net: EulerSharp: eulersharp-users - http://goo.gl/K1FfN',
  '63 people at the #sxsw talk on “Has the semantic Web gone mainstream” a great talk with @juansequeda a PhD student http://pic.twitter.com/Vsl8nTq9',
  'Wanted: Wikipedian who loves libraries/archives, wants to make a difference. Come work with us this summer! http://bit.ly/xqJ1ij #oclcr',
  'Prof. Jan De Maeseneer (UGent) enig Europees lid van \'Global Forum on Innovation in Health Professional E… http://bit.ly/ylvvmA #ugent',
  'Software code is already protected by copyright law. The results of that code should not be patentable.'
];

var categories = {
  english: {
    sampleSize: englishTweets.length
  },
  german: {
    sampleSize: germanTweets.length
  },
  french: {
    sampleSize: frenchTweets.length
  }
};
var features = {
  nGrams: {
    data: {
      english: english.nGramProbabilities,
      german: german.nGramProbabilities,
      french: french.nGramProbabilities
    }
  }
};
var naiveBayes = new NaiveBayes(categories, features);
newTweets.forEach(function(newTweet) {
  var nGrams = new Micropost(newTweet).getNGrams();
  var result = naiveBayes.classify({
    'nGrams': nGrams
  });
  console.log(newTweet + '\n' + result);
});
