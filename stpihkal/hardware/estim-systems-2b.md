# EStim Systems 2B

## Serial Communication

### Cable Details

Rather than using an RS-232 cable, the 2B uses a TTL cable for serial
communication. This means you cannot use a regular USB-to-Serial
converter, as the voltage levels will be incorrect. Instead, you need
a cable that goes from USB to TRS connector with TTL voltages, like
the FTDI TTL-232R-5V-AJ.

To wire your own cable, use the following connections between the TTL
serial chip and TRS connector:

- Tip <-> TX
- Ring <-> RX
- Sleeve <-> GND

### Port Settings

The 2B uses **9600/8/N/1** for port settings.

## Protocol

### Structure

Commands are sent as ASCII, delimited by either a '\r' (0x0D) or by
filling up the 5 character serial buffer of the 2B.

All commands will receive a reply of the same format

```
AAA:BB:CC:DD:EE:F:G:H:II
```

* AAA - Battery Level
* BB - Channel A Level
* CC - Channel B Level
* DD - Channel C Setting
* EE - Channel D Setting
* F - Current [Mode](#modes)
* G - Power Setting (L or H)
* H - Channel A/B Joined? (0 or 1)
* II - Firmware Version

### Commands

| Command | Description |
| ------- | ----------- |
| Axx | Sets Channel A Power % to xx. Range is 0 to 100, i.e. A50 sets Channel A to 50% |
| Bxx | Sets Channel B Power % to xx. Range is 0 to 100 |
| Cxx | Sets Channel C Setting to xx. Range is 2 to 100 |
| Dxx | Sets Channel D Setting to xx. Range is 2 to 100 |
| E   | Set all Channels to defaults (A/B: 0%, C/D: 50, Mode: Pulse) |
| H   | Switch to High Power Mode, turns A/B back to 0% |
| J   | Join Channels A/B. A is master. |
| K   | Set A/B to 0% | 
| L   | Switch to Lower Power Mode, turns A/B back to 0% |
| Mxx | Set mode to xx (See [mode table](#modes)) |
| U   | Unlink Channels A/B |

### Modes

| Index | Name | Channel C Effect | Channel D Effect | Description |
| ----- | ---- | ---------------- | ---------------- | ----------- |
| 0 | Pulse | Pulse Frequency | Pulse PWM Type? | Channels turn on/off synchronously |
| 1 | Alternating | Pulse Frequency | Pulse PWM Type? | Channels turn on/off asynchronously |
| 2 | Continuous | Pulse PWM Type? | N/A | Channels on continuously |
| 3 | A Pattern | Pulse Frequency | Pulse PWM Type? | Channel A plays pattern, Channel B on |
| 4 | B Pattern | Pulse Frequency | Pulse PWM Type? | Channel B plays pattern, Channel A on |
| 5 | Asymmetric Power Ramp | Ramp Speed | N/A | Ramps from 0 to channel power % limit, sets to 0 repeats |
| 6 | Symmetric Power Ramp | Ramp Speed | N/A | Ramps from 0 to channel power % limit, then ramps back to 0 |
| 7 | Frequency Ramp | Frequency Limit | N/A | Ramps channel frequencies from 0 to limit, then ramps back down |
| 8 | Alternative Frequency Ramp | Frequency Limit | N/A | Same as 7, except Channel A/B alternate |
| 9 | Saw Wave | Frequency Range | N/A | Plays saw wave with varying frequencies |
| 10 | Sine Wave | Frequency Range | N/A | Plays sine wave with varying frequencies |
| 11 | Random | Random Range | Pulse PWM Type? | Random output | 
| 12 | Step | Step Size | Pulse PWM Type? | Steps between values |
| 13 | Jump | Jump Size | Pulse PWM Type? | Jumps between values |
