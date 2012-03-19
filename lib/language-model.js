/*******************************************************************************
 * LanguageModel
 ******************************************************************************/
var LanguageModel = function() {  
  this.DEBUG = false;
  this.nGramFrequencies = {};
  this.nGramProbabilities = {};
  this.numberOfMicroposts = 0;
  this.minimumProbability = 0.000001;
};

LanguageModel.prototype.calculateFrequencies = function(nGrams) {
  if (!Array.isArray(nGrams) || nGrams.length === 0) {
    return;
  }
  this.numberOfMicroposts += 1;
  var that = this;
  nGrams.forEach(function(nGram) {
    if (that.nGramFrequencies.hasOwnProperty(nGram)) {
      that.nGramFrequencies[nGram]++;
    } else {
      that.nGramFrequencies[nGram] = 1;
    }
  });
  return this.nGramFrequencies;
};

LanguageModel.prototype.getNGramProbability = function(nGram) {
  if (this.numberOfMicroposts === 0) {
    return this.minimumProbability;
  }  
  if (!this.nGramFrequencies[nGram]) {
    // pseudocount for zero-count possibilities
    // TODO: empirically determine minimumProbability
    return this.minimumProbability / this.numberOfMicroposts;    
  }
  return this.nGramFrequencies[nGram] / this.numberOfMicroposts;
};

module.exports = LanguageModel;