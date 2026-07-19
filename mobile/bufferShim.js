// Minimal Buffer shim for react-native-svg's fetchData util
// The native runtime doesn't include Node's `buffer` module.
// Since we only use inline SVG paths (no URI fetching), this stub is sufficient.

const Buffer = {
  from: () => ({ toString: () => '' }),
};

module.exports = { Buffer };
