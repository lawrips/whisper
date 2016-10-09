# Whisper.ws 
**Share once, and only once**.

Whisper.ws is an open source server which allows you to easily and securely share things with people you trust. The service works by you sending any text that you want to share to the whisper.ws server, and in return you'll get back a one-time URL. You can send this one-time URL to a friend, colelague or another device. Once viewed, the content becomes expired and cannot be viewed again. 

A fully managed version of Whisper.ws is hosted up at www.whisper.ws. 

# Features
* Generation of one time URL's to protect user content
* Full responsive front end web site and REST API back end
* Strong encryption of all user content
* Backed by redis for super fast performance 
* Built in throttling (by IP, developer key)
* Slack integration (slack command / bot)
* REST API's & Node.js SDK

## Future
* Support for alternative back end DB's
* Easier setup / installation
* Some cross device scenarios (maybe)
* Native mobile client(s)

This documentation will help you get setup with your own installation.   

# Table of contents
* [Installation](#installation)
* [Configuration](#configuration)
* [API's](#apis)
* [FAQ](#faq)

# <a name="installation"></a>Installation
## Minimum requirements
To run whisper.ws, you'll need:

- Node.js (4.x and 6.x)
- Redis (tested with version 3.2.x)
- git + npm 

## Installation as Node.js app

1. Run "git clone https://github.com/lawrips/whisper.git"
2. Run "cd whisper"
3. Run "npm i"
4. Follow the [configuration steps](#configuration)

## Installation as a Docker app

1. Run "git clone https://github.com/lawrips/whisper.git"
2. Run "cd whisper"
3. Follow the [configuration steps](#configuration)

# <a name="configuration"></a>Configuration

### Step 1. Create config files

Run the following commands:
```
cd config
cp developers.sample.json developers.json
cp development.sample.json development.json
cp production.sample.json production.json
```

### Step 2. Create a developer key for your website

1. Edit the file whisper/config/developers.json
2. Create a random string of characters and replace the value <a_random_key>. This will be the developer key for your website so make it strong / randome
3. Replace the string <your_website> with a name (e.g. "my website")

### Step 3. Setup your development.json file (for local development)

1. Edit the file whisper/config/development.json
2. Edit the entries redis:keyServer, redis:keyServer, redis:throttleServer, redis:configServer to be the location of your redis server. More info [here](#redis). 

### Step 4. Setup your production.json file (for production development)

1. Edit the file whisper/config/development.json
2. Edit the entries redis:keyServer, redis:keyServer, redis:throttleServer, redis:configServer to be the location of your redis server. More info [here](#redis). 
3. Edit the value system:webUrl to be the web address of where you'll be deploying the whisper.ws server

### Step 5. Set environment variables

MacOS:

1. Run "export DEBUG=whisper" (if you want logs - recommended)
2. Run "export NODE_ENV=development" (or NODE_ENV=production for production deployments)
3. Run "export whisper_encryptionPassword=<a_32_char_strong_password>" (where <a_strong_password> is a string of 32 random characters that will be used to encrypt end user data (needs to be 32 characters exactly)
4. Run "export whisper_websiteDeveloperKey=<dev_key_from_step_2>" (where <dev_key_from_step_2> is the developer key you created in step 2 earlier)


### Step 6. Run the server 

You can now run the server:

For a Node.js app:

```
node server.js
```

For a Docker app:
```
docker build -t whisper . 

docker run -it -p 6969:6969 \
-e "NODE_ENV"="development" \
-e "PORT"=6969 \
-e "whisper_websiteDeveloperKey"="<dev_key_from_step_2>" \
-e "whisper_encryptionPassword"="<a_32_char_strong_password>" \
-e "DEBUG"="whisper" \
whisper
```

That's it! You now should be able to access your whisper server. If running in development mode, this will be:

http://localhost:6969

## <a name="redis"></a>Redis configuration details
Currently, whisper.ws requires a redis back end to run. There are four settings that need to be set in the development.json and production.json files:

* redis.keyServer - The redis host / cluster which will store the encryption keys
* redis.secretServer - The redis host / cluster which will store the encrypted secrets
* redis.throttleServer The redis host / cluster which will store throttling information (to prevent ddos, etc)
* redis.configServer - The redis host / cluster which will store config related items (initially just slack)

To start out, it's fine to set the same redis server / cluster for all four of the above configurations.

Whisper.ws uses [ioredis](https://www.npmjs.com/package/ioredis), so settings should be compatible with what ioredis supports. Examples are:

For a single server:

```
{
"redis": {
    "keyServer": {
        "port": 6379,
        "host": "localhost",
        "db": 0
    }
}
```

For a cluster:

```
{
"redis": {
    "keyServer": [{
        "port": 7000,
        "host": "localhost",
        "db": 0
    },
    {
        "port": 7001,
        "host": "localhost",
        "db": 0
    }]    
}
```

### Redis Authentication

It's advisable to configure redis to require a password. While it's possible to put the password in the development.json or production.json files, it's safer to store these as environment variables. The corresponding environment variables for the redis server passwords are:

* "whisper_keyServer_password"
* "whisper_secretServer_password"
* "whisper_throttleServer_password"
* "whisper_configServer_password"

Set these environment variables in order to send a password on connection. For example, if your redis password were "secret", you'd set the following from a MacOS command line:

```
export whisper_keyServer_password=secret
export whisper_secretServer_password=secret
export whisper_throttleServer_password=secret
export whisper_configServer_password=secret
```

In JSON, this would look like:
```
{
    "whisper_keyServer_password":"secret",
    "whisper_secretServer_password":"secret",
    "whisper_throttleServer_password":"secret",
    "whisper_configServer_password":"secret"
}
```

## Customizing content
If you want to provide your own terms and conditions, privacy policy, footer, etc - just create any one of the following files. They must be in the exact location specified below in order to be automatically included:

- /lib/views/custom/footer.html - Included at the bottom of all pages. For example "All Rights Reserved 2016, My Startup, Inc"
- /lib/views/custom/header.html - Included in the header of all pages. This is where you can put things like analytics tracking (e.g. Google analytics javascript)
- /lib/views/custom/notices.html - Included on the main page, just below the textarea where you input your secret. This is where you can put things like "By using this service, you agree to our T&C's"
- /lib/views/custom/privacy.html - Your privacy policy, if you want one to be included
- /lib/views/custom/terms.html - Your T&C's, if you want one to be included

# <a name="apis"></a>API's
## Node.js
The whisper.ws Node.js SDK is available on npm. 

```
npm i --save whisper-ws
```

Documentation can be [found here on npm](https://www.npmjs.com/package/whisper-ws). 

## REST API's
### Authentication
All REST methods require a developer token to be passed in the HTTP header. You can obtain a developer token by emailing us. The header can be passed as follows:
```
Token: <token>
```

## /v1.0/url
### POST /v1.0/url
Submits content to the whisper.ws service for storage / encyrption. Returns a unique, one time URL for viewing the content.

#### Header
POST requests must be in the following format. 
```
POST https://wwww.whisper.ws/v1.0/url
Content-Type: application/json
Token: <token>
```
where <token> is your developer token.

#### Body
The post body must be as follows:
```
{secret: <secret>} 
```
Where <secret> is the content you wish to upload. As an example, to store and encrypt the words "hello world", simply send the following in the post body 
```
{secret: "hello world"}  
```

Note that valid JSON is required, therefore special characters should be escaped. For example, to send a secret of:
```
{"secret":"This is a well written & insightful \"secret\""}
```

would result in the following secret being stored:
```
This is a well written & insightful "secret"
```

#### Response
In response to a successful post, the HTTP response will always contain the following body:
```
{
"key":"<key>", 
"webUrl": "https://www.whisper.ws/i/<key>"
"apiUrl": "https://www.whisper.ws/v1.0/url/<key>"
}
```
where <key> is a one time unique id that can be used to locate the encrypted secret in the POST request. The webUrl parameter can be viewed by end users in a browser to view the secret on www.whisper.ws.
Alternatively, you can also use the apiUrl to view the original secret via a GET request (see next). 

#### Example
The following shows a test secret being posted using CURL:
```
curl -H "token: $token" -X POST -d '{"secret":"hello world"}' https://www.whisper.ws/v1.0/url
```

Which will result in an HTTP response of:
```
HTTP/1.1 201 Created
content-type: application/json; charset=utf-8
cache-control: no-cache
content-length: 124
Date: Thu, 18 Feb 2016 06:35:59 GMT
Connection: keep-alive

{
    "key":"a5F0PbaRqUj1PH4nTtj1H3",
    "webUrl":"https://www.whisper.ws/i/a5F0PbaRqUj1PH4nTtj1H3",
    "apiUrl":"https://www.whisper.ws/v1.0/url/a5F0PbaRqUj1PH4nTtj1H3"
}
``` 

#### Response codes
The following are valid responses codes

| statusCode  | message | 
| ------------- | :-------------: |
| 401 | Incorrect token | 
| 404 | No secret found at this URL | 
| 410 | Expired. Secret already retrieved | 
| 413 | Max content size exceeded | 
| 429 | IP address rate limit exceeded. Try again in a short while | 


### GET /v1.0/url/{key}
Gets the content hidden behind a whisper.ws URL. Whisper.ws URL's may only be viewed once - after which the encrypted content is deleted from the servers and the message is marked as expired. 

#### Header
GET requests must be in the following format: 
```
GET https://wwww.whisper.ws/v1.0/url/<key>
Token: <token>
```
where <token> is your developer token and <key> is the unique key that was returned in the POST body. 

#### Response
In response to a successful GET, the HTTP response will always contain the following body:
```
{
    "secret":<secret>
}
```
where <secret> is the original message that was shared in the POST.

#### Example
The following shows a test secret being posted using CURL:
```
curl -H "token: <token>" https://www.whisper.ws/v1.0/url/<key>
```

Which will result in an HTTP response of:
```
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
cache-control: no-cache
content-length: 63
accept-ranges: bytes
Date: Thu, 18 Feb 2016 06:49:51 GMT
Connection: keep-alive

{
    "secret":"hello world"
}	
``` 

#### Response codes
The following are valid responses codes

| HTTP Response  | Message | Details      |
|-------------|-------------|-------------|
| 200 | Success | Sucessfully retrieved a previously created whisper.ws url| 
| 401 | Unauthorized | Incorrect developer token|
| 410 | Expired | The whisper.ws url has already been read / retrieved|
| 429 | Too Many Requests | Rate limit exceeded for developer token. Either slow down your submission request or contact support for a higher throughput plan | 



# <a name="faq"></a>FAQ
**What is whisper.ws?**
Whisper.ws is a service which makes it quick and easy to securely share things with people you trust. 

**Why did you create it?** 
We found there were many cases where we wanted to quickly share sensitive information with each others but it was hard to do. Email one was one option, but it's generally not a good idea to email very sensitive information over email. Plus, it can stick around forever in the other person's inbox. There are other services, but these can take a while to setup and can be difficult to use. So we created whisper.ws, which makes it easy to upload information, get a one time URL which automatically expires after its been viewed. It's great for sharing stuff with others or even between your own devices, quickly, easily and securely.

**Who is it for?** 
Anyone who wants to share something with someone else. It might be a private message or other information you consider to be sensitive (your birthday, etc). It's also an easy way to share information securely between your own devices (e.g. imagine if you're setting up a new PC and wanted to get information easily from one place to another but didn't want to send the info over email)

**How does it work?**
You submit the information you want to share. We encrypt that data using a very very very hard to guess password and then generate a one time URL. You can then share that one tie URL with the person you want to share the information with. When they click on the link, they can view the data you originally submitted and we delete that encrypted data from our servers.   

**Is it secure?**
Yes. Security is a big deal to us. Whenever you create submit your data, we use strong encryption to encrypt your data. No one at whisper.ws is able to decrypt any of the data on our server.   
