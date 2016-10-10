var should = require('should'),
    async = require('async');

var config = require('./test.json');
if (config.token == '<please_set>') {
    console.log('******* ERROR *******')
    return console.log('please set the token in ./test/test.json to be a valid api key you set in ./config/developers.json');
}

var Whisper = require('whisper-ws')
var whisper = new Whisper(config);
var key;

var mySecret = 'this is a secret';

describe('Check all error codes', function () {
    
    it('Request the SDK without a token - confirm 401', function(done) {
        var badWhisper = new Whisper({'token': 'badtoken'});
        badWhisper.get('randomstring', (err, result) => {
            console.log(err);
            should.exist(err);
            err.statusCode.should.be.equal(401);
            done();
        });
    });

    it('Get an unknown whisper - confirm 404', function (done) {
        whisper.get('randomstring', (err, result) => {
            console.log(err);
            should.exist(err);
            err.statusCode.should.be.equal(404);
            done();
        });
    });
            
    it('Get a whisper url twice - confirm expired 410', function (done) {
        // set the whisper
        whisper.set(mySecret, (err, result) => {
            if (err) console.log(err);
            should.not.exist(err);
            
            // get the whisper - should be fine
            whisper.get(result.key, (err, getResult1) => {
                if (err) console.log(err);
                should.not.exist(err);
                getResult1.secret.should.equal(mySecret);
                
                // get the whisper - should be expired
                whisper.get(result.key, (err, getResult2) => {
                    if (err) console.log(err);
                    should.exist(err);
                    err.statusCode.should.be.equal(410);
                    should.not.exist(getResult2);
                    done();
                });
            })
        });        
    });
});
