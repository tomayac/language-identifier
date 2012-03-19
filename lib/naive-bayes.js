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
  if (this.numberOfSamples === 0) {
    var firstFeature = Object.keys(this.features)[0];
    this.probabilities[category].categoryProbability = 
        this.features[firstFeature].minimumProbabilities[category];
  } else {
    this.probabilities[category].categoryProbability =
        this.categories[category].sampleSize / this.numberOfSamples;
  }
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
        var probability = that.features[feature].probabilities[category][item] ?
            that.features[feature].probabilities[category][item] :
            that.features[feature].probabilities[category].default;
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
  var winningCategory;
  var categories = Object.keys(this.categories);
  if (keys.length === 1) {
    var winningIndex = Math.floor(Math.random() * categories.length);    
    winningCategory = categories[winningIndex];
  } else {
    winningCategory = categoryResults[Math.max.apply(null, keys)];      
  }  
console.log(categoryResults);
  // learning part
  if (learn) {    
    Object.keys(this.categories).forEach(function(category) {    
      Object.keys(that.features).forEach(function(feature) {        
        if (category === winningCategory) {
          // new totals
          that.features[feature].totals[category] += 1; 
          that.categories[category].sampleSize += 1;       
          that.numberOfSamples += 1;
          // a posteriori
          newItem[feature].forEach(function(instance) {
            // new absolute frequency
            if (!that.features[feature].frequencies[category][instance]) {     
              that.features[feature].frequencies[category][instance] = 1;
            } else {
              that.features[feature].frequencies[category][instance] += 1;
            }            
            // new probability
            that.features[feature].probabilities[category][instance] = 
                that.features[feature].frequencies[category][instance] /
                that.features[feature].totals[category];
          });          
          // a priori
          that.probabilities[category].categoryProbability = 
              that.categories[category].sampleSize / that.numberOfSamples;
        }        
      });
    });    
  }
console.log(  this.categories);
//console.log(  this.features.nGrams.probabilities);
//console.log(  this.features.nGrams.frequencies);
console.log(  this.features.nGrams.totals);
console.log(  this.probabilities);
console.log(  this.numberOfSamples);
  
  return winningCategory;
};

module.exports = NaiveBayes;