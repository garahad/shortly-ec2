const request = require('request');

const rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.getUrlTitle = (url, cb) => {
	request(url, function(err, res, html) {
		if (err) {
			console.log('Error reading url heading: ', err);
			return cb(err);
		} else {
			const tag = /<title>(.*)<\/title>/;
			//이것도 무슨뜻인지 잘 모르겠음. 정규표현식에서 찾는 것인듯.
			const match = html.match(tag);
			const title = match ? match[1] : url;
			return cb(err, title);
		}
	});
};

exports.isValidUrl = url => {
	return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/
