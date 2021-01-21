# Funscript
* File ending: `.funscript`
* Format: JSON

Funscript file are the preferred file format of the scriping community on [EroScripts](https://discuss.eroscripts.com) (previously known as [RealTouchScripts](https://realtouchscripts.com/)). They can also be purchased from marketplaces like [RealSync](https://realsync.us) (previously known as SyncArmy) and [SexLikeReal](https://www.sexlikereal.com/tags/interactive-sex-toys-vr). In addition, they are included with the subscription to the [CzechVR network](https://www.czechvrnetwork.com/tag-teledildonics) for all videos with the Teledildonics tag.

In order to be recognized by script players, `.funscript` files must be placed in the same directory and must match the name of the corresponding video file, e.g. `my-video.mp4` and `my-video.funscript`.

The script positions are stored under `actions`, where `pos` is an integer from `0` to `99` and `at` is the timestamp, given in milliseconds.

## Example file

```json
{
  "version": "1.0",
  "inverted": false,
  "range": 90,
  "actions": [
    {
      "pos": 0,
      "at": 1000
    },
    {
      "pos": 99,
      "at": 2000
    },
    {
      "pos": 0,
      "at": 3000
    }
  ]
  ```
