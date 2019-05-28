# Nobra

## Introduction

[Nobra](https://www.nobra.de/?lang=en) is a company run by a couple
from Germany that has been selling vibrators since 1999. It offers
both insertable vibrators as well as a male vibrator with two motors
(“Nobra Twincharger”).

The vibrators can be connected to either an analog control box or a
digital control box. In addition to the buttons, the digital control
box can also be controlled via Bluetooth using the official
“NobraControl” application (uses .NET).

## Bluetooth details

When paired with a system via Bluetooth 2.0, the digital control box
identifies itself as `Nobra Control` and exposes two serial ports,
COM4 and COM5. However, only COM5 can be used to control the toy.

## Protocol

When switching on the digital control box, it waits for five seconds
and then switches into manual mode, using the stored setting. This
can either be a steady vibration or an oscillating vibration in a
sinusoidal, sawtooth or rectangular shape.

Upon receiving a command via Bluetooth, the control box will stop
the oscillation and change to the vibration level as indicated by
the command, or keep the vibration constant at whatever is the
current level if the command specifies no vibration level.

A user can press the physical buttons on the control box at any time
to go back to manual control. In addition, they can press a specific
button combination to turn Bluetooth off.

### Command list

A command is a one-byte message. Commands `0x41` to `0x45` (`'A'`
through `'F'`) are systems commands, while `0x61` to `0x70` (`'a'`
through `'p'`) change the vibration level.

Even though some Nobra toys contain two motors, these commands will
set both motors to the same vibration level. The only way to control
the vibration for each motor separately is via the physical dials.

| Byte | Char | Result |
| ------ | ----- | ----------- |
| `0x41` | `'A'` | The digital control will return its identifier as five bytes: `NoBra` (`4E 6F 42 72 61`).
| `0x42` | `'B'` | Puts the digital control into a “frozen” state: The vibration stays at the current level and any further Bluetooth commands or physical button presses are ignored until the power is turned off and on again.
| `0x43` | `'C'` | Same as `0x42` (`'B'`).
| `0x44` | `'D'` | The digital control responds with the following 36 bytes: ``dpAabcdcbapNOdpRdpFGHIJKLMNO_`dpAphd`` (`64 70 41 61 62 63 64 63 62 61 70 4E 4F 64 70 52 64 70 46 47 48 49 4A 4B 4C 4D 4E 4F 5F 60 64 70 41 70 68 64`)
| `0x45` | `'E'` | Same as `0x44` (`'D'`).
| `0x46` | `'F'` | Causes the digital control to reboot. Turns off all vibrations for five seconds before it switches the vibration to the stored setting. After reconnecting via Bluetooth, further commands can be sent to the digital control.
| `0x61` | `'a'` | Sets the vibration to the lowest level (1).
| `0x62` | `'b'` | Sets the vibration to the level 2.
| `0x63` | `'c'` | Sets the vibration to the level 3.
| `0x64` | `'d'` | Sets the vibration to the level 4.
| `0x65` | `'e'` | Sets the vibration to the level 5.
| `0x66` | `'f'` | Sets the vibration to the level 6.
| `0x67` | `'g'` | Sets the vibration to the level 7.
| `0x68` | `'h'` | Sets the vibration to the level 8.
| `0x69` | `'i'` | Sets the vibration to the level 9.
| `0x6A` | `'j'` | Sets the vibration to the level 10.
| `0x6B` | `'k'` | Sets the vibration to the level 11.
| `0x6C` | `'l'` | Sets the vibration to the level 12.
| `0x6D` | `'m'` | Sets the vibration to the level 13.
| `0x6E` | `'n'` | Sets the vibration to the level 14.
| `0x6F` | `'o'` | Sets the vibration to the highest level (15).
| `0x70` | `'p'` | Turns off the vibration (level 0).

Any bytes missing from this table cause the oscillation from manual
mode to stop at whatever is the current vibration level but do not
have any other effect.

## Related links

* Official website and shop (English): [https://www.nobra.de/?lang=en](https://www.nobra.de/?lang=en)
* Documentation of the digital control box: [https://www.nobra.de/digital-control/?lang=en](https://www.nobra.de/digital-control/?lang=en)
* Documentation of the official companion app for Windows: [https://www.nobra.de/digital-control/nobracontrol-rhythmus-und-soundsteuerung/?lang=en](https://www.nobra.de/digital-control/nobracontrol-rhythmus-und-soundsteuerung/?lang=en)
* US store selling the Nobra Twincharger: [http://www.happystim-usa.com/catalog/i553.html](http://www.happystim-usa.com/catalog/i553.html)
