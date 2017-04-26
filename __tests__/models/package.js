import supertest from 'supertest';
import request from 'request-promise';
import { server, mongoConnect } from '../../src/server/server';
import User from '../../src/server/models/user/db';

jest.mock('request-promise');

const successXmlFull = `
  <?xml version="1.0" encoding="UTF-8"?>
  <TrackResponse>
      <TrackInfo ID="9405511699000600435229">
          <TrackSummary>Your item has been delivered to the mail room at 1:40 pm on April 22, 2017 in WACO, TX 76706.</TrackSummary>
          <TrackDetail>Out for Delivery, April 22, 2017, 8:03 am, WACO, TX 76706</TrackDetail>
          <TrackDetail>Sorting Complete, April 22, 2017, 7:53 am, WACO, TX 76706</TrackDetail>
          <TrackDetail>Arrived at Post Office, April 22, 2017, 5:33 am, WACO, TX 76706</TrackDetail>
          <TrackDetail>Arrived at USPS Destination Facility, April 22, 2017, 12:36 am, FORT WORTH, TX 76161</TrackDetail>
          <TrackDetail>Departed USPS Facility, April 21, 2017, 8:43 am, WEATHERFORD, TX 76086</TrackDetail>
          <TrackDetail>Arrived at USPS Facility, April 21, 2017, 8:41 am, WEATHERFORD, TX 76086</TrackDetail>
          <TrackDetail>Departed USPS Facility, April 20, 2017, 9:03 pm, FORT WORTH, TX 76161</TrackDetail>
          <TrackDetail>Arrived at USPS Facility, April 20, 2017, 8:14 am, FORT WORTH, TX 76161</TrackDetail>
          <TrackDetail>Departed USPS Facility, April 20, 2017, 3:36 am, AUSTIN, TX 78710</TrackDetail>
          <TrackDetail>Arrived at USPS Facility, April 19, 2017, 11:49 pm, AUSTIN, TX 78710</TrackDetail>
          <TrackDetail>Accepted at USPS Origin Facility, April 19, 2017, 10:34 pm, AUSTIN, TX 78701</TrackDetail>
      </TrackInfo>
  </TrackResponse>
`;

const successXmlPartial = `
  <TrackResponse>
      <TrackInfo ID="9405511699000600435229">
          <TrackSummary>Your item is out for delivery!</TrackSummary>
          <TrackDetail>Departed USPS Facility, April 20, 2017, 9:03 pm, FORT WORTH, TX 76161</TrackDetail>
          <TrackDetail>Arrived at USPS Facility, April 20, 2017, 8:14 am, FORT WORTH, TX 76161</TrackDetail>
          <TrackDetail>Departed USPS Facility, April 20, 2017, 3:36 am, AUSTIN, TX 78710</TrackDetail>
          <TrackDetail>Arrived at USPS Facility, April 19, 2017, 11:49 pm, AUSTIN, TX 78710</TrackDetail>
          <TrackDetail>Accepted at USPS Origin Facility, April 19, 2017, 10:34 pm, AUSTIN, TX 78701</TrackDetail>
      </TrackInfo>
  </TrackResponse>
`;


describe('package', () => {
  let disconnect;
  let user;
  beforeAll(async () => (disconnect = await mongoConnect()));
  beforeEach(async () => {
    await User.find().remove();
    user = await User.create({ email: 'eric@eric.com' });
  });
  afterAll(() => disconnect());

  it('should 201 add/fetch a package when posting a tracking number', async () => {
    request.mockReturnValue(Promise.resolve(successXmlFull));

    const resp = await supertest(server())
      .post(`/api/users/${user.id}/packages`)
      .send({ trackingNumber: '123456' });

    expect(request).toHaveBeenCalled();
    expect(resp.statusCode).toBe(201);
    expect(resp.body.packages && resp.body.packages.length);
    expect(resp.body.packages[0].details).toMatchSnapshot();
    expect(resp.body.packages[0].summary).toMatchSnapshot();
  });

  it('should 200 & gracefully handle a malformed response from usps', async () => {
    request.mockReturnValue(Promise.resolve('<someWeird><xmlJunk></xmlJunk></someWeird>'));

    const resp = await supertest(server())
      .post(`/api/users/${user.id}/packages`)
      .send({ trackingNumber: '123456' });

    expect(request).toHaveBeenCalled();
    expect(resp.statusCode).toBe(201);
    expect(resp.body.packages && resp.body.packages.length);
    expect(resp.body.packages[0]._id).toBeTruthy();
    expect(resp.body.packages[0].summary).toMatchSnapshot();
  });

  it('should 200 update a package when PUT to', async () => {
    request
      .mockReturnValueOnce(Promise.resolve(successXmlPartial))
      .mockReturnValueOnce(Promise.resolve(successXmlFull));
    user.packages.push({ trackingNumber: '9405511699000600435229' });
    const packageId = user.packages[0].id;
    await user.save();

    const userJSON = user.toJSON();
    expect(userJSON.packages[0].details).toEqual([]);
    expect(userJSON.packages[0].summary).toBe(undefined);

    let resp = await supertest(server())
      .put(`/api/users/${user.id}/packages/${packageId}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.details).toMatchSnapshot();
    expect(resp.body.summary).toMatchSnapshot();

    resp = await supertest(server())
      .put(`/api/users/${user.id}/packages/${packageId}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.details).toMatchSnapshot();
    expect(resp.body.summary).toMatchSnapshot();
  });

  it('should 404 if PUT to a nonexistent package', async () => {
    const { body, statusCode } = await supertest(server())
      .put(`/api/users/${user.id}/packages/someFakePackaroo`);

    expect(statusCode).toBe(404);
    expect(body).toMatchSnapshot();
  });

  it('should 200 when fetching a specific package by id', async () => {
    user.packages.push({ trackingNumber: '9405511699000600435229' });
    const packageId = user.packages[0].id;
    await user.save();

    const { body, statusCode } = await supertest(server())
      .get(`/api/users/${user.id}/packages/${packageId}`);

    expect(statusCode).toBe(200);
    expect(body._id).toBe(packageId);
    expect(body.summary).toMatchSnapshot();
    expect(body.details).toMatchSnapshot();
  });

  it('should 200 delete package when del to', async () => {
    user.packages.push({ trackingNumber: '9405511699000600435229' });
    const packageId = user.packages[0].id;
    await user.save();

    const resp = await supertest(server())
      .delete(`/api/users/${user.id}/packages/${packageId}`);

    expect(resp.statusCode).toBe(200);
    const updatedUser = User.findById(user.id);
    expect(updatedUser.packages).toBe(undefined);
  });

  it('should 404 when deleting a nonexistent package', async () => {
    const { body, statusCode } = await supertest(server())
      .delete(`/api/users/${user.id}/packages/someFakePackaroo`);

    expect(statusCode).toBe(404);
    expect(body).toMatchSnapshot();
  });
});
