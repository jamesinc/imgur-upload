# ImgurUpload
A drag'n'drop image upload plugin for Vanilla Forums utilising the Imgur REST API

This project is GPLv3, with the exception of [the icon](https://thenounproject.com/term/drag-and-drop/49665/),
which is based on an icon that is [CC-Attribution](https://creativecommons.org/licenses/by/3.0/us/) and created by Garrett Knoll from Noun Project

## Re-minifying the JavaScript
My preferred method is using [uglify-js](https://www.npmjs.com/package/uglify-js "uglify-js package details on npmjs.com") from the command line

1. Install uglify-js from NPM:

   `npm install uglify-js -g`
2. Navigate to the JS directory and compress the source with the following command:

   `uglifyjs --mangle --compress --output imgurupload.min.js --source-map imgurupload.js.map imgurupload.js`

