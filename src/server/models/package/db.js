import mongoose from 'mongoose';
import xml2js from 'xml2js';
import request from 'request-promise';
import config from 'config';

const uspsConfig = config.get('usps');

export const schema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
  },
  details: {
    type: [String],
  },
}, { timestamps: true });

class Package {
  async fetchTrackingData() {
    const builder = new xml2js.Builder();
    const xml = builder.buildObject({
      // This syntax does not match the readme on the lib.... But it works!  Thanks internet.
      TrackRequest: {
        $: { USERID: uspsConfig.userId },
        TrackID: {
          $: { ID: this.trackingNumber },
        },
      },
    });
    //  qs is query string.  we send the xml in the query string because 🇺🇸
    const trackResponse = await request({
      url: config.get('runscopeEnabled') ? uspsConfig.runscopeUrl : uspsConfig.url,
      method: 'GET',
      qs: {
        API: 'TRACKV2',
        XML: xml,
      },
    });

    // Parse the response with a healthy amount of defaults to handle the worst cases.  hopefully.
    const {
      TrackResponse: {
        TrackInfo: [{ TrackSummary, TrackDetail }] = [{ TrackSummary: 'Something went wrong.  Try again.' }],
      } = {},
    } = await new Promise(res => xml2js.parseString(trackResponse, (err, parsed) => res(parsed)));

    this.summary = TrackSummary;
    this.details = TrackDetail;
    this.updatedAt = new Date();  // Surprised I have to set this manually. Mongoose doesn't appear to do it for you.
  }
}
schema.loadClass(Package);
export default mongoose.model('Package', schema);
