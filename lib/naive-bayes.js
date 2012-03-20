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
      categoryProbability: 0
    };
    Object.keys(that.features).forEach(function(feature) {
      that.probabilities[category][feature] = [];
    });
  });  
}; 

NaiveBayes.prototype.aPrioriProbabilities = function(category) {  
  if (this.categories[category].sampleSize === 0) {    
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

NaiveBayes.prototype.classify = function(newItem, options) {
  if (!options.learn) {
    options.learn = false;
  }
  // a priori
  var that = this;
  Object.keys(this.categories).forEach(function(category) {
    that.aPrioriProbabilities(category);
  });    
  // a posteriori
  Object.keys(this.categories).forEach(function(category) {      
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
  var categoryResults = {};
  Object.keys(this.categories).forEach(function(category) {
    var featureResults = [];    
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
  // determine winning category randomly if all probabilities are equal
  if (keys.length < categories.length) {
    var winningIndex = Math.floor(Math.random() * categories.length);    
    winningCategory = categories[winningIndex];
    if (this.DEBUG) console.log('Guessing winning category to be: ' + winningCategory);
  // else, determine winning category by maximum probability
  } else {
    winningCategory = categoryResults[Math.max.apply(null, keys)];      
    if (this.DEBUG) console.log('Calculating winning category to be:  ' + winningCategory);    
  }  
console.log(categoryResults);  
  // learning part
  if (options.learn) {    
    that.numberOfSamples += 1;    
    Object.keys(this.categories).forEach(function(category) {
      Object.keys(that.features).forEach(function(feature) {        
        if (category === winningCategory) {
          // new totals
          that.features[feature].totals[category] += 1; 
          that.categories[category].sampleSize += 1;
        }
        // a posteriori
        newItem[feature].forEach(function(item) {
          // new absolute frequency
          if (!that.features[feature].frequencies[category][item]) {     
            that.features[feature].frequencies[category][item] = 1;
          } else {
            that.features[feature].frequencies[category][item] += 1;
          }            
          // new probability
          if (that.features[feature].totals[category]) {
            that.features[feature].probabilities[category][item] = 
                that.features[feature].frequencies[category][item] /
                that.features[feature].totals[category];
          } else {
            that.features[feature].probabilities[category][item] = 
                that.features[feature].minimumProbabilities[category];
          }
        });          
        // a priori
        that.probabilities[category].categoryProbability = 
            that.categories[category].sampleSize / that.numberOfSamples;
      });
    });
  }
  return winningCategory;
};

module.exports = NaiveBayes;