'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
	sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
	sequelize = new Sequelize(
		config.database,
		config.username,
		config.password,
		config,
	);
}

sequelize.sync();

// 디렉터리 내의 모든 파일을 순회하며 캐싱하는 방식
fs.readdirSync(__dirname)
	.filter(file => {
		return (
			file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
		);
	})
	.forEach(file => {
		const model = sequelize['import'](path.join(__dirname, file));
		db[model.name] = model;
	});

Object.keys(db).forEach(modelName => {
	if (db[modelName].associate) {
		db[modelName].associate(db);
	}
});

// 객체를 편하게 쓰기위해 그냥 다 담아줍니다.??
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

// https://victorydntmd.tistory.com/26 여기 방식 이해하는 데에 좋은 링크.

// sequelize ORM 더 공부해야할듯 - associate 부분 특히. 쓰는 이유 & 방법 등.
