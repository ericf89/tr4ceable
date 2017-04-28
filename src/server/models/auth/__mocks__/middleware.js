
export default jest.fn((req = {}, res, next) => next());
export const requiresAdmin = jest.fn((req = {}, res, next) => next());
