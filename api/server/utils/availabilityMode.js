// Availability slots are Online, Offline or Both. A session's modality decides which slots it can use:
//   in_person        -> offline + both
//   video / phone    -> online  + both
//   (nothing given)  -> every slot (old behaviour)
const VALID_MODES = ['online', 'offline', 'both'];

const modesForModality = (modality) => {
  if (!modality) return null;
  return modality === 'in_person' ? ['offline', 'both'] : ['online', 'both'];
};

module.exports = { VALID_MODES, modesForModality };
