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
  var PUNCTUATION_REGEX = /[\.,\-‒–—―\/\?¿|!¡\^&§\*;:{}=_"'`´~„“”‘’…\[\]\(\)⟨⟩«»\\·•^†‡°〃#№÷ºª%‰‱¶′″‴¦|©®℗℠™¤₳฿₵¢₡₢₠$₫৳ ₯€ƒ₣₲₴₭ℳ₥₦₧₱₰£₹₨$₪₸₮₩¥៛⁂⊤⊥☞∴∵‽؟◊※⁀♠♣♥♦‾←↑→↓♫�]/g;
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
  this.text = this.text.replace(PUNCTUATION_REGEX, ' '); // all punctuation
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


/*******************************************************************************
 * LanguageModel
 ******************************************************************************/
var LanguageModel = function() {  
  this.DEBUG = false;
  this.nGramFrequencies = {};
  this.nGramProbabilities = {};
  this.numberOfMicroposts = 0;
};

LanguageModel.prototype.calculateFrequencies = function(nGrams) {
  if (!Array.isArray(nGrams)) {
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
  if (!this.nGramFrequencies[nGram]) {
    // pseudocount for zero-count possibilities
    // TODO: empirically determine minimumProbability
    var minimumProbability = 0.000001;
    return minimumProbability / this.numberOfMicroposts;
  }
  return this.nGramFrequencies[nGram] / this.numberOfMicroposts;
};

var englishTweets = [
  'Ward Cunningham’s Smallest Federated Wiki Paves Road To Our Curated Future bit.ly/x0Pjcg via @semanticweb by @jenz514 #linkeddata',
  'I heard a new term yesterday. POTATO. Person Over Thirty Acting Twenty One.',
  'How To Write Readable - And Retweetable - Tweets rww.to/zXZqZI',
  'yay, our paper was accepted to #lile2012, the linked learning workshop at #www2012 :) #linkeddata /cc @talisaspire',
  'Daylight Saving Time starts tomorrow night. Hooray!',
  'Nervous Medical Students Await Next Week’s Match Day rww.to/Ay6V3q',
  'RT @sarahebourne: ALL THE SLIDES! #RWD RT @Malarkey ★ All the slides from my full day responsive design workshop bit.ly/yMEdJQ',
  'Somehow William Morris feels like the right/wrong thing to read on a plane to SXSW.',
  'Nice talk by @r4isstatic on linked data at the bbc',
  'amused by how some thinner paperbacks weigh more than some larger hardcovers. All makes sense, just not expected.',
  'Talking about a Korean version of 5 star Open Data at WebSci Korea WG j.mp/AqNRdr #opendata #linkeddata (via @mhausenblas)',
  'For everyone who ask about 2nd edition of Html5 Game course - W3C hopes to get it running before the end of the year, but no dates yet.',
  '3 new tech industry jobs posted to the ReadWriteWeb job board -- jbs.gd/Czjv6 #jobs',
  '@jenit have you tried Visual Source Safe? If you insist on needless pain, do it properly!',
  '@ndw @JeniT @peteduncanson @gklyne @xquery @bensummers for penance I now find myself needing to study hg-git.github.com',
  'Crowdfunding Moves Closer to Congressional Approval rww.to/y33G9C',
  'Mark Levin 2 Media: “We Will Not Let You Take Down Rush” http://goo.gl/YqSGn @ABC @CBS @MSNBC @CNN @NBC @NPR @PBS @WAPO @NYTimes @HBO',
  '@hilaryr @cnn Who cares. ICK. Hilary Rosen',
  'http://openrebellion.us/2012/03/05/hey-mainstream/ Hey #MSM – ARE NONE OF YOU #AMERICANS?!?! #WarMongers #HR347 #NDAA #PoliceState #MediaBlackouts @CNN @MSNBC @FOX #PEACE',
  '@grammalilx12 @ObamaNewsTweetr 1st plan shud be 2 put gouging oil speculators behind bars! So sta subsidies~ @BarackObama @CNN @MMFlint',
  '@djanthony13 @TennAtHeart @rolandsmartin @CNN Okay, is it official? Darren Anthony',
  'Why possible @Mashable acquisition by @CNN garners a big “meh.” http://tech.fortune.cnn.com/2012/03/13/mashable/',
  '@yasbm @gloriahere @BBC @CNN It is Democracy Circus of #USA #NeoCons threaten #Bahrain with fate of Iraq Psychopathy; http://groups.yahoo.com/group/the_iraqi/message/5798 yasbm',
  'Just saw #clydetheglide on #CNNWorldSport @CNN @tomrubashow',
  'Afghan shootings cast spotlight on Wash. base http://bit.ly/AtF1gU (via @cnn)',
  'Bring some class to your social media http://bit.ly/yQNRSz (via @cnn)',
  '@GUMSHEW @npbat @JeffersonObama I wish he would just say I\'m a Romney man instead of playing that false equivalence crap @CNN tries to do. James Holloway',
  '@Soledad_OBrien apologize to @JoelPollak & his wife. And pretend to have an ounce of objectivity. propagandist hack. @Cnn.',
  '@ErinBurnett asks if tonight’s going to be “Mitt’s night.” "#MostDecisive primary yet" - @CNN',
  'http://www.fair.org/blog/ it’s how @CNN shows stacked w/ Establishment ONLY “left” Hillary Rosen profited from IRAQ War and worked for BP oil',
  '@CNN Biz News - Health reform coverage cost falls slightly: The cost and promised savings of health reform tied … http://bit.ly/zbQw36',
  'Zakaria: Democracy in China? – Global Public Square - http://CNN.com Blogs http://globalpublicsquare.blogs.cnn.com/2012/03/12/zakaria-democracy-in-china/ via @cnn',
  '#arrogant Soledad O’Brien prolongs her humiliation http://dailycaller.com/2012/03/13/thedc-morning-soledad-obrien-prolongs-her-humiliation/ @cnn #tcot #p2 #racist #derrickbell #obamamentor #truthteam',
  'Syria rebuffs mediation offer – CNN Security Clearance - http://CNN.com Blogs http://security.blogs.cnn.com/2012/03/13/syria-rebuffs-mediation-offer/ @cnnさんから',
  'New Reuters/Ipsos poll #Obama at 50% - crushes all #GOP candidates! http://reut.rs/wPuLXA - @msnbc @cbs @abc @cnn cover as they do bad #\'s?',
  '.@CNN revealing that places with a lot of people are important to win for candidates. BREAKING EFFIN NEWS #JeffCo #ALprimary #ALpolitics',
  'Gergen runs around Bohemian Grove w/ “elites” & Hillary Rosen worked 4 BP OIL And 4 Bush in Iraq writing laws @CNN FULL of Establishment .',
  'Mary Matalin working the desk on @CNN tonight. I know lots of you tweeps dont like her but I think I will stick with her tonight.',
  'I feel for at dana bash on @cnn - no news yet, so gotta fill some time …',
  'Florida teen shooting by watchman questioned http://bit.ly/wZAy21 (via @cnn) @ilucascentral',
  '.@CNN: HOLY CRAP #JEFFCO HAS THE MOST PEOPLE! PEOPLE EQUAL VOTES! THAT MEANS CANDIDATES LIKE TO WIN #JEFFCO! #FAIL #ALprimary #ALpolitics',
  '@CNN @MarchMadness … and all the news is… CNN',
  'Daily Kos: Arizona out-crazies other contraception bills. Use birth control, get fired. http://www.dailykos.com/story/2012/03/13/1074068/-@abc @nbc @cbs @cnn',
  'I suppose this a good thing for those of us with small apartments: http://money.cnn.com/2012/03/13/technology/encyclopedia-britannica-books/index.htm The digital #books revolution continues… @cnn',
  '@GreeterDan feel free to nab my pic of the @CNN grill from my @radar post on #SXSW last year Daniel Terdiman',
  '@IndyEnigma @CNN @Soledad_OBrien WAAAAAHHHH! Stop tweeting her, Indy!'  
];

var germanTweets = [
  '@Ernst_Crameri - Gibt es auch eine Adresse, von Ihnen, unter Facebook? Meine Adresse lautet: facebook.com/Clubmembers - Liebe Grüße vom DiDi',
  '21.11.2011 - Mein heutiger Direkt-Link, in die Live-Sendung (JAZZ-Musik, im Hintergrund), mit Admin, DiDi, unter j-tv.me/vnIx8n --',
  'Hier präsentieren wir Ihnen Gruppen, unserer Mitglieder, von A bis Z, unter http://Groups-A-to-Z.social-network-worldwide.com',
  'Die Domain http://www.DJ-Suchmaschine.de ist online - (DJANE and DJ) - The domain http://www.DJ-Suchmaschine.de is online-GOOD ENTERTAINMENT',
  'http://www.youtube.com/watch?v=Uw5AajrlWzI - Streng Geheim - Top Secret - Community under http://Top-Secret.social-network-worldwide.com',
  'Joyce Fosuah - Africas next Top Model - Fotos und Kontakt under http://vip-model-international.mixxt.com/networks/images/album.56033#images',
  'Im Moment, bin ich am Arbeiten, unter http://www.Social-Network-Worldwide.com und LIVE erreichbar, unter http://justin.tv/VIP_TV LG v. DiDi',
  'Schau mal rein, unter http://German-Tweets.social-network-worldwide.com - Dort kann JEDER GRATIS & KOSTENLOS Werbung machen. VIEL ERFOLG !!',
  'Bei manchen Posts merkt man, wer ein wahrer Freund, bei Twitter, ist. - Admin, ebenso, unter http://www.International-Social-Network.com',
  'Betrachte dieses Video und dann dein eigenes Leben!!! - Nick Vujicic - VIDEO unter http://www.youtube.com/user/ABCDatenbank',
  'Unsere weltweiten Communitys, unter http://German-Tweets.Social-Network-Worldwide.com , präsentieren sich im neuen Update. Viel Erfolg .....',
  'Diskutieren Sie mit unter http://on.fb.me/gFbVpJ , bei verschiedenen Themen, " von A bis Z ", plus Homepages',
  'GESEGNETE WEIHNACHTEN und ein GESUNDES Jahr 2011. Ich wünsche ALLEN das zurück, was Sie mir wünschen. Liebe Grüße - http://bit.ly/ftJcFY',
  'Kennen Sie schon unsere Gruppe " Words-Database " bei Facebook unter http://on.fb.me/c4XdpI - Eine Datenbank für Begriffe und Wörter.',
  'Mithilfe von http://surfer-tausch.club-card.net können Sie kostenlos Ihre Links promoten u. Sie erhalten ohne viel Aufwand tausende Besucher',
  'Unsere Community "German-Tweets" unter http://German-Tweets.social-network-worldwide.com ist größtenteils fertig programmiert. VIEL ERFOLG',
  'Unter http://Midlife-Blues.VIP-Radio.eu/ präsentieren wir Ihnen einen Künstler mit dem Style "Folk, Blues, Spacemusic, Liedermacher ".',
  'Words-Database ist bei Facebook unter http://bit.ly/c4XdpI erreichbar - Words Database is accessible on Facebook under http://bit.ly/c4XdpI',
  'Es gibt Menschen da hätten die Eltern ruhig verhüten können -.- share.golikeus.net/357260 via @GoLikeUs',
  'Diskutieren auch Sie mit unter http://Verkaufte-Kinder.woerter-datenbank.de , in der Datenbank " Top Secret - Streng geheim ".',
  'Diskutieren auch Sie mit unter http://bit.ly/cYYDSt , bei dem Thema " Freie Energie und Levitation ", plus Homepages',
  'Absoluter Geheimtipp für das “Personal” der BRD. Interessante Informationen und Video unter http://bit.ly/duIhU0 - Empfehlung LESENSWERT -',
  'Haha, das müsst Ihr Euch alle anschauen. Viel Spaß damit ;-) http://fb.me/C0l37Hcc',
  'Diskutieren auch Sie mit unter http://bit.ly/aguTpm , bei dem Thema " Bundesrepublik Deutschland - Finanzagentur ", plus Homepages',
  '@Jobangebote24 Unter http://www.Aktion-Arbeit.com können Sie auch KOSTENLOS Ihre Suchanfragen hinterlassen. VIEL ERFOLG damit ....',
  '@Hunalehre Kennen Sie schon die logoistischen Wissenschaften ? Mehr INFOS unter http://logoistische-Wissenschaft.club-card.net',
  'Sollte Ihr PC-Bildschirm mal von INNEN her schmutzig sein? Unter http://Bildschirm-Reinigung.club-card.net haben wir eventuell die Lösung!',
  'Meine eigenen, über 24.000 Domains, werden Step by Step unter http://Domains.grey-network.com eingetragen. Liebe Grüße vom Admin DiDi',
  'Hier unter http://bit.ly/brtDAg erhalten Sie von mir Hintergrundwissen zum Thema GEHIRNTRANSMITTER, mittels privater Vorlesung.',
  'Unsere Community unter http://MeeSales.Social-Network-Worldwide.com und die neue Plattform unter http://www.Mee-Sales.com sind aktualisiert.',
  'Über den Datenschutz; kann ich nur lachen. Meine Meinung darüber finden Sie unter http://bit.ly/csLzgT - (Tipp: http://www.Artikel-19.info )',
  'Hier unter http://www.onlinewahn.de/uhr.htm hab ich was gefunden zum Thema Urheberrechte. Gute Unterhaltung ..... :-)',
  'TOP-SECRET ... Freut euch auf das neue Jahr 2011. In das Internet dann nur noch mit dem neuen PERSONALausweis möglich ... HAPPY NEW YEAR ...',
  'Habe ein Geschenk an euch ALLE - Unter http://Barry-White.VIP-Club-Card.com könnt Ihr gemeinsam mit einer Legende träumen. GUTE UNTERHALTUNG',
  'In dieser Community unter http://DJ-Network.Social-Network-Worldwide.com präsentieren sich DJs und Musiker plus GEMAfreie Musik zum Download',
  'Dieses Video, unter http://bit.ly/arxsjv (Auto - Sex), ist was zum Ablachen - Wuensche allen Tweetern gute Unterhaltung ..... :-)',
  '"George Orwell - 2010" - INFO unter http://bit.ly/cXgx0y - Elektronische Transmitter in Tabletten ... Medikamenteneinnahme überwachen ...',
  '"Jetzt wirds lustig" - INFO unter http://bit.ly/cu5P2q - 31.000 Londoner Polizisten bekamen im Jahr 2008 Mikrochips zur totalen Überwachung',
  'Models & Dressmens u. solche die es werden wollen präsentieren sich unter http://Model.VIP-Model-International.com von ihrer schönsten Seite',
  'TIPP unter http://www.words-search.com - Begriffe und Woerter mit deren Beschreibung plus interessante Diskussionen - Eine Art Woerter-Wiki',
  'Hey TRANCE-Musikliebhaber-Habe hier unter http://bit.ly/7CqftQ geile Mucke. Als Hintergrundmusik beim Surfen nur das Beste.GUTE UNTERHALTUNG',
  'In einer Szene ( http://bit.ly/9QqoaR ), ähnlich der in dem Film "Avatar" richtet Jo Conrad eine Botschaft an die Hintergrundmächte der Welt',
  '@twitt_erfolg_de Danke für den Link und das nette Telefongespräch. Habe die Kontaktanfrage bei Xing bestätigt. Wünsche eine geruhsame Nacht.',
  'Wenn Ihr wissen wollt wie ich aussehe: Unter http://www.Kino.to "Viel Rauch um Nichts" eingeben. Der Bärtige könnte dann ich sein ... :-)',
  'Damit ich ein wenig warm werde, zum Arbeiten, brauch ich natürlich abgefahrene Musik unter http://bit.ly/bblIRk - Gute Unterhaltung damit',
  'Werd mal wieder ein paar geile Videos hochladen unter http://German-Tweets.social-network-worldwide.com Gute Unterhaltung damit, euer Admin',
  'So, mein Tag beginnt jetzt mal... oder soll ich Nacht sagen?... lol... Ja, ja, die Programmierer sind schon ein komisches Volk .... :-)',
  'Ist der EURO schon tot ? Hoch lebe der neue Personalausweis ... unser neues Bezahlsystem der Zukunft ... In diesem Sinne ... Gute Nacht ....',
  'JOB gesucht ? JOB zu vergeben ? Unter http://bit.ly/CimPt können Sie Kleinanzeigen Kostenlos aufgeben; zum Suchen, Finden und mitdiskutieren',
  'Kampfsport mal etwas anders :-) - Lachen Sie mal unter http://bit.ly/a4fTJI so richtig was ab. VIEL SPASS mit diesem Video .... lol ....',
  'Der Toplink bei redir.ec ist heute meiner: http://redir.ec/Asche Danke für die vielen Retweets',
  '“@tagesschau: Deutsche werfen zu viel Essen weg http://bit.ly/A3YSvm” @Yelliorange',
  '@tagesschau “Isch geh nach Hause” ist aber eine Präposition zu viel für #Kiezdeutsch Frau Slomka #Tagesthemen Isch geh Bett',
  '@tagesschau herauf? Endlich mal gute Nachrichten für die Griechen. Die haben die Krise gemeistert :)',
  '“@tagesschau: Rot-grüner Minderheitsregierung in NRW droht vorzeitiges Aus http://bit.ly/xcdIs2”Wenn wem was droht, dann wohl der FDP…',
  'dann wird ja jetzt alles gut ♻ @tagesschau: #Fitch stuft Kredit-Rating Griechenlands herauf http://t … http://parlementum.net/notice/1434801',
  'Werden sich @tagesschau + @ZDF rechtzeitig Ihrer Verantwortung bewußt? http://www.youtube.com/watch?v=gOEwAMt7w_U http://bueso.de/node/5495 #Iran #Syrien #Deutschland',
  'Schäuble und der schwedische Finanzminister in der @tagesschau COOL',
  ':( “@tagesschau Wowereit räumt kostenlose Flüge im Privatjet ein http://bit.ly/wSIzuQ”',
  '“@tagesschau Fitch stuft Kredit-Rating Griechenlands herauf http://bit.ly/yHQJs6”',
  'Au wei, ob das der #Wowi politisch überlebt?? “@tagesschau: #Wowereit räumt kostenlose Flüge im Privatjet ein http://bit.ly/wSIzuQ”',
  'Wowereit räumt kostenlose Privatjet-Flüge ein (via @tagesschau) - Auf ihr Medien, metzelt ihn nieder!',
  'Ohne darf es keinen Fiskalpakt geben.."@tagesschau: EU legt Pläne für Finanztransaktionssteuer auf Eis http://bit.ly/zcfGXQ"',
  '@tagesschau Und ganz nebenbei haben sie auch ein paar Leben gekostet und drücken den Hinterbliebenen aufs Gemüt. Aber gut die Prios zu sehen',
  'via @tagesschau: Die Ministerin sollte das Metier wechseln und in einer Kochshow auftreten.',
  '“@tagesschau: Costa-Reederei steht das Wasser bis zum Hals http://bit.ly/AdD2EJ” was für ein peinliches Wortspiel!!! Oh man ey!',
  '“@tagesschau: Schlusslicht: Wenn der Sensenmann nichts mehr zu melden hat http://bit.ly/yM1Vux” die spinnen, die Römer',
  'Sehr interessant! “@DanielDagan: @guehart @tagesschau Darum provoziert Iran Beshcuss Israel http://goo.gl/nc9Jv”',
  '@tagesschau schon unglaublich, wie lange sowas dauert…',
  'War da im Sommer, da findet man wirklich alles! “@tagesschau: Leipzig feiert 100 Jahre Deutsche Nationalbibliothek http://bit.ly/xZNSn7”',
  '@tagesschau bleibt die Frage, ob auf die Gehaltserhöhung der personalabbau folgt, wäre logisch und stimmig',
  '♻ @tagesschau: #Assad lässt am 7. Mai ein neues Parlament wählen http://bit.ly/xYIjow #Syrien #Wahlen',
  'Nennt man wohl “Sprach-Korrektur” @Tagesschau LOL #schmeissen #werfen',
  'Die @tagesschau ringt nach/um Worte… :﻿-﻿) ‬‬‬#tagesschau‪‪‪ http://pic.twitter.com/ABsYsaI8',
  '@SpiritRider1 Be lucky -you don’t watch the German news @tagesschau. You would think they live on a different planet! #Israelunderfire',
  '“@tagesschau: Deutsche schmeißen zu viel Essen weg http://bit.ly/A3YSvm” die Niederländer gefühlt noch viel mehr!',
  'Was ist mit der app der @tagesschau los - oder ist es mein Internet? http://pic.twitter.com/nCBhCcQl',
  '@tagesschau Schon gesehen? Ihr seid nominiert bei den MobileTech Awards, Kategorie Crossover-Apps: http://bit.ly/A7QVVX',
  '@tagesschau Sarkozy sollte sich im Klaren sein, dass er, wie jeder andere Mensch auf der Welt, fast überall Ausländer ist!',
  '@tagesschau Im Beitrag werden Flusswasser-Proben genommen u mit Trinkwasser gleich gesetzt! Das ist nicht korrekt! Was sagt der BDEW?',
  '"@tagesschau: Experten bezweifeln Sauberkeit des deutschen Trinkwassers http://bit.ly/w9Xuw4"',
  '"@tagesschau: Öffentlicher Dienst: Verhandlungen werden fortgesetzt http://bit.ly/zDxXmJ"',
  '“@tagesschau: Toter bei Brandanschlag auf Brüsseler Moschee http://bit.ly/wYMAZV”',
  '“@tagesschau: ARD: NPD-Spitzenpolitiker war eng mit NSU-Terrorzelle vernetzt http://bit.ly/z2uT3X”',
  '@tagesschau Sarkozy überholt Hollande 28.5% gegen 27% (IFOP)',
  '@tagesschau Wenn ich d. richtig verstehe, entläßt man Tausende u.d. Staatsausgaben zu senken. Hm, von Was sollen sie leben? merken wir was?',
  '!!! “@tagesschau: ARD: NPD-Spitzenpolitiker war eng mit NSU-Terrorzelle vernetzt http://bit.ly/z2uT3X',
  'Treffender wohl: “Röttgen nach 2,5 Jahren erstmals in Asse.” “@tagesschau: “Röttgen: Atommüll schnellstens raus hier” http://bit.ly/wyPMx5”',
  '@tagesschau Newsletter mal wieder mit zerschossenen Umlauten auf dem iPad :﻿-﻿(',
  'gleich kommt die @tagesschau (: juhuuu :D',
  '“@tagesschau: Luftfahrt-Lobby macht Druck gegen Emissionshandel http://bit.ly/Aaa2Ow” #lobbyismus #antidemokraten',
  'Das ging flott nach der Immunitätsaufhebung. “@tagesschau: Maschmeyer-Erpresser zu zweieinhalb Jahren Haft verurteilt http://bit.ly/xKRMSF”',
  'Welttag gegen #Internetzensur auch Thema in der @tagesschau:mit MatthiasSpielkamp & der Chefredakteurin von @uznews_net http://bit.ly/wuvp3E',
  '@tagesschau Doch wohin mit dem Müll? Dieses Zeug wird man zur #Zeit nirgends richtig und vor allem #SICHER lagern können.',
  '“@tagesschau: “Reporter ohne Grenzen” beklagen zunehmende Internetzensur http://bit.ly/wHJ0vJ”',
  'Welttag gegen #Internetzensur: #ROG veröffentlicht Liste der “Feinde des Internets” http://www.tagesschau.de/multimedia/video/sendungsbeitrag161706_res-flash256.html @ReporterOG @tagesschau',
  '@tagesschau Lasst Euch von den Verlegern nicht bedrängen. Das Online-Angebot ist für mich der Grund GEZ zu zahlen. Bitte weiter ausbauen!',
  'Also wer bei der @tagesschau so alles im Schlusslicht schreiben darf… #qualitätsjournalismus',
  'Und den ganzen Bundestag rein dafür? Ok. “@tagesschau: Röttgen in der Asse: “Atommüll schnellstens raus hier” http://bit.ly/wyPMx5”',
  '@red_hardliner -> Schulsystem, ist das nicht “Länder-Sache” ? -> @tagesschau',
  'Aber laut #SchwarzGelb ist doch alles gut! Bin verwirrt. “@tagesschau: Studie: Schlechtes Zeugnis fürs #Schulsystem http://bit.ly/ymDsJB”',
  '@AnkeJulieMartin @tagesschau Würdest du dich wehren, wenn jemand deine Heimat besetzt oder würdest du tatenlos zusehen?',
  'Werden sich @tagesschau + @ZDF rechtzeitig Ihrer Verantwortung bewußt? http://www.youtube.com/watch?v=gOEwAMt7w_U http://bueso.de/node/5495 #Iran #Syrien #Deutschland',
  '@tagesschau „proftieren” gibt es nicht. Achtet mal ein bisschen mehr auf Eure Rechtschreibung. Dem seligen Werner Veigel zuliebe.',
  'Nicht das Handwerk, sondern die Chefs! “@tagesschau: Handwerk proftierte 2011 kräftig vom Wirtschaftswachstum http://bit.ly/x4CTyg”',
  'Interessanter Artikel der @Tagesschau http://tinyurl.com/8xexso8: 111 Jahre alter #Dickens-Film entdeckt',
  'Interessanter Artikel der @Tagesschau http://tinyurl.com/75krm7q: Röttgen besichtigt Atommülllager #Asse',
  'Werden sich @tagesschau + @ZDF rechtzeitig über Ihre Verantwortung bewußt? http://www.youtube.com/watch?v=gOEwAMt7w_U http://bueso.de/node/5495 #Nachrichten #deutsch',
  'Werden sich @tagesschau und @ZDF rechtzeitig über Ihre Verantwortung bewußt? http://www.youtube.com/watch?v=gOEwAMt7w_U http://bueso.de/node/5495 #Deutschland #Iran',
  '#Röttgen sieht deutsche #Energiewende als Vorbild - #Atomausstieg @tagesschau http://bit.ly/zYKzJj',
  '@tagesschau Sensation: die Tagesschau ist mit dem melden einer Neuigkeit nur einen Tag im Rückstand!',
  '@tagesschau Und da fragt man sich ernsthaft woher das kommt, nachdem nach #PISA alle bewährten #Schulsysteme verhunzt wurden?',
  '“@tagesschau: “Chancenspiegel”: Bildungswirrwarr im föderalen System http://bit.ly/zTmqwg” --> Armes Deutschland #fail',
  '@guehart @tagesschau #Israel #schurkenstaat',
  '"@tagesschau: Röttgen besucht Atommülllager Asse http://bit.ly/AjVI3G"',
  '"@tagesschau: Gewalt im Gazastreifen: Netanjahu beschuldigt den Iran http://bit.ly/x6Q3TC"',
  '"@tagesschau: Kanzerlin Merkel besucht Bundeswehr in Afghanistan http://bit.ly/wiTmcx"',
  'Der #Netanjahu ist ein elender Kriegstreiber “@tagesschau: Gewalt im Gazastreifen: Netanjahu beschuldigt den Iran http://bit.ly/x6Q3TC”',
  '“@tagesschau: Stichwahl um Oberbürgermeisteramt in Frankfurt http://bit.ly/wFWE0Q” - na dann in 2 Wochen auf ein Neues',
  'noch eins??? “@tagesschau: Röttgen hält eigenständiges Energieministerium für denkbar http://bit.ly/xXy3ek”',
  '@noXforU @tagesschau @bootboss - Sarkozy droht mit dem, was sich Merkel noch heimlich wünscht.',
  '“@tagesschau: Röttgen hält eigenständiges Energieministerium für denkbar http://bit.ly/xXy3ek”',
  'Wer sich \'Glaube, Treue, Heimat\' auf die Fahnen schreibt… “@tagesschau: Schützenverband verbannt schwule Königspaare http://bit.ly/yxSvGi”',
  '@tagesschau einfach nur schlecht…',
  '“@tagesschau: Markus Lanz moderiert “Wetten, dass..?” was kommt als nächstes? Deutschland sucht den Superlanz? Lanz Dance? Dachungellanz?',
  '@flo_wi @tagesschau oh. das nennt mensch umgangssprachlich: failjan.',
  '@spektrallinie @tagesschau Das läuft doch im zweiten, oder? Bin mir aber grad auch nicht sicher… Ich guck das seit Jahren nicht mehr..',
  '@tagesschau twittert über Lanz und Wetten Das… wo leben wir eigentlich… war mal ne Nachrichtensendung',
  'schützen nein danke “@tagesschau: Schützenverband verbannt schwule Königspaare http://bit.ly/yxSvGi”',
  '@tagesschau Willkommen im 21. Jahrhundert…. traurig.'  
];

var frenchTweets = [
  'Présidentielle 2007 : Kadhafi aurait financé Sarkozy http://www.mediapart.fr/journal/international/120312/presidentielle-2007-kadhafi-aurait-finance-sarkozy via @mediapart',
  'RT @Phildp: L\'escalier qui bibliothèque: Une certaine idée de la France - bit.ly/xoIUF8',
  'pinterest.com/pin/7205766275… "Selon la note, le financement libyen prévu s’élevait au total à 50 millions d’euros. Et les opérations financières...',
  '[Vidéo] Présentation des rapports sur la sécurisation et les évolutions du baccalauréat : dai.ly/wCVBzu #bac',
  'Discours d’Eva Joly à Alizay sur le Pacte écologique pour l’emploi bit.ly/zz4caN #joly #eelv #emploi',
  '17H Eurexpo @romainbgb Tous à Lyon alors Caroline :) cc .@Jeunesactifs69 @romainbgb @sarah_jctr @florencedesruol @xavierberujon @KMartenon',
  'En mairie où je viens de présenter à la presse le Ludopole qui ouvrira au pôle de culture et de loisirs de @Lyon_Confluence le 4 avril #lyon',
  'découvre le dispositif de prévention de l’échec précoce en lecture "Coup de Pouce Clé" à l\'école des Clairs-Bassins à La Charité sur Loire',
  'La nouvelle tranche d’impôt voulue par Hollande, un geste... symbolique lutte-ouvriere.org/notre-actualit…',
  '@delevoye Bon débat avec @bayrou @UFCquechoisir !',
  'RT @delevoye En route pour un débat au #Modem avec @bayrou , Martin Hirsch et Alain Bazot de @UFCquechoisir',
  'En route pour un débat au #Modem avec @bayrou , Martin Hirsch et Alain Bazot de @UFCquechoisir',
  '#waterforum6 Pour @JeanLeonetti, il faut transformer le #PNUE en #OME (Organisation mondiale de l\'environnement)',
  'Meeting de campagne en soutien à #Bayrou ce soir 20h30 au 22 rue de la Belle Feuille (Centre George Gorce, salle n°6) à Boulogne-Billancourt',
  'jurassic park :) RT @carolinedescham:Si vs êtes fan de préhistoire et k vous voulez voir des dinosaures de la toile bit.ly/yc2CYd',
  '"On considère le chef d\'entreprise comme l\'homme à abattre ou une vache à traire,peu voient en lui le cheval qui tire le char" W. Churchill',
  'Présidentielle: pour une procuration à #Issy-les-Moulineaux, contactez-moi : okan.germiyan@yahoo.fr #Bayrou',
  'RT @nousbayrou : François @Bayrou rencontre les lecteurs de Métro, en Une mercredi! instagr.am/p/IE7-2_goxk/ #Bayrou',
  'À 17h au QG de campagne, dialogue autour des associations avec Martin Hirsch, Jean-Paul Delevoye et Alain Bazot is.gd/CjvrZW',
  'RDV le 29 mars 19h à l\'Hôtel de ville de #Beauvais pour une grande réunion publique sur le Pont de Paris. Pour tout savoir, venez nombreux!',
  '#Paris, 4ème ville la plus compétitive au monde, selon cette étude : bit.ly/yNbl0q',
  'Al Jazeera pique le championnat d\'Espagne à Canal + http://20min.fr/a/897333 via @20minutes',
  'Quand les employeurs demandent à voir les profils Facebook en entretien — 20minutes.fr http://www.20minutes.fr/web/897233-quand-employeurs-demandent-voir-profils-facebook-entretien/ via @20minutes',
  'Auchan va tester un magasin bio et développement durable http://20min.fr/a/897191 via @20minutes',
  'RT @20minutes Comment développer Paris sans grignoter sur la nature ? http://ht.ly/9Dpgm',
  'NEW YORK - Wall Street en hausse, optimiste avant la Fed http://20min.fr/a/897145 via @20minutes',
  'De la conception à la naissance, une vidéo retrace une grossesse en 1min30 http://20min.fr/a/896289 via @20minutes',
  'Si tas envie de tâter le haut niveau, @20minutes cherche un stagiaire sport juin juillet août. Convention de stage indispensable.',
  'question mentale “@20minutes: Indice UEFA: la France toujours sous la menace du Portugal http://bit.ly/xkydGA”',
  'La plupart des banques américaines parées pour une nouvelle crise http://20min.fr/a/897411 via @20minutes',
  'Les Américains approuveraient une intervention en Iran en cas de preuves sur l\'arme nucléaire http://20min.fr/a/897425 via @20minutes',
  'Sarkozy/Hollande: Pourquoi les sondages ne sont pas sur la même longueur d\'ondes — 20minutes.fr http://www.20minutes.fr/presidentielle/897371-sarkozyhollande-pourquoi-sondages-longueur-ondes/ via @20minutes',
  'Le procureur de #Nice06 poursuit un préfet — 20minutes.fr http://www.20minutes.fr/bordeaux/897377-prefet-securite-sud-ouest-poursuivi/ via @20minutes',
  'Quand les employeurs demandent à voir les profils Facebook en entretien http://bit.ly/x9sATJ v/ @20minutes',
  '«Tourette’s Superstar»: La «Nouvelle Star» version syndrome de la Tourette — 20minutes.fr http://www.20minutes.fr/television/897211-tourette-superstar-nouvelle-star-version-syndrome-tourette/ via @20minutes',
  'PARIS - Présidentielle: la CGT appelle à voter pour un changement et contre Nicolas Sarkozy http://20min.fr/a/897229 via @20minutes',
  'Ça me fait toujours aussi peuuuuur… RT @itsEdrOck: #AffaireJogging RT @20minutes: Une joggeuse (cont) http://tl.gd/gdl1gt',
  'Nous ne sommes pas, nous, dans une paranoïa, nous ne pensons pas qu’il y a un complot ourdi contre nous. http://20min.fr/a/897267 via @20minutes',
  'Le taureau Jocko Besne est mort à Blain, laissant orphelines “entre 300 et 400 000 vaches laitières” http://20min.fr/a/897383 via @20minutes',
  'Quand les employeurs demandent à voir les profils Facebook en entretien http://20min.fr/a/897233 via @20minutes',
  'RT @hialktounet: #LOSC Impressionnant l\'intérieur du Grand Stade sur cette photo http://20min.fr/a/896817 via @20minutes',
  'Un soldat US massacre 16 civils en Afghanistan — 20minutes.fr http://www.20minutes.fr/monde/896501-tout-comprendre-massacre-16-civils-survenu-afghanistan/ via @20minutes',
  'Comme quoi on peut être ni prophète en son pays ni en dehors … http://20min.fr/a/894881 via @20minutes',
  'RT @AnaelleGrondin: Orelsan en LIVE dans le studio de @20minutes http://bit.ly/zTqHIQ',
  'Le féminisme s\'invite dans la campagne avant Journée des droits des femmes http://20min.fr/a/892755 via @20minutes avec photo @labarbelabarbe',
  '2nd tour stable : Hollande 56 vs Sarkozy 44 #Sondage @InstitutCSA @BFMTV @RMCinfo @20minutes http://minu.me/5zqs',
  'Les favoris se détachent: Hollande 30 (+2) Sarkozy 28 (+1) au 1er tour #Sondage @InstitutCSA @BFMTV @RMCinfo @20minutes http://minu.me/5zqs',
  '@madamepeople @20minutes quelle horreur!…..',
  'Retrouvez tous les résultats de La Course 2012 #Sondage @InstitutCSA @BFMTV @RMCinfo @20minutes #Présidentielle http://minu.me/5zqs',
  'Super article sur le @20minutes Lyon sur Eliott, le chien de l\'hôpital gériatrique de Charpennes, à Villeurbanne :)',
  'De 7h à 9h RT @20minutes: La campagne en direct: François Hollande est interrogé sur Europe 1 http://bit.ly/yQnKZU”',
  'Les féministes manifestent pour «balayer les idées reçues» http://20min.fr/a/892945 via @20minutes',
  'BOBIGNY - Un téléphone portable, talisman contre les conjoints violents http://20min.fr/a/892983 via @20minutes',
  'Cinq prétendants obtiennent un score à deux chiffres #Mélenchon #sondage http://20min.fr/a/893035 via @20minutes',
  '@Maskloff @20minutes #Melenchon est + de 15% en réalité !',
  'PARIS - L\'Opéra de Paris encadre la revente de ses billets http://20min.fr/a/893093 via @20minutes',
  'Cinq prétendants obtiennent un score à deux chiffres http://20min.fr/a/893035 via @20minutes',
  'La poupée séduit les adultes http://20min.fr/a/892245 via @20minutes',
  'Sabu, le hacker le plus recherché de la planète, était un père de famille au chômage http://20min.fr/a/892979 via @20minutes',
  'Droit au logement opposable: Il faudrait «un peu plus de volonté politique» http://20min.fr/a/892067 via @20minutes',
  '@20minutes Un activiste français lutte contre la police coréenne pour protéger un rocher http://francereport.net/957',
  'Sabu, le hacker le plus recherché du monde, était un père de famille au chômage http://20min.fr/a/892979 via @20minutes',
  'À signaler que #Mélenchon vient d\'attendre pour la 1ère fois les 10% selon un sondage CSA pour @BFMTV, @20minutes et @RMC',
  'Présidentielle: Nicolas Sarkozy, toujours vu comme le candidat des plus riches http://20min.fr/a/892935 via @20minutes',  
];

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

NaiveBayes.prototype.classify = function(newItem) {
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
  return categoryResults[Math.max.apply(null, keys)];
};


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
