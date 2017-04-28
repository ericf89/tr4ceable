import Router from 'express-promise-router';

const router = Router();

router.post('/', async (req, res) => {
  const { body: { trackingNumber } = {} } = req;
  if (!trackingNumber) return res.sendStatus(400);
  const user = req.fetchedUser;
  if (!user.packages.some(p => p.trackingNumber === trackingNumber)) {
    user.packages.push({ trackingNumber });
  }
  await user.packages.find(p => p.trackingNumber === trackingNumber).fetchTrackingData();
  user.save();
  return res.status(201).json(user.toJSON());
});

router.get('/', async (req, res) => res.json(req.fetchedUser.toJSON().packages));

router.get('/:packageId', async (req, res) => {
  // Who knew package was a js reserved word? :O
  const parcel = req.fetchedUser.packages.id(req.params.packageId);
  return parcel ? res.json(parcel.toJSON()) : res.sendStatus(404);
});

router.put('/:packageId', async (req, res) => {
  const parcel = req.fetchedUser.packages.id(req.params.packageId);
  if (!parcel) return res.sendStatus(404);
  await parcel.fetchTrackingData();
  await req.fetchedUser.save();
  return res.json(parcel.toJSON());
});

router.delete('/:packageId', async (req, res) => {
  const parcel = req.fetchedUser.packages.id(req.params.packageId);
  if (!parcel) return res.sendStatus(404);
  req.fetchedUser.packages.id(req.params.packageId).remove();
  await req.fetchedUser.save();
  return res.json(req.fetchedUser.toJSON());
});

export default router;
