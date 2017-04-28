# API

This API follows pretty standard REST conventions, so hopefully nothing below is too surprising.

### Public Endpoints (No Auth Required)

- `POST /api/users/`  This creates/registers a new user. The only required fields are:
```
{
  "email": <string>,
  "password": <string>
}
```
You may optionally pass a `name`, and `phone` as well, also strings.

In Response you'll receive your created user object parroted back to you, along with its canonical id
```
{
  "_id": <ObjectId>,
  "email": <string>,
  "password": <string>
}
```
Missing email or password should cause the server to `400`.

- `POST /api/auth` This endpoint takes a username and password of an existing user, and in response returns an auth jwt.
```
{
  "email": <string>,
  "password": <string>
}
```
Resp
```
{
  "token": <string>
}
```
Include the token in the auth header of protected resources to gain access.
Should `400` if missing email/pass, will 401 if incorrect pass or if the user doesn't exist. 

### Protected Endpoints (Send an Auth Header)
For these routes a token is required. The recommended method of attachment is in the auth header of your requests:
`Authorization: Bearer <your token>`

- `/api/users/(:userId)` The users resource.
  - `GET`  Only admins should be able to access the index resource.  Everyone else should `401`.  You may optionally supply a `?email=<emailaddress>` query string to search for a particular email address, or a userId to fetch a particular user.
  - `DELETE`  With an userId only,  admins should be able to delete users.  An empty `200` response will be returned on success.

  - `/api/users/:userId/packages/:packageId` Package resource for querying/updating a users tracked packages.
    - `GET`  For retrieving a particular package when an ID is supplied, or all packages when omitted.
    - `POST`  Post with a body in the format of `{ "trackingNumber": <string> }` to create a package for the user with that tracking number.  You'll receive the full user in response, with its new package. The tracking data will be fetched from usps before you receive a response.
    - `PUT` Put with an empty body to a particular package id to force a refetch from USPS. 
    - `DELETE` Delete a particular package from the user.

