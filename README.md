# Documentation for integrating with Cappasity 3D Platform

(c) Copyright 2017-2019, Cappasity Inc. All rights reserved.

## Registering an account and getting an API key

1. Register using https://3d.cappasity.com/register link
2. Complete email verification. If you are using custom domain - email might be a bit slow to come due to "graylisting". However it should arrive soon. If not - check back with us, we'll help.
3. Go to account page - https://3d.cappasity.com/account/security - and create a security token, you will need this for interacting with API. Please securely store it somewhere - you will not be able to see created token again for security reasons

## Uploading 3D View or 3D models

1. Use Easy 3D Scan software to prepare your 3D Views and upload them to Cappasity platform.
2. For ease of integration assign SKU to the models you are uploading - this is a user generated alias, which can be used to programmatically access existing models and generate embeddable iframe code on the go.
3. If you do not assign SKUs right away - it can be done manually through our website interface via "edit model" feature.

## API methods

There are 2 ways to integrate with us - for testing & debugging you might use `embed button`, which will allow you to select different settings, size of the iframe and receive `iframe` code right away. However, when you are working with large amounts of models it might be most convenient to use API to generate iframe code. It won't change unless you change settings - so it's advised to cache it to reduce latency and amount of requests your server is performing.

### Get embed code based on SKU

1. We support gzip, if you want it to work - pass 'Accept-Encoding: gzip', with curl automatically encoding/decoding is performed with `--compressed` options
2. We strive to comply with `http://jsonapi.org/` scheme, and because of that we respond with `application/vnd.api+json` content-type, it's essentially the same as `application/json`, but notifies you that we are following this specification
3. We expect you to send the content in the format of jsonapi, so please, specify `Content-Type: application/vnd.api+json` header
4. This request requires authentication - specify `Authorization: Bearer <your-token>` Header
5. To ensure consistent versions of the API, you can pass an extra header of `Accept-Version: ~1` which would tell that you want to receive response of the version 1 API. In the future if we change something - nothing will break in your integration

This is a sample CURL request for this method. For a more detailed example in javascript, check sku-embed.js sample

```bash
curl -X POST --compressed \
  -H "Content-Type: application/vnd.api+json" \
  -H "Authorization: Bearer hash.token.signature" \
  "https://api.cappasity.com/api/files/embed" \
  -d '{
    "data": {
      "id": "sku2137189",
      "type": "embed",
      "attributes": {
        "width": 100,
        "height": 600,
        "autorun": true,
        "closebutton": true,
        "hidecontrols": false,
        "logo": true,
        "hidefullscreen": false
      }
    }
  }'
```

HTTP response will have statusCode `200` and contain the following JSON data structure in the body:
```json
{
  "meta": {
    "id": "request-id"
  },
  "data": "iframe code"
}
```


Accepted attributes are:

| Parameter           | Type    | Default | Description                                                                               |
|---------------------|---------|---------|-------------------------------------------------------------------------------------------|
| `width`             | integer, >= 100  | 100    | iFrame width, px or %. Treated as `100%` when set at 100, otherwise in px                                                                     |
| `height`            | integer, >= 100  | 600    | iFrame height, px or %. Treated as `100%` when set at 100, otherwise in px                                                                    |
| `autorun`           | boolean | false   | Whether to start the player (widget) automatically or display the preview and play button |
| `closebutton`       | boolean | true    | Show close button                                                                         |
| `logo`              | boolean | true    | Show Cappasity logo                                                                       |
| `analytics`         | boolean | true    | Enable analytics                                                                          |
| `autorotate`        | boolean | false   | Start automatic rotation                                                                  |
| `autorotatetime`    | float   | 10      | Rotation time of the full turn, seconds                                                   |
| `autorotatedelay`   | float   | 2       | Delay if rotation was interrupted, seconds                                                |
| `autorotatedir`     | integer | 1       | Autorotate direction (clockwise is `1`, counter-clockwise is `-1`)                        |
| `hidefullscreen`    | boolean | true    | Hide fullscreen view button                                                               |
| `hideautorotateopt` | boolean | true    | Hide autorotate button                                                                    |
| `hidesettingsbtn`   | boolean | false   | Hide settings button                                                                      |
| `enableimagezoom`   | boolean | true    | Enable zoom                                                                               |
| `zoomquality`       | integer | 1       | Zoom quality (SD is `1`, HD is `2`)                                                       |
| `hidezoomopt`       | boolean | false   | Hide zoom button                                                                          |
| `uipadx`            | integer | 0       | Horizontal (left, right) padding for player UI in pixels                                  |
| `uipady`            | integer | 0       | Vertical (top, bottom) padding for player UI in pixels                                    |
| `enablestoreurl`    | boolean | false   | Whether to enable link to the store page                                                  |
| `storeurl`          | string  | ''      | Link to the store page                                                                    |
| `hidehints`         | boolean | false   | Hide tutorial hints                                                                       |

Use iframe code and insert it into your HTML

### List uploaded files

This method allows to return list of uploaded files and paginate between them. For example, you can get a list of uploaded files between 2 points in time for your user.
Due to database architecture - list of returned models will be internally cached until one of 3 cases happen: last access to list was done
more than 30 seconds ago, model was uploaded or model was deleted. In the future this can change.

Below is description of accepted params:

| Property Type | Property Name   | Default  | Allowed Values   | Example                         | Comments                                                                          |
|---------------|-----------------|----------|------------------|---------------------------------|-------------------------------------------------------------------------------|
| Header        | Authorization   |          |                  | `Authorization: Bearer <token>` | If not specified - will only return public files |
| Header        | Accept-Encoding |          |                  | `Accept-Encoding: gzip`         | If not specified - will return plain text, please use it |
| Header        | Accept-Version  |          |                  | `Accept-Version: ~1`            | If not specified - will use most-recent version on breaking changes, please pin API |
| Query         | pub             |          |             0, 1 | `?pub=0`                        | If authorization header is set & pub=0 - includes private models |
| Query         | order           |      ASC |        ASC, DESC | `?order=DESC`                   | Defaults to ascending |
| Query         | offset          |        0 |     0 < offset   | `?offset=24`                    | Used for paginating |
| Query         | limit           |       12 | 0 < limit <= 100 | `?limit=24`                     | Models per page |
| Query         | filter          | `%7B%7D` |                  | `?filter=%7B%7D`                | Used to filter response |
| Query         | criteria        |       id |                  | `?criteria=uploadedAt`          | Sorts by this field |
| Query         | shallow         |        0 |                  | `?shallow=1`                    | Please set to 1 to reduce traffic. It omits information about uploaded files |
| Query         | owner           |          |                  | `?owner=cappasity`              | For public - can select any customer alias, for private - must supply auth token |
| Query         | embed           |        0 |             0, 1 | `?embed=1`                      | Will render embed.code into embed.html param |
| Query         | embedParams     |   %7B%7D |                  | `?embedParams=%7B%7D`           | Specify override values for embed.code template | 


Most important of all params is filter. To create it use the following function:

```js
function encodeFilter(obj) {
  return encodeURIComponent(JSON.stringify(obj));
}
```

Example:

```js
const filter = encodeFilter({
  uploadedAt: {
    gte: 1486694997327, // miliseconds
    lte: 1487447115708, // miliseconds
  },
});
```

Example request:

```bash
curl -X GET --compressed \
  -H "Authorization: Bearer hash.token.signature" \
  "https://api.cappasity.com/api/files?owner=cappasity&sortBy=uploadedAt&order=DESC&shallow=1&offset=0&limit=24&filter=%7B%22uploadedAt%22%3A%7B%22gte%22%3A1486694997327%2C%22lte%22%3A1487447115708%7D%7D"
```

### Getting preview image for the model

`https://api.cappasity.com/api/files/preview/tsum/w640-h400-cpad-bffffff/<cappasity-id>.jpeg`
`https://api.cappasity.com/api/files/preview/tsum/<cappasity-id>.jpeg`
`https://api.cappasity.com/api/files/preview/tsum/w640-h400-cpad-bffffff/<sku>.jpeg`
`https://api.cappasity.com/api/files/preview/tsum/<sku>.jpeg`

To get a preview - form a link that consists of modifiers and model `SKU` or `cappasity-id` (refer to [File.json#/properties/id](file.json))
Supported modifiers:

```
  - height:       eg. h500
  - width:        eg. w200
  - square:       eg. s50
  - crop:         eg. cfill
  - top:          eg. y12
  - left:         eg. x200
  - gravity:      eg. gs, gne
  - quality:      eg. q90
  - background:   eg. b252525
```
  
Example links:
  
* 640x400, preserving aspect ratio and padding with white background (default): https://api.cappasity.com/api/files/preview/tsum/w640-h400-cpad/5100008597412.jpeg
* original file that was uploaded: https://api.cappasity.com/api/files/preview/tsum/5100008597412.jpeg

## Interacting with the Player

Player iframe emits events using [window.parent.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) for certain actions that happen within the player. You may attach a top window listener, which would allow you to receive these events.

To do that you need to execute the following code in your top-level window, which contains iframe with the player:

```js
window.addEventListener('message', receiveMessage, false);

// event: https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
function receiveMessage(event) {
  // verify that origin of event is cappasity iframe
  if (event.origin !== 'https://api.cappasity.com') return // ignore events which originate outside of iframe
  if (!event.data || !event.data.actionType) return
  
  // use event.source to determine which iframe sent the loaded message if you have multiple
  // iframes with the same model embedded on a single page
  
  switch (event.data.actionType) {
    case 'loaded':
      // model fully loaded
      // use event.data.modelId to determine which model had loaded
      break;
    case 'draw':
      // embed performed a frame draw
      // use event.data.modelId to determine which one
      break;
  }
}
```

### Types of events

#### Frame Draw Notification

Frame render notification, will be dispatched each time a draw happens, including when a player is being rotated

```js
{
  modelId: 'uuid-v4-of-the-model',
  actionType: 'draw'
}
```

#### Full Model Load

This happens when all segments of the 3d view had been downloaded. This is not a first paint - its a full
load. To be able to track initial render and interactivity of the player - listen to frame draw notification

```js
{
  modelId: 'uuid-v4-of-the-model',
  actionType: 'loaded'
}
```

## Controlling Player behavior

You can control some aspects of the player behavior sending `postMessage` messages to the `window` object corresponding to the player's iframe.

Given the fact the player iframe is tagged with `id="player"` one can send a message to the player executing this code:

```js
  var player = document.getElementById('player')
  
  if (player && player.contentWindow) {
    player.contentWindow.postMessage({ fn: <methodName>, args: [...] }, 'https://api.cappasity.com')
  }
```

### Available methods

#### `rotateToDeg`

Rotate the model to the certain degree. Accepts a single argument: degree to rotate to. A number in [0..360] range.

The method is available right away but actual rotation will not happen until the first `draw` event. Usage example (rotate the model to the 90th degree):

```js
  document.getElementById('player').contentWindow.postMessage({ fn: 'rotateToDeg', args: [90] }, 'https://api.cappasity.com')
```

#### `enterFullscreen`

Opens player in full-screen mode.

```js
  document.getElementById('player').contentWindow.postMessage({ fn: 'enterFullscreen', args: [] }, 'https://api.cappasity.com')
```

#### `cancelFullscreen`

If player is in full-screen mode it immediately leaves it. Otherwise does nothing.

```js
  document.getElementById('player').contentWindow.postMessage({ fn: 'cancelFullscreen', args: [] }, 'https://api.cappasity.com')
```

#### `cancelZoom`

If model in the player is zoomed this command will return it back to non-zoomed state. Otherwise does nothing.

```js
  document.getElementById('player').contentWindow.postMessage({ fn: 'cancelZoom', args: [] }, 'https://api.cappasity.com')
```
