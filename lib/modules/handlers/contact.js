'use strict';

const nconf = require('nconf'),
    nodemailer = require('nodemailer');

const log = require('../services/loggingService'),
    defaults = require('../services/defaults');

// create reusable transporter object using the default SMTP transport 
let transporter = nodemailer.createTransport(nconf.get('email:transport'));

module.exports = {
    post: function(request, reply) {

        // setup e-mail data with unicode symbols 
        let mailOptions = {
            from: '"' + request.payload.name + '" <' + request.payload.email + '>', // sender address 
            to: 'support@whisper.ws', // list of receivers 
            subject: request.payload.subject, // Subject line 
            text: request.payload.message // plaintext body 
        };
        
        // send mail with defined transport object 
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return log.error(error);
            log.info('Message sent: ' + info.response);
        });
        
        return reply.view('contact', { title: 'Contact Us', thanks: true, defaults: defaults}, {layout: 'header'});
    }
}
