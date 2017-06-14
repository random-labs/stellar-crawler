var StellarCrawler = {
	callback : function(crawler){console.log(crawler.data.toSource())},
	crawler : {
		history: [],
		links: [],
		data: [],
		load: function(json){
			StellarCrawler.crawler.data = json;
			var h = StellarCrawler.crawler.history;
			
			StellarCrawler.crawler.links = (h.length > 2)
				? [{'key' : 'back','link' : h[h.length-2]}]
				: [];
			$.map(json._links, function(value, key) {
				var href = value.href;
				StellarCrawler.crawler.links.push({'key':key,'link' : new StellarCrawler.Link((href.indexOf('{') > 0)?href.substring(0, href.indexOf('{')):href)});
			});
			StellarCrawler.callback(StellarCrawler.crawler);
		},
	},
	Link : function(href){
		this.href = href;
		this.follow = function(){
			var h = StellarCrawler.crawler.history;
			if(h[h.length-2] === this){
				StellarCrawler.crawler.history.pop();
			}else if(h[h.length-1] !== this){
				StellarCrawler.crawler.history.push(this);
			}

			$.get(this.href, function(r){StellarCrawler.crawler.load(r)});
		};
	},
	start : function(publicKey, callback, ispublic){
		var server = (ispublic)?'https://horizon.stellar.org/accounts/':'https://horizon-testnet.stellar.org/accounts/';
		this.callback = callback;
		(new StellarCrawler.Link(server+publicKey)).follow();
	},
};