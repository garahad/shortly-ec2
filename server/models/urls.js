'use strict';

const crypto = require('crypto');
//crypto module 찾아보기.

module.exports = (sequelize, DataTypes) => {
	const urls = sequelize.define(
		'urls',
		{
			url: DataTypes.STRING,
			baseUrl: DataTypes.STRING,
			code: DataTypes.STRING,
			title: DataTypes.STRING,
			visits: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
		},
		{
			hooks: {
				afterValidate: (data, options) => {
					var shasum = crypto.createHash('sha1');
					shasum.update(data.url);
					data.code = shasum.digest('hex').slice(0, 5);
				},
			},
			// hooks, afterValidate 이런것 뭔가??
		},
	);

	urls.associate = function(models) {};
	return urls;
};
