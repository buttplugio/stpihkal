# VirtualRealPlayer
* File ending: `.txt`
* Format: INI

VirtualRealPlayer was a video player of the [VirtualRealPorn network](https://virtualrealporn.com/). First launched in [September 2015](http://web.archive.org/web/20170812145448/http://support.virtualrealporn.com/hc/en-us/articles/115001905109-VirtualRealPlayer-for-Windows-Release-History), it could be used to control the Lovense Max & Nora and Kiiroo's Onyx & Pearl toys from Windows desktop computers.

As of May 2019, the VirtualRealPlayer has been discontinued, with the company now recommending other video players like DeoVR, Skybox VR, WatchVR and the SteamVR Media Player; however, these video players do not have teledildonics support. Teledildonics support is now only available for Android and iOS devices through the FeelConnect ecosystem.

To get scripts, user would have to download the video files from the website and place them in the `Videos` folder. During use, the VirtualRealPlayer would then automatically download the corresponding script files into the `Videos/config` folder. The scripts included a default position, rotation and zoom in the `Player` section. When the user changed these settings inside the VirtualRealPlayer, the new settings would be stored under the `User` section.

The Lovense Max, stored under the `Lovense` section as `hombre`, was controlled by a dash-separated list of `timestamp/vibration`. The Kiiroo Onyx was controlled by a semicolon separated list of `timestamp,strength`.

## Example file

```ini
[Player]
zoom=0
vert_rot=11.5
h_offset=0

[User]
h_offset=-5.279996
zoom=1.73999894
y_pos=0.6

[VideoInfo]
version=2
name=Video name

[Lovense]
hombre_trailer=-1.0/05-2.5/04-5.0/05
hombre=-3.0/05-4.5/04-6.0/05

[Kiiroo]
onyx=1.00,4;2.50,0;6.00,4
```
