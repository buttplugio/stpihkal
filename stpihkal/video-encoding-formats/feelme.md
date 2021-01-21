# FeelMe
* File ending: `.meta`
* Format: JSON

FeelMe, an affiliate of Kiiroo, produces video scripting services for other studios. They use `.meta` files which are stored in the JSON format and contain various metadata along with the script under `text`. The script is a lookup from time to position, where position is an integer from 0 to 4.

FeelMe files can be downloaded from the API endpoint `https://api.pibds.com/api/v1/videos/VIDEO_ID/subtitles/SUBTITLE_ID?apptoken=TOKEN&external_user_id=USER_ID`. The variables `VIDEO_ID`, `SUBTITLE_ID`, `TOKEN` and `USER_ID` are stored in the QR code that launches the FeelMe or FeelVR app, e.g. `feelvr://vr?url=FILE_URL&video-id=VIDEO_ID&sub-id=SUBTITLE_ID&format=STEREO_180_LR&token=TOKEN`.

Keep in mind that both the order of properties and the `session_id` are randomized for fingerprinting purposes. However, the actual script positions appear to be constant.

## Example file

```json
{
  "created": "2021-01-01T00:00:00.000000",
  "id": 1234,
  "description": "",
  "name": "Name of video",
  "session_id": "1234567890123456",
  "text": "{1.00:0,2.50:4,5.00:0}",
  "type": "penetration",
  "video": {
    "created": "2021-01-01T00:00:00.000000",
    "description": "",
    "external_id": "video_id",
    "name": "12345",
    "subtitles_count": 1
  },
  "video_external_id": "video_id"
}
```
