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
      TrackRequest: {
        $: { USERID: uspsConfig.userId },
        TrackID: {
          $: { ID: this.trackingNumber },
        },
      },
    });

    const trackResponse = await request({
      url: config.get('runscopeEnabled') ? uspsConfig.runscopeUrl : uspsConfig.url,
      method: 'GET',
      qs: {
        API: 'TRACKV2',
        XML: xml,
      },
    });

    const {
      TrackResponse: {
        TrackInfo: [{ TrackSummary, TrackDetail }] = [{ TrackSummary: 'Something went wrong.  Try again.' }],
      } = {},
    } = await new Promise(res => xml2js.parseString(trackResponse, (err, parsed) => res(parsed)));

    this.summary = TrackSummary;
    this.details = TrackDetail;
    this.updatedAt = new Date();
  }
}
schema.loadClass(Package);
export default mongoose.model('Package', schema);
