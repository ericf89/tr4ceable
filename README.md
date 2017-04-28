# tr4ceable
###### Description
  This is a small express api server that fetches data from USPS.

###### Prereqs
- Node v7.6+: Won't run on anything lower due to async/await. I use [nvm](https://github.com/creationix/nvm#installation), personally, but any node version/env switch should be fine.
- MongoDB: You'll need this running locally on default ports, though you can add a local.json in the config folder and override the defaults if you have a unique setup. (See the [config](https://www.npmjs.com/package/config) lib.  Love it.)
- npm/yarn: Either should do.

###### Installation
1. `yarn` or `npm install`

You're done! :joy:

###### Useful Commands
- `npm start`  to start
- Tests can be run with `npm test` or `npm run coverage` if you want the coverage output
- The precommit hook should run automatically when you commit.  That'll lint your files and stuff. :ok:  Feel free, to install `eslint` globally if you please, it should pick up th .rcfile

###### :boom: [API Docs](src/server/models/README.md) :boom:

###### Architecture Outline and Approach
On initial approach the problem seems pretty straight forward. The primary model is the User, which may have many packages/tracking numbers. With a document database required, I decided early on just to nest these packages within user object itself; it seemed like the most straight forward approach.

I invested a lot of time up front setting up jest for testing. It turned out to be a little trickier than expected, but I ended up with some e2e tests seem alright.  Once I had the async stuff ironed out, I was able to move pretty fast, especially around basic CRUD stuff. I would like to follow up and more thoroughly test the minutia, but it didn't seem quite worth the effort at this point.

The second twist to the problem was authentication.  The actual spec was a little vague, so I followed up with the 'pm' to try to clarify, and presented a possible approach.  It made sense that users would only be able to see their own PII, and their own packages.  Admins would be the exception, and seemed necessary since the requirements mention an 'lookup by email' query.  I've always liked JWTs because they simplify a lot of the session management stuff you normally run into with authentication, so I decided to go with what I know. This resulted in the following flow for a new user.

1. A client registers by POSTing to the user endpoint with an Email, Password, and optionally a Name and Phone.
1. Once registered, the client POSTs their credentials to /api/auth to receive a JWT.  The JWT encodes their id and their admin status.
1. From that point forward the JWT needs to be included in the authorization header of all further requests. No other resources work with out it.  The format is `Authorization: Bearer <your token>`
1. With their token the user is free to query their own data (/api/users/<userid>), as well as POST to /api/users/<userid>/packages to add a new package to track. 
  - Creating a package is enough to fetch it from USPS.  PUTing to it at (/api/users/<userid>/packages/<packageid>)


. Users have PII such as name, and phone, but we primarily use email to uniquely identify them.

