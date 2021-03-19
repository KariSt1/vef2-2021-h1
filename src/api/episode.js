import { query, pagedQuery } from '../utils/db.js';

export async function listEpisode(req, res) {
    const { id } = req.params;
  
    const episode = await findById(id);
  
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }
  
    return res.json(episode);
}

export async function newEpisode(req, res) {

}

export async function deleteEpisode(req, res) {

}
