# BKK Hardware

BKK currently manufactures two pieces of hardware with bluetooth
capabilities.

The *BKK Cup* is a onahole style stroker/masturbator with an
accelerometer and buttons built in. There is no output or haptic
actuation in the toy, it is only used as a controller for either games
or movies.

The *BKK Bracelet* is most likely the same circuitry as the BKK Cup,
except in "bracelet" form. It probably contains the same accelerometer
and button setup, allowing users to attach it to the onahole of their
choice.

Note: *BKK Bracelet* implementation here is speculation taken from ad
copy on the [product website](https://www.bkksextoy.com/product), we
do not actually have a BKK Bracelet on hand at the time of this
writing.

## Chipset and Implementation Details

Due to the service IDs and identification of the BKK Cup, it is
assumed that this is a [TI CC2540 Reference Kit
Design](http://www.ti.com/product/cc2540). In fact, it may using [a
reference keyfob implementation available on
github](http://chipk215.github.io/keyfobsimulation/). This is
apparently a common reference design to copy, [as it has also been
found in
lightbulbs](https://learn.adafruit.com/reverse-engineering-a-bluetooth-low-energy-light-bulb/explore-gatt).

## Bluetooth Details

**BLE Device Name**
```
BKK Cup
```

**Accelerometer Service UUID**
```
0000ffa0-0000-1000-8000-00805f9b34fb
```

**Button Service UUID**
```
0000ffe0-0000-1000-8000-00805f9b34fb
```

**Accelerometer characteristic (Read/Notify) UUID**
```
0000ffa1-0000-1000-8000-00805f9b34fb
```

**Button characteristic (Read/Notify) UUID**
```
0000ffe1-0000-1000-8000-00805f9b34fb
```

## Protocol

The BKK protocol consists of either reads from the device (battery
power) or notifications (buttons, accelerometer).

### Buttons

Buttons are relayed as a single byte, via notifications from the
0xffe1 characteristic. Note that only one button can have its status
relayed at any time, pressing other buttons while a button is pressed
may or may not cause the new value to be transmitted.

- 0x05 - "G" button
- 0x06 - "L" button
- 0x08 - "E" button
- 0x09 - "R" button

### Accelerometer

The accelerometer value is relayed as 15hz updates through the 0xffa1
characteristic. Update are only sent while the toy is moving. The
accelerometer value seems to consist of 3 bytes, but only reacts to
movement on one axis, a vector going length-wise through the toy.
