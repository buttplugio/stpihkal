# Fleshlight Launch

## Introduction

The Fleshlight Launch was introduced in March 2013. A partnership
between Kiiroo and the Fleshlight brand of onaholes, it features a
mechanism that holds a Fleshlight and performs a linear stroking
motion with it.

## Bluetooth Details

The Fleshlight Launch uses Bluetooth LE to communicate with other machines. 

The device is found using the following names:

- Launch

Services and Characteristic UUIDs:

- **Service UUID:** 88f80580-0000-01e6-aace-0002a5d5c51b
- **Write Characteristic UUID:** 88f80581-0000-01e6-aace-0002a5d5c51b
- **Read/Status Notification Characteristic UUID:** 88f80582-0000-01e6-aace-0002a5d5c51b
- **Command Characteristic UUID:** 88f80583-0000-01e6-aace-0002a5d5c51b

The Read and Write characteristics are used during normal operation of
the Launch. The Command characteristic is used for bootloader access
and firmware uploading.

## Launch Protocol

### Device Initialization

To initialize the device, send

```
0x00
```

to the Command Characteristic on bootup. This puts the Launch in user
mode, allowing control of the device and reading of buttons.

For more information on device information retreival, including
getting firmware versions, CRCs, and other firmware/bootloader
related information, see the [Kiiroo Bootloader and Firmware
Section](../firmware/kiiroo.md).

### Firmware v1.2/1.3 Commands

The command protocol for the launch consists of two byte packets.

```
0xYY 0xZZ
```

- YY represents the desired position of the toy. Valid inputs are
  0-99, sent as decimal.
- ZZ represents the desired speed the toy should move to the position
  listed at. Valid inputs are 0-99, sent as decimal.

Invalid inputs are ignored.

### Firmware 1.0/1.1 Commands (Deprecated)

The commands for firmware version 1.0 and 1.1 were similar to the
format of the Firmware v1.2/1.3 commands, except that they were coded
in BCD instead of decimal. These commands do not work with later
version of the firmware.

### Buttons/Gesture Pads

The fleshlight comes with 7 "buttons", which are actually capacitive
touch sensor pads. There are 2 sets of 3 buttons, on the left and
right side of the device, meant to be used as gesture pads. There is
also a single button in the middle, referred to as the "bluetooth"
button due to the bluetooth/firmware status LED.

Status of buttons is read via notifications sent by the Status
Notification characteristic. They arrive as an array of 14 ints,
looking like:

```
[0x03, 0xCC, 0x03, 0x5A, 0x03, 0xA3, 0x03, 0xF4, 0x03, 0xAF, 0x03, 0x67, 0x03, 0xCF]
```

This array represents a set of 7 16-bit big-endian numbers, reflecting
the state of the buttons on the device. The index of the values
mirrors the order of the buttons on the device, with (assuming the
device is facing you and upright):

- the first 3 values representing the buttons on the left side of the
  device, from left to right
- the 4th value representing the blue LED square button in the middle
- the last 3 values representing the buttons on the right side of the
  device, from left to right

The array shown above is the idle state, with no buttons currently
being pressed. Detecting button presses requires testing for a certain
threshold of the button value. Whenever a button is pressed, the value
will value decrease (up to ~80-90 from its idle state), and whenever
it is let go, the value will increase back to normal. 

For example: Button 0, when idle, would register 0x03cc. When pressed, it might go
as low as 0x0360. 

## Related Projects and Links

The applications and repositories below contain implementations of the
Fleshlight communications protocol, or have relevant information about
the hardware/firmware.

* Buttplug C\#: [https://github.com/metafetish/buttplug-csharp](https://github.com/metafetish/buttplug-csharp)
* Buttplug JS: [https://github.com/metafetish/buttplug-js](https://github.com/metafetish/buttplug-js)
* golaunch (Go): [https://github.com/funjack/golaunch](https://github.com/funjack/golaunch)
* ScriptPlayer: [https://github.com/FredTungsten/ScriptPlayer](https://github.com/FredTungsten/ScriptPlayer)
* Raunch iOS (Swift): [https://github.com/metafetish/raunch-ios](https://github.com/metafetish/raunch-ios)
* Launch Firmware Reverse Engineering: [https://github.com/metafetish/raunch-firmware](https://github.com/metafetish/raunch-firmware)
* Fleshlight Launch Teardown Video: [https://www.youtube.com/watch?v=sA7MdO0rEoo](https://www.youtube.com/watch?v=sA7MdO0rEoo)
