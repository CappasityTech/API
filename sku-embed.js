const rawRequest = require('request-promise');
const assert = require('assert');

const token = process.env.BEARER_TOKEN;
assert(token, 'must pass bearer token via env');

// defines common headers required for the API to work
const authenticatedRequest = rawRequest.defaults({
  baseUrl: `https://api.cappasity.com/api`,
  headers: {
    accept: 'application/vnd.api+json',
    authorization: `Bearer ${token}`,
    'content-type': 'application/vnd.api+json',
    'accept-version': '~1',
  },
  gzip: true,
  json: true,
});

function generateEmbedCode(SKUorBarcode) {
  return authenticatedRequest({
    method: 'post',
    uri: '/files/embed',
    body: {
      data: {
        // required - id or SKU of the model
        id: SKUorBarcode,
        // required
        type: 'embed',
        // all of these options have defaults and are not required
        attributes: {
          width: 100, // width of iframe, when 100 it will be translated to 100%, cant be less than 100
          height: 600, // height of iframe, will be translated to 600px, cant be less than 100
          autorun: true, // whether to start the player (widget) automatically or display the preview and play button
          autorotate: false, // Start automatic rotation
          closebutton: true, // widget close button
          logo: true, // whether to display cappasity platform logo or not
          hidefullscreen: false, // whether to hide fullscreen button or not
          enableimagezoom: true, // enable zoom mode (if zoom packs exists) 
          zoomquality: 1, // 1 – SD, 2 – HD
          autorotatetime: 12, // rotation time of the full turn: 2.5 – 60 seconds
          autorotatedelay:  , // delay if rotation was interrupted: 1 – 10 seconds
          autorotatedir: 1, // rotation direction: 1 – clockwise, -1 – counter-clockwise     
        },
      },
    },
  })
  .then((body) => {
    // body.data will contain complete iframe code for embedding, customized via attributes
    // no verification regarding availability of paid options is performed, this is done each time
    // when actual player is requested to be rendered, please consult regarding availability of player customization options
    // contents of body.data is a string, example:
    // <iframe allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" width="800" height="600" 
    //   frameborder="0" style="border:0;" onmousewheel="" 
    //   src="https://api.cappasity.com/api/player/<model-id>/embedded?autorun=1&closebutton=1&hidecontrols=0&logo=1&hidefullscreen=0" >
    // </iframe>
    return body.data;
  });
}

// once again, the process is the following:
// 1. auth - get JWT token
// 2. request embeddable code with desired params using JWT token for authentication
// 3. put that code into your HTML
generateEmbedCode('1239172819')
  .then((code) => {
    // do something with the code
  })
  .catch((err) => {
    // if there is no model associated with a SKU - 404 error will be returned.
  });
  
