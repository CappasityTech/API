# Documentation for integrating with Cappasity 3D Platform

(c) Copyright 2017-2024, Cappasity Inc. All rights reserved.

- [Registering an account and getting an API key](#registering-an-account-and-getting-an-api-key)
- [Uploading 3D View or 3D models](#uploading-3d-view-or-3d-models)
- [API methods and considerations](#api-methods-and-considerations)
  - [Get embed code based on SKU](#get-embed-code-based-on-sku)
  - [Get embed code based on cappasity URL](#get-embed-code-based-on-cappasity-url)
    - [Player customization options](#player-customization-options)
  - [List uploaded models](#list-uploaded-models)
    - [Params](#params)
    - [Filtering](#filtering)
    - [Pagination](#pagination)
      - [Limit-filter based pagination](#limit-filter-based-pagination)
      - [Limit-offset based pagination](#limit-offset-based-pagination)
  - [Get information about specific model by SKU or Cappasity ID](#get-information-about-specific-model-by-sku-or-cappasity-id)
  - [Getting preview image for the model](#getting-preview-image-for-the-model)
- [Interacting with the Player](#interacting-with-the-player)
  - [Types of events](#types-of-events)
    - [Frame Draw Notification](#frame-draw-notification)
    - [Full Model Load](#full-model-load)
    - [Player render errors](#player-render-errors)
- [Controlling Player behavior](#controlling-player-behavior)
  - [Available methods](#available-methods)
    - [`rotateToDeg`](#rotatetodeg)
    - [`enterFullscreen`](#enterfullscreen)
    - [`cancelFullscreen`](#cancelfullscreen)
    - [`cancelZoom`](#cancelzoom)
- [Send Analytics](#send-analytics)
- [Rate Limits](#rate-limits)

## Registering an account and getting an API key

1. Register using https://3d.cappasity.com/register link
2. Complete email verification. If you are using custom domain - email might be a bit slow to come due to "graylisting". However it should arrive soon. If not - check back with us, we'll help.
3. Go to account page - https://3d.cappasity.com/account/security - and create a security token, you will need this for interacting with API. Please securely store it somewhere - you will not be able to see created token again for security reasons

## Uploading 3D View or 3D models

1. Use Easy 3D Scan software to prepare your 3D Views and upload them to Cappasity platform.
2. For ease of integration assign SKU to the models you are uploading - this is a user generated alias, which can be used to programmatically access existing models and generate embeddable iframe code on the go.
3. If you do not assign SKUs right away - it can be done manually through our website interface via "edit model" feature.

## API methods and considerations

There are 2 ways to integrate with us - for testing & debugging you might use `embed button`, which will allow you to select different settings, size of the iframe and receive `iframe` code right away. However, when you are working with large amounts of models it might be most convenient to use API to generate iframe code. It won't change unless you change settings - so it's advised to cache it to reduce latency and amount of requests your server is performing. Consider [Cappasity API rate limits](#rate-limits).

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

### Get embed code based on Cappasity URL

If you have a cappasity 3d URL, such as `https://3d.cappasity.com/u/cappasity/2724daa5-cb68-43f9-8d5a-36be7e06f88d`, you may retrieve
customized player URL. Quick example is provided below. Please look at [sample code](./marketplace.js) for a complete set of options

```bash
curl -X POST --compressed \
  -H "Content-Type: application/vnd.api+json" \
  -H "Authorization: Bearer hash.token.signature" \
  "https://api.cappasity.com/api/oembed/marketplace?url=https%3A%2F%2F3d.cappasity.com%2Fu%2Fcappasity%2F2724daa5-cb68-43f9-8d5a-36be7e06f88d" \
  -d '{
    "data": {
      "type": "embed",
      "attributes": {
        "width": 100,
        "height": 600
      }
    }
  }'
```

HTTP response will have statusCode `200` and contain the following JSON data structure in the body:

```json
  {
    "meta": {
      "id": "<request id>"
    },
    "data": {
      "id": "<user id>/<model id>",
      "type": "embed",
      "attributes": {
        "html": "<iframe ...></iframe>"
      }
    }
  }
```

#### Player customization options

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
| `autorotatetime`    | float   | --      | Rotation time of the full turn, seconds                                                   |
| `autorotatedelay`   | float   | --      | Delay if rotation was interrupted, seconds                                                |
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
| `starthint`         | boolean | false   | Whether to skip 'rotate hint'                                                             |
| `language`          | string  | ---     | The language used to display hints and messages, available languages are: `en`, `zh`, `ru`, `de`, `es`, `fr`, `nl`, `jp`, `ko`, `it`, `tr` |
| `arbutton`          | boolean | true    | Show AR button                                                                            |

Use iframe code and insert it into your HTML

### List uploaded models

This method lists uploaded models and paginates across them. 

Filtering models by upload date range is available with maximum interval of 30 days.
Due to database architecture the list of returned models is internally cached until one of 3 cases happens: the list is accessed more than 30 seconds ago, a model is uploaded or deleted. In the future the cache invalidation logic can change.

#### Params

| Property Type | Property Name   | Default  | Allowed Values     | Example                         | Comments                                                                          |
|---------------|-----------------|----------|--------------------|---------------------------------|-------------------------------------------------------------------------------|
| Header        | Authorization   |          |                    | `Authorization: Bearer <token>` | If not specified - will only return public models |
| Header        | Accept-Encoding |          |                    | `Accept-Encoding: gzip`         | If not specified - will return plain text, please use it |
| Header        | Accept-Version  |          |                    | `Accept-Version: ~1`            | If not specified - will use most-recent version on breaking changes, please pin API |
| Query         | pub             |          |             0, 1   | `?pub=0`                        | If authorization header is set & pub=0 - includes private models |
| Query         | order           |      ASC |        ASC, DESC   | `?order=DESC`                   | Defaults to ascending |
| Query         | offset          |        0 | 0 < offset <= 1000 | `?offset=24`                    | Used for paginating |
| Query         | limit           |       12 | 0 < limit <= 100   | `?limit=24`                     | Models per page |
| Query         | filter          | `%7B%7D` |                    | `?filter=%7B%7D`                | Used to filter response |
| Query         | sortBy          |       id |                    | `?sortBy=uploadedAt`            | Sorts by this field |
| Query         | shallow         |        0 |                    | `?shallow=1`                    | Please set to 1 to reduce traffic. It omits information about uploaded models |
| Query         | owner           |          |                    | `?owner=cappasity`              | For public - can select any customer alias, for private - must supply auth token |
| Query         | embed           |        0 |             0, 1   | `?embed=1`                      | Will render embed.code into embed.html param |
| Query         | embedParams     |   %7B%7D |                    | `?embedParams=%7B%7D`           | Specify override values for embed.code template | 


#### Filtering
##### Building filter
Let's say you want to filter `isInShowroom` models uploaded before specific time and match some search query.

**1. Build a filter object**

```js
const filter = {
  isInShowroom: 'true',
  uploadedAt: {
    lt: 1525282016276,
  },
  '#multi': {
    fields: ['name','alias','description'],
    match: 'coat'
  }
}
```

**2. Encode filter**

To pass it as a query parameter, serialize filter object as JSON and URI encode the value.

**JS Example**

To generate `filter` value use the following function:

```js
function encodeFilter(obj) {
  return encodeURIComponent(JSON.stringify(obj));
}

console.log(encodeFilter(filter));
// '%7B%22isInShowroom%22%3A%22true%22%2C%22uploadedAt%22%3A%7B%22lt%22%3A1525282016276%7D%2C%22%23multi%22%3A%7B%22fields%22%3A%5B%22name%22%2C%22alias%22%2C%22description%22%5D%2C%22match%22%3A%22coat%22%7D%7D'
```

**3. Use encoded value as a query param**

Example request:

```bash
curl -X GET --compressed \
  -H "Authorization: Bearer hash.token.signature" \
  "https://api.cappasity.com/api/files?owner=cappasity&sortBy=uploadedAt&order=DESC&shallow=1&%7B%22isInShowroom%22%3A%22true%22%2C%22uploadedAt%22%3A%7B%22lt%22%3A1525282016276%7D%2C%22%23multi%22%3A%7B%22fields%22%3A%5B%22name%22%2C%22alias%22%2C%22description%22%5D%2C%22match%22%3A%22coat%22%7D%7D"
```

##### Complex filter examples

**List account models with limit filter based pagination**

See more about [limit-filter based pagination](#limit-filter-based-pagination)
```js
const filter = {
  uploadedAt: {
    lt: 1525282016276, // this timestamp works like a cursor
  }
};
console.log(encodeFilter(filter));
// %7B%22uploadedAt%22%3A%7B%22lt%22%3A1525282016276%7D%7D
```

**List account models added to showroom with limit filter based pagination**

See more about [limit-filter based pagination](#limit-filter-based-pagination)
```js
const filter = {
  isInShowroom: 'true', // notice: 'true' is a string here
  uploadedAt: {
    lt: 1525282016276, // this timestamp works like a cursor
  }
}
console.log(encodeFilter(filter));
// %7B%22isInShowroom%22%3A%22true%22%2C%22uploadedAt%22%3A%7B%22lt%22%3A1525282016276%7D%7D
```

**Search models by name, alias and description with limit-filter based pagination**

```js
const filter = {
  uploadedAt: {
    lt: 1525282016276, // this timestamp works like a cursor
  },
  '#multi': {
    fields: ['name','alias','description'],
    match: 'coat'
  }
}

console.log(encodeFilter(filter)); 

// %7B%22uploadedAt%22%3A%7B%22lt%22%3A1525282016276%7D%2C%22%23multi%22%3A%7B%22fields%22%3A%5B%22name%22%2C%22alias%22%2C%22description%22%5D%2C%22match%22%3A%22coat%22%7D%7D
```

**Search models that are added to showroom by name, alias and description with limit-filter based pagination**

```js
const filter = {
  uploadedAt: {
    lt: 1525282016276, // this timestamp works like a cursor
  },
  isInShowroom: 'true', // notice: 'true' is a string here
  '#multi': {
    fields: ['name','alias','description'],
    match: 'coat'
  }
}
console.log(encodeFilter(filter));
// %7B%22uploadedAt%22%3A%7B%22lt%22%3A1525282016276%7D%2C%22isInShowroom%22%3A%22true%22%2C%22%23multi%22%3A%7B%22fields%22%3A%5B%22name%22%2C%22alias%22%2C%22description%22%5D%2C%22match%22%3A%22coat%22%7D%7D
```

#### Pagination
There are two types of pagination:
- [limit-filter based pagination](#limit-filter-based-pagination) - Strongly recommended as the fastest way to paginate catalog over 100 items, and the only way to paginate catalog over 500 items
- [limit-offset based pagination](#limit-offset-based-pagination) - Paginate small catalogs under 100 items, use for backward compatibility solution or to paginate with custom `filter` and `sort` params

##### Limit-filter based pagination
| Good when you need to                       | Bad when you need to                  |
|---------------------------------------------|---------------------------------------|
| Paginate catalog over 100 items  | Use custom `filter` and `sort` params - use [limit-offset based pagination](#limit-offset-based-pagination) |

Uses `limit`, `sortBy` and `filter` query params:
+ `limit` - Limit models per page
+ `sortBy` - Sort by `uploadedAt`
+ `filter.uploadedAt.gt` or `filter.uploadedAt.lt` - Filter by `uploadedAt` field that stores a timestamp in milliseconds. See how to encode filter param in the [filtering](#filtering) section.

Example:
1. To retrieve first page use only `limit` and `sortBy` query params:
```curl
curl -X GET --compressed \
  -H 'Authorization: Bearer xxx.xxx.xxx' \
  "https://api.cappasity.com/api/files?limit=20&sortBy=uploadedAt"
```
2. To retrieve the next page, find the max/min value of `uploadedAt` field among the first page results, depending on sorting direction. Keep in mind that by default, the list is sorted in a `DESC` order.
Let's say the minimum `uploadedAt` value is `1633430297215`. Encode the filter param: 
```js
encodeURIComponent(JSON.stringify({ uploadedAt: { lt: 1633430297215 } }));
// '%7B%22uploadedAt%22%3A%7B%22lt%22%3A1633430297215%7D%7D'
```

3. Request next page:
```curl
curl -X GET --compressed \
  -H 'Authorization: Bearer xxx.xxx.xxx' \
  "https://api.cappasity.com/api/files?limit=20&sortBy=uploadedAt&filter=%7B%22uploadedAt%22%3A%7B%22lt%22%3A1633430297215%7D%7D"
```

##### Limit-offset based pagination
| Good when you need to                       | Bad when you need to                  |
|---------------------------------------------|---------------------------------------|
| Paginate small catalog under 100 items. Up to 500 is okay, but it becomes slow.  | Paginate catalog over 500 items -  use [limit-filter based pagination](#limit-filter-based-pagination). Maximum allowed offset is 1000. |
| Use custom `filter` and `sort` params |  |

Use standard `limit` and `offset` query params.

### Get information about specific model by SKU or Cappasity ID

This endpoint provides extended information about model.

```
  https://api.cappasity.com/api/files/info/<user-alias>/<sku>
  https://api.cappasity.com/api/files/info/<user-alias>/<cappasity-id>
```

`<user-alias>` is the value provided as `username` on registration and appearing as `https://3d.cappasity.com/u/<ALIAS>` when logged into your account. `sku` or `cappasity-id` strings must comply with the rules (refer to [File.json#/properties/id](file.json))

Example request (for a model with SKU: "A B C"):

```bash
curl -X GET --compressed \
  -H "Content-Type: application/vnd.api+json" \
  "https://api.cappasity.com/api/files/info/cappasity/A%20B%20C"
```

Example response:

```json5
{
  "meta": {
    "id": "6adbc6d2-69b4-4c88-91a8-8f99f54b083d"
  },
  "data": {
    "type": "file",
    "id": "95f59308-3e2c-4151-a541-1db0aac3ad0d", /* model's cappasity id */
    "attributes": {
      "public": "1",
      "contentLength": 19919914,
      "name": "Prosecco",
      "files": [/* internal file data */],
      "parts": 5,
      "tags": [
        "drink",
        "alcoholic beverage",
        "liqueur",
        "champagne",
        "wine",
        "distilled beverage",
        "bottle",
        "alcohol",
        "sparkling wine",
        "glass bottle"
      ],
      "type": "object",
      "uploadedAt": 1579521161823,
      "embed": {
        "ai": "<script async src=\"https://api.cappasity.com/api/player/cappasity-ai\"></script>",
        "code": "<iframe allowfullscreen mozallowfullscreen=\"true\" webkitallowfullscreen=\"true\" width=\"{{ width }}\" height=\"{{ height }}\" frameborder=\"0\" style=\"border:0;\" src=\"https://api.cappasity.com/api/player/95f59308-3e2c-4151-a541-1db0aac3ad0d/embedded?autorun={{ autorun }}&closebutton={{ closebutton }}&logo={{ logo }}&analytics={{ analytics }}&uipadx={{ uipadx }}&uipady={{ uipady }}&enablestoreurl={{ enablestoreurl }}&storeurl={{ storeurl }}&hidehints={{ hidehints }}&autorotate={{ autorotate }}&autorotatetime={{ autorotatetime }}&autorotatedelay={{ autorotatedelay }}&autorotatedir={{ autorotatedir }}&hidefullscreen={{ hidefullscreen }}&hideautorotateopt={{ hideautorotateopt }}&hidesettingsbtn={{ hidesettingsbtn }}&enableimagezoom={{ enableimagezoom }}&zoomquality={{ zoomquality }}&hidezoomopt={{ hidezoomopt }}\"></iframe>",
        "params": {/* embedded parameters available for the model */}
      },
      "bucket": "cdn.cappasity.com",
      "alias": "A B C",
      "uploadType": "simple",
      "backgroundColor": "#FFFFFF",
      "packed": "1",
      "c_ver": "4.1.0",
      "owner": "cappasity"
    },
    "links": {
      "self": "https://api.cappasity.com/api/files/95f59308-3e2c-4151-a541-1db0aac3ad0d",
      "owner": "https://api.cappasity.com/api/users/cappasity",
      "player": "https://3d.cappasity.com/u/cappasity/95f59308-3e2c-4151-a541-1db0aac3ad0d",
      "user": "https://3d.cappasity.com/u/cappasity"
    }
  }
}
```

For private models you may need `authorization` header too.

### Getting preview image for the model

`https://api.cappasity.com/api/files/preview/<user-alias>/w640-h400-cpad-bffffff/<cappasity-id>.jpeg`
`https://api.cappasity.com/api/files/preview/<user-alias>/<cappasity-id>.jpeg`
`https://api.cappasity.com/api/files/preview/<user-alias>/w640-h400-cpad-bffffff/<sku>.jpeg`
`https://api.cappasity.com/api/files/preview/<user-alias>/<sku>.jpeg`

To get a preview - form a link that consists of modifiers, your user alias and model `sku` or `cappasity-id`.

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
  
* 640x400, preserving aspect ratio and padding with white background (default): https://api.cappasity.com/api/files/preview/cappasity/w640-h400-cpad/d53e89b7-382a-4741-8ec9-e7ef7c2662b6.jpeg
* original file that was uploaded: https://api.cappasity.com/api/files/preview/cappasity/d53e89b7-382a-4741-8ec9-e7ef7c2662b6.jpeg

### Rate Limits

#### By sync items to register
Most likely, you are going to reach sync items rate limit.

##### Per job
* Maximum of 500 items

To register a bigger collection, split your items into several jobs.

##### Per all jobs for last 24 hours
* The maximum total number of items in all jobs registered for last 24 hours depends on your account plan, 10000 items at least.

Keep track of registered items not to overflow the limit and defer registering new jobs if needed, especially if you are used to operate with huge collections. For now, we don't provide current limit state and remaining items to sync. 
Consider retrying requests failed due to rate limit and use exponential backoff to reduce request count.

#### By requests

##### Per single IP
* Maximum of 1000 requests per 10 seconds

#### By connections

##### Per single IP
* Maximum of 60 new connections per 3 seconds
* Maximum of 30 active connections in total

Consider connection reuse.

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

```json
{
  "modelId": "uuid-v4-of-the-model",
  "actionType": "draw"
}
```

#### Full Model Load

This happens when all segments of the 3d view had been downloaded. This is not a first paint - its a full
load. To be able to track initial render and interactivity of the player - listen to frame draw notification

```json
{
  "modelId": "uuid-v4-of-the-model",
  "actionType": "loaded"
}
```

#### Player render errors

All types of handled errors notify the parent frame with a message structured as follows:

```json5
{
  "source": "cappasity-player",
  "actionType": "error",
  "modelId": "uuid-v4-of-the-requested-model",
  "message": "error details",
  "code": 404 // numeric code of the error
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

## Send Analytics
Add the following script tag to the pages with Cappasity 3D Views:
```
<script async src="https://api.cappasity.com/api/player/cappasity-ai" />
```
It will collect and send Cappasity 3D View analytics.
