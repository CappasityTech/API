const got = require('got');
const assert = require('assert');

const token = process.env.BEARER_TOKEN;
assert(token, 'must pass bearer token via env');

// defines common headers required for the API to work
const authenticatedRequest = got.extend({
    prefixUrl: `https://api.cappasity.com/api`,
    headers: {
        accept: 'application/vnd.api+json',
        authorization: `Bearer ${token}`,
        'content-type': 'application/vnd.api+json',
        'accept-version': '~1',
    },
    http2: true,
    decompress: true,
});

const getIframeCode = async (url) => {
    const { data: { id, attributes: { html } } } = await authenticatedRequest.post('oembed/marketplace', {
        query: {
            url,
        },
        json: {
            data: {
                type: 'embed',
                attributes: {
                    width: 100, // width of iframe, <= 100 will get translated to %, otherwise pixels
                    height: 600, // height of iframe, will be translated to 600px, <= 100 will be in %
                    autorun: true, // Whether to start the player(widget) automatically or display the preview and play button
                    closebutton: false, // Show close button
                    logo: false, // Show Cappasity logo
                    analytics: true, // Enable analytics
                    autorotate: true, // Start automatic rotation
                    // ... any other params as defined in https://github.com/CappasityTech/API#get-embed-code-based-on-sku
                },
            },
        },
    });

    // `id` will contain unique immutable `username/model-id` identifier of a retrieved player
    // `html` will contain complete iframe code for embedding, customized via attributes
    // no verification regarding availability of paid options is performed, this is done each time
    // when actual player is requested to be rendered, please consult regarding availability of player customization options
    // contents of html is a string, example:
    // <iframe allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" width="800" height="600"
    //   frameborder="0" style="border:0;" onmousewheel=""
    //   src="https://api.cappasity.com/api/player/2724daa5-cb68-43f9-8d5a-36be7e06f88d/embedded?autorun=1&closebutton=1&hidecontrols=0&logo=1&hidefullscreen=0" >
    // </iframe>
    return { id, html };
};

(async () => {
    // once again, the process is the following:
    // 1. auth - get Bearer token for your marketplace account
    // 2. request embeddable code with desired params using token for authentication
    // 3. put that code into your HTML

    try {
        const { id, html } = getIframeCode('https://3d.cappasity.com/u/cappasity/2724daa5-cb68-43f9-8d5a-36be7e06f88d');
        // do anything you want with id/html
    } catch (err) {
        // handle potential errors
    }
})();
