# Scream Labs Model X1

The Scream Laboratories Model X1 Interrogator uses Bluetooth (Classic, SPP) for remote control. The advertised name is the unit's serial number in the format `SLMK1xxxx`.

## Protocol

Messages in both directions are at least 3 bytes and are terminated with `\n` (0x0A). `\n` may appear as the 2nd byte of many messages, so it must be ignored when splitting messages. All identifiers (commands and variables) are ASCII characters.

Messages to the unit always consist of 3 bytes, made up of the "command", an argument, and the terminator.

Messages from the unit are either a 3 byte variable update (made up of the "variable", the value, and the terminator), or if longer than 3 bytes are a free-text informational message (ASCII followed by the terminator).

The command protocol is not hardened for general use and sending invalid commands may brick the unit.

## Connection Sequence

Get the current firmware version with `Gs\n` (0x47 0x73 0x0A). This document describes version 2.0 (0x14) and no other commands should be used if a different version is returned.

Send `E+\n` (0x45 0x2B 0x0A) to get the current value of all variables and start watching for changes (appears to include all variables other than "Output Percentage", which must be queried explicitly).

The provided companion app then uses `G0\n` (0x47 0x30 0x0A) to request an information string - the format is unknown, and it doesn't appear to be used.

When done, before disconnecting, send `E-\n` to stop watching for variable changes.

## Commands

| ID         | Name                     | Argument                 |
|------------|--------------------------|--------------------------|
| `1` (0x31) | Set "Short" Switch Mode  | Mode ID                  |
| `2` (0x32) | Set "Normal" Switch Mode | Mode ID                  |
| `3` (0x33) | Set "Medium" Switch Mode | Mode ID                  |
| `4` (0x34) | Set "Long" Switch Mode   | Mode ID                  |
| `C` (0x43) | Set Enabled Channels     | Channel Flags            |
| `E` (0x45) | Send Variable Changes    | `+` (0x2B) / `-` (0x2D)  |
| `G` (0x47) | Get Variable Value       | Variable ID              |
| `P` (0x50) | Set Current Mode         | Mode ID                  |
| `T` (0x54) | Manual Trigger           | Trigger Time (x 0.1s)    |
| `Z` (0x5A) | Set Buzzer Mode          | 0x00 Always, 0x01 Output |


## Variables

| ID         | Name                 | Format                    |
|------------|----------------------|---------------------------|
| `1` (0x31) | "Short" Switch Mode  | Mode ID                   |
| `2` (0x32) | "Normal" Switch Mode | Mode ID                   |
| `3` (0x33) | "Medium" Switch Mode | Mode ID                   |
| `4` (0x34) | "Long" Switch Mode   | Mode ID                   |
| `c` (0x63) | Enabled Channels     | Channel Flags             |
| `d` (0x64) | Count Down Timer     | Seconds Remaining         |
| `f` (0x66) | Pulse Rate Knob      | 0x00 - 0xFF               |
| `i` (0x69) | Mode Info            | Current Purgatory Level   |
| `l` (0x6C) | Input Voltage        | (value / 10.0) = V        |
| `m` (0x6D) | Current Mode         | Mode ID                   |
| `p` (0x70) | Pulse Width Switch   | Pulse Width               |
| `r` (0x72) | Trigger Rate Knob    | 0x00 - 0xFF               |
| `s` (0x73) | Firmware Version     | 0x14 = 20 = 2.0           |
| `t` (0x74) | Trigger Mode Switch  | Trigger Mode              |
| `u` (0x75) | Unit Mode            | 0x00 Normal, 0x01 Extreme |
| `v` (0x76) | Output Percentage    | (value / 255.0) = %       |
| `z` (0x7A) | Buzzer Mode          | 0x00 Always, 0x01 Output  |

## Modes

| ID   | Name                   |
|------|------------------------|
| 0x00 | Torment                |
| 0x01 | Smooth Suffering       |
| 0x02 | Bitch Training         |
| 0x03 | Turbo Thruster         |
| 0x04 | Random                 |
| 0x05 | Random Bitch           |
| 0x06 | Purgatory              |
| 0x07 | Purgatory Chaos        |
| 0x08 | Persistent Pain        |
| 0x09 | Pulse                  |
| 0x0A | Ramp Pulse             |
| 0x0B | Ramp Repeat            |
| 0x0C | Ramp Intensity         |
| 0x0D | Audio Attack           |
| 0x0E | Torment (LV)           |
| 0x0F | Power Waves (LV)       |
| 0x10 | Speed Waves            |
| 0x11 | Demon Play             |
| 0x80 | Extreme Torment        |
| 0x81 | Extreme Bitch Training |


## Pulse Widths

| Value | Pulse Width |
|-------|-------------|
| 0x01  | Short       |
| 0x00  | Normal      |
| 0x03  | Medium      |
| 0x02  | Long        |

## Trigger Mode

| Value | Trigger Mode |
|-------|--------------|
| 0x01  | Constant     |
| 0x00  | Pulse        |
| 0x03  | Manual       |
| 0x02  | Microphone   |

## Channel Flags

| Value | Channel   |
|-------|-----------|
| 0x01  | Channel 1 |
| 0x02  | Channel 2 |
| 0x04  | Channel 3 |
| 0x08  | Channel 4 |
