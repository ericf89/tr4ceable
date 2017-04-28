# tr4ceable
##### Description
  This is a small express api server that fetches data from USPS.

##### Prereqs
- Node v7.6+: Won't run on anything lower due to async/await. I use [nvm](https://github.com/creationix/nvm#installation), personally, but any node version/env switch should be fine.
- MongoDB: You'll need this running locally on default ports, though you can add a local.json in the config folder and override the defaults if you have a unique setup. (See the [config](https://www.npmjs.com/package/config) lib.  Love it.)
- npm/yarn: Either should do.

##### Installation
1. `yarn` or `npm install`

You're done! :joy:

##### Useful Commands
- `npm start`  to start
- Tests can be run with `npm test` or `npm run coverage` if you want the coverage output
- The precommit hook should run automatically when you commit.  That'll lint your files and stuff. :ok:  Feel free, to install `eslint` globally if you please, it should pick up th .rcfile

##### :boom: [API Docs](API.md) :boom:

##### Architecture Outline and Approach
I invested a lot of time up front setting up jest for testing. Even before I started, I knew I was going to have a bunch of CRUD endpoints that would be a good candidate for TDD.  It turned out to be a little trickier than expected, but I ended up with some e2e tests that seem seem alright.  Once I had the async stuff ironed out, I was able to move pretty fast, especially around basic CRUD stuff. I would like to follow up and more thoroughly unit test the minutia, but it didn't seem quite worth the effort at the time.

The two most complicated/interesting aspects of the problem  were:
- Authentication/Authorization
- The USPS Integration

###### Auth
The actual spec was a little vague, so I followed up with the 'pm' to try to clarify.  Common sense would dictate users would only be able to see their own PII, along with their own packages.  Admins are the exception, and are able to see everything. The requirements mentioned an 'lookup by email' query, and that doesn't seem like something that should be exposed to just anyone.

I've always liked JWTs because they simplify a lot of the session management stuff you normally run into with authentication. This resulted in the following flow for a new user.

1. A client registers by POSTing to the user endpoint with an Email, Password, and optionally a Name and Phone.
1. Once registered, the client POSTs their credentials to /api/auth to receive a JWT.  The JWT encodes their id and their admin status.
1. From that point forward the JWT needs to be included in the authorization header of all further requests. No other resources work with out it.  The format is `Authorization: Bearer <your token>`
1. With their token the user is free to query their own data (/api/users/<userid>), as well as POST to /api/users/<userid>/packages to add a new package to track.
  - Creating a package is enough to fetch it from USPS.  PUTing to it at (/api/users/<userid>/packages/<packageid>)

###### USPS
The USPS integration was surprisingly straight forward. I was expecting terrible from the government, but they surprised me. It was pretty easy to send my xml request, and equally easy to parse it to json for mongo.


##### Deployment
I currently have this project deployed using Dokku, which keeps things pretty simple as it uses heroku's buildpacks.  There's minor setup initially around making sure a mongo container is running and that it's linked appropriately to the app.

If ths were a code branch in a larger repo, I think it would be pretty safe as it's mostly self contained.  A particular area for care is the user model.  If I was using a preexisting model, I would would definitely regression test other features around it and ensure nothing seems off. Ideally I could launch my service in a test environment were coworkers could hammer on it a while, and make sure it performs as expected. Iterating on the feature branch with QA would allow me to make fixes/tweaks without blocking the entire deploy pipeline.   Once that's cool, we could merge it in and push it up.

As long as mongo is running and the env vars are set right, everything else should just kinda of work.

Rollback could hopefully be avoided,  but if something went wrong it shouldn't be too hard to revert.  Since this is a new project, all of my changes are additive, and should be pretty backwards compatible. It's possible that I could some how corrupt existing models, but hopefully we would find that much earlier on in the test phase, and save ourselves the headache of trying to sanitize or restore the db.  :skull:





