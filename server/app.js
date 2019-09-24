const express = require('express');
// const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cryptoJS = require('crypto-js');

const urls = require('./models').urls;
// const clicks = require('./models').clicks;
const users = require('./models').users;

const utils = require('./modules/utils');

const app = express();
const port = 3001;

//global variable 안 쓰는 방법... session store?? global variable 쓰면 session 쓰는 의미가 없음. session file store나 redis 통해서 무조건 store를 해야 하나? production mode일땐 다른 session storage 써야하는 듯. 저장소 제공하지않아서 여러 유저에선 사용이 안된다... 여기서 혼자 사용할때 저장되는건? storage가 아닌가? storage라는 것은 아마 서버가 껐다가 켜졌을 때를 얘기하는 듯?? nodemon restart...

app.use(
	session({
		secret: '@codestates',
		// secret 값이 공개 안되게는 어떻게 만들지??
	}),
);
//req.session은 이때 생성됨. 모든 요청마다 여기 app.use를 다 한번씩 거쳐간다.
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
	cors({
		// origin: function(origin, callback) {
		// 	return callback(null, true);
		// },
		// optionsSuccessStatus: 200,
		origin: 'http://localhost:3000',
		credentials: true,
	}),
	//credentials가 있으면 Access-Control-Allow-Origin: * 가 안되고 따로 허용하는 애들 특정해줘야 함. 근데 위 code로 되는 이유? credentials에 대해서도 공부 & 특정한 애들만 되게 하는 것에 대해서도 찾아보기. + 여기도 더 간편하게 설정하기.

	// Request with Credential란 HTTP Cookie와 HTTP Authentication 정보를 인식할 수 있게 해주는 요청이라는데 이해 can't
);
// 3000을 등록하는 과정이 필요함.

app.get('/', (req, res) => {
	res.status(200).send('Success'); // OK
});

app.post('/user/signup', (req, res) => {
	//기존에 user가 있으면 그냥 뱉기.

	const { email, username, password } = req.body;
	let ciphertext = cryptoJS.AES.encrypt(password.toString(), email);

	users
		.create({
			email: email,
			username: username,
			password: ciphertext.toString(),
		})
		.then(result => {
			res.status(200).json(result);
		});
});

/**
 * url : /user/signup
 * description : 유저 회원가입
 */

app.post('/user/signin', (req, res) => {
	const { email, password } = req.body;

	users
		.findOne({
			where: {
				email: email,
			},
		})
		.then(result => {
			if (result) {
				const bytes = cryptoJS.AES.decrypt(result.dataValues.password, email);
				const plaintext = bytes.toString(cryptoJS.enc.Utf8);
				// 단방향 hashing으로 변경해줘야 함. salt도 랜덤으로 생성하면 보안에 더 좋음.

				if (password === plaintext) {
					// console.log('11111', result.dataValues);
					return result.dataValues;
				} else {
					res.status(400).send('비밀번호가 틀립니다'); //이거 client 쪽으로 보내야 함. + test case 통과되게 만들어야 함.
				}
			} else {
				res.status(400).send('등록되지 않은 ID 입니다'); //이거 client 쪽으로 보내야
			}
		})
		.then(result => {
			req.session.userid = result.id;
			// 세션에서 정보 수집하는 방식 이렇게 수동으로 ??
			res.status(200).json({ id: result.id });
		})
		.catch(err => {
			console.log(err);
			res.status(500);
		});
});
/**
 * url : /user/signin
 * description : 유저 로그인
 */

app.post('/user/signout', (req, res) => {
	req.session.destroy(err => {
		if (err) {
			return console.log(err);
		}
		// 로그아웃하면 세션 정보 다 지워져야 하고 , 로그인하면 그 로그인한 사람 세션 보관하고 있다가 list 보여주게.
		// 네트워크 탭 쪽에서나 클라이언트 쪽에서 세션에 관한 정보들 읽을 수 있는게 맞나?
		// 클라이언트에 따른게 아니라 로그인 정보에 따라서 세션의 저장, 리셋 등이 이뤄져야... 서버 껐다 킴에 상관 없으려면 session store 따로?

		res.redirect('/');
		//base-url 주소로 보내는게 어디로 보내는거지?
	});
});
/**
 * url : /user/signout
 * description : 유저 로그 아웃
 */

app.get('/user/info', (req, res) => {
	if (req.session.userid) {
		users
			.findOne({
				where: {
					id: req.session.userid,
				},
			})
			.then(result => {
				if (result) {
					res.status(200).json(result.dataValues);
				} else {
					res.status(204);
				}
			})
			.catch(err => {
				res.status(500).send(err);
			});
	} else {
		res.status(400).send('로그인 되지 않은 상태입니다');
	}
});
/**
 * url : /user/info
 * description : 유저 정보
 */

app.get('/links', (req, res) => {
	urls
		.findAll()
		.then(result => {
			// console.log('============', result[0].dataValues);
			if (result) {
				res.status(200).json(result); // OK
				//.json(result)는 모지??
			} else {
				res.sendStatus(204); // No Content..... sendStatus vs status
			}
		})
		.catch(error => {
			console.log(error);
			res.status(500).send(error); // Server error
		});
});

app.post('/links', (req, res) => {
	const { url } = req.body; // const url = req.body.url

	if (!utils.isValidUrl(url)) {
		return res.sendStatus(400); // Bad Request
	}

	utils.getUrlTitle(url, (err, title) => {
		if (err) {
			console.log(err);
			return res.sendStatus(400);
		}

		urls
			.create({
				url: url,
				baseUrl: req.headers.host,
				title: title,
			})
			.then(result => {
				res.status(201).json(result); // Created
				//이렇게 json(result)라고 쓰는 방식에 대해.
			})
			.catch(error => {
				console.log(error);
				res.sendStatus(500); // Server error
			});
	});
});

app.get('/*', (req, res) => {
	urls
		.findOne({
			where: {
				code: req.params[0],
			},
		})
		.then(result => {
			if (result) {
				result.updateAttributes({
					visits: result.visits + 1,
				});
				res.redirect(result.url);
			} else {
				res.sendStatus(204);
			}
		})
		.catch(error => {
			console.log(error);
			res.sendStatus(500);
		});
});

app.set('port', port);
app.listen(app.get('port'));

module.exports = app;

// res.json(user); 이런식으로 server status 숫자 안 보내고, 메세지만 보내도 되는 건가?
// 혹은 res.status(404) 이렇게만 써도 되는건가? res.status(404).end() 이렇게 안 붙이고?

// client 를 3000번 포트에서 띄우는 과정이 어디에??

// 코드 전반적인 돌아가는 것에 대한 이해

// 어떻게 로그인 정보 세션 아이디를 저장하게 되는가 그 부분 설정 --> session store 통해서 redis.

// 세션 아이디로 유저인지 아닌지 확인해줘야하지 않나? ㅡ 세션 아이디로 감별하는거 코드로 어떻게 구현할수있지?

// redux thunk ㅡ orm associate

// HTTP 요청은 기본적으로 Cross-Site HTTP Requests가 가능합니다. 다시 말하면, <img> 태그로 다른 도메인의 이미지 파일을 가져오거나, <link> 태그로 다른 도메인의 CSS를 가져오거나, <script> 태그로 다른 도메인의 JavaScript 라이브러리를 가져오는 것이 모두 가능합니다. 하지만 <script></script>로 둘러싸여 있는 스크립트에서 생성된 Cross-Site HTTP Requests는 Same Origin Policy를 적용 받기 때문에 Cross-Site HTTP Requests가 불가능합니다. 즉, 프로토콜, 호스트명, 포트가 같아야만 요청이 가능합니다. --->  img를 가져오는 거나, http 통해서 가져오는 것에 차이가 나는 이유는???

//development mode일 때는 react dev tools 이용 못 하는 현상

// Advanced Challenges
// Signup을 위한 클라이언트 페이지를 생성하고 회원가입 API를 처리할 수 있도록 개선하세요
// JWT(jsonwebtoken)를 사용하여 클라이언트에서 유저 토큰으로 서버와 상호작용하게 개선하세요
// Url을 해당 url을 저장한 유저 별로 관리할 수있도록 모델과 API, 클라이언트를 개선하세요
// 사용자 지정 오류에 대응 하세요
// 문제가 일어났을 경우 사용자에게 알리는방법을 자유롭게 하여도 좋습니다
// system 오류가 일어났을 때에는 단순히 알려주면 되지만 오류가 아닌 사전에 확인이 가능한오류들(비밀번호 잘못 입력, 잘못된 url 형식, 존재하지 않는 페이지) 등은 사용자가 안내를 보고 수정할 수 있도록 처리해주세요
// 클라이언트 내에 관리되는 모든 state를 Redux에서 관리하세요
// 1분 간격으로 리스트의 정보가 자동적으로 갱신되도록 개선하세요
// 사이트를 여러분의 마음 가는대로 예쁘게 만드세요
// css, scss, styled-component 등 무엇을 이용해도 상관없습니다
