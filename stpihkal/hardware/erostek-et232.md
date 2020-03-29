# Erostek ET-232

## Introduction

This document is a specification for the serial communications
protocol of the ET232 Electrostimulation box by Erostek. The protocol
was put together through information found around the internet. 

## Communication via Link Cable

Communicating with the ET-232 box happens via an RS-232 Connection to
the Link port of the box. The link cable consists of a 3.5mm TRS
(stereo audio) jack, going to some sort of computer connection, be it
Female DB-9 or a RS232-to-USB converter. The pin connections are as
follows:

- 3.5mm Tip <-> RX (DB-9 Pin 2)
- 3.5mm Ring <-> TX (DB-9 Pin 3)
- 3.5mm Sleeve <-> Ground (DB-9 Pin 5)

Serial connections are 19200/8/N/1, or:

- 19200 baud
- Data Bits: 8
- Stop Bits: 1
- Partity: None

To use the serial link on the ET-232, the cable must be plugged in
before the box is turned on, in order to complete the handshake
protocol. Otherwise, the jack will register as an audio input jack.
Similarly, to use the jack as audio once again, the box should be
turned off and back on first, in order to reestablish audio mode.

### Handshake

When the box is powered on, the ET-232 will send a single byte:

```
0xcc
```

Assuming this is transferred correctly, the box then listens for and
responds to commands. Unlike the ET-312, the ET-232 does not use an
encrypted protocol.

## Commands

### Format

Commands work on a peek and poke basis, similar to the ET-312.

Commands consist:

- ASCII characters
- A 2-byte checksum _string_, meaning two ASCII uppercase characters
  representing one hex byte. The checksum is a sum of all the
  characters in the range from '0' (0x30) to 'Z' (0x90) in the string.
  All characters outside of this range are ignored for the purposes of
  the checksum. This would be output by using a "%02X" printf-style
  formatter, for instance.
- A "\r" character to end the command.

Valid commands will be acknowledged with the following string:

```
\n
```

If a command is unrecognized, or the checksum does not match, the
following string will be returned:

```
?\r\n
```

### Read Byte ("H")

Reading a byte from the ET-232 is done using the "H" command.
This command consists of:

- "H" (0x48)
- A 8-bit address, written as 2 ASCII characters representing the hex
  value.
- The checksum
- "\r"

For instance, to read the byte at 0x80 (which gives you a checksum of 0xB0), you would send

```
H80B0\r
```

The command will return a two digit hex value at the requested
location, in ASCII 

### Write Byte ("I")

Writing a byte from the ET-232 is done using the "I" command.
This command consists of:

- "I" (0x49)
- A 8-bit address, written as 2 ASCII characters representing the hex
  value.
- An 8-bit value, written as 2 ASCII characters representing the hex
  value.
- The checksum
- "\r"

For instance, to write the value 0x10 to the byte at 0x80 (which gives
you a checksum of 0x12), you would send

```
I801012\r
```

The command, if successful, will return the string "$\n"

### Unknown ("J")

The usage of the "J" command is unknown. Sending "J" appears to ignore
arguments and returns "FF\n"

## Address Table

| Address | Description                          |
|---------|--------------------------------------|
| $08     | Channel A Pulse Width                |
| $09     | Channel A Pulse Frequency Reciprocal |
| $0A     | Channel A Pulse Amplitude            |
| $0B     | Channel A Power Compensation         |
| $0C     | Channel A Pulse Enable Polarity      |
| $0D     | ??                                   |
| $0E     | Channel B Pulse Width                |
| $0F     | Channel B Pulse Frequency Reciprocal |
| $10     | Channel B Pulse Amplitude            |
| $11     | Channel B Power Compensation         |
| $12     | Channel B Pulse Enable Polarity      |
| $13-1F  | ??                                   |
| $20-4F  | RAM/Program Parameters?              |
| $4F-87  | ??                                   |
| $88     | Position of Pot B                    |
| $89     | Position of MA Pot                   |
| $8A     | Battery Voltage                      |
| $8B     | Audio Input Level                    |
| $8C     | Position of Pot A                    |
| $8D-97  | ??                                   |
| $98     | Position of MA Pot (?)               |
| $99-A1  | ??                                   |
| $A2     | Mode Switch Position                 |
| $A3     | Mode Switch Override                 |
| $A4     | Analog Input Override                |
| $A5-CF  | ??                                   |
| $D0     | Unknown Timer                        |
| $D1     | Unknown Timer                        |
| $D2     | ??                                   |
| $D3     | Auto Power Off Timer                 |
| $D8     | Program Fade In Timer                |
| $D9-FB  | ??                                   |
| $FC     | Unknown Timer                        |
| $FD     | Unknown Timer                        |
| $FE-FF  | ??                                   |

## Address Specific Notes

### $08/$0E - Channel Pulse Width

Range is 00 (very low) to FF (full effect).

### $09/$0F - Channel Pulse Frequency Reciprocal

Maximum range is FF (~15Hz) to 08 (~475Hz).

### $0A/$10 - Channel Pulse Amplitude

Range is 00 (no output) to FF (full effect).

Whereas the pulse width is perceptually linear, this parameter
has a quadratic effect on overall power, so changes are more
discernible at the upper end.

### $0B/$11 - Channel Power Compentation

Most programs use 20 as the standard value. Stroke uses 2B (to
compensate for the monophasic pulses?). Small numeric increases
produce relative large increases in perceived intensity.

### $0C/$12 - Channel Pulse Enable/Polarity

Most programs use 07 as the standard value. Some switch between
07 and 06 to provide an intermittent effect. Stroke switches
between 05 and 03 to produce the two different stroke
"directions".

### $88/$89/$8C/$98 - Pot Positions

Values range from 00 (far left) to FF (far right)

### $8A - Battery Voltage

FF (maximum) to 90 (auto shutdown threshold)

### $A2 - Mode Switch Position

| Value | Position   |
|-------|------------|
|    0B | waves      |
|    0A | intense    |
|    0E | random     |
|    06 | audioSoft  |
|    02 | audioLoud  |
|    03 | audioWaves |
|    07 | user       |
|    05 | hiFreq     |
|    01 | climb      |
|    00 | throb      |
|    04 | combo      |
|    0C | thrust     |
|    08 | thump      |
|    09 | ramp       |
|    0D | stroke     |
|    0F | off        |

### $A3 - Mode Switch Override

- 8X - force modeX 
- 8F - force reset

When top bit set, the requested mode is selected regardless of the
position of the physical switch. Even if the switch is moved to off!
If serial connection is lost for any reason in this state, then it may
be necessary to remove power from the device in order to reset it.

### $A4 - Analog Input Override

| Value | Description           |
|-------|-----------------------|
|    01 | disable input B       |
|    02 | disable input MA      |
|    04 | disable input Battery |
|    08 | disable input Audio   |
|    10 | disable input A       |

When set, the corresponding inputs are ignored, and levels can be
set in software by writing to addresses 88..8C above.

### $D3 - Auto Power Off Timer

This timer controls the automatic power off function of the Erostek ET232
and possibly other Erostek units.  To prevent
auto shutdown after ~60 minutes, this timer needs to be periodically
reset to 0.  Simply write a 0 to this register to reset the timer.
