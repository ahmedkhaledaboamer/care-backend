// Turns a stored file name into a public URL: `${BASE_URL}/<folder>/<file>`.
// Values that are already URLs are returned untouched, so a document that is
// read and saved again never ends up with a nested URL.
const toImageUrl = (folder, value) => {
  if (!value || /^https?:\/\//.test(value)) return value;
  return `${process.env.BASE_URL}/${folder}/${value}`;
};

// Reverse of toImageUrl — keeps only the file name before saving.
const toFileName = (value) => {
  if (!value || !/^https?:\/\//.test(value)) return value;
  return value.slice(value.lastIndexOf('/') + 1);
};

module.exports = { toImageUrl, toFileName };
