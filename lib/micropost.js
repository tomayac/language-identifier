/*******************************************************************************
 * Micropost
 ******************************************************************************/
var Micropost = function(text) {
  this.DEBUG = false;
  this.text = text;
};

Micropost.prototype.getNGrams = function(nGramSize) {
  // defaulting to trigrams, also see
  // http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.42.4093
  if (!nGramSize) {
    nGramSize = 3;
  }
  // regexes mostly based on
  // https://github.com/cramforce/streamie/blob/master/public/lib/stream/streamplugins.js
  var URL_REGEX = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig
  var HASHTAG_REGEX = /(^|\s)\#(\S+)/g;
  var USER_REGEX = /(^|\W)\@([a-zA-Z0-9_]+)/g;  
  // based on http://en.wikipedia.org/wiki/Punctuation
  var PUNCTUATION_SYMBOLS_REGEX = /[\.,\-‒–—―\/\?¿|!¡\^&§\*;:{}=_"'`´~„“”‘’…\[\]\(\)⟨⟩«»\\♻ ★·•^†‡°〃#№÷ºª%‰‱¶′″‴¦|©®℗℠™¤₳฿₵¢₡₢₠$₫৳ ₯€ƒ₣₲₴₭ℳ₥₦₧₱₰£₹₨$₪₸₮₩¥៛⁂⊤⊥☞∴∵‽؟◊※⁀♠♣♥♦‾←↑→↓♫�]/g;
  var nGramRegEx = new RegExp('.{' + nGramSize + '}', 'g');
  if (this.DEBUG === true) console.log('Before normalization: ' + this.text);
  // remove typical Twitter lingo, loosly based on
  // https://support.twitter.com/articles/166337-the-twitter-glossary
  this.text = this.text.replace(/\bRT\s+@/g, '@'); // "RT" (RT @handler)
  this.text = this.text.replace(/\bOH:?\s/g, ''); // "OH" (OverHeard) 
  this.text = this.text.replace(/\bHT:?\s/g, ''); // "HT" (HeardThrough)   
  this.text = this.text.replace(/\bDM\b/g, ''); // "DM" (DirectMessage)   
  this.text = this.text.replace(/\bretweets?\b/gi, ''); // "ReTweet"
  this.text = this.text.replace(/\bspam\b/gi, ''); // "spam"
  this.text = this.text.replace(/\b\(cont\)\b/gi, ''); // "(cont)" (TwitLonger)
  this.text = this.text.replace(/\b[Vv]ia:?\s+@/g, '@'); // "via @handler"
  this.text = this.text.trim().toLowerCase(); // only consider lower case
  this.text = this.text.replace(HASHTAG_REGEX, ''); // #hashtags
  this.text = this.text.replace(USER_REGEX, ''); // @handlers
  this.text = this.text.replace(URL_REGEX, ''); // URLs    
  this.text = this.text.replace(PUNCTUATION_SYMBOLS_REGEX, ' '); // punctuation
  this.text = this.text.replace(/\d/g, ' '); // any digit
  this.text = this.text.replace(/\s+/g, ' '); // multiple spaces    
  if (this.DEBUG === true) console.log('After normalization:  ' + this.text);
  var nGrams = this.text.match(nGramRegEx); // split in n-grams  
  // if nothing is left after the normalization
  if (!nGrams) {
    return;
  }
  // deduplicate ngrams, neat trick stolen from
  // http://stackoverflow.com/questions/7683845/removing-duplicates-from-an-array-in-javascript
  nGrams = Object.keys(nGrams.reduce(function(r, v) {
    return r[v] = 1, r;
  }, {}));
  return nGrams;
};

module.exports = Micropost;