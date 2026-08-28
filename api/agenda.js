import upcomingHandler from './upcoming.js';

export default async function handler(req, res) {
  return upcomingHandler(req, res);
}