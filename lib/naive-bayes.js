/*******************************************************************************
 * NaiveBayes
 ******************************************************************************/
var NaiveBayes = function(categories, features) {
  this.DEBUG = false;  
  this.categories = categories;
  this.features = features;
  this.probabilities = {};
  this.numberOfSamples = 0;
  var that = this;
  Object.keys(this.categories).forEach(function(category) {
    that.numberOfSamples += categories[category].sampleSize;    
    that.probabilities[category] = {
      categoryProbability: null
    };
    Object.keys(that.features).forEach(function(feature) {
      that.probabilities[category][feature] = [];
    });
  });  
}; 

NaiveBayes.prototype.aPrioriProbabilities = function(category) {
  this.probabilities[category].categoryProbability =
      this.categories[category].sampleSize / this.numberOfSamples;
};

NaiveBayes.prototype.aPosterioriProbabilities =
    function(category, feature, probability) {
  this.probabilities[category][feature].push(probability);
};

NaiveBayes.prototype.classify = function(newItem, learn) {
  if (!learn) {
    learn = false;
  }
  // a priori
  var that = this;
  Object.keys(this.categories).forEach(function(category) {
    that.aPrioriProbabilities(category);
  });    
  // a posteriori
  Object.keys(that.categories).forEach(function(category) {      
    Object.keys(newItem).forEach(function(feature) {
      newItem[feature].forEach(function(item) {
        var probability = that.features[feature].data[category][item] ?
            that.features[feature].data[category][item] :
            that.features[feature].data[category].default;
        that.aPosterioriProbabilities(category, feature, probability);
      });
    });
  });
  // final result
  var multiply = function (a, b) { return a * b; };
  Object.keys(this.categories).forEach(function(category) {
    Object.keys(that.features).forEach(function(feature) {
      that.probabilities[category][feature] =
          that.probabilities[category][feature].reduce(multiply);
      that.probabilities[category][feature] *=
          that.probabilities[category].categoryProbability;
      if (that.DEBUG) {
        console.log(
            'A priori probabilities ' + category + ': ' +
            that.probabilities[category].categoryProbability);
      }
    });    
  });
  var categoryResults = {};
  Object.keys(this.categories).forEach(function(category) {
    var featureResults = [];    
    Object.keys(that.features).forEach(function(feature) {
      featureResults.push(that.probabilities[category][feature]);
      // reset for next run
      that.probabilities[category][feature] = [];       
    });
    featureResults = featureResults.reduce(multiply);
    categoryResults[featureResults] = category;
    if (that.DEBUG) {
      console.log(
          'A posteriori probabilities ' + category + ': ' +
          featureResults);    
    }
  });
  var keys =
      Object.keys(categoryResults).map(function(n) { return parseFloat(n);});
  var winningCategory = categoryResults[Math.max.apply(null, keys)];      
  if (learn) {
/* broken mess    
    Object.keys(this.categories).forEach(function(category) {    
      Object.keys(that.features).forEach(function(feature) {
        newItem[feature].forEach(function(instance) {
console.log('Before ' + that.features[feature].data[category][instance])          
          that.features[feature].data[category][instance] =
          that.features[feature].frequencies[category][instance] ?
            that.features[feature].frequencies[category][instance] += 1 :
            that.features[feature].frequencies[category][instance] = 1 :
          that.features[feature].minimumProbabilities[category]
        });
      });
    });
*/    
  }
  return winningCategory;
};

module.exports = NaiveBayes;