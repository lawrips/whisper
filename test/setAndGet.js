var should = require('should');

var config = require('./test.json');
if (config.token == '<please_set>') {
    console.log('******* ERROR *******')
    return console.log('please set the token in ./test/test.json to be a valid api key you set in ./config/developers.json');
}

var Whisper = require('whisper-ws')
var whisper = new Whisper(config);
var key;

var mySecret = 'this is a secret';

describe('Test basic setting / getting with whisper', function () {
    it('Set a secret', function (done) {
        whisper.set(mySecret, (err, result) => {
            if (err) console.log(err);
            should.not.exist(err);
            console.log(result);
            key = result.key;
            done();
        })
    });

    it('Get the secret that was set', function (done) {
        whisper.get(key, (err, result) => {
            if (err) console.log(err);
            should.not.exist(err);
            result.secret.should.equal(mySecret);
            console.log(result);
            done();
        })
    });
})
